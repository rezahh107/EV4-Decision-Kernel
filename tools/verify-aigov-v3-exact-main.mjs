#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalSha256 } from './lib/aigov-lifecycle.mjs';
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
  FIXED_ARTIFACTS,
  INSPECTOR_REPOSITORY,
  PROMPT_ARTIFACT,
  deterministicReviewDirectory,
  verifyInspectorReviewProvenancePayloads,
  verifyOfficialReviewDirectory,
  verifyOfficialReviewEvidence,
} from './lib/pr-inspector-v1102.mjs';
import {
  BATCH_A_EXCEPTION,
  TARGET_REPOSITORY,
  TARGET_REPOSITORY_ID,
  V4_PLAN_ID,
  verifyBatchAOneTimeReconciliation,
  verifyBatchBFinalClosure,
} from './lib/aigov-v3-closure.mjs';

const ROOT = process.cwd();
const API = 'https://api.github.com';
const EXPECTED_V4_BASE = BATCH_A_EXCEPTION.mergeCommitSha;
const REQUIRED_BATCH_B_WORKFLOWS = [
  AUTHORITATIVE_WORKFLOWS.behavioral,
  AUTHORITATIVE_WORKFLOWS.sequence,
  AUTHORITATIVE_WORKFLOWS.mvk,
];
const REQUIRED_MERGE_CHECKS = REQUIRED_BATCH_B_WORKFLOWS.map((item) => ({ context: item.checkName, appId: GITHUB_ACTIONS_APP_ID }));

function parseArgs(argv) {
  const out = { mode: null, exceptionPlanId: null, prNumber: null, baseSha: null, headSha: null, mergeCommitSha: null, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--mode') out.mode = argv[++index];
    else if (arg === '--exception-plan-id') out.exceptionPlanId = argv[++index];
    else if (arg === '--pr-number') out.prNumber = Number(argv[++index]);
    else if (arg === '--base-sha') out.baseSha = argv[++index];
    else if (arg === '--head-sha') out.headSha = argv[++index];
    else if (arg === '--merge-commit-sha') out.mergeCommitSha = argv[++index];
    else if (arg === '--output') out.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['batch-a-v4-reconcile', 'batch-b-final'].includes(out.mode)) throw new Error('--mode must be batch-a-v4-reconcile or batch-b-final.');
  return out;
}

function encodedPath(value) { return value.split('/').map(encodeURIComponent).join('/'); }
function validSha(value) { return /^[0-9a-f]{40}$/.test(value || ''); }

async function githubJson(apiPath, { optional = false } = {}) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ev4-aigov-v4-exact-main', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.AIGOV_GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.AIGOV_GITHUB_TOKEN}`;
  const response = await fetch(`${API}${apiPath}`, { headers, redirect: 'error' });
  if (!response.ok) {
    if (optional && [403, 404].includes(response.status)) return { value: { __unavailable: true, status: response.status }, observedAt: new Date().toISOString(), url: `${API}${apiPath}` };
    throw new Error(`GitHub API ${response.status}: ${apiPath}`);
  }
  let value;
  try { value = await response.json(); } catch { throw new Error(`Malformed GitHub JSON: ${apiPath}`); }
  return { value, observedAt: new Date().toISOString(), url: `${API}${apiPath}` };
}

async function githubContent(repository, artifactPath, ref) {
  const response = await githubJson(`/repos/${repository}/contents/${encodedPath(artifactPath)}?ref=${encodeURIComponent(ref)}`);
  const item = response.value;
  if (item?.type !== 'file' || item.encoding !== 'base64') throw new Error(`Immutable file unavailable: ${repository}@${ref}:${artifactPath}`);
  const raw = Buffer.from(String(item.content).replace(/\n/g, ''), 'base64');
  return { repository, path: artifactPath, ref, blobSha: item.sha, raw, json: artifactPath.endsWith('.json') ? JSON.parse(raw.toString('utf8')) : null, apiUrl: response.url };
}

async function compare(repository, base, head) { return githubJson(`/repos/${repository}/compare/${base}...${head}`); }
function isBaseAncestor(comparePayload) { return ['ahead', 'identical'].includes(comparePayload.value.status); }

