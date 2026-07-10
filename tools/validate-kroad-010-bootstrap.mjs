#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {
  appendFileSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PRIMARY = 'kernel/validator/validate-downstream-consumer-contract.mjs';
const LOCK = 'kernel/validator/validate-downstream-consumer-canonical-lock.mjs';
const LINEAGE = 'kernel/validator/validate-downstream-consumer-lineage.mjs';
const PRIMARY_BASELINE = 'tools/validate-kroad-010-primary-baseline.mjs';
const PROTOTYPE_INTEGRITY = 'tools/validate-kroad-010-prototype-integrity.mjs';
const SHA_PATTERN = /^[0-9a-f]{40}$/;
const VALIDATORS = Object.freeze({
  primary: PRIMARY,
  'primary-baseline': PRIMARY_BASELINE,
  'canonical-lock': LOCK,
  lineage: LINEAGE,
  'prototype-integrity': PROTOTYPE_INTEGRITY,
});

const ORDINARY_FIXTURES = Object.freeze([
  'kernel/fixtures/valid/downstream_consumer/architect_layout_structure_kernel_consumed_valid.json',
  'kernel/fixtures/valid/downstream_consumer/architect_layout_structure_insufficient_evidence_valid.json',
  'kernel/fixtures/valid/downstream_consumer/architect_media_choice_insufficient_evidence_valid.json',
  'kernel/fixtures/invalid/downstream_consumer/architect_layout_structure_missing_kernel_refs_invalid.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_unsupported_family_resolver_backed_adversarial.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_synthetic_evidence_overclaim_adversarial.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_layout_structure_insufficient_with_fake_decision_adversarial.json',
]);

function run(command, args, cwd, {capture = false} = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function readJson(root, path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

function writeJson(root, path, value) {
  writeFileSync(join(root, path), `${JSON.stringify(value, null, 2)}\n`);
}

function activatePackage(worktree) {
  const pkg = readJson(worktree, 'package.json');
  const scripts = {...(pkg.scripts || {})};
  const primaryCommand = `node ${PRIMARY}`;
  const lockCommand = `node ${LOCK}`;
  const lineageCommand = `node ${LINEAGE}`;

  scripts['validate:downstream-consumer-contract'] = primaryCommand;
  scripts['validate:downstream-consumer-canonical-lock'] = lockCommand;
  scripts['validate:downstream-consumer-lineage'] = lineageCommand;

  const existing = String(scripts['validate:mvk'] || '')
    .split('&&')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((command) => ![primaryCommand, lockCommand, lineageCommand].includes(command));
  scripts['validate:mvk'] = [...existing, primaryCommand, lockCommand, lineageCommand].join(' && ');
  pkg.scripts = scripts;
  writeJson(worktree, 'package.json', pkg);
}

function repinOrdinaryFixtures(worktree, bootstrapHead) {
  for (const path of ORDINARY_FIXTURES) {
    const fixture = readJson(worktree, path);
    if (!fixture?.record?.kernel_pin) {
      throw new Error(`Ordinary bootstrap fixture lacks record.kernel_pin: ${path}`);
    }
    fixture.record.kernel_pin.kernel_ref = bootstrapHead;
    writeJson(worktree, path, fixture);
  }
}

function commitSyntheticActivation(worktree) {
  run('git', ['add', 'package.json', ...ORDINARY_FIXTURES], worktree);
  run('git', [
    '-c', 'user.name=EV4 Bootstrap Harness',
    '-c', 'user.email=bootstrap@ev4.local',
    'commit', '-m', 'Synthetic committed KROAD-010 activation for bootstrap validation',
  ], worktree);
  return run('git', ['rev-parse', 'HEAD'], worktree, {capture: true}).trim();
}

function assertClean(worktree) {
  const status = run(
    'git',
    ['status', '--porcelain', '--untracked-files=all'],
    worktree,
    {capture: true},
  );
  if (status.trim()) throw new Error(`Bootstrap synthetic worktree is dirty:\n${status}`);
}

function executeValidator(worktree, label, path) {
  console.log(`BOOTSTRAP_DIRECT_EXECUTION_START ${label}`);
  run(process.execPath, [path], worktree);
  console.log(`BOOTSTRAP_DIRECT_EXECUTION_PASS ${label}`);
}

function main() {
  const requested = process.argv[2] || 'all';
  if (requested !== 'all' && !Object.hasOwn(VALIDATORS, requested)) {
    throw new Error(`Unknown bootstrap validator mode: ${requested}`);
  }

  const bootstrapHead = run('git', ['rev-parse', 'HEAD'], ROOT, {capture: true}).trim();
  if (!SHA_PATTERN.test(bootstrapHead)) {
    throw new Error(`Expected a full bootstrap commit SHA, received: ${bootstrapHead}`);
  }

  const tempRoot = mkdtempSync(join(tmpdir(), 'ev4-kroad-010-bootstrap-'));
  const worktree = join(tempRoot, 'worktree');
  let worktreeAdded = false;

  try {
    run('git', ['worktree', 'add', '--detach', worktree, bootstrapHead], ROOT);
    worktreeAdded = true;

    activatePackage(worktree);
    repinOrdinaryFixtures(worktree, bootstrapHead);
    const syntheticActivation = commitSyntheticActivation(worktree);

    const exclude = run(
      'git',
      ['rev-parse', '--git-path', 'info/exclude'],
      worktree,
      {capture: true},
    ).trim();
    appendFileSync(exclude, '\n/node_modules\n');
    symlinkSync(join(ROOT, 'node_modules'), join(worktree, 'node_modules'), 'dir');

    run('git', ['merge-base', '--is-ancestor', bootstrapHead, syntheticActivation], worktree);
    assertClean(worktree);

    console.log(
      `BOOTSTRAP_COMMITTED_VALIDATION_HISTORY bootstrap=${bootstrapHead} activation=${syntheticActivation}`,
    );
    const selected = requested === 'all'
      ? Object.entries(VALIDATORS)
      : [[requested, VALIDATORS[requested]]];
    for (const [label, path] of selected) executeValidator(worktree, label, path);
    assertClean(worktree);

    console.log(
      `KROAD-010 bootstrap direct execution: PASS mode=${requested} head=${bootstrapHead}`,
    );
  } finally {
    if (worktreeAdded) {
      try {
        run('git', ['worktree', 'remove', '--force', worktree], ROOT);
      } catch (error) {
        console.error(`Failed to remove temporary worktree: ${error.message}`);
      }
    }
    rmSync(tempRoot, {recursive: true, force: true});
  }
}

main();
