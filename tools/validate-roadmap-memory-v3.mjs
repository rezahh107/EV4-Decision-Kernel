#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3';
const BASE_SHA = '86e25a9073df7e257ca7df799de85baf9b3fafb0';
const failures = [];
const fail = (file, problem) => failures.push({ file, problem });
const read = (file) => {
  const absolute = path.join(ROOT, file);
  if (!fs.existsSync(absolute)) {
    fail(file, 'required file is missing');
    return '';
  }
  return fs.readFileSync(absolute, 'utf8');
};
const section = (text, heading) => {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^## ${escaped}\\s*$`, 'm').exec(text);
  if (!match) return '';
  const rest = text.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
};

const nextWork = read('planning/NEXT_WORK.md');
const decision = read('planning/decisions/AIGOV_ADOPTION_DECISION.md');
const audit = read('planning/reviews/AIGOV_ADOPTION_AUDIT.md');
const historicalReview = read('planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md');
const executionPlan = read('planning/KERNEL_EXECUTION_PLAN.md');
const agents = read('AGENTS.md');
const readme = read('README.md');
const programText = read('planning/recovery/recovery-execution-program.v1.json');
const scopeText = read('planning/governance/scopes/aigov-v3-batch-b.scope.json');
const impactPath = 'planning/coverage/impacts/dcov-exec-001.pr50-aigov-v3-batch-b.json';
const impactText = read(impactPath);
const ssotManifest = read('docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md');

