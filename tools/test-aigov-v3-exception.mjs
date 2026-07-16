#!/usr/bin/env node
import {
  BATCH_A_EXCEPTION,
  OWNER,
  TARGET_REPOSITORY,
  TARGET_REPOSITORY_ID,
  V4_PLAN_ID,
  compareCanonicalTrees,
  verifyBatchAOneTimeReconciliation,
  verifyBatchBFinalClosure,
} from './lib/aigov-v3-closure.mjs';

const TREE = '8a8c83aee95ab36ab59ba128c7710bafedaa2d20';
const baseA = () => ({
  repository: TARGET_REPOSITORY,
  repositoryId: TARGET_REPOSITORY_ID,
  batchId: 'BATCH_A',
  prNumber: BATCH_A_EXCEPTION.prNumber,
  baseSha: BATCH_A_EXCEPTION.baseSha,
  headSha: BATCH_A_EXCEPTION.headSha,
  mergeCommitSha: BATCH_A_EXCEPTION.mergeCommitSha,
  exceptionPlanId: V4_PLAN_ID,
  exceptionUseCount: 1,
  exceptionReusable: false,
  exceptionPrecedential: false,
  prMerged: true,
  mergeMode: 'squash',
  mergeActor: OWNER,
  equivalenceMode: 'exact_tree_equality',
  patchReconstructionSucceeded: null,
  prHeadTreeSha: TREE,
  squashCommitTreeSha: TREE,
  contentEquivalenceVerified: true,
  mergeAncestorVerified: true,
  exactHeadCiGreen: true,
  currentMainValidationGreen: true,
  coverageStatus: 'not_measurable_pending_external_promotion',
  coveragePromotionEffect: 'none',
  productEffect: 'none',
  productTaskActivation: false,
  kroad012rStatus: 'historical_non_authoritative',
  kroad012Status: 'preserved',
  kroad013Through018Status: 'not_started',
  historicalIndependentGreenClaimed: false,
});
const baseB = () => ({
  planId: V4_PLAN_ID,
  batchId: 'BATCH_B',
  exceptionApplied: false,
  headSha: 'a'.repeat(40),
  scopeRevision: `sha256:${'b'.repeat(64)}`,
  exactHeadCiGreen: true,
  independentReviewGreen: true,
  reviewedHeadSha: 'a'.repeat(40),
  reviewedScopeRevision: `sha256:${'b'.repeat(64)}`,
  reviewerIdentity: 'PR-Inspector@v1.10.1:reviewer',
  implementerIdentity: OWNER,
  reviewedAt: '2026-07-16T10:00:00Z',
  mergedAt: '2026-07-16T11:00:00Z',
  mergeActor: OWNER,
  mergeMode: 'squash',
  reviewedHeadAncestorVerified: false,
  resultTreeEquivalent: true,
  mergeCommitAncestorVerified: true,
  currentMainValidationGreen: true,
  coverageStatus: 'not_measurable_pending_external_promotion',
  coveragePromotionEffect: 'none',
  productEffect: 'none',
});
const cases = [];
function caseA(name, mutate, expected) { const input = baseA(); mutate(input); const result = verifyBatchAOneTimeReconciliation(input); cases.push({ name, expected, pass: result.diagnostics.includes(expected), diagnostics: result.diagnostics }); }
function caseB(name, mutate, expected) { const input = baseB(); mutate(input); const result = verifyBatchBFinalClosure(input); cases.push({ name, expected, pass: result.diagnostics.includes(expected), diagnostics: result.diagnostics }); }
function treeCase(name, expected, observed, code) { const diagnostics = compareCanonicalTrees(expected, observed); cases.push({ name, expected: code, pass: diagnostics.includes(code), diagnostics }); }

