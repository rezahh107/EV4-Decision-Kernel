#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import {
  applyFixturePatch,
  recoveryLedgerDiagnostics,
  recoveryLedgerHistoryDiagnostics,
  validateRecoveryLedgerDocument,
} from '../kernel/validator/validate-recovery-ledger.mjs';

const read = (file) => JSON.parse(readFileSync(file, 'utf8'));
const ledger = read('planning/recovery/recovery-ledger.v1.json');
const program = read('planning/recovery/recovery-execution-program.v1.json');
const schema = read('kernel/schemas/recovery-ledger.v1.schema.json');
const validFixtures = read('kernel/fixtures/recovery-ledger/valid/cases.json');
const clone = (value) => structuredClone(value);
const cases = [];
const record = (name, pass, diagnostics = []) => cases.push({
  name,
  pass: Boolean(pass),
  diagnostic_ids: diagnostics.map((item) => item.diagnostic_id),
});

const canonicalDiagnostics = validateRecoveryLedgerDocument(ledger, program, schema);
record(
  'canonical branch-backed KREC-001 candidate is valid',
  canonicalDiagnostics.length === 0,
  canonicalDiagnostics,
);

const initialCase = validFixtures.cases.find(
  (item) => item.case_id === 'initial-active-program-only-krec-001-ready',
);
const initialLedger = applyFixturePatch(ledger, initialCase.patch);
const initialDiagnostics = validateRecoveryLedgerDocument(initialLedger, program, schema);
record(
  'initial ledger exposes only KREC-001 as dependency-ready',
  initialDiagnostics.length === 0
    && initialLedger.tasks.filter((task) => task.execution_eligibility === 'dependency_ready')
      .map((task) => task.task_id).join(',') === 'KREC-001',
  initialDiagnostics,
);

const checksPending = clone(ledger);
checksPending.tasks[0].lifecycle_state = 'checks_pending';
checksPending.tasks[0].candidate = {
  branch: 'krec-001/recovery-ledger',
  pull_request: 52,
  pr_state: 'open',
};
const checksPendingDiagnostics = recoveryLedgerDiagnostics(checksPending, program);
record(
  'open PR and pending checks remain candidate state',
  checksPendingDiagnostics.length === 0
    && checksPending.tasks[1].execution_eligibility === 'dependency_blocked'
    && checksPending.tasks[3].execution_eligibility === 'dependency_blocked',
  checksPendingDiagnostics,
);

const falseUnlock = clone(checksPending);
falseUnlock.tasks[1].execution_eligibility = 'dependency_ready';
const falseUnlockDiagnostics = recoveryLedgerDiagnostics(falseUnlock, program);
record(
  'branch PR or CI candidate state cannot unlock a dependent task',
  falseUnlockDiagnostics.some(
    (item) => item.diagnostic_id === 'RECOVERY_LEDGER_EXECUTION_ELIGIBILITY_MISMATCH',
  ),
  falseUnlockDiagnostics,
);

const completeCase = validFixtures.cases.find(
  (item) => item.case_id === 'completed-krec-001-unlocks-only-direct-dependents',
);
const completeLedger = applyFixturePatch(ledger, completeCase.patch);
const completeDiagnostics = validateRecoveryLedgerDocument(completeLedger, program, schema);
const readyAfterCompletion = completeLedger.tasks
  .filter((task) => task.execution_eligibility === 'dependency_ready')
  .map((task) => task.task_id)
  .sort();
record(
  'completed KREC-001 unlocks only KREC-002 and KREC-004',
  completeDiagnostics.length === 0
    && JSON.stringify(readyAfterCompletion) === JSON.stringify(['KREC-002', 'KREC-004']),
  completeDiagnostics,
);

const mutatedEvidence = clone(completeLedger);
mutatedEvidence.tasks[0].completion_evidence.current_main_validation.run_id = 2002;
const historyDiagnostics = recoveryLedgerHistoryDiagnostics(completeLedger, mutatedEvidence);
record(
  'accepted completion evidence is immutable',
  historyDiagnostics.some(
    (item) => item.diagnostic_id === 'RECOVERY_LEDGER_COMPLETION_EVIDENCE_IMMUTABLE',
  ),
  historyDiagnostics,
);

let unresolvedPointerError = null;
try {
  applyFixturePatch(ledger, [{
    op: 'replace',
    path: '/tasks/8/candidate/branch',
    value: 'invented/candidate',
  }]);
} catch (error) {
  unresolvedPointerError = error;
}
record(
  'fixture patching fails closed with a stable unresolved-pointer error',
  unresolvedPointerError?.message
    === 'RECOVERY_LEDGER_FIXTURE_POINTER_UNRESOLVED:/tasks/8/candidate/branch',
);

const report = {
  suite: 'recovery-ledger-dependency-and-evidence-lifecycle',
  status: cases.every((item) => item.pass) ? 'pass' : 'fail',
  cases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
