#!/usr/bin/env node
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BATCH_A_EXCEPTION,
  OWNER,
  TARGET_REPOSITORY,
  TARGET_REPOSITORY_ID,
  V4_PLAN_ID,
  verifyBatchAOneTimeReconciliation,
  verifyBatchBFinalClosure,
} from './lib/aigov-v3-closure.mjs';
import { FIXED_ARTIFACTS, PROMPT_ARTIFACT, verifyOfficialReviewDirectory } from './lib/pr-inspector-v1101.mjs';

const ROOT = process.cwd();
const API = 'https://api.github.com';
const INSPECTOR_REPOSITORY = 'rezahh107/PR-Inspector';
const INSPECTOR_REPOSITORY_ID = 1288323264;
const EXPECTED_V4_BASE = BATCH_A_EXCEPTION.mergeCommitSha;
const NON_AUTHORITATIVE_RUN_CONCLUSIONS = new Set(['cancelled', 'skipped']);

function parseArgs(argv) {
  const out = { mode: null, exceptionPlanId: null, prNumber: null, baseSha: null, headSha: null, mergeCommitSha: null, scopeRevision: null, reviewCommit: null, reviewDirectory: null, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--mode') out.mode = argv[++index];
    else if (arg === '--exception-plan-id') out.exceptionPlanId = argv[++index];
    else if (arg === '--pr-number') out.prNumber = Number(argv[++index]);
    else if (arg === '--base-sha') out.baseSha = argv[++index];
    else if (arg === '--head-sha') out.headSha = argv[++index];
    else if (arg === '--merge-commit-sha') out.mergeCommitSha = argv[++index];
    else if (arg === '--scope-revision') out.scopeRevision = argv[++index];
    else if (arg === '--review-commit') out.reviewCommit = argv[++index];
    else if (arg === '--review-directory') out.reviewDirectory = argv[++index];
    else if (arg === '--output') out.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['batch-a-v4-reconcile', 'batch-b-final'].includes(out.mode)) throw new Error('--mode must be batch-a-v4-reconcile or batch-b-final.');
  return out;
}
function encodedPath(value) { return value.split('/').map(encodeURIComponent).join('/'); }
async function githubJson(apiPath) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ev4-aigov-v4-exact-main', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.AIGOV_GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.AIGOV_GITHUB_TOKEN}`;
  const response = await fetch(`${API}${apiPath}`, { headers, redirect: 'error' });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${apiPath}`);
  return { value: await response.json(), observedAt: new Date().toISOString(), url: `${API}${apiPath}` };
}
async function githubContent(repository, artifactPath, ref) {
  const response = await githubJson(`/repos/${repository}/contents/${encodedPath(artifactPath)}?ref=${encodeURIComponent(ref)}`);
  const item = response.value;
  if (item?.type !== 'file' || item.encoding !== 'base64') throw new Error(`Immutable file unavailable: ${repository}@${ref}:${artifactPath}`);
  const raw = Buffer.from(String(item.content).replace(/\n/g, ''), 'base64');
  return { repository, path: artifactPath, ref, blobSha: item.sha, raw, json: artifactPath.endsWith('.json') ? JSON.parse(raw.toString('utf8')) : null, apiUrl: response.url };
}
async function workflowEvidence(headSha, requiredNames, event) {
  const runs = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/runs?head_sha=${headSha}&event=${event}&status=completed&per_page=100`);
  const candidatesByName = new Map();
  for (const run of runs.value.workflow_runs || []) {
    if (run.head_sha !== headSha) continue;
    const candidates = candidatesByName.get(run.name) || [];
    candidates.push(run);
    candidatesByName.set(run.name, candidates);
  }
  const selected = requiredNames.map((name) => {
    const candidates = (candidatesByName.get(name) || []).sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
    return candidates.filter((run) => !NON_AUTHORITATIVE_RUN_CONCLUSIONS.has(run.conclusion))[0] || candidates[0];
  }).filter(Boolean);
  return {
    green: selected.length === requiredNames.length && selected.every((run) => run.status === 'completed' && run.conclusion === 'success' && run.head_sha === headSha),
    runs: selected.map((run) => ({ id: run.id, name: run.name, conclusion: run.conclusion, head_sha: run.head_sha, completed_at: run.updated_at, html_url: run.html_url })),
    completedAt: selected.length ? new Date(Math.max(...selected.map((run) => Date.parse(run.updated_at)))).toISOString() : null,
  };
}
function deriveMemoryState(nextWork, historicalReview) {
  const coverageNonPromoted = /not_measurable_pending_external_promotion/.test(nextWork) && (/coverage_promotion_effect:\s*none/i.test(nextWork) || /Coverage promotion effect:\s*`none`/i.test(nextWork) || /external project-owner governance approval carrier.*missing/is.test(nextWork));
  const productInactive = /product_effect:\s*none/i.test(nextWork) || /Product effect:\s*`none`/i.test(nextWork) || /Product implementation.*blocked/is.test(nextWork);
  const laterKroadsPreserved = /KROAD-013(?:_through_| through )KROAD-018.*not_started/is.test(nextWork) || /KROAD-013 through KROAD-018.*(?:retain|remain preserved|not_started)/is.test(nextWork);
  return {
    coverageStatus: /not_measurable_pending_external_promotion/.test(nextWork) ? 'not_measurable_pending_external_promotion' : 'unknown',
    coveragePromotionEffect: coverageNonPromoted ? 'none' : 'unknown',
    productEffect: productInactive ? 'none' : 'unknown',
    kroad012Status: /KROAD-012.*(?:preserved|blocked_pending_final_aigov_closure|blocked_by_governance_adoption|blocked_pending_governance_reauthorization)/is.test(nextWork) ? 'preserved' : 'unknown',
    kroad013Through018Status: laterKroadsPreserved ? 'not_started' : 'unknown',
    kroad012rStatus: /historical_non_authoritative/.test(historicalReview) ? 'historical_non_authoritative' : 'unknown',
  };
}
async function memoryStateAt(ref) {
  const [nextWork, historicalReview] = await Promise.all([
    githubContent(TARGET_REPOSITORY, 'planning/NEXT_WORK.md', ref),
    githubContent(TARGET_REPOSITORY, 'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md', ref),
  ]);
  return deriveMemoryState(nextWork.raw.toString('utf8'), historicalReview.raw.toString('utf8'));
}
async function compare(base, head) { return githubJson(`/repos/${TARGET_REPOSITORY}/compare/${base}...${head}`); }
function isBaseAncestor(comparePayload) { return ['ahead', 'identical'].includes(comparePayload.value.status); }

