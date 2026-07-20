#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BOOTSTRAP = './tools/lib/recovery-completion-test-bootstrap.mjs';
const logPath = process.env.RECOVERY_SECURITY_LOG
  || join(tmpdir(), 'ev4-recovery-security-suite.log');

const suites = [
  { name: 'import test transport', args: ['-e', "import('./tools/lib/recovery-completion-test-transport.mjs')"] },
  { name: 'import test registry', args: ['-e', "import('./tools/lib/recovery-completion-test-registry.mjs')"] },
  { name: 'import test authority', args: ['-e', "import('./tools/lib/recovery-completion-test-authority.mjs')"] },
  { name: 'import test bootstrap', args: ['-e', "import('./tools/lib/recovery-completion-test-bootstrap.mjs')"] },
  { name: 'recovery ledger lifecycle', args: ['tools/test-recovery-ledger-lifecycle.mjs'] },
  { name: 'recovery completion intrinsics', args: ['tools/test-recovery-completion-intrinsics.mjs'] },
  { name: 'recovery completion transitive intrinsics', args: ['--import', BOOTSTRAP, 'tools/test-recovery-completion-transitive-intrinsics.mjs'] },
  { name: 'recovery completion Node transport and hash', args: ['--import', BOOTSTRAP, 'tools/test-recovery-completion-node-transport-and-hash.mjs'] },
  { name: 'recovery completion readable dependencies', args: ['--import', BOOTSTRAP, 'tools/test-recovery-completion-readable-dependencies.mjs'] },
  { name: 'recovery completion isolation boundary', args: ['--import', BOOTSTRAP, 'tools/test-recovery-completion-isolation-boundary.mjs'] },
  { name: 'recovery completion production fixture rejection', args: ['tools/test-recovery-completion-production-fixture-rejection.mjs'] },
];

writeFileSync(logPath, '', 'utf8');
const failures = [];
const diagnostics = [];
for (const suite of suites) {
  const heading = `\n=== ${suite.name} ===\n`;
  process.stdout.write(heading);
  appendFileSync(logPath, heading, 'utf8');
  const execution = spawnSync(process.execPath, suite.args, {
    cwd: ROOT,
    env: { ...process.env },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    shell: false,
  });
  if (execution.stdout) {
    process.stdout.write(execution.stdout);
    appendFileSync(logPath, execution.stdout, 'utf8');
  }
  if (execution.stderr) {
    process.stderr.write(execution.stderr);
    appendFileSync(logPath, execution.stderr, 'utf8');
  }
  const status = execution.error ? 1 : execution.status ?? 1;
  const statusLine = `\nSTATUS ${suite.name}: ${status}\n`;
  process.stdout.write(statusLine);
  appendFileSync(logPath, statusLine, 'utf8');
  const record = {
    name: suite.name,
    status,
    signal: execution.signal || null,
    error: execution.error?.message || null,
    stdout_tail: (execution.stdout || '').slice(-6000),
    stderr_tail: (execution.stderr || '').slice(-6000),
  };
  diagnostics.push(record);
  if (status !== 0) failures.push(record);
}
const summary = {
  suite: 'recovery-security-suite',
  total: suites.length,
  passed: suites.length - failures.length,
  failed: failures.length,
  failures,
  log_path: logPath,
};
process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
appendFileSync(logPath, `${JSON.stringify(summary, null, 2)}\n`, 'utf8');

const runnerTemp = process.env.RUNNER_TEMP;
if (runnerTemp) {
  const reportPath = join(runnerTemp, 'aigov-owner-policy-report.json');
  if (existsSync(reportPath)) {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'));
    report.temporary_recovery_suite_diagnostics = diagnostics;
    writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  }
}

if (failures.length) process.exitCode = 1;
