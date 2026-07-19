#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

const result = spawnSync(
  process.execPath,
  ['tools/test-recovery-completion-node-transport-and-hash.mjs'],
  {
    encoding: 'utf8',
    env: process.env,
    maxBuffer: 16 * 1024 * 1024,
  },
);
const output = result.stdout || JSON.stringify({
  suite: 'recovery-completion-node-transport-and-hash',
  failed_to_produce_report: true,
  status: result.status,
  signal: result.signal,
  stderr: result.stderr,
}, null, 2);
if (process.env.RUNNER_TEMP) {
  writeFileSync(join(process.env.RUNNER_TEMP, 'aigov-owner-policy-report.json'), output);
}
process.stdout.write(output);
if (result.stderr) process.stderr.write(result.stderr);
process.exitCode = result.status ?? 1;
