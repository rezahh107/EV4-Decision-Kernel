#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import path from 'node:path';
import {
  AUTHORITATIVE_WORKFLOWS,
  GITHUB_ACTIONS_APP_ID,
  aggregateAuthoritativeCi,
  verifyCurrentMainExecution,
  verifyMergeResultPayloads,
  verifyRepositoryEnforcementPayloads,
  verifyWorkflowDescriptorPayloads,
} from './lib/aigov-ci-descriptor.mjs';
import {
  INSPECTOR_COMMIT,
  INSPECTOR_REPOSITORY,
  INSPECTOR_REPOSITORY_ID,
  PROTOCOL_VERSION,
  deterministicReviewDirectory,
  reviewSequenceDiagnostics,
  verifyActiveProtocolSnapshot,
  verifyInspectorReviewProvenancePayloads,
} from './lib/pr-inspector-v1102.mjs';
import { V4_PLAN_ID, verifyBatchBFinalClosure } from './lib/aigov-v3-closure.mjs';
import { recoveryProgramDiagnostics } from '../kernel/validator/validate-recovery-execution-program.mjs';

const ROOT = process.cwd();
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const HEAD = 'a'.repeat(40);
const MAIN = 'b'.repeat(40);
const MERGE = 'c'.repeat(40);
const BASE = 'd'.repeat(40);
const TREE = 'e'.repeat(40);
const SCOPE = `sha256:${'f'.repeat(64)}`;
const results = [];

function record(name, pass, diagnostics = []) {
  results.push({ name, pass: Boolean(pass), diagnostics });
}
function expectDiagnostic(name, diagnostics, code) {
  record(name, diagnostics.some((item) => String(item).startsWith(code)), diagnostics);
}
function clone(value) { return structuredClone(value); }

function ciFixture(expected = AUTHORITATIVE_WORKFLOWS.sequence) {
  const workflow = { id: 3001, name: expected.name, path: expected.path };
  const run = {
    id: 2001,
    workflow_id: 3001,
    run_attempt: 1,
    name: expected.name,
    path: expected.path,
    event: 'pull_request',
    head_sha: HEAD,
    status: 'completed',
    conclusion: 'success',
    updated_at: '2026-07-16T10:00:00Z',
    repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
  };
  const job = {
    id: 4001,
    run_id: 2001,
    name: expected.checkName,
    head_sha: HEAD,
    status: 'completed',
    conclusion: 'success',
    completed_at: '2026-07-16T10:00:00Z',
  };
  const check = {
    id: 4001,
    name: expected.checkName,
    head_sha: HEAD,
    status: 'completed',
    conclusion: 'success',
    app: { id: GITHUB_ACTIONS_APP_ID, slug: 'github-actions', owner: { login: 'github' } },
  };
  return { workflow, runs: [run], allRepositoryRuns: [run], jobs: [job], checkRuns: [check] };
}
function verifyCi(value, expected = AUTHORITATIVE_WORKFLOWS.sequence) {
  return verifyWorkflowDescriptorPayloads({
    repository: REPOSITORY,
    repositoryId: REPOSITORY_ID,
    exactHeadSha: HEAD,
    event: 'pull_request',
    expected,
    ...value,
  });
}

const positiveCi = verifyCi(ciFixture());
record('authoritative exact workflow descriptor accepted', positiveCi.diagnostics.length === 0 && positiveCi.evidence?.workflow_id === 3001);
{
  const value = ciFixture();
  value.allRepositoryRuns.push({ ...value.runs[0], id: 2002, workflow_id: 9999, path: '.github/workflows/collision.yml' });
  expectDiagnostic('same-name workflow collision rejected', verifyCi(value).diagnostics, 'AIGOV_CI_SAME_NAME_WORKFLOW_COLLISION');
}
{
  const value = ciFixture(); value.workflow.path = '.github/workflows/wrong.yml';
  expectDiagnostic('wrong workflow path rejected', verifyCi(value).diagnostics, 'AIGOV_CI_WORKFLOW_DESCRIPTOR_MISMATCH');
}
{
  const value = ciFixture(); value.runs[0].workflow_id = 9999;
  expectDiagnostic('wrong workflow ID rejected', verifyCi(value).diagnostics, 'AIGOV_CI_AUTHORITATIVE_RUN_MISSING');
}
{
  const value = ciFixture(); value.checkRuns[0].app.id = 99999;
  expectDiagnostic('wrong App ID rejected', verifyCi(value).diagnostics, 'AIGOV_CI_CHECK_APP_MISMATCH');
}
{
  const value = ciFixture(); value.jobs = [];
  expectDiagnostic('missing job rejected', verifyCi(value).diagnostics, 'AIGOV_CI_JOB_MISSING');
}
{
  const value = ciFixture(); value.checkRuns = [];
  expectDiagnostic('missing check rejected', verifyCi(value).diagnostics, 'AIGOV_CI_CHECK_MISSING');
}
for (const conclusion of ['skipped', 'cancelled']) {
  const value = ciFixture(); value.runs[0].conclusion = conclusion;
  expectDiagnostic(`${conclusion} run rejected`, verifyCi(value).diagnostics, 'AIGOV_CI_AUTHORITATIVE_RUN_NOT_SUCCESSFUL');
}
expectDiagnostic('malformed workflow payload rejected', verifyCi({ ...ciFixture(), runs: [{}] }).diagnostics, 'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED');

