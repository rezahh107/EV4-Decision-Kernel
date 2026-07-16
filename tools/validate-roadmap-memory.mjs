import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HISTORY_MATRIX_RUNTIME_ROLES = 'kernel/fixtures/history-matrix/downstream_consumer/runtime-roles.json';
const HISTORY_MATRIX_RUNNER = 'tools/kroad-010-history-case-runner.mjs';
const NEXT_WORK = 'planning/NEXT_WORK.md';
const V4_PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4';
const V3_PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3';

function isKroad010HistoryMatrixRuntime() {
  const rolesPath = path.join(ROOT, HISTORY_MATRIX_RUNTIME_ROLES);
  const runnerPath = path.join(ROOT, HISTORY_MATRIX_RUNNER);
  if (!fs.existsSync(rolesPath) || !fs.existsSync(runnerPath)) return false;
  try {
    const roles = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
    const gitEmail = execFileSync('git', ['config', 'user.email'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
    return roles.fixture_type === 'kroad_010_history_matrix_runtime_roles' && roles.schema_version === '0.1.0' && gitEmail === 'ev4-history-matrix@example.invalid';
  } catch { return false; }
}
function readRequired(filePath) {
  const absolute = path.join(ROOT, filePath);
  if (!fs.existsSync(absolute)) throw new Error(`${filePath}: required file is missing`);
  return fs.readFileSync(absolute, 'utf8');
}
function extractSection(text, heading) {
  const escaped = heading.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = new RegExp(`^## ${escaped}\\s*$`, 'm').exec(text);
  if (!match) return '';
  const rest = text.slice(match.index + match[0].length);
  const next = /^##\s+/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}
function assertHistoryMatrixCompatibility() {
  const nextWork = readRequired(NEXT_WORK);
  const executionPlan = readRequired('planning/KERNEL_EXECUTION_PLAN.md');
  readRequired('AGENTS.md');
  const failures = [];
  const next = extractSection(nextWork, 'Next Task');
  const nextProduct = extractSection(nextWork, 'Next Product Task');
  const coverage = extractSection(nextWork, 'Current PR');
  const completed = extractSection(nextWork, 'Completed');
  if (!/^## Status Authority\s*$/m.test(nextWork) || !/authoritative current-status dashboard/i.test(nextWork)) failures.push('NEXT_WORK.md must remain the authoritative current-status dashboard.');
  if (nextWork.includes(V4_PLAN_ID) || nextWork.includes(V3_PLAN_ID)) {
    if (!/^- \[ \] AIGOV-ADOPT-008\s+—\s+Final AIGOV exact-main closure \(`BATCH_B`\)$/m.test(next)) failures.push('AIGOV-ADOPT-008 must remain the single current governance task.');
    if (!/^- \[ \] KROAD-012\s+—\s+External Evidence Producer Boundary$/m.test(nextProduct) || !/next_product_task_blocked_pending_final_aigov_closure/.test(nextProduct)) failures.push('KROAD-012 must remain preserved behind final AIGOV closure.');
  } else {
    if (!/^- \[ \] AIGOV-ADOPT-001\s+—\s+AIGOV Enforcement Activation \(`BATCH_A`\)$/m.test(next)) failures.push('The V2 Batch A enforcement carrier must remain the single current governance task.');
  }
  if (!/^- \[ \] `?DCOV-EXEC-001`?\s+—\s+Coverage Guarantee proposal and validation foundation$/m.test(coverage) || !/blocked_pending_external_governance_approval/.test(coverage)) failures.push('DCOV-EXEC-001 must remain blocked and non-executable.');
  if (!/^- \[x\] KROAD-010\s+—\s+Downstream Consumer Contract$/m.test(completed)) failures.push('KROAD-010 completion evidence must remain visible.');
  if (/superseded_by_coverage_execution_program/.test(nextWork)) failures.push('The unapproved Coverage proposal must not supersede KROAD items.');
  if (!/\*\*Status:\*\* proposed/.test(executionPlan) || /Coverage Execution Program — Active/.test(executionPlan) || /replaces KROAD-012 through KROAD-018/.test(executionPlan)) failures.push('The detailed plan must keep the Coverage overlay proposed and non-executable.');
  if (failures.length) {
    console.error('Roadmap memory validation failed:');
    for (const failure of failures) console.error(`\n${failure}`);
    process.exit(1);
  }
  console.log('Roadmap memory history-matrix compatibility passed.');
}

const nextWork = readRequired(NEXT_WORK);
if (isKroad010HistoryMatrixRuntime()) assertHistoryMatrixCompatibility();
else if (nextWork.includes(V4_PLAN_ID) || nextWork.includes(V3_PLAN_ID)) await import('./validate-roadmap-memory-v3.mjs');
else await import('./validate-roadmap-memory-full.mjs');
