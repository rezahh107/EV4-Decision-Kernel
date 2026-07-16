#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  BATCH_A_EXCEPTION,
  OWNER,
  TARGET_REPOSITORY,
  TARGET_REPOSITORY_ID,
  V3_PLAN_ID,
  verifyBatchAOneTimeReconciliation,
  verifyBatchBFinalClosure,
} from './lib/aigov-v3-closure.mjs';
import { FIXED_ARTIFACTS, PROMPT_ARTIFACT, verifyOfficialReviewDirectory } from './lib/pr-inspector-v1101.mjs';

const ROOT = process.cwd();
const API = 'https://api.github.com';
const INSPECTOR_REPOSITORY = 'rezahh107/PR-Inspector';
const INSPECTOR_REPOSITORY_ID = 1288323264;
const EXPECTED_V3_BASE = BATCH_A_EXCEPTION.mergeCommitSha;

function parseArgs(argv) {
  const out = { mode: null, exceptionPlanId: null, prNumber: null, headSha: null, mergeCommitSha: null, scopeRevision: null, reviewCommit: null, reviewDirectory: null, output: null };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--mode') out.mode = argv[++i];
    else if (arg === '--exception-plan-id') out.exceptionPlanId = argv[++i];
    else if (arg === '--pr-number') out.prNumber = Number(argv[++i]);
    else if (arg === '--head-sha') out.headSha = argv[++i];
    else if (arg === '--merge-commit-sha') out.mergeCommitSha = argv[++i];
    else if (arg === '--scope-revision') out.scopeRevision = argv[++i];
    else if (arg === '--review-commit') out.reviewCommit = argv[++i];
    else if (arg === '--review-directory') out.reviewDirectory = argv[++i];
    else if (arg === '--output') out.output = argv[++i];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['batch-a-v3-reconcile', 'batch-b-final'].includes(out.mode)) throw new Error('--mode must be batch-a-v3-reconcile or batch-b-final.');
  return out;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function isAncestor(ancestor, descendant) {
  try { execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: ROOT, stdio: 'ignore' }); return true; } catch { return false; }
}
function sha256(raw) { return crypto.createHash('sha256').update(raw).digest('hex'); }
function encodedPath(value) { return value.split('/').map(encodeURIComponent).join('/'); }

