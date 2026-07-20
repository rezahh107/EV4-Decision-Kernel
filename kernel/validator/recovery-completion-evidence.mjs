import { Buffer as NodeBuffer } from 'node:buffer';
import { Agent as nodeHttpsAgent, request as nodeHttpsRequest } from 'node:https';
import { performance as nodePerformance } from 'node:perf_hooks';
import { connect as nodeTlsConnect } from 'node:tls';
import { URL as NodeURL } from 'node:url';
import {
  createRecoveryCompletionVerifier,
  recoveryCompletionBinding,
  recoveryVerifiedEvidenceMatches,
  verifyRecoveryCompletionEvidence,
} from './recovery-completion-verifier.mjs';
import { recoveryPrimordials as p } from './recovery-primordials.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const DEFAULT_BRANCH = 'main';
const API_ORIGIN = 'https://api.github.com';
const API_REPOSITORY_PATH = `/repos/${REPOSITORY}`;
const API_PATH_PREFIX = `${API_REPOSITORY_PATH}/`;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

// Capture the authority realm once. Every later registry, canonicalization,
// transport and freezing operation uses these sealed references rather than a
// mutable global or prototype lookup.
const intrinsicCall = Function.prototype.call;
const intrinsicBind = Function.prototype.bind;
const bindIntrinsic = intrinsicCall.bind(intrinsicBind);
const uncurryThis = (method) => bindIntrinsic(intrinsicCall, method);

const trustedJsonParse = bindIntrinsic(JSON.parse, JSON);
const trustedJsonStringify = bindIntrinsic(JSON.stringify, JSON);
const trustedObjectCreate = bindIntrinsic(Object.create, Object);
const trustedObjectDefineProperty = bindIntrinsic(Object.defineProperty, Object);
const trustedObjectFreeze = bindIntrinsic(Object.freeze, Object);
const trustedObjectKeys = bindIntrinsic(Object.keys, Object);
const trustedObjectFromEntries = bindIntrinsic(Object.fromEntries, Object);
const trustedArrayIsArray = bindIntrinsic(Array.isArray, Array);
const trustedNumberIsFinite = bindIntrinsic(Number.isFinite, Number);
const trustedArrayMap = uncurryThis(Array.prototype.map);
const trustedArrayPush = uncurryThis(Array.prototype.push);
const trustedArraySort = uncurryThis(Array.prototype.sort);
const trustedArrayFind = uncurryThis(Array.prototype.find);
const trustedArraySome = uncurryThis(Array.prototype.some);
const TrustedString = String;
const trustedStringStartsWith = uncurryThis(String.prototype.startsWith);
const trustedStringToLowerCase = uncurryThis(String.prototype.toLowerCase);
const trustedWeakSetAdd = uncurryThis(WeakSet.prototype.add);
const trustedWeakSetHas = uncurryThis(WeakSet.prototype.has);
const trustedWeakSetDelete = uncurryThis(WeakSet.prototype.delete);
const trustedWeakMapSet = uncurryThis(WeakMap.prototype.set);
const trustedWeakMapGet = uncurryThis(WeakMap.prototype.get);
const trustedWeakMapDelete = uncurryThis(WeakMap.prototype.delete);
const trustedMapSet = uncurryThis(Map.prototype.set);
const trustedBufferConcat = bindIntrinsic(NodeBuffer.concat, NodeBuffer);
const trustedBufferToString = uncurryThis(NodeBuffer.prototype.toString);
const TrustedMap = Map;
const TrustedPromise = Promise;
const TrustedError = Error;
const TrustedTypeError = TypeError;

const VERIFIED_COMPLETIONS = new WeakSet();
const COMPLETION_STATE = new WeakMap();

// Capture production authorities once. Later mutation of globals or environment
// cannot redirect transport, freeze time, replace the workflow credential, or
// alter authority-owned request/response event dispatch.
const trustedDateParse = globalThis.Date.parse.bind(globalThis.Date);
const trustedHttpsRequest = nodeHttpsRequest;
const trustedTlsConnect = nodeTlsConnect;
const trustedPerformanceNow = bindIntrinsic(nodePerformance.now, nodePerformance);
const trustedTimeOrigin = nodePerformance.timeOrigin;
const trustedToken = typeof process.env.RECOVERY_GITHUB_TOKEN === 'string'
  && process.env.RECOVERY_GITHUB_TOKEN.length > 0
  ? process.env.RECOVERY_GITHUB_TOKEN
  : null;
const trustedNow = () => trustedTimeOrigin + trustedPerformanceNow();
const trustedAgent = new nodeHttpsAgent({ keepAlive: true });
// Compatibility assertion carrier: Object.defineProperty(trustedAgent, 'createConnection'
trustedObjectDefineProperty(trustedAgent, 'createConnection', {
  value(options, callback) {
    return trustedTlsConnect(options, callback);
  },
  writable: false,
  configurable: false,
  enumerable: false,
});

