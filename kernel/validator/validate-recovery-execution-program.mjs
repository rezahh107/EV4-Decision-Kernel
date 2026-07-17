#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';

const ROOT = process.cwd();
const PROGRAM_PATH = 'planning/recovery/recovery-execution-program.v1.json';
const SCHEMA_PATH = 'kernel/schemas/recovery-execution-program.v1.schema.json';
export const EXPECTED_RECOVERY_GRAPH = Object.freeze({
  'KREC-001': [],
  'KREC-002': ['KREC-001'],
  'KREC-003': ['KREC-001', 'KREC-002'],
  'KREC-004': ['KREC-001'],
  'KREC-005': ['KREC-002', 'KREC-003', 'KREC-004'],
  'KREC-006': ['KREC-003', 'KREC-004', 'KREC-005'],
  'KREC-007': ['KREC-005', 'KREC-006'],
  'KREC-008': ['KREC-002', 'KREC-007'],
  'KREC-009': ['KREC-003', 'KREC-006', 'KREC-007', 'KREC-008'],
});
const TASK_IDS = Object.freeze(Object.keys(EXPECTED_RECOVERY_GRAPH));
const TASK_STATES = new Set(['registered_planned_task', 'active', 'implemented', 'complete']);
const unique = (items) => [...new Set(items)];
const sameSet = (left, right) => JSON.stringify([...(left || [])].sort()) === JSON.stringify([...(right || [])].sort());
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

function cycleDiagnostics(tasksById) {
  const diagnostics = [];
  const visiting = new Set();
  const visited = new Set();
  function visit(id) {
    if (visiting.has(id)) { diagnostics.push('RECOVERY_DEPENDENCY_CYCLE'); return; }
    if (visited.has(id)) return;
    visiting.add(id);
    for (const dependency of tasksById.get(id)?.depends_on || []) if (tasksById.has(dependency)) visit(dependency);
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of tasksById.keys()) visit(id);
  return diagnostics;
}

