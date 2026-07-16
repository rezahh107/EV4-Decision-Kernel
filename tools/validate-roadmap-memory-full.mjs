import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const V3_PLAN = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3';
const V3_BASE = '86e25a9073df7e257ca7df799de85baf9b3fafb0';
const PART_PATHS = [
  'part-001-01.b64','part-001-02.b64','part-001-03.b64','part-001-04.b64','part-001-05.b64','part-001-06.b64',
  'part-002.b64','part-003.b64','part-004.b64','part-005-01.b64','part-005-02.b64','part-005-03.b64',
  'part-005-04.b64','part-005-05.b64','part-005-06.b64','part-006.b64','part-007.b64','part-008.b64',
].map((name) => `docs/governance/ssot-v1.1.0-payload/${name}`);
const PART_HASHES = [
  '548b94eceb853d87fb8387b8ba1b96464bd495a6eb6654559d2f50cdfbfabd3a',
  '9f99aa4b9d951e76eec4694f8a3c2c917e5b377b0b1dfa5372e07b9533f9920d',
  '020b5f2a6a0d8b757307530278301e1720bb4cbbcef335e85826c5f889222979',
  'c2a19c5357790034a9fca86402cda76ed577917396ac2ad731cdbb2714f6d125',
  '53e471edeb4a696561009a2245002b8439084ad560b57a969cda49e253de484c',
  'eeaef0e374959cb2b9a0d2d138f511008d66f0c740c2b20240050db57c1370de',
  'cc3b95570207848f4fcbbc0fe6bd912638619efae0c67acdeb89b6af13ec0c2a',
  'e8d42957e7665dc3c1db4c364b7dd242e13e545a31cc6124b34ad28e0284fcd5',
  '1701611223e4561456569b09a517751c03a48fb487685387fad50e1da2df7c26',
  '2e7145e45488ba7da40a7c3c486c317d024ba611d51c1efab7fb34dbd8995dbd',
  '6ad0b4c65345e217eaa7942a74662e0b833b37c45ebe8971554ed1467a7a647f',
  '313b891ce7d4101f4158a3920fc7070394958eeba4a35a7de1b93592a8e8a70d',
  '7b74515dafb67d9b76ac2ee6b5203cdb4332851f91ce1f72eaf14312794c7e00',
  '5e8f923d78729eaf0f19cfe7a3a9615644dafe65c0ec35cdc851d524fcbe4adf',
  'b6458ca06b7b87186275657480c909c6c8e9793b5a60e423acbbbda20da9942e',
  'f578e37ca4b9e29fb8505eba97c4d357a6510b7afd2a0ecdbebf0032c060bf43',
  'ef29003748aee9069ce3975a5abcc313bc63fd84d61a9b714609fcf18a2dd9ab',
  '8bf646b1cae69fe7a7780d92ec5a23f13eeebf82cbe20f85c6cb52e890d4b55c',
];
const REQUIRED = [
  'planning/NEXT_WORK.md',
  'planning/KERNEL_EXECUTION_PLAN.md',
  'planning/decisions/AIGOV_ADOPTION_DECISION.md',
  'planning/reviews/AIGOV_ADOPTION_AUDIT.md',
  'planning/reviews/AIGOV_BATCH_A_V3_POST_MERGE_RECONCILIATION.md',
  'docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md',
  'docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md',
  'planning/recovery/recovery-execution-program.v1.json',
  'kernel/schemas/recovery-execution-program.v1.schema.json',
  'AGENTS.md',
  ...PART_PATHS,
];
const failures = [];
const fail = (file, problem) => failures.push({ file, problem });
const read = (file) => {
  const target = path.join(ROOT, file);
  if (!fs.existsSync(target)) { fail(file, 'required file is missing'); return ''; }
  return fs.readFileSync(target, 'utf8');
};
const files = Object.fromEntries(REQUIRED.map((file) => [file, read(file)]));
const section = (text, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^## ${escaped}\\s*$`, 'm').exec(text);
  if (!match) return '';
  const rest = text.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
};

function validateSsotPayload() {
  const encoded = PART_PATHS.map((file, index) => {
    const value = files[file].trim();
    const digest = crypto.createHash('sha256').update(value, 'utf8').digest('hex');
    if (digest !== PART_HASHES[index]) fail(file, `SSOT payload part digest mismatch: ${digest}`);
    return value;
  }).join('');
  if (encoded.length !== 42288) fail('docs/governance/ssot-v1.1.0-payload/', `encoded length mismatch: ${encoded.length}`);
  try {
    const source = zlib.gunzipSync(Buffer.from(encoded, 'base64')).toString('utf8');
    const digest = crypto.createHash('sha256').update(source).digest('hex');
    if (source.length !== 101922 || digest !== '30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757') {
      fail('docs/governance/ssot-v1.1.0-payload/', `reconstructed identity mismatch size=${source.length} sha256=${digest}`);
    }
  } catch (error) { fail('docs/governance/ssot-v1.1.0-payload/', `reconstruction failed: ${error.message}`); }
}

