import {
  createRecoveryCompletionVerifier,
  recoveryCompletionBinding,
  recoveryVerifiedEvidenceMatches,
  verifyRecoveryCompletionEvidence,
} from '../../kernel/validator/recovery-completion-verifier-hardened.mjs';
import { recoveryPrimordials as p } from '../../kernel/validator/recovery-primordials.mjs';
import { createRecoveryCompletionTestFetch } from './recovery-completion-test-transport.mjs';

const TEST_POLICY_ID = 'recovery-completion-test-fixture-only.v1';
const TEST_RESULT_SCHEMA = 'recovery-completion-test-harness-result.v1';
const MUTATION_OBSERVATION_DELAY_MS = 20;
const TEST_SESSIONS = new p.TrustedWeakMap();
const TEST_CAPABILITIES = new p.TrustedWeakSet();
const TEST_CAPABILITY_STATE = new p.TrustedWeakMap();

function diagnostic(taskPath, diagnosticId, observed) {
  return {
    diagnostic_id: diagnosticId,
    severity: 'error',
    path: `${taskPath}/completion_evidence`,
    expected: diagnosticId === 'RECOVERY_LEDGER_COMPLETION_INPUT_MUTATED'
      ? 'immutable completion input binding'
      : 'complete test-only synthetic evidence result',
    observed,
    remediation: 'Repair the test-only fixture harness; never route its result into the production capability registry.',
  };
}

function bindingSha(ledger, task) {
  return p.canonicalSha256(recoveryCompletionBinding(ledger, task));
}

export function createRecoveryCompletionTestAuthority({ token, now } = {}) {
  const session = p.objectFreeze({ verifier_type: 'recovery-completion-test-authority.v1' });
  p.weakMapSet(TEST_SESSIONS, session, p.objectFreeze({
    token: typeof token === 'string' && token ? token : null,
    now: typeof now === 'function' ? now : p.dateNow,
  }));
  return session;
}

export function isRecoveryCompletionTestCapability(value) {
  return p.TrustedBoolean(value && p.weakSetHas(TEST_CAPABILITIES, value));
}

export function recoveryCompletionTestCapabilityMatches(value, ledger, task) {
  const state = value && p.weakMapGet(TEST_CAPABILITY_STATE, value);
  return p.TrustedBoolean(state
    && state.taskId === task?.task_id
    && state.bindingSha256 === bindingSha(ledger, task));
}

async function verifyOne(ledger, taskId, state) {
  const tasks = p.arrayIsArray(ledger?.tasks) ? ledger.tasks : [];
  const taskIndex = p.arrayFindIndex(tasks, (item) => item?.task_id === taskId);
  const task = taskIndex >= 0 ? tasks[taskIndex] : null;
  const taskPath = taskIndex >= 0 ? `/tasks/${taskIndex}` : '/tasks';
  if (!task || !state.token) {
    return { evidence: null, diagnostics: [diagnostic(taskPath, 'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE', 'test fixture session unavailable')] };
  }
  const expectedBinding = bindingSha(ledger, task);
  const snapshot = p.jsonParse(p.jsonStringify({
    schema_version: ledger?.schema_version,
    repository: ledger?.repository,
    default_branch: ledger?.default_branch,
    program_id: ledger?.program_id,
    tasks: [task],
  }));
  await new p.TrustedPromise((resolve) => setTimeout(resolve, MUTATION_OBSERVATION_DELAY_MS));
  try {
    const verifier = createRecoveryCompletionVerifier({
      fetchImpl: createRecoveryCompletionTestFetch(),
      token: state.token,
      now: state.now,
    });
    const result = await verifyRecoveryCompletionEvidence(snapshot, taskId, { session: verifier });
    const currentTask = p.arrayFind(ledger?.tasks || [], (item) => item?.task_id === taskId);
    const observedBinding = currentTask ? bindingSha(ledger, currentTask) : null;
    if (observedBinding !== expectedBinding
      || (result.evidence && result.evidence.binding_sha256 !== expectedBinding)) {
      return {
        evidence: null,
        diagnostics: [diagnostic(taskPath, 'RECOVERY_LEDGER_COMPLETION_INPUT_MUTATED', observedBinding)],
      };
    }
    return result;
  } catch (error) {
    return {
      evidence: null,
      diagnostics: [diagnostic(taskPath, 'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE', error?.message || 'test fixture failure')],
    };
  }
}

export async function fetchRecoveryCompletionTestCapabilities(ledger, { session } = {}) {
  const state = p.weakMapGet(TEST_SESSIONS, session);
  const capabilities = new p.TrustedMap();
  const diagnostics = [];
  if (!state) {
    p.arrayPush(diagnostics, diagnostic('/tasks', 'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE', 'test authority session unavailable'));
    return { schema_version: TEST_RESULT_SCHEMA, worker_policy_id: TEST_POLICY_ID, capabilities, diagnostics };
  }
  const initialTasks = p.arrayIsArray(ledger?.tasks) ? p.arrayMap(ledger.tasks, (item) => item) : [];
  for (let index = 0; index < initialTasks.length; index += 1) {
    const task = initialTasks[index];
    if (task?.lifecycle_state !== 'complete') continue;
    const result = await verifyOne(ledger, task.task_id, state);
    for (let diagnosticIndex = 0; diagnosticIndex < result.diagnostics.length; diagnosticIndex += 1) {
      p.arrayPush(diagnostics, result.diagnostics[diagnosticIndex]);
    }
    const currentTask = p.arrayFind(ledger?.tasks || [], (item) => item?.task_id === task.task_id);
    if (!result.evidence || !currentTask) continue;
    if (!recoveryVerifiedEvidenceMatches(result.evidence, ledger, currentTask, state.now())) continue;
    const capability = p.objectFreeze(p.objectCreate(null));
    p.weakSetAdd(TEST_CAPABILITIES, capability);
    p.weakMapSet(TEST_CAPABILITY_STATE, capability, p.objectFreeze({
      taskId: currentTask.task_id,
      bindingSha256: bindingSha(ledger, currentTask),
    }));
    p.mapSet(capabilities, currentTask.task_id, capability);
  }
  return {
    schema_version: TEST_RESULT_SCHEMA,
    worker_policy_id: TEST_POLICY_ID,
    fixture_mode: true,
    capabilities,
    diagnostics,
  };
}
