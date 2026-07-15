import { readFileSync } from 'node:fs';
import { ciIdentityDigest, GITHUB_ACTIONS_PRODUCER } from './aigov-ci-evidence.mjs';
import { canonicalSha256, sha256 } from './aigov-lifecycle.mjs';
import { buildCanonicalArtifacts, canonicalPackageSha256 } from './pr-inspector-v1101.mjs';

const TARGET = 'rezahh107/EV4-Decision-Kernel';
const INSPECTOR = 'rezahh107/PR-Inspector';
const BASE = '5ff5d7b20db11af36ab787eb8ac2d1127ea74644';
const HEAD = 'a'.repeat(40);
const MAIN = 'b'.repeat(40);
const COMMIT = 'c'.repeat(40);
const SCOPE = `sha256:${'d'.repeat(64)}`;

function artifact(name, directory, raw, blobCharacter) {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8');
  return {
    repository: INSPECTOR,
    path: `${directory}/${name}`,
    ref: COMMIT,
    blobSha: blobCharacter.repeat(40),
    sha256: sha256(bytes),
    raw: bytes,
    json: name.endsWith('.json') ? JSON.parse(bytes.toString('utf8')) : null,
    apiUrl: `https://api.github.com/repos/${INSPECTOR}/contents/${directory}/${name}?ref=${COMMIT}`,
  };
}

export function validCiIdentityFixture() {
  const identity = {
    schema_version: 'aigov-ci-identity.v1',
    identity_digest: '',
    repository: TARGET,
    repository_id: 1292378784,
    pr_number: 49,
    tested_sha: HEAD,
    tested_ref_type: 'pull_request_head',
    synthetic_merge: false,
    workflow: { workflow_id: 1001, name: 'Validate MVK', path: '.github/workflows/validate-mvk.yml' },
    run: {
      run_id: 2001,
      run_attempt: 1,
      event: 'pull_request',
      head_branch: 'governance/aigov-v2-batch-a-enforcement',
      html_url: `https://github.com/${TARGET}/actions/runs/2001`,
      api_url: `https://api.github.com/repos/${TARGET}/actions/runs/2001`,
      conclusion: 'success',
      created_at: '2026-07-15T09:00:00.000Z',
      updated_at: '2026-07-15T09:30:01.000Z',
    },
    jobs: [
      ['External Coverage Trust Gate', 3001],
      ['Validate MVK', 3002],
      ['MVK and roadmap regressions', 3003],
    ].map(([name, jobId], index) => ({
      job_id: jobId,
      name,
      check_run_url: `https://api.github.com/repos/${TARGET}/check-runs/${jobId}`,
      html_url: `https://github.com/${TARGET}/actions/runs/2001/job/${jobId}`,
      started_at: `2026-07-15T09:${String(index * 10).padStart(2, '0')}:00.000Z`,
      completed_at: `2026-07-15T09:${String(index * 10 + 9).padStart(2, '0')}:00.000Z`,
      conclusion: 'success',
      check_external_id: `check-${jobId}`,
    })),
    check_producer: GITHUB_ACTIONS_PRODUCER,
    artifacts: [{ artifact_id: 4001, name: 'aigov-batch-a-scope-disclosure', api_url: `https://api.github.com/repos/${TARGET}/actions/artifacts/4001`, archive_download_url: `https://api.github.com/repos/${TARGET}/actions/artifacts/4001/zip`, digest: `sha256:${'e'.repeat(64)}`, created_at: '2026-07-15T09:29:00.000Z', expires_at: '2026-07-29T09:29:00.000Z' }],
    completed_at: '2026-07-15T09:29:00.000Z',
    evidence_source: 'github_rest_api_https',
    observed_at: '2026-07-15T09:31:00.000Z',
  };
  identity.identity_digest = ciIdentityDigest(identity);
  return identity;
}

export function refreshReceipt(bundle) {
  const projection = structuredClone(bundle.receipt);
  delete projection.receipt_id;
  bundle.receipt.receipt_id = `sha256:${canonicalSha256(projection)}`;
  bundle.receiptSource.raw = Buffer.from(`${JSON.stringify(bundle.receipt, null, 2)}\n`);
  bundle.receiptSource.sha256 = sha256(bundle.receiptSource.raw);
  return bundle;
}

