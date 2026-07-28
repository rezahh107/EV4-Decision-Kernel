#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { recoveryLedgerDiagnostics } from '../kernel/validator/validate-recovery-ledger.mjs';
import {
  RECOVERY_SUPERSEDED_TASK_IDS,
  RECOVERY_TRANSITION_AUTHORITY,
} from '../kernel/validator/validate-recovery-execution-program.mjs';

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
const readJson = (file) => JSON.parse(read(file));
const fail = (file, problem) => failures.push({ file, problem });
const next = read('planning/NEXT_WORK.md');
const plan = read('planning/KERNEL_EXECUTION_PLAN.md');
const program = readJson('planning/recovery/recovery-execution-program.v1.json');
const ledger = readJson('planning/recovery/recovery-ledger.v1.json');
const policy = readJson('kernel/decision-governance/aigov-repository-policy.v1.json');
const coverage = readJson('kernel/decision-governance/coverage-guarantee-contract.v1.json');
const closure = read('planning/reviews/AIGOV_V4_BATCH_B_POST_MERGE_CLOSURE.md');
const activation = read('planning/reviews/RECOVERY_PROGRAM_ACTIVATION.md');
const transitionPath = 'planning/migrations/aigov-v2.6-migration-program.v1.json';
const migration = existsSync(transitionPath) ? readJson(transitionPath) : null;
const transitionActive = program.transition?.decision_id === 'OWNER-DIRECTED-AIGOV-2.6-MIGRATION'
  && program.transition?.effective_execution_authority === RECOVERY_TRANSITION_AUTHORITY
  && migration?.program_id === 'AIGOV-2.6-REPOSITORY-MIGRATION-PROGRAM';

function recoveryCandidateMemoryDiagnostics(value) {
  const diagnostics = [];
  if (/(?:^|[;\s`])draft_pr_52_open(?:$|[;\s`])/m.test(value)) diagnostics.push('ROADMAP_RECOVERY_DRAFT_STATE_STALE');
  if (!value.includes('non_draft_pr_52_open')
    || !value.includes('KREC-001_candidate_pr_state: non_draft_open')
    || !value.includes('open non-Draft PR #52')) diagnostics.push('ROADMAP_RECOVERY_NON_DRAFT_STATE_MISSING');
  if (!value.includes('KREC-001_reviewed_head_sha: 240fa2094005f5494e4823f23c59cdcd9b4ba5ff')
    || !value.includes('KREC-001_reviewed_head_exact_head_ci: green')
    || !value.includes('Exact-head CI succeeded on reviewed Head `240fa2094005f5494e4823f23c59cdcd9b4ba5ff`')) diagnostics.push('ROADMAP_RECOVERY_REVIEWED_HEAD_CI_MISSING');
  if (value.includes('exact-head CI, owner Merge and completion evidence remain pending')) diagnostics.push('ROADMAP_RECOVERY_EXACT_HEAD_CI_FALSE_PENDING');
  return [...new Set(diagnostics)];
}

if (!transitionActive) {
  for (const code of recoveryCandidateMemoryDiagnostics(next)) fail('planning/NEXT_WORK.md', code);
  const draftMutation = next.replace('non_draft_pr_52_open', 'draft_pr_52_open');
  if (!recoveryCandidateMemoryDiagnostics(draftMutation).includes('ROADMAP_RECOVERY_DRAFT_STATE_STALE')) fail('tools/validate-roadmap-memory-v4-owner-policy.mjs', 'draft-state mutation guard did not reject draft_pr_52_open');
}

for (const token of [
  'repository_adoption_status: complete','status: merged_and_post_merge_verified','program_status: active','KREC-001_through_009: active','KROAD-012: preserved_not_superseded','KROAD-013_through_018: not_started','KROAD-012R: historical_non_authoritative','coverage_promotion_effect: none','product_effect: none','kroad_supersession_effect: none',
]) if (!next.includes(token)) fail('planning/NEXT_WORK.md', `missing ${token}`);

const workPackageMatches = [...next.matchAll(/^current_work_package_id:\s*([A-Z0-9][A-Z0-9._-]*)\s*$/gm)];
const expectedWorkPackage = transitionActive ? 'AIGOV26-TRANSITION-001' : 'KREC-001';
if (workPackageMatches.length !== 1 || workPackageMatches[0][1] !== expectedWorkPackage) fail('planning/NEXT_WORK.md', `exactly one structured current_work_package_id must bind ${expectedWorkPackage}`);