if (!/^## Status Authority\s*$/m.test(nextWork) || !/authoritative current-status dashboard/i.test(nextWork)) fail('planning/NEXT_WORK.md', 'current-status authority is not explicit');
for (const token of [
  `frozen_plan: ${PLAN_ID}`,
  'repository_adoption_status: pending_batch_b_exact_main_completion',
  'BATCH_A: exact_main_reconciled_under_v3_exception',
  'AIGOV-ADOPT-000_through_007: merged_and_post_merge_reconciled',
  'batch: BATCH_B',
  'increment: AIGOV-ADOPT-008',
  'status: implemented_pending_exact_head_validation_and_review',
  'KREC-001_through_009: registered_planned_task',
  'KROAD-012: next_product_task_blocked_pending_final_aigov_closure',
  'KROAD-013_through_018: not_started',
  'KROAD-012R: historical_non_authoritative',
  'status: not_measurable_pending_external_promotion',
  'percentages: null',
  'coverage_promotion_effect: none',
  'product_effect: none',
]) if (!nextWork.includes(token)) fail('planning/NEXT_WORK.md', `required V3 state missing: ${token}`);
const nextTask = section(nextWork, 'Next Task');
const unchecked = [...nextTask.matchAll(/^- \[ \] ((?:KROAD|DCOV-EXEC|AIGOV-ADOPT)-\d{3})\s+—/gm)];
if (unchecked.length !== 1 || unchecked[0]?.[1] !== 'AIGOV-ADOPT-008') fail('planning/NEXT_WORK.md', 'AIGOV-ADOPT-008 must be the only current task');
if (/repository_adoption_status:\s*(?:adopted|complete)|GREEN_MERGE_RECOMMENDED|merge_authorized:\s*true/i.test(nextWork)) fail('planning/NEXT_WORK.md', 'PR head claims final adoption or Merge authority');

if (!decision.includes(`plan_id: ${PLAN_ID}`)
  || !decision.includes('plan_version: 3')
  || !decision.includes(`audit_base_sha: ${BASE_SHA}`)
  || !decision.includes('previous_plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2')
  || !/one-time/i.test(decision)
  || !decision.includes('impossible_retrospective_review_cycle')
  || !decision.includes('owner_only')) fail('planning/decisions/AIGOV_ADOPTION_DECISION.md', 'authoritative V3 identity or exception boundary is incomplete');
if (!audit.includes(`plan_id: ${PLAN_ID}`)
  || !audit.includes('repository_adoption_status: pending_batch_b_exact_main_completion')
  || !/No historical independent Green receipt is claimed/i.test(audit)) fail('planning/reviews/AIGOV_ADOPTION_AUDIT.md', 'audit identity or no-fabrication statement is incorrect');
if (!/record_status.*historical_non_authoritative/i.test(historicalReview)
  || /implementation_authority:\s*(?!`?none)/i.test(historicalReview)) fail('planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md', 'KROAD-012R is not historical and non-authoritative');
if (!/\*\*Status:\*\* proposed/.test(executionPlan)
  || /Coverage Execution Program — Active/.test(executionPlan)
  || /replaces KROAD-012 through KROAD-018/.test(executionPlan)) fail('planning/KERNEL_EXECUTION_PLAN.md', 'Coverage overlay became active or superseded KROAD');
if (!agents.includes(`The active governance carrier is \`${PLAN_ID}\`, \`BATCH_B\``)
  || agents.includes('The active governance carrier is `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`')) fail('AGENTS.md', 'active agent boundary is stale or not V3 Batch B');
if (!readme.includes(`The active plan is \`${PLAN_ID}\``)
  || !readme.includes('registered_planned_task')) fail('README.md', 'V3 or registration-only public status is missing');

let program = null;
try { program = JSON.parse(programText); } catch (error) { fail('planning/recovery/recovery-execution-program.v1.json', `invalid JSON: ${error.message}`); }
const expectedGraph = new Map([
  ['KREC-001', []], ['KREC-002', ['KREC-001']], ['KREC-003', ['KREC-001', 'KREC-002']], ['KREC-004', ['KREC-001']],
  ['KREC-005', ['KREC-002', 'KREC-003', 'KREC-004']], ['KREC-006', ['KREC-003', 'KREC-004', 'KREC-005']],
  ['KREC-007', ['KREC-005', 'KREC-006']], ['KREC-008', ['KREC-002', 'KREC-007']], ['KREC-009', ['KREC-003', 'KREC-006', 'KREC-007', 'KREC-008']],
]);
if (program) {
  if (program.program_id !== 'DCOV-COVERAGE-EXECUTION-PROGRAM'
    || program.integration_model !== 'distinct_recovery_execution_program'
    || program.program_status !== 'registered_non_active'
    || program.kroad_012r_status !== 'historical_non_authoritative'
    || program.kroad_supersession_effect !== 'none'
    || program.coverage_promotion_effect !== 'none'
    || program.task_activation_effect !== 'none'
    || program.product_effect !== 'none') fail('planning/recovery/recovery-execution-program.v1.json', 'program effects are not registration-only');
  const tasks = new Map((program.tasks || []).map((task) => [task.task_id, task]));
  if (tasks.size !== 9) fail('planning/recovery/recovery-execution-program.v1.json', 'exactly nine KREC tasks are required');
  for (const [id, dependencies] of expectedGraph) {
    const task = tasks.get(id);
    if (!task
      || task.status !== 'registered_planned_task'
      || task.implementation_authorized !== false
      || task.coverage_credit !== false
      || task.readiness_claim !== false
      || JSON.stringify(task.depends_on) !== JSON.stringify(dependencies)) fail('planning/recovery/recovery-execution-program.v1.json', `${id} registration or dependency graph mismatch`);
  }
}

let scope = null;
try { scope = JSON.parse(scopeText); } catch (error) { fail('planning/governance/scopes/aigov-v3-batch-b.scope.json', `invalid JSON: ${error.message}`); }
if (scope && (scope.plan_id !== PLAN_ID || scope.batch_id !== 'BATCH_B' || scope.base_sha !== BASE_SHA || scope.repository !== 'rezahh107/EV4-Decision-Kernel')) fail('planning/governance/scopes/aigov-v3-batch-b.scope.json', 'scope identity mismatch');
let impact = null;
try { impact = JSON.parse(impactText); } catch (error) { fail(impactPath, `invalid JSON: ${error.message}`); }
if (impact && (impact.impact_id !== 'coverage-impact.dcov-exec-001.pr50-aigov-v3-batch-b'
  || impact.pull_request !== 50
  || impact.previous_impact_id !== 'coverage-impact.dcov-exec-001.pr49-aigov-v2-batch-a'
  || impact.coverage_state_before !== 'not_measurable'
  || impact.coverage_state_after !== 'not_measurable'
  || impact.element_coverage_delta !== null
  || impact.question_coverage_delta !== null
  || impact.zero_delta !== true)) fail(impactPath, 'Coverage impact is not the ordered zero-effect PR #50 record');

if (!/raw_source_sha256:\s*"30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757"/.test(ssotManifest)) fail('docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md', 'audited SSOT digest marker changed');
const parts = [
  ['part-001-01.b64','548b94eceb853d87fb8387b8ba1b96464bd495a6eb6654559d2f50cdfbfabd3a'],['part-001-02.b64','9f99aa4b9d951e76eec4694f8a3c2c917e5b377b0b1dfa5372e07b9533f9920d'],['part-001-03.b64','020b5f2a6a0d8b757307530278301e1720bb4cbbcef335e85826c5f889222979'],['part-001-04.b64','c2a19c5357790034a9fca86402cda76ed577917396ac2ad731cdbb2714f6d125'],['part-001-05.b64','53e471edeb4a696561009a2245002b8439084ad560b57a969cda49e253de484c'],['part-001-06.b64','eeaef0e374959cb2b9a0d2d138f511008d66f0c740c2b20240050db57c1370de'],
  ['part-002.b64','cc3b95570207848f4fcbbc0fe6bd912638619efae0c67acdeb89b6af13ec0c2a'],['part-003.b64','e8d42957e7665dc3c1db4c364b7dd242e13e545a31cc6124b34ad28e0284fcd5'],['part-004.b64','1701611223e4561456569b09a517751c03a48fb487685387fad50e1da2df7c26'],['part-005-01.b64','2e7145e45488ba7da40a7c3c486c317d024ba611d51c1efab7fb34dbd8995dbd'],['part-005-02.b64','6ad0b4c65345e217eaa7942a74662e0b833b37c45ebe8971554ed1467a7a647f'],['part-005-03.b64','313b891ce7d4101f4158a3920fc7070394958eeba4a35a7de1b93592a8e8a70d'],['part-005-04.b64','7b74515dafb67d9b76ac2ee6b5203cdb4332851f91ce1f72eaf14312794c7e00'],['part-005-05.b64','5e8f923d78729eaf0f19cfe7a3a9615644dafe65c0ec35cdc851d524fcbe4adf'],['part-005-06.b64','b6458ca06b7b87186275657480c909c6c8e9793b5a60e423acbbbda20da9942e'],['part-006.b64','f578e37ca4b9e29fb8505eba97c4d357a6510b7afd2a0ecdbebf0032c060bf43'],['part-007.b64','ef29003748aee9069ce3975a5abcc313bc63fd84d61a9b714609fcf18a2dd9ab'],['part-008.b64','8bf646b1cae69fe7a7780d92ec5a23f13eeebf82cbe20f85c6cb52e890d4b55c'],
];
const encoded = [];
for (const [name, expected] of parts) {
  const file = `docs/governance/ssot-v1.1.0-payload/${name}`;
  const value = read(file).trim();
  const digest = crypto.createHash('sha256').update(value, 'utf8').digest('hex');
  if (digest !== expected) fail(file, `payload part digest mismatch: ${digest}`);
  encoded.push(value);
}
try {
  const joined = encoded.join('');
  if (joined.length !== 42288) fail('docs/governance/ssot-v1.1.0-payload/', `encoded length mismatch: ${joined.length}`);
  const source = zlib.gunzipSync(Buffer.from(joined, 'base64'));
  const digest = crypto.createHash('sha256').update(source).digest('hex');
  if (source.length !== 101922 || digest !== '30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757') fail('docs/governance/ssot-v1.1.0-payload/', `reconstructed identity mismatch: size=${source.length}, sha256=${digest}`);
} catch (error) {
  fail('docs/governance/ssot-v1.1.0-payload/', `reconstruction failed: ${error.message}`);
}

if (failures.length) {
  console.error('Roadmap memory V3 validation failed:');
  for (const item of failures) console.error(`\n${item.file}\n  Problem: ${item.problem}`);
  process.exit(1);
}
console.log('Roadmap memory V3 validation passed.');
