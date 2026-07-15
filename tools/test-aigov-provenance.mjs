#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { verifyEvidenceBundle } from './verify-aigov-exact-main.mjs';
import { canonical, sha256 } from './lib/aigov-lifecycle.mjs';
import { ciIdentityDigest } from './lib/aigov-ci-evidence.mjs';
import { refreshReceipt, validEvidenceFixture } from './lib/aigov-test-fixtures.mjs';

const schemas = {
  reviewReceipt: JSON.parse(readFileSync('kernel/schemas/aigov-review-receipt.v1.schema.json', 'utf8')),
  reviewPackage: JSON.parse(readFileSync('kernel/vendor/pr-inspector/v1.10.1/review-package.schema.json', 'utf8')),
  decisionProjection: JSON.parse(readFileSync('kernel/vendor/pr-inspector/v1.10.1/decision-projection.schema.json', 'utf8')),
  ciIdentity: JSON.parse(readFileSync('kernel/schemas/aigov-ci-identity.v1.schema.json', 'utf8')),
};
const cases = [];

function byName(bundle, name) {
  return bundle.artifacts.find((item) => item.path.endsWith(`/${name}`));
}

function replaceArtifact(bundle, name, raw) {
  const artifact = byName(bundle, name);
  artifact.raw = Buffer.isBuffer(raw) ? raw : Buffer.from(raw, 'utf8');
  artifact.sha256 = sha256(artifact.raw);
  artifact.json = name.endsWith('.json') ? JSON.parse(artifact.raw.toString('utf8')) : null;
  const declared = bundle.receipt.provenance.immutable_artifacts.find((item) => item.name === name);
  declared.sha256 = artifact.sha256;
  if (name === 'review-package.json') bundle.receipt.review.review_package_file_sha256 = artifact.sha256;
  if (name === 'DECISION_PROJECTION.json') bundle.receipt.review.decision_projection_sha256 = artifact.sha256;
  if (name === 'artifact-manifest.json') bundle.receipt.review.artifact_manifest_sha256 = artifact.sha256;
  refreshReceipt(bundle);
}

function compact(value) {
  return `${JSON.stringify(canonical(value))}\n`;
}

function run(name, mutate, expected) {
  const fixture = validEvidenceFixture();
  mutate(fixture);
  const result = verifyEvidenceBundle(fixture.bundle, fixture.scope, schemas);
  const observed = result.diagnostics.join('\n');
  cases.push({ name, expected, pass: expected === null ? result.diagnostics.length === 0 : observed.includes(expected), diagnostics: result.diagnostics });
}

run('complete real v1.10.1 canonical directory', () => {}, null);
run('forged independent boolean', ({ bundle }) => { bundle.receipt.review.independent = true; refreshReceipt(bundle); }, 'AIGOV_SCHEMA_INVALID');
run('caller invented distinct identities', ({ bundle }) => { bundle.receipt.review.reviewer_identity = 'invented-reviewer'; bundle.receipt.review.implementer_identity = 'invented-implementer'; refreshReceipt(bundle); }, 'AIGOV_IMPLEMENTER_IDENTITY_UNVERIFIED');
run('wrong repository', ({ bundle }) => { bundle.receipt.target.repository = 'attacker/lookalike'; refreshReceipt(bundle); }, 'AIGOV_SCHEMA_INVALID');
run('wrong PR', ({ bundle }) => { bundle.receipt.target.pr_number = 50; refreshReceipt(bundle); }, 'AIGOV_SCHEMA_INVALID');
run('wrong reviewed head', ({ bundle }) => { bundle.receipt.target.head_sha = 'e'.repeat(40); refreshReceipt(bundle); }, 'AIGOV_REVIEW_STALE_HEAD');
run('wrong current main', ({ bundle }) => { bundle.mainCommit.sha = 'e'.repeat(40); }, 'AIGOV_CURRENT_MAIN_IDENTITY_UNVERIFIED');
run('stale scope revision', ({ bundle }) => { bundle.receipt.target.scope_revision = `sha256:${'e'.repeat(64)}`; refreshReceipt(bundle); }, 'AIGOV_REVIEW_STALE_SCOPE');
run('fake provider', ({ bundle }) => { bundle.receipt.provenance.provider = 'fake-provider'; refreshReceipt(bundle); }, 'AIGOV_SCHEMA_INVALID');
run('missing artifact hash', ({ bundle }) => { bundle.receipt.provenance.immutable_artifacts[0].sha256 = null; refreshReceipt(bundle); }, 'AIGOV_SCHEMA_INVALID');
run('mismatched artifact hash', ({ bundle }) => { bundle.artifacts[0].raw = Buffer.from('tampered'); }, 'AIGOV_REVIEW_ARTIFACT_HASH_MISMATCH');
run('target-authored local lookalike', ({ bundle, constants }) => { bundle.receiptSource.repository = constants.TARGET; }, 'AIGOV_LOCAL_OR_TARGET_AUTHORED_RECEIPT');