if (policy.authority?.independent_review_required !== false || policy.authority?.independent_exact_head_review !== 'optional_advisory' || policy.authority?.merge_authority !== 'owner_only') fail('kernel/decision-governance/aigov-repository-policy.v1.json', 'owner policy boundary mismatch');
if (coverage.merge_gate?.exact_head_ci_green !== 'required' || coverage.merge_gate?.independent_pr_inspector_green !== 'optional_advisory' || coverage.merge_gate?.explicit_owner_merge_command !== 'required') fail('kernel/decision-governance/coverage-guarantee-contract.v1.json', 'pre-Merge review policy does not match owner policy');
if (!coverage.promotion_boundary?.required_predicates?.includes('independent_review_passed')) fail('kernel/decision-governance/coverage-guarantee-contract.v1.json', 'external Coverage-promotion independent review predicate must remain distinct and required');

const graph = {'KREC-001':[],'KREC-002':['KREC-001'],'KREC-003':['KREC-001','KREC-002'],'KREC-004':['KREC-001'],'KREC-005':['KREC-002','KREC-003','KREC-004'],'KREC-006':['KREC-003','KREC-004','KREC-005'],'KREC-007':['KREC-005','KREC-006'],'KREC-008':['KREC-002','KREC-007'],'KREC-009':['KREC-003','KREC-006','KREC-007','KREC-008']};
if (program.program_status !== 'active'
  || program.tasks?.length !== 9
  || program.tasks.some((task) => task.status !== 'active'
    || task.coverage_credit !== false
    || task.readiness_claim !== false
    || JSON.stringify(task.depends_on) !== JSON.stringify(graph[task.task_id]))) {
  fail('planning/recovery/recovery-execution-program.v1.json', 'Recovery carrier state or dependency graph mismatch');
}
if (transitionActive) {
  const byId = new Map(program.tasks.map((task) => [task.task_id, task]));
  if (byId.get('KREC-001')?.implementation_authorized !== true
    || RECOVERY_SUPERSEDED_TASK_IDS.some((id) => byId.get(id)?.implementation_authorized !== false)) {
    fail('planning/recovery/recovery-execution-program.v1.json', 'transition legacy authorization projection mismatch');
  }
} else if (program.tasks.some((task) => task.implementation_authorized !== true)) {
  fail('planning/recovery/recovery-execution-program.v1.json', 'legacy Recovery activation authorization mismatch');
}
if (program.kroad_012r_status !== 'historical_non_authoritative' || program.kroad_supersession_effect !== 'none' || program.coverage_promotion_effect !== 'none' || program.product_effect !== 'none') fail('planning/recovery/recovery-execution-program.v1.json', 'forbidden effect detected');

if (!transitionActive) {
  const ledgerDiagnostics = recoveryLedgerDiagnostics(ledger, program);
  if (ledgerDiagnostics.length) fail('planning/recovery/recovery-ledger.v1.json', 'Recovery ledger mismatch: ' + ledgerDiagnostics.map((item) => item.diagnostic_id).join(', '));
}
const ledgerById = new Map(ledger.tasks.map((task) => [task.task_id, task]));
const krec001 = ledgerById.get('KREC-001');

