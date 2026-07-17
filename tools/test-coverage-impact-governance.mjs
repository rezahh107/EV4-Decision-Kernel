#!/usr/bin/env node
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {
  adaptLegacyValidatorSource,
  buildTrustedWrapperRuntimeSource,
  classifyTrustedWrapperSource,
  COVERAGE_IDENTITY_MODES,
  impactIdentityCodes,
  parseCurrentWorkPackageId,
  resolveCoverageIdentityMode,
  selectCurrentImpactCarriers,
  TRUSTED_WRAPPER_GENERATIONS,
} from '../kernel/validator/coverage-work-package-id.mjs';

const schema = JSON.parse(readFileSync('kernel/schemas/coverage-impact.v1.schema.json', 'utf8'));
const actual = JSON.parse(readFileSync('planning/coverage/impacts/dcov-recovery.pr51-owner-policy-activation.json', 'utf8'));
const nextWork = readFileSync('planning/NEXT_WORK.md', 'utf8');
const validateMain = readFileSync('.github/workflows/validate-main.yml', 'utf8');
const currentWrapper = readFileSync('kernel/validator/validate-coverage-guarantee.mjs', 'utf8');
const generationAWrapper = execFileSync(
  'git',
  ['show', `${actual.base_sha}:kernel/validator/validate-coverage-guarantee.mjs`],
  { encoding: 'utf8' },
);
const headSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const validate = ajv.compile(schema);
const currentWorkPackage = parseCurrentWorkPackageId(nextWork);

const results = [];
function test(id, fn) {
  try { fn(); results.push({ id, status: 'pass' }); }
  catch (error) { results.push({ id, status: 'fail', error: error.message }); }
}

function syntaxCheckSource(source, temp) {
  try {
    writeFileSync(temp, source, 'utf8');
    execFileSync(process.execPath, ['--check', temp], { stdio: 'pipe' });
  } finally {
    try { unlinkSync(temp); } catch { /* absent */ }
  }
}

function runOwnerPolicy(overrides, removed = []) {
  const env = { ...process.env, ...overrides };
  for (const name of removed) delete env[name];
  return execFileSync(
    process.execPath,
    ['kernel/validator/validate-coverage-guarantee-owner-policy.mjs'],
    { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  );
}

function selectionContext(identityMode, overrides = {}) {
  return {
    identityMode,
    repository: actual.repository,
    pullRequest: identityMode === COVERAGE_IDENTITY_MODES.PULL_REQUEST ? actual.pull_request : null,
    baseSha: actual.base_sha,
    currentWorkPackage,
    sensitivePaths: actual.changed_paths,
    ...overrides,
  };
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
  syntaxCheckSource(adapted, 'kernel/validator/.coverage-adapter-focused-test.mjs');
});

test('exact-head-pr-identity-selects-pr51-carrier', () => {
  assert.deepEqual(resolveCoverageIdentityMode('', actual.pull_request), {
    mode: COVERAGE_IDENTITY_MODES.PULL_REQUEST,
    diagnostic_code: null,
  });
  const selected = selectCurrentImpactCarriers(
    [actual],
    selectionContext(COVERAGE_IDENTITY_MODES.PULL_REQUEST),
  );
  assert.equal(selected.diagnostic_code, null);
  assert.deepEqual(selected.matches.map((impact) => impact.impact_id), [actual.impact_id]);
});

test('post-merge-identity-without-pr-selects-pr51-carrier', () => {
  assert.deepEqual(resolveCoverageIdentityMode(COVERAGE_IDENTITY_MODES.POST_MERGE, null), {
    mode: COVERAGE_IDENTITY_MODES.POST_MERGE,
    diagnostic_code: null,
  });
  const selected = selectCurrentImpactCarriers(
    [actual],
    selectionContext(COVERAGE_IDENTITY_MODES.POST_MERGE),
  );
  assert.equal(selected.diagnostic_code, null);
  assert.deepEqual(selected.matches.map((impact) => impact.impact_id), [actual.impact_id]);
});

test('post-merge-zero-carrier-fails-stably', () => {
  const selected = selectCurrentImpactCarriers(
    [actual],
    selectionContext(COVERAGE_IDENTITY_MODES.POST_MERGE, {
      currentWorkPackage: 'GOV-UNRELATED',
    }),
  );
  assert.equal(selected.diagnostic_code, 'COV_IMPACT_POST_MERGE_NOT_FOUND');
  assert.deepEqual(selected.matches, []);
});