run('schema-valid Green package with mismatched projection', ({ bundle }) => {
  const projection = structuredClone(byName(bundle, 'DECISION_PROJECTION.json').json);
  projection.review_identity.reviewed_head_sha = '9'.repeat(40);
  replaceArtifact(bundle, 'DECISION_PROJECTION.json', compact(projection));
}, 'PRI-PROJECTION-003');

run('arbitrary Green projection', ({ bundle }) => {
  const projection = structuredClone(byName(bundle, 'DECISION_PROJECTION.json').json);
  projection.owner_readiness.reason_codes = ['RSN-FAKE'];
  replaceArtifact(bundle, 'DECISION_PROJECTION.json', compact(projection));
}, 'PRI-PROJECTION-003');

run('manifest with self-consistent incorrect hashes', ({ bundle }) => {
  const owner = byName(bundle, 'OWNER_DECISION_CARD.fa.md');
  const altered = Buffer.from(`${owner.raw.toString('utf8').trimEnd()}\nforged-but-self-consistent\n`);
  replaceArtifact(bundle, 'OWNER_DECISION_CARD.fa.md', altered);
  const manifest = structuredClone(byName(bundle, 'artifact-manifest.json').json);
  manifest.owner_decision_card.sha256 = sha256(altered);
  replaceArtifact(bundle, 'artifact-manifest.json', compact(manifest));
}, 'PRI-CONSIST-001:OWNER_DECISION_CARD.fa.md:byte-drift');

run('altered artifact bytes', ({ bundle }) => {
  byName(bundle, 'TECHNICAL_HANDOFF.en.md').raw = Buffer.from('# altered\n');
}, 'PRI-CONSIST-001:TECHNICAL_HANDOFF.en.md:byte-drift');

run('missing conditional prompt', ({ bundle }) => {
  const projection = structuredClone(byName(bundle, 'DECISION_PROJECTION.json').json);
  projection.owner_readiness = { color: 'YELLOW', action_kind: 'verify', message_key: 'yellow_verify', reason_codes: [] };
  projection.next_action = { kind: 'verify', recipient: 'reviewer_model', may_modify_code: false, prompt_required: true, prompt_kind: 'verification_prompt', reason_codes: [] };
  replaceArtifact(bundle, 'DECISION_PROJECTION.json', compact(projection));
}, 'PRI-CONSIST-001:NEXT_ACTION_PROMPT.en.md:missing');

run('unexpected conditional prompt', ({ bundle, constants }) => {
  const directory = bundle.receipt.provenance.receipt_path.replace(/\/aigov-review-receipt\.json$/, '');
  const raw = Buffer.from('# unexpected\n');
  const item = { repository: constants.INSPECTOR, path: `${directory}/NEXT_ACTION_PROMPT.en.md`, ref: constants.COMMIT, blobSha: '7'.repeat(40), sha256: sha256(raw), raw, json: null, apiUrl: 'https://api.github.com/unexpected-prompt' };
  bundle.artifacts.push(item);
  bundle.receipt.provenance.immutable_artifacts.push({ name: 'NEXT_ACTION_PROMPT.en.md', path: item.path, sha256: item.sha256, git_blob_sha: item.blobSha });
  refreshReceipt(bundle);
}, 'PRI-CONSIST-002:NEXT_ACTION_PROMPT.en.md:unexpected');

run('valid package plus non-canonical projection', ({ bundle }) => {
  const projection = structuredClone(byName(bundle, 'DECISION_PROJECTION.json').json);
  projection.security_profile.controls.reverse();
  replaceArtifact(bundle, 'DECISION_PROJECTION.json', compact(projection));
}, 'PRI-PROJECTION-003');

run('valid package plus forged manifest', ({ bundle }) => {
  const manifest = structuredClone(byName(bundle, 'artifact-manifest.json').json);
  manifest.canonical_review_package.canonical_hash_scope = 'final_file_bytes';
  replaceArtifact(bundle, 'artifact-manifest.json', compact(manifest));
}, 'PRI-MANIFEST-001');

run('review issued before exact-head CI completion', ({ bundle }) => {
  bundle.ciIdentity.completed_at = '2026-07-15T10:30:00.000Z';
  bundle.ciIdentity.identity_digest = ciIdentityDigest(bundle.ciIdentity);
}, 'AIGOV_REVIEW_PRECEDES_EXACT_HEAD_CI');

const report = { suite: 'aigov-forged-provenance-and-review-directory', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
