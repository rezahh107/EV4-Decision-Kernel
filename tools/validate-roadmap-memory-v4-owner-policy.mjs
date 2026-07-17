#!/usr/bin/env node
import { readFileSync } from 'node:fs';
const failures = [];
const read = (file) => readFileSync(file, 'utf8');
const fail = (file, problem) => failures.push({ file, problem });
const next = read('planning/NEXT_WORK.md');
const plan = read('planning/KERNEL_EXECUTION_PLAN.md');
const program = JSON.parse(read('planning/recovery/recovery-execution-program.v1.json'));
const policy = JSON.parse(read('kernel/decision-governance/aigov-repository-policy.v1.json'));
const coverage = JSON.parse(read('kernel/decision-governance/coverage-guarantee-contract.v1.json'));
const closure = read('planning/reviews/AIGOV_V4_BATCH_B_POST_MERGE_CLOSURE.md');
const activation = read('planning/reviews/RECOVERY_PROGRAM_ACTIVATION.md');

for (const token of [
  'repository_adoption_status: complete',
  'status: merged_and_post_merge_verified',
  'program_status: active',
  'KREC-001_through_009: active',
  'KROAD-012: preserved_not_superseded',
  'KROAD-013_through_018: not_started',
  'KROAD-012R: historical_non_authoritative',
  'coverage_promotion_effect: none',
  'product_effect: none',
  'kroad_supersession_effect: none',
]) if (!next.includes(token)) fail('planning/NEXT_WORK.md', `missing ${token}`);

const workPackageMatches = [...next.matchAll(/^current_work_package_id:\s*([A-Z0-9][A-Z0-9._-]*)\s*$/gm)];
if (workPackageMatches.length !== 1
  || workPackageMatches[0][1] !== 'GOV-OWNER-POLICY-RECOVERY-ACTIVATION') {
  fail('planning/NEXT_WORK.md', 'exactly one structured current_work_package_id must bind the active governance/recovery activation');
}
if (policy.authority?.independent_review_required !== false
  || policy.authority?.independent_exact_head_review !== 'optional_advisory'
  || policy.authority?.merge_authority !== 'owner_only') {
  fail('kernel/decision-governance/aigov-repository-policy.v1.json', 'owner policy boundary mismatch');
}
if (coverage.merge_gate?.exact_head_ci_green !== 'required'
  || coverage.merge_gate?.independent_pr_inspector_green !== 'optional_advisory'
  || coverage.merge_gate?.explicit_owner_merge_command !== 'required') {
  fail('kernel/decision-governance/coverage-guarantee-contract.v1.json', 'pre-Merge review policy does not match owner policy');
}
if (!coverage.promotion_boundary?.required_predicates?.includes('independent_review_passed')) {
  fail('kernel/decision-governance/coverage-guarantee-contract.v1.json', 'external Coverage-promotion independent review predicate must remain distinct and required');
}

const graph = {
  'KREC-001': [],
  'KREC-002': ['KREC-001'],
  'KREC-003': ['KREC-001', 'KREC-002'],
  'KREC-004': ['KREC-001'],
  'KREC-005': ['KREC-002', 'KREC-003', 'KREC-004'],
  'KREC-006': ['KREC-003', 'KREC-004', 'KREC-005'],
  'KREC-007': ['KREC-005', 'KREC-006'],
  'KREC-008': ['KREC-002', 'KREC-007'],
  'KREC-009': ['KREC-003', 'KREC-006', 'KREC-007', 'KREC-008'],
};
if (program.program_status !== 'active' || program.tasks?.length !== 9
  || program.tasks.some((task) => task.status !== 'active'
    || task.implementation_authorized !== true
    || task.coverage_credit !== false
    || task.readiness_claim !== false
    || JSON.stringify(task.depends_on) !== JSON.stringify(graph[task.task_id]))) {
  fail('planning/recovery/recovery-execution-program.v1.json', 'Recovery activation state or dependency graph mismatch');
}
if (program.kroad_012r_status !== 'historical_non_authoritative'
  || program.kroad_supersession_effect !== 'none'
  || program.coverage_promotion_effect !== 'none'
  || program.product_effect !== 'none') {
  fail('planning/recovery/recovery-execution-program.v1.json', 'forbidden effect detected');
}
for (const token of [
  '## Recovery Execution Program Overlay — Active',
  '`DCOV-COVERAGE-EXECUTION-PROGRAM`',
  'all nine KREC tasks are authorized simultaneously',
  '`KREC-001` | Recovery Ledger | none',
  '`KREC-009` | Coverage Baseline | `KREC-003`, `KREC-006`, `KREC-007`, `KREC-008`',
  'Substantive implementation in the activation PR:** none',
  'Coverage promotion effect:** `none`',
  '`KROAD-012` remains not superseded',
  '`KROAD-013` through `KROAD-018` remain `not_started`',
  '`KROAD-012R` remains `historical_non_authoritative`',
]) if (!plan.includes(token)) fail('planning/KERNEL_EXECUTION_PLAN.md', `missing durable Recovery token: ${token}`);
if (!plan.includes('# Coverage Guarantee Proposal Overlay — Non-Executable')
  || !plan.includes('## Proposed Unified Coverage Execution Program — Non-Executable')) {
  fail('planning/KERNEL_EXECUTION_PLAN.md', 'non-executable Coverage proposal overlays must remain distinct');
}
if (!closure.includes('435add8ee3f3274f781b6e391f11e3262e380c4e')
  || !closure.includes('not_required_by_owner_policy')) {
  fail('planning/reviews/AIGOV_V4_BATCH_B_POST_MERGE_CLOSURE.md', 'closure identity incomplete');
}
if (!activation.includes('substantive_krec_implementation_included: false')) {
  fail('planning/reviews/RECOVERY_PROGRAM_ACTIVATION.md', 'activation boundary incomplete');
}
if (!/^- \[ \] KREC-001 — Recovery Ledger$/m.test(next)) {
  fail('planning/NEXT_WORK.md', 'KREC-001 must be the immediate next task');
}
if (failures.length) {
  console.error('Roadmap memory owner-policy validation failed:');
  for (const item of failures) console.error(`\n${item.file}\n  Problem: ${item.problem}`);
  process.exit(1);
}
console.log('Roadmap memory owner-policy validation passed.');
