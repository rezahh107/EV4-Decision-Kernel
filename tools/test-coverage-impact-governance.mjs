#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  adaptLegacyValidatorSource,
  impactIdentityCodes,
  parseCurrentWorkPackageId,
} from '../kernel/validator/coverage-work-package-id.mjs';

const schema = JSON.parse(readFileSync('kernel/schemas/coverage-impact.v1.schema.json', 'utf8'));
const actual = JSON.parse(readFileSync('planning/coverage/impacts/dcov-recovery.pr51-owner-policy-activation.json', 'utf8'));
const nextWork = readFileSync('planning/NEXT_WORK.md', 'utf8');
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const currentWorkPackage = parseCurrentWorkPackageId(nextWork);

const results = [];
function test(id, fn) {
  try { fn(); results.push({ id, status: 'pass' }); }
  catch (error) { results.push({ id, status: 'fail', error: error.message }); }
}

test('valid-non-dcov-maintenance-work-package', () => {
  assert.equal(currentWorkPackage, 'GOV-OWNER-POLICY-RECOVERY-ACTIVATION');
  assert.equal(validate(actual), true, JSON.stringify(validate.errors));
  assert.deepEqual(impactIdentityCodes(actual, currentWorkPackage, actual.changed_paths), []);
  assert.equal(actual.work_type, 'maintenance');
  assert.equal(actual.coverage_sensitive, false);
  assert.equal(actual.coverage_state_before, actual.coverage_state_after);
});

test('mismatched-impact-id-rejected', () => {
  const candidate = { ...actual, impact_id: 'coverage-impact.unrelated.pr51' };
  assert(impactIdentityCodes(candidate, currentWorkPackage, candidate.changed_paths)
    .includes('COV_IMPACT_ID_MISMATCH'));
});

test('mismatched-work-package-rejected', () => {
  const candidate = { ...actual, work_package_id: 'GOV-UNRELATED' };
  assert(impactIdentityCodes(candidate, currentWorkPackage, candidate.changed_paths)
    .includes('COV_IMPACT_WORK_PACKAGE_MISMATCH'));
});

test('extra-schema-field-rejected', () => {
  const candidate = { ...actual, unexpected_field: true };
  assert.equal(validate(candidate), false);
  assert(validate.errors.some((error) => error.keyword === 'additionalProperties'));
});

test('missing-mandatory-impact-field-rejected', () => {
  const candidate = structuredClone(actual);
  delete candidate.reason;
  assert.equal(validate(candidate), false);
  assert(validate.errors.some((error) => error.keyword === 'required'
    && error.params.missingProperty === 'reason'));
});

test('changed-paths-must-equal-sensitive-diff', () => {
  const expected = [...actual.changed_paths, 'planning/coverage/unexpected.json'];
  assert(impactIdentityCodes(actual, currentWorkPackage, expected)
    .includes('COV_IMPACT_CHANGED_PATHS_MISMATCH'));
});

test('no-coverage-credit-or-promotion-created', () => {
  assert.equal(actual.coverage_state_before, 'not_measurable');
  assert.equal(actual.coverage_state_after, 'not_measurable');
  assert.equal(actual.element_coverage_delta, null);
  assert.equal(actual.question_coverage_delta, null);
  assert.deepEqual(actual.completed_obligation_ids, []);
  assert.deepEqual(actual.closed_family_ids, []);
});

test('missing-or-duplicate-roadmap-carrier-rejected', () => {
  assert.equal(parseCurrentWorkPackageId('## Current PR\n'), null);
  assert.equal(parseCurrentWorkPackageId('current_work_package_id: GOV-A\ncurrent_work_package_id: GOV-B\n'), null);
});

test('legacy-adapter-is-exact-and-syntax-valid', () => {
  const source = readFileSync('kernel/validator/validate-coverage-guarantee-legacy.mjs', 'utf8');
  const adapted = adaptLegacyValidatorSource(source);
  assert(adapted.includes('current_work_package_id:'));
  assert(adapted.includes('validNonCoverageMaintenance'));
  assert(adapted.includes('merge_gate: contract.merge_gate'));
  const temp = 'kernel/validator/.coverage-adapter-focused-test.mjs';
  try {
    writeFileSync(temp, adapted, 'utf8');
    execFileSync(process.execPath, ['--check', temp], { stdio: 'pipe' });
  } finally {
    try { unlinkSync(temp); } catch { /* absent */ }
  }
});

for (const result of results) {
  console.log(`${result.status.toUpperCase()} ${result.id}${result.error ? `: ${result.error}` : ''}`);
}
if (results.some((result) => result.status !== 'pass')) process.exit(1);
console.log('Coverage Impact governance focused tests passed.');