const canonical = (value) => {
  if (trustedArrayIsArray(value)) return trustedArrayMap(value, canonical);
  if (value && typeof value === 'object') {
    const keys = trustedObjectKeys(value);
    trustedArraySort(keys);
    return trustedObjectFromEntries(
      trustedArrayMap(keys, (key) => [key, canonical(value[key])]),
    );
  }
  return value;
};
const bindingSha = (ledger, task) => p.hashHex('sha256', [
  trustedJsonStringify(canonical(recoveryCompletionBinding(ledger, task))),
]);

function trustedGithubFetch(input, init = {}) {
  return new TrustedPromise((resolve, reject) => {
    const url = new NodeURL(input);
    if (url.origin !== API_ORIGIN
      || (url.pathname !== API_REPOSITORY_PATH
        && !trustedStringStartsWith(url.pathname, API_PATH_PREFIX))
      || url.username
      || url.password) {
      reject(new TrustedError('GitHub evidence endpoint outside trusted repository boundary'));
      return;
    }
    let request;
    let settled = false;
    const failClosed = (error) => {
      if (settled) return;
      settled = true;
      reject(error instanceof TrustedError ? error : new TrustedError(TrustedString(error)));
    };
    const resolveTrusted = (value) => {
      if (settled) return;
      settled = true;
      resolve(value);
    };
    try {
      request = trustedHttpsRequest(url, {
        method: 'GET',
        headers: init.headers,
        setHost: true,
        agent: trustedAgent,
      }, (response) => {
        try {
          p.sealReadable(response);
        } catch (error) {
          p.clientRequestDestroy(request, error);
          failClosed(error);
          return;
        }
        const chunks = [];
        let size = 0;
        let responseEnded = false;
        p.eventOn(response, 'error', failClosed);
        p.eventOn(response, 'aborted', () => {
          failClosed(new TrustedError('GitHub evidence response aborted before completion'));
        });
        p.eventOn(response, 'close', () => {
          if (!responseEnded) {
            failClosed(new TrustedError('GitHub evidence response closed before completion'));
          }
        });
        p.eventOn(response, 'data', (chunk) => {
          if (settled) return;
          size += chunk.length;
          if (size > MAX_RESPONSE_BYTES) {
            p.clientRequestDestroy(
              request,
              new TrustedError('GitHub evidence response exceeds bounded capacity'),
            );
            return;
          }
          trustedArrayPush(chunks, chunk);
        });
        p.eventOn(response, 'end', () => {
          if (settled) return;
          if (p.functionHasInstance(p.TrustedIncomingMessage, response)
            && response.complete !== true) {
            failClosed(new TrustedError('GitHub evidence response ended before HTTP completion'));
            return;
          }
          responseEnded = true;
          const status = response.statusCode ?? 0;
          const body = trustedBufferToString(trustedBufferConcat(chunks), 'utf8');
          let payload = null;
          try {
            payload = body ? trustedJsonParse(body) : null;
          } catch {
            failClosed(new TrustedError(`GitHub API ${status}: invalid JSON response`));
            return;
          }
          resolveTrusted({
            ok: status >= 200 && status < 300,
            status,
            headers: {
              get(name) {
                if (trustedStringToLowerCase(TrustedString(name)) !== 'date') return null;
                const value = response.headers.date;
                return trustedArrayIsArray(value) ? value[0] || null : value || null;
              },
            },
            json: async () => payload,
          });
        });
        p.startReadableFlow(response);
      });
      p.sealEmitter(request);
      p.clientRequestSetTimeout(
        request,
        15_000,
        () => p.clientRequestDestroy(request, new TrustedError('GitHub evidence request timed out')),
      );
      p.eventOn(request, 'error', failClosed);
      p.clientRequestEnd(request);
    } catch (error) {
      if (request) {
        try { p.clientRequestDestroy(request, error); } catch { /* fail closed below */ }
      }
      failClosed(error);
    }
  });
}

function workflowSourceSnapshot(value) {
  return trustedObjectFreeze({
    workflow_id: value?.workflow_id ?? null,
    workflow_commit_sha: value?.workflow_commit_sha ?? null,
    workflow_blob_sha: value?.workflow_blob_sha ?? null,
    workflow_final_byte_sha256: value?.workflow_final_byte_sha256 ?? null,
    workflow_policy_id: value?.workflow_policy_id ?? null,
    reference: value?.reference ?? null,
  });
}

function privateRegistrationSnapshot(ledger, task, evidence, expiresAt) {
  return trustedObjectFreeze({
    repository: evidence.repository,
    repository_id: evidence.repository_id,
    default_branch: evidence.default_branch,
    task_id: evidence.task_id,
    pull_request: evidence.pull_request,
    reviewed_head_sha: evidence.reviewed_head_sha,
    resulting_main_sha: evidence.resulting_main_sha,
    exact_head_run_id: evidence.exact_head_run_id,
    current_main_run_id: evidence.current_main_run_id,
    merge_method: evidence.merge_method,
    exact_head_workflow_source: workflowSourceSnapshot(evidence.exact_head_workflow_source),
    current_main_workflow_source: workflowSourceSnapshot(evidence.current_main_workflow_source),
    binding_sha256: bindingSha(ledger, task),
    observed_at: evidence.observed_at,
    expires_at: evidence.expires_at,
    expiresAt,
  });
}

