#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const OWNER = 'rezahh107';
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';

function git(args) {
  return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}

function parseArgs(argv) {
  const result = { batch: null, expectedSha: null, mergeActor: null, reviewReceipt: null, output: null };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--batch') result.batch = argv[++index];
    else if (arg === '--expected-sha') result.expectedSha = argv[++index];
    else if (arg === '--merge-actor') result.mergeActor = argv[++index];
    else if (arg === '--review-receipt') result.reviewReceipt = argv[++index];
    else if (arg === '--output') result.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!result.batch || !result.expectedSha || !result.mergeActor || !result.reviewReceipt) {
    throw new Error('--batch, --expected-sha, --merge-actor and --review-receipt are required.');
  }
  return result;
}

function run(command, args) {
  try {
    const output = execFileSync(command, args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { command: [command, ...args].join(' '), exit_code: 0, sha256: crypto.createHash('sha256').update(output).digest('hex') };
  } catch (error) {
    return { command: [command, ...args].join(' '), exit_code: error.status ?? 1, sha256: null };
  }
}

function isAncestor(ancestor, descendant) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], { cwd: ROOT, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const head = git(['rev-parse', 'HEAD']);
  const branch = process.env.GITHUB_REF_NAME || git(['branch', '--show-current']);
  const scope = JSON.parse(readFileSync(path.join(ROOT, SCOPE_PATH), 'utf8'));
  const diagnostics = [];
  if (args.batch !== 'BATCH_A') diagnostics.push('AIGOV_BATCH_UNSUPPORTED');
  if (branch !== 'main') diagnostics.push('AIGOV_EXACT_MAIN_REQUIRED');
  if (head !== args.expectedSha) diagnostics.push('AIGOV_HEAD_MISMATCH');
  if (args.mergeActor !== OWNER) diagnostics.push('AIGOV_OWNER_MERGE_REQUIRED');
  if (!existsSync(path.join(ROOT, args.reviewReceipt))) diagnostics.push('AIGOV_REVIEW_RECEIPT_MISSING');
  else {
    const review = JSON.parse(readFileSync(path.join(ROOT, args.reviewReceipt), 'utf8'));
    if (review.verdict !== 'GREEN_MERGE_RECOMMENDED') diagnostics.push('AIGOV_REVIEW_NOT_GREEN');
    if (review.scope_revision !== scope.scope_revision) diagnostics.push('AIGOV_REVIEW_STALE_SCOPE');
    if (!review.reviewer?.independent || review.reviewer?.identity === review.implementer?.identity) diagnostics.push('AIGOV_REVIEW_NOT_INDEPENDENT');
    if (!isAncestor(review.head_sha, head)) diagnostics.push('AIGOV_REVIEW_STALE_HEAD');
  }
  const checks = diagnostics.length ? [] : [
    run('npm', ['run', 'validate:aigov']),
    run('npm', ['run', 'test:aigov-sequence']),
    run('npm', ['run', 'validate:roadmap-memory']),
    run('npm', ['run', 'validate:coverage']),
    run('npm', ['run', 'validate:mvk']),
  ];
  if (checks.some((check) => check.exit_code !== 0)) diagnostics.push('AIGOV_EXACT_MAIN_MATRIX_RED');
  const receipt = {
    schema_version: 'aigov-exact-main-receipt.v1',
    plan_id: scope.plan_id,
    batch_id: args.batch,
    repository: scope.repository,
    main_sha: head,
    merge_actor: args.mergeActor,
    reviewed_head_sha: existsSync(path.join(ROOT, args.reviewReceipt)) ? JSON.parse(readFileSync(path.join(ROOT, args.reviewReceipt), 'utf8')).head_sha : null,
    scope_revision: scope.scope_revision,
    checks,
    coverage_status: 'not_measurable_pending_external_promotion',
    kroad_012r_status: 'historical_non_authoritative',
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostics,
  };
  const output = `${JSON.stringify(receipt, null, 2)}\n`;
  if (args.output) writeFileSync(path.join(ROOT, args.output), output);
  process.stdout.write(output);
  if (diagnostics.length) process.exitCode = 1;
}

main();
