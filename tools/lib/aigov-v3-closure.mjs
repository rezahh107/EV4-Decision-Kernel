export const PREVIOUS_PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3';
export const V4_PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4';
export const V3_PLAN_ID = V4_PLAN_ID;
export const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
export const TARGET_REPOSITORY_ID = 1292378784;
export const OWNER = 'rezahh107';
export const BATCH_A_EXCEPTION = Object.freeze({
  prNumber: 49,
  baseSha: '5ff5d7b20db11af36ab787eb8ac2d1127ea74644',
  headSha: 'c141923bf411f802f1673acf06dc92a77b415593',
  mergeCommitSha: '86e25a9073df7e257ca7df799de85baf9b3fafb0',
  exceptionPlanId: V4_PLAN_ID,
});

const unique = (items) => [...new Set(items)];

export function compareCanonicalTrees(expectedEntries, observedEntries) {
  const diagnostics = [];
  const expected = new Map((expectedEntries || []).map((entry) => [entry.path, entry]));
  const observed = new Map((observedEntries || []).map((entry) => [entry.path, entry]));
  for (const [path, entry] of observed) {
    if (!expected.has(path)) diagnostics.push('AIGOV_V4_SQUASH_EXTRA_FILE_DETECTED');
    else {
      const target = expected.get(path);
      if (entry.sha !== target.sha || entry.type !== target.type) diagnostics.push('AIGOV_V4_SQUASH_CHANGED_BYTES_DETECTED');
      if (entry.mode !== target.mode) diagnostics.push('AIGOV_V4_SQUASH_TREE_MISMATCH');
    }
  }
  for (const path of expected.keys()) if (!observed.has(path)) diagnostics.push('AIGOV_V4_SQUASH_TREE_MISMATCH');
  if (diagnostics.length) diagnostics.push('AIGOV_V4_SQUASH_TREE_MISMATCH');
  return unique(diagnostics);
}

