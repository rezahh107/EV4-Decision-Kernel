import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
const NEXT_WORK = 'planning/NEXT_WORK.md';
function historyRuntime() { try { const roles = JSON.parse(fs.readFileSync('kernel/fixtures/history-matrix/downstream_consumer/runtime-roles.json', 'utf8')); const email = execFileSync('git', ['config', 'user.email'], { encoding: 'utf8', stdio: ['ignore','pipe','ignore'] }).trim(); return roles.fixture_type === 'kroad_010_history_matrix_runtime_roles' && email === 'ev4-history-matrix@example.invalid'; } catch { return false; } }
if (historyRuntime()) {
  const next = fs.readFileSync(NEXT_WORK, 'utf8'); const plan = fs.readFileSync('planning/KERNEL_EXECUTION_PLAN.md', 'utf8'); const failures=[];
  if (!/^- \[x\] KROAD-010 — Downstream Consumer Contract$/m.test(next)) failures.push('KROAD-010 completion evidence must remain visible.');
  if (!/KROAD-012.*preserved/s.test(next)) failures.push('KROAD-012 must remain preserved.');
  if (/superseded_by_coverage_execution_program/.test(next) || /replaces KROAD-012 through KROAD-018/.test(plan)) failures.push('Recovery must not supersede KROAD.');
  if (failures.length) { for (const failure of failures) console.error(failure); process.exit(1); }
  console.log('Roadmap memory history-matrix compatibility passed.');
} else if (fs.existsSync('planning/decisions/AIGOV_INDEPENDENT_REVIEW_POLICY_CHANGE.md')) await import('./validate-roadmap-memory-v4-owner-policy.mjs');
else if (fs.readFileSync(NEXT_WORK, 'utf8').includes('GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4')) await import('./validate-roadmap-memory-v3.mjs');
else await import('./validate-roadmap-memory-full.mjs');