test('post-merge-multiple-carriers-fail-stably', () => {
  const duplicate = { ...structuredClone(actual), impact_id: `${actual.impact_id}.duplicate` };
  const selected = selectCurrentImpactCarriers(
    [actual, duplicate],
    selectionContext(COVERAGE_IDENTITY_MODES.POST_MERGE),
  );
  assert.equal(selected.diagnostic_code, 'COV_IMPACT_POST_MERGE_AMBIGUOUS');
  assert.equal(selected.matches.length, 2);
});

test('validate-main-declares-post-merge-mode-without-pr-number', () => {
  assert(validateMain.includes('COVERAGE_IDENTITY_MODE: post_merge'));
  const mainEnv = validateMain.match(/    env:\n([\s\S]*?)    steps:/)?.[1] || '';
  assert(!mainEnv.includes('COVERAGE_PR_NUMBER:'));
  assert(validateMain.includes('test "${COVERAGE_IDENTITY_MODE}" = "post_merge"'));
  assert(validateMain.includes('test -z "${COVERAGE_PR_NUMBER:-}"'));
});

test('generation-a-trusted-base-adapter-is-supported', () => {
  assert.equal(
    classifyTrustedWrapperSource(generationAWrapper),
    TRUSTED_WRAPPER_GENERATIONS.EXTERNAL_AUTHORITY_V1,
  );
  const runtime = buildTrustedWrapperRuntimeSource(generationAWrapper, generationAWrapper);
  assert.equal(runtime.generation, TRUSTED_WRAPPER_GENERATIONS.EXTERNAL_AUTHORITY_V1);
  assert(runtime.source.includes('.validate-coverage-guarantee-prf010.runtime.mjs'));
  assert(runtime.source.includes('.validate-coverage-guarantee-legacy.runtime.mjs'));
  assert(!runtime.source.includes('validate-coverage-guarantee-owner-policy.mjs'));
  syntaxCheckSource(runtime.source, 'kernel/validator/.coverage-generation-a-wrapper-test.mjs');
});

test('generation-b-future-pr-adapter-uses-pinned-generation-a', () => {
  assert.equal(
    classifyTrustedWrapperSource(currentWrapper),
    TRUSTED_WRAPPER_GENERATIONS.OWNER_POLICY_V1,
  );
  const runtime = buildTrustedWrapperRuntimeSource(currentWrapper, generationAWrapper);
  assert.equal(runtime.generation, TRUSTED_WRAPPER_GENERATIONS.OWNER_POLICY_V1);
  assert(runtime.source.includes('.validate-coverage-guarantee-prf010.runtime.mjs'));
  assert(runtime.source.includes('.validate-coverage-guarantee-legacy.runtime.mjs'));
  assert(!runtime.source.includes('validate-coverage-guarantee-owner-policy.mjs'));
  syntaxCheckSource(runtime.source, 'kernel/validator/.coverage-generation-b-wrapper-test.mjs');
});

test('unknown-wrapper-shape-fails-closed', () => {
  assert.throws(
    () => buildTrustedWrapperRuntimeSource(`${currentWrapper}\n// mutated\n`, generationAWrapper),
    (error) => error.code === 'COV_TRUSTED_BASE_WRAPPER_GENERATION_UNSUPPORTED',
  );
});

test('owner-policy-recursive-runtime-is-forbidden', () => {
  const runtime = buildTrustedWrapperRuntimeSource(currentWrapper, generationAWrapper);
  assert(!runtime.source.includes("await import('./validate-coverage-guarantee-owner-policy.mjs')"));
});

test('post-merge-owner-policy-integration-without-pr-number', () => {
  const output = runOwnerPolicy({
    COVERAGE_REPOSITORY: actual.repository,
    COVERAGE_IDENTITY_MODE: COVERAGE_IDENTITY_MODES.POST_MERGE,
    COVERAGE_BASE_SHA: actual.base_sha,
    COVERAGE_HEAD_SHA: headSha,
  }, ['COVERAGE_PR_NUMBER']);
  assert(output.includes('"identity_mode": "post_merge"'));
  assert(output.includes(actual.impact_id));
});

test('generation-b-future-base-full-validation-passes', () => {
  const output = runOwnerPolicy({
    COVERAGE_REPOSITORY: actual.repository,
    COVERAGE_IDENTITY_MODE: COVERAGE_IDENTITY_MODES.POST_MERGE,
    COVERAGE_BASE_SHA: headSha,
    COVERAGE_HEAD_SHA: headSha,
  }, ['COVERAGE_PR_NUMBER']);
  assert(output.includes('Coverage trusted-base wrapper generation: owner_policy_v1'));
});

for (const result of results) {
  console.log(`${result.status.toUpperCase()} ${result.id}${result.error ? `: ${result.error}` : ''}`);
}
if (results.some((result) => result.status !== 'pass')) process.exit(1);
console.log('Coverage Impact governance focused tests passed.');