async function legacyWorkflowEvidence(headSha, requiredNames, event) {
  const runs = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/runs?head_sha=${headSha}&event=${event}&status=completed&per_page=100`);
  const selected = [];
  for (const name of requiredNames) {
    const candidates = (runs.value.workflow_runs || []).filter((run) => run.name === name && run.head_sha === headSha && run.event === event);
    if (candidates.length !== 1) return { green: false, runs: [], completedAt: null, diagnostics: [`AIGOV_V4_BATCH_A_HISTORICAL_RUN_${candidates.length ? 'AMBIGUOUS' : 'MISSING'}:${name}`] };
    selected.push(candidates[0]);
  }
  const green = selected.every((run) => run.status === 'completed' && run.conclusion === 'success');
  const times = selected.map((run) => Date.parse(run.updated_at)).filter(Number.isFinite);
  return {
    green,
    runs: selected.map((run) => ({ id: run.id, workflow_id: run.workflow_id, name: run.name, path: run.path, event: run.event, conclusion: run.conclusion, head_sha: run.head_sha, completed_at: run.updated_at, html_url: run.html_url })),
    completedAt: times.length === selected.length ? new Date(Math.max(...times)).toISOString() : null,
    diagnostics: green ? [] : ['AIGOV_V4_BATCH_A_HISTORICAL_CI_UNVERIFIED'],
  };
}

function deriveMemoryState(nextWork, historicalReview, recovery) {
  const tasks = Array.isArray(recovery?.tasks) ? recovery.tasks : [];
  const allKrecRegistered = tasks.length === 9 && tasks.every((task, index) => task.task_id === `KREC-${String(index + 1).padStart(3, '0')}` && task.status === 'registered_planned_task');
  return {
    coverageStatus: /not_measurable_pending_external_promotion/.test(nextWork) ? 'not_measurable_pending_external_promotion' : 'unknown',
    coveragePromotionEffect: /coverage_promotion_effect:\s*none/i.test(nextWork) && recovery?.coverage_promotion_effect === 'none' ? 'none' : 'unknown',
    coverageCredit: tasks.length === 9 && tasks.every((task) => task.coverage_credit === false),
    productEffect: /product_effect:\s*none/i.test(nextWork) && recovery?.product_effect === 'none' ? 'none' : 'unknown',
    externalRepositoryEffect: /external_repository_effect:\s*none/i.test(nextWork) ? 'none' : 'unknown',
    kroad012Status: /KROAD-012.*(?:preserved|blocked_pending_final_aigov_closure)/is.test(nextWork) ? 'preserved' : 'unknown',
    kroad013Through018Status: /KROAD-013(?:_through_| through )KROAD-018.*not_started/is.test(nextWork) ? 'not_started' : 'unknown',
    kroad012rStatus: /historical_non_authoritative/.test(historicalReview) && recovery?.kroad_012r_status === 'historical_non_authoritative' ? 'historical_non_authoritative' : 'unknown',
    recoveryProgramStatus: recovery?.program_status || 'unknown',
    krecStatus: allKrecRegistered ? 'registered_planned_task' : 'unknown',
    implementationAuthorized: tasks.length === 9 && tasks.every((task) => task.implementation_authorized === false),
    readinessClaim: tasks.length === 9 && tasks.every((task) => task.readiness_claim === false),
    historicalIndependentGreenReceiptForPr49: /historical_independent_green_receipt:\s*not_claimed/.test(nextWork) ? 'not_claimed' : 'unknown',
    pr49ExceptionReusable: /exception_reusable:\s*false/.test(nextWork) ? false : null,
    pr49ExceptionPrecedential: /exception_precedential:\s*false/.test(nextWork) ? false : null,
  };
}

async function memoryStateAt(ref) {
  const [nextWork, historicalReview, recovery] = await Promise.all([
    githubContent(TARGET_REPOSITORY, 'planning/NEXT_WORK.md', ref),
    githubContent(TARGET_REPOSITORY, 'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md', ref),
    githubContent(TARGET_REPOSITORY, 'planning/recovery/recovery-execution-program.v1.json', ref),
  ]);
  return deriveMemoryState(nextWork.raw.toString('utf8'), historicalReview.raw.toString('utf8'), recovery.json);
}

async function fetchAuthoritativeDescriptor(expected, headSha, event, { expectedRunId = null } = {}) {
  const workflow = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/workflows/${encodeURIComponent(path.posix.basename(expected.path))}`);
  const allRuns = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/runs?head_sha=${headSha}&event=${event}&per_page=100`);
  let workflowRuns;
  if (expectedRunId == null) workflowRuns = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/workflows/${workflow.value.id}/runs?head_sha=${headSha}&event=${event}&per_page=100`);
  else {
    const direct = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/runs/${expectedRunId}`);
    workflowRuns = { value: { workflow_runs: [direct.value] } };
  }
  const runs = workflowRuns.value?.workflow_runs;
  if (!Array.isArray(runs)) throw new Error(`Malformed workflow run list: ${expected.path}`);
  const exactCandidates = runs.filter((run) => run?.head_sha === headSha && run?.event === event && (expectedRunId == null || run.id === expectedRunId));
  if (exactCandidates.length !== 1) throw new Error(`Authoritative workflow candidate ${exactCandidates.length ? 'ambiguous' : 'missing'}: ${expected.path}`);
  const run = exactCandidates[0];
  const jobs = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`);
  if (!Array.isArray(jobs.value?.jobs)) throw new Error(`Malformed job payload: ${expected.path}`);
  const checks = await Promise.all(jobs.value.jobs.map((job) => githubJson(`/repos/${TARGET_REPOSITORY}/check-runs/${job.id}`)));
  const result = verifyWorkflowDescriptorPayloads({ repository: TARGET_REPOSITORY, repositoryId: TARGET_REPOSITORY_ID, exactHeadSha: headSha, event, expected, workflow: workflow.value, runs, allRepositoryRuns: allRuns.value?.workflow_runs, jobs: jobs.value.jobs, checkRuns: checks.map((item) => item.value), expectedRunId });
  if (result.diagnostics.length) throw new Error(`${expected.path}:${result.diagnostics.join(',')}`);
  return result.evidence;
}

