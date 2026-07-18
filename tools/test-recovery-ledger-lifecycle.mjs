#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import {
  applyFixturePatch,
  fixtureExpectationPass,
  recoveryLedgerDiagnostics,
  recoveryLedgerHistoryDiagnostics,
  repositoryCompletionDiagnostics,
  validateRecoveryLedgerDocument,
} from '../kernel/validator/validate-recovery-ledger.mjs';
import {
  fetchRecoveryCompletionCapability,
  isRecoveryCompletionCapability,
} from '../kernel/validator/recovery-completion-evidence.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const BASE = '1111111111111111111111111111111111111111';
const HEAD = '2222222222222222222222222222222222222222';
const MAIN = '3333333333333333333333333333333333333333';
const TREE = '4444444444444444444444444444444444444444';
const EXACT_RUN = 1001;
const MAIN_RUN = 1002;
const EXACT_JOB = 2001;
const MAIN_JOB = 2002;
const OBSERVED_AT = '2026-07-18T10:30:00.000Z';
const MERGED_AT = '2026-07-18T10:10:00.000Z';
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const ledger = read('planning/recovery/recovery-ledger.v1.json');
const program = read('planning/recovery/recovery-execution-program.v1.json');
const schema = read('kernel/schemas/recovery-ledger.v1.schema.json');
const validFixtures = read('kernel/fixtures/recovery-ledger/valid/cases.json');
const clone = (value) => structuredClone(value);
const cases = [];
const record = (name, pass, diagnostics = []) => cases.push({
  name,
  pass: Boolean(pass),
  diagnostic_ids: diagnostics.map((item) => item.diagnostic_id),
});
const ids = (diagnostics) => diagnostics.map((item) => item.diagnostic_id);
const has = (diagnostics, diagnosticId) => ids(diagnostics).includes(diagnosticId);

function completedLedger() {
  const value = clone(ledger);
  value.tasks[0].lifecycle_state = 'complete';
  value.tasks[0].execution_eligibility = 'complete';
  value.tasks[0].candidate = {
    branch: 'krec-001/recovery-ledger',
    pull_request: 52,
    pr_state: 'merged',
  };
  value.tasks[0].completion_evidence = {
    pull_request: 52,
    reviewed_head_sha: HEAD,
    merge_method: 'merge',
    merge_actor: 'rezahh107',
    resulting_main_sha: MAIN,
    exact_head_ci: {
      workflow: 'Validate MVK',
      run_id: EXACT_RUN,
      head_sha: HEAD,
      conclusion: 'success',
      reference: `https://github.com/${REPOSITORY}/actions/runs/${EXACT_RUN}`,
    },
    current_main_validation: {
      workflow: 'Validate Main',
      run_id: MAIN_RUN,
      head_sha: MAIN,
      conclusion: 'success',
      reference: `https://github.com/${REPOSITORY}/actions/runs/${MAIN_RUN}`,
    },
    evidence_refs: [
      {
        kind: 'authoritative_owner_merge',
        reference: `https://github.com/${REPOSITORY}/pull/52`,
      },
      {
        kind: 'authoritative_exact_head_ci',
        reference: `https://github.com/${REPOSITORY}/actions/runs/${EXACT_RUN}`,
      },
      {
        kind: 'authoritative_current_main_validation',
        reference: `https://github.com/${REPOSITORY}/actions/runs/${MAIN_RUN}`,
      },
    ],
  };
  value.tasks[1].execution_eligibility = 'dependency_ready';
  value.tasks[3].execution_eligibility = 'dependency_ready';
  return value;
}

function actionRun({ id, workflowId, name, path, event, headSha, completedAt, jobId }) {
  return {
    id,
    workflow_id: workflowId,
    run_attempt: 1,
    name,
    path,
    event,
    head_sha: headSha,
    head_branch: event === 'push' ? 'main' : 'krec-001/recovery-ledger',
    status: 'completed',
    conclusion: 'success',
    updated_at: completedAt,
    html_url: `https://github.com/${REPOSITORY}/actions/runs/${id}`,
    repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
    head_repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
    pull_requests: event === 'pull_request' ? [{ number: 52, head: { sha: headSha }, base: { ref: 'main' } }] : [],
    _job_id: jobId,
  };
}

