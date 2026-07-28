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
const ACCEPTED_MVK_BLOB = '5f93a6c073c4459f421dc3dc3f4af75d36b42091';
const MVK_WORKFLOW = '.github/workflows/validate-mvk.yml';
const temporaryRoot = mkdtempSync(join(tmpdir(), 'ev4-recovery-node-transport-transition-'));
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
  const acceptedWorkflow = git(['cat-file', 'blob', ACCEPTED_MVK_BLOB], { capture: true });
  writeFileSync(join(worktree, MVK_WORKFLOW), acceptedWorkflow, 'utf8');

  const sourceModules = join(ROOT, 'node_modules');
  const worktreeModules = join(worktree, 'node_modules');
  if (existsSync(sourceModules) && !existsSync(worktreeModules)) {
    symlinkSync(sourceModules, worktreeModules, process.platform === 'win32' ? 'junction' : 'dir');
  }

  const execution = spawnSync(
    process.execPath,
    ['--import', './tools/lib/recovery-completion-test-bootstrap.mjs', 'tools/test-recovery-completion-node-transport-and-hash.mjs'],
    {
      cwd: worktree,
      env: { ...process.env },
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      windowsHide: true,
      shell: false,
    },
  );
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