function mergeFixture(method, actor = 'rezahh107') {
  const pr = {
    number: 50,
    merged: true,
    head: { sha: HEAD },
    base: { sha: BASE },
    merge_commit_sha: MERGE,
    merged_by: { login: actor },
    merged_at: '2026-07-16T12:00:00Z',
  };
  const headCommit = { sha: HEAD, tree: { sha: TREE } };
  let parents;
  let mergeTree = TREE;
  let headToMain = { status: 'diverged' };
  if (method === 'merge') { parents = [{ sha: BASE }, { sha: HEAD }]; mergeTree = '1'.repeat(40); headToMain = { status: 'ahead' }; }
  else if (method === 'squash') parents = [{ sha: BASE }];
  else parents = [{ sha: '2'.repeat(40) }];
  return {
    pr,
    reviewedHeadSha: HEAD,
    headCommit,
    mergeCommit: { sha: MERGE, tree: { sha: mergeTree }, parents },
    headToMain,
    mergeToMain: { status: 'ahead' },
  };
}
for (const method of ['merge', 'squash', 'rebase']) {
  const result = verifyMergeResultPayloads(mergeFixture(method));
  record(`${method} delivery verified`, result.diagnostics.length === 0 && result.evidence?.merge_method === method, result.diagnostics);
}

const reviewPackage = {
  protocol_version: PROTOCOL_VERSION,
  review_identity: {
    inspector_commit_sha: INSPECTOR_COMMIT,
    target_repository: REPOSITORY,
    pr_number: 50,
    reviewed_head_sha: HEAD,
    review_completed: '2026-07-16T11:00:00Z',
  },
};
const projection = { technical_status: 'GREEN_TECHNICALLY_READY', next_action: { kind: 'merge_now' }, security_profile: { sequence_ci_enforced: true } };
const liveSummary = { sequence_capability_verified: true, protocol_version: PROTOCOL_VERSION, reviewed_head_sha: HEAD, reviewed_scope_revision: SCOPE };
function reviewDiagnostics(overrides = {}) {
  return reviewSequenceDiagnostics({
    reviewPackage: overrides.reviewPackage || clone(reviewPackage),
    projection: overrides.projection || clone(projection),
    liveSummary: overrides.liveSummary || clone(liveSummary),
    headSha: overrides.headSha || HEAD,
    scopeRevision: overrides.scopeRevision || SCOPE,
    exactHeadCiCompletedAt: overrides.exactHeadCiCompletedAt || '2026-07-16T10:00:00Z',
    mergedAt: overrides.mergedAt || '2026-07-16T12:00:00Z',
  });
}
record('active v1.10.2 review claims accepted', reviewDiagnostics().length === 0, reviewDiagnostics());
{
  const value = clone(reviewPackage); value.protocol_version = 'v1.10.1';
  expectDiagnostic('stale v1.10.1 Batch B review rejected', reviewDiagnostics({ reviewPackage: value }), 'PRI-OFFICIAL-ACTIVE-PROTOCOL-MISMATCH');
}
expectDiagnostic('review after Merge rejected', reviewDiagnostics({ mergedAt: '2026-07-16T10:30:00Z' }), 'PRI-OFFICIAL-REVIEW-AFTER-MERGE');
expectDiagnostic('review before final CI rejected', reviewDiagnostics({ exactHeadCiCompletedAt: '2026-07-16T11:30:00Z' }), 'PRI-OFFICIAL-REVIEW-BEFORE-FINAL-CI');
expectDiagnostic('post-review head mutation rejected', reviewDiagnostics({ headSha: '9'.repeat(40) }), 'PRI-OFFICIAL-REVIEW-HEAD-IDENTITY-MISMATCH');
expectDiagnostic('scope mutation rejected', reviewDiagnostics({ scopeRevision: `sha256:${'8'.repeat(64)}` }), 'PRI-OFFICIAL-LIVE-CAPABILITY-UNVERIFIED');

