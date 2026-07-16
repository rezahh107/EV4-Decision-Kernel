import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parse as parseYaml } from 'yaml';
import { canonical, sha256 } from './aigov-lifecycle.mjs';
import { isVerifiedCiAggregate } from './aigov-ci-descriptor.mjs';

export const PROTOCOL_VERSION = 'v1.10.2';
export const INSPECTOR_COMMIT = '9ed48bd995ee5b9270756254b04c1d48ccf21cbe';
export const INSPECTOR_REPOSITORY = 'rezahh107/PR-Inspector';
export const INSPECTOR_REPOSITORY_ID = 1288323264;
export const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
export const TARGET_REPOSITORY_ID = 1292378784;
export const TARGET_PR_NUMBER = 50;
export const RELEASE_LOCK_PATH = 'release-locks/v1.10.2.sha256';
export const FIXED_ARTIFACTS = [
  'review-package.json',
  'DECISION_PROJECTION.json',
  'OWNER_DECISION_CARD.fa.md',
  'TECHNICAL_HANDOFF.en.md',
  'OWNER_RESULT.fa.txt',
  'artifact-manifest.json',
];
export const PROMPT_ARTIFACT = 'NEXT_ACTION_PROMPT.en.md';

const VERIFIED_DIRECTORIES = new WeakSet();
const VERIFIED_PROVENANCE = new WeakSet();
const VERIFIED_REVIEWS = new WeakSet();
const ALLOWED_REMOTES = new Set([
  'https://github.com/rezahh107/PR-Inspector.git',
  'https://github.com/rezahh107/PR-Inspector',
  'git@github.com:rezahh107/PR-Inspector.git',
]);
const validSha = (value) => /^[0-9a-f]{40}$/.test(value || '');
const validScope = (value) => /^sha256:[0-9a-f]{64}$/.test(value || '');
const unique = (values) => [...new Set(values)];

function freezeEvidence(value, registry) {
  const evidence = Object.freeze(value);
  registry.add(evidence);
  return evidence;
}

export function canonicalPackageSha256(pkg) {
  return sha256(`${JSON.stringify(canonical(pkg))}\n`);
}

function parseLock(text) {
  const entries = new Map();
  for (const line of String(text || '').split(/\r?\n/).filter(Boolean)) {
    const match = line.match(/^([0-9a-f]{64})  (\S+)$/);
    if (!match || entries.has(match[2])) throw new Error('PRI-ACTIVE-LOCK-INVALID');
    entries.set(match[2], match[1]);
  }
  return entries;
}

export function verifyActiveProtocolSnapshot(readText) {
  const version = readText('CURRENT_VERSION').trim();
  if (version !== PROTOCOL_VERSION) throw new Error('PRI-ACTIVE-VERSION-MISMATCH');
  const manifest = parseYaml(readText('protocol-manifest.yaml'));
  if (!manifest
    || manifest.active_version !== PROTOCOL_VERSION
    || manifest.status !== 'active'
    || manifest.entrypoint !== 'BOOTSTRAP.md') throw new Error('PRI-ACTIVE-MANIFEST-MISMATCH');
  if (manifest.release_lock !== RELEASE_LOCK_PATH) throw new Error('PRI-ACTIVE-LOCK-PATH-MISMATCH');
  if (manifest.canonical_contract !== `protocols/${PROTOCOL_VERSION}/PR_REVIEW_CONTRACT.md`
    || manifest.canonical_schema !== `protocols/${PROTOCOL_VERSION}/schemas/review-package.schema.json`) throw new Error('PRI-ACTIVE-CANONICAL-PATH-MISMATCH');
  const loadOrder = manifest.load_order;
  if (!Array.isArray(loadOrder)
    || !loadOrder.length
    || new Set(loadOrder).size !== loadOrder.length
    || loadOrder.some((item) => !String(item).startsWith(`protocols/${PROTOCOL_VERSION}/`))) throw new Error('PRI-ACTIVE-LOAD-ORDER-INVALID');
  const lock = parseLock(readText(RELEASE_LOCK_PATH));
  if (lock.size !== loadOrder.length || loadOrder.some((item) => !lock.has(item))) throw new Error('PRI-ACTIVE-LOCK-COVERAGE-MISMATCH');
  for (const item of loadOrder) {
    const raw = Buffer.from(readText(item), 'utf8');
    if (sha256(raw) !== lock.get(item)) throw new Error(`PRI-ACTIVE-LOCK-HASH-MISMATCH:${item}`);
  }
  const policy = JSON.parse(readText(`protocols/${PROTOCOL_VERSION}/trust/INSPECTOR_TRUST_POLICY.json`));
  if (policy.protocol_version !== PROTOCOL_VERSION
    || policy.inspector_repository !== INSPECTOR_REPOSITORY
    || policy.inspector_repository_id !== INSPECTOR_REPOSITORY_ID
    || policy.commit_evidence_source !== 'github_rest_api_https') throw new Error('PRI-ACTIVE-TRUST-POLICY-MISMATCH');
  return Object.freeze({ version, manifest, lock_entries: lock.size, trust_policy: policy });
}

