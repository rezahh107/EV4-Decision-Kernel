#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { verifyEvidenceBundle } from './verify-aigov-exact-main.mjs';
import { refreshReceipt, validEvidenceFixture } from './lib/aigov-test-fixtures.mjs';

const reviewSchema = JSON.parse(readFileSync('kernel/schemas/aigov-review-receipt.v1.schema.json', 'utf8'));
const schemas = { reviewReceipt: reviewSchema, reviewPackage: { type: 'object' } };
const cases = [];

function run(name, mutate, expected) {
  const fixture = validEvidenceFixture();
  mutate(fixture);
  const result = verifyEvidenceBundle(fixture.bundle, fixture.scope, schemas);
  const observed = result.diagnostics.join('\n');
  cases.push({ name, expected, pass: expected === null ? result.diagnostics.length === 0 : observed.includes(expected), diagnostics: result.diagnostics });
}

run('valid external provenance', () => {}, null);
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

const report = { suite: 'aigov-forged-provenance', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
