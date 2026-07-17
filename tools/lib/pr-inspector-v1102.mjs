import crypto from 'node:crypto';

export const PROTOCOL_VERSION = 'v1.10.2';
export const INSPECTOR_COMMIT = '9ed48bd995ee5b9270756254b04c1d48ccf21cbe';
export const INSPECTOR_REPOSITORY = 'rezahh107/PR-Inspector';
export const INSPECTOR_REPOSITORY_ID = 1288323264;
export const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
export const TARGET_REPOSITORY_ID = 1292378784;
export const TARGET_PR_NUMBER = 50;
export const INDEPENDENT_REVIEW_REQUIRED = false;
export const INDEPENDENT_REVIEW_POLICY = 'optional_advisory';
export const FIXED_ARTIFACTS = Object.freeze(['review-package.json', 'DECISION_PROJECTION.json', 'OWNER_DECISION_CARD.fa.md', 'TECHNICAL_HANDOFF.en.md', 'OWNER_RESULT.fa.txt', 'artifact-manifest.json']);
export const PROMPT_ARTIFACT = 'NEXT_ACTION_PROMPT.en.md';
const validSha = (value) => /^[0-9a-f]{40}$/.test(value || '');
const validScope = (value) => /^sha256:[0-9a-f]{64}$/.test(value || '');

export function deterministicReviewDirectory({ headSha, scopeRevision }) {
  if (!validSha(headSha) || !validScope(scopeRevision)) throw new Error('PRI-ADVISORY-IDENTITY-INVALID');
  return `reviews/targets/${TARGET_REPOSITORY_ID}/pr-${TARGET_PR_NUMBER}/${headSha}/${scopeRevision.slice(7)}`;
}

export function ownerPolicyReviewObservation(value = null, { headSha = null, scopeRevision = null } = {}) {
  if (!value) return Object.freeze({ required: false, policy: INDEPENDENT_REVIEW_POLICY, status: 'not_required_by_owner_policy', provenance: 'not_applicable', reviewed_head_sha: null, reviewed_scope_revision: null, merge_authority: false });
  const stale = (headSha && value.reviewed_head_sha !== headSha) || (scopeRevision && value.reviewed_scope_revision !== scopeRevision);
  return Object.freeze({ required: false, policy: INDEPENDENT_REVIEW_POLICY, status: stale ? 'stale_advisory' : 'performed_advisory', provenance: value.provenance || 'unavailable', reviewed_head_sha: value.reviewed_head_sha || null, reviewed_scope_revision: value.reviewed_scope_revision || null, technical_status: value.review_status || null, merge_authority: false });
}

export function reviewSequenceDiagnostics() { return []; }
export function verifyActiveProtocolSnapshot() { return Object.freeze({ status: 'advisory_only', version: PROTOCOL_VERSION }); }
export function verifyInspectorReviewProvenancePayloads() { return { diagnostics: [], evidence: ownerPolicyReviewObservation() }; }
export function verifyOfficialReviewDirectory() { return { status: 'advisory_only', diagnostics: [], projection: null, hashes: null }; }
export function verifyOfficialReviewEvidence() { return { diagnostics: [], evidence: ownerPolicyReviewObservation() }; }
export function isVerifiedOfficialDirectoryEvidence() { return false; }
export function isVerifiedInspectorReviewProvenance() { return false; }
export function isVerifiedOfficialReviewEvidence() { return false; }
export function canonicalPackageSha256(value) { return crypto.createHash('sha256').update(`${JSON.stringify(value)}\n`).digest('hex'); }
