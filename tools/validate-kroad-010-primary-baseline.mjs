#!/usr/bin/env node

import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {PRIMARY_FIXTURE_CASES, runPrimaryValidator} from '../kernel/validator/validate-downstream-consumer-contract.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASELINE_PATH = 'kernel/fixtures/contract-lock/downstream_consumer/primary-validator-baseline.v0.json';

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function normalizeCase(item) {
  return {
    path: item.path,
    expected_status: item.expected_status ?? item.expectedStatus,
    required_diagnostic_codes: item.required_diagnostic_codes ?? item.requiredDiagnostics,
  };
}

function fail(message) {
  console.error(`KROAD_010_PRIMARY_BASELINE_MISMATCH: ${message}`);
  process.exit(1);
}


const primarySource = readFileSync(
  join(ROOT, 'kernel/validator/validate-downstream-consumer-contract.mjs'),
  'utf8',
);
const primaryLines = primarySource.split('\n');
if (primaryLines.length < 100 || primaryLines.some((line) => line.length > 120)) {
  fail('Primary validator maintainability guard requires at least 100 lines and no line longer than 120 characters.');
}

const baseline = readJson(BASELINE_PATH);
const expected = baseline.stable_cases.map(normalizeCase);
const declared = PRIMARY_FIXTURE_CASES.map(normalizeCase);
if (JSON.stringify(expected) !== JSON.stringify(declared)) {
  fail('Declared primary fixture order or expected diagnostics differ from the captured pre-refactor baseline.');
}

const result = runPrimaryValidator({json: false});
if (result.failed) fail('Refactored primary validator did not pass its fixture suite.');

const observed = result.cases.map((item) => ({
  path: item.path,
  expected_status: item.expected_status,
  observed_status: item.observed_status,
  required_diagnostic_codes: item.required_diagnostic_codes,
  missing_diagnostic_codes: item.missing_diagnostic_codes,
  passed: item.passed,
}));

for (let index = 0; index < expected.length; index += 1) {
  const expectedCase = expected[index];
  const observedCase = observed[index];
  if (!observedCase
    || observedCase.path !== expectedCase.path
    || observedCase.expected_status !== expectedCase.expected_status
    || observedCase.observed_status !== expectedCase.expected_status
    || JSON.stringify(observedCase.required_diagnostic_codes)
      !== JSON.stringify(expectedCase.required_diagnostic_codes)
    || observedCase.missing_diagnostic_codes.length > 0
    || observedCase.passed !== true) {
    fail(`Behavior changed for ${expectedCase.path}.`);
  }
}

console.log(`KROAD-010 primary validator baseline: PASS (${expected.length} stable cases)`);
