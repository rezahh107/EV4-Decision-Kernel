#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BASE_SHA = '5ff5d7b20db11af36ab787eb8ac2d1127ea74644';
const TEMPLATE_PATH = 'planning/governance/evidence/aigov-v2-batch-a.evidence.json';
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';

function parseArgs(argv) {
  const result = { head: null, output: 'artifacts/aigov-batch-a-executed-evidence.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--head') result.head = argv[++index];
    else if (argv[index] === '--output') result.output = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.head || '')) throw new Error('--head must be an exact 40-character SHA.');
  return result;
}

const checks = (head) => [
  ['git-diff-check', 'git', ['diff', '--check', `${BASE_SHA}..${head}`]],
  ['syntax-validator', process.execPath, ['--check', 'kernel/validator/validate-aigov-governance.mjs']],
  ['syntax-exact-main', process.execPath, ['--check', 'tools/verify-aigov-exact-main.mjs']],
  ['exact-scope-disclosure', 'npm', ['run', 'aigov:scope-disclosure', '--', '--base', BASE_SHA, '--head', head, '--output', 'artifacts/aigov-batch-a-scope-disclosure.json']],
  ['aigov-validator', 'npm', ['run', 'validate:aigov']],
  ['aigov-fixtures', 'npm', ['run', 'test:aigov-fixtures']],
  ['aigov-sequence-replay', 'npm', ['run', 'test:aigov-sequence']],
  ['aigov-forged-provenance', 'npm', ['run', 'test:aigov-provenance']],
  ['aigov-review-directory', 'npm', ['run', 'test:aigov-review-directory']],
  ['aigov-ci-identity', 'npm', ['run', 'test:aigov-ci-identity']],
  ['aigov-owner-evidence', 'npm', ['run', 'test:aigov-owner-evidence']],
  ['aigov-forbidden-operations', 'npm', ['run', 'test:aigov-forbidden-operations']],
  ['behavioral-aigov', 'npm', ['run', 'validate:behavioral-coverage:aigov:strict']],
  ['roadmap-memory', 'npm', ['run', 'validate:roadmap-memory']],
  ['coverage-regression', 'npm', ['run', 'validate:coverage']],
  ['mvk-regression', 'npm', ['run', 'validate:mvk']],
  ['kroad010-history-fail-closed', 'npm', ['run', 'test:kroad-010-history-matrix-fail-closed']],
  ['kroad010-prototype', process.execPath, ['tools/validate-kroad-010-prototype-integrity.mjs']],
  ['kroad010-history', 'npm', ['run', 'validate:kroad-010-history-matrix']],
];

function run(command, args) {
  const result = spawnSync(command, args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
  const output = `${result.stdout || ''}${result.stderr || ''}`;
  return {
    status: result.status === 0 ? 'passed' : 'failed',
    exitCode: result.status ?? 1,
    sha256: crypto.createHash('sha256').update(output).digest('hex'),
    output,
  };
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const actualHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (actualHead !== args.head) throw new Error(`AIGOV_HEAD_MISMATCH: expected ${args.head}, observed ${actualHead}`);
  const scope = JSON.parse(readFileSync(path.join(ROOT, SCOPE_PATH), 'utf8'));
  const manifest = JSON.parse(readFileSync(path.join(ROOT, TEMPLATE_PATH), 'utf8'));
  mkdirSync(path.join(ROOT, 'artifacts'), { recursive: true });
  mkdirSync(path.join(ROOT, 'artifacts/aigov-command-logs'), { recursive: true });
  manifest.manifest_state = 'executed_exact_head';
  manifest.head_sha = args.head;
  manifest.generated_at = new Date().toISOString();
  for (const item of manifest.evidence_items) {
    item.head_sha = args.head;
    item.scope_revision = scope.scope_revision;
  }
  const results = [];
  for (const [evidenceId, command, commandArgs] of checks(args.head)) {
    const result = run(command, commandArgs);
    const item = manifest.evidence_items.find((candidate) => candidate.evidence_id === evidenceId);
    if (!item) throw new Error(`Evidence template is missing ${evidenceId}.`);
    item.status = result.status;
    item.sha256 = result.sha256;
    const logPath = `artifacts/aigov-command-logs/${evidenceId}.log`;
    writeFileSync(path.join(ROOT, logPath), result.output);
    item.authoritative_reference = `local-file:${logPath}`;
    results.push({ evidence_id: evidenceId, command: [command, ...commandArgs].join(' '), exit_code: result.exitCode, sha256: result.sha256, filename: logPath, hash_scope: 'final_file_bytes' });
    process.stdout.write(`${evidenceId}: ${result.status} (exit ${result.exitCode})\n`);
  }
  manifest.verification_budget.executed_checks = results.length;
  const outputPath = path.resolve(ROOT, args.output);
  mkdirSync(path.dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
  const validation = run('npm', ['run', 'validate:aigov', '--', '--evidence-manifest', args.output, '--expected-head', args.head, '--require-executed-budget']);
  process.stdout.write(`executed-evidence-semantic-validation: ${validation.status} (exit ${validation.exitCode})\n`);
  const { output: validationOutput, ...semanticValidation } = validation;
  void validationOutput;
  const report = { head_sha: args.head, scope_revision: scope.scope_revision, output: args.output, checks: results, semantic_validation: semanticValidation };
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  if (results.some((result) => result.exit_code !== 0) || validation.exitCode !== 0) process.exitCode = 1;
}

main();