async function githubJson(apiPath) {
  const headers = { Accept: 'application/vnd.github+json', 'User-Agent': 'ev4-aigov-v3-exact-main', 'X-GitHub-Api-Version': '2022-11-28' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  const response = await fetch(`${API}${apiPath}`, { headers, redirect: 'error' });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${apiPath}`);
  return { value: await response.json(), observedAt: new Date().toISOString(), url: `${API}${apiPath}` };
}

async function githubContent(repository, artifactPath, ref) {
  const response = await githubJson(`/repos/${repository}/contents/${encodedPath(artifactPath)}?ref=${encodeURIComponent(ref)}`);
  const item = response.value;
  if (item?.type !== 'file' || item.encoding !== 'base64') throw new Error(`Immutable file unavailable: ${repository}@${ref}:${artifactPath}`);
  const raw = Buffer.from(String(item.content).replace(/\n/g, ''), 'base64');
  return { repository, path: artifactPath, ref, blobSha: item.sha, sha256: sha256(raw), raw, json: artifactPath.endsWith('.json') ? JSON.parse(raw.toString('utf8')) : null, apiUrl: response.url };
}

async function workflowEvidence(headSha, requiredNames, event) {
  const runs = await githubJson(`/repos/${TARGET_REPOSITORY}/actions/runs?head_sha=${headSha}&event=${event}&status=completed&per_page=100`);
  const byName = new Map();
  for (const run of runs.value.workflow_runs || []) {
    if (!byName.has(run.name) || Date.parse(run.updated_at) > Date.parse(byName.get(run.name).updated_at)) byName.set(run.name, run);
  }
  const selected = requiredNames.map((name) => byName.get(name)).filter(Boolean);
  return {
    green: selected.length === requiredNames.length && selected.every((run) => run.status === 'completed' && run.conclusion === 'success' && run.head_sha === headSha),
    runs: selected.map((run) => ({ id: run.id, name: run.name, conclusion: run.conclusion, head_sha: run.head_sha, completed_at: run.updated_at, html_url: run.html_url })),
    completedAt: selected.length ? new Date(Math.max(...selected.map((run) => Date.parse(run.updated_at)))).toISOString() : null,
  };
}

function currentMemoryState() {
  const next = readFileSync(path.join(ROOT, 'planning/NEXT_WORK.md'), 'utf8');
  const coverageNonPromoted = /not_measurable_pending_external_promotion/.test(next)
    && (/Coverage promotion effect:\s*`none`/i.test(next)
      || /coverage_promotion_effect:\s*none/i.test(next)
      || /external project-owner governance approval carrier.*missing/is.test(next));
  const productInactive = /Product effect:\s*`none`/i.test(next)
    || /product_effect:\s*none/i.test(next)
    || /Product implementation.*blocked/is.test(next);
  return {
    coverageStatus: /not_measurable_pending_external_promotion/.test(next) ? 'not_measurable_pending_external_promotion' : 'unknown',
    coveragePromotionEffect: coverageNonPromoted ? 'none' : 'unknown',
    productEffect: productInactive ? 'none' : 'unknown',
    kroad012Status: /KROAD-012.*(?:preserved|blocked_pending_final_aigov_closure|blocked_by_governance_adoption)/is.test(next) ? 'preserved' : 'unknown',
    kroad013Through018Status: /KROAD-013 through KROAD-018.*(?:not_started|remain preserved)/is.test(next) ? 'not_started' : 'unknown',
    kroad012rStatus: /KROAD-012R.*historical_non_authoritative/is.test(next) ? 'historical_non_authoritative' : 'unknown',
  };
}

async function loadOfficialReview({ prNumber, headSha, scopeRevision, reviewCommit, reviewDirectory }) {
  if (!/^[0-9a-f]{40}$/.test(reviewCommit || '') || !reviewDirectory) throw new Error('Exact --review-commit and --review-directory are required for Batch B.');
  const inspectorRepo = await githubJson(`/repos/${INSPECTOR_REPOSITORY}`);
  const inspectorCommit = await githubJson(`/repos/${INSPECTOR_REPOSITORY}/commits/${reviewCommit}`);
  if (inspectorRepo.value.id !== INSPECTOR_REPOSITORY_ID || inspectorCommit.value.sha !== reviewCommit) throw new Error('Inspector identity unavailable.');
  const listing = await githubJson(`/repos/${INSPECTOR_REPOSITORY}/contents/${encodedPath(reviewDirectory)}?ref=${reviewCommit}`);
  if (!Array.isArray(listing.value)) throw new Error('Review directory is not immutable directory content.');
  const allowed = new Set([...FIXED_ARTIFACTS, PROMPT_ARTIFACT]);
  const paths = listing.value.filter((item) => item.type === 'file' && allowed.has(item.name)).map((item) => `${reviewDirectory}/${item.name}`);
  const artifacts = await Promise.all(paths.map((artifactPath) => githubContent(INSPECTOR_REPOSITORY, artifactPath, reviewCommit)));
  const directory = verifyOfficialReviewDirectory({ artifacts, context: { repository: TARGET_REPOSITORY, prNumber, headSha }, live: true });
  const reviewPackage = artifacts.find((item) => path.basename(item.path) === 'review-package.json')?.json;
  const projection = directory.projection;
  const reviewedAt = reviewPackage?.review_identity?.review_completed || null;
  const pathScope = reviewDirectory.match(/\/([0-9a-f]{64})(?:\/)?$/)?.[1];
  const reviewScope = reviewPackage?.scope?.scope_revision || reviewPackage?.review_identity?.scope_revision || (pathScope ? `sha256:${pathScope}` : null);
  const green = directory.status === 'pass'
    && projection?.technical_status === 'GREEN_TECHNICALLY_READY'
    && projection?.next_action?.kind === 'merge_now'
    && directory.liveSummary?.sequence_capability_verified === true
    && reviewPackage?.review_identity?.reviewed_head_sha === headSha
    && reviewPackage?.review_identity?.pr_number === prNumber;
  return {
    green,
    reviewedAt,
    reviewedHeadSha: reviewPackage?.review_identity?.reviewed_head_sha || null,
    reviewedScopeRevision: reviewScope,
    reviewerIdentity: `PR-Inspector@v1.10.1:${reviewCommit}`,
    diagnostics: directory.diagnostics,
    hashes: directory.hashes,
  };
}

async function batchA(args) {
  const [repo, pr, main] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/pulls/${BATCH_A_EXCEPTION.prNumber}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`),
  ]);
  const ci = await workflowEvidence(BATCH_A_EXCEPTION.headSha, ['Behavioral Coverage Audit', 'Validate rereview sequence enforcement', 'Validate MVK', 'Finalize AIGOV post-CI evidence'], 'pull_request');
  const mainValidation = await workflowEvidence(main.value.sha, ['Validate Main'], 'push');
  const memory = currentMemoryState();
  const input = {
    repository: repo.value.full_name,
    repositoryId: repo.value.id,
    batchId: 'BATCH_A',
    prNumber: args.prNumber,
    headSha: args.headSha,
    mergeCommitSha: args.mergeCommitSha,
    exceptionPlanId: args.exceptionPlanId,
    exceptionUseCount: 1,
    exceptionReusable: false,
    prMerged: pr.value.merged === true,
    mergeActor: pr.value.merged_by?.login || null,
    headAncestorVerified: isAncestor(BATCH_A_EXCEPTION.headSha, main.value.sha),
    mergeAncestorVerified: isAncestor(BATCH_A_EXCEPTION.mergeCommitSha, main.value.sha),
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
  if (main.value.sha !== EXPECTED_V3_BASE) result.diagnostics.push('AIGOV_V3_PLAN_BASE_STALE');
  result.status = result.diagnostics.length ? 'fail' : 'pass';
  return { ...result, plan_id: V3_PLAN_ID, repository: TARGET_REPOSITORY, pr_number: BATCH_A_EXCEPTION.prNumber, final_head_sha: BATCH_A_EXCEPTION.headSha, merge_commit_sha: BATCH_A_EXCEPTION.mergeCommitSha, current_main_sha: main.value.sha, merge_actor: pr.value.merged_by?.login || null, exact_head_ci: ci, current_main_validation: mainValidation, reason_for_exception: 'impossible_retrospective_review_cycle' };
}

