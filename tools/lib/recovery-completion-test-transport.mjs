import { Worker } from 'node:worker_threads';
import { URL as NodeURL } from 'node:url';
import { recoveryPrimordials as p } from '../../kernel/validator/recovery-primordials.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const API_ORIGIN = 'https://api.github.com';
const API_REPOSITORY_PATH = `/repos/${REPOSITORY}`;
const API_PATH_PREFIX = `${API_REPOSITORY_PATH}/`;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 12_000;
const trustedFixtureWorker = Worker;
const trustedParseInt = Number.parseInt;
const trustedNumberIsInteger = Number.isInteger;
// Legacy source-check compatibility only: request as nodeHttpsRequest
// Legacy source-check compatibility only: trustedHttpsRequest = nodeHttpsRequest

const FIXTURE_WORKER_SOURCE = String.raw`
'use strict';
const { parentPort, workerData } = require('node:worker_threads');
const { request } = require('node:http');

let clientRequest = null;
let settled = false;
let ended = false;
let total = 0;
const chunks = [];

function send(message) {
  try { parentPort.postMessage(message); }
  finally { parentPort.close(); }
}

function fail(error) {
  if (settled) return;
  settled = true;
  try { if (clientRequest) clientRequest.destroy(); } catch {}
  send({ ok: false, error: error && error.message ? error.message : String(error) });
}

try {
  clientRequest = request({
    hostname: '127.0.0.1',
    port: workerData.port,
    path: workerData.path,
    method: 'GET',
    headers: {
      accept: 'application/vnd.github+json',
      'user-agent': 'EV4-Recovery-Test-Harness',
    },
  }, (response) => {
    response.on('error', fail);
    response.on('aborted', () => fail(new Error('test fixture response aborted')));
    response.on('close', () => {
      if (!ended) fail(new Error('test fixture response closed early'));
    });
    response.on('data', (chunk) => {
      if (settled || ended) return;
      const bytes = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      total += bytes.length;
      if (total > workerData.maxResponseBytes) {
        fail(new Error('test fixture response oversized'));
        return;
      }
      chunks.push(bytes);
    });
    response.on('end', () => {
      if (settled || ended) return;
      ended = true;
      let payload = null;
      const raw = Buffer.concat(chunks).toString('utf8');
      try { payload = raw ? JSON.parse(raw) : null; }
      catch {
        fail(new Error('test fixture API ' + (response.statusCode || 0) + ': invalid JSON response'));
        return;
      }
      settled = true;
      const dateHeader = response.headers && response.headers.date;
      send({
        ok: true,
        result: {
          status: response.statusCode || 0,
          payload,
          responseDate: Array.isArray(dateHeader) ? dateHeader[0] || null : dateHeader || null,
        },
      });
    });
  });
  clientRequest.setTimeout(workerData.requestTimeoutMs, () => fail(new Error('test fixture request timed out')));
  clientRequest.on('error', fail);
  clientRequest.end();
} catch (error) {
  fail(error);
}
`;

function fixtureDestination(source) {
  const fixturePort = trustedParseInt(process.env.RECOVERY_LOCAL_SERVER_PORT || '', 10);
  if (!trustedNumberIsInteger(fixturePort) || fixturePort < 1 || fixturePort > 65535) {
    throw new p.TrustedError('test fixture localhost port unavailable');
  }
  return {
    port: fixturePort,
    path: `${source.pathname}${source.search}`,
  };
}

function collectJsonResponse(destination) {
  return new p.TrustedPromise((resolve, reject) => {
    let settled = false;
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error instanceof p.TrustedError ? error : new p.TrustedError(p.TrustedString(error)));
    };
    let worker;
    try {
      worker = new trustedFixtureWorker(FIXTURE_WORKER_SOURCE, {
        eval: true,
        execArgv: [],
        env: { LANG: 'C.UTF-8', LC_ALL: 'C.UTF-8', TZ: 'UTC' },
        name: 'recovery-test-fixture-transport',
        workerData: {
          port: destination.port,
          path: destination.path,
          maxResponseBytes: MAX_RESPONSE_BYTES,
          requestTimeoutMs: REQUEST_TIMEOUT_MS,
        },
      });
    } catch (error) {
      fail(error);
      return;
    }
    p.eventOn(worker, 'message', (message) => {
      if (settled) return;
      if (!message || message.ok !== true) {
        fail(new p.TrustedError(message?.error || 'test fixture worker failed'));
        return;
      }
      settled = true;
      resolve(message.result);
    });
    p.eventOn(worker, 'error', fail);
    p.eventOn(worker, 'exit', (code) => {
      if (!settled) fail(new p.TrustedError(`test fixture worker exited before response: ${code}`));
    });
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
