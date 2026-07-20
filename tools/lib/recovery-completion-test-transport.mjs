import { EventEmitter } from 'node:events';
import { request as nodeHttpsRequest } from 'node:https';
import { Readable } from 'node:stream';
import { URL } from 'node:url';
import { recoveryPrimordials as p } from '../../kernel/validator/recovery-primordials.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const API_ORIGIN = 'https://api.github.com';
const API_REPOSITORY_PATH = `/repos/${REPOSITORY}`;
const API_PATH_PREFIX = `${API_REPOSITORY_PATH}/`;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const trustedHttpsRequest = nodeHttpsRequest;
const trustedEventOn = p.uncurryThis(EventEmitter.prototype.on);
const trustedReadableResume = p.uncurryThis(Readable.prototype.resume);

function collectJsonResponse(destination, options) {
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
        try { request.destroy(); } catch { /* test harness fails closed */ }
      }
      reject(error instanceof p.TrustedError ? error : new p.TrustedError(p.TrustedString(error)));
    };
    try {
      request = trustedHttpsRequest(destination, options, (response) => {
        trustedEventOn(response, 'error', fail);
        trustedEventOn(response, 'aborted', () => fail(new p.TrustedError('test fixture response aborted')));
        trustedEventOn(response, 'close', () => {
          if (!ended) fail(new p.TrustedError('test fixture response closed early'));
        });
        trustedEventOn(response, 'data', (chunk) => {
          if (settled || ended) return;
          const bytes = p.bufferIsBuffer(chunk) ? chunk : p.bufferFrom(chunk);
          total += bytes.length;
          if (total > MAX_RESPONSE_BYTES) {
            fail(new p.TrustedError('test fixture response oversized'));
            return;
          }
          p.arrayPush(chunks, bytes);
        });
        trustedEventOn(response, 'end', () => {
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
        trustedReadableResume(response);
      });
      request.setTimeout(REQUEST_TIMEOUT_MS, () => fail(new p.TrustedError('test fixture request timed out')));
      trustedEventOn(request, 'error', fail);
      request.end();
    } catch (error) {
      fail(error);
    }
  });
}

export function createRecoveryCompletionTestFetch() {
  return async function recoveryCompletionTestFetch(rawUrl, init = {}) {
    const source = new URL(rawUrl);
    if (source.origin !== API_ORIGIN
      || (source.pathname !== API_REPOSITORY_PATH && !p.stringStartsWith(source.pathname, API_PATH_PREFIX))
      || source.username
      || source.password) {
      throw new p.TrustedError('test fixture requested an out-of-bound GitHub endpoint');
    }
    const response = await collectJsonResponse(source, {
      method: 'GET',
      headers: init.headers,
      setHost: true,
    });
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
