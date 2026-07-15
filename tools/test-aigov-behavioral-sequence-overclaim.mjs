#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const source = readFileSync('docs/governance/BEHAVIORAL_RULE_COVERAGE.md', 'utf8');
const marker = '| `AIGOV-PR-INSPECTOR-MINIMUM-001` |';
const line = source.split('\n').find((item) => item.startsWith(marker));
if (!line) throw new Error('AIGOV minimum-security Behavioral Rule Coverage row is missing.');
const temp = mkdtempSync(path.join(os.tmpdir(), 'aigov-brc-overclaim-'));
try {
  const honest = path.join(temp, 'honest.md');
  const overclaim = path.join(temp, 'overclaim.md');
  writeFileSync(honest, source);
  writeFileSync(overclaim, source.replace(line, line.replace('| `fixture_tested` |', '| `sequence_ci_enforced` |')));
  execFileSync(process.execPath, ['tools/audit-behavioral-coverage.mjs', '--mode', 'strict', '--rule-prefix', 'AIGOV-', '--source', honest, '--no-write'], { stdio: 'pipe' });
  const rejected = spawnSync(process.execPath, ['tools/audit-behavioral-coverage.mjs', '--mode', 'strict', '--rule-prefix', 'AIGOV-', '--source', overclaim, '--no-write'], { encoding: 'utf8' });
  const output = `${rejected.stdout || ''}${rejected.stderr || ''}`;
  const pass = rejected.status !== 0 && output.includes('pr_inspector_minimum_sequence_capability_overclaimed');
  console.log(JSON.stringify({ suite: 'aigov-behavioral-sequence-overclaim', status: pass ? 'pass' : 'fail', rejected_exit_code: rejected.status, output_sha256_present: output.length > 0 }, null, 2));
  if (!pass) process.exitCode = 1;
} finally {
  rmSync(temp, { recursive: true, force: true });
}
