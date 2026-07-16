import {
  isVerifiedCiAggregate,
  isVerifiedCurrentMain,
  isVerifiedMergeResult,
  isVerifiedRepositoryEnforcement,
} from './aigov-ci-descriptor.mjs';
import {
  INSPECTOR_COMMIT,
  PROTOCOL_VERSION,
  isVerifiedOfficialReviewEvidence,
} from './pr-inspector-v1102.mjs';

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
  for (const [entryPath, entry] of observed) {
    if (!expected.has(entryPath)) diagnostics.push('AIGOV_V4_SQUASH_EXTRA_FILE_DETECTED');
    else {
      const target = expected.get(entryPath);
      if (entry.sha !== target.sha || entry.type !== target.type) diagnostics.push('AIGOV_V4_SQUASH_CHANGED_BYTES_DETECTED');
      if (entry.mode !== target.mode) diagnostics.push('AIGOV_V4_SQUASH_TREE_MISMATCH');
    }
  }
  for (const entryPath of expected.keys()) if (!observed.has(entryPath)) diagnostics.push('AIGOV_V4_SQUASH_TREE_MISMATCH');
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
  const ci = evidence.exactHeadCiEvidence;
  const review = evidence.reviewEvidence;
  const merge = evidence.mergeEvidence;
  const currentMain = evidence.currentMainEvidence;
  const enforcement = evidence.enforcementEvidence;
  const memory = evidence.memory || {};

  if (evidence.planId !== V4_PLAN_ID
    || evidence.batchId !== 'BATCH_B'
    || evidence.repository !== TARGET_REPOSITORY
    || evidence.repositoryId !== TARGET_REPOSITORY_ID
    || evidence.prNumber !== 50) diagnostics.push('AIGOV_BATCH_B_IDENTITY_MISMATCH');
  if (evidence.exceptionApplied === true) diagnostics.push('AIGOV_V4_EXCEPTION_REUSE_FORBIDDEN');
  if (!isVerifiedCiAggregate(ci)
    || ci.exact_head_sha !== evidence.headSha
    || ci.event !== 'pull_request') diagnostics.push('AIGOV_BATCH_B_EXACT_HEAD_CI_REQUIRED');
  if (!isVerifiedOfficialReviewEvidence(review)) diagnostics.push('AIGOV_BATCH_B_REVIEW_REQUIRED');
  else {
    if (review.reviewed_head_sha !== evidence.headSha
      || review.reviewed_scope_revision !== evidence.scopeRevision) diagnostics.push('AIGOV_BATCH_B_REVIEW_STALE');
    if (review.protocol_version !== PROTOCOL_VERSION
      || review.inspector_release_commit !== INSPECTOR_COMMIT
      || review.provenance !== 'official_pr_inspector_repository'
      || review.review_status !== 'GREEN_TECHNICALLY_READY') diagnostics.push('AIGOV_BATCH_B_REVIEW_PROVENANCE_UNVERIFIED');
    if (review.review_completed_after_exact_head_ci !== true
      || review.review_completed_before_merge !== true) diagnostics.push('AIGOV_BATCH_B_REVIEW_SEQUENCE_INVALID');
  }
  if (!isVerifiedMergeResult(merge)
    || merge.reviewed_head_sha !== evidence.headSha
    || merge.method_aware_verified !== true
    || merge.current_main_contains_merge_result !== true) diagnostics.push('AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
  if (merge?.merge_actor !== OWNER) diagnostics.push('AIGOV_BATCH_B_OWNER_MERGE_REQUIRED');
  if (!isVerifiedCurrentMain(currentMain) || currentMain.green !== true) diagnostics.push('AIGOV_BATCH_B_CURRENT_MAIN_VALIDATION_REQUIRED');
  if (!isVerifiedRepositoryEnforcement(enforcement)
    || enforcement.status !== 'verified'
    || enforcement.required_check_configuration !== 'verified'
    || enforcement.repository_settings_enforced !== 'verified') diagnostics.push('AIGOV_BATCH_B_ENFORCEMENT_UNVERIFIED');
  if (memory.coverageStatus !== 'not_measurable_pending_external_promotion'
    || memory.coveragePromotionEffect !== 'none'
    || memory.coverageCredit !== false) diagnostics.push('AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
  if (memory.productEffect !== 'none' || memory.externalRepositoryEffect !== 'none') diagnostics.push('AIGOV_PRODUCT_ACTIVATION_FORBIDDEN');
  if (memory.kroad012Status !== 'preserved'
    || memory.kroad013Through018Status !== 'not_started'
    || memory.kroad012rStatus !== 'historical_non_authoritative') diagnostics.push('AIGOV_KROAD_PRESERVATION_UNVERIFIED');
  if (memory.recoveryProgramStatus !== 'registered_non_active'
    || memory.krecStatus !== 'registered_planned_task'
    || memory.implementationAuthorized !== false
    || memory.readinessClaim !== false) diagnostics.push('AIGOV_RECOVERY_ACTIVATION_FORBIDDEN');
  if (memory.historicalIndependentGreenReceiptForPr49 !== 'not_claimed'
    || memory.pr49ExceptionReusable !== false
    || memory.pr49ExceptionPrecedential !== false) diagnostics.push('AIGOV_V4_HISTORICAL_REVIEW_FABRICATION_FORBIDDEN');

  const normalized = unique(diagnostics);
  return {
    batch_id: 'BATCH_B',
    status: normalized.length ? 'fail' : 'pass',
    closure_mode: 'reviewed_head_to_exact_main_v4_method_aware',
    target_repository_id: TARGET_REPOSITORY_ID,
    pr_number: 50,
    reviewed_head_sha: evidence.headSha,
    reviewed_scope_revision: evidence.scopeRevision,
    review_protocol: PROTOCOL_VERSION,
    review_provenance: review?.provenance || 'unverified',
    review_status: review?.review_status || 'unverified',
    review_completed_after_exact_head_ci: review?.review_completed_after_exact_head_ci === true,
    review_completed_before_merge: review?.review_completed_before_merge === true,
    merge_actor: merge?.merge_actor || null,
    merge_method: merge?.merge_method || 'unverified',
    merge_result: merge?.method_aware_verified === true ? 'method_aware_verified' : 'unverified',
    current_main_contains_merge_result: merge?.current_main_contains_merge_result === true,
    current_main_validation: currentMain?.green === true ? 'green' : 'unverified',
    required_check_configuration: enforcement?.required_check_configuration || 'unverified',
    repository_settings_enforced: enforcement?.repository_settings_enforced || 'not_claimed',
    coverage_promotion_effect: memory.coveragePromotionEffect || 'unknown',
    product_effect: memory.productEffect || 'unknown',
    second_post_merge_independent_review_required: false,
    diagnostics: normalized,
  };
}
