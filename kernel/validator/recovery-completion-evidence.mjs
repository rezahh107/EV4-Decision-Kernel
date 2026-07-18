import { createHash as nodeCreateHash } from 'node:crypto';
import { Agent as nodeHttpsAgent, request as nodeHttpsRequest } from 'node:https';
import { performance as nodePerformance } from 'node:perf_hooks';
import { connect as nodeTlsConnect } from 'node:tls';
import {
  createRecoveryCompletionVerifier,
  recoveryCompletionBinding,
  recoveryVerifiedEvidenceMatches,
  verifyRecoveryCompletionEvidence,
} from './recovery-completion-verifier.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const DEFAULT_BRANCH = 'main';
const API_ORIGIN = 'https://api.github.com';
const API_PATH_PREFIX = `/repos/${REPOSITORY}/`;
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;
const VERIFIED_COMPLETIONS = new WeakSet();
const COMPLETION_STATE = new WeakMap();

// Capture production authorities once. Later mutation of globals or environment
// cannot redirect transport, freeze time, or replace the workflow credential.
const trustedDateParse = globalThis.Date.parse.bind(globalThis.Date);
const trustedHttpsRequest = nodeHttpsRequest;
const trustedTlsConnect = nodeTlsConnect;
const trustedCreateHash = nodeCreateHash;
const trustedPerformanceNow = nodePerformance.now.bind(nodePerformance);
const trustedTimeOrigin = nodePerformance.timeOrigin;
const trustedToken = typeof process.env.RECOVERY_GITHUB_TOKEN === 'string'
  && process.env.RECOVERY_GITHUB_TOKEN.length > 0
  ? process.env.RECOVERY_GITHUB_TOKEN
  : null;
const trustedNow = () => trustedTimeOrigin + trustedPerformanceNow();
const trustedAgent = new nodeHttpsAgent({ keepAlive: true });
Object.defineProperty(trustedAgent, 'createConnection', {
  value(options, callback) {
    return trustedTlsConnect(options, callback);
  },
  writable: false,
  configurable: false,
  enumerable: false,
});

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const bindingSha = (ledger, task) => trustedCreateHash('sha256')
  .update(JSON.stringify(canonical(recoveryCompletionBinding(ledger, task))))
  .digest('hex');

function trustedGithubFetch(input, init = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(input);
    if (url.origin !== API_ORIGIN
      || !url.pathname.startsWith(API_PATH_PREFIX)
      || url.username
      || url.password) {
      reject(new Error('GitHub evidence endpoint outside trusted repository boundary'));
      return;
    }
    const request = trustedHttpsRequest(url, {
      method: 'GET',
      headers: init.headers,
      setHost: true,
      agent: trustedAgent,
    }, (response) => {
      const chunks = [];
      let size = 0;
      response.on('data', (chunk) => {
        size += chunk.length;
        if (size > MAX_RESPONSE_BYTES) {
          request.destroy(new Error('GitHub evidence response exceeds bounded capacity'));
          return;
        }
        chunks.push(chunk);
      });
      response.on('end', () => {
        const status = response.statusCode ?? 0;
        const body = Buffer.concat(chunks).toString('utf8');
        let payload = null;
        try {
          payload = body ? JSON.parse(body) : null;
        } catch {
          reject(new Error(`GitHub API ${status}: invalid JSON response`));
          return;
        }
        resolve({
          ok: status >= 200 && status < 300,
          status,
          headers: {
            get(name) {
              if (String(name).toLowerCase() !== 'date') return null;
              const value = response.headers.date;
              return Array.isArray(value) ? value[0] || null : value || null;
            },
          },
          json: async () => payload,
        });
      });
    });
    request.setTimeout(15_000, () => request.destroy(new Error('GitHub evidence request timed out')));
    request.on('error', reject);
    request.end();
  });
}