function officialState() {
  const exactRun = actionRun({
    id: EXACT_RUN,
    workflowId: 501,
    name: 'Validate MVK',
    path: '.github/workflows/validate-mvk.yml',
    event: 'pull_request',
    headSha: HEAD,
    completedAt: '2026-07-18T10:05:00.000Z',
    jobId: EXACT_JOB,
  });
  const mainRun = actionRun({
    id: MAIN_RUN,
    workflowId: 502,
    name: 'Validate Main',
    path: '.github/workflows/validate-main.yml',
    event: 'push',
    headSha: MAIN,
    completedAt: '2026-07-18T10:20:00.000Z',
    jobId: MAIN_JOB,
  });
  const job = (run, name) => ({
    id: run._job_id,
    name,
    head_sha: run.head_sha,
    status: run.status,
    conclusion: run.conclusion,
    completed_at: run.updated_at,
  });
  const check = (run, name) => ({
    id: run._job_id,
    name,
    head_sha: run.head_sha,
    status: run.status,
    conclusion: run.conclusion,
    completed_at: run.updated_at,
    app: {
      id: 15368,
      slug: 'github-actions',
      name: 'GitHub Actions',
      owner: { login: 'github' },
    },
  });
  return {
    responseDate: OBSERVED_AT,
    repository: { id: REPOSITORY_ID, full_name: REPOSITORY, default_branch: 'main' },
    pullRequest: {
      number: 52,
      state: 'closed',
      merged: true,
      merged_at: MERGED_AT,
      merged_by: { login: 'rezahh107' },
      merge_commit_sha: MAIN,
      html_url: `https://github.com/${REPOSITORY}/pull/52`,
      head: { sha: HEAD, repo: { id: REPOSITORY_ID, full_name: REPOSITORY } },
      base: { ref: 'main', sha: BASE, repo: { id: REPOSITORY_ID, full_name: REPOSITORY } },
    },
    headCommit: { sha: HEAD, commit: { tree: { sha: TREE } }, parents: [{ sha: BASE }] },
    mergeCommit: {
      sha: MAIN,
      commit: { tree: { sha: '5555555555555555555555555555555555555555' } },
      parents: [{ sha: BASE }, { sha: HEAD }],
    },
    branch: { name: 'main', commit: { sha: MAIN } },
    headToResult: { status: 'ahead' },
    resultToMain: { status: 'identical' },
    workflows: {
      'validate-mvk.yml': { id: 501, name: 'Validate MVK', path: '.github/workflows/validate-mvk.yml' },
      'validate-main.yml': { id: 502, name: 'Validate Main', path: '.github/workflows/validate-main.yml' },
    },
    runs: new Map([[EXACT_RUN, exactRun], [MAIN_RUN, mainRun]]),
    jobs: new Map([
      [EXACT_RUN, [job(exactRun, 'Validate MVK')]],
      [MAIN_RUN, [job(mainRun, 'Validate Main')]],
    ]),
    checks: new Map([
      [EXACT_JOB, check(exactRun, 'Validate MVK')],
      [MAIN_JOB, check(mainRun, 'Validate Main')],
    ]),
  };
}

function response(value, state, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name) => name.toLowerCase() === 'date' ? state.responseDate : null },
    json: async () => clone(value),
  };
}

function officialFetch(state, { unavailable = false, nonexistentRun = null } = {}) {
  return async (input) => {
    if (unavailable) throw new Error('simulated GitHub API outage');
    const url = new URL(input);
    const path = url.pathname;
    if (path === `/repos/${REPOSITORY}`) return response(state.repository, state);
    if (/\/pulls\/\d+$/.test(path)) return response(state.pullRequest, state);
    if (path.endsWith(`/commits/${HEAD}`)) return response(state.headCommit, state);
    if (path.endsWith(`/commits/${MAIN}`)) return response(state.mergeCommit, state);
    if (/\/commits\/[0-9a-f]{40}$/.test(path)) {
      const sha = path.split('/').at(-1);
      return response({ ...state.mergeCommit, sha }, state);
    }
    if (path.endsWith('/branches/main')) return response(state.branch, state);
    if (path.includes(`/compare/${HEAD}...${MAIN}`)) return response(state.headToResult, state);
    if (path.includes(`/compare/${MAIN}...main`)) return response(state.resultToMain, state);
    if (/\/compare\/[0-9a-f]{40}\.\.\.[0-9a-f]{40}$/.test(path)) {
      return response(state.headToResult, state);
    }
    if (/\/compare\/[0-9a-f]{40}\.\.\.main$/.test(path)) return response(state.resultToMain, state);
    const workflowMatch = path.match(/\/actions\/workflows\/([^/]+)$/);
    if (workflowMatch) return response(state.workflows[decodeURIComponent(workflowMatch[1])], state);
    if (path.endsWith('/actions/runs')) {
      const event = url.searchParams.get('event');
      return response({
        workflow_runs: [...state.runs.values()].filter((run) => run.event === event),
      }, state);
    }
    const jobsMatch = path.match(/\/actions\/runs\/(\d+)\/jobs$/);
    if (jobsMatch) return response({ jobs: state.jobs.get(Number(jobsMatch[1])) || [] }, state);
    const runMatch = path.match(/\/actions\/runs\/(\d+)$/);
    if (runMatch) {
      const runId = Number(runMatch[1]);
      if (runId === nonexistentRun || !state.runs.has(runId)) return response({}, state, 404);
      return response(state.runs.get(runId), state);
    }
    const checkMatch = path.match(/\/check-runs\/(\d+)$/);
    if (checkMatch) return response(state.checks.get(Number(checkMatch[1])) || {}, state);
    return response({}, state, 404);
  };
}