async function exactHeadCiEvidence(headSha) {
  const descriptors = await Promise.all(REQUIRED_BATCH_B_WORKFLOWS.map((item) => fetchAuthoritativeDescriptor(item, headSha, 'pull_request')));
  const result = aggregateAuthoritativeCi({ exactHeadSha: headSha, event: 'pull_request', descriptors, requiredPaths: REQUIRED_BATCH_B_WORKFLOWS.map((item) => item.path) });
  if (result.diagnostics.length) throw new Error(`AIGOV_BATCH_B_EXACT_HEAD_CI:${result.diagnostics.join(',')}`);
  return result.evidence;
}

async function officialReviewEvidence({ headSha, scopeRevision, exactHeadCi, mergedAt }) {
  const reviewDirectory = deterministicReviewDirectory({ headSha, scopeRevision });
  const reviewPackagePath = `${reviewDirectory}/review-package.json`;
  const candidates = await githubJson(`/repos/${INSPECTOR_REPOSITORY}/commits?path=${encodeURIComponent(reviewPackagePath)}&sha=main&per_page=100`);
  if (!Array.isArray(candidates.value) || candidates.value.length !== 1) throw new Error(`Official review publication ${Array.isArray(candidates.value) && candidates.value.length ? 'ambiguous' : 'missing'}.`);
  const publicationCommit = candidates.value[0];
  const [repository, currentMainCommit, publication, ancestry, listing] = await Promise.all([
    githubJson(`/repos/${INSPECTOR_REPOSITORY}`),
    githubJson(`/repos/${INSPECTOR_REPOSITORY}/commits/main`),
    githubJson(`/repos/${INSPECTOR_REPOSITORY}/commits/${publicationCommit.sha}`),
    compare(INSPECTOR_REPOSITORY, publicationCommit.sha, 'main'),
    githubJson(`/repos/${INSPECTOR_REPOSITORY}/contents/${encodedPath(reviewDirectory)}?ref=${publicationCommit.sha}`),
  ]);
  const provenance = verifyInspectorReviewProvenancePayloads({ repository: repository.value, publicationCommit: publication.value, currentMainCommit: currentMainCommit.value, ancestry: ancestry.value, candidateCommits: candidates.value, reviewDirectory, directoryListing: listing.value, headSha, scopeRevision });
  if (provenance.diagnostics.length) throw new Error(`Official review provenance invalid: ${provenance.diagnostics.join(',')}`);
  const allowed = new Set([...FIXED_ARTIFACTS, PROMPT_ARTIFACT]);
  const paths = listing.value.filter((item) => item.type === 'file' && allowed.has(item.name)).map((item) => `${reviewDirectory}/${item.name}`);
  const artifacts = await Promise.all(paths.map((artifactPath) => githubContent(INSPECTOR_REPOSITORY, artifactPath, publicationCommit.sha)));
  const directory = verifyOfficialReviewDirectory({ artifacts, context: { repository: TARGET_REPOSITORY, prNumber: 50, headSha, scopeRevision }, live: true });
  const review = verifyOfficialReviewEvidence({ directoryEvidence: directory, provenanceEvidence: provenance.evidence, exactHeadCi, headSha, scopeRevision, mergedAt });
  if (review.diagnostics.length) throw new Error(`Official review invalid: ${review.diagnostics.join(',')}`);
  return review.evidence;
}