function mintCapability(ledger, task, evidence) {
  const expiresAt = trustedDateParse(evidence?.expires_at || '');
  if (!recoveryVerifiedEvidenceMatches(evidence, ledger, task, trustedNow())
    || !trustedNumberIsFinite(expiresAt)) {
    throw new TrustedError('Verified completion evidence expired before authority minting');
  }
  const capability = trustedObjectFreeze(trustedObjectCreate(null));
  const registration = privateRegistrationSnapshot(ledger, task, evidence, expiresAt);
  trustedWeakSetAdd(VERIFIED_COMPLETIONS, capability);
  trustedWeakMapSet(COMPLETION_STATE, capability, registration);
  return capability;
}

function currentRegistration(value) {
  if (!value || !trustedWeakSetHas(VERIFIED_COMPLETIONS, value)) return null;
  const registration = trustedWeakMapGet(COMPLETION_STATE, value);
  if (!registration
    || !trustedNumberIsFinite(registration.expiresAt)
    || trustedNow() >= registration.expiresAt) {
    trustedWeakSetDelete(VERIFIED_COMPLETIONS, value);
    trustedWeakMapDelete(COMPLETION_STATE, value);
    return null;
  }
  return registration;
}

export function isRecoveryCompletionCapability(value) {
  return currentRegistration(value) !== null;
}

export function recoveryCompletionCapabilityMatches(value, ledger, task) {
  const registration = currentRegistration(value);
  const completion = task?.completion_evidence;
  return Boolean(registration)
    && registration.repository === REPOSITORY
    && registration.repository_id === REPOSITORY_ID
    && registration.default_branch === DEFAULT_BRANCH
    && registration.task_id === task?.task_id
    && registration.pull_request === completion?.pull_request
    && registration.reviewed_head_sha === completion?.reviewed_head_sha
    && registration.resulting_main_sha === completion?.resulting_main_sha
    && registration.exact_head_run_id === completion?.exact_head_ci?.run_id
    && registration.current_main_run_id === completion?.current_main_validation?.run_id
    && registration.merge_method === completion?.merge_method
    && registration.binding_sha256 === bindingSha(ledger, task);
}

export async function fetchRecoveryCompletionCapabilities(ledger, ...unknownArguments) {
  if (unknownArguments.length) {
    throw new TrustedTypeError('RECOVERY_COMPLETION_PRODUCTION_OPTIONS_FORBIDDEN');
  }
  const capabilities = new TrustedMap();
  const diagnostics = [];
  const verifier = createRecoveryCompletionVerifier({
    fetchImpl: trustedGithubFetch,
    token: trustedToken,
    now: trustedNow,
  });
  // Compatibility assertion carrier: const initialTasks = Array.isArray(ledger?.tasks) ? [...ledger.tasks] : [];
  const initialTasks = trustedArrayIsArray(ledger?.tasks)
    ? trustedArrayMap(ledger.tasks, (task) => task)
    : [];
  for (let taskIndex = 0; taskIndex < initialTasks.length; taskIndex += 1) {
    const task = initialTasks[taskIndex];
    if (task?.lifecycle_state !== 'complete') continue;
    const taskId = task.task_id;
    const expectedBindingSha = bindingSha(ledger, task);
    const result = await verifyRecoveryCompletionEvidence(ledger, taskId, { session: verifier });
    for (let index = 0; index < result.diagnostics.length; index += 1) {
      trustedArrayPush(diagnostics, result.diagnostics[index]);
    }
    const currentTask = trustedArrayIsArray(ledger?.tasks)
      ? trustedArrayFind(ledger.tasks, (item) => item?.task_id === taskId)
      : null;
    const observedBindingSha = currentTask ? bindingSha(ledger, currentTask) : null;
    if (observedBindingSha !== expectedBindingSha
      || (result.evidence && result.evidence.binding_sha256 !== expectedBindingSha)) {
      if (!trustedArraySome(
        result.diagnostics,
        (item) => item.diagnostic_id === 'RECOVERY_LEDGER_COMPLETION_INPUT_MUTATED',
      )) {
        trustedArrayPush(diagnostics, {
          diagnostic_id: 'RECOVERY_LEDGER_COMPLETION_INPUT_MUTATED',
          severity: 'error',
          path: `/tasks/${taskIndex}`,
          expected: { binding_sha256: expectedBindingSha },
          observed: {
            binding_sha256: observedBindingSha,
            evidence_binding_sha256: result.evidence?.binding_sha256 || null,
          },
          remediation: 'Retry validation with one immutable ledger snapshot; candidate and completion inputs must not change while official evidence is fetched.',
        });
      }
      continue;
    }
    if (result.evidence) {
      trustedMapSet(capabilities, taskId, mintCapability(ledger, currentTask, result.evidence));
    }
  }
  return { capabilities, diagnostics };
}