async function verifyScenario(name, mutateLedger, mutateState, expectedDiagnosticId, options = {}) {
  const value = completedLedger();
  const state = officialState();
  mutateLedger?.(value);
  mutateState?.(state, value);
  const result = await fetchRecoveryCompletionCapability(value, 'KREC-001', {
    fetchImpl: officialFetch(state, options),
    now: () => Date.parse(OBSERVED_AT),
  });
  record(name, !result.capability && has(result.diagnostics, expectedDiagnosticId), result.diagnostics);
  return result;
}

const canonicalDiagnostics = validateRecoveryLedgerDocument(ledger, program, schema);
record(
  'canonical branch-backed KREC-001 candidate is valid',
  canonicalDiagnostics.length === 0,
  canonicalDiagnostics,
);

const initialCase = validFixtures.cases.find(
  (item) => item.case_id === 'initial-active-program-only-krec-001-ready',
);
const initialLedger = applyFixturePatch(ledger, initialCase.patch);
const initialDiagnostics = validateRecoveryLedgerDocument(initialLedger, program, schema);
record(
  'initial ledger exposes only KREC-001 as dependency-ready',
  initialDiagnostics.length === 0
    && initialLedger.tasks.filter((task) => task.execution_eligibility === 'dependency_ready')
      .map((task) => task.task_id).join(',') === 'KREC-001',
  initialDiagnostics,
);

const inProgressCase = validFixtures.cases.find(
  (item) => item.case_id === 'legal-in-progress-branch-candidate',
);
const inProgressLedger = applyFixturePatch(ledger, inProgressCase.patch);
const inProgressDiagnostics = validateRecoveryLedgerDocument(inProgressLedger, program, schema);
record(
  'in_progress fixture is branch-backed with undefined PR fields null and dependents blocked',
  inProgressDiagnostics.length === 0
    && inProgressLedger.tasks[0].lifecycle_state === 'in_progress'
    && inProgressLedger.tasks[0].candidate?.branch === 'krec-001/recovery-ledger'
    && inProgressLedger.tasks[0].candidate?.pull_request === null
    && inProgressLedger.tasks[0].candidate?.pr_state === null
    && inProgressLedger.tasks[0].completion_evidence === null
    && inProgressLedger.tasks[1].execution_eligibility === 'dependency_blocked'
    && inProgressLedger.tasks[3].execution_eligibility === 'dependency_blocked',
  inProgressDiagnostics,
);

const checksPending = clone(ledger);
const checksPendingDiagnostics = recoveryLedgerDiagnostics(checksPending, program);
record(
  'open non-Draft PR and successful exact-head checks remain candidate state',
  checksPendingDiagnostics.length === 0
    && checksPending.tasks[1].execution_eligibility === 'dependency_blocked'
    && checksPending.tasks[3].execution_eligibility === 'dependency_blocked',
  checksPendingDiagnostics,
);

const falseUnlock = clone(checksPending);
falseUnlock.tasks[1].execution_eligibility = 'dependency_ready';
const falseUnlockDiagnostics = recoveryLedgerDiagnostics(falseUnlock, program);
record(
  'branch PR or CI candidate state cannot unlock a dependent task',
  has(falseUnlockDiagnostics, 'RECOVERY_LEDGER_EXECUTION_ELIGIBILITY_MISMATCH'),
  falseUnlockDiagnostics,
);