export function deterministicReviewDirectory({ headSha, scopeRevision }) {
  if (!validSha(headSha) || !validScope(scopeRevision)) throw new Error('PRI-OFFICIAL-REVIEW-IDENTITY-INVALID');
  return `reviews/targets/${TARGET_REPOSITORY_ID}/pr-${TARGET_PR_NUMBER}/${headSha}/${scopeRevision.slice('sha256:'.length)}`;
}

function inspectorRoot(explicitRoot) {
  const candidates = [
    explicitRoot,
    process.env.PR_INSPECTOR_ROOT,
    '/tmp/pr-inspector-9ed48bd995',
    path.resolve(process.cwd(), '_external/pr-inspector'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const root = path.resolve(candidate);
      const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
      const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).trim();
      const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: root, encoding: 'utf8' }).trim();
      if (head !== INSPECTOR_COMMIT || !ALLOWED_REMOTES.has(remote) || status !== '') continue;
      verifyActiveProtocolSnapshot((relativePath) => readFileSync(path.join(root, relativePath), 'utf8'));
      return root;
    } catch {
      // Try the next exact immutable checkout candidate.
    }
  }
  throw new Error(`PRI-OFFICIAL-ROOT-001: exact ${INSPECTOR_COMMIT} ${PROTOCOL_VERSION} PR Inspector checkout is unavailable`);
}

function writeDirectory(artifacts) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'ev4-pr-inspector-directory-'));
  const seen = new Set();
  for (const item of artifacts || []) {
    const name = path.posix.basename(item.path || '');
    if (![...FIXED_ARTIFACTS, PROMPT_ARTIFACT].includes(name) || seen.has(name) || !Buffer.isBuffer(item.raw)) {
      rmSync(directory, { recursive: true, force: true });
      throw new Error(`PRI-OFFICIAL-INPUT-001:${name || 'unknown'}`);
    }
    seen.add(name);
    writeFileSync(path.join(directory, name), item.raw);
  }
  return directory;
}

export function isVerifiedOfficialDirectoryEvidence(value) {
  return Boolean(value && VERIFIED_DIRECTORIES.has(value));
}
export function isVerifiedInspectorReviewProvenance(value) {
  return Boolean(value && VERIFIED_PROVENANCE.has(value));
}
export function isVerifiedOfficialReviewEvidence(value) {
  return Boolean(value && VERIFIED_REVIEWS.has(value));
}