async function repositoryEnforcementEvidence() {
  const branchProtection = await githubJson(`/repos/${TARGET_REPOSITORY}/branches/main/protection`, { optional: true });
  const rulesetList = await githubJson(`/repos/${TARGET_REPOSITORY}/rulesets?includes_parents=true&targets=branch&per_page=100`, { optional: true });
  let rulesets = rulesetList.value;
  if (Array.isArray(rulesets)) rulesets = await Promise.all(rulesets.map(async (item) => Number.isInteger(item.id) ? (await githubJson(`/repos/${TARGET_REPOSITORY}/rulesets/${item.id}`, { optional: true })).value : item));
  return verifyRepositoryEnforcementPayloads({ branchProtection: branchProtection.value, rulesets, requiredChecks: REQUIRED_MERGE_CHECKS });
}

function scopeRevision(scope) {
  const projection = structuredClone(scope);
  delete projection.scope_revision;
  return `sha256:${canonicalSha256(projection)}`;
}

function workflowRunEvent() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH is required for batch-b-final.');
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const source = event.workflow_run;
  if (event.action !== 'completed'
    || event.repository?.id !== TARGET_REPOSITORY_ID
    || event.repository?.full_name !== TARGET_REPOSITORY
    || source?.name !== AUTHORITATIVE_WORKFLOWS.main.name
    || source?.path !== AUTHORITATIVE_WORKFLOWS.main.path
    || source?.event !== 'push'
    || source?.status !== 'completed'
    || source?.conclusion !== 'success'
    || !Number.isInteger(source?.id)
    || !validSha(source?.head_sha)) throw new Error('AIGOV_BATCH_B_WORKFLOW_RUN_EVENT_UNTRUSTED');
  return source;
}