export function verifyBatchAOneTimeReconciliation(evidence) {
  const diagnostics = [];
  if (evidence.batchId !== 'BATCH_A') diagnostics.push('AIGOV_V4_EXCEPTION_REUSE_FORBIDDEN');
  if (evidence.repository !== TARGET_REPOSITORY || evidence.repositoryId !== TARGET_REPOSITORY_ID || evidence.prNumber !== BATCH_A_EXCEPTION.prNumber) diagnostics.push('AIGOV_V4_SQUASH_PR_IDENTITY_MISMATCH');
  if (evidence.baseSha !== BATCH_A_EXCEPTION.baseSha) diagnostics.push('AIGOV_V4_SQUASH_BASE_MISMATCH');
  if (evidence.headSha !== BATCH_A_EXCEPTION.headSha) diagnostics.push('AIGOV_V4_SQUASH_HEAD_MISMATCH');
  if (evidence.mergeCommitSha !== BATCH_A_EXCEPTION.mergeCommitSha || evidence.exceptionPlanId !== V4_PLAN_ID) diagnostics.push('AIGOV_V4_SQUASH_COMMIT_MISMATCH');
  if (evidence.exceptionUseCount !== 1 || evidence.exceptionReusable === true || evidence.exceptionPrecedential === true) diagnostics.push('AIGOV_V4_EXCEPTION_REUSE_FORBIDDEN');
  if (evidence.prMerged !== true || evidence.mergeMode !== 'squash') diagnostics.push('AIGOV_V4_SQUASH_COMMIT_MISMATCH');
  if (evidence.mergeActor !== OWNER) diagnostics.push('AIGOV_V4_OWNER_MERGE_UNVERIFIED');
  if (evidence.equivalenceMode === 'reconstructed_tree_equality' && evidence.patchReconstructionSucceeded !== true) diagnostics.push('AIGOV_V4_SQUASH_PATCH_RECONSTRUCTION_FAILED');
  if (evidence.contentEquivalenceVerified !== true || !['exact_tree_equality', 'reconstructed_tree_equality'].includes(evidence.equivalenceMode) || evidence.prHeadTreeSha !== evidence.squashCommitTreeSha) diagnostics.push('AIGOV_V4_SQUASH_TREE_MISMATCH');
  if (evidence.mergeAncestorVerified !== true) diagnostics.push('AIGOV_V4_SQUASH_COMMIT_MISMATCH');
  if (evidence.exactHeadCiGreen !== true) diagnostics.push('AIGOV_V4_EXACT_HEAD_CI_UNVERIFIED');
  if (evidence.currentMainValidationGreen !== true) diagnostics.push('AIGOV_V4_CURRENT_MAIN_VALIDATION_UNVERIFIED');
  if (evidence.coverageStatus !== 'not_measurable_pending_external_promotion' || evidence.coveragePromotionEffect !== 'none') diagnostics.push('AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
  if (evidence.productEffect !== 'none' || evidence.productTaskActivation === true) diagnostics.push('AIGOV_PRODUCT_ACTIVATION_FORBIDDEN');
  if (evidence.kroad012rStatus !== 'historical_non_authoritative' || evidence.kroad012Status !== 'preserved' || evidence.kroad013Through018Status !== 'not_started') diagnostics.push('AIGOV_KROAD_PRESERVATION_UNVERIFIED');
  if (evidence.historicalIndependentGreenClaimed === true) diagnostics.push('AIGOV_V4_HISTORICAL_REVIEW_FABRICATION_FORBIDDEN');

  const normalized = unique(diagnostics);
  return {
    batch_id: 'BATCH_A',
    status: normalized.length ? 'fail' : 'pass',
    closure_mode: 'v4_one_time_squash_equivalence',
    merge_mode: 'squash',
    content_equivalence: normalized.includes('AIGOV_V4_SQUASH_TREE_MISMATCH') ? 'unverified' : 'verified',
    historical_independent_green_receipt: 'not_claimed',
    retrospective_review_required: false,
    exception_reusable: false,
    exception_precedential: false,
    diagnostics: normalized,
  };
}

export function verifyBatchBFinalClosure(evidence) {
  const diagnostics = [];
  if (evidence.planId !== V4_PLAN_ID || evidence.batchId !== 'BATCH_B') diagnostics.push('AIGOV_BATCH_B_IDENTITY_MISMATCH');
  if (evidence.exceptionApplied === true) diagnostics.push('AIGOV_V4_EXCEPTION_REUSE_FORBIDDEN');
  if (evidence.exactHeadCiGreen !== true) diagnostics.push('AIGOV_BATCH_B_EXACT_HEAD_CI_REQUIRED');
  if (evidence.independentReviewGreen !== true) diagnostics.push('AIGOV_BATCH_B_REVIEW_REQUIRED');
  if (evidence.reviewedHeadSha !== evidence.headSha || evidence.reviewedScopeRevision !== evidence.scopeRevision) diagnostics.push('AIGOV_BATCH_B_REVIEW_STALE');
  if (evidence.reviewerIdentity === evidence.implementerIdentity) diagnostics.push('AIGOV_BATCH_B_REVIEW_INDEPENDENCE_REQUIRED');
  const reviewedTime = Date.parse(evidence.reviewedAt);
  const mergedTime = Date.parse(evidence.mergedAt);
  if (!evidence.reviewedAt || !evidence.mergedAt || Number.isNaN(reviewedTime) || Number.isNaN(mergedTime) || reviewedTime >= mergedTime) diagnostics.push('AIGOV_BATCH_B_REVIEW_MUST_PREDATE_MERGE');
  if (evidence.mergeActor !== OWNER) diagnostics.push('AIGOV_BATCH_B_OWNER_MERGE_REQUIRED');
  if (evidence.mergeCommitAncestorVerified !== true) diagnostics.push('AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
  if (evidence.mergeMode === 'merge' && evidence.reviewedHeadAncestorVerified !== true) diagnostics.push('AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
  if (['squash', 'rebase'].includes(evidence.mergeMode) && evidence.resultTreeEquivalent !== true) diagnostics.push('AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
  if (!['merge', 'squash', 'rebase'].includes(evidence.mergeMode)) diagnostics.push('AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
  if (evidence.currentMainValidationGreen !== true) diagnostics.push('AIGOV_BATCH_B_CURRENT_MAIN_VALIDATION_REQUIRED');
  if (evidence.coverageStatus !== 'not_measurable_pending_external_promotion' || evidence.coveragePromotionEffect !== 'none') diagnostics.push('AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
  if (evidence.productEffect !== 'none') diagnostics.push('AIGOV_PRODUCT_ACTIVATION_FORBIDDEN');

  const normalized = unique(diagnostics);
  return {
    batch_id: 'BATCH_B',
    status: normalized.length ? 'fail' : 'pass',
    closure_mode: 'reviewed_head_to_exact_main_v4_method_aware',
    second_post_merge_independent_review_required: false,
    diagnostics: normalized,
  };
}
