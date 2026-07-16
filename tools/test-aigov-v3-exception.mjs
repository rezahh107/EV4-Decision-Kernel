#!/usr/bin/env node
import {
  BATCH_A_EXCEPTION,
  OWNER,
  TARGET_REPOSITORY,
  TARGET_REPOSITORY_ID,
  V3_PLAN_ID,
  verifyBatchAOneTimeReconciliation,
  verifyBatchBFinalClosure,
} from './lib/aigov-v3-closure.mjs';

const baseA = () => ({
  repository: TARGET_REPOSITORY,
  repositoryId: TARGET_REPOSITORY_ID,
  batchId: 'BATCH_A',
  prNumber: BATCH_A_EXCEPTION.prNumber,
  headSha: BATCH_A_EXCEPTION.headSha,
  mergeCommitSha: BATCH_A_EXCEPTION.mergeCommitSha,
  exceptionPlanId: V3_PLAN_ID,
  exceptionUseCount: 1,
  exceptionReusable: false,
  prMerged: true,
  mergeActor: OWNER,
  headAncestorVerified: true,
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
  planId: V3_PLAN_ID,
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
  reviewedHeadAncestorVerified: true,
  mergeCommitAncestorVerified: true,
  currentMainValidationGreen: true,
  coverageStatus: 'not_measurable_pending_external_promotion',
  coveragePromotionEffect: 'none',
  productEffect: 'none',
});

const cases = [];
function caseA(name, mutate, expected) {
  const input = baseA();
  mutate(input);
  const result = verifyBatchAOneTimeReconciliation(input);
  cases.push({ name, expected, pass: result.diagnostics.includes(expected), diagnostics: result.diagnostics });
}
function caseB(name, mutate, expected) {
  const input = baseB();
  mutate(input);
  const result = verifyBatchBFinalClosure(input);
  cases.push({ name, expected, pass: result.diagnostics.includes(expected), diagnostics: result.diagnostics });
}

cases.push({ name: 'exact Batch A exception passes', expected: 'pass', pass: verifyBatchAOneTimeReconciliation(baseA()).status === 'pass', diagnostics: [] });
caseA('another PR rejected', (x) => { x.prNumber = 50; }, 'AIGOV_V3_EXCEPTION_IDENTITY_MISMATCH');
caseA('wrong head rejected', (x) => { x.headSha = '0'.repeat(40); }, 'AIGOV_V3_EXCEPTION_IDENTITY_MISMATCH');
caseA('wrong merge commit rejected', (x) => { x.mergeCommitSha = '1'.repeat(40); }, 'AIGOV_V3_EXCEPTION_IDENTITY_MISMATCH');
caseA('Batch B reuse rejected', (x) => { x.batchId = 'BATCH_B'; }, 'AIGOV_V3_EXCEPTION_NOT_APPLICABLE');
caseA('second use rejected', (x) => { x.exceptionUseCount = 2; }, 'AIGOV_V3_EXCEPTION_REUSE_FORBIDDEN');
caseA('wrong owner rejected', (x) => { x.mergeActor = 'other'; }, 'AIGOV_V3_OWNER_MERGE_UNVERIFIED');
caseA('failed exact-head CI rejected', (x) => { x.exactHeadCiGreen = false; }, 'AIGOV_V3_BATCH_A_CI_UNVERIFIED');
caseA('non-ancestor head rejected', (x) => { x.headAncestorVerified = false; }, 'AIGOV_V3_BATCH_A_ANCESTRY_UNVERIFIED');
caseA('Coverage promotion rejected', (x) => { x.coveragePromotionEffect = 'promoted'; }, 'AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
caseA('product activation rejected', (x) => { x.productTaskActivation = true; }, 'AIGOV_PRODUCT_ACTIVATION_FORBIDDEN');
caseA('historical Green fabrication rejected', (x) => { x.historicalIndependentGreenClaimed = true; }, 'AIGOV_V3_HISTORICAL_REVIEW_FABRICATION_FORBIDDEN');
cases.push({ name: 'Batch B valid sequence passes without second post-Merge review', expected: 'pass', pass: verifyBatchBFinalClosure(baseB()).status === 'pass', diagnostics: [] });
caseB('Batch B independent review cannot be bypassed', (x) => { x.independentReviewGreen = false; }, 'AIGOV_BATCH_B_REVIEW_REQUIRED');
caseB('Batch B review after Merge rejected', (x) => { x.reviewedAt = '2026-07-16T12:00:00Z'; }, 'AIGOV_BATCH_B_REVIEW_MUST_PREDATE_MERGE');
caseB('Batch B exception reuse rejected', (x) => { x.exceptionApplied = true; }, 'AIGOV_V3_EXCEPTION_REUSE_FORBIDDEN');

const report = { suite: 'aigov-v3-one-time-exception', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