const complete = completedLedger();
const official = officialState();
const verified = await fetchRecoveryCompletionCapability(complete, 'KREC-001', {
  fetchImpl: officialFetch(official),
  now: () => Date.parse(OBSERVED_AT),
});
const capabilities = new Map([['KREC-001', verified.capability]]);
const completeDiagnostics = validateRecoveryLedgerDocument(complete, program, schema, capabilities);
const readyAfterCompletion = complete.tasks
  .filter((task) => task.execution_eligibility === 'dependency_ready')
  .map((task) => task.task_id)
  .sort();
record(
  'fresh official evidence mints a sealed capability and unlocks only KREC-002 and KREC-004',
  verified.diagnostics.length === 0
    && isRecoveryCompletionCapability(verified.capability)
    && completeDiagnostics.length === 0
    && JSON.stringify(readyAfterCompletion) === JSON.stringify(['KREC-002', 'KREC-004']),
  [...verified.diagnostics, ...completeDiagnostics],
);

const serializedCapability = JSON.parse(JSON.stringify(verified.capability));
const serializedDiagnostics = validateRecoveryLedgerDocument(
  complete,
  program,
  schema,
  new Map([['KREC-001', serializedCapability]]),
);
record(
  'serialized capability lookalike cannot complete a task or unlock dependents',
  has(serializedDiagnostics, 'RECOVERY_LEDGER_AUTHORITATIVE_COMPLETION_CAPABILITY_REQUIRED')
    && has(serializedDiagnostics, 'RECOVERY_LEDGER_EXECUTION_ELIGIBILITY_MISMATCH'),
  serializedDiagnostics,
);

const rebound = clone(complete);
rebound.tasks[0].completion_evidence.current_main_validation.run_id = 9002;
const reboundDiagnostics = validateRecoveryLedgerDocument(rebound, program, schema, capabilities);
record(
  'capability is exact-bound and rejected after ledger evidence mutation',
  has(reboundDiagnostics, 'RECOVERY_LEDGER_AUTHORITATIVE_COMPLETION_CAPABILITY_REQUIRED'),
  reboundDiagnostics,
);

await verifyScenario(
  'correctly shaped nonexistent Actions URL is unavailable',
  (value) => {
    value.tasks[0].completion_evidence.exact_head_ci.run_id = 9999;
    value.tasks[0].completion_evidence.exact_head_ci.reference = `https://github.com/${REPOSITORY}/actions/runs/9999`;
    value.tasks[0].completion_evidence.evidence_refs[1].reference = `https://github.com/${REPOSITORY}/actions/runs/9999`;
  },
  null,
  'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
  { nonexistentRun: 9999 },
);
await verifyScenario(
  'run from another repository cannot mint completion',
  null,
  (state) => {
    const run = state.runs.get(EXACT_RUN);
    run.repository = { id: 999, full_name: 'attacker/lookalike' };
    run.head_repository = { id: 999, full_name: 'attacker/lookalike' };
  },
  'RECOVERY_LEDGER_EXACT_HEAD_RUN_REPOSITORY_MISMATCH',
);
await verifyScenario(
  'run bound to the wrong Head cannot mint completion',
  null,
  (state) => { state.runs.get(EXACT_RUN).head_sha = BASE; },
  'RECOVERY_LEDGER_EXACT_HEAD_RUN_UNVERIFIED',
);
await verifyScenario(
  'wrong workflow cannot mint completion',
  null,
  (state) => {
    const run = state.runs.get(EXACT_RUN);
    run.workflow_id = 999;
    run.name = 'Validate MVK Lookalike';
    run.path = '.github/workflows/lookalike.yml';
  },
  'RECOVERY_LEDGER_EXACT_HEAD_RUN_UNVERIFIED',
);
await verifyScenario(
  'wrong GitHub App producer cannot mint completion',
  null,
  (state) => {
    state.checks.get(EXACT_JOB).app = {
      id: 999,
      slug: 'lookalike',
      name: 'Lookalike Actions',
      owner: { login: 'attacker' },
    };
  },
  'RECOVERY_LEDGER_WORKFLOW_PRODUCER_MISMATCH',
);
for (const [label, status, conclusion] of [
  ['unsuccessful', 'completed', 'failure'],
  ['skipped', 'completed', 'skipped'],
  ['cancelled', 'completed', 'cancelled'],
  ['incomplete', 'in_progress', null],
]) {
  await verifyScenario(
    `${label} workflow run cannot mint completion`,
    null,
    (state) => {
      const run = state.runs.get(EXACT_RUN);
      run.status = status;
      run.conclusion = conclusion;
    },
    'RECOVERY_LEDGER_EXACT_HEAD_RUN_UNVERIFIED',
  );
}
await verifyScenario(
  'stale official response set cannot mint completion',
  null,
  (state) => { state.responseDate = '2026-07-18T09:00:00.000Z'; },
  'RECOVERY_LEDGER_GITHUB_EVIDENCE_STALE',
);
await verifyScenario(
  'wrong PR cannot mint completion',
  null,
  (state) => { state.pullRequest.number = 53; },
  'RECOVERY_LEDGER_GITHUB_PR_IDENTITY_MISMATCH',
);
await verifyScenario(
  'wrong Merge actor cannot mint completion',
  null,
  (state) => { state.pullRequest.merged_by.login = 'attacker'; },
  'RECOVERY_LEDGER_GITHUB_MERGE_ACTOR_MISMATCH',
);
await verifyScenario(
  'wrong Merge method cannot mint completion',
  (value) => { value.tasks[0].completion_evidence.merge_method = 'squash'; },
  null,
  'RECOVERY_LEDGER_GITHUB_MERGE_METHOD_MISMATCH',
);
await verifyScenario(
  'wrong resulting main SHA cannot mint completion',
  (value) => {
    const wrong = '6666666666666666666666666666666666666666';
    value.tasks[0].completion_evidence.resulting_main_sha = wrong;
    value.tasks[0].completion_evidence.current_main_validation.head_sha = wrong;
  },
  null,
  'RECOVERY_LEDGER_GITHUB_PR_IDENTITY_MISMATCH',
);
await verifyScenario(
  'unavailable API evidence fails closed',
  null,
  null,
  'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
  { unavailable: true },
);