export function verifyOfficialReviewDirectory({ artifacts, context, live = true, explicitInspectorRoot = null }) {
  const root = inspectorRoot(explicitInspectorRoot);
  const directory = writeDirectory(artifacts);
  const pycache = mkdtempSync(path.join(os.tmpdir(), 'ev4-pr-inspector-pycache-'));
  try {
    let command;
    let args;
    if (live) {
      command = 'python3';
      args = [
        path.resolve(process.cwd(), 'tools/pr-inspector-official-boundary-v1102.py'),
        '--inspector-root', root,
        '--review-directory', directory,
        '--inspector-commit', INSPECTOR_COMMIT,
        '--target-repository', context.repository,
        '--pr-number', String(context.prNumber),
        '--reviewed-head-sha', context.headSha,
        '--reviewed-scope-revision', context.scopeRevision,
      ];
    } else {
      command = 'python3';
      args = [path.join(root, 'scripts/validate_review_v2.py'), directory];
    }
    const environment = { ...process.env, PYTHONPYCACHEPREFIX: pycache };
    delete environment.PYTHONHOME;
    delete environment.PYTHONPATH;
    const run = spawnSync(command, args, {
      cwd: root,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      env: environment,
    });
    const output = `${run.stdout || ''}${run.stderr || ''}`.trim();
    if (run.status !== 0) {
      return freezeEvidence({
        status: 'fail',
        live,
        diagnostics: [`PRI-OFFICIAL-BOUNDARY-FAILED:${output || `exit-${run.status ?? 1}`}`],
        projection: null,
        hashes: null,
      }, VERIFIED_DIRECTORIES);
    }
    const projectionRaw = readFileSync(path.join(directory, 'DECISION_PROJECTION.json'));
    const packageRaw = readFileSync(path.join(directory, 'review-package.json'));
    const manifestRaw = readFileSync(path.join(directory, 'artifact-manifest.json'));
    const projection = JSON.parse(projectionRaw.toString('utf8'));
    const reviewPackage = JSON.parse(packageRaw.toString('utf8'));
    const hashes = {
      canonical_review_package_sha256: canonicalPackageSha256(reviewPackage),
      review_package_file_sha256: sha256(packageRaw),
      decision_projection_sha256: sha256(projectionRaw),
      artifact_manifest_sha256: sha256(manifestRaw),
      artifact_byte_hashes: Object.fromEntries(
        [...FIXED_ARTIFACTS, ...(projection.next_action?.prompt_required ? [PROMPT_ARTIFACT] : [])]
          .sort()
          .map((name) => [name, sha256(readFileSync(path.join(directory, name)))]),
      ),
    };
    let liveSummary = null;
    if (live) {
      const lines = (run.stdout || '').trim().split(/\r?\n/);
      liveSummary = JSON.parse(lines.at(-1));
      if (liveSummary.protocol_version !== PROTOCOL_VERSION
        || liveSummary.inspector_repository !== INSPECTOR_REPOSITORY
        || liveSummary.inspector_repository_id !== INSPECTOR_REPOSITORY_ID
        || liveSummary.inspector_commit_sha !== INSPECTOR_COMMIT
        || liveSummary.technical_status !== projection.technical_status
        || liveSummary.next_action_kind !== projection.next_action?.kind
        || liveSummary.reviewed_head_sha !== context.headSha
        || liveSummary.reviewed_scope_revision !== context.scopeRevision
        || liveSummary.review_package_canonical_sha256 !== hashes.canonical_review_package_sha256
        || liveSummary.review_package_file_sha256 !== hashes.review_package_file_sha256
        || liveSummary.decision_projection_sha256 !== hashes.decision_projection_sha256
        || liveSummary.artifact_manifest_sha256 !== hashes.artifact_manifest_sha256
        || JSON.stringify(liveSummary.artifact_byte_hashes) !== JSON.stringify(hashes.artifact_byte_hashes)) {
        throw new Error('PRI-OFFICIAL-BOUNDARY-SUMMARY-MISMATCH');
      }
    }
    return freezeEvidence({
      status: 'pass',
      live,
      diagnostics: [],
      projection,
      reviewPackage,
      liveSummary,
      hashes,
    }, VERIFIED_DIRECTORIES);
  } catch (error) {
    return freezeEvidence({
      status: 'fail',
      live,
      diagnostics: [`PRI-OFFICIAL-BOUNDARY-FAILED:${error.message}`],
      projection: null,
      hashes: null,
    }, VERIFIED_DIRECTORIES);
  } finally {
    rmSync(directory, { recursive: true, force: true });
    rmSync(pycache, { recursive: true, force: true });
  }
}