export function validEvidenceFixture() {
  const directory = `reviews/EV4-Decision-Kernel/pr-49/${HEAD}/${'d'.repeat(64)}`;
  const reviewPackage = JSON.parse(readFileSync('kernel/fixtures/aigov/pr-inspector-v1.10.1/golden-green-review-package.json', 'utf8'));
  Object.assign(reviewPackage.review_identity, {
    target_repository: TARGET,
    pr_number: 49,
    base_sha: BASE,
    merge_base_sha: BASE,
    reviewed_head_sha: HEAD,
    inspector_commit_sha: COMMIT,
    review_started: '2026-07-15T09:40:00Z',
    review_completed: '2026-07-15T10:00:00Z',
  });
  for (const item of reviewPackage.evidence_records) item.reviewed_head_sha = HEAD;
  const packageRaw = Buffer.from(`${JSON.stringify(reviewPackage, null, 2)}\n`);
  const ciIdentity = validCiIdentityFixture();
  const canonicalArtifacts = buildCanonicalArtifacts(reviewPackage, packageRaw, ciIdentity).artifacts;
  const artifacts = [
    artifact('review-package.json', directory, packageRaw, '1'),
    ...Object.entries(canonicalArtifacts).map(([name, text], index) => artifact(name, directory, text, String(index + 2))),
  ];
  const byName = new Map(artifacts.map((item) => [item.path.split('/').at(-1), item]));
  const trustPolicy = { commit_evidence_source: 'github_rest_api_https', inspector_repository: INSPECTOR, inspector_repository_id: 1288323264, protocol_version: 'v1.10.1' };
  const trustPolicyRaw = Buffer.from(`${JSON.stringify(trustPolicy, null, 2)}\n`);
  const receipt = {
    schema_version: 'aigov-review-receipt.v2',
    receipt_id: '',
    plan_id: 'GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2',
    batch_id: 'BATCH_A',
    target: { repository: TARGET, repository_id: 1292378784, pr_number: 49, base_sha: BASE, head_sha: HEAD, scope_revision: SCOPE },
    review: {
      technical_status: 'GREEN_TECHNICALLY_READY',
      reviewed_at: '2026-07-15T10:00:00Z',
      reviewer_identity: `PR-Inspector@v1.10.1:${COMMIT}`,
      implementer_identity: 'rezahh107',
      review_package_sha256: canonicalPackageSha256(reviewPackage),
      review_package_file_sha256: byName.get('review-package.json').sha256,
      decision_projection_sha256: byName.get('DECISION_PROJECTION.json').sha256,
      artifact_manifest_sha256: byName.get('artifact-manifest.json').sha256,
      ci_identity_digest: ciIdentity.identity_digest,
      findings: [],
    },
    provenance: {
      evidence_source: 'github_rest_api_https', inspector_repository: INSPECTOR, inspector_repository_id: 1288323264, inspector_commit_sha: COMMIT,
      inspector_commit_api_url: `https://api.github.com/repos/${INSPECTOR}/commits/${COMMIT}`,
      inspector_commit_html_url: `https://github.com/${INSPECTOR}/commit/${COMMIT}`,
      protocol_version: 'v1.10.1', receipt_path: `${directory}/aigov-review-receipt.json`, trust_policy_path: 'protocols/v1.10.1/trust/INSPECTOR_TRUST_POLICY.json', trust_policy_sha256: sha256(trustPolicyRaw), observed_at: '2026-07-15T10:01:00Z',
      immutable_artifacts: artifacts.map((item) => ({ name: item.path.split('/').at(-1), path: item.path, sha256: item.sha256, git_blob_sha: item.blobSha })),
    },
  };
  const bundle = {
    targetRepository: { id: 1292378784, full_name: TARGET, default_branch: 'main' },
    pullRequest: { number: 49, merged: true, merged_at: '2026-07-15T11:00:00Z', merge_commit_sha: MAIN, html_url: `https://github.com/${TARGET}/pull/49`, user: { login: 'rezahh107' }, merged_by: { login: 'rezahh107' }, base: { sha: BASE, repo: { id: 1292378784, full_name: TARGET } }, head: { sha: HEAD } },
    mainCommit: { sha: MAIN, url: `https://api.github.com/repos/${TARGET}/commits/${MAIN}` },
    inspectorRepository: { id: 1288323264, full_name: INSPECTOR, default_branch: 'main' },
    inspectorCommit: { sha: COMMIT, url: `https://api.github.com/repos/${INSPECTOR}/commits/${COMMIT}`, html_url: `https://github.com/${INSPECTOR}/commit/${COMMIT}` },
    inspectorMainCommit: { sha: COMMIT },
    inspectorAncestry: { status: 'identical', base_commit: { sha: COMMIT }, merge_base_commit: { sha: COMMIT }, head_commit: { sha: COMMIT } },
    receiptSource: { repository: INSPECTOR, path: receipt.provenance.receipt_path, ref: COMMIT, blobSha: 'f'.repeat(40), sha256: '', raw: Buffer.alloc(0), apiUrl: 'https://api.github.com/receipt' },
    receipt,
    currentVersion: { raw: Buffer.from('v1.10.1\n') },
    protocolManifest: { active_version: 'v1.10.1', required_artifacts: ['review-package.json', 'DECISION_PROJECTION.json', 'OWNER_DECISION_CARD.fa.md', 'TECHNICAL_HANDOFF.en.md', 'OWNER_RESULT.fa.txt', 'artifact-manifest.json'], conditional_artifacts: { 'NEXT_ACTION_PROMPT.en.md': { required_when: 'prompt_required == true', forbidden_when: 'prompt_required == false' } } },
    trustPolicySource: { sha256: sha256(trustPolicyRaw), raw: trustPolicyRaw },
    trustPolicy,
    artifacts,
    ciIdentity,
    localHead: MAIN,
    currentMainSha: MAIN,
    reviewedHeadSha: HEAD,
    ancestorVerified: true,
    mergeCommitAncestorVerified: true,
  };
  return { bundle: refreshReceipt(bundle), scope: { base_sha: BASE, scope_revision: SCOPE }, constants: { BASE, HEAD, MAIN, COMMIT, SCOPE, TARGET, INSPECTOR } };
}
