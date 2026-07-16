#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { canonicalSha256, sha256 } from './lib/aigov-lifecycle.mjs';
import { validateCiIdentity } from './lib/aigov-ci-evidence.mjs';
import { validateSequenceProducerIdentity } from './lib/aigov-sequence-producer.mjs';
import {
  FIXED_ARTIFACTS,
  PROMPT_ARTIFACT,
  verifyOfficialReviewDirectory,
} from './lib/pr-inspector-v1101.mjs';

const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const TARGET_REPOSITORY_ID = 1292378784;
const INSPECTOR_REPOSITORY = 'rezahh107/PR-Inspector';
const INSPECTOR_REPOSITORY_ID = 1288323264;
const OWNER = 'rezahh107';
const PR_NUMBER = 49;
const PROTOCOL_VERSION = 'v1.10.1';
const BASE_SHA = '5ff5d7b20db11af36ab787eb8ac2d1127ea74644';
const REQUIRED_ARTIFACTS = [...FIXED_ARTIFACTS].sort();
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

function schemaErrors(schema, value, source) {
  let validator;
  try {
    validator = ajv.compile(schema);
  } catch (error) {
    return [`AIGOV_SCHEMA_COMPILE_FAILED:${source}:${error.message}`];
  }
  if (validator(value)) return [];
  return (validator.errors || []).map((error) => `AIGOV_SCHEMA_INVALID:${source}${error.instancePath || '/'}:${error.message}`);
}

function receiptId(receipt) {
  const projection = structuredClone(receipt);
  delete projection.receipt_id;
  return `sha256:${canonicalSha256(projection)}`;
}

function artifactMap(artifacts) {
  return new Map(artifacts.map((item) => [path.basename(item.path), item]));
}

