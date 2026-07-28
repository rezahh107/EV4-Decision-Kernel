#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import {
  RECOVERY_SUPERSEDED_TASK_IDS,
  recoveryProgramDiagnostics,
} from '../kernel/validator/validate-recovery-execution-program.mjs';

const source = JSON.parse(readFileSync('planning/recovery/recovery-execution-program.v1.json', 'utf8'));
const clone = (value) => structuredClone(value);
const cases = [];
const record = (name, pass, diagnostics = []) => cases.push({ name, pass: Boolean(pass), diagnostics });
const expect = (name, mutate, code) => {
  const value = clone(source);
  mutate(value);
  const diagnostics = recoveryProgramDiagnostics(value);
  record(name, diagnostics.includes(code), diagnostics);
};
const byId = new Map(source.tasks.map((task) => [task.task_id, task]));

record(
  'AIGOV v2.6 transition Recovery carrier passes production validator',
  recoveryProgramDiagnostics(source).length === 0,
  recoveryProgramDiagnostics(source),
);
record(
  'KREC-001 historical carrier remains authorized while superseded tasks fail closed',
  byId.get('KREC-001')?.status === 'active'
    && byId.get('KREC-001')?.implementation_authorized === true
    && RECOVERY_SUPERSEDED_TASK_IDS.every((id) => byId.get(id)?.status === 'active'
      && byId.get(id)?.implementation_authorized === false),
);
expect(
  'stale legacy authorization cannot reactivate KREC-002',
  (x) => { x.tasks.find((task) => task.task_id === 'KREC-002').implementation_authorized = true; },
  'RECOVERY_SUPERSEDED_TASK_AUTHORIZATION_FORBIDDEN',
);
expect(
  'stale legacy authorization cannot reactivate KREC-004',
  (x) => { x.tasks.find((task) => task.task_id === 'KREC-004').implementation_authorized = true; },
  'RECOVERY_SUPERSEDED_TASK_AUTHORIZATION_FORBIDDEN',
);
expect(
  'superseded task cannot become implemented',
  (x) => { x.tasks.find((task) => task.task_id === 'KREC-002').status = 'implemented'; },
  'RECOVERY_SUPERSEDED_TASK_EXECUTION_FORBIDDEN',
);
expect(
  'transition authority mutation fails closed',
  (x) => { x.transition.effective_execution_authority = 'legacy_fields'; },
  'RECOVERY_TRANSITION_AUTHORITY_INVALID',
);
expect(
  'dependency mutation fails',
  (x) => { x.tasks.find((task) => task.task_id === 'KREC-009').depends_on.push('KREC-001'); },
  'RECOVERY_DEPENDENCY_GRAPH_MISMATCH',
);
expect(
  'Coverage credit overclaim fails',
  (x) => { x.tasks[0].coverage_credit = true; },
  'RECOVERY_COVERAGE_CREDIT_FORBIDDEN',
);
expect(
  'readiness overclaim fails',
  (x) => { x.tasks[0].readiness_claim = true; },
  'RECOVERY_READINESS_CLAIM_FORBIDDEN',
);

const report = {
  suite: 'recovery-program-transition-authority',
  status: cases.every((item) => item.pass) ? 'pass' : 'fail',
  cases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
