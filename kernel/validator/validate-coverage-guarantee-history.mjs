#!/usr/bin/env node
import { execFileSync } from 'node:child_process';

const EXPECTED_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const ALLOWED_ORIGINS = new Set([
  'https://github.com/rezahh107/EV4-Decision-Kernel',
  'https://github.com/rezahh107/EV4-Decision-Kernel.git',
  'git@github.com:rezahh107/EV4-Decision-Kernel.git',
]);
const SHA40 = /^[0-9a-f]{40}$/;

function git(args, options = {}) {
  return execFileSync('git', args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    stdio: options.inherit ? 'inherit' : ['ignore', 'pipe', 'pipe'],
  })?.trim() || '';
}

function commitExists(sha) {
  try {
    git(['cat-file', '-e', `${sha}^{commit}`]);
    return true;
  } catch {
    return false;
  }
}

function fail(code, message) {
  console.error(`${code}: ${message}`);
  process.exit(1);
}

const repository = String(process.env.COVERAGE_REPOSITORY || '');
const baseSha = String(process.env.COVERAGE_BASE_SHA || '');
const headSha = String(process.env.COVERAGE_HEAD_SHA || '');

if (repository !== EXPECTED_REPOSITORY) {
  fail('COV_HISTORY_REPOSITORY_MISMATCH', 'Coverage history hydration is restricted to the protected target repository.');
}
if (!SHA40.test(baseSha) || !SHA40.test(headSha)) {
  fail('COV_HISTORY_IDENTITY_INVALID', 'Authoritative base and head must be immutable 40-hex SHAs.');
}

const origin = git(['remote', 'get-url', 'origin']);
if (!ALLOWED_ORIGINS.has(origin)) {
  fail('COV_HISTORY_ORIGIN_INVALID', `Unexpected origin remote: ${origin}`);
}

const checkedOutHead = git(['rev-parse', 'HEAD']);
if (checkedOutHead !== headSha) {
  fail('COV_HISTORY_HEAD_MISMATCH', 'Checked-out HEAD does not match the externally verified head.');
}

const shallow = git(['rev-parse', '--is-shallow-repository']) === 'true';
try {
  if (shallow) {
    git(['fetch', '--no-tags', '--prune', '--unshallow', 'origin'], { inherit: true });
  } else if (!commitExists(baseSha)) {
    git(['fetch', '--no-tags', '--depth=1', 'origin', baseSha], { inherit: true });
  }
} catch {
  fail('COV_HISTORY_FETCH_FAILED', 'Unable to hydrate authoritative Git history from the verified target origin.');
}

if (!commitExists(baseSha) || !commitExists(headSha)) {
  fail('COV_HISTORY_COMMIT_UNAVAILABLE', 'Authoritative base or head commit is unavailable after history hydration.');
}
try {
  git(['merge-base', '--is-ancestor', baseSha, headSha]);
} catch {
  fail('COV_HISTORY_BASE_NOT_ANCESTOR', 'Authoritative base is not an ancestor of the verified PR head.');
}
if (git(['rev-parse', 'HEAD']) !== headSha) {
  fail('COV_HISTORY_HEAD_CHANGED', 'History hydration changed the checked-out head.');
}
if (git(['status', '--porcelain=v1', '--untracked-files=all']) !== '') {
  fail('COV_HISTORY_WORKTREE_DIRTY', 'History hydration changed the worktree.');
}

console.log(JSON.stringify({
  history_hydrated: true,
  repository,
  base_sha: baseSha,
  head_sha: headSha,
  proof_credit_authorized: false,
}));
