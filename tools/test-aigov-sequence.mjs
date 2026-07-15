#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const ROOT = process.cwd();
const CASES = [
  ['cross-turn-mutation', 'AIGOV_SEQUENCE_INVALID'],
  ['merge-before-review', 'AIGOV_SEQUENCE_INVALID'],
];

const results = [];
for (const [fixtureCase, requiredDiagnostic] of CASES) {
  const raw = execFileSync(process.execPath, [
    'kernel/validator/validate-aigov-governance.mjs',
    '--fixtures-only',
    '--case', fixtureCase,
  ], { cwd: ROOT, encoding: 'utf8' });
  const report = JSON.parse(raw);
  const fixture = report.fixture_results[0];
  const pass = report.status === 'pass'
    && fixture?.matches === true
    && fixture.observed_diagnostics.includes(requiredDiagnostic);
  results.push({ fixture_case: fixtureCase, required_diagnostic: requiredDiagnostic, pass });
}

const report = {
  validator: 'test-aigov-sequence',
  status: results.every((result) => result.pass) ? 'pass' : 'fail',
  results,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
