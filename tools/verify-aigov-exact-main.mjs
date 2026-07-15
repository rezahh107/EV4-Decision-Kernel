#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parse as parseYaml } from 'yaml';
import {
  buildEvent,
  buildLedger,
  canonical,
  canonicalSha256,
  sha256,
  validateLifecycleLedger,
} from './lib/aigov-lifecycle.mjs';

const ROOT = process.cwd();
const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const TARGET_REPOSITORY_ID = 1292378784;
const INSPECTOR_REPOSITORY = 'rezahh107/PR-Inspector';
const INSPECTOR_REPOSITORY_ID = 1288323264;
const OWNER = 'rezahh107';
const PR_NUMBER = 49;
const PROTOCOL_VERSION = 'v1.10.1';
const PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2';
const BASE_SHA = '5ff5d7b20db11af36ab787eb8ac2d1127ea74644';
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';
const REVIEW_SCHEMA_PATH = 'kernel/schemas/aigov-review-receipt.v1.schema.json';
const EXACT_MAIN_SCHEMA_PATH = 'kernel/schemas/aigov-exact-main-receipt.v1.schema.json';
const LEDGER_SCHEMA_PATH = 'kernel/schemas/aigov-lifecycle-ledger.v1.schema.json';
const TRUST_POLICY_PATH = `protocols/${PROTOCOL_VERSION}/trust/INSPECTOR_TRUST_POLICY.json`;
const REVIEW_SCHEMA_REMOTE_PATH = `protocols/${PROTOCOL_VERSION}/schemas/review-package.schema.json`;
const REQUIRED_ARTIFACTS = ['DECISION_PROJECTION.json', 'artifact-manifest.json', 'review-package.json'];
const API_ORIGIN = 'https://api.github.com';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

function localJson(relativePath) {
  return JSON.parse(readFileSync(path.resolve(ROOT, relativePath), 'utf8'));
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function parseArgs(argv) {
  const result = { reviewCommit: null, reviewPath: null, lifecycleLedger: null, output: null, ledgerOutput: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--review-commit') result.reviewCommit = argv[++index];
    else if (arg === '--review-path') result.reviewPath = argv[++index];
    else if (arg === '--lifecycle-ledger') result.lifecycleLedger = argv[++index];
    else if (arg === '--output') result.output = argv[++index];
    else if (arg === '--ledger-output') result.ledgerOutput = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.reviewCommit || '')) throw new Error('--review-commit must be an exact 40-character inspector commit SHA.');
  if (!result.reviewPath || !result.lifecycleLedger) throw new Error('--review-path and --lifecycle-ledger are required.');
  return result;
}

function encodedPath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

async function githubJson(apiPath) {
  const url = `${API_ORIGIN}${apiPath}`;
  const response = await fetch(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'ev4-aigov-exact-main-verifier',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    redirect: 'error',
  });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return { value: await response.json(), url, observedAt: new Date().toISOString() };
}

async function githubContent(repository, artifactPath, ref) {
  const response = await githubJson(`/repos/${repository}/contents/${encodedPath(artifactPath)}?ref=${encodeURIComponent(ref)}`);
  const item = response.value;
  if (item?.type !== 'file' || item.encoding !== 'base64' || typeof item.content !== 'string') {
    throw new Error(`GitHub content payload is not an immutable file: ${repository}@${ref}:${artifactPath}`);
  }
  const raw = Buffer.from(item.content.replace(/\n/g, ''), 'base64');
  return {
    repository,
    path: artifactPath,
    ref,
    blobSha: item.sha,
    sha256: sha256(raw),
    raw,
    json: artifactPath.endsWith('.json') ? JSON.parse(raw.toString('utf8')) : null,
    apiUrl: response.url,
    observedAt: response.observedAt,
  };
}

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

function isAncestor(ancestor, descendant) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function exactRemoteMatches() {
  try {
    const remote = git(['remote', 'get-url', 'origin']);
    return [
      `https://github.com/${TARGET_REPOSITORY}.git`,
      `git@github.com:${TARGET_REPOSITORY}.git`,
      `https://github.com/${TARGET_REPOSITORY}`,
    ].includes(remote);
  } catch {
    return false;
  }
}

function artifactMap(artifacts) {
  return new Map(artifacts.map((item) => [path.basename(item.path), item]));
}

