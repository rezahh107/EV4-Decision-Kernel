#!/usr/bin/env node
import { createHmac as nodeCreateHmac } from 'node:crypto';
import { EventEmitter } from 'node:events';
import { readFileSync } from 'node:fs';
import { Agent as HttpsAgent, request as httpsRequest } from 'node:https';
import { performance } from 'node:perf_hooks';
import { Readable } from 'node:stream';
import { URL } from 'node:url';
import {
  createRecoveryCompletionVerifier,
  verifyRecoveryCompletionEvidence,
} from './recovery-completion-verifier-hardened.mjs';
import { recoveryPrimordials as p } from './recovery-primordials.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const API_ORIGIN = 'https://api.github.com';
const API_REPOSITORY_PATH = `/repos/${REPOSITORY}`;
const API_PATH_PREFIX = `${API_REPOSITORY_PATH}/`;
const WORKER_POLICY_ID = 'recovery-completion-production-github-only.v1';
const MAX_INPUT_BYTES = 1024 * 1024;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 15_000;
const trustedHttpsRequest = httpsRequest;
const trustedEventOn = p.uncurryThis(EventEmitter.prototype.on);
const trustedReadableResume = p.uncurryThis(Readable.prototype.resume);
const trustedReadFileSync = readFileSync;
const trustedPerformanceNow = p.bindIntrinsic(performance.now, performance);
const trustedTimeOrigin = performance.timeOrigin;
const trustedNow = () => trustedTimeOrigin + trustedPerformanceNow();
const trustedAgent = new HttpsAgent({ keepAlive: false, maxSockets: 1 });
const hmacProbe = nodeCreateHmac('sha256', p.bufferFrom('probe'));
const hmacPrototype = p.objectGetPrototypeOf(hmacProbe);
const hmacUpdate = p.uncurryThis(hmacPrototype.update);
const hmacDigest = p.uncurryThis(hmacPrototype.digest);
const HEX_64 = /^[0-9a-f]{64}$/;
const REQUEST_KEYS = new p.TrustedSet([
  'schema_version',
  'nonce',
  'binding_sha256',
  'mac_key',
  'token',
  'ledger',
  'task_id',
]);

