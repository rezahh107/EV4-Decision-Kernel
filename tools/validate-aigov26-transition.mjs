#!/usr/bin/env node
import fs from 'node:fs';

const read = (path) => JSON.parse(fs.readFileSync(path, 'utf8'));
const paths = {
  program: 'planning/recovery/recovery-execution-program.v1.json',
  ledger: 'planning/recovery/recovery-ledger.v1.json',
  migration: 'planning/migrations/aigov-v2.6-migration-program.v1.json',
  inventory: 'planning/migrations/aigov-v2.6-transition-inventory.v1.json',
  source: 'planning/governance/sources/aigov-v2.6.0-source-lock.v1.json',
  scope: 'planning/governance/scopes/aigov-v2.6-transition.scope.json',
  next: 'planning/NEXT_WORK.md',
};
const expectedRetired = Array.from({ length: 8 }, (_, index) => `KREC-${String(index + 2).padStart(3, '0')}`);
const expectedAigov = Array.from({ length: 8 }, (_, index) => `AIGOV26-${String(index + 1).padStart(3, '0')}`);
const expectedDeps = {
  'AIGOV26-001': [],
  'AIGOV26-002': ['AIGOV26-001'],
  'AIGOV26-003': ['AIGOV26-002'],
  'AIGOV26-004': ['AIGOV26-003'],
  'AIGOV26-005': ['AIGOV26-004'],
  'AIGOV26-006': ['AIGOV26-005'],
  'AIGOV26-007': ['AIGOV26-006'],
  'AIGOV26-008': ['AIGOV26-007'],
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clone = (value) => structuredClone(value);

export function diagnostics(documents) {
  const out = [];
  const add = (condition, code) => { if (condition) out.push(code); };
  const { program, ledger, migration, inventory, source, scope, next } = documents;

  add(program?.transition?.decision_id !== 'OWNER-DIRECTED-AIGOV-2.6-MIGRATION', 'AIGOV26_PROGRAM_TRANSITION_MISSING');
  add(program?.transition?.successor_program_id !== 'AIGOV-2.6-REPOSITORY-MIGRATION-PROGRAM', 'AIGOV26_SUCCESSOR_PROGRAM_MISSING');
  add(!same(program?.transition?.preserved_task_ids, ['KREC-001']), 'AIGOV26_KREC001_PRESERVATION_INVALID');
  add(!same(program?.transition?.superseded_before_execution_task_ids, expectedRetired), 'AIGOV26_RETIRED_TASK_SET_INVALID');
  add(program?.transition?.historical_definitions_preserved !== true, 'AIGOV26_HISTORICAL_DEFINITION_LOSS');
  add(program?.transition?.auto_migration !== false, 'AIGOV26_AUTO_MIGRATION_FORBIDDEN');

  const ledgerById = new Map((ledger?.tasks || []).map((task) => [task.task_id, task]));
  const krec1 = ledgerById.get('KREC-001');
  add(krec1?.lifecycle_state !== 'complete' || krec1?.execution_eligibility !== 'complete', 'AIGOV26_KREC001_LIFECYCLE_INVALID');
  add(krec1?.candidate?.pull_request !== 52 || krec1?.candidate?.pr_state !== 'merged', 'AIGOV26_KREC001_MERGE_RECONCILIATION_INVALID');
  add(krec1?.transition_blocker !== null, 'AIGOV26_KREC001_STALE_BLOCKER');
  const completion = krec1?.completion_evidence;
  add(completion?.pull_request !== 52
    || completion?.reviewed_head_sha !== '117a6f072c6c0a6a3487a4520e8f6f0623618769'
    || completion?.merge_method !== 'merge'
    || completion?.merge_actor !== 'rezahh107'
    || completion?.resulting_main_sha !== '4fe332847e6867fc6aa4639a94a88b8177d31970',
    'AIGOV26_KREC001_COMPLETION_IDENTITY_INVALID');
  add(completion?.exact_head_ci?.workflow !== 'Validate MVK'
    || completion?.exact_head_ci?.run_id !== 29741545637
    || completion?.exact_head_ci?.head_sha !== '117a6f072c6c0a6a3487a4520e8f6f0623618769'
    || completion?.exact_head_ci?.conclusion !== 'success',
    'AIGOV26_KREC001_EXACT_HEAD_EVIDENCE_INVALID');
  add(completion?.current_main_validation?.workflow !== 'Validate Main'
    || completion?.current_main_validation?.run_id !== 29742820512
    || completion?.current_main_validation?.head_sha !== '4fe332847e6867fc6aa4639a94a88b8177d31970'
    || completion?.current_main_validation?.conclusion !== 'success',
    'AIGOV26_KREC001_CURRENT_MAIN_EVIDENCE_INVALID');

  for (const id of expectedRetired) {
    const task = ledgerById.get(id);
    const disposition = task?.transition_disposition;
    add(!task, 'AIGOV26_RETIRED_TASK_MISSING');
    add(task?.lifecycle_state !== 'not_started' || task?.candidate !== null || task?.completion_evidence !== null,
      'AIGOV26_ACTIVE_OR_COMPLETED_TASK_SUPERSESSION_FORBIDDEN');
    add(disposition?.lifecycle_state !== 'superseded_before_execution'
      || disposition?.execution_eligibility !== 'superseded'
      || disposition?.superseded_by !== 'AIGOV-2.6-REPOSITORY-MIGRATION-PROGRAM',
      'AIGOV26_SUPERSESSION_RECORD_INVALID');
    add(disposition?.historical_definition_preserved !== true
      || disposition?.substantive_implementation_started !== false,
      'AIGOV26_SUPERSESSION_HISTORY_INVALID');
    add(disposition?.implementation_credit !== false
      || disposition?.completion_credit !== false
      || disposition?.coverage_credit !== false,
      'AIGOV26_SUPERSESSION_CREDIT_FORBIDDEN');
  }

  add(migration?.program_id !== 'AIGOV-2.6-REPOSITORY-MIGRATION-PROGRAM', 'AIGOV26_MIGRATION_PROGRAM_ID_INVALID');
  add(migration?.repository_adoption_status !== 'planned_not_adopted'
    || migration?.implementation_started !== false, 'AIGOV26_ADOPTION_OR_IMPLEMENTATION_OVERCLAIM');
  add(migration?.transition_gate?.state !== 'satisfied'
    || migration?.transition_gate?.completion_evidence_ref !== 'planning/recovery/recovery-ledger.v1.json#/tasks/0/completion_evidence',
    'AIGOV26_TRANSITION_GATE_INVALID');
  const migrationById = new Map((migration?.tasks || []).map((task) => [task.task_id, task]));
  add(migrationById.size !== 8 || expectedAigov.some((id) => !migrationById.has(id)), 'AIGOV26_TASK_SET_INVALID');
  for (const id of expectedAigov) {
    const task = migrationById.get(id);
    add(!same(task?.dependencies, expectedDeps[id]), 'AIGOV26_DEPENDENCY_GRAPH_INVALID');
    add(task?.state !== (id === 'AIGOV26-001' ? 'dependency_ready' : 'dependency_blocked'),
      'AIGOV26_INITIAL_STATE_INVALID');
    add(task?.coverage_effects?.coverage_credit !== false
      || task?.coverage_effects?.readiness_claim !== false,
      'AIGOV26_TASK_CREDIT_FORBIDDEN');
  }

  add(source?.package_identity !== 'AIGOV_v2.6.0_active'
    || source?.observed_archive_sha256 !== '6b1040b6a9d704777d803d99ac7e23752fd4151721b5279b3fd98566d007b9ce',
    'AIGOV26_SOURCE_IDENTITY_INVALID');
  add(source?.external_trusted_archive_sha256 !== null, 'AIGOV26_EXTERNAL_TRUST_OVERCLAIM');
  add(source?.verification?.status !== 'NOT_REPERFORMED_ARCHIVE_UNAVAILABLE'
    || source?.verification?.absence_claimed !== false,
    'AIGOV26_SOURCE_VERIFICATION_BOUNDARY_INVALID');
  add(source?.repository_adoption_status !== 'planned_not_adopted'
    || source?.repository_policy_activated !== false
    || source?.ci_enforcement_activated !== false,
    'AIGOV26_SOURCE_ACTIVATION_OVERCLAIM');

  add(inventory?.remote_branches_deleted !== false, 'AIGOV26_REMOTE_BRANCH_DELETION_FORBIDDEN');
  const branches = new Map((inventory?.branches || []).map((item) => [item.branch, item]));
  for (const name of [
    'krec-001/recovery-ledger',
    'codex/refactor-github-pr-protection-configuration',
    'fix/ev4-wave5-receipt-safety-profile',
    'agent/coverage-guarantee-bootstrap-pr1',
    'kroad-010/evidence-closure-pr37-main',
    'kroad-010/downstream-consumer-contract',
    'kroad-007-l2-decision-audit',
  ]) add(!branches.has(name), 'AIGOV26_REQUIRED_BRANCH_INVENTORY_MISSING');
  add(branches.get('codex/refactor-github-pr-protection-configuration')?.disposition !== 'requirements_extracted_into_aigov26',
    'AIGOV26_PR45_REQUIREMENTS_NOT_ACCOUNTED');
  add(branches.get('fix/ev4-wave5-receipt-safety-profile')?.disposition !== 'requirements_extracted_into_aigov26',
    'AIGOV26_PR32_REQUIREMENTS_NOT_ACCOUNTED');

  add(scope?.base_sha !== '4fe332847e6867fc6aa4639a94a88b8177d31970'
    || scope?.plan_id !== 'AIGOV-2.6-REPOSITORY-MIGRATION-PROGRAM'
    || !scope?.forbidden_changes?.includes('destructive_deletion')
    || !scope?.excluded?.some((item) => item.includes('remote branch deletion')),
    'AIGOV26_SCOPE_INVALID');
  for (const path of Object.values(paths).filter((value) => value !== paths.next)) {
    add(path !== paths.scope && !scope?.committed?.includes(path), 'AIGOV26_SCOPE_PATH_MISSING');
  }
  add(!String(next || '').includes('formal_completion: complete')
    || !String(next || '').includes('exact_head_validate_mvk_run: 29741545637')
    || !String(next || '').includes('current_main_validate_main_run: 29742820512')
    || !String(next || '').includes('superseded_before_execution')
    || !String(next || '').includes('repository_adopted: false')
    || !String(next || '').includes('next_executable_task: AIGOV26-001'),
    'AIGOV26_ROADMAP_MEMORY_INVALID');

  add(migration?.effects?.coverage_credit !== false
    || migration?.effects?.readiness_claim !== false
    || migration?.effects?.policy_adoption_claim !== false
    || migration?.effects?.product_effect !== 'none'
    || migration?.effects?.deployment_effect !== 'none'
    || migration?.effects?.external_repository_effect !== 'none',
    'AIGOV26_EFFECT_OVERCLAIM');

  return [...new Set(out)];
}

function load() {
  return {
    program: read(paths.program),
    ledger: read(paths.ledger),
    migration: read(paths.migration),
    inventory: read(paths.inventory),
    source: read(paths.source),
    scope: read(paths.scope),
    next: fs.readFileSync(paths.next, 'utf8'),
  };
}

function selfTest(source) {
  const cases = [];
  const expect = (name, mutate, code) => {
    const value = clone(source);
    mutate(value);
    const observed = diagnostics(value);
    cases.push({ name, pass: observed.includes(code), diagnostics: observed });
  };
  expect('KREC-001 completion evidence must remain exact', (x) => { x.ledger.tasks[0].completion_evidence.current_main_validation.run_id = 1; }, 'AIGOV26_KREC001_CURRENT_MAIN_EVIDENCE_INVALID');
  expect('completed KREC task cannot be superseded', (x) => { x.ledger.tasks[1].lifecycle_state = 'complete'; }, 'AIGOV26_ACTIVE_OR_COMPLETED_TASK_SUPERSESSION_FORBIDDEN');
  expect('missing successor program fails', (x) => { x.program.transition.successor_program_id = 'missing'; }, 'AIGOV26_SUCCESSOR_PROGRAM_MISSING');
  expect('automatic migration fails', (x) => { x.program.transition.auto_migration = true; }, 'AIGOV26_AUTO_MIGRATION_FORBIDDEN');
  expect('supersession completion credit fails', (x) => { x.ledger.tasks[1].transition_disposition.completion_credit = true; }, 'AIGOV26_SUPERSESSION_CREDIT_FORBIDDEN');
  expect('source trust overclaim fails', (x) => { x.source.external_trusted_archive_sha256 = x.source.observed_archive_sha256; }, 'AIGOV26_EXTERNAL_TRUST_OVERCLAIM');
  expect('repository adoption overclaim fails', (x) => { x.migration.repository_adoption_status = 'adopted'; }, 'AIGOV26_ADOPTION_OR_IMPLEMENTATION_OVERCLAIM');
  expect('remote branch deletion fails', (x) => { x.inventory.remote_branches_deleted = true; }, 'AIGOV26_REMOTE_BRANCH_DELETION_FORBIDDEN');
  return cases;
}

const documents = load();
const observed = diagnostics(documents);
const tests = process.argv.includes('--self-test') ? selfTest(documents) : [];
const status = observed.length === 0 && tests.every((item) => item.pass) ? 'pass' : 'fail';
console.log(JSON.stringify({ validator: 'aigov-v2.6-transition', status, diagnostics: observed, tests }, null, 2));
if (status !== 'pass') process.exitCode = 1;