cases.push({ name: 'exact PR49 squash exception passes', expected: 'pass', pass: verifyBatchAOneTimeReconciliation(baseA()).status === 'pass', diagnostics: [] });
caseA('different PR identity rejected', (x) => { x.prNumber = 50; }, 'AIGOV_V4_SQUASH_PR_IDENTITY_MISMATCH');
caseA('base mismatch rejected', (x) => { x.baseSha = '0'.repeat(40); }, 'AIGOV_V4_SQUASH_BASE_MISMATCH');
caseA('head mismatch rejected', (x) => { x.headSha = '1'.repeat(40); }, 'AIGOV_V4_SQUASH_HEAD_MISMATCH');
caseA('squash commit mismatch rejected', (x) => { x.mergeCommitSha = '2'.repeat(40); }, 'AIGOV_V4_SQUASH_COMMIT_MISMATCH');
caseA('tree mismatch rejected', (x) => { x.squashCommitTreeSha = '3'.repeat(40); x.contentEquivalenceVerified = false; }, 'AIGOV_V4_SQUASH_TREE_MISMATCH');
caseA('patch reconstruction failure rejected', (x) => { x.equivalenceMode = 'reconstructed_tree_equality'; x.patchReconstructionSucceeded = false; }, 'AIGOV_V4_SQUASH_PATCH_RECONSTRUCTION_FAILED');
caseA('exception reuse rejected', (x) => { x.exceptionUseCount = 2; }, 'AIGOV_V4_EXCEPTION_REUSE_FORBIDDEN');
caseA('wrong merge actor rejected', (x) => { x.mergeActor = 'other'; }, 'AIGOV_V4_OWNER_MERGE_UNVERIFIED');
caseA('failed exact-head CI rejected', (x) => { x.exactHeadCiGreen = false; }, 'AIGOV_V4_EXACT_HEAD_CI_UNVERIFIED');
caseA('Coverage promotion rejected', (x) => { x.coveragePromotionEffect = 'promoted'; }, 'AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
caseA('historical Green fabrication rejected', (x) => { x.historicalIndependentGreenClaimed = true; }, 'AIGOV_V4_HISTORICAL_REVIEW_FABRICATION_FORBIDDEN');
caseB('Batch B review required', (x) => { x.independentReviewGreen = false; }, 'AIGOV_BATCH_B_REVIEW_REQUIRED');
caseB('Batch B cannot reuse PR49 exception', (x) => { x.exceptionApplied = true; }, 'AIGOV_V4_EXCEPTION_REUSE_FORBIDDEN');
caseB('Batch B squash result tree required', (x) => { x.resultTreeEquivalent = false; }, 'AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
caseB('Batch B malformed reviewed timestamp rejected', (x) => { x.reviewedAt = 'not-a-timestamp'; }, 'AIGOV_BATCH_B_REVIEW_MUST_PREDATE_MERGE');
caseB('Batch B malformed merged timestamp rejected', (x) => { x.mergedAt = 'not-a-timestamp'; }, 'AIGOV_BATCH_B_REVIEW_MUST_PREDATE_MERGE');
caseB('Coverage remains non-promoted', (x) => { x.coveragePromotionEffect = 'promoted'; }, 'AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
cases.push({ name: 'Batch B valid squash sequence passes without second review', expected: 'pass', pass: verifyBatchBFinalClosure(baseB()).status === 'pass', diagnostics: [] });

const baseTree = [{ path: 'a.txt', mode: '100644', type: 'blob', sha: 'a' }, { path: 'link', mode: '120000', type: 'blob', sha: 'b' }, { path: 'bin.dat', mode: '100644', type: 'blob', sha: 'c' }];
treeCase('same paths but bytes differ', baseTree, [{ ...baseTree[0], sha: 'd' }, baseTree[1], baseTree[2]], 'AIGOV_V4_SQUASH_CHANGED_BYTES_DETECTED');
treeCase('additional file detected', baseTree, [...baseTree, { path: 'extra.txt', mode: '100644', type: 'blob', sha: 'e' }], 'AIGOV_V4_SQUASH_EXTRA_FILE_DETECTED');
treeCase('deleted file restored detected', baseTree.slice(0, 2), baseTree, 'AIGOV_V4_SQUASH_EXTRA_FILE_DETECTED');
treeCase('file mode differs', baseTree, [{ ...baseTree[0], mode: '100755' }, baseTree[1], baseTree[2]], 'AIGOV_V4_SQUASH_TREE_MISMATCH');
treeCase('symlink bytes differ', baseTree, [baseTree[0], { ...baseTree[1], sha: 'f' }, baseTree[2]], 'AIGOV_V4_SQUASH_CHANGED_BYTES_DETECTED');
treeCase('binary bytes differ', baseTree, [baseTree[0], baseTree[1], { ...baseTree[2], sha: 'f' }], 'AIGOV_V4_SQUASH_CHANGED_BYTES_DETECTED');

const report = { suite: 'aigov-v4-one-time-squash-equivalence', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
