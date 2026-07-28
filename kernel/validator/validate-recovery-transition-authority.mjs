import { recoveryCompletionCapabilityMatches } from './recovery-completion-evidence.mjs';
import { validateRecoveryLedgerDocument as validateLegacyRecoveryLedgerDocument } from './validate-recovery-ledger.mjs';

export const RECOVERY_TRANSITION_AUTHORITY = 'program_transition';
export const RECOVERY_SUPERSEDED_TASK_IDS = Object.freeze([
  'KREC-002',
  'KREC-003',
  'KREC-004',
  'KREC-005',
  'KREC-006',
  'KREC-007',
  'KREC-008',
  'KREC-009',
]);

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function diagnostic(diagnosticId, path, expected, observed, remediation) {
  return {
    diagnostic_id: diagnosticId,
    severity: 'error',
    path,
    expected,
    observed,
    remediation,
  };
}

function uniqueDiagnostics(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify([item.diagnostic_id, item.path, item.expected, item.observed]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function recoveryTransitionAuthorityDiagnostics(ledger, program) {
  const diagnostics = [];
  const expectedRetired = RECOVERY_SUPERSEDED_TASK_IDS;
  const transition = program?.transition;
  const ledgerTransition = ledger?.transition;
  const exactAuthority = transition?.decision_id === 'OWNER-DIRECTED-AIGOV-2.6-MIGRATION'
    && transition?.successor_program_id === 'AIGOV-2.6-REPOSITORY-MIGRATION-PROGRAM'
    && transition?.effective_execution_authority === RECOVERY_TRANSITION_AUTHORITY
    && same(transition?.preserved_task_ids, ['KREC-001'])
    && same(transition?.superseded_before_execution_task_ids, expectedRetired)
    && transition?.historical_definitions_preserved === true
    && transition?.substantive_implementation_started_for_superseded_tasks === false;

  if (!exactAuthority) {
    diagnostics.push(diagnostic(
      'RECOVERY_TRANSITION_AUTHORITY_INVALID',
      '/transition',
      {
        authority: RECOVERY_TRANSITION_AUTHORITY,
        preserved_task_ids: ['KREC-001'],
        superseded_before_execution_task_ids: expectedRetired,
      },
      transition || null,
      'Restore the exact Program transition authority before interpreting any superseded KREC execution state.',
    ));
    return diagnostics;
  }

  if (ledgerTransition?.decision_id !== transition.decision_id
    || ledgerTransition?.successor_program_id !== transition.successor_program_id
    || ledgerTransition?.effective_task_execution_authority !== RECOVERY_TRANSITION_AUTHORITY
    || ledgerTransition?.source_task_definitions_preserved !== true) {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_TRANSITION_AUTHORITY_MISMATCH',
      '/transition',
      RECOVERY_TRANSITION_AUTHORITY,
      ledgerTransition || null,
      'The Ledger may project Program transition authority but may not define an independent execution authority.',
    ));
  }

  const programById = new Map((program?.tasks || []).map((task) => [task.task_id, task]));
  const ledgerById = new Map((ledger?.tasks || []).map((task) => [task.task_id, task]));
  const retired = new Set(expectedRetired);

  for (const id of expectedRetired) {
    const carrier = programById.get(id);
    const task = ledgerById.get(id);
    const disposition = task?.transition_disposition;
    if (!carrier || !task) {
      diagnostics.push(diagnostic(
        'RECOVERY_SUPERSEDED_TASK_MISSING',
        `/tasks/${id}`,
        'historical Program and Ledger task definitions preserved',
        { carrier: carrier || null, ledger: task || null },
        'Restore the historical KREC definition; supersession must not delete history.',
      ));
      continue;
    }
    if (carrier.implementation_authorized !== false
      || task.authority?.implementation_authorized !== false) {
      diagnostics.push(diagnostic(
        'RECOVERY_SUPERSEDED_TASK_AUTHORIZATION_FORBIDDEN',
        `/tasks/${id}/authority`,
        false,
        {
          program: carrier.implementation_authorized,
          ledger: task.authority?.implementation_authorized,
        },
        'Project supersession into legacy authorization as false so transition-unaware consumers fail closed.',
      ));
    }
    if (task.lifecycle_state !== 'not_started'
      || task.execution_eligibility !== 'superseded'
      || task.candidate !== null
      || task.completion_evidence !== null) {
      diagnostics.push(diagnostic(
        'RECOVERY_SUPERSEDED_TASK_EXECUTION_STATE_INVALID',
        `/tasks/${id}`,
        {
          lifecycle_state: 'not_started',
          execution_eligibility: 'superseded',
          candidate: null,
          completion_evidence: null,
        },
        {
          lifecycle_state: task.lifecycle_state,
          execution_eligibility: task.execution_eligibility,
          candidate: task.candidate,
          completion_evidence: task.completion_evidence,
        },
        'Supersession overrides dependency readiness and forbids implementation or completion state.',
      ));
    }
    if (disposition?.lifecycle_state !== 'superseded_before_execution'
      || disposition?.execution_eligibility !== 'superseded'
      || disposition?.superseded_by !== transition.successor_program_id
      || disposition?.supersession_basis !== transition.decision_id
      || disposition?.historical_definition_preserved !== true
      || disposition?.substantive_implementation_started !== false
      || disposition?.implementation_credit !== false
      || disposition?.completion_credit !== false
      || disposition?.coverage_credit !== false) {
      diagnostics.push(diagnostic(
        'RECOVERY_SUPERSEDED_TASK_DISPOSITION_INVALID',
        `/tasks/${id}/transition_disposition`,
        'exact non-executable supersession projection',
        disposition || null,
        'Mirror the Program transition without granting a second execution authority or any credit.',
      ));
    }
    if (task.authority?.carrier_status !== carrier.status) {
      diagnostics.push(diagnostic(
        'RECOVERY_SUPERSEDED_TASK_CARRIER_STATUS_MISMATCH',
        `/tasks/${id}/authority/carrier_status`,
        carrier.status,
        task.authority?.carrier_status,
        'Preserve the historical carrier status exactly while denying execution through authorization and eligibility.',
      ));
    }
  }

  for (const task of ledger?.tasks || []) {
    if (!retired.has(task.task_id) && task.transition_disposition !== null && task.transition_disposition !== undefined) {
      diagnostics.push(diagnostic(
        'RECOVERY_UNDECLARED_SUPERSESSION_FORBIDDEN',
        `/tasks/${task.task_id}/transition_disposition`,
        null,
        task.transition_disposition,
        'Only task IDs named by the Program transition may carry a supersession disposition.',
      ));
    }
  }

  return uniqueDiagnostics(diagnostics);
}