export function verifyEvidenceBundle(bundle, scope, schemas) {
  const diagnostics = [];
  const receiptSchemaDiagnostics = schemaErrors(schemas.reviewReceipt, bundle.receipt, 'external-review-receipt');
  diagnostics.push(...receiptSchemaDiagnostics);
  if (receiptSchemaDiagnostics.length) return { diagnostics, reviewDigest: null, mergeDigest: null, exactMainDigest: null };

  const { receipt, targetRepository, pullRequest, mainCommit, inspectorRepository, inspectorCommit, receiptSource, trustPolicySource, trustPolicy, currentVersion, protocolManifest } = bundle;
  const artifacts = artifactMap(bundle.artifacts || []);
  const reviewPackage = artifacts.get('review-package.json')?.json;
  const reviewPackageSchemaDiagnostics = schemaErrors(schemas.reviewPackage, reviewPackage, 'PR-Inspector/review-package.json');
  diagnostics.push(...reviewPackageSchemaDiagnostics);

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

  if (inspectorRepository.id !== INSPECTOR_REPOSITORY_ID || inspectorRepository.full_name !== INSPECTOR_REPOSITORY || inspectorRepository.id === targetRepository.id) diagnostics.push('AIGOV_INSPECTOR_REPOSITORY_UNVERIFIED');
  if (inspectorCommit.sha !== receipt.provenance.inspector_commit_sha || inspectorCommit.sha !== receiptSource.ref) diagnostics.push('AIGOV_INSPECTOR_COMMIT_UNVERIFIED');
  if (inspectorCommit.url !== receipt.provenance.inspector_commit_api_url || inspectorCommit.html_url !== receipt.provenance.inspector_commit_html_url) diagnostics.push('AIGOV_INSPECTOR_COMMIT_URL_MISMATCH');
  if (receiptSource.repository !== INSPECTOR_REPOSITORY || receiptSource.repository === TARGET_REPOSITORY || receiptSource.path !== receipt.provenance.receipt_path) diagnostics.push('AIGOV_LOCAL_OR_TARGET_AUTHORED_RECEIPT');
  if (receiptSource.sha256 !== sha256(receiptSource.raw)) diagnostics.push('AIGOV_REVIEW_SOURCE_HASH_MISMATCH');

  if (currentVersion.raw.toString('utf8').trim() !== PROTOCOL_VERSION || protocolManifest.active_version !== PROTOCOL_VERSION || receipt.provenance.protocol_version !== PROTOCOL_VERSION) diagnostics.push('AIGOV_INSPECTOR_PROTOCOL_MISMATCH');
  if (trustPolicySource.sha256 !== receipt.provenance.trust_policy_sha256 || trustPolicySource.sha256 !== sha256(trustPolicySource.raw)) diagnostics.push('AIGOV_TRUST_POLICY_HASH_MISMATCH');
  if (trustPolicy.inspector_repository !== INSPECTOR_REPOSITORY || trustPolicy.inspector_repository_id !== INSPECTOR_REPOSITORY_ID || trustPolicy.protocol_version !== PROTOCOL_VERSION || trustPolicy.commit_evidence_source !== 'github_rest_api_https') diagnostics.push('AIGOV_INSPECTOR_TRUST_POLICY_MISMATCH');

  const declaredNames = receipt.provenance.immutable_artifacts.map((item) => item.name).sort();
  if (JSON.stringify(declaredNames) !== JSON.stringify(REQUIRED_ARTIFACTS)) diagnostics.push('AIGOV_REVIEW_ARTIFACT_SET_INCOMPLETE');
  const receiptDirectory = path.posix.dirname(receiptSource.path);
  for (const declared of receipt.provenance.immutable_artifacts) {
    const observed = artifacts.get(declared.name);
    if (!observed || path.posix.dirname(observed.path) !== receiptDirectory) diagnostics.push(`AIGOV_REVIEW_ARTIFACT_SOURCE_MISMATCH:${declared.name}`);
    else if (observed.sha256 !== declared.sha256 || observed.blobSha !== declared.git_blob_sha || observed.sha256 !== sha256(observed.raw)) diagnostics.push(`AIGOV_REVIEW_ARTIFACT_HASH_MISMATCH:${declared.name}`);
  }
  if (receipt.review.review_package_sha256 !== artifacts.get('review-package.json')?.sha256) diagnostics.push('AIGOV_REVIEW_PACKAGE_HASH_MISMATCH');
  if (reviewPackage?.protocol_version !== PROTOCOL_VERSION
    || reviewPackage?.review_identity?.inspector_repository !== INSPECTOR_REPOSITORY
    || reviewPackage?.review_identity?.inspector_commit_sha !== inspectorCommit.sha
    || reviewPackage?.review_identity?.target_repository !== TARGET_REPOSITORY
    || reviewPackage?.review_identity?.pr_number !== PR_NUMBER
    || reviewPackage?.review_identity?.base_sha !== BASE_SHA
    || reviewPackage?.review_identity?.reviewed_head_sha !== receipt.target.head_sha
    || reviewPackage?.review_identity?.review_validity !== 'CURRENT'
    || reviewPackage?.decision?.technical_status !== 'GREEN_TECHNICALLY_READY'
    || reviewPackage?.decision?.blocking_findings_count !== 0) diagnostics.push('AIGOV_REVIEW_PACKAGE_SEMANTICS_MISMATCH');
  const expectedReviewer = `PR-Inspector@${PROTOCOL_VERSION}:${inspectorCommit.sha}`;
  if (receipt.review.reviewer_identity !== expectedReviewer || receipt.review.reviewer_identity === receipt.review.implementer_identity) diagnostics.push('AIGOV_REVIEWER_PROVENANCE_UNVERIFIED');

  const reviewDigest = receiptSource.sha256;
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
  return { diagnostics, reviewDigest, mergeDigest, exactMainDigest };
}

