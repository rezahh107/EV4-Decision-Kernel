#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = process.cwd();
const DEFAULT_SCOPE = 'planning/governance/scopes/aigov-owner-policy-recovery-activation.scope.json';
const LEGACY_KREC_SCOPE = 'planning/governance/scopes/krec-001-recovery-ledger.scope.json';
const TRANSITION_SCOPE = 'planning/governance/scopes/aigov-v2.6-transition.scope.json';
const NEXT_WORK = 'planning/NEXT_WORK.md';

const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const scopeRevision = (scope) => {
  const payload = structuredClone(scope);
  delete payload.scope_revision;
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(canonical(payload))).digest('hex')}`;
};

export function resolveOutputPath(value) {
  return path.isAbsolute(value)
    ? path.normalize(value)
    : path.resolve(ROOT, value);
}

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

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}
const listDiff = (args) => {
  const output = git(args);
  return output ? output.split('\n').filter(Boolean).sort() : [];
};
const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);

function currentWorkPackageId() {
  const text = fs.readFileSync(path.join(ROOT, NEXT_WORK), 'utf8');
  const matches = [...text.matchAll(/^current_work_package_id:\s*([A-Z0-9][A-Z0-9._-]*)\s*$/gm)];
  if (matches.length !== 1) {
    throw new Error('Expected exactly one current_work_package_id in planning/NEXT_WORK.md.');
  }
  return matches[0][1];
}

function resolveScopePath(requestedScope) {
  const current = currentWorkPackageId();
  if (current === 'KREC-001') {
    if (![LEGACY_KREC_SCOPE, DEFAULT_SCOPE].includes(requestedScope)) {
      throw new Error(`Scope ${requestedScope} does not match current work package KREC-001.`);
    }
    return requestedScope;
  }
  if (current === 'AIGOV26-TRANSITION-001') {
    if (![LEGACY_KREC_SCOPE, TRANSITION_SCOPE].includes(requestedScope)) {
      throw new Error(`Scope ${requestedScope} does not match current work package AIGOV26-TRANSITION-001.`);
    }
    return TRANSITION_SCOPE;
  }
  throw new Error(`Unsupported current_work_package_id: ${current}`);
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.base) throw new Error('--base is required');
  const resolvedScope = resolveScopePath(options.scope);
  const scope = JSON.parse(fs.readFileSync(path.join(ROOT, resolvedScope), 'utf8'));
  const expectedRevision = scopeRevision(scope);
  if (scope.scope_revision !== expectedRevision) {
    throw new Error(`AIGOV_SCOPE_REVISION_MISMATCH expected ${expectedRevision}`);
  }
  if (scope.base_sha !== options.base) {
    throw new Error(`AIGOV_SCOPE_BASE_MISMATCH expected ${scope.base_sha}`);
  }

  const resolvedBase = git(['rev-parse', options.base]);
  const resolvedHead = git(['rev-parse', options.head]);
  if (resolvedBase !== options.base) throw new Error('AIGOV_BASE_SHA_NOT_EXACT');
  if (!/^[0-9a-f]{40}$/.test(resolvedHead)) throw new Error('AIGOV_HEAD_SHA_INVALID');

  const changed = listDiff(['diff', '--name-only', `${options.base}..${resolvedHead}`]);
  const declared = [...scope.committed].sort();
  const deleted = listDiff(['diff', '--name-only', '--diff-filter=D', `${options.base}..${resolvedHead}`]);
  const diagnostics = [];
  if (!same(changed, declared)) diagnostics.push('AIGOV_SCOPE_DISCLOSURE_MISMATCH');
  if (deleted.length > 0) diagnostics.push('AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN');

  const report = {
    schema_version: 'aigov-scope-disclosure.v1',
    repository: scope.repository,
    plan_id: scope.plan_id,
    batch_id: scope.batch_id,
    base_sha: options.base,
    head_sha: resolvedHead,
    scope_revision: scope.scope_revision,
    scope_path: resolvedScope,
    committed: declared,
    observed_changed_paths: changed,
    excluded: scope.excluded,
    deferred_not_deleted: scope.deferred_not_deleted,
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostics,
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (options.output) fs.writeFileSync(resolveOutputPath(options.output), output);
  process.stdout.write(output);
  if (diagnostics.length) process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  try {
    main();
  } catch (error) {
    const report = {
      schema_version: 'aigov-scope-disclosure.v1',
      status: 'fail',
      diagnostics: [`AIGOV_SCOPE_INTERNAL_ERROR:${error.message}`],
    };
    const output = `${JSON.stringify(report, null, 2)}\n`;
    const index = process.argv.indexOf('--output');
    if (index >= 0 && process.argv[index + 1]) {
      fs.writeFileSync(resolveOutputPath(process.argv[index + 1]), output);
    }
    process.stderr.write(output);
    process.exitCode = 1;
  }
}
