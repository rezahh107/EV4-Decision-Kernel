#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import {
  applyFixturePatch,
  fixtureExpectationPass,
  recoveryLedgerDiagnostics,
  recoveryLedgerHistoryDiagnostics,
  repositoryCompletionDiagnostics,
  validateRecoveryLedgerDocument,
} from '../kernel/validator/validate-recovery-ledger.mjs';
import {
  fetchRecoveryCompletionCapabilities,
  isRecoveryCompletionCapability,
} from '../kernel/validator/recovery-completion-evidence.mjs';
import * as recoveryAuthority from '../kernel/validator/recovery-completion-evidence.mjs';
import {
  createRecoveryCompletionVerifier,
  recoveryVerifiedEvidenceMatches,
  verifyRecoveryCompletionEvidence,
} from '../kernel/validator/recovery-completion-verifier.mjs';
import {
  RECOVERY_AUTHORITATIVE_WORKFLOWS,
  analyzeRecoveryWorkflowSource,
  isVerifiedRecoveryWorkflowSource,
  verifyRecoveryWorkflowDescriptorPayloads,
  verifyRecoveryWorkflowSourcePayload,
  workflowSourceIdentity,
} from './lib/aigov-ci-descriptor.mjs';

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
const MVK_WORKFLOW_ID = 309028718;
const MAIN_WORKFLOW_ID = 312952795;
const TEST_TOKEN = 'test-recovery-installation-token';
const OBSERVED_AT = '2026-07-18T10:30:00.000Z';
const MERGED_AT = '2026-07-18T10:10:00.000Z';
const MAX_RESPONSE_AGE_MS = 5 * 60 * 1000;
const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const ledger = read('planning/recovery/recovery-ledger.v1.json');
const program = read('planning/recovery/recovery-execution-program.v1.json');
const schema = read('kernel/schemas/recovery-ledger.v1.schema.json');
const validFixtures = read('kernel/fixtures/recovery-ledger/valid/cases.json');
const workflowSources = Object.freeze({
  '.github/workflows/validate-mvk.yml': readFileSync('.github/workflows/validate-mvk.yml'),
  '.github/workflows/validate-main.yml': readFileSync('.github/workflows/validate-main.yml'),
});
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
    workflowId: MVK_WORKFLOW_ID,
    name: 'Validate MVK',
    path: '.github/workflows/validate-mvk.yml',
    event: 'pull_request',
    headSha: HEAD,
    completedAt: '2026-07-18T10:05:00.000Z',
    jobId: EXACT_JOB,
  });
  const mainRun = actionRun({
    id: MAIN_RUN,
    workflowId: MAIN_WORKFLOW_ID,
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
    workflowSources: new Map(Object.entries(workflowSources).map(([sourcePath, raw]) => [sourcePath, Buffer.from(raw)])),
    runs: new Map([[EXACT_RUN, exactRun], [MAIN_RUN, mainRun]]),
    jobs: new Map([
      [EXACT_RUN, [job(exactRun, 'MVK and roadmap regressions')]],
      [MAIN_RUN, [job(mainRun, 'Validate Main')]],
    ]),
    checks: new Map([
      [EXACT_JOB, check(exactRun, 'MVK and roadmap regressions')],
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

function workflowContentPayload(sourcePath, raw) {
  const identity = workflowSourceIdentity(raw);
  return {
    type: 'file',
    encoding: 'base64',
    path: sourcePath,
    name: sourcePath.split('/').at(-1),
    size: identity.size,
    sha: identity.blob_sha,
    content: Buffer.from(raw).toString('base64'),
  };
}

function officialFetch(state, {
  unavailable = false,
  nonexistentRun = null,
  statusForPath = null,
  requests = null,
  authObservations = null,
} = {}) {
  return async (input, init = {}) => {
    if (typeof unavailable === 'function' ? unavailable() : unavailable) {
      throw new Error('simulated GitHub API outage');
    }
    const url = new URL(input);
    const path = url.pathname;
    requests?.push(`${path}${url.search}`);
    const authenticated = init?.headers?.Authorization === `Bearer ${TEST_TOKEN}`;
    authObservations?.push(authenticated);
    if (!authenticated) return response({}, state, 401);
    const forcedStatus = typeof statusForPath === 'function' ? statusForPath(url) : null;
    if (Number.isInteger(forcedStatus)) return response({}, state, forcedStatus);
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
    const sourceMatch = path.match(/\/contents\/(.+)$/);
    if (sourceMatch) {
      const sourcePath = sourceMatch[1].split('/').map(decodeURIComponent).join('/');
      const raw = state.workflowSources.get(sourcePath);
      if (!raw) return response({}, state, 404);
      return response(workflowContentPayload(sourcePath, raw), state);
    }
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

function mutatedWorkflow(key, mutate) {
  const expected = RECOVERY_AUTHORITATIVE_WORKFLOWS[key];
  const document = parseYaml(workflowSources[expected.path].toString('utf8'));
  mutate(document, expected);
  return Buffer.from(stringifyYaml(document));
}

function workflowCommandCount(key, command) {
  const expected = RECOVERY_AUTHORITATIVE_WORKFLOWS[key];
  const document = parseYaml(workflowSources[expected.path].toString('utf8'));
  const job = document.jobs?.[expected.jobKey];
  return (job?.steps || [])
    .flatMap((step) => String(step?.run || '').replaceAll('\r\n', '\n').split('\n'))
    .filter((line) => line.trim() === command).length;
}

function verifiedSourceFor(key, commitSha) {
  const expected = RECOVERY_AUTHORITATIVE_WORKFLOWS[key];
  const payload = workflowContentPayload(expected.path, workflowSources[expected.path]);
  return verifyRecoveryWorkflowSourcePayload({
    repository: REPOSITORY,
    repositoryId: REPOSITORY_ID,
    commitSha,
    expected,
    contentPayload: payload,
    sourceApiUrl: `https://api.github.com/repos/${REPOSITORY}/contents/${expected.path}?ref=${commitSha}`,
  });
}

async function verifyScenario(name, mutateLedger, mutateState, expectedDiagnosticId, options = {}) {
  const value = completedLedger();
  const state = officialState();
  mutateLedger?.(value);
  mutateState?.(state, value);
  const result = await verifyRecoveryCompletionEvidence(value, 'KREC-001', {
    fetchImpl: officialFetch(state, options),
    token: TEST_TOKEN,
    now: () => Date.parse(OBSERVED_AT),
  });
  record(name, !result.evidence && has(result.diagnostics, expectedDiagnosticId), result.diagnostics);
  return result;
}

async function verifyExpiredMutation(name, mutateState, expectedDiagnosticId) {
  const value = completedLedger();
  const state = officialState();
  const requests = [];
  let nowMs = Date.parse(OBSERVED_AT);
  const session = createRecoveryCompletionVerifier({
    fetchImpl: officialFetch(state, { requests }),
    token: TEST_TOKEN,
    now: () => nowMs,
  });
  const initial = await verifyRecoveryCompletionEvidence(value, 'KREC-001', { session });
  const initialRequestCount = requests.length;
  nowMs += MAX_RESPONSE_AGE_MS + 1;
  state.responseDate = new Date(nowMs).toISOString();
  mutateState(state);
  const refreshed = await verifyRecoveryCompletionEvidence(value, 'KREC-001', { session });
  record(
    name,
    Boolean(initial.evidence)
      && !recoveryVerifiedEvidenceMatches(initial.evidence, value, value.tasks[0], nowMs)
      && !refreshed.evidence
      && has(refreshed.diagnostics, expectedDiagnosticId)
      && requests.length > initialRequestCount,
    [...initial.diagnostics, ...refreshed.diagnostics],
  );
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
const verified = await verifyRecoveryCompletionEvidence(complete, 'KREC-001', {
  fetchImpl: officialFetch(official),
  token: TEST_TOKEN,
  now: () => Date.parse(OBSERVED_AT),
});
const syntheticEvidenceMap = new Map([['KREC-001', verified.evidence]]);
const completeDiagnostics = validateRecoveryLedgerDocument(
  complete,
  program,
  schema,
  syntheticEvidenceMap,
);
record(
  'synthetic transport exercises the pure verifier but cannot mint authority or unlock dependents',
  verified.diagnostics.length === 0
    && Boolean(verified.evidence)
    && !isRecoveryCompletionCapability(verified.evidence)
    && has(completeDiagnostics, 'RECOVERY_LEDGER_AUTHORITATIVE_COMPLETION_CAPABILITY_REQUIRED')
    && has(completeDiagnostics, 'RECOVERY_LEDGER_EXECUTION_ELIGIBILITY_MISMATCH'),
  [...verified.diagnostics, ...completeDiagnostics],
);

const serializedCapability = JSON.parse(JSON.stringify(verified.evidence));
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
record(
  'ordinary pure-verifier evidence remains exact-bound after ledger mutation',
  recoveryVerifiedEvidenceMatches(
    verified.evidence,
    complete,
    complete.tasks[0],
    Date.parse(OBSERVED_AT),
  )
    && !recoveryVerifiedEvidenceMatches(
      verified.evidence,
      rebound,
      rebound.tasks[0],
      Date.parse(OBSERVED_AT),
    ),
);

let unknownOptionsError = null;
try {
  await fetchRecoveryCompletionCapabilities(ledger, {
    fetchImpl: officialFetch(officialState()),
    token: TEST_TOKEN,
    now: () => Date.parse(OBSERVED_AT),
  });
} catch (error) {
  unknownOptionsError = error;
}
record(
  'production authority exposes one batch entry point and rejects caller options',
  recoveryAuthority.createRecoveryEvidenceSession === undefined
    && recoveryAuthority.createRecoveryCompletionVerifier === undefined
    && recoveryAuthority.fetchRecoveryCompletionCapability === undefined
    && unknownOptionsError?.message === 'RECOVERY_COMPLETION_PRODUCTION_OPTIONS_FORBIDDEN',
);

const authoritySource = readFileSync(
  'kernel/validator/recovery-completion-evidence.mjs',
  'utf8',
);
const pureVerifierSource = readFileSync(
  'kernel/validator/recovery-completion-verifier.mjs',
  'utf8',
);
const validatorSource = readFileSync('kernel/validator/validate-recovery-ledger.mjs', 'utf8');
record(
  'production CLI uses one private batch verifier and no caller-controlled transport or clock',
  authoritySource.includes(
    "import { Agent as nodeHttpsAgent, request as nodeHttpsRequest } from 'node:https'",
  )
    && authoritySource.includes("import { connect as nodeTlsConnect } from 'node:tls'")
    && authoritySource.includes(
      'const trustedDateParse = globalThis.Date.parse.bind(globalThis.Date)',
    )
    && authoritySource.includes("Object.defineProperty(trustedAgent, 'createConnection'")
    && authoritySource.includes('agent: trustedAgent')
    && !authoritySource.includes('NativeDate.parse')
    && !authoritySource.includes('globalAgent')
    && authoritySource.includes('const verifier = createRecoveryCompletionVerifier({')
    && authoritySource.includes('for (const task of Array.isArray(ledger?.tasks) ? ledger.tasks : [])')
    && !authoritySource.includes('globalThis.fetch')
    && !authoritySource.includes('Date.now')
    && !pureVerifierSource.includes('VERIFIED_COMPLETIONS')
    && !pureVerifierSource.includes('COMPLETION_STATE')
    && !pureVerifierSource.includes('mintCapability')
    && (validatorSource.match(/fetchRecoveryCompletionCapabilities\(ledger\)/g) || []).length === 1
    && !validatorSource.includes('createRecoveryEvidenceSession')
    && !validatorSource.includes('fetchRecoveryCompletionCapability('),
);

const authorityModuleUrl = new URL(
  '../kernel/validator/recovery-completion-evidence.mjs',
  import.meta.url,
).href;
const ledgerFileUrl = new URL('../planning/recovery/recovery-ledger.v1.json', import.meta.url);
const authorityProbe = `
  import { readFileSync } from 'node:fs';
  const authority = await import(${JSON.stringify(authorityModuleUrl)});
  const https = (await import('node:https')).default;
  let fakeFetchCalls = 0;
  let fakeNowCalls = 0;
  let fakeDateParseCalls = 0;
  let fakeGlobalAgentConnectionCalls = 0;
  let fakeGlobalAgentReplacementCalls = 0;
  globalThis.fetch = async () => { fakeFetchCalls += 1; throw new Error('fake transport used'); };
  Date.now = () => { fakeNowCalls += 1; return 0; };
  Date.parse = () => { fakeDateParseCalls += 1; return Number.MAX_SAFE_INTEGER; };
  https.globalAgent.createConnection = () => {
    fakeGlobalAgentConnectionCalls += 1;
    throw new Error('mutable global agent used');
  };
  https.globalAgent = {
    addRequest() {
      fakeGlobalAgentReplacementCalls += 1;
      throw new Error('replacement global agent used');
    },
  };
  process.env.RECOVERY_GITHUB_TOKEN = 'fake-post-initialization-token';
  const ledger = JSON.parse(readFileSync(new URL(${JSON.stringify(ledgerFileUrl.href)}), 'utf8'));
  ledger.tasks[0].lifecycle_state = 'complete';
  ledger.tasks[0].candidate = { branch: 'fake', pull_request: 52, pr_state: 'merged' };
  ledger.tasks[0].completion_evidence = {};
  const result = await authority.fetchRecoveryCompletionCapabilities(ledger);
  process.stdout.write(JSON.stringify({
    capabilityCount: result.capabilities.size,
    diagnosticIds: result.diagnostics.map((item) => item.diagnostic_id),
    fakeFetchCalls,
    fakeNowCalls,
    fakeDateParseCalls,
    fakeGlobalAgentConnectionCalls,
    fakeGlobalAgentReplacementCalls,
  }));
`;
const authorityProbeEnv = { ...process.env };
delete authorityProbeEnv.RECOVERY_GITHUB_TOKEN;
const authorityProbeResult = spawnSync(
  process.execPath,
  ['--input-type=module', '-e', authorityProbe],
  { encoding: 'utf8', env: authorityProbeEnv },
);
let authorityProbeOutput = null;
try {
  authorityProbeOutput = JSON.parse(authorityProbeResult.stdout);
} catch {
  authorityProbeOutput = null;
}
record(
  'post-initialization fake token transport clock parser and global agent cannot mint authority',
  authorityProbeResult.status === 0
    && authorityProbeOutput?.capabilityCount === 0
    && authorityProbeOutput?.fakeFetchCalls === 0
    && authorityProbeOutput?.fakeNowCalls === 0
    && authorityProbeOutput?.fakeDateParseCalls === 0
    && authorityProbeOutput?.fakeGlobalAgentConnectionCalls === 0
    && authorityProbeOutput?.fakeGlobalAgentReplacementCalls === 0
    && authorityProbeOutput?.diagnosticIds?.includes(
      'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
    ),
);

for (const [name, key, mutate, expectedDiagnostic] of [
  [
    'same workflow metadata with Recovery validator command removed is rejected structurally',
    'mvk',
    (document) => {
      const step = document.jobs['regression-validation'].steps
        .find((item) => item.name === 'Validate Recovery lifecycle');
      step.run = step.run.replace('npm run validate:recovery-ledger\n', '');
    },
    'AIGOV_RECOVERY_WORKFLOW_VALIDATOR_COMMAND_MISMATCH',
  ],
  [
    'same workflow metadata with Recovery validator command replaced by true is rejected',
    'mvk',
    (document) => {
      const step = document.jobs['regression-validation'].steps
        .find((item) => item.name === 'Validate Recovery lifecycle');
      step.run = step.run.replace('npm run validate:recovery-ledger', 'true');
    },
    'AIGOV_RECOVERY_WORKFLOW_VALIDATOR_COMMAND_MISMATCH',
  ],
  [
    'external trust dependency removal is rejected structurally',
    'mvk',
    (document) => { document.jobs['regression-validation'].needs = ['validate-mvk']; },
    'AIGOV_RECOVERY_WORKFLOW_JOB_DEPENDENCY_MISMATCH',
  ],
  [
    'expected Recovery job replaced by a no-op job is rejected',
    'mvk',
    (document) => {
      document.jobs['regression-validation'].steps = [{
        name: 'Validate Recovery lifecycle',
        run: 'true',
      }];
    },
    'AIGOV_RECOVERY_WORKFLOW_VALIDATOR_COMMAND_MISMATCH',
  ],
]) {
  const diagnostics = analyzeRecoveryWorkflowSource(
    mutatedWorkflow(key, mutate),
    RECOVERY_AUTHORITATIVE_WORKFLOWS[key],
  );
  record(name, diagnostics.includes(expectedDiagnostic));
}

for (const key of ['mvk', 'main']) {
  const tokenDiagnostics = analyzeRecoveryWorkflowSource(
    mutatedWorkflow(key, (document, expected) => {
      delete document.jobs[expected.jobKey].env.RECOVERY_GITHUB_TOKEN;
    }),
    RECOVERY_AUTHORITATIVE_WORKFLOWS[key],
  );
  record(
    `${key} workflow without RECOVERY_GITHUB_TOKEN wiring is rejected`,
    tokenDiagnostics.includes('AIGOV_RECOVERY_WORKFLOW_TOKEN_WIRING_MISSING'),
  );
  for (const permission of ['actions', 'checks', 'pull-requests']) {
    const permissionDiagnostics = analyzeRecoveryWorkflowSource(
      mutatedWorkflow(key, (document, expected) => {
        delete document.jobs[expected.jobKey].permissions[permission];
      }),
      RECOVERY_AUTHORITATIVE_WORKFLOWS[key],
    );
    record(
      `${key} workflow without ${permission}: read is rejected`,
      permissionDiagnostics.includes('AIGOV_RECOVERY_WORKFLOW_API_PERMISSIONS_MISMATCH'),
    );
  }
}

record(
  'workflow command graph performs each Recovery live-validation path once',
  workflowCommandCount('mvk', 'npm run validate:recovery-ledger') === 1
    && workflowCommandCount('mvk', 'npm run validate:mvk') === 0
    && workflowCommandCount('main', 'npm run validate:mvk') === 1
    && workflowCommandCount('main', 'npm run validate:recovery-ledger') === 0,
);

const sourceCapability = verifiedSourceFor('mvk', HEAD);
const sourceState = officialState();
const serializedSource = JSON.parse(JSON.stringify(sourceCapability.evidence));
const serializedSourceDescriptor = verifyRecoveryWorkflowDescriptorPayloads({
  source: serializedSource,
  repository: REPOSITORY,
  repositoryId: REPOSITORY_ID,
  exactHeadSha: HEAD,
  event: 'pull_request',
  expected: RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk,
  runs: [sourceState.runs.get(EXACT_RUN)],
  allRepositoryRuns: [sourceState.runs.get(EXACT_RUN)],
  jobs: sourceState.jobs.get(EXACT_RUN),
  checkRuns: [sourceState.checks.get(EXACT_JOB)],
  expectedRunId: EXACT_RUN,
  jobsRunId: EXACT_RUN,
});
record(
  'serialized workflow-source capability lookalike cannot verify a run',
  sourceCapability.diagnostics.length === 0
    && isVerifiedRecoveryWorkflowSource(sourceCapability.evidence)
    && serializedSourceDescriptor.evidence === null
    && serializedSourceDescriptor.diagnostics.includes(
      'AIGOV_RECOVERY_WORKFLOW_SOURCE_CAPABILITY_REQUIRED',
    ),
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
  'workflow content change with identical path name and App cannot mint completion',
  null,
  (state) => {
    const sourcePath = RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk.path;
    state.workflowSources.set(sourcePath, Buffer.concat([
      state.workflowSources.get(sourcePath),
      Buffer.from('\n'),
    ]));
  },
  'RECOVERY_LEDGER_WORKFLOW_SOURCE_UNVERIFIED',
);
await verifyScenario(
  'workflow digest from another commit or repository source cannot mint completion',
  null,
  (state) => {
    state.workflowSources.set(
      RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk.path,
      state.workflowSources.get(RECOVERY_AUTHORITATIVE_WORKFLOWS.main.path),
    );
  },
  'RECOVERY_LEDGER_WORKFLOW_SOURCE_UNVERIFIED',
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
  'ledger method differing from the authoritative ordinary merge graph is rejected',
  (value) => { value.tasks[0].completion_evidence.merge_method = 'squash'; },
  null,
  'RECOVERY_LEDGER_GITHUB_MERGE_METHOD_MISMATCH',
);
for (const [name, method, mutateState] of [
  [
    'one-commit squash-shaped one-parent result is explicitly ambiguous',
    'squash',
    (state) => {
      state.mergeCommit.parents = [{ sha: BASE }];
      state.mergeCommit.commit.tree.sha = TREE;
    },
  ],
  [
    'multi-commit squash-shaped one-parent result is explicitly ambiguous',
    'squash',
    (state) => {
      state.headCommit.parents = [{ sha: '7777777777777777777777777777777777777777' }];
      state.mergeCommit.parents = [{ sha: BASE }];
      state.mergeCommit.commit.tree.sha = TREE;
    },
  ],
  [
    'single-commit rebase onto unchanged base is not misclassified as squash',
    'rebase',
    (state) => {
      state.mergeCommit.parents = [{ sha: BASE }];
      state.mergeCommit.commit.tree.sha = TREE;
    },
  ],
  [
    'multi-commit rebase-shaped one-parent result is explicitly ambiguous',
    'rebase',
    (state) => {
      state.headCommit.parents = [{ sha: '7777777777777777777777777777777777777777' }];
      state.mergeCommit.parents = [{ sha: '8888888888888888888888888888888888888888' }];
      state.mergeCommit.commit.tree.sha = '9999999999999999999999999999999999999999';
    },
  ],
  [
    'squash after base advancement fails closed without an authoritative receipt',
    'squash',
    (state) => {
      state.mergeCommit.parents = [{ sha: '8888888888888888888888888888888888888888' }];
      state.mergeCommit.commit.tree.sha = '9999999999999999999999999999999999999999';
    },
  ],
  [
    'rebase after base advancement fails closed without an authoritative receipt',
    'rebase',
    (state) => {
      state.mergeCommit.parents = [{ sha: '8888888888888888888888888888888888888888' }];
      state.mergeCommit.commit.tree.sha = '9999999999999999999999999999999999999999';
    },
  ],
]) {
  await verifyScenario(
    name,
    (value) => { value.tasks[0].completion_evidence.merge_method = method; },
    mutateState,
    'RECOVERY_LEDGER_GITHUB_MERGE_METHOD_AMBIGUOUS',
  );
}
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

for (const status of [403, 429]) {
  await verifyScenario(
    `authenticated GitHub API ${status} response fails closed`,
    null,
    null,
    'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
    { statusForPath: () => status },
  );
}

const missingTokenRequests = [];
const missingTokenResult = await verifyRecoveryCompletionEvidence(completedLedger(), 'KREC-001', {
  fetchImpl: officialFetch(officialState(), { requests: missingTokenRequests }),
  token: null,
  now: () => Date.parse(OBSERVED_AT),
});
record(
  'missing RECOVERY_GITHUB_TOKEN fails closed before an unauthenticated request',
  !missingTokenResult.evidence
    && has(missingTokenResult.diagnostics, 'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
    && missingTokenRequests.length === 0,
  missingTokenResult.diagnostics,
);

const historicalRequests = [];
const historicalState = officialState();
const historicalSession = createRecoveryCompletionVerifier({
  fetchImpl: officialFetch(historicalState, { requests: historicalRequests }),
  token: TEST_TOKEN,
  now: () => Date.parse(OBSERVED_AT),
});
const historicalResult = await verifyRecoveryCompletionEvidence(completedLedger(), 'KREC-001', {
  session: historicalSession,
});
record(
  'historical completion revalidation does not depend on mutable current workflow metadata',
  Boolean(historicalResult.evidence)
    && historicalResult.diagnostics.length === 0
    && historicalRequests.every((requestPath) => !requestPath.includes('/actions/workflows/'))
    && historicalRequests.some((requestPath) => requestPath.includes(`/contents/${RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk.path}?ref=${HEAD}`))
    && historicalRequests.some((requestPath) => requestPath.includes(`/contents/${RECOVERY_AUTHORITATIVE_WORKFLOWS.main.path}?ref=${MAIN}`)),
  historicalResult.diagnostics,
);

const cachedRequests = [];
const authObservations = [];
const cachedFetch = officialFetch(officialState(), {
  requests: cachedRequests,
  authObservations,
});
const cachedSession = createRecoveryCompletionVerifier({
  fetchImpl: cachedFetch,
  token: TEST_TOKEN,
  now: () => Date.parse(OBSERVED_AT),
});
const cachedLedger = completedLedger();
const firstCached = await verifyRecoveryCompletionEvidence(cachedLedger, 'KREC-001', {
  session: cachedSession,
});
const firstRequestCount = cachedRequests.length;
const secondCached = await verifyRecoveryCompletionEvidence(cachedLedger, 'KREC-001', {
  session: cachedSession,
});
const serializedCacheSurface = JSON.stringify({
  session: cachedSession,
  capability: secondCached.evidence,
  diagnostics: secondCached.diagnostics,
});
record(
  'pure verifier reuses exact-bound ordinary evidence without exposing the token',
  Boolean(firstCached.evidence)
    && firstCached.evidence === secondCached.evidence
    && cachedRequests.length === firstRequestCount
    && authObservations.length > 0
    && authObservations.every(Boolean)
    && !serializedCacheSurface.includes(TEST_TOKEN),
  [...firstCached.diagnostics, ...secondCached.diagnostics],
);

const expiringState = officialState();
const expiringRequests = [];
let expiringNowMs = Date.parse(OBSERVED_AT);
const expiringSession = createRecoveryCompletionVerifier({
  fetchImpl: officialFetch(expiringState, { requests: expiringRequests }),
  token: TEST_TOKEN,
  now: () => expiringNowMs,
});
const expiringLedger = completedLedger();
const beforeExpiry = await verifyRecoveryCompletionEvidence(expiringLedger, 'KREC-001', {
  session: expiringSession,
});
const beforeExpiryRequestCount = expiringRequests.length;
expiringNowMs += MAX_RESPONSE_AGE_MS + 1;
expiringState.responseDate = new Date(expiringNowMs).toISOString();
const expiredBeforeRefetch = !recoveryVerifiedEvidenceMatches(
  beforeExpiry.evidence,
  expiringLedger,
  expiringLedger.tasks[0],
  expiringNowMs,
);
const afterExpiry = await verifyRecoveryCompletionEvidence(expiringLedger, 'KREC-001', {
  session: expiringSession,
});
record(
  'ordinary evidence request and run caches share one bounded expiry and refresh after five minutes',
  Boolean(beforeExpiry.evidence)
    && Boolean(afterExpiry.evidence)
    && beforeExpiry.evidence !== afterExpiry.evidence
    && expiredBeforeRefetch
    && !isRecoveryCompletionCapability(beforeExpiry.evidence)
    && expiringRequests.length === beforeExpiryRequestCount * 2
    && Date.parse(beforeExpiry.evidence.expires_at) - Date.parse(beforeExpiry.evidence.observed_at)
      <= MAX_RESPONSE_AGE_MS,
  [...beforeExpiry.diagnostics, ...afterExpiry.diagnostics],
);

for (const [name, mutateState, expectedDiagnosticId] of [
  [
    'expired repository evidence is fetched and re-evaluated',
    (state) => { state.repository.id = 999; },
    'RECOVERY_LEDGER_GITHUB_REPOSITORY_IDENTITY_MISMATCH',
  ],
  [
    'expired PR evidence is fetched and re-evaluated',
    (state) => { state.pullRequest.merged = false; },
    'RECOVERY_LEDGER_GITHUB_PR_IDENTITY_MISMATCH',
  ],
  [
    'expired workflow source is fetched and re-evaluated',
    (state) => {
      const sourcePath = RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk.path;
      state.workflowSources.set(sourcePath, Buffer.concat([
        state.workflowSources.get(sourcePath),
        Buffer.from('\n'),
      ]));
    },
    'RECOVERY_LEDGER_WORKFLOW_SOURCE_UNVERIFIED',
  ],
  [
    'expired job evidence is fetched and re-evaluated',
    (state) => { state.jobs.get(EXACT_RUN)[0].conclusion = 'failure'; },
    'RECOVERY_LEDGER_EXACT_HEAD_RUN_UNVERIFIED',
  ],
  [
    'expired check evidence is fetched and re-evaluated',
    (state) => {
      state.checks.get(EXACT_JOB).app = {
        id: 999,
        slug: 'lookalike',
        name: 'Lookalike Actions',
        owner: { login: 'attacker' },
      };
    },
    'RECOVERY_LEDGER_WORKFLOW_PRODUCER_MISMATCH',
  ],
]) {
  await verifyExpiredMutation(name, mutateState, expectedDiagnosticId);
}

const outageAfterExpiryState = officialState();
let outageAfterExpiryNowMs = Date.parse(OBSERVED_AT);
let outageAfterExpiry = false;
const outageAfterExpirySession = createRecoveryCompletionVerifier({
  fetchImpl: officialFetch(outageAfterExpiryState, { unavailable: () => outageAfterExpiry }),
  token: TEST_TOKEN,
  now: () => outageAfterExpiryNowMs,
});
const outageAfterExpiryLedger = completedLedger();
const beforeOutage = await verifyRecoveryCompletionEvidence(outageAfterExpiryLedger, 'KREC-001', {
  session: outageAfterExpirySession,
});
outageAfterExpiryNowMs += MAX_RESPONSE_AGE_MS + 1;
outageAfterExpiryState.responseDate = new Date(outageAfterExpiryNowMs).toISOString();
outageAfterExpiry = true;
const afterOutage = await verifyRecoveryCompletionEvidence(outageAfterExpiryLedger, 'KREC-001', {
  session: outageAfterExpirySession,
});
record(
  'API outage after ordinary evidence expiry fails closed instead of reusing stale verification',
  Boolean(beforeOutage.evidence)
    && !recoveryVerifiedEvidenceMatches(
      beforeOutage.evidence,
      outageAfterExpiryLedger,
      outageAfterExpiryLedger.tasks[0],
      outageAfterExpiryNowMs,
    )
    && !afterOutage.evidence
    && has(afterOutage.diagnostics, 'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE'),
  [...beforeOutage.diagnostics, ...afterOutage.diagnostics],
);

const recoveringState = officialState();
recoveringState.runs.get(EXACT_RUN).conclusion = 'failure';
let recoveringNowMs = Date.parse(OBSERVED_AT);
const recoveringRequests = [];
const recoveringSession = createRecoveryCompletionVerifier({
  fetchImpl: officialFetch(recoveringState, { requests: recoveringRequests }),
  token: TEST_TOKEN,
  now: () => recoveringNowMs,
});
const recoveringLedger = completedLedger();
const failedBeforeRefresh = await verifyRecoveryCompletionEvidence(recoveringLedger, 'KREC-001', {
  session: recoveringSession,
});
const failedRequestCount = recoveringRequests.length;
recoveringNowMs += MAX_RESPONSE_AGE_MS + 1;
recoveringState.responseDate = new Date(recoveringNowMs).toISOString();
recoveringState.runs.get(EXACT_RUN).conclusion = 'success';
const successfulAfterRefresh = await verifyRecoveryCompletionEvidence(recoveringLedger, 'KREC-001', {
  session: recoveringSession,
});
record(
  'failed workflow payload expires and can refresh to success in the same session',
  !failedBeforeRefresh.evidence
    && has(failedBeforeRefresh.diagnostics, 'RECOVERY_LEDGER_EXACT_HEAD_RUN_UNVERIFIED')
    && Boolean(successfulAfterRefresh.evidence)
    && successfulAfterRefresh.diagnostics.length === 0
    && recoveringRequests.length > failedRequestCount,
  [...failedBeforeRefresh.diagnostics, ...successfulAfterRefresh.diagnostics],
);

const sharedLedger = completedLedger();
sharedLedger.tasks[1].lifecycle_state = 'complete';
sharedLedger.tasks[1].execution_eligibility = 'complete';
sharedLedger.tasks[1].candidate = clone(sharedLedger.tasks[0].candidate);
sharedLedger.tasks[1].completion_evidence = clone(sharedLedger.tasks[0].completion_evidence);
const sharedRequests = [];
const sharedSession = createRecoveryCompletionVerifier({
  fetchImpl: officialFetch(officialState(), { requests: sharedRequests }),
  token: TEST_TOKEN,
  now: () => Date.parse(OBSERVED_AT),
});
const sharedFirst = await verifyRecoveryCompletionEvidence(sharedLedger, 'KREC-001', {
  session: sharedSession,
});
const sharedCount = sharedRequests.length;
const sharedSecond = await verifyRecoveryCompletionEvidence(sharedLedger, 'KREC-002', {
  session: sharedSession,
});
record(
  'two complete tasks sharing runs do not duplicate repository workflow run job or check retrieval',
  Boolean(sharedFirst.evidence)
    && Boolean(sharedSecond.evidence)
    && sharedRequests.length === sharedCount
    && new Set(sharedRequests).size === sharedRequests.length,
  [...sharedFirst.diagnostics, ...sharedSecond.diagnostics],
);

const locallyCoherent = completedLedger();
locallyCoherent.tasks[0].completion_evidence.reviewed_head_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
locallyCoherent.tasks[0].completion_evidence.resulting_main_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
locallyCoherent.tasks[0].completion_evidence.exact_head_ci.head_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
locallyCoherent.tasks[0].completion_evidence.current_main_validation.head_sha = '5b25e9e7f43071e1ac5a7e5e798a3600838e5b2a';
const localDiagnostics = repositoryCompletionDiagnostics(locallyCoherent);
const locallyAmbiguous = clone(locallyCoherent);
locallyAmbiguous.tasks[0].completion_evidence.merge_method = 'squash';
const locallyAmbiguousDiagnostics = repositoryCompletionDiagnostics(locallyAmbiguous);
record(
  'local same-commit and same-tree coherence cannot prove squash or rebase',
  has(locallyAmbiguousDiagnostics, 'RECOVERY_LEDGER_MERGE_RESULT_UNVERIFIED'),
  locallyAmbiguousDiagnostics,
);
const unavailableLocal = await verifyRecoveryCompletionEvidence(locallyCoherent, 'KREC-001', {
  fetchImpl: officialFetch(officialState(), { unavailable: true }),
  token: TEST_TOKEN,
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