export function verifyInspectorReviewProvenancePayloads({
  repository,
  publicationCommit,
  currentMainCommit,
  ancestry,
  candidateCommits,
  reviewDirectory,
  directoryListing,
  headSha,
  scopeRevision,
}) {
  const diagnostics = [];
  const expectedDirectory = (() => {
    try { return deterministicReviewDirectory({ headSha, scopeRevision }); } catch { return null; }
  })();
  if (repository?.id !== INSPECTOR_REPOSITORY_ID
    || repository?.full_name !== INSPECTOR_REPOSITORY
    || repository?.default_branch !== 'main') diagnostics.push('PRI-OFFICIAL-REPOSITORY-IDENTITY-MISMATCH');
  if (!validSha(publicationCommit?.sha) || !validSha(currentMainCommit?.sha)) diagnostics.push('PRI-OFFICIAL-COMMIT-IDENTITY-MALFORMED');
  if (!expectedDirectory || reviewDirectory !== expectedDirectory) diagnostics.push('PRI-OFFICIAL-REVIEW-DIRECTORY-MISMATCH');
  if (!Array.isArray(candidateCommits) || candidateCommits.length !== 1 || candidateCommits[0]?.sha !== publicationCommit?.sha) diagnostics.push('PRI-OFFICIAL-REVIEW-PUBLICATION-AMBIGUOUS');
  if (!['ahead', 'identical'].includes(ancestry?.status)
    || ancestry?.base_commit?.sha !== publicationCommit?.sha
    || ancestry?.merge_base_commit?.sha !== publicationCommit?.sha
    || ancestry?.head_commit?.sha !== currentMainCommit?.sha) diagnostics.push('PRI-OFFICIAL-REVIEW-COMMIT-NOT-ON-MAIN');
  const names = Array.isArray(directoryListing)
    ? directoryListing.filter((item) => item?.type === 'file').map((item) => item.name).sort()
    : [];
  const fixed = [...FIXED_ARTIFACTS].sort();
  const withPrompt = [...FIXED_ARTIFACTS, PROMPT_ARTIFACT].sort();
  if (JSON.stringify(names) !== JSON.stringify(fixed) && JSON.stringify(names) !== JSON.stringify(withPrompt)) diagnostics.push('PRI-OFFICIAL-REVIEW-ARTIFACT-SET-INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  return {
    diagnostics: [],
    evidence: freezeEvidence({
      schema_version: 'pr-inspector-review-provenance.v1',
      inspector_repository: INSPECTOR_REPOSITORY,
      inspector_repository_id: INSPECTOR_REPOSITORY_ID,
      publication_commit_sha: publicationCommit.sha,
      published_at: publicationCommit.commit?.committer?.date || publicationCommit.commit?.author?.date || null,
      current_inspector_main_sha: currentMainCommit.sha,
      review_directory: reviewDirectory,
      active_protocol_version: PROTOCOL_VERSION,
      active_release_commit: INSPECTOR_COMMIT,
    }, VERIFIED_PROVENANCE),
  };
}

export function reviewSequenceDiagnostics({
  reviewPackage,
  projection,
  liveSummary,
  headSha,
  scopeRevision,
  exactHeadCiCompletedAt,
  mergedAt,
}) {
  const diagnostics = [];
  const reviewedAt = reviewPackage?.review_identity?.review_completed || null;
  const reviewedTime = Date.parse(reviewedAt);
  const ciTime = Date.parse(exactHeadCiCompletedAt);
  const mergeTime = Date.parse(mergedAt);
  if (reviewPackage?.protocol_version !== PROTOCOL_VERSION
    || reviewPackage?.review_identity?.inspector_commit_sha !== INSPECTOR_COMMIT) diagnostics.push('PRI-OFFICIAL-ACTIVE-PROTOCOL-MISMATCH');
  if (reviewPackage?.review_identity?.target_repository !== TARGET_REPOSITORY
    || reviewPackage?.review_identity?.pr_number !== TARGET_PR_NUMBER
    || reviewPackage?.review_identity?.reviewed_head_sha !== headSha) diagnostics.push('PRI-OFFICIAL-REVIEW-HEAD-IDENTITY-MISMATCH');
  if (!validScope(scopeRevision)) diagnostics.push('PRI-OFFICIAL-REVIEW-SCOPE-IDENTITY-MISMATCH');
  if (projection?.technical_status !== 'GREEN_TECHNICALLY_READY'
    || projection?.next_action?.kind !== 'merge_now'
    || projection?.security_profile?.sequence_ci_enforced !== true) diagnostics.push('PRI-OFFICIAL-REVIEW-NOT-GREEN');
  if (liveSummary?.sequence_capability_verified !== true
    || liveSummary?.protocol_version !== PROTOCOL_VERSION
    || liveSummary?.reviewed_head_sha !== headSha
    || liveSummary?.reviewed_scope_revision !== scopeRevision) diagnostics.push('PRI-OFFICIAL-LIVE-CAPABILITY-UNVERIFIED');
  if (!Number.isFinite(reviewedTime) || !Number.isFinite(ciTime) || reviewedTime <= ciTime) diagnostics.push('PRI-OFFICIAL-REVIEW-BEFORE-FINAL-CI');
  if (!Number.isFinite(reviewedTime) || !Number.isFinite(mergeTime) || reviewedTime >= mergeTime) diagnostics.push('PRI-OFFICIAL-REVIEW-AFTER-MERGE');
  return unique(diagnostics);
}