function canonical(value) {
  if (p.arrayIsArray(value)) return p.arrayMap(value, canonical);
  if (value && typeof value === 'object') {
    const keys = p.objectKeys(value);
    p.arraySort(keys);
    return p.objectFromEntries(p.arrayMap(keys, (key) => [key, canonical(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return p.jsonStringify(canonical(value));
}

function hmacHex(key, value) {
  const hmac = nodeCreateHmac('sha256', key);
  hmacUpdate(hmac, canonicalJson(value));
  return hmacDigest(hmac, 'hex');
}

function assertRequest(value) {
  if (!value || value.schema_version !== 'recovery-isolated-request.v1') throw new p.TrustedError('invalid isolated request schema');
  const keys = p.objectKeys(value);
  if (keys.length !== p.setSize(REQUEST_KEYS)
    || p.arraySome(keys, (key) => !p.setHas(REQUEST_KEYS, key))) {
    throw new p.TrustedError('isolated request contains forbidden transport or loader fields');
  }
  if (typeof value.nonce !== 'string' || !p.regexpTest(HEX_64, value.nonce)) throw new p.TrustedError('invalid isolated nonce');
  if (typeof value.binding_sha256 !== 'string' || !p.regexpTest(HEX_64, value.binding_sha256)) throw new p.TrustedError('invalid isolated binding');
  if (typeof value.mac_key !== 'string' || !value.mac_key) throw new p.TrustedError('invalid isolated MAC key');
  if (typeof value.token !== 'string' || !value.token) throw new p.TrustedError('RECOVERY_GITHUB_TOKEN unavailable');
  if (value.ledger?.repository !== REPOSITORY || value.ledger?.default_branch !== 'main') throw new p.TrustedError('isolated repository boundary mismatch');
  if (!p.arrayIsArray(value.ledger?.tasks) || value.ledger.tasks.length !== 1 || value.ledger.tasks[0]?.task_id !== value.task_id) {
    throw new p.TrustedError('isolated input must contain exactly one bound task');
  }
}

function collectJsonResponse(destination, options) {
  return new p.TrustedPromise((resolve, reject) => {
    let request = null;
    let settled = false;
    const chunks = [];
    let total = 0;
    const transport = {
      response_seen: false,
      ended: false,
      aborted: false,
      closed_before_end: false,
      data_events: 0,
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      if (request) {
        try { request.destroy(); } catch { /* fail closed */ }
      }
      reject(error instanceof p.TrustedError ? error : new p.TrustedError(p.TrustedString(error)));
    };
    try {
      request = trustedHttpsRequest(destination, options, (response) => {
        transport.response_seen = true;
        trustedEventOn(response, 'error', fail);
        trustedEventOn(response, 'aborted', () => {
          transport.aborted = true;
          fail(new p.TrustedError('GitHub evidence response aborted before completion'));
        });
        trustedEventOn(response, 'close', () => {
          if (!transport.ended) {
            transport.closed_before_end = true;
            fail(new p.TrustedError('GitHub evidence response closed before completion'));
          }
        });
        trustedEventOn(response, 'data', (chunk) => {
          if (settled || transport.ended) return;
          transport.data_events += 1;
          const bytes = p.bufferIsBuffer(chunk) ? chunk : p.bufferFrom(chunk);
          total += bytes.length;
          if (total > MAX_RESPONSE_BYTES) {
            fail(new p.TrustedError('GitHub evidence response exceeds bounded capacity'));
            return;
          }
          p.arrayPush(chunks, bytes);
        });
        trustedEventOn(response, 'end', () => {
          if (settled || transport.ended) return;
          transport.ended = true;
          if (transport.aborted || transport.closed_before_end || !transport.response_seen) {
            fail(new p.TrustedError('GitHub evidence response completion state invalid'));
            return;
          }
          const status = response.statusCode ?? 0;
          const raw = p.bufferToString(p.bufferConcat(chunks), 'utf8');
          let payload = null;
          try {
            payload = raw ? p.jsonParse(raw) : null;
          } catch {
            fail(new p.TrustedError(`GitHub API ${status}: invalid JSON response`));
            return;
          }
          const dateHeader = response.headers?.date;
          const responseDate = p.arrayIsArray(dateHeader) ? dateHeader[0] || null : dateHeader || null;
          settled = true;
          resolve({ status, payload, responseDate, transport: p.objectFreeze({ ...transport }) });
        });
        trustedReadableResume(response);
      });
      request.setTimeout(REQUEST_TIMEOUT_MS, () => fail(new p.TrustedError('GitHub evidence request timed out')));
      trustedEventOn(request, 'error', fail);
      request.end();
    } catch (error) {
      fail(error);
    }
  });
}

function buildFetch() {
  return async function isolatedGithubFetch(rawUrl, init = {}) {
    const source = new URL(rawUrl);
    if (source.origin !== API_ORIGIN
      || (source.pathname !== API_REPOSITORY_PATH && !p.stringStartsWith(source.pathname, API_PATH_PREFIX))
      || source.username
      || source.password) {
      throw new p.TrustedError('GitHub evidence endpoint outside trusted repository boundary');
    }
    const response = await collectJsonResponse(source, {
      method: 'GET',
      headers: init.headers,
      setHost: true,
      agent: trustedAgent,
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

function main() {
  const raw = trustedReadFileSync(0);
  if (!p.bufferIsBuffer(raw) || raw.length === 0 || raw.length > MAX_INPUT_BYTES) throw new p.TrustedError('isolated request input missing or oversized');
  const input = p.jsonParse(p.bufferToString(raw, 'utf8'));
  assertRequest(input);
  const session = createRecoveryCompletionVerifier({
    fetchImpl: buildFetch(),
    token: input.token,
    now: trustedNow,
  });
  return verifyRecoveryCompletionEvidence(input.ledger, input.task_id, { session }).then((result) => {
    const signed = {
      schema_version: 'recovery-isolated-result.v1',
      worker_policy_id: WORKER_POLICY_ID,
      transport_origin: API_ORIGIN,
      repository: REPOSITORY,
      fixture_mode: false,
      nonce: input.nonce,
      binding_sha256: input.binding_sha256,
      result,
    };
    const key = p.bufferFrom(input.mac_key, 'base64');
    const envelope = { ...signed, mac: hmacHex(key, signed) };
    process.stdout.write(canonicalJson(envelope));
  });
}

try {
  await main();
} catch (error) {
  process.stderr.write(error && typeof error.message === 'string' ? error.message : 'isolated verifier failure');
  process.exitCode = 1;
}