export function verifyEvidenceBundle(bundle, scope, schemas, { liveOfficialBoundary = true } = {}) {
  const diagnostics = [];
  const receiptSchemaDiagnostics = schemaErrors(schemas.reviewReceipt, bundle.receipt, 'external-review-receipt');
  diagnostics.push(...receiptSchemaDiagnostics);
  if (receiptSchemaDiagnostics.length) {
    return { diagnostics, reviewDigest: null, ciDigest: null, mergeDigest: null, exactMainDigest: null, directoryHashes: null };
  }

  const {
    receipt,
    targetRepository,
    pullRequest,
    mainCommit,
    inspectorRepository,
    inspectorCommit,
    inspectorMainCommit,
    inspectorAncestry,
    receiptSource,
    trustPolicySource,
    trustPolicy,
    currentVersion,
    protocolManifest,
    ciIdentity,
    sequenceProducerIdentity,
  } = bundle;
  const artifacts = artifactMap(bundle.artifacts || []);
  const directory = verifyOfficialReviewDirectory({
    artifacts: bundle.artifacts,
    context: { repository: TARGET_REPOSITORY, prNumber: PR_NUMBER, headSha: receipt.target.head_sha },
    live: liveOfficialBoundary,
  });
  diagnostics.push(...directory.diagnostics.map((item) => `AIGOV_REVIEW_DIRECTORY_INVALID:${item}`));
  if (directory.status === 'pass') {
    const profile = directory.projection?.security_profile;
    if (directory.projection?.technical_status !== 'GREEN_TECHNICALLY_READY'
      || directory.projection?.next_action?.kind !== 'merge_now'
      || profile?.sequence_ci_enforced !== true) {
      diagnostics.push('AIGOV_REVIEW_SECURITY_CAPABILITY_MISSING');
    }
    if (receipt.review.technical_status !== directory.projection?.technical_status) {
      diagnostics.push('AIGOV_REVIEW_STATUS_PROJECTION_MISMATCH');
    }
    if (liveOfficialBoundary && directory.liveSummary?.sequence_capability_verified !== true) {
      diagnostics.push('AIGOV_REVIEW_SEQUENCE_CAPABILITY_UNVERIFIED');
    }
  }

  diagnostics.push(...schemaErrors(schemas.ciIdentity, ciIdentity, 'authoritative-exact-head-ci'));
  diagnostics.push(...validateCiIdentity(ciIdentity, {
    repository: TARGET_REPOSITORY,
    repositoryId: TARGET_REPOSITORY_ID,
    prNumber: PR_NUMBER,
    headSha: receipt.target.head_sha,
  }));
  diagnostics.push(...schemaErrors(schemas.sequenceProducerIdentity, sequenceProducerIdentity, 'authoritative-sequence-producer'));
  diagnostics.push(...validateSequenceProducerIdentity(sequenceProducerIdentity, {
    repository: TARGET_REPOSITORY,
    repositoryId: TARGET_REPOSITORY_ID,
    prNumber: PR_NUMBER,
    headSha: receipt.target.head_sha,
    scopeRevision: scope.scope_revision,
  }));

  if (targetRepository.id !== TARGET_REPOSITORY_ID || targetRepository.full_name !== TARGET_REPOSITORY || targetRepository.default_branch !== 'main') diagnostics.push('AIGOV_REPOSITORY_IDENTITY_UNVERIFIED');
  if (pullRequest.number !== PR_NUMBER || pullRequest.base?.repo?.id !== TARGET_REPOSITORY_ID || pullRequest.base?.repo?.full_name !== TARGET_REPOSITORY) diagnostics.push('AIGOV_PR_IDENTITY_UNVERIFIED');
  if (pullRequest.merged !== true || !pullRequest.merged_at || !pullRequest.merge_commit_sha) diagnostics.push('AIGOV_PR_NOT_AUTHORITATIVELY_MERGED');
  if (pullRequest.user?.login !== receipt.review.implementer_identity) diagnostics.push('AIGOV_IMPLEMENTER_IDENTITY_UNVERIFIED');
  if (pullRequest.merged_by?.login !== OWNER) diagnostics.push('AIGOV_OWNER_MERGE_REQUIRED');
  if (pullRequest.base?.sha !== BASE_SHA || scope.base_sha !== BASE_SHA || receipt.target.base_sha !== BASE_SHA) diagnostics.push('AIGOV_BASE_SHA_MISMATCH');
  if (pullRequest.head?.sha !== receipt.target.head_sha || receipt.target.head_sha !== bundle.reviewedHeadSha) diagnostics.push('AIGOV_REVIEW_STALE_HEAD');
  if (mainCommit.sha !== bundle.localHead || mainCommit.sha !== bundle.currentMainSha) diagnostics.push('AIGOV_CURRENT_MAIN_IDENTITY_UNVERIFIED');
  if (!bundle.ancestorVerified) diagnostics.push('AIGOV_REVIEWED_HEAD_NOT_ANCESTOR');
  if (!bundle.mergeCommitAncestorVerified) diagnostics.push('AIGOV_MERGE_COMMIT_NOT_ANCESTOR');
  if (receipt.target.repository !== TARGET_REPOSITORY || receipt.target.repository_id !== TARGET_REPOSITORY_ID || receipt.target.pr_number !== PR_NUMBER) diagnostics.push('AIGOV_REVIEW_TARGET_IDENTITY_MISMATCH');
  if (receipt.target.scope_revision !== scope.scope_revision) diagnostics.push('AIGOV_REVIEW_STALE_SCOPE');
  if (receipt.receipt_id !== receiptId(receipt)) diagnostics.push('AIGOV_REVIEW_RECEIPT_HASH_MISMATCH');
  if (receipt.review.findings.some((finding) => finding.blocking)) diagnostics.push('AIGOV_REVIEW_HAS_BLOCKING_FINDINGS');
  if (Date.parse(receipt.review.reviewed_at) > Date.parse(pullRequest.merged_at)) diagnostics.push('AIGOV_REVIEW_AFTER_MERGE');
  if (!ciIdentity?.completed_at || Date.parse(receipt.review.reviewed_at) <= Date.parse(ciIdentity.completed_at)) diagnostics.push('AIGOV_REVIEW_PRECEDES_EXACT_HEAD_CI');
  if (!sequenceProducerIdentity?.completed_at || Date.parse(receipt.review.reviewed_at) <= Date.parse(sequenceProducerIdentity.completed_at)) diagnostics.push('AIGOV_REVIEW_PRECEDES_DESIGNATED_SEQUENCE_CI');

  if (inspectorRepository.id !== INSPECTOR_REPOSITORY_ID || inspectorRepository.full_name !== INSPECTOR_REPOSITORY || inspectorRepository.default_branch !== 'main' || inspectorRepository.id === targetRepository.id) diagnostics.push('AIGOV_INSPECTOR_REPOSITORY_UNVERIFIED');
  if (inspectorCommit.sha !== receipt.provenance.inspector_commit_sha || inspectorCommit.sha !== receiptSource.ref) diagnostics.push('AIGOV_INSPECTOR_COMMIT_UNVERIFIED');
  if (!['ahead', 'identical'].includes(inspectorAncestry?.status)
    || inspectorAncestry?.base_commit?.sha !== inspectorCommit.sha
    || inspectorAncestry?.merge_base_commit?.sha !== inspectorCommit.sha
    || inspectorAncestry?.head_commit?.sha !== inspectorMainCommit?.sha) diagnostics.push('AIGOV_INSPECTOR_COMMIT_NOT_ON_CURRENT_MAIN');
  if (inspectorCommit.url !== receipt.provenance.inspector_commit_api_url || inspectorCommit.html_url !== receipt.provenance.inspector_commit_html_url) diagnostics.push('AIGOV_INSPECTOR_COMMIT_URL_MISMATCH');
  if (receiptSource.repository !== INSPECTOR_REPOSITORY || receiptSource.repository === TARGET_REPOSITORY || receiptSource.path !== receipt.provenance.receipt_path) diagnostics.push('AIGOV_LOCAL_OR_TARGET_AUTHORED_RECEIPT');
  if (receiptSource.sha256 !== sha256(receiptSource.raw)) diagnostics.push('AIGOV_REVIEW_SOURCE_HASH_MISMATCH');

  if (currentVersion.raw.toString('utf8').trim() !== PROTOCOL_VERSION || protocolManifest.active_version !== PROTOCOL_VERSION || receipt.provenance.protocol_version !== PROTOCOL_VERSION) diagnostics.push('AIGOV_INSPECTOR_PROTOCOL_MISMATCH');
  if (JSON.stringify([...(protocolManifest.required_artifacts || [])].sort()) !== JSON.stringify(REQUIRED_ARTIFACTS)
    || protocolManifest.conditional_artifacts?.[PROMPT_ARTIFACT]?.required_when !== 'prompt_required == true'
    || protocolManifest.conditional_artifacts?.[PROMPT_ARTIFACT]?.forbidden_when !== 'prompt_required == false') diagnostics.push('AIGOV_INSPECTOR_ARTIFACT_PROTOCOL_MISMATCH');
  if (trustPolicySource.sha256 !== receipt.provenance.trust_policy_sha256 || trustPolicySource.sha256 !== sha256(trustPolicySource.raw)) diagnostics.push('AIGOV_TRUST_POLICY_HASH_MISMATCH');
  if (trustPolicy.inspector_repository !== INSPECTOR_REPOSITORY
    || trustPolicy.inspector_repository_id !== INSPECTOR_REPOSITORY_ID
    || trustPolicy.protocol_version !== PROTOCOL_VERSION
    || trustPolicy.commit_evidence_source !== 'github_rest_api_https') diagnostics.push('AIGOV_INSPECTOR_TRUST_POLICY_MISMATCH');

  const expectedArtifacts = directory.projection?.next_action?.prompt_required
    ? [...REQUIRED_ARTIFACTS, PROMPT_ARTIFACT].sort()
    : REQUIRED_ARTIFACTS;
  const declaredNames = receipt.provenance.immutable_artifacts.map((item) => item.name).sort();
  if (JSON.stringify(declaredNames) !== JSON.stringify(expectedArtifacts)) diagnostics.push('AIGOV_REVIEW_ARTIFACT_SET_INCOMPLETE');
  if (JSON.stringify([...artifacts.keys()].sort()) !== JSON.stringify(expectedArtifacts)) diagnostics.push('AIGOV_REVIEW_DIRECTORY_ARTIFACT_SET_MISMATCH');
  const receiptDirectory = path.posix.dirname(receiptSource.path);
  for (const declared of receipt.provenance.immutable_artifacts) {
    const observed = artifacts.get(declared.name);
    if (!observed || path.posix.dirname(observed.path) !== receiptDirectory) diagnostics.push(`AIGOV_REVIEW_ARTIFACT_SOURCE_MISMATCH:${declared.name}`);
    else if (observed.sha256 !== declared.sha256 || observed.blobSha !== declared.git_blob_sha || observed.sha256 !== sha256(observed.raw)) diagnostics.push(`AIGOV_REVIEW_ARTIFACT_HASH_MISMATCH:${declared.name}`);
  }
  if (receipt.review.review_package_sha256 !== directory.hashes?.canonical_review_package_sha256
    || receipt.review.review_package_file_sha256 !== directory.hashes?.review_package_file_sha256
    || receipt.review.decision_projection_sha256 !== directory.hashes?.decision_projection_sha256
    || receipt.review.artifact_manifest_sha256 !== directory.hashes?.artifact_manifest_sha256) diagnostics.push('AIGOV_REVIEW_DIRECTORY_HASH_BINDING_MISMATCH');
  if (receipt.review.ci_identity_digest !== ciIdentity?.identity_digest) diagnostics.push('AIGOV_REVIEW_CI_IDENTITY_MISMATCH');
  if (receipt.review.sequence_producer_identity_digest !== sequenceProducerIdentity?.identity_digest) diagnostics.push('AIGOV_REVIEW_SEQUENCE_PRODUCER_IDENTITY_MISMATCH');
  const expectedReviewer = `PR-Inspector@${PROTOCOL_VERSION}:${inspectorCommit.sha}`;
  if (receipt.review.reviewer_identity !== expectedReviewer || receipt.review.reviewer_identity === receipt.review.implementer_identity) diagnostics.push('AIGOV_REVIEWER_PROVENANCE_UNVERIFIED');

  const reviewDigest = receiptSource.sha256;
  const ciDigest = ciIdentity?.identity_digest || null;
  const mergeDigest = canonicalSha256({
    repository_id: targetRepository.id,
    pr_number: pullRequest.number,
    pr_head_sha: pullRequest.head?.sha,
    merge_actor: pullRequest.merged_by?.login,
    merge_commit_sha: pullRequest.merge_commit_sha,
    merged_at: pullRequest.merged_at,
  });
  const exactMainDigest = canonicalSha256({
    repository_id: targetRepository.id,
    current_main_sha: mainCommit.sha,
    api_url: mainCommit.url,
  });
  return { diagnostics, reviewDigest, ciDigest, mergeDigest, exactMainDigest, directoryHashes: directory.hashes };
}

const currentFile = fileURLToPath(import.meta.url);
const isMain = process.argv[1] && path.resolve(process.argv[1]) === currentFile;
if (isMain) {
  const verifier = fileURLToPath(new URL('./verify-aigov-v3-exact-main.mjs', import.meta.url));
  const result = spawnSync(process.execPath, [verifier, ...process.argv.slice(2)], { stdio: 'inherit' });
  process.exitCode = Number.isInteger(result.status) ? result.status : 1;
}
