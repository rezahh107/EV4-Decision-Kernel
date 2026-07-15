#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function scopeRevision(scope) {
  const projection = structuredClone(scope);
  delete projection.scope_revision;
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(canonical(projection))).digest('hex')}`;
}

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function parseArgs(argv) {
  const result = { base: null, head: null, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--base') result.base = argv[++index];
    else if (arg === '--head') result.head = argv[++index];
    else if (arg === '--output') result.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!result.base || !result.head) throw new Error('Both --base and --head are required.');
  return result;
}

function changedPaths(base, head) {
  const committed = git(['diff', '--name-only', `${base}..${head}`]).split('\n').filter(Boolean);
  if (head !== git(['rev-parse', 'HEAD'])) return [...new Set(committed)].sort();
  const status = git(['status', '--porcelain=v1', '--untracked-files=all']);
  const worktree = status.split('\n').filter(Boolean).map((line) => {
    const raw = line.slice(3);
    return raw.includes(' -> ') ? raw.split(' -> ').at(-1) : raw;
  });
  return [...new Set([...committed, ...worktree])].sort();
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = JSON.parse(readFileSync(path.join(ROOT, SCOPE_PATH), 'utf8'));
  const resolvedBase = git(['rev-parse', args.base]);
  const resolvedHead = git(['rev-parse', args.head]);
  const actualRevision = scopeRevision(scope);
  const actualPaths = changedPaths(resolvedBase, resolvedHead);
  const declaredPaths = [...scope.committed].sort();
  const diagnostics = [];
  if (resolvedBase !== scope.base_sha) diagnostics.push({ code: 'AIGOV_SCOPE_BASE_MISMATCH', expected: scope.base_sha, observed: resolvedBase });
  if (scope.scope_revision !== actualRevision) diagnostics.push({ code: 'AIGOV_SCOPE_REVISION_MISMATCH', expected: actualRevision, observed: scope.scope_revision });
  if (JSON.stringify(actualPaths) !== JSON.stringify(declaredPaths)) {
    diagnostics.push({
      code: 'AIGOV_SCOPE_DISCLOSURE_MISMATCH',
      undeclared: actualPaths.filter((item) => !declaredPaths.includes(item)),
      declared_but_unchanged: declaredPaths.filter((item) => !actualPaths.includes(item)),
    });
  }
  const disclosure = {
    schema_version: 'aigov-scope-disclosure.v1',
    repository: scope.repository,
    plan_id: scope.plan_id,
    batch_id: scope.batch_id,
    base_sha: resolvedBase,
    head_sha: resolvedHead,
    scope_revision: scope.scope_revision,
    committed: actualPaths,
    excluded: scope.excluded,
    deferred_not_deleted: scope.deferred_not_deleted,
    dependencies: scope.dependencies,
    completion_evidence: scope.completion_evidence,
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostics,
  };
  const output = `${JSON.stringify(disclosure, null, 2)}\n`;
  if (args.output) writeFileSync(path.join(ROOT, args.output), output);
  process.stdout.write(output);
  if (diagnostics.length) process.exitCode = 1;
}

main();