async function batchA(args) {
  const requestedTupleMatches = args.exceptionPlanId === V4_PLAN_ID && args.prNumber === BATCH_A_EXCEPTION.prNumber && args.baseSha === BATCH_A_EXCEPTION.baseSha && args.headSha === BATCH_A_EXCEPTION.headSha && args.mergeCommitSha === BATCH_A_EXCEPTION.mergeCommitSha;
  const [repo, pr, main] = await Promise.all([githubJson(`/repos/${TARGET_REPOSITORY}`), githubJson(`/repos/${TARGET_REPOSITORY}/pulls/${BATCH_A_EXCEPTION.prNumber}`), githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`)]);
  const [headGit, mergeGit, headToMerge, mergeToMain, ci, mainValidation, memory] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${pr.value.head?.sha}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${pr.value.merge_commit_sha}`),
    compare(TARGET_REPOSITORY, pr.value.head?.sha, pr.value.merge_commit_sha),
    compare(TARGET_REPOSITORY, pr.value.merge_commit_sha, main.value.sha),
    legacyWorkflowEvidence(pr.value.head?.sha, ['Behavioral Coverage Audit', 'Validate rereview sequence enforcement', 'Validate MVK', 'Finalize AIGOV post-CI evidence'], 'pull_request'),
    legacyWorkflowEvidence(main.value.sha, ['Validate Main'], 'push'),
    memoryStateAt(main.value.sha),
  ]);
  const headTree = headGit.value.tree?.sha || null;
  const mergeTree = mergeGit.value.tree?.sha || null;
  const singleParentAtBase = mergeGit.value.parents?.length === 1 && mergeGit.value.parents[0]?.sha === pr.value.base?.sha;
  const exactTreeEquality = Boolean(headTree && mergeTree && headTree === mergeTree);
  const mergeMode = singleParentAtBase && Number(pr.value.commits || 0) > 1 && exactTreeEquality ? 'squash' : 'unknown';
  const input = {
    repository: repo.value.full_name, repositoryId: repo.value.id, batchId: 'BATCH_A', prNumber: pr.value.number, baseSha: pr.value.base?.sha, headSha: pr.value.head?.sha, mergeCommitSha: pr.value.merge_commit_sha,
    exceptionPlanId: V4_PLAN_ID, exceptionUseCount: 1, exceptionReusable: false, exceptionPrecedential: false, prMerged: pr.value.merged === true, mergeMode, mergeActor: pr.value.merged_by?.login || null,
    equivalenceMode: 'exact_tree_equality', patchReconstructionSucceeded: null, prHeadTreeSha: headTree, squashCommitTreeSha: mergeTree, contentEquivalenceVerified: exactTreeEquality, mergeAncestorVerified: isBaseAncestor(mergeToMain),
    exactHeadCiGreen: ci.green, currentMainValidationGreen: mainValidation.green, coverageStatus: memory.coverageStatus, coveragePromotionEffect: memory.coveragePromotionEffect, productEffect: memory.productEffect,
    productTaskActivation: false, kroad012rStatus: memory.kroad012rStatus, kroad012Status: memory.kroad012Status, kroad013Through018Status: memory.kroad013Through018Status, historicalIndependentGreenClaimed: false,
  };
  const result = verifyBatchAOneTimeReconciliation(input);
  if (!requestedTupleMatches) result.diagnostics.push('AIGOV_V4_SQUASH_PR_IDENTITY_MISMATCH');
  if (main.value.sha !== EXPECTED_V4_BASE) result.diagnostics.push('AIGOV_V4_PLAN_BASE_STALE');
  result.diagnostics = [...new Set([...result.diagnostics, ...ci.diagnostics, ...mainValidation.diagnostics])];
  result.status = result.diagnostics.length ? 'fail' : 'pass';
  return {
    ...result, plan_id: V4_PLAN_ID, repository: TARGET_REPOSITORY, pr_number: pr.value.number, base_sha: pr.value.base?.sha, final_head_sha: pr.value.head?.sha, pr_head_tree_sha: headTree,
    squash_commit_sha: pr.value.merge_commit_sha, squash_commit_tree_sha: mergeTree, current_main_sha: main.value.sha, merge_actor: pr.value.merged_by?.login || null, equivalence_mode: 'exact_tree_equality',
    strict_ancestry_compare: { status: headToMerge.value.status, ahead_by: headToMerge.value.ahead_by, behind_by: headToMerge.value.behind_by, merge_base_sha: headToMerge.value.merge_base_commit?.sha || null },
    exact_head_ci: ci, current_main_validation: mainValidation, correction_reason: 'github_squash_merge_does_not_preserve_pr_commit_ancestry',
  };
}

