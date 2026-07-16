export const V3_PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3';
export const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
export const TARGET_REPOSITORY_ID = 1292378784;
export const OWNER = 'rezahh107';
export const BATCH_A_EXCEPTION = Object.freeze({
  prNumber: 49,
  headSha: 'c141923bf411f802f1673acf06dc92a77b415593',
  mergeCommitSha: '86e25a9073df7e257ca7df799de85baf9b3fafb0',
  exceptionPlanId: V3_PLAN_ID,
});

const unique = (items) => [...new Set(items)];

export function verifyBatchAOneTimeReconciliation(evidence) {
  const diagnostics = [];
  const tupleMismatch = evidence.repository !== TARGET_REPOSITORY
    || evidence.repositoryId !== TARGET_REPOSITORY_ID
    || evidence.prNumber !== BATCH_A_EXCEPTION.prNumber
    || evidence.headSha !== BATCH_A_EXCEPTION.headSha
    || evidence.mergeCommitSha !== BATCH_A_EXCEPTION.mergeCommitSha
    || evidence.exceptionPlanId !== BATCH_A_EXCEPTION.exceptionPlanId;

  if (evidence.batchId !== 'BATCH_A') diagnostics.push('AIGOV_V3_EXCEPTION_NOT_APPLICABLE');
  if (tupleMismatch) diagnostics.push('AIGOV_V3_EXCEPTION_IDENTITY_MISMATCH');
  if (evidence.exceptionUseCount !== 1 || evidence.exceptionReusable === true) diagnostics.push('AIGOV_V3_EXCEPTION_REUSE_FORBIDDEN');
  if (evidence.prMerged !== true) diagnostics.push('AIGOV_V3_EXCEPTION_NOT_APPLICABLE');
  if (evidence.mergeActor !== OWNER) diagnostics.push('AIGOV_V3_OWNER_MERGE_UNVERIFIED');
  if (evidence.headAncestorVerified !== true || evidence.mergeAncestorVerified !== true) diagnostics.push('AIGOV_V3_BATCH_A_ANCESTRY_UNVERIFIED');
  if (evidence.exactHeadCiGreen !== true) diagnostics.push('AIGOV_V3_BATCH_A_CI_UNVERIFIED');
  if (evidence.currentMainValidationGreen !== true) diagnostics.push('AIGOV_V3_BATCH_A_CURRENT_MAIN_VALIDATION_UNVERIFIED');
  if (evidence.coverageStatus !== 'not_measurable_pending_external_promotion' || evidence.coveragePromotionEffect !== 'none') diagnostics.push('AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
  if (evidence.productEffect !== 'none' || evidence.productTaskActivation === true) diagnostics.push('AIGOV_PRODUCT_ACTIVATION_FORBIDDEN');
  if (evidence.kroad012rStatus !== 'historical_non_authoritative'
    || evidence.kroad012Status !== 'preserved'
    || evidence.kroad013Through018Status !== 'not_started') diagnostics.push('AIGOV_KROAD_PRESERVATION_UNVERIFIED');
  if (evidence.historicalIndependentGreenClaimed === true) diagnostics.push('AIGOV_V3_HISTORICAL_REVIEW_FABRICATION_FORBIDDEN');

  const normalized = unique(diagnostics);
  return {
    batch_id: 'BATCH_A',
    status: normalized.length ? 'fail' : 'pass',
    closure_mode: 'v3_one_time_evidence_reconciliation',
    historical_review_green_claimed: false,
    retrospective_review_required: false,
    exception_reusable: false,
    diagnostics: normalized,
  };
}

export function verifyBatchBFinalClosure(evidence) {
  const diagnostics = [];
  if (evidence.planId !== V3_PLAN_ID || evidence.batchId !== 'BATCH_B') diagnostics.push('AIGOV_BATCH_B_IDENTITY_MISMATCH');
  if (evidence.exceptionApplied === true) diagnostics.push('AIGOV_V3_EXCEPTION_REUSE_FORBIDDEN');
  if (evidence.exactHeadCiGreen !== true) diagnostics.push('AIGOV_BATCH_B_EXACT_HEAD_CI_REQUIRED');
  if (evidence.independentReviewGreen !== true) diagnostics.push('AIGOV_BATCH_B_REVIEW_REQUIRED');
  if (evidence.reviewedHeadSha !== evidence.headSha || evidence.reviewedScopeRevision !== evidence.scopeRevision) diagnostics.push('AIGOV_BATCH_B_REVIEW_STALE');
  if (evidence.reviewerIdentity === evidence.implementerIdentity) diagnostics.push('AIGOV_BATCH_B_REVIEW_INDEPENDENCE_REQUIRED');
  if (!evidence.reviewedAt || !evidence.mergedAt || Date.parse(evidence.reviewedAt) >= Date.parse(evidence.mergedAt)) diagnostics.push('AIGOV_BATCH_B_REVIEW_MUST_PREDATE_MERGE');
  if (evidence.mergeActor !== OWNER) diagnostics.push('AIGOV_BATCH_B_OWNER_MERGE_REQUIRED');
  if (evidence.reviewedHeadAncestorVerified !== true || evidence.mergeCommitAncestorVerified !== true) diagnostics.push('AIGOV_BATCH_B_ANCESTRY_UNVERIFIED');
  if (evidence.currentMainValidationGreen !== true) diagnostics.push('AIGOV_BATCH_B_CURRENT_MAIN_VALIDATION_REQUIRED');
  if (evidence.coverageStatus !== 'not_measurable_pending_external_promotion' || evidence.coveragePromotionEffect !== 'none') diagnostics.push('AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
  if (evidence.productEffect !== 'none') diagnostics.push('AIGOV_PRODUCT_ACTIVATION_FORBIDDEN');

  const normalized = unique(diagnostics);
  return {
    batch_id: 'BATCH_B',
    status: normalized.length ? 'fail' : 'pass',
    closure_mode: 'reviewed_head_to_exact_main',
    second_post_merge_independent_review_required: false,
    diagnostics: normalized,
  };
}