function validateCurrentStatus() {
  const next = files['planning/NEXT_WORK.md'];
  const decision = files['planning/decisions/AIGOV_ADOPTION_DECISION.md'];
  const audit = files['planning/reviews/AIGOV_ADOPTION_AUDIT.md'];
  const protocol = files['docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md'];
  if (!/^## Status Authority\s*$/m.test(next) || !/authoritative current-status dashboard/i.test(next)) fail('planning/NEXT_WORK.md', 'status authority is missing');
  const current = section(next, 'Next Task');
  const open = [...current.matchAll(/^- \[ \] ((?:KROAD|DCOV-EXEC|AIGOV-ADOPT)-\d{3})\s+—/gm)];
  if (open.length !== 1 || open[0][1] !== 'AIGOV-ADOPT-008') fail('planning/NEXT_WORK.md', 'AIGOV-ADOPT-008 must be the only current task');
  for (const token of [
    'repository_adoption_status: pending_batch_b_exact_main_completion',
    'BATCH_A: exact_main_reconciled_under_v3_exception',
    'AIGOV-ADOPT-000_through_007: merged_and_post_merge_reconciled',
    'status: implemented_pending_exact_head_validation_and_review',
    'KREC-001_through_009: registered_planned_task',
    'KROAD-012: next_product_task_blocked_pending_final_aigov_closure',
    'KROAD-013_through_018: not_started',
    'KROAD-012R: historical_non_authoritative',
    'status: not_measurable_pending_external_promotion',
    'coverage_promotion_effect: none',
    'product_effect: none',
  ]) if (!next.includes(token)) fail('planning/NEXT_WORK.md', `required V3 status missing: ${token}`);
  if (!decision.includes(`plan_id: ${V3_PLAN}`) || !decision.includes(`audit_base_sha: ${V3_BASE}`) || !decision.includes('previous_plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2')) fail('planning/decisions/AIGOV_ADOPTION_DECISION.md', 'V3 identity is not exact');
  if (!decision.includes('reusable: false') || !decision.includes('historical_independent_green_receipt: not_claimed')) fail('planning/decisions/AIGOV_ADOPTION_DECISION.md', 'one-time exception boundary is incomplete');
  if (!audit.includes('impossible_retrospective_review_cycle') || !audit.includes('No historical independent Green receipt is claimed')) fail('planning/reviews/AIGOV_ADOPTION_AUDIT.md', 'contradiction or no-fabrication statement missing');
  if (!protocol.includes('No second independent review after Merge is required') && !protocol.includes('second independent review after Merge is neither required')) fail('docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md', 'post-Merge review deadlock was not removed');
}

function validateRecoveryProgram() {
  let program;
  try { program = JSON.parse(files['planning/recovery/recovery-execution-program.v1.json']); } catch (error) { fail('planning/recovery/recovery-execution-program.v1.json', error.message); return; }
  const expected = {
    'KREC-001': [], 'KREC-002': ['KREC-001'], 'KREC-003': ['KREC-001','KREC-002'], 'KREC-004': ['KREC-001'],
    'KREC-005': ['KREC-002','KREC-003','KREC-004'], 'KREC-006': ['KREC-003','KREC-004','KREC-005'],
    'KREC-007': ['KREC-005','KREC-006'], 'KREC-008': ['KREC-002','KREC-007'],
    'KREC-009': ['KREC-003','KREC-006','KREC-007','KREC-008'],
  };
  if (program.program_id !== 'DCOV-COVERAGE-EXECUTION-PROGRAM' || program.integration_model !== 'distinct_recovery_execution_program' || program.program_status !== 'registered_non_active') fail('planning/recovery/recovery-execution-program.v1.json', 'program identity or non-active state mismatch');
  if (program.coverage_promotion_effect !== 'none' || program.task_activation_effect !== 'none' || program.kroad_012r_status !== 'historical_non_authoritative') fail('planning/recovery/recovery-execution-program.v1.json', 'authority boundary mismatch');
  const tasks = new Map((program.tasks || []).map((task) => [task.task_id, task]));
  for (const [id, deps] of Object.entries(expected)) {
    const task = tasks.get(id);
    if (!task || task.status !== 'registered_planned_task' || JSON.stringify(task.depends_on) !== JSON.stringify(deps)) fail('planning/recovery/recovery-execution-program.v1.json', `${id} registration or dependencies mismatch`);
  }
  if (tasks.size !== 9) fail('planning/recovery/recovery-execution-program.v1.json', 'task set must contain exactly KREC-001 through KREC-009');
}

function validatePreservation() {
  const next = files['planning/NEXT_WORK.md'];
  const plan = files['planning/KERNEL_EXECUTION_PLAN.md'];
  const coverage = section(next, 'Current PR');
  if (!/DCOV-EXEC-001/.test(coverage) || !/blocked_pending_external_governance_approval/.test(coverage)) fail('planning/NEXT_WORK.md', 'Coverage proposal is not fail-closed');
  if (/superseded_by_coverage_execution_program/.test(next) || /replaces KROAD-012 through KROAD-018/.test(next)) fail('planning/NEXT_WORK.md', 'KROAD items were superseded');
  if (!/\*\*Status:\*\* proposed/.test(plan) || /Coverage Execution Program — Active/.test(plan)) fail('planning/KERNEL_EXECUTION_PLAN.md', 'Coverage overlay must remain proposed and non-executable');
  const completed = section(next, 'Completed');
  for (let id = 0; id <= 11; id += 1) {
    const token = `KROAD-${String(id).padStart(3, '0')}`;
    if (!new RegExp(`^- \\[x\\] ${token}\\s+—`, 'm').test(completed)) fail('planning/NEXT_WORK.md', `${token} completion evidence missing`);
  }
  for (const phrase of ['not complete on main until this PR is merged','expected post-merge state','becomes complete only after this PR merges','Pending PR']) {
    for (const line of next.split('\n')) if (line.toLowerCase().includes(phrase.toLowerCase()) && !/historical|history|legacy/i.test(line)) fail('planning/NEXT_WORK.md', `stale pre-Merge wording: ${phrase}`);
  }
}

validateSsotPayload();
validateCurrentStatus();
validateRecoveryProgram();
validatePreservation();

if (failures.length) {
  console.error('Roadmap memory validation failed:');
  for (const item of failures) console.error(`\n${item.file}\n  Problem: ${item.problem}`);
  process.exit(1);
}
console.log('Roadmap memory validation passed.');