export function recoveryProgramDiagnostics(value) {
  const diagnostics = [];
  if (!value || typeof value !== 'object') return ['RECOVERY_PROGRAM_MALFORMED'];
  if (value.program_id !== 'DCOV-COVERAGE-EXECUTION-PROGRAM'
    || value.integration_model !== 'distinct_recovery_execution_program') diagnostics.push('RECOVERY_PROGRAM_IDENTITY_MISMATCH');
  if (value.coverage_promotion_effect !== 'none') diagnostics.push('AIGOV_COVERAGE_PROMOTION_FORBIDDEN');
  if (value.product_effect !== 'none') diagnostics.push('RECOVERY_PRODUCT_EFFECT_FORBIDDEN');
  if (value.kroad_012r_status !== 'historical_non_authoritative'
    || value.kroad_supersession_effect !== 'none') diagnostics.push('RECOVERY_KROAD_SUPERSESSION_FORBIDDEN');

  const tasks = Array.isArray(value.tasks) ? value.tasks : [];
  const seen = new Set();
  const tasksById = new Map();
  for (const task of tasks) {
    if (!task || typeof task !== 'object') { diagnostics.push('RECOVERY_TASK_MALFORMED'); continue; }
    if (!TASK_IDS.includes(task.task_id)) diagnostics.push('RECOVERY_TASK_ID_UNKNOWN');
    if (seen.has(task.task_id)) diagnostics.push('RECOVERY_TASK_ID_DUPLICATE');
    seen.add(task.task_id);
    if (!tasksById.has(task.task_id)) tasksById.set(task.task_id, task);
    if (!TASK_STATES.has(task.status)) diagnostics.push('RECOVERY_TASK_STATUS_INVALID');
    const dependencies = Array.isArray(task.depends_on) ? task.depends_on : [];
    if (dependencies.includes(task.task_id)) diagnostics.push('RECOVERY_SELF_DEPENDENCY');
    const expected = EXPECTED_RECOVERY_GRAPH[task.task_id];
    if (!expected || !sameSet(dependencies, expected)) diagnostics.push('RECOVERY_DEPENDENCY_GRAPH_MISMATCH');
    if (task.coverage_credit !== false) diagnostics.push('RECOVERY_COVERAGE_CREDIT_FORBIDDEN');
    if (task.readiness_claim !== false) diagnostics.push('RECOVERY_READINESS_CLAIM_FORBIDDEN');
  }
  if (tasks.length !== TASK_IDS.length || seen.size !== TASK_IDS.length || TASK_IDS.some((id) => !seen.has(id))) diagnostics.push('RECOVERY_TASK_SET_MISMATCH');
  diagnostics.push(...cycleDiagnostics(tasksById));

  const registered = value.program_status === 'registered_non_active';
  const activeLifecycle = ['active', 'implemented', 'complete'].includes(value.program_status);
  if (!registered && !activeLifecycle) diagnostics.push('RECOVERY_PROGRAM_STATUS_INVALID');
  if (registered) {
    if (value.task_activation_effect !== 'none') diagnostics.push('RECOVERY_PROGRAM_STATE_INCONSISTENT');
    for (const task of tasks) {
      if (task.status !== 'registered_planned_task') diagnostics.push('RECOVERY_REGISTERED_TASK_STATE_INVALID');
      if (task.implementation_authorized !== false) diagnostics.push('RECOVERY_REGISTERED_TASK_AUTHORIZATION_INVALID');
    }
  }
  if (activeLifecycle) {
    if (value.task_activation_effect !== 'one_or_more_active') diagnostics.push('RECOVERY_PROGRAM_STATE_INCONSISTENT');
    for (const task of tasks) {
      if (task.status === 'registered_planned_task') diagnostics.push('RECOVERY_ACTIVE_TASK_STATE_INVALID');
      if (task.implementation_authorized !== true) diagnostics.push('RECOVERY_ACTIVE_TASK_AUTHORIZATION_REQUIRED');
    }
  }

  for (const task of tasks) {
    if (!['implemented', 'complete'].includes(task.status)) continue;
    for (const dependencyId of task.depends_on || []) {
      const dependency = tasksById.get(dependencyId);
      if (!dependency || dependency.status !== 'complete') {
        diagnostics.push(task.status === 'complete'
          ? 'RECOVERY_COMPLETE_TASK_DEPENDENCY_INCOMPLETE'
          : 'RECOVERY_IMPLEMENTED_TASK_DEPENDENCY_INCOMPLETE');
      }
    }
  }
  if (value.program_status === 'implemented' && tasks.some((task) => !['implemented', 'complete'].includes(task.status))) diagnostics.push('RECOVERY_PROGRAM_IMPLEMENTED_WITH_ACTIVE_TASK');
  if (value.program_status === 'complete' && tasks.some((task) => task.status !== 'complete')) diagnostics.push('RECOVERY_PROGRAM_COMPLETE_WITH_INCOMPLETE_TASK');
  return unique(diagnostics);
}

export function validateRecoveryDocument(value, schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  const schemaDiagnostics = validate(value) ? [] : (validate.errors || []).map((error) => `RECOVERY_SCHEMA_INVALID:${error.instancePath || '/'}:${error.message}`);
  return unique([...schemaDiagnostics, ...recoveryProgramDiagnostics(value)]);
}

function run() {
  const schema = readJson(SCHEMA_PATH);
  const program = readJson(PROGRAM_PATH);
  const diagnostics = validateRecoveryDocument(program, schema);
  const fixtureRoot = path.join(ROOT, 'kernel/fixtures/recovery-program');
  const fixtures = [];
  for (const category of ['valid', 'invalid', 'adversarial']) {
    const directory = path.join(fixtureRoot, category);
    if (!fs.existsSync(directory)) continue;
    for (const name of fs.readdirSync(directory).filter((item) => item.endsWith('.json')).sort()) {
      const value = readJson(`kernel/fixtures/recovery-program/${category}/${name}`);
      const expected = value.expected_diagnostics || [];
      delete value.expected_diagnostics;
      const observed = validateRecoveryDocument(value, schema);
      const pass = category === 'valid'
        ? observed.length === 0
        : expected.length > 0 && expected.every((code) => observed.some((item) => item.startsWith(code)));
      fixtures.push({ category, name, pass, diagnostics: observed, expected });
    }
  }
  if (fixtures.some((item) => !item.pass)) diagnostics.push('RECOVERY_FIXTURE_EXPECTATION_FAILED');
  const report = { validator: 'recovery-execution-program.v1', status: diagnostics.length ? 'fail' : 'pass', diagnostics: unique(diagnostics), fixtures };
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) run();
