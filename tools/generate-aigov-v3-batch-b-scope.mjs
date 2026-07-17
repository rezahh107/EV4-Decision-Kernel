#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
const ROOT = process.cwd();
const DEFAULT_SCOPE = 'planning/governance/scopes/aigov-owner-policy-recovery-activation.scope.json';
function canonical(value) { return Array.isArray(value) ? value.map(canonical) : value && typeof value === 'object' ? Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])])) : value; }
function revision(scope) { const x = structuredClone(scope); delete x.scope_revision; return `sha256:${crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex')}`; }
function git(args) { return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trimEnd(); }
function args(argv) { const out = { base: null, head: null, output: null, scope: DEFAULT_SCOPE }; for (let i = 0; i < argv.length; i += 1) { const arg = argv[i]; if (arg === '--base') out.base = argv[++i]; else if (arg === '--head') out.head = argv[++i]; else if (arg === '--output') out.output = argv[++i]; else if (arg === '--scope') out.scope = argv[++i]; else throw new Error(`Unknown argument: ${arg}`); } if (!out.base || !out.head) throw new Error('--base and --head are required.'); return out; }
const input = args(process.argv.slice(2));
const scope = JSON.parse(readFileSync(path.resolve(ROOT, input.scope), 'utf8'));
const base = git(['rev-parse', input.base]); const head = git(['rev-parse', input.head]);
const changed = [...new Set(git(['diff', '--name-only', `${base}..${head}`]).split('\n').filter(Boolean))].sort();
const declared = [...scope.committed].sort(); const diagnostics = [];
if (base !== scope.base_sha) diagnostics.push({ code: 'AIGOV_SCOPE_BASE_MISMATCH', expected: scope.base_sha, observed: base });
const expectedRevision = revision(scope); if (scope.scope_revision !== expectedRevision) diagnostics.push({ code: 'AIGOV_SCOPE_REVISION_MISMATCH', expected: expectedRevision, observed: scope.scope_revision });
if (JSON.stringify(changed) !== JSON.stringify(declared)) diagnostics.push({ code: 'AIGOV_SCOPE_DISCLOSURE_MISMATCH', undeclared: changed.filter((x) => !declared.includes(x)), declared_but_unchanged: declared.filter((x) => !changed.includes(x)) });
const report = { schema_version: 'aigov-scope-disclosure.v1', repository: scope.repository, plan_id: scope.plan_id, batch_id: scope.batch_id, base_sha: base, head_sha: head, scope_revision: scope.scope_revision, committed: changed, excluded: scope.excluded, deferred_not_deleted: scope.deferred_not_deleted, status: diagnostics.length ? 'fail' : 'pass', diagnostics };
const output = `${JSON.stringify(report, null, 2)}\n`; if (input.output) writeFileSync(path.resolve(ROOT, input.output), output); process.stdout.write(output); if (diagnostics.length) process.exitCode = 1;
