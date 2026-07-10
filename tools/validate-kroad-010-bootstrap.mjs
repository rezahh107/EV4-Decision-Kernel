#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {
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
const ACTIVATION_REF = 'refs/remotes/origin/kroad-010/downstream-consumer-contract';
const PRIMARY = 'kernel/validator/validate-downstream-consumer-contract.mjs';
const LOCK = 'kernel/validator/validate-downstream-consumer-canonical-lock.mjs';
const LINEAGE = 'kernel/validator/validate-downstream-consumer-lineage.mjs';

const ORDINARY_FIXTURES = Object.freeze([
  'kernel/fixtures/valid/downstream_consumer/architect_layout_structure_kernel_consumed_valid.json',
  'kernel/fixtures/valid/downstream_consumer/architect_layout_structure_insufficient_evidence_valid.json',
  'kernel/fixtures/valid/downstream_consumer/architect_media_choice_insufficient_evidence_valid.json',
  'kernel/fixtures/invalid/downstream_consumer/architect_layout_structure_missing_kernel_refs_invalid.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_unsupported_family_resolver_backed_adversarial.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_synthetic_evidence_overclaim_adversarial.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_layout_structure_insufficient_with_fake_decision_adversarial.json',
]);

function run(command, args, cwd, options = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: options.capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
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

  scripts['validate:mvk'] = [
    ...existing,
    primaryCommand,
    lockCommand,
    lineageCommand,
  ].join(' && ');
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

function createSyntheticValidationHistory(worktree, bootstrapHead) {
  const activationHead = run('git', ['rev-parse', ACTIVATION_REF], worktree, {capture: true}).trim();
  if (!/^[0-9a-f]{40}$/.test(activationHead)) {
    throw new Error(`Activation branch head is unavailable: ${activationHead}`);
  }

  const syntheticHead = run('git', [
    '-c', 'user.name=EV4 Bootstrap Harness',
    '-c', 'user.email=bootstrap@ev4.local',
    'commit-tree', `${bootstrapHead}^{tree}`,
    '-p', bootstrapHead,
    '-p', activationHead,
    '-m', 'Synthetic KROAD-010 bootstrap validation history',
  ], worktree, {capture: true}).trim();

  run('git', ['checkout', '--detach', syntheticHead], worktree);
  return {activationHead, syntheticHead};
}

function executeValidator(worktree, label, path) {
  console.log(`BOOTSTRAP_DIRECT_EXECUTION_START ${label}`);
  run(process.execPath, [path], worktree);
  console.log(`BOOTSTRAP_DIRECT_EXECUTION_PASS ${label}`);
}

function main() {
  const bootstrapHead = run('git', ['rev-parse', 'HEAD'], ROOT, {capture: true}).trim();
  if (!/^[0-9a-f]{40}$/.test(bootstrapHead)) {
    throw new Error(`Expected a full bootstrap commit SHA, received: ${bootstrapHead}`);
  }

  const tempRoot = mkdtempSync(join(tmpdir(), 'ev4-kroad-010-bootstrap-'));
  const worktree = join(tempRoot, 'worktree');
  let worktreeAdded = false;

  try {
    run('git', ['worktree', 'add', '--detach', worktree, bootstrapHead], ROOT);
    worktreeAdded = true;

    const {activationHead, syntheticHead} = createSyntheticValidationHistory(
      worktree,
      bootstrapHead,
    );
    console.log(`BOOTSTRAP_VALIDATION_HISTORY bootstrap=${bootstrapHead} activation=${activationHead} synthetic=${syntheticHead}`);

    symlinkSync(join(ROOT, 'node_modules'), join(worktree, 'node_modules'), 'dir');
    activatePackage(worktree);
    repinOrdinaryFixtures(worktree, bootstrapHead);

    executeValidator(worktree, 'primary', PRIMARY);
    executeValidator(worktree, 'canonical-lock', LOCK);
    executeValidator(worktree, 'lineage', LINEAGE);

    console.log(`KROAD-010 bootstrap direct execution: PASS (${bootstrapHead})`);
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