if (transitionActive) {
  if (ledger.transition?.effective_task_execution_authority !== RECOVERY_TRANSITION_AUTHORITY) fail('planning/recovery/recovery-ledger.v1.json', 'Ledger must project Program transition authority');
  if (krec001?.lifecycle_state !== 'complete' || krec001?.execution_eligibility !== 'complete' || krec001?.candidate?.branch !== 'krec-001/recovery-ledger' || krec001?.candidate?.pull_request !== 52 || krec001?.candidate?.pr_state !== 'merged' || krec001?.transition_blocker !== null || krec001?.transition_disposition !== null || krec001?.completion_evidence?.exact_head_ci?.run_id !== 29741545637 || krec001?.completion_evidence?.current_main_validation?.run_id !== 29742820512) fail('planning/recovery/recovery-ledger.v1.json', 'KREC-001 transition completion evidence mismatch');
  for (const id of RECOVERY_SUPERSEDED_TASK_IDS) {
    const task = ledgerById.get(id); const disposition = task?.transition_disposition;
    if (task?.lifecycle_state !== 'not_started'
      || task?.execution_eligibility !== 'superseded'
      || task?.authority?.implementation_authorized !== false
      || task?.candidate !== null
      || task?.completion_evidence !== null
      || disposition?.lifecycle_state !== 'superseded_before_execution'
      || disposition?.execution_eligibility !== 'superseded'
      || disposition?.historical_definition_preserved !== true
      || disposition?.substantive_implementation_started !== false
      || disposition?.implementation_credit !== false
      || disposition?.completion_credit !== false
      || disposition?.coverage_credit !== false) fail('planning/recovery/recovery-ledger.v1.json', `${id} transition disposition mismatch`);
  }
  if (migration.repository_adoption_status !== 'planned_not_adopted' || migration.implementation_started !== false || migration.transition_gate?.state !== 'satisfied' || migration.tasks?.length !== 8 || migration.tasks[0]?.state !== 'dependency_ready' || migration.tasks.slice(1).some((task) => task.state !== 'dependency_blocked')) fail(transitionPath, 'AIGOV v2.6 successor initial state mismatch');
  for (const token of ['current_work_package_id: AIGOV26-TRANSITION-001','source_registered: true','repository_adopted: false','implementation_started: false','effective_execution_authority: program_transition','legacy_consumer_policy: fail_closed','lifecycle: complete','formal_completion: complete','exact_head_validate_mvk_run: 29741545637','current_main_validate_main_run: 29742820512','lifecycle: superseded_before_execution','execution_eligibility: superseded','legacy_implementation_authorized: false','historical_definition_preserved: true','next_executable_task: AIGOV26-001']) if (!next.includes(token)) fail('planning/NEXT_WORK.md', `missing transition token: ${token}`);
} else {
  const krec002 = ledgerById.get('KREC-002'); const krec004 = ledgerById.get('KREC-004');
  if (!['in_progress','checks_pending'].includes(krec001?.lifecycle_state) || krec001?.candidate?.branch !== 'krec-001/recovery-ledger' || krec001?.completion_evidence !== null) fail('planning/recovery/recovery-ledger.v1.json', 'KREC-001 must remain a non-complete branch-backed candidate before owner Merge');
  if (krec002?.lifecycle_state !== 'not_started' || krec002?.execution_eligibility !== 'dependency_blocked' || krec004?.lifecycle_state !== 'not_started' || krec004?.execution_eligibility !== 'dependency_blocked') fail('planning/recovery/recovery-ledger.v1.json', 'KREC-002 and KREC-004 must remain dependency-blocked before KREC-001 completion');
  for (const token of ['current_work_package_id: KREC-001','ledger: planning/recovery/recovery-ledger.v1.json','KREC-001_lifecycle: ' + krec001?.lifecycle_state,'KREC-001_candidate_branch: krec-001/recovery-ledger','KREC-001_candidate_pr: ' + krec001?.candidate?.pull_request,'KREC-001_candidate_pr_state: non_draft_open','KREC-001_reviewed_head_exact_head_ci: green','KREC-001_completion_evidence: null','KREC-002_execution_eligibility: dependency_blocked','KREC-004_execution_eligibility: dependency_blocked']) if (!next.includes(token)) fail('planning/NEXT_WORK.md', 'missing live KREC-001 candidate token: ' + token);
}

if (transitionActive) {
  for (const token of ['## Recovery Execution Program Overlay — Transitioned','`program_transition`','`KREC-002` | Current Source Verification','`implementation_authorized: false` | `superseded`','Supersession has precedence over dependency completion','`AIGOV26-001` is the only successor task initially `dependency_ready`']) if (!plan.includes(token)) fail('planning/KERNEL_EXECUTION_PLAN.md', `missing transition Recovery token: ${token}`);
} else {
  for (const token of ['## Recovery Execution Program Overlay — Active','all nine KREC tasks are authorized simultaneously','Only `complete` dependencies affect execution eligibility']) if (!plan.includes(token)) fail('planning/KERNEL_EXECUTION_PLAN.md', `missing legacy Recovery token: ${token}`);
}
if (!plan.includes('# Coverage Guarantee Proposal Overlay — Non-Executable') || !plan.includes('## Proposed Unified Coverage Execution Program — Non-Executable')) fail('planning/KERNEL_EXECUTION_PLAN.md', 'non-executable Coverage proposal overlays must remain distinct');
if (!closure.includes('435add8ee3f3274f781b6e391f11e3262e380c4e') || !closure.includes('not_required_by_owner_policy')) fail('planning/reviews/AIGOV_V4_BATCH_B_POST_MERGE_CLOSURE.md', 'closure identity incomplete');
if (!activation.includes('substantive_krec_implementation_included: false')) fail('planning/reviews/RECOVERY_PROGRAM_ACTIVATION.md', 'activation boundary incomplete');
if (!transitionActive && !/^- \[ \] KREC-001 — Recovery Ledger$/m.test(next)) fail('planning/NEXT_WORK.md', 'KREC-001 must be the immediate next task');
if (transitionActive && !/^- \[ \] `KROAD-012 — External Evidence Producer Boundary`$/m.test(next)) fail('planning/NEXT_WORK.md', 'KROAD-012 must remain the preserved next product task');

if (failures.length) {
  console.error('Roadmap memory owner-policy validation failed:');
  for (const item of failures) console.error(`\n${item.file}\n  Problem: ${item.problem}`);
  process.exit(1);
}
console.log(`Roadmap memory owner-policy validation passed (${transitionActive ? 'AIGOV26 transition' : 'KREC-001 candidate'} mode).`);
