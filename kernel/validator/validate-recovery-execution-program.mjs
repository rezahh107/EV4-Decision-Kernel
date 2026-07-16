#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const ROOT = process.cwd();
const PROGRAM_PATH = 'planning/recovery/recovery-execution-program.v1.json';
const SCHEMA_PATH = 'kernel/schemas/recovery-execution-program.v1.schema.json';
const EXPECTED = new Map([
  ['KREC-001', []],
  ['KREC-002', ['KREC-001']],
  ['KREC-003', ['KREC-001', 'KREC-002']],
  ['KREC-004', ['KREC-001']],
  ['KREC-005', ['KREC-002', 'KREC-003', 'KREC-004']],
  ['KREC-006', ['KREC-003', 'KREC-004', 'KREC-005']],
  ['KREC-007', ['KREC-005', 'KREC-006']],
  ['KREC-008', ['KREC-002', 'KREC-007']],
  ['KREC-009', ['KREC-003', 'KREC-006', 'KREC-007', 'KREC-008']],
]);

function readJson(file) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));
}

export function recoveryProgramDiagnostics(value) {
  const diagnostics = [];
  if (value.program_id !== 'DCOV-COVERAGE-EXECUTION-PROGRAM'
    || value.integration_model !== 'distinct_recovery_execution_program') diagnostics.push('RECOVERY_PROGRAM_IDENTITY_MISMATCH');
  if (value.coverage_promotion_effect !== 'none') diagnostics.push('AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
  if (value.task_activation_effect !== 'none' || value.program_status !== 'registered_non_active') diagnostics.push('RECOVERY_PROGRAM_ACTIVATION_FORBIDDEN');
  if (value.product_effect !== 'none') diagnostics.push('RECOVERY_PRODUCT_EFFECT_FORBIDDEN');
  if (value.kroad_012r_status !== 'historical_non_authoritative' || value.kroad_supersession_effect !== 'none') diagnostics.push('RECOVERY_KROAD_SUPERSESSION_FORBIDDEN');

  const seen = new Set();
  for (const task of value.tasks || []) {
    if (task.status !== 'registered_planned_task') diagnostics.push('RECOVERY_TASK_ACTIVATION_FORBIDDEN');
    if (task.implementation_authorized !== false) diagnostics.push('RECOVERY_TASK_IMPLEMENTATION_FORBIDDEN');
    if (task.coverage_credit !== false) diagnostics.push('RECOVERY_COVERAGE_CREDIT_FORBIDDEN');
    if (task.readiness_claim !== false) diagnostics.push('RECOVERY_READINESS_CLAIM_FORBIDDEN');
    if (seen.has(task.task_id)) diagnostics.push('RECOVERY_TASK_ID_DUPLICATE');
    seen.add(task.task_id);
    const expected = EXPECTED.get(task.task_id);
    const actualDependencies = Array.isArray(task.depends_on) ? [...task.depends_on].sort() : [];
    const expectedDependencies = expected ? [...expected].sort() : [];
    if (!expected || JSON.stringify(actualDependencies) !== JSON.stringify(expectedDependencies)) diagnostics.push('RECOVERY_DEPENDENCY_GRAPH_MISMATCH');
  }
  if (seen.size !== EXPECTED.size || [...EXPECTED.keys()].some((id) => !seen.has(id))) diagnostics.push('RECOVERY_TASK_SET_MISMATCH');
  return [...new Set(diagnostics)];
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
const validate = ajv.compile(readJson(SCHEMA_PATH));
function schemaDiagnostics(value, source) {
  if (validate(value)) return [];
  return (validate.errors || []).map((error) => `RECOVERY_SCHEMA_INVALID:${source}${error.instancePath || '/'}:${error.message}`);
}

const program = readJson(PROGRAM_PATH);
const diagnostics = [...schemaDiagnostics(program, PROGRAM_PATH), ...recoveryProgramDiagnostics(program)];
const fixtureRoot = path.join(ROOT, 'kernel/fixtures/recovery-program');
const fixtureCases = [];
for (const category of ['valid', 'invalid', 'adversarial']) {
  for (const name of fs.readdirSync(path.join(fixtureRoot, category)).filter((item) => item.endsWith('.json')).sort()) {
    const value = readJson(`kernel/fixtures/recovery-program/${category}/${name}`);
    const expected = value.expected_diagnostics || [];
    delete value.expected_diagnostics;
    const fixtureDiagnostics = [...schemaDiagnostics(value, `${category}/${name}`), ...recoveryProgramDiagnostics(value)];
    const uniqueDiagnostics = [...new Set(fixtureDiagnostics)];
    const pass = category === 'valid'
      ? uniqueDiagnostics.length === 0
      : expected.length > 0 && expected.every((code) => uniqueDiagnostics.includes(code));
    fixtureCases.push({ category, name, pass, diagnostics: uniqueDiagnostics, expected });
  }
}
if (fixtureCases.some((item) => !item.pass)) diagnostics.push('RECOVERY_FIXTURE_EXPECTATION_FAILED');

const report = {
  validator: 'recovery-execution-program.v1',
  status: diagnostics.length ? 'fail' : 'pass',
  diagnostics: [...new Set(diagnostics)],
  fixtures: fixtureCases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