async function loadOfficialReview({ prNumber, headSha, scopeRevision, reviewCommit, reviewDirectory }) {
  if (!/^[0-9a-f]{40}$/.test(reviewCommit || '') || !reviewDirectory) throw new Error('Exact --review-commit and --review-directory are required for Batch B.');
  const [inspectorRepo, inspectorCommit, listing] = await Promise.all([
    githubJson(`/repos/${INSPECTOR_REPOSITORY}`),
    githubJson(`/repos/${INSPECTOR_REPOSITORY}/commits/${reviewCommit}`),
    githubJson(`/repos/${INSPECTOR_REPOSITORY}/contents/${encodedPath(reviewDirectory)}?ref=${reviewCommit}`),
  ]);
  if (inspectorRepo.value.id !== INSPECTOR_REPOSITORY_ID || inspectorCommit.value.sha !== reviewCommit) throw new Error('Inspector identity unavailable.');
  if (!Array.isArray(listing.value)) throw new Error('Review directory is not immutable directory content.');
  const allowed = new Set([...FIXED_ARTIFACTS, PROMPT_ARTIFACT]);
  const paths = listing.value.filter((item) => item.type === 'file' && allowed.has(item.name)).map((item) => `${reviewDirectory}/${item.name}`);
  const artifacts = await Promise.all(paths.map((artifactPath) => githubContent(INSPECTOR_REPOSITORY, artifactPath, reviewCommit)));
  const directory = verifyOfficialReviewDirectory({ artifacts, context: { repository: TARGET_REPOSITORY, prNumber, headSha }, live: true });
  const reviewPackage = artifacts.find((item) => path.basename(item.path) === 'review-package.json')?.json;
  const projection = directory.projection;
  const reviewedAt = reviewPackage?.review_identity?.review_completed || null;
  const pathScope = reviewDirectory.match(/\/([0-9a-f]{64})(?:\/)?$/)?.[1];
  const reviewedScopeRevision = reviewPackage?.scope?.scope_revision || reviewPackage?.review_identity?.scope_revision || (pathScope ? `sha256:${pathScope}` : null);
  const green = directory.status === 'pass' && projection?.technical_status === 'GREEN_TECHNICALLY_READY' && projection?.next_action?.kind === 'merge_now' && directory.liveSummary?.sequence_capability_verified === true && reviewPackage?.review_identity?.reviewed_head_sha === headSha && reviewPackage?.review_identity?.pr_number === prNumber && reviewedScopeRevision === scopeRevision;
  return { green, reviewedAt, reviewedHeadSha: reviewPackage?.review_identity?.reviewed_head_sha || null, reviewedScopeRevision, reviewerIdentity: `PR-Inspector@v1.10.1:${reviewCommit}`, diagnostics: directory.diagnostics, hashes: directory.hashes };
}