async function batchB(args) {
  if (!Number.isInteger(args.prNumber) || !/^[0-9a-f]{40}$/.test(args.headSha || '') || !/^sha256:[0-9a-f]{64}$/.test(args.scopeRevision || '')) throw new Error('Batch B requires exact --pr-number, --head-sha and --scope-revision.');
  const [pr, main, review] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}/pulls/${args.prNumber}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`),
    loadOfficialReview(args),
  ]);
  const ci = await workflowEvidence(args.headSha, ['Behavioral Coverage Audit', 'Validate rereview sequence enforcement', 'Validate MVK'], 'pull_request');
  const mainValidation = await workflowEvidence(main.value.sha, ['Validate Main'], 'push');
  const memory = currentMemoryState();
  const input = {
    planId: V3_PLAN_ID,
    batchId: 'BATCH_B',
    exceptionApplied: false,
    headSha: args.headSha,
    scopeRevision: args.scopeRevision,
    exactHeadCiGreen: ci.green,
    independentReviewGreen: review.green && review.reviewedAt && (!ci.completedAt || Date.parse(review.reviewedAt) > Date.parse(ci.completedAt)),
    reviewedHeadSha: review.reviewedHeadSha,
    reviewedScopeRevision: review.reviewedScopeRevision,
    reviewerIdentity: review.reviewerIdentity,
    implementerIdentity: pr.value.user?.login || OWNER,
    reviewedAt: review.reviewedAt,
    mergedAt: pr.value.merged_at,
    mergeActor: pr.value.merged_by?.login || null,
    reviewedHeadAncestorVerified: isAncestor(args.headSha, main.value.sha),
    mergeCommitAncestorVerified: isAncestor(pr.value.merge_commit_sha, main.value.sha),
    currentMainValidationGreen: mainValidation.green,
    coverageStatus: memory.coverageStatus,
    coveragePromotionEffect: memory.coveragePromotionEffect,
    productEffect: memory.productEffect,
  };
  const result = verifyBatchBFinalClosure(input);
  return { ...result, plan_id: V3_PLAN_ID, repository: TARGET_REPOSITORY, pr_number: args.prNumber, head_sha: args.headSha, scope_revision: args.scopeRevision, merge_commit_sha: pr.value.merge_commit_sha, current_main_sha: main.value.sha, exact_head_ci: ci, independent_review: review, current_main_validation: mainValidation };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = args.mode === 'batch-a-v3-reconcile' ? await batchA(args) : await batchB(args);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) writeFileSync(path.resolve(ROOT, args.output), output);
  process.stdout.write(output);
  if (result.status !== 'pass') process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main().catch((error) => {
  console.error(JSON.stringify({ status: 'fail', diagnostics: [`AIGOV_V3_EXACT_MAIN_INTERNAL_ERROR:${error.message}`] }, null, 2));
  process.exitCode = 1;
});