function mintCapability(ledger, task, evidence) {
  const expiresAt = trustedDateParse(evidence?.expires_at || '');
  if (!recoveryVerifiedEvidenceMatches(evidence, ledger, task, trustedNow())
    || !Number.isFinite(expiresAt)) {
    throw new Error('Verified completion evidence expired before authority minting');
  }
  const capability = Object.freeze({
    capability_type: 'recovery-completion-capability.v1',
    repository: evidence.repository,
    repository_id: evidence.repository_id,
    default_branch: evidence.default_branch,
    task_id: evidence.task_id,
    pull_request: evidence.pull_request,
    reviewed_head_sha: evidence.reviewed_head_sha,
    resulting_main_sha: evidence.resulting_main_sha,
    exact_head_run_id: evidence.exact_head_run_id,
    current_main_run_id: evidence.current_main_run_id,
    exact_head_workflow_source: evidence.exact_head_workflow_source,
    current_main_workflow_source: evidence.current_main_workflow_source,
    observed_at: evidence.observed_at,
    expires_at: evidence.expires_at,
    merge_method: evidence.merge_method,
    binding_sha256: evidence.binding_sha256,
  });
  VERIFIED_COMPLETIONS.add(capability);
  COMPLETION_STATE.set(capability, { expiresAt });
  return capability;
}

export function isRecoveryCompletionCapability(value) {
  if (!value || !VERIFIED_COMPLETIONS.has(value)) return false;
  const state = COMPLETION_STATE.get(value);
  if (!state || !Number.isFinite(state.expiresAt) || trustedNow() >= state.expiresAt) {
    VERIFIED_COMPLETIONS.delete(value);
    COMPLETION_STATE.delete(value);
    return false;
  }
  return true;
}

export function recoveryCompletionCapabilityMatches(value, ledger, task) {
  const completion = task?.completion_evidence;
  return isRecoveryCompletionCapability(value)
    && value.repository === REPOSITORY
    && value.repository_id === REPOSITORY_ID
    && value.default_branch === DEFAULT_BRANCH
    && value.task_id === task?.task_id
    && value.pull_request === completion?.pull_request
    && value.reviewed_head_sha === completion?.reviewed_head_sha
    && value.resulting_main_sha === completion?.resulting_main_sha
    && value.exact_head_run_id === completion?.exact_head_ci?.run_id
    && value.current_main_run_id === completion?.current_main_validation?.run_id
    && value.merge_method === completion?.merge_method
    && value.binding_sha256 === bindingSha(ledger, task);
}

export async function fetchRecoveryCompletionCapabilities(ledger, ...unknownArguments) {
  if (unknownArguments.length) {
    throw new TypeError('RECOVERY_COMPLETION_PRODUCTION_OPTIONS_FORBIDDEN');
  }
  const capabilities = new Map();
  const diagnostics = [];
  const verifier = createRecoveryCompletionVerifier({
    fetchImpl: trustedGithubFetch,
    token: trustedToken,
    now: trustedNow,
  });
  const initialTasks = Array.isArray(ledger?.tasks) ? [...ledger.tasks] : [];
  for (let taskIndex = 0; taskIndex < initialTasks.length; taskIndex += 1) {
    const task = initialTasks[taskIndex];
    if (task?.lifecycle_state !== 'complete') continue;
    const taskId = task.task_id;
    const expectedBindingSha = bindingSha(ledger, task);
    const result = await verifyRecoveryCompletionEvidence(ledger, taskId, { session: verifier });
    diagnostics.push(...result.diagnostics);
    const currentTask = Array.isArray(ledger?.tasks)
      ? ledger.tasks.find((item) => item?.task_id === taskId)
      : null;
    const observedBindingSha = currentTask ? bindingSha(ledger, currentTask) : null;
    if (observedBindingSha !== expectedBindingSha
      || (result.evidence && result.evidence.binding_sha256 !== expectedBindingSha)) {
      if (!result.diagnostics.some(
        (item) => item.diagnostic_id === 'RECOVERY_LEDGER_COMPLETION_INPUT_MUTATED',
      )) {
        diagnostics.push({
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
    if (result.evidence) capabilities.set(taskId, mintCapability(ledger, currentTask, result.evidence));
  }
  return { capabilities, diagnostics };
}