async function batchA(args) {
  const requestedTupleMatches = args.exceptionPlanId === V4_PLAN_ID && args.prNumber === BATCH_A_EXCEPTION.prNumber && args.baseSha === BATCH_A_EXCEPTION.baseSha && args.headSha === BATCH_A_EXCEPTION.headSha && args.mergeCommitSha === BATCH_A_EXCEPTION.mergeCommitSha;
  const [repo, pr, main] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/pulls/${BATCH_A_EXCEPTION.prNumber}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`),
  ]);
  const [headGit, mergeGit, headToMerge, mergeToMain, ci, mainValidation, memory] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${pr.value.head?.sha}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${pr.value.merge_commit_sha}`),
    compare(pr.value.head?.sha, pr.value.merge_commit_sha),
    compare(pr.value.merge_commit_sha, main.value.sha),
    workflowEvidence(pr.value.head?.sha, ['Behavioral Coverage Audit', 'Validate rereview sequence enforcement', 'Validate MVK', 'Finalize AIGOV post-CI evidence'], 'pull_request'),
    workflowEvidence(main.value.sha, ['Validate Main'], 'push'),
    memoryStateAt(main.value.sha),
  ]);
  const headTree = headGit.value.tree?.sha || null;
  const mergeTree = mergeGit.value.tree?.sha || null;
  const singleParentAtBase = mergeGit.value.parents?.length === 1 && mergeGit.value.parents[0]?.sha === pr.value.base?.sha;
  const exactTreeEquality = Boolean(headTree && mergeTree && headTree === mergeTree);
  const mergeMode = singleParentAtBase && Number(pr.value.commits || 0) > 1 && exactTreeEquality ? 'squash' : 'unknown';
  const input = {
    repository: repo.value.full_name,
    repositoryId: repo.value.id,
    batchId: 'BATCH_A',
    prNumber: pr.value.number,
    baseSha: pr.value.base?.sha,
    headSha: pr.value.head?.sha,
    mergeCommitSha: pr.value.merge_commit_sha,
    exceptionPlanId: V4_PLAN_ID,
    exceptionUseCount: 1,
    exceptionReusable: false,
    exceptionPrecedential: false,
    prMerged: pr.value.merged === true,
    mergeMode,
    mergeActor: pr.value.merged_by?.login || null,
    equivalenceMode: 'exact_tree_equality',
    patchReconstructionSucceeded: null,
    prHeadTreeSha: headTree,
    squashCommitTreeSha: mergeTree,
    contentEquivalenceVerified: exactTreeEquality,
    mergeAncestorVerified: isBaseAncestor(mergeToMain),
    exactHeadCiGreen: ci.green,
    currentMainValidationGreen: mainValidation.green,
    coverageStatus: memory.coverageStatus,
    coveragePromotionEffect: memory.coveragePromotionEffect,
    productEffect: memory.productEffect,
    productTaskActivation: false,
    kroad012rStatus: memory.kroad012rStatus,
    kroad012Status: memory.kroad012Status,
    kroad013Through018Status: memory.kroad013Through018Status,
    historicalIndependentGreenClaimed: false,
  };
  const result = verifyBatchAOneTimeReconciliation(input);
  if (!requestedTupleMatches) result.diagnostics.push('AIGOV_V4_SQUASH_PR_IDENTITY_MISMATCH');
  if (main.value.sha !== EXPECTED_V4_BASE) result.diagnostics.push('AIGOV_V4_PLAN_BASE_STALE');
  result.diagnostics = [...new Set(result.diagnostics)];
  result.status = result.diagnostics.length ? 'fail' : 'pass';
  return {
    ...result,
    plan_id: V4_PLAN_ID,
    repository: TARGET_REPOSITORY,
    pr_number: pr.value.number,
    base_sha: pr.value.base?.sha,
    final_head_sha: pr.value.head?.sha,
    pr_head_tree_sha: headTree,
    squash_commit_sha: pr.value.merge_commit_sha,
    squash_commit_tree_sha: mergeTree,
    current_main_sha: main.value.sha,
    merge_actor: pr.value.merged_by?.login || null,
    equivalence_mode: 'exact_tree_equality',
    strict_ancestry_compare: { status: headToMerge.value.status, ahead_by: headToMerge.value.ahead_by, behind_by: headToMerge.value.behind_by, merge_base_sha: headToMerge.value.merge_base_commit?.sha || null },
    exact_head_ci: ci,
    current_main_validation: mainValidation,
    correction_reason: 'github_squash_merge_does_not_preserve_pr_commit_ancestry',
  };
}