async function batchB() {
  const sourceMainRun = workflowRunEvent();
  const mainStart = await githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`);
  if (mainStart.value.sha !== sourceMainRun.head_sha) throw new Error('AIGOV_BATCH_B_CURRENT_MAIN_MOVED');
  const [repository, pr] = await Promise.all([githubJson(`/repos/${TARGET_REPOSITORY}`), githubJson(`/repos/${TARGET_REPOSITORY}/pulls/50`)]);
  const headSha = pr.value.head?.sha;
  if (repository.value.id !== TARGET_REPOSITORY_ID || repository.value.full_name !== TARGET_REPOSITORY || pr.value.number !== 50 || pr.value.merged !== true || !validSha(headSha)) throw new Error('AIGOV_BATCH_B_TARGET_IDENTITY_UNVERIFIED');
  const scopeFile = await githubContent(TARGET_REPOSITORY, 'planning/governance/scopes/aigov-v3-batch-b.scope.json', headSha);
  const scope = scopeFile.json;
  if (scope?.plan_id !== V4_PLAN_ID || scope?.batch_id !== 'BATCH_B' || scope?.repository !== TARGET_REPOSITORY || scope?.base_sha !== EXPECTED_V4_BASE || scope?.scope_revision !== scopeRevision(scope)) throw new Error('AIGOV_BATCH_B_SCOPE_UNVERIFIED');
  const exactHeadCi = await exactHeadCiEvidence(headSha);
  const review = await officialReviewEvidence({ headSha, scopeRevision: scope.scope_revision, exactHeadCi, mergedAt: pr.value.merged_at });
  const [headGit, mergeGit, headToMain, mergeToMain, mainDescriptor, enforcement, memory] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${headSha}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${pr.value.merge_commit_sha}`),
    compare(TARGET_REPOSITORY, headSha, mainStart.value.sha),
    compare(TARGET_REPOSITORY, pr.value.merge_commit_sha, mainStart.value.sha),
    fetchAuthoritativeDescriptor(AUTHORITATIVE_WORKFLOWS.main, sourceMainRun.head_sha, 'push', { expectedRunId: sourceMainRun.id }),
    repositoryEnforcementEvidence(),
    memoryStateAt(mainStart.value.sha),
  ]);
  const merge = verifyMergeResultPayloads({ pr: pr.value, reviewedHeadSha: headSha, headCommit: headGit.value, mergeCommit: mergeGit.value, headToMain: headToMain.value, mergeToMain: mergeToMain.value });
  if (merge.diagnostics.length) throw new Error(`AIGOV_BATCH_B_MERGE_RESULT:${merge.diagnostics.join(',')}`);
  const mainEnd = await githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`);
  const currentMain = verifyCurrentMainExecution({ beforeSha: mainStart.value.sha, afterSha: mainEnd.value.sha, eventHeadSha: sourceMainRun.head_sha, descriptor: mainDescriptor });
  if (currentMain.diagnostics.length) throw new Error(`AIGOV_BATCH_B_CURRENT_MAIN:${currentMain.diagnostics.join(',')}`);
  const result = verifyBatchBFinalClosure({ planId: V4_PLAN_ID, batchId: 'BATCH_B', exceptionApplied: false, repository: TARGET_REPOSITORY, repositoryId: TARGET_REPOSITORY_ID, prNumber: 50, headSha, scopeRevision: scope.scope_revision, exactHeadCiEvidence: exactHeadCi, reviewEvidence: review, mergeEvidence: merge.evidence, currentMainEvidence: currentMain.evidence, enforcementEvidence: enforcement.evidence, memory });
  result.diagnostics = [...new Set([...result.diagnostics, ...enforcement.diagnostics])];
  result.status = result.diagnostics.length ? 'fail' : 'pass';
  return { ...result, plan_id: V4_PLAN_ID, repository: TARGET_REPOSITORY, repository_id: TARGET_REPOSITORY_ID, pr_number: 50, head_sha: headSha, scope_revision: scope.scope_revision, merge_commit_sha: pr.value.merge_commit_sha, current_main_sha: mainStart.value.sha, exact_head_ci: exactHeadCi, independent_review: review, merge_evidence: merge.evidence, current_main_validation: currentMain.evidence, repository_enforcement: enforcement.evidence };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = args.mode === 'batch-a-v4-reconcile' ? await batchA(args) : await batchB();
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) writeFileSync(path.resolve(ROOT, args.output), output);
  process.stdout.write(output);
  if (result.status !== 'pass') process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main().catch((error) => {
  const output = `${JSON.stringify({ status: 'fail', diagnostics: [`AIGOV_V4_EXACT_MAIN_INTERNAL_ERROR:${error.message}`] }, null, 2)}\n`;
  const outputIndex = process.argv.indexOf('--output');
  if (outputIndex >= 0 && process.argv[outputIndex + 1]) writeFileSync(path.resolve(ROOT, process.argv[outputIndex + 1]), output);
  process.stderr.write(output);
  process.exitCode = 1;
});