{
  const reviewDirectory = deterministicReviewDirectory({ headSha: HEAD, scopeRevision: SCOPE });
  const base = {
    repository: { id: INSPECTOR_REPOSITORY_ID, full_name: INSPECTOR_REPOSITORY, default_branch: 'main' },
    publicationCommit: { sha: '3'.repeat(40), commit: { committer: { date: '2026-07-16T10:30:00Z' } } },
    currentMainCommit: { sha: '4'.repeat(40) },
    ancestry: { status: 'ahead', base_commit: { sha: '3'.repeat(40) }, merge_base_commit: { sha: '3'.repeat(40) }, head_commit: { sha: '4'.repeat(40) } },
    candidateCommits: [{ sha: '3'.repeat(40) }],
    reviewDirectory,
    directoryListing: [...['review-package.json', 'DECISION_PROJECTION.json', 'OWNER_DECISION_CARD.fa.md', 'TECHNICAL_HANDOFF.en.md', 'OWNER_RESULT.fa.txt', 'artifact-manifest.json']].map((name) => ({ type: 'file', name })),
    headSha: HEAD,
    scopeRevision: SCOPE,
  };
  record('official Inspector provenance accepted', verifyInspectorReviewProvenancePayloads(base).diagnostics.length === 0);
  const wrongRepo = clone(base); wrongRepo.repository.full_name = 'attacker/PR-Inspector';
  expectDiagnostic('wrong Inspector repository rejected', verifyInspectorReviewProvenancePayloads(wrongRepo).diagnostics, 'PRI-OFFICIAL-REPOSITORY-IDENTITY-MISMATCH');
  const wrongId = clone(base); wrongId.repository.id = 999;
  expectDiagnostic('wrong Inspector repository ID rejected', verifyInspectorReviewProvenancePayloads(wrongId).diagnostics, 'PRI-OFFICIAL-REPOSITORY-IDENTITY-MISMATCH');
  const offMain = clone(base); offMain.ancestry.status = 'diverged';
  expectDiagnostic('Inspector commit not on official main rejected', verifyInspectorReviewProvenancePayloads(offMain).diagnostics, 'PRI-OFFICIAL-REVIEW-COMMIT-NOT-ON-MAIN');
  const missingDirectory = clone(base); missingDirectory.candidateCommits = [];
  expectDiagnostic('missing review directory rejected', verifyInspectorReviewProvenancePayloads(missingDirectory).diagnostics, 'PRI-OFFICIAL-REVIEW-PUBLICATION-AMBIGUOUS');
}

{
  const root = process.env.PR_INSPECTOR_ROOT;
  if (!root) record('active release snapshot available', false, ['PR_INSPECTOR_ROOT missing']);
  else {
    const readText = (relativePath) => readFileSync(path.join(root, relativePath), 'utf8');
    try {
      const snapshot = verifyActiveProtocolSnapshot(readText);
      record('active v1.10.2 release lock accepted', snapshot.version === PROTOCOL_VERSION && snapshot.lock_entries > 0);
    } catch (error) { record('active v1.10.2 release lock accepted', false, [error.message]); }
    try {
      verifyActiveProtocolSnapshot((relativePath) => relativePath === 'CURRENT_VERSION' ? 'v1.10.1\n' : readText(relativePath));
      record('stale active version rejected', false);
    } catch (error) { record('stale active version rejected', error.message.includes('VERSION-MISMATCH'), [error.message]); }
    try {
      verifyActiveProtocolSnapshot((relativePath) => {
        const text = readText(relativePath);
        return relativePath.endsWith('v1.10.2.sha256') ? text.replace(/^[0-9a-f]/, '0') : text;
      });
      record('invalid active release lock rejected', false);
    } catch (error) { record('invalid active release lock rejected', error.message.includes('LOCK-HASH-MISMATCH'), [error.message]); }
  }
}

{
  const descriptor = positiveCi.evidence;
  const aggregate = aggregateAuthoritativeCi({ exactHeadSha: HEAD, event: 'pull_request', descriptors: [descriptor], requiredPaths: [AUTHORITATIVE_WORKFLOWS.sequence.path] });
  record('verified CI aggregate accepted', aggregate.diagnostics.length === 0);
  const mainDescriptorInput = ciFixture(AUTHORITATIVE_WORKFLOWS.main);
  mainDescriptorInput.runs[0].event = 'push';
  mainDescriptorInput.allRepositoryRuns[0].event = 'push';
  const mainDescriptor = verifyWorkflowDescriptorPayloads({
    repository: REPOSITORY, repositoryId: REPOSITORY_ID, exactHeadSha: HEAD, event: 'push',
    expected: AUTHORITATIVE_WORKFLOWS.main, ...mainDescriptorInput,
  });
  expectDiagnostic('current-main movement handled fail-closed', verifyCurrentMainExecution({ beforeSha: HEAD, afterSha: MAIN, eventHeadSha: HEAD, descriptor: mainDescriptor.evidence }).diagnostics, 'AIGOV_BATCH_B_CURRENT_MAIN_MOVED');
}

