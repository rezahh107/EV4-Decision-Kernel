#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import {
  applyFixturePatch,
  fixtureExpectationPass,
  recoveryLedgerHistoryDiagnostics,
  repositoryCompletionDiagnostics,
  validateRecoveryLedgerDocument,
} from './validate-recovery-ledger.mjs';
import { fetchRecoveryCompletionCapabilities } from './recovery-completion-evidence.mjs';

const ROOT = process.cwd();
const LEDGER_PATH = 'planning/recovery/recovery-ledger.v1.json';
const PROGRAM_PATH = 'planning/recovery/recovery-execution-program.v1.json';
const SCHEMA_PATH = 'kernel/schemas/recovery-ledger.v1.schema.json';
const FIXTURE_ROOT = 'kernel/fixtures/recovery-ledger';
const LEGACY_FIXTURE_BASE_SHA = '4fe332847e6867fc6aa4639a94a88b8177d31970';
const SHA40 = /^[0-9a-f]{40}$/;

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};

function uniqueDiagnostics(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify([
      item?.diagnostic_id,
      item?.path,
      canonical(item?.expected),
      canonical(item?.observed),
    ]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function diagnostic(diagnosticId, pathValue, expected, observed, remediation) {
  return {
    diagnostic_id: diagnosticId,
    severity: 'error',
    path: pathValue,
    expected,
    observed,
    remediation,
  };
}

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function ledgerAt(ref) {
  if (!ref) return null;
  try {
    return JSON.parse(git(['show', `${ref}:${LEDGER_PATH}`]));
  } catch {
    return null;
  }
}

function runFixtureSuite(canonicalLedger, program, schema) {
  const fixtures = [];
  for (const category of ['valid', 'invalid', 'adversarial']) {
    const file = path.join(ROOT, FIXTURE_ROOT, category, 'cases.json');
    if (!fs.existsSync(file)) continue;
    const fixtureSet = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const fixtureCase of fixtureSet.cases || []) {
      const document = applyFixturePatch(canonicalLedger, fixtureCase.patch || []);
      const observed = validateRecoveryLedgerDocument(document, program, schema);
      const observedIds = [...new Set(observed.map((item) => item.diagnostic_id))].sort();
      const expected = fixtureCase.expected_diagnostic_ids || [];
      const pass = fixtureExpectationPass(category, expected, observedIds, {
        allowAdditionalDiagnostics: fixtureCase.allow_additional_diagnostics === true,
      });
      fixtures.push({
        suite: 'legacy_recovery',
        category,
        case_id: fixtureCase.case_id,
        pass,
        expected_diagnostic_ids: expected,
        observed_diagnostic_ids: observedIds,
        allow_additional_diagnostics: fixtureCase.allow_additional_diagnostics === true,
      });
    }
  }
  return fixtures;
}

async function run() {
  const ledger = readJson(LEDGER_PATH);
  const program = readJson(PROGRAM_PATH);
  const schema = readJson(SCHEMA_PATH);
  const legacyFixtureLedger = ledgerAt(LEGACY_FIXTURE_BASE_SHA);
  const historyBaseSha = process.env.COVERAGE_BASE_SHA;
  const previousLedger = SHA40.test(historyBaseSha || '') ? ledgerAt(historyBaseSha) : null;
  const fixtures = legacyFixtureLedger
    ? runFixtureSuite(legacyFixtureLedger, program, schema)
    : [];

  const completionBoundary = await fetchRecoveryCompletionCapabilities(ledger);
  const completionCapabilities = completionBoundary.capabilities;
  const diagnostics = uniqueDiagnostics([
    ...(legacyFixtureLedger ? [] : [diagnostic(
      'RECOVERY_LEDGER_LEGACY_FIXTURE_BASE_UNAVAILABLE',
      '/kernel/fixtures/recovery-ledger',
      LEGACY_FIXTURE_BASE_SHA,
      null,
      'Fetch complete repository history so legacy fixtures remain bound to their historical pre-transition baseline.',
    )]),
    ...completionBoundary.diagnostics,
    ...validateRecoveryLedgerDocument(ledger, program, schema, completionCapabilities),
    ...(previousLedger ? recoveryLedgerHistoryDiagnostics(previousLedger, ledger) : []),
    ...repositoryCompletionDiagnostics(ledger, completionCapabilities),
  ]);

  if (fixtures.some((fixture) => !fixture.pass)) {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_FIXTURE_EXPECTATION_FAILED',
      '/kernel/fixtures/recovery-ledger',
      'all legacy fixture expectations pass against the historical pre-transition ledger',
      fixtures.filter((fixture) => !fixture.pass),
      'Keep legacy Recovery fixtures isolated from the active AIGOV v2.6 transition overlay.',
    ));
  }

  const report = {
    validator: 'recovery-ledger.v1',
    fixture_baseline: LEGACY_FIXTURE_BASE_SHA,
    status: diagnostics.length ? 'fail' : 'pass',
    program_id: ledger.program_id,
    diagnostics: uniqueDiagnostics(diagnostics),
    fixtures,
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}

await run();
