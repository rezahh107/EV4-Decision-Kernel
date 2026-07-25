#!/usr/bin/env node
import { execFileSync, spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdtempSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const LEGACY_FIXTURE_BASE_SHA = '4fe332847e6867fc6aa4639a94a88b8177d31970';
const LEDGER_PATH = 'planning/recovery/recovery-ledger.v1.json';
const temporaryRoot = mkdtempSync(join(tmpdir(), 'ev4-recovery-legacy-lifecycle-'));
const worktree = join(temporaryRoot, 'repo');

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'ignore',
  });
}

let worktreeCreated = false;
try {
  git(['worktree', 'add', '--detach', worktree, 'HEAD']);
  worktreeCreated = true;
  const historicalLedger = git(
    ['show', `${LEGACY_FIXTURE_BASE_SHA}:${LEDGER_PATH}`],
    { capture: true },
  );
  writeFileSync(join(worktree, LEDGER_PATH), historicalLedger, 'utf8');

  const sourceModules = join(ROOT, 'node_modules');
  const worktreeModules = join(worktree, 'node_modules');
  if (existsSync(sourceModules) && !existsSync(worktreeModules)) {
    symlinkSync(sourceModules, worktreeModules, process.platform === 'win32' ? 'junction' : 'dir');
  }

  const execution = spawnSync(process.execPath, ['tools/test-recovery-ledger-lifecycle.mjs'], {
    cwd: worktree,
    env: { ...process.env },
    encoding: 'utf8',
    maxBuffer: 64 * 1024 * 1024,
    windowsHide: true,
    shell: false,
  });
  if (execution.stdout) process.stdout.write(execution.stdout);
  if (execution.stderr) process.stderr.write(execution.stderr);
  if (execution.error) throw execution.error;
  process.exitCode = execution.status ?? 1;
} finally {
  if (worktreeCreated) {
    try { git(['worktree', 'remove', '--force', worktree]); } catch { /* cleanup below */ }
  }
  rmSync(temporaryRoot, { recursive: true, force: true });
}