const locallyCoherent = completedLedger();
locallyCoherent.tasks[0].completion_evidence.reviewed_head_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
locallyCoherent.tasks[0].completion_evidence.resulting_main_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
locallyCoherent.tasks[0].completion_evidence.exact_head_ci.head_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
locallyCoherent.tasks[0].completion_evidence.current_main_validation.head_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
const localDiagnostics = repositoryCompletionDiagnostics(locallyCoherent);
const unavailableLocal = await fetchRecoveryCompletionCapability(locallyCoherent, 'KREC-001', {
  fetchImpl: officialFetch(officialState(), { unavailable: true }),
  now: () => Date.parse(OBSERVED_AT),
});
record(
  'locally coherent commit ancestry cannot substitute for unavailable GitHub evidence',
  localDiagnostics.length === 0
    && has(unavailableLocal.diagnostics, 'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE'),
  [...localDiagnostics, ...unavailableLocal.diagnostics],
);

const mutatedEvidence = clone(complete);
mutatedEvidence.tasks[0].completion_evidence.current_main_validation.run_id = 2002;
const historyDiagnostics = recoveryLedgerHistoryDiagnostics(complete, mutatedEvidence);
record(
  'accepted completion evidence is immutable',
  has(historyDiagnostics, 'RECOVERY_LEDGER_COMPLETION_EVIDENCE_IMMUTABLE'),
  historyDiagnostics,
);

record(
  'undeclared extra diagnostic fails exact fixture expectation',
  fixtureExpectationPass('invalid', ['DECLARED'], ['DECLARED', 'UNDECLARED']) === false
    && fixtureExpectationPass('invalid', ['DECLARED'], ['DECLARED', 'UNDECLARED'], {
      allowAdditionalDiagnostics: true,
    }) === true,
);

let unresolvedPointerError = null;
try {
  applyFixturePatch(ledger, [{
    op: 'replace',
    path: '/tasks/8/candidate/branch',
    value: 'invented/candidate',
  }]);
} catch (error) {
  unresolvedPointerError = error;
}
record(
  'fixture patching fails closed with a stable unresolved-pointer error',
  unresolvedPointerError?.message
    === 'RECOVERY_LEDGER_FIXTURE_POINTER_UNRESOLVED:/tasks/8/candidate/branch',
);

const report = {
  suite: 'recovery-ledger-dependency-and-authoritative-evidence-lifecycle',
  status: cases.every((item) => item.pass) ? 'pass' : 'fail',
  cases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
