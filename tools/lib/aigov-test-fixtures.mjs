import { canonicalSha256, sha256 } from './aigov-lifecycle.mjs';

const TARGET = 'rezahh107/EV4-Decision-Kernel';
const INSPECTOR = 'rezahh107/PR-Inspector';
const BASE = '5ff5d7b20db11af36ab787eb8ac2d1127ea74644';
const HEAD = 'a'.repeat(40);
const MAIN = 'b'.repeat(40);
const COMMIT = 'c'.repeat(40);
const SCOPE = `sha256:${'d'.repeat(64)}`;

function artifact(name, directory, json, blobCharacter) {
  const raw = Buffer.from(`${JSON.stringify(json, null, 2)}\n`);
  return { repository: INSPECTOR, path: `${directory}/${name}`, ref: COMMIT, blobSha: blobCharacter.repeat(40), sha256: sha256(raw), raw, json, apiUrl: `https://api.github.com/repos/${INSPECTOR}/contents/${directory}/${name}?ref=${COMMIT}` };
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
  const reviewPackage = {
    protocol_version: 'v1.10.1',
    review_identity: { inspector_repository: INSPECTOR, inspector_commit_sha: COMMIT, target_repository: TARGET, pr_number: 49, base_sha: BASE, reviewed_head_sha: HEAD, review_validity: 'CURRENT' },
    decision: { technical_status: 'GREEN_TECHNICALLY_READY', blocking_findings_count: 0 },
  };
  const artifacts = [
    artifact('review-package.json', directory, reviewPackage, '1'),
    artifact('DECISION_PROJECTION.json', directory, { technical_status: 'GREEN_TECHNICALLY_READY', reviewed_head_sha: HEAD }, '2'),
    artifact('artifact-manifest.json', directory, { reviewed_head_sha: HEAD }, '3'),
  ];
  const trustPolicy = { commit_evidence_source: 'github_rest_api_https', inspector_repository: INSPECTOR, inspector_repository_id: 1288323264, protocol_version: 'v1.10.1' };
  const trustPolicyRaw = Buffer.from(`${JSON.stringify(trustPolicy, null, 2)}\n`);
  const receipt = {
    schema_version: 'aigov-review-receipt.v2',
    receipt_id: '',
    plan_id: 'GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2',
    batch_id: 'BATCH_A',
    target: { repository: TARGET, repository_id: 1292378784, pr_number: 49, base_sha: BASE, head_sha: HEAD, scope_revision: SCOPE },
    review: { technical_status: 'GREEN_TECHNICALLY_READY', reviewed_at: '2026-07-15T10:00:00Z', reviewer_identity: `PR-Inspector@v1.10.1:${COMMIT}`, implementer_identity: 'rezahh107', review_package_sha256: artifacts[0].sha256, findings: [] },
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
    inspectorRepository: { id: 1288323264, full_name: INSPECTOR },
    inspectorCommit: { sha: COMMIT, url: `https://api.github.com/repos/${INSPECTOR}/commits/${COMMIT}`, html_url: `https://github.com/${INSPECTOR}/commit/${COMMIT}` },
    receiptSource: { repository: INSPECTOR, path: receipt.provenance.receipt_path, ref: COMMIT, blobSha: '4'.repeat(40), sha256: '', raw: Buffer.alloc(0), apiUrl: 'https://api.github.com/receipt' },
    receipt,
    currentVersion: { raw: Buffer.from('v1.10.1\n') },
    protocolManifest: { active_version: 'v1.10.1' },
    trustPolicySource: { sha256: sha256(trustPolicyRaw), raw: trustPolicyRaw },
    trustPolicy,
    artifacts,
    localHead: MAIN,
    currentMainSha: MAIN,
    reviewedHeadSha: HEAD,
    ancestorVerified: true,
    mergeCommitAncestorVerified: true,
  };
  return { bundle: refreshReceipt(bundle), scope: { base_sha: BASE, scope_revision: SCOPE }, constants: { BASE, HEAD, MAIN, COMMIT, SCOPE, TARGET, INSPECTOR } };
}
