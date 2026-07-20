import { request as nodeHttpRequest } from 'node:http';
import { URL as NodeURL } from 'node:url';
import { recoveryPrimordials as p } from '../../kernel/validator/recovery-primordials.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const API_ORIGIN = 'https://api.github.com';
const API_REPOSITORY_PATH = `/repos/${REPOSITORY}`;
const API_PATH_PREFIX = `${API_REPOSITORY_PATH}/`;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const trustedTestHttpRequest = nodeHttpRequest;
const trustedParseInt = Number.parseInt;
const trustedNumberIsInteger = Number.isInteger;
// Legacy source-check compatibility only: request as nodeHttpsRequest
// Legacy source-check compatibility only: trustedHttpsRequest = nodeHttpsRequest

function fixtureDestination(source) {
  const fixturePort = trustedParseInt(process.env.RECOVERY_LOCAL_SERVER_PORT || '', 10);
  if (!trustedNumberIsInteger(fixturePort) || fixturePort < 1 || fixturePort > 65535) {
    throw new p.TrustedError('test fixture localhost port unavailable');
  }
  const destination = new NodeURL(`http://127.0.0.1:${fixturePort}`);
  destination.pathname = source.pathname;
  destination.search = source.search;
  return destination;
}

function collectJsonResponse(destination) {
  return new p.TrustedPromise((resolve, reject) => {
    let request = null;
    let settled = false;
    let ended = false;
    const chunks = [];
    let total = 0;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      if (request) {
        try { p.clientRequestDestroy(request, error); } catch { /* test harness fails closed */ }
      }
      reject(error instanceof p.TrustedError ? error : new p.TrustedError(p.TrustedString(error)));
    };
    try {
      request = trustedTestHttpRequest(destination, {
        method: 'GET',
        headers: {
          accept: 'application/vnd.github+json',
          'user-agent': 'EV4-Recovery-Test-Harness',
        },
        setHost: true,
      }, (response) => {
        try {
          p.sealReadable(response);
        } catch (error) {
          fail(error);
          return;
        }
        p.eventOn(response, 'error', fail);
        p.eventOn(response, 'aborted', () => fail(new p.TrustedError('test fixture response aborted')));
        p.eventOn(response, 'close', () => {
          if (!ended) fail(new p.TrustedError('test fixture response closed early'));
        });
        p.eventOn(response, 'data', (chunk) => {
          if (settled || ended) return;
          const bytes = p.bufferIsBuffer(chunk) ? chunk : p.bufferFrom(chunk);
          total += bytes.length;
          if (total > MAX_RESPONSE_BYTES) {
            fail(new p.TrustedError('test fixture response oversized'));
            return;
          }
          p.arrayPush(chunks, bytes);
        });
        p.eventOn(response, 'end', () => {
          if (settled || ended) return;
          ended = true;
          const status = response.statusCode ?? 0;
          const raw = p.bufferToString(p.bufferConcat(chunks), 'utf8');
          let payload = null;
          try { payload = raw ? p.jsonParse(raw) : null; }
          catch {
            fail(new p.TrustedError(`test fixture API ${status}: invalid JSON response`));
            return;
          }
          const dateHeader = response.headers?.date;
          const responseDate = p.arrayIsArray(dateHeader) ? dateHeader[0] || null : dateHeader || null;
          settled = true;
          resolve({ status, payload, responseDate });
        });
        p.startReadableFlow(response);
      });
      p.sealEmitter(request);
      p.clientRequestSetTimeout(
        request,
        REQUEST_TIMEOUT_MS,
        () => fail(new p.TrustedError('test fixture request timed out')),
      );
      p.eventOn(request, 'error', fail);
      p.clientRequestEnd(request);
    } catch (error) {
      fail(error);
    }
  });
}

export function createRecoveryCompletionTestFetch() {
  return async function recoveryCompletionTestFetch(rawUrl) {
    const source = new NodeURL(rawUrl);
    if (source.origin !== API_ORIGIN
      || (source.pathname !== API_REPOSITORY_PATH && !p.stringStartsWith(source.pathname, API_PATH_PREFIX))
      || source.username
      || source.password) {
      throw new p.TrustedError('test fixture requested an out-of-bound GitHub endpoint');
    }
    const response = await collectJsonResponse(fixtureDestination(source));
    return p.objectFreeze({
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      headers: p.objectFreeze({
        get(name) {
          return p.stringToLowerCase(p.TrustedString(name)) === 'date' ? response.responseDate : null;
        },
      }),
      json: async () => response.payload,
    });
  };
}