{
  const enforcement = verifyRepositoryEnforcementPayloads({ branchProtection: { __unavailable: true }, rulesets: { __unavailable: true }, requiredChecks: [{ context: 'Validate MVK', appId: GITHUB_ACTIONS_APP_ID }] });
  expectDiagnostic('unverified required-check settings remain a gate', enforcement.diagnostics, 'AIGOV_BATCH_B_REQUIRED_CHECK_CONFIGURATION_UNVERIFIED');
  record('repository settings enforcement not claimed', enforcement.evidence?.required_check_configuration === 'unverified' && enforcement.evidence?.repository_settings_enforced === 'not_claimed');
}

const validRecovery = JSON.parse(readFileSync('planning/recovery/recovery-execution-program.v1.json', 'utf8'));
{
  const value = clone(validRecovery); value.tasks[8].depends_on.reverse();
  record('reordered recovery dependencies accepted', recoveryProgramDiagnostics(value).length === 0, recoveryProgramDiagnostics(value));
}
{
  const value = clone(validRecovery); value.tasks[8].depends_on.pop();
  expectDiagnostic('missing dependency rejected', recoveryProgramDiagnostics(value), 'RECOVERY_DEPENDENCY_GRAPH_MISMATCH');
}
{
  const value = clone(validRecovery); value.tasks[8].depends_on.push('KREC-001');
  expectDiagnostic('additional dependency rejected', recoveryProgramDiagnostics(value), 'RECOVERY_DEPENDENCY_GRAPH_MISMATCH');
}
{
  const value = clone(validRecovery); value.tasks.pop();
  expectDiagnostic('missing KREC ID rejected', recoveryProgramDiagnostics(value), 'RECOVERY_TASK_SET_MISMATCH');
}
{
  const value = clone(validRecovery); value.tasks.push(clone(value.tasks[0]));
  expectDiagnostic('duplicate KREC ID rejected', recoveryProgramDiagnostics(value), 'RECOVERY_TASK_ID_DUPLICATE');
}
{
  const value = clone(validRecovery); value.tasks.push({ ...clone(value.tasks[0]), task_id: 'KREC-010' });
  expectDiagnostic('additional KREC ID rejected', recoveryProgramDiagnostics(value), 'RECOVERY_TASK_SET_MISMATCH');
}
{
  const value = clone(validRecovery); value.coverage_promotion_effect = 'promoted';
  expectDiagnostic('Coverage promotion rejected', recoveryProgramDiagnostics(value), 'AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
}
{
  const value = clone(validRecovery); value.kroad_supersession_effect = 'superseded';
  expectDiagnostic('KROAD supersession rejected', recoveryProgramDiagnostics(value), 'RECOVERY_KROAD_SUPERSESSION_FORBIDDEN');
}
{
  const value = clone(validRecovery); value.tasks[0].status = 'active';
  expectDiagnostic('KREC activation rejected', recoveryProgramDiagnostics(value), 'RECOVERY_TASK_ACTIVATION_FORBIDDEN');
}

{
  const workflow = readFileSync('.github/workflows/finalize-aigov-batch-b.yml', 'utf8');
  record('Batch B final verifier executed by post-Merge workflow', workflow.includes('workflow_run:')
    && workflow.includes('Validate Main')
    && workflow.includes('node tools/verify-aigov-v3-exact-main.mjs --mode batch-b-final'));
}

{
  const forged = verifyBatchBFinalClosure({
    planId: V4_PLAN_ID,
    batchId: 'BATCH_B',
    repository: REPOSITORY,
    repositoryId: REPOSITORY_ID,
    prNumber: 50,
    headSha: HEAD,
    scopeRevision: SCOPE,
    exactHeadCiGreen: true,
    independentReviewGreen: true,
    currentMainValidationGreen: true,
    requiredCheckConfiguration: true,
    memory: {},
  });
  expectDiagnostic('caller-supplied success booleans rejected', forged.diagnostics, 'AIGOV_BATCH_B_EXACT_HEAD_CI_REQUIRED');
}

const report = {
  suite: 'aigov-v4-prf-050-hardening',
  protocol_version: PROTOCOL_VERSION,
  inspector_release_commit: INSPECTOR_COMMIT,
  status: results.every((item) => item.pass) ? 'pass' : 'fail',
  cases: results,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