async function batchB(args) {
  if (!Number.isInteger(args.prNumber) || !/^[0-9a-f]{40}$/.test(args.headSha || '') || !/^sha256:[0-9a-f]{64}$/.test(args.scopeRevision || '')) throw new Error('Batch B requires exact --pr-number, --head-sha and --scope-revision.');
  const [pr, main, review] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}/pulls/${args.prNumber}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`),
    loadOfficialReview(args),
  ]);
  const [ci, mainValidation, memory, headGit, mergeGit, headToMain, mergeToMain] = await Promise.all([
    workflowEvidence(args.headSha, ['Behavioral Coverage Audit', 'Validate rereview sequence enforcement', 'Validate MVK'], 'pull_request'),
    workflowEvidence(main.value.sha, ['Validate Main'], 'push'),
    memoryStateAt(main.value.sha),
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${args.headSha}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${pr.value.merge_commit_sha}`),
    compare(args.headSha, main.value.sha),
    compare(pr.value.merge_commit_sha, main.value.sha),
  ]);
  const headTree = headGit.value.tree?.sha || null;
  const mergeTree = mergeGit.value.tree?.sha || null;
  const parents = mergeGit.value.parents || [];
  let mergeMode = 'unknown';
  if (parents.some((parent) => parent.sha === args.headSha)) mergeMode = 'merge';
  else if (headTree && mergeTree && headTree === mergeTree && parents.length === 1 && parents[0]?.sha === pr.value.base?.sha && Number(pr.value.commits || 0) > 1) mergeMode = 'squash';
  else if (headTree && mergeTree && headTree === mergeTree && parents.length === 1) mergeMode = 'rebase';
  const input = {
    planId: V4_PLAN_ID,
    batchId: 'BATCH_B',
    exceptionApplied: false,
    headSha: args.headSha,
    scopeRevision: args.scopeRevision,
    exactHeadCiGreen: ci.green && pr.value.head?.sha === args.headSha,
    independentReviewGreen: review.green && review.reviewedAt && (!ci.completedAt || Date.parse(review.reviewedAt) > Date.parse(ci.completedAt)),
    reviewedHeadSha: review.reviewedHeadSha,
    reviewedScopeRevision: review.reviewedScopeRevision,
    reviewerIdentity: review.reviewerIdentity,
    implementerIdentity: pr.value.user?.login || OWNER,
    reviewedAt: review.reviewedAt,
    mergedAt: pr.value.merged_at,
    mergeActor: pr.value.merged_by?.login || null,
    mergeMode,
    reviewedHeadAncestorVerified: isBaseAncestor(headToMain),
    resultTreeEquivalent: Boolean(headTree && mergeTree && headTree === mergeTree),
    mergeCommitAncestorVerified: isBaseAncestor(mergeToMain),
    currentMainValidationGreen: mainValidation.green,
    coverageStatus: memory.coverageStatus,
    coveragePromotionEffect: memory.coveragePromotionEffect,
    productEffect: memory.productEffect,
  };
  const result = verifyBatchBFinalClosure(input);
  return { ...result, plan_id: V4_PLAN_ID, repository: TARGET_REPOSITORY, pr_number: args.prNumber, head_sha: args.headSha, reviewed_head_tree_sha: headTree, scope_revision: args.scopeRevision, merge_mode: mergeMode, merge_commit_sha: pr.value.merge_commit_sha, merge_result_tree_sha: mergeTree, current_main_sha: main.value.sha, exact_head_ci: ci, independent_review: review, current_main_validation: mainValidation };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = args.mode === 'batch-a-v4-reconcile' ? await batchA(args) : await batchB(args);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) writeFileSync(path.resolve(ROOT, args.output), output);
  process.stdout.write(output);
  if (result.status !== 'pass') process.exitCode = 1;
}
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main().catch((error) => { console.error(JSON.stringify({ status: 'fail', diagnostics: [`AIGOV_V4_EXACT_MAIN_INTERNAL_ERROR:${error.message}`] }, null, 2)); process.exitCode = 1; });