export function verifyOfficialReviewEvidence({
  directoryEvidence,
  provenanceEvidence,
  exactHeadCi,
  headSha,
  scopeRevision,
  mergedAt,
}) {
  const diagnostics = [];
  if (!isVerifiedOfficialDirectoryEvidence(directoryEvidence)
    || directoryEvidence.status !== 'pass'
    || directoryEvidence.live !== true) diagnostics.push('PRI-OFFICIAL-REVIEW-DIRECTORY-UNVERIFIED');
  if (!isVerifiedInspectorReviewProvenance(provenanceEvidence)) diagnostics.push('PRI-OFFICIAL-REVIEW-PROVENANCE-UNVERIFIED');
  if (!isVerifiedCiAggregate(exactHeadCi) || exactHeadCi.exact_head_sha !== headSha) diagnostics.push('PRI-OFFICIAL-REVIEW-CI-UNVERIFIED');
  if (!validSha(headSha) || !validScope(scopeRevision)) diagnostics.push('PRI-OFFICIAL-REVIEW-IDENTITY-INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  diagnostics.push(...reviewSequenceDiagnostics({
    reviewPackage: directoryEvidence.reviewPackage,
    projection: directoryEvidence.projection,
    liveSummary: directoryEvidence.liveSummary,
    headSha,
    scopeRevision,
    exactHeadCiCompletedAt: exactHeadCi.completed_at,
    mergedAt,
  }));
  const expectedDirectory = deterministicReviewDirectory({ headSha, scopeRevision });
  if (provenanceEvidence.review_directory !== expectedDirectory) diagnostics.push('PRI-OFFICIAL-REVIEW-DIRECTORY-MISMATCH');
  const publishedTime = Date.parse(provenanceEvidence.published_at);
  const mergeTime = Date.parse(mergedAt);
  if (!Number.isFinite(publishedTime) || !Number.isFinite(mergeTime) || publishedTime >= mergeTime) diagnostics.push('PRI-OFFICIAL-REVIEW-PUBLISHED-AFTER-MERGE');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  return {
    diagnostics: [],
    evidence: freezeEvidence({
      schema_version: 'pr-inspector-official-review-evidence.v1',
      protocol_version: PROTOCOL_VERSION,
      inspector_repository: INSPECTOR_REPOSITORY,
      inspector_repository_id: INSPECTOR_REPOSITORY_ID,
      inspector_release_commit: INSPECTOR_COMMIT,
      publication_commit_sha: provenanceEvidence.publication_commit_sha,
      review_directory: provenanceEvidence.review_directory,
      target_repository: TARGET_REPOSITORY,
      target_repository_id: TARGET_REPOSITORY_ID,
      pr_number: TARGET_PR_NUMBER,
      reviewed_head_sha: headSha,
      reviewed_scope_revision: scopeRevision,
      review_status: 'GREEN_TECHNICALLY_READY',
      reviewer_identity: `PR-Inspector@${PROTOCOL_VERSION}:${INSPECTOR_COMMIT}`,
      reviewed_at: new Date(Date.parse(directoryEvidence.reviewPackage.review_identity.review_completed)).toISOString(),
      review_completed_after_exact_head_ci: true,
      review_completed_before_merge: true,
      provenance: 'official_pr_inspector_repository',
      hashes: directoryEvidence.hashes,
    }, VERIFIED_REVIEWS),
  };
}