function run(command, args) {
  try {
    const output = execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { command: [command, ...args].join(' '), exit_code: 0, sha256: sha256(output) };
  } catch (error) {
    const output = `${error.stdout || ''}${error.stderr || ''}`;
    return { command: [command, ...args].join(' '), exit_code: error.status ?? 1, sha256: output ? sha256(output) : null };
  }
}

async function loadBundle(args, scope) {
  const [targetRepositoryResult, pullRequestResult, mainCommitResult, inspectorRepositoryResult, inspectorCommitResult] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/pulls/${PR_NUMBER}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`),
    githubJson(`/repos/${INSPECTOR_REPOSITORY}`),
    githubJson(`/repos/${INSPECTOR_REPOSITORY}/commits/${args.reviewCommit}`),
  ]);
  const receiptSource = await githubContent(INSPECTOR_REPOSITORY, args.reviewPath, args.reviewCommit);
  const receipt = receiptSource.json;
  const [currentVersion, protocolManifestSource, trustPolicySource, reviewPackageSchemaSource] = await Promise.all([
    githubContent(INSPECTOR_REPOSITORY, 'CURRENT_VERSION', args.reviewCommit),
    githubContent(INSPECTOR_REPOSITORY, 'protocol-manifest.yaml', args.reviewCommit),
    githubContent(INSPECTOR_REPOSITORY, TRUST_POLICY_PATH, args.reviewCommit),
    githubContent(INSPECTOR_REPOSITORY, REVIEW_SCHEMA_REMOTE_PATH, args.reviewCommit),
  ]);
  const artifacts = await Promise.all((receipt?.provenance?.immutable_artifacts || []).map((item) => githubContent(INSPECTOR_REPOSITORY, item.path, args.reviewCommit)));
  const localHead = git(['rev-parse', 'HEAD']);
  return {
    bundle: {
      targetRepository: targetRepositoryResult.value,
      pullRequest: pullRequestResult.value,
      mainCommit: mainCommitResult.value,
      inspectorRepository: inspectorRepositoryResult.value,
      inspectorCommit: inspectorCommitResult.value,
      receiptSource,
      receipt,
      currentVersion,
      protocolManifest: parseYaml(protocolManifestSource.raw.toString('utf8')),
      trustPolicySource,
      trustPolicy: trustPolicySource.json,
      artifacts,
      localHead,
      currentMainSha: mainCommitResult.value.sha,
      reviewedHeadSha: pullRequestResult.value.head?.sha,
      ancestorVerified: isAncestor(pullRequestResult.value.head?.sha, mainCommitResult.value.sha),
      mergeCommitAncestorVerified: isAncestor(pullRequestResult.value.merge_commit_sha, mainCommitResult.value.sha),
    },
    schemas: {
      reviewReceipt: localJson(REVIEW_SCHEMA_PATH),
      reviewPackage: reviewPackageSchemaSource.json,
    },
    observationTimes: [targetRepositoryResult, pullRequestResult, mainCommitResult, inspectorRepositoryResult, inspectorCommitResult]
      .map((item) => item.observedAt),
  };
}

function extendLedger(partialLedger, context, receipt, pullRequest, evidence) {
  const events = structuredClone(partialLedger.events);
  let predecessorEventId = events.at(-1)?.event_id || null;
  const tails = [
    ['independent_review_green', receipt.review.reviewed_at, 'external_review', evidence.reviewDigest, receipt.provenance.receipt_path],
    ['owner_merge', pullRequest.merged_at, 'authoritative_owner_merge', evidence.mergeDigest, pullRequest.html_url],
    ['exact_main_verified', new Date().toISOString(), 'authoritative_exact_main', evidence.exactMainDigest, `https://api.github.com/repos/${TARGET_REPOSITORY}/commits/main`],
  ];
  for (const [eventType, occurredAt, kind, digest, reference] of tails) {
    const event = buildEvent({ eventType, predecessorEventId, occurredAt, context, evidence: { kind, sha256: digest, reference } });
    events.push(event);
    predecessorEventId = event.event_id;
  }
  return buildLedger(context, events);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = localJson(SCOPE_PATH);
  const diagnostics = [];
  const head = git(['rev-parse', 'HEAD']);
  const branch = git(['symbolic-ref', '--short', '-q', 'HEAD']);
  if (branch && branch !== 'main') diagnostics.push('AIGOV_EXACT_MAIN_REQUIRED');
  if (!exactRemoteMatches()) diagnostics.push('AIGOV_REMOTE_REPOSITORY_IDENTITY_MISMATCH');
  if (process.env.GITHUB_REF_NAME && process.env.GITHUB_REF_NAME !== 'main') diagnostics.push('AIGOV_GITHUB_REF_CONTRADICTS_MAIN');

  let loaded;
  try {
    loaded = await loadBundle(args, scope);
  } catch (error) {
    diagnostics.push(`AIGOV_AUTHORITATIVE_EVIDENCE_UNAVAILABLE:${error.message}`);
  }

  let evidence = { diagnostics: [], reviewDigest: null, mergeDigest: null, exactMainDigest: null };
  let fullLedger = null;
  let checks = [];
  if (loaded) {
    evidence = verifyEvidenceBundle(loaded.bundle, scope, loaded.schemas);
    diagnostics.push(...evidence.diagnostics);
    if (loaded.bundle.currentMainSha !== head) diagnostics.push('AIGOV_LOCAL_HEAD_NOT_CURRENT_MAIN');

    const partialPath = path.resolve(ROOT, args.lifecycleLedger);
    if (!existsSync(partialPath)) diagnostics.push('AIGOV_LIFECYCLE_LEDGER_MISSING');
    else {
      const partialLedger = JSON.parse(readFileSync(partialPath, 'utf8'));
      diagnostics.push(...schemaErrors(localJson(LEDGER_SCHEMA_PATH), partialLedger, args.lifecycleLedger));
      const context = {
        planId: PLAN_ID,
        batchId: 'BATCH_A',
        repository: TARGET_REPOSITORY,
        repositoryId: TARGET_REPOSITORY_ID,
        prNumber: PR_NUMBER,
        baseSha: BASE_SHA,
        headSha: loaded.bundle.reviewedHeadSha,
        scopeRevision: scope.scope_revision,
      };
      if ((partialLedger.events || []).length !== 5 || partialLedger.events?.at(-1)?.event_type !== 'exact_head_validated') diagnostics.push('AIGOV_PARTIAL_LEDGER_NOT_EXACT_HEAD_VALIDATED');
      if (!diagnostics.length) {
        fullLedger = extendLedger(partialLedger, context, loaded.bundle.receipt, loaded.bundle.pullRequest, evidence);
        diagnostics.push(...schemaErrors(localJson(LEDGER_SCHEMA_PATH), fullLedger, 'generated-full-lifecycle-ledger'));
        diagnostics.push(...validateLifecycleLedger(fullLedger, context, {
          reviewDigests: new Set([evidence.reviewDigest]),
          mergeDigests: new Set([evidence.mergeDigest]),
          exactMainDigests: new Set([evidence.exactMainDigest]),
        }).map((item) => item.code));
      }
    }

    if (!diagnostics.length) {
      const tempDir = mkdtempSync(path.join(os.tmpdir(), 'aigov-review-'));
      try {
        const receiptPath = path.join(tempDir, 'aigov-review-receipt.json');
        writeFileSync(receiptPath, loaded.bundle.receiptSource.raw);
        checks = [
          run('npm', ['run', 'validate:aigov', '--', '--review-receipt', receiptPath, '--expected-head', loaded.bundle.reviewedHeadSha]),
          run('npm', ['run', 'test:aigov-sequence']),
          run('npm', ['run', 'validate:roadmap-memory']),
          run('npm', ['run', 'validate:coverage']),
          run('npm', ['run', 'validate:mvk']),
        ];
      } finally {
        rmSync(tempDir, { recursive: true, force: true });
      }
      if (checks.some((check) => check.exit_code !== 0)) diagnostics.push('AIGOV_EXACT_MAIN_MATRIX_RED');
    }
  }

  const observedAt = new Date().toISOString();
  const immutableArtifacts = loaded ? [
    { name: 'target-repository-api-payload', reference: `https://api.github.com/repos/${TARGET_REPOSITORY}`, sha256: canonicalSha256(loaded.bundle.targetRepository) },
    { name: 'target-pr-api-payload', reference: `https://api.github.com/repos/${TARGET_REPOSITORY}/pulls/${PR_NUMBER}`, sha256: canonicalSha256(loaded.bundle.pullRequest) },
    { name: 'current-main-api-payload', reference: `https://api.github.com/repos/${TARGET_REPOSITORY}/commits/main`, sha256: canonicalSha256(loaded.bundle.mainCommit) },
    { name: 'inspector-commit-api-payload', reference: loaded.bundle.inspectorCommit.url, sha256: canonicalSha256(loaded.bundle.inspectorCommit) },
    { name: 'external-review-receipt', reference: loaded.bundle.receiptSource.apiUrl, sha256: loaded.bundle.receiptSource.sha256 },
    ...loaded.bundle.artifacts.map((item) => ({ name: path.basename(item.path), reference: item.apiUrl, sha256: item.sha256 })),
  ] : [];
  const receipt = {
    schema_version: 'aigov-exact-main-receipt.v1',
    receipt_id: '',
    plan_id: scope.plan_id,
    batch_id: 'BATCH_A',
    repository: TARGET_REPOSITORY,
    repository_id: TARGET_REPOSITORY_ID,
    pr_number: PR_NUMBER,
    pr_author: loaded?.bundle.pullRequest.user?.login || 'unverified',
    merge_actor: loaded?.bundle.pullRequest.merged_by?.login || 'unverified',
    merged_at: loaded?.bundle.pullRequest.merged_at || observedAt,
    base_sha: loaded?.bundle.pullRequest.base?.sha || BASE_SHA,
    pr_head_sha: loaded?.bundle.pullRequest.head?.sha || '0'.repeat(40),
    merge_commit_sha: loaded?.bundle.pullRequest.merge_commit_sha || '0'.repeat(40),
    current_main_sha: loaded?.bundle.currentMainSha || head,
    scope_revision: scope.scope_revision,
    protocol_version: PROTOCOL_VERSION,
    reviewer_identity: loaded?.bundle.receipt?.review?.reviewer_identity || 'unverified',
    evidence_source: 'fresh_github_rest_api_and_immutable_inspector_artifacts',
    observed_at: observedAt,
    immutable_artifacts: immutableArtifacts,
    lifecycle_ledger_sha256: fullLedger ? canonicalSha256(fullLedger) : '0'.repeat(64),
    checks,
    coverage_status: 'not_measurable_pending_external_promotion',
    kroad_012r_status: 'historical_non_authoritative',
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostics,
  };
  const receiptProjection = structuredClone(receipt);
  delete receiptProjection.receipt_id;
  receipt.receipt_id = `sha256:${canonicalSha256(receiptProjection)}`;
  if (!diagnostics.length) diagnostics.push(...schemaErrors(localJson(EXACT_MAIN_SCHEMA_PATH), receipt, 'generated-exact-main-receipt'));
  receipt.status = diagnostics.length ? 'fail' : 'pass';
  receipt.diagnostics = diagnostics;

  if (fullLedger && args.ledgerOutput) writeFileSync(path.resolve(ROOT, args.ledgerOutput), `${JSON.stringify(canonical(fullLedger), null, 2)}\n`);
  const output = `${JSON.stringify(receipt, null, 2)}\n`;
  if (args.output) writeFileSync(path.resolve(ROOT, args.output), output);
  process.stdout.write(output);
  if (diagnostics.length) process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main().catch((error) => {
  console.error(JSON.stringify({ status: 'fail', diagnostics: [`AIGOV_EXACT_MAIN_INTERNAL_ERROR:${error.message}`] }, null, 2));
  process.exitCode = 1;
});
