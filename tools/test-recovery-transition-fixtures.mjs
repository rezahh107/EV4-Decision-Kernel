#!/usr/bin/env node
import fs from 'node:fs';
import { diagnostics, load } from './validate-aigov26-transition.mjs';

const clone = (value) => structuredClone(value);
const fixtureSet = JSON.parse(
  fs.readFileSync('kernel/fixtures/recovery-ledger/transition/cases.json', 'utf8'),
);

function decodePointerPart(value) {
  return value.replace(/~1/g, '/').replace(/~0/g, '~');
}

function applyPatch(document, operations) {
  const result = clone(document);
  for (const operation of operations || []) {
    const parts = String(operation.path || '').split('/').slice(1).map(decodePointerPart);
    if (!parts.length) throw new Error('TRANSITION_FIXTURE_ROOT_PATCH_FORBIDDEN');
    let parent = result;
    for (const part of parts.slice(0, -1)) {
      if (parent === null || parent === undefined) {
        throw new Error(`TRANSITION_FIXTURE_POINTER_UNRESOLVED:${operation.path}`);
      }
      parent = parent[part];
    }
    const key = parts.at(-1);
    if (operation.op === 'replace' || operation.op === 'add') parent[key] = clone(operation.value);
    else if (operation.op === 'remove') delete parent[key];
    else throw new Error(`TRANSITION_FIXTURE_OPERATION_UNKNOWN:${operation.op}`);
  }
  return result;
}

const source = load();
const cases = [];
for (const fixture of fixtureSet.cases || []) {
  const mutated = applyPatch(source, fixture.patch || []);
  const observed = diagnostics(mutated).sort();
  const expected = [...new Set(fixture.expected_diagnostic_ids || [])].sort();
  const pass = fixture.allow_additional_diagnostics === true
    ? expected.every((code) => observed.includes(code))
    : JSON.stringify(observed) === JSON.stringify(expected);
  cases.push({
    case_id: fixture.case_id,
    pass,
    expected_diagnostic_ids: expected,
    observed_diagnostic_ids: observed,
    allow_additional_diagnostics: fixture.allow_additional_diagnostics === true,
  });
}

const report = {
  suite: 'aigov26-transition-fixtures',
  status: cases.every((item) => item.pass) ? 'pass' : 'fail',
  cases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
