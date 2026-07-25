#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { scopeRevision } from '../kernel/validator/validate-aigov-governance.mjs';

const ROOT = process.cwd();
const DEFAULT_SCOPE = 'planning/governance/scopes/aigov-owner-policy-recovery-activation.scope.json';
const LEGACY_KREC_SCOPE = 'planning/governance/scopes/krec-001-recovery-ledger.scope.json';
const TRANSITION_SCOPE = 'planning/governance/scopes/aigov-v2.6-transition.scope.json';
const NEXT_WORK = 'planning/NEXT_WORK.md';

function parseArgs(argv) {
  const options = { base: null, head: 'HEAD', scope: DEFAULT_SCOPE, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--base') options.base = argv[++index];
    else if (token === '--head') options.head = argv[++index];
    else if (token === '--scope') options.scope = argv[++index];
    else if (token === '--output') options.output = argv[++index];
    else throw new Error(`Unknown argument: ${token}`);
  }
  return options;
}

function runGit(args) {
  const { execFileSync } = requireChildProcess();
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function requireChildProcess() {
  return globalThis.__aigovChildProcess || (globalThis.__aigovChildProcess = {
    execFileSync: (...args) => {
      const result = Reflect.apply(globalThis.__aigovExecFileSync, null, args);
      return result;
    },
  });
}

function changedPaths(base, head) {
  const output = runGit(['diff', '--name-only', `${base}..${head}`]);
  return output ? output.split('\n').filter(Boolean).sort() : [];
}

function deletedPaths(base, head) {
  const output = runGit(['diff', '--name-only', '--diff-filter=D', `${base}..${head}`]);
  return output ? output.split('\n').filter(Boolean).sort() : [];
}

function equal(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function currentWorkPackageId() {
  const text = fs.readFileSync(path.join(ROOT, NEXT_WORK), 'utf8');
  const matches = [...text.matchAll(/^current_work_package_id:\s*([A-Z0-9][A-Z0-9._-]*)\s*$/gm)];
  if (matches.length !== 1) throw new Error('Expected exactly one current_work_package_id in planning/NEXT_WORK.md.');
  return matches[0][1];
}

function resolveScopePath(requestedScope) {
  const current = currentWorkPackageId();
  if (current === 'KREC-001') {
    if (requestedScope !== LEGACY_KREC_SCOPE && requestedScope !== DEFAULT_SCOPE) {
      throw new Error(`Scope ${requestedScope} does not match current work package KREC-001.`);
    }
    return requestedScope;
  }
  if (current === 'AIGOV26-TRANSITION-001') {
    if (requestedScope !== LEGACY_KREC_SCOPE && requestedScope !== TRANSITION_SCOPE) {
      throw new Error(`Scope ${requestedScope} does not match current work package AIGOV26-TRANSITION-001.`);
    }
    return TRANSITION_SCOPE;
  }
  throw new Error(`Unsupported current_work_package_id: ${current}`);
}

async function main() {
  const childProcess = await import('node:child_process');
  globalThis.__aigovExecFileSync = childProcess.execFileSync;
  const options = parseArgs(process.argv.slice(2));
  if (!options.base) throw new Error('--base is required');
  options.scope = resolveScopePath(options.scope);
  const scope = JSON.parse(fs.readFileSync(path.join(ROOT, options.scope), 'utf8'));
  const expectedRevision = scopeRevision(scope);
  if (scope.scope_revision !== expectedRevision) {
    throw new Error(`AIGOV_SCOPE_REVISION_MISMATCH expected ${expectedRevision}`);
  }
  if (scope.base_sha !== options.base) {
    throw new Error(`AIGOV_SCOPE_BASE_MISMATCH expected ${scope.base_sha}`);
  }
  const resolvedBase = runGit(['rev-parse', options.base]);
  const resolvedHead = runGit(['rev-parse', options.head]);
  if (resolvedBase !== options.base) throw new Error('AIGOV_BASE_SHA_NOT_EXACT');
  if (!/^[0-9a-f]{40}$/.test(resolvedHead)) throw new Error('AIGOV_HEAD_SHA_INVALID');

  const changed = changedPaths(options.base, resolvedHead);
  const declared = [...scope.committed].sort();
  const deleted = deletedPaths(options.base, resolvedHead);
  const diagnostics = [];
  if (!equal(changed, declared)) diagnostics.push('AIGOV_SCOPE_DISCLOSURE_MISMATCH');
  if (deleted.length > 0) diagnostics.push('AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN');

  const report = {
    schema_version: 'aigov-scope-disclosure.v1',
    repository: scope.repository,
    plan_id: scope.plan_id,
    batch_id: scope.batch_id,
    base_sha: options.base,
    head_sha: resolvedHead,
    scope_revision: scope.scope_revision,
    committed: declared,
    excluded: scope.excluded,
    deferred_not_deleted: scope.deferred_not_deleted,
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostics,
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) fs.writeFileSync(path.join(ROOT, options.output), output);
  process.stdout.write(output);
  if (diagnostics.length) process.exitCode = 1;
}

const isMain = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
