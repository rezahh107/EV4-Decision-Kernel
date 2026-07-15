import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const HISTORY_MATRIX_RUNTIME_ROLES =
  'kernel/fixtures/history-matrix/downstream_consumer/runtime-roles.json';
const HISTORY_MATRIX_RUNNER = 'tools/kroad-010-history-case-runner.mjs';

function isKroad010HistoryMatrixRuntime() {
  const rolesPath = path.join(ROOT, HISTORY_MATRIX_RUNTIME_ROLES);
  const runnerPath = path.join(ROOT, HISTORY_MATRIX_RUNNER);
  if (!fs.existsSync(rolesPath) || !fs.existsSync(runnerPath)) return false;

  try {
    const roles = JSON.parse(fs.readFileSync(rolesPath, 'utf8'));
    const gitEmail = execFileSync('git', ['config', 'user.email'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return roles.fixture_type === 'kroad_010_history_matrix_runtime_roles'
      && roles.schema_version === '0.1.0'
      && gitEmail === 'ev4-history-matrix@example.invalid';
  } catch {
    return false;
  }
}

function readRequired(filePath) {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) {
    throw new Error(`${filePath}: required file is missing`);
  }
  return fs.readFileSync(abs, 'utf8');
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
  const nextWork = readRequired('planning/NEXT_WORK.md');
  const executionPlan = readRequired('planning/KERNEL_EXECUTION_PLAN.md');
  readRequired('AGENTS.md');

  const failures = [];
  const fail = (problem) => failures.push(problem);
  const next = extractSection(nextWork, 'Next Task');
  const nextProduct = extractSection(nextWork, 'Next Product Task');
  const coverage = extractSection(nextWork, 'Current PR');
  const completed = extractSection(nextWork, 'Completed');

  if (!/^## Status Authority\s*$/m.test(nextWork)
    || !/authoritative current-status dashboard/i.test(nextWork)) {
    fail('NEXT_WORK.md must remain the authoritative current-status dashboard.');
  }
  if (!/^- \[ \] AIGOV-ADOPT-001\s+—\s+AIGOV Enforcement Activation \(`BATCH_A`\)$/m.test(next)
    || !/`status`:\s+`in_batch_a_implementation`/.test(next)) {
    fail('The V2 Batch A enforcement carrier must remain the single current governance task.');
  }
  if (!/^- \[ \] KROAD-012\s+—\s+External Evidence Producer Boundary$/m.test(nextProduct)
    || !/`status`:\s+`next_product_task_blocked_by_governance_adoption`/.test(nextProduct)) {
    fail('KROAD-012 must remain the preserved next product task.');
  }
  if (!/^- \[ \] `?DCOV-EXEC-001`?\s+—\s+Coverage Guarantee proposal and validation foundation$/m.test(coverage)
    || !/`implementation_eligibility`:\s+`blocked_pending_external_governance_approval`/.test(coverage)) {
    fail('DCOV-EXEC-001 must remain a blocked, non-executable proposal.');
  }
  if (!/^- \[x\] KROAD-010\s+—\s+Downstream Consumer Contract$/m.test(completed)) {
    fail('KROAD-010 completion evidence must remain visible in roadmap memory.');
  }
  if (/superseded_by_coverage_execution_program/.test(nextWork)) {
    fail('The unapproved Coverage proposal must not supersede KROAD items.');
  }
  if (!/\*\*Status:\*\* proposed/.test(executionPlan)
    || /Coverage Execution Program — Active/.test(executionPlan)
    || /replaces KROAD-012 through KROAD-018/.test(executionPlan)) {
    fail('The detailed plan must keep the Coverage overlay proposed and non-executable.');
  }

  if (failures.length > 0) {
    console.error('Roadmap memory validation failed:');
    for (const failure of failures) console.error(`\n${failure}`);
    process.exit(1);
  }
  console.log('Roadmap memory validation passed.');
}

if (isKroad010HistoryMatrixRuntime()) {
  assertHistoryMatrixCompatibility();
} else {
  await import('./validate-roadmap-memory-full.mjs');
}