function legacyEligibilityProjection(ledger, completionCapabilities) {
  const projected = structuredClone(ledger);
  const tasksById = new Map((projected.tasks || []).map((task) => [task.task_id, task]));
  const capabilityFor = (task) => completionCapabilities instanceof Map
    ? completionCapabilities.get(task?.task_id)
    : null;
  const hasVerifiedCompletion = (task) => task?.lifecycle_state === 'complete'
    && recoveryCompletionCapabilityMatches(capabilityFor(task), projected, task);
  const retired = new Set(RECOVERY_SUPERSEDED_TASK_IDS);

  for (const task of projected.tasks || []) {
    if (!retired.has(task.task_id)) continue;
    const dependencies = Array.isArray(task.declared_dependencies) ? task.declared_dependencies : [];
    task.execution_eligibility = dependencies.every((id) => hasVerifiedCompletion(tasksById.get(id)))
      ? 'dependency_ready'
      : 'dependency_blocked';
  }
  return projected;
}

export function validateRecoveryTransitionLedgerDocument(
  ledger,
  program,
  schema,
  completionCapabilities = new Map(),
) {
  const transitionDiagnostics = recoveryTransitionAuthorityDiagnostics(ledger, program);
  if (transitionDiagnostics.some((item) => item.diagnostic_id === 'RECOVERY_TRANSITION_AUTHORITY_INVALID')) {
    return transitionDiagnostics;
  }
  const projected = legacyEligibilityProjection(ledger, completionCapabilities);
  const legacyDiagnostics = validateLegacyRecoveryLedgerDocument(
    projected,
    program,
    schema,
    completionCapabilities,
  );
  return uniqueDiagnostics([...legacyDiagnostics, ...transitionDiagnostics]);
}
