#!/usr/bin/env node

import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFEST_PATH = 'kernel/decision-governance/downstream-consumer-contract.v0.json';
const POLICY_PATH = 'kernel/decision-governance/downstream-consumer-lineage-binding.v0.json';
const PRIMARY_VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-contract.mjs';
const LINEAGE_VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-lineage.mjs';
const LOCK_VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-canonical-lock.mjs';
const LOCK_CASES_PATH = 'kernel/fixtures/contract-lock/downstream_consumer/canonical_lock_mutations.json';

const REQUIRED_EXECUTION_SNAPSHOT_FILES = Object.freeze([
  MANIFEST_PATH,
  'kernel/schemas/downstream-consumer-contract.v0.schema.json',
  PRIMARY_VALIDATOR_PATH,
  POLICY_PATH,
  LINEAGE_VALIDATOR_PATH,
  LOCK_VALIDATOR_PATH,
  'kernel/schemas/decision-record.v2.schema.json',
  'kernel/decision-governance/resolver-rule-registry.v0.json',
  'kernel/decision-governance/resolver-rules/layout-structure.v0.json',
  'kernel/resolver-mvp/resolve-high-risk-p0.mjs',
  'kernel/validator/validate-l2-decision-correctness.mjs',
]);

const REQUIRED_BINDINGS = Object.freeze([
  'provisional_status',
  'downstream_owner',
  'evidence_identity_tier_source_ref',
  'evidence_limitations',
  'l2_rerun_status',
  'same_envelope_l2_result',
  'matrix_fragment',
  'contract_decision_vertical_slice_provenance',
]);

const EXPECTED_VALIDATION_COMMANDS = Object.freeze([
  'npm run validate:downstream-consumer-contract',
  'npm run validate:downstream-consumer-canonical-lock',
  'npm run validate:downstream-consumer-lineage',
  'npm run validate:mvk',
  'npm run validate:roadmap-memory',
]);

const PRIMARY_COMMAND = `node ${PRIMARY_VALIDATOR_PATH}`;
const LOCK_COMMAND = `node ${LOCK_VALIDATOR_PATH}`;
const LINEAGE_COMMAND = `node ${LINEAGE_VALIDATOR_PATH}`;

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function sameStringSet(left, right) {
  const a = new Set(Array.isArray(left) ? left : []);
  const b = new Set(Array.isArray(right) ? right : []);
  return a.size === b.size && [...a].every((item) => b.has(item));
}

function splitCommands(value) {
  return String(value || '').split('&&').map((part) => part.trim()).filter(Boolean);
}

function count(items, expected) {
  return items.filter((item) => item === expected).length;
}

function diagnostic(code, message) {
  return {code, message};
}

function validateState(manifest, policy, pkg) {
  const diagnostics = [];
  const scripts = pkg?.scripts || {};
  const mvkParts = splitCommands(scripts['validate:mvk']);

  const expectedRefs = {
    lineage_policy_ref: POLICY_PATH,
    lineage_validator_ref: LINEAGE_VALIDATOR_PATH,
    canonical_lock_validator_ref: LOCK_VALIDATOR_PATH,
    canonical_lock_cases_ref: LOCK_CASES_PATH,
  };

  for (const [field, expected] of Object.entries(expectedRefs)) {
    if (manifest?.[field] !== expected) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_CANONICAL_LINEAGE_REF_MISMATCH',
        `${field} must equal ${expected}`,
      ));
    }
  }

  if (!sameStringSet(manifest?.lineage_cases, policy?.cases)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_LINEAGE_CASE_SET_MISMATCH',
      'Manifest lineage_cases must exactly match policy cases.',
    ));
  }

  if (!sameStringSet(policy?.snapshot_execution_files, REQUIRED_EXECUTION_SNAPSHOT_FILES)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_EXECUTION_SET_MISMATCH',
      'Policy snapshot_execution_files must exactly match the acceptance-semantics set.',
    ));
  }

  if (!sameStringSet(policy?.required_bindings, REQUIRED_BINDINGS)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_BINDING_SET_MISMATCH',
      'Policy required_bindings must include every mandatory lineage binding.',
    ));
  }

  const excluded = policy?.orchestration_wiring?.excluded_files;
  if (
    policy?.orchestration_wiring?.pinned_as_acceptance_semantics !== false
    || !sameStringSet(excluded, ['package.json', 'package-lock.json'])
    || policy?.orchestration_wiring?.guarded_by !== LOCK_VALIDATOR_PATH
  ) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_ORCHESTRATION_POLICY_INVALID',
      'Package orchestration must be excluded from the immutable semantic snapshot and guarded by the canonical lock.',
    ));
  }

  if (!sameStringSet(manifest?.validation_commands, EXPECTED_VALIDATION_COMMANDS)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_VALIDATION_COMMANDS_MISMATCH',
      'Manifest validation_commands are incomplete or drifted.',
    ));
  }

  if (scripts['validate:downstream-consumer-contract'] !== PRIMARY_COMMAND) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_PRIMARY_SCRIPT_MISMATCH',
      'The primary contract script must run only the primary validator.',
    ));
  }
  if (scripts['validate:downstream-consumer-canonical-lock'] !== LOCK_COMMAND) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_LOCK_SCRIPT_MISSING',
      'The dedicated canonical-lock script is missing or renamed.',
    ));
  }
  if (scripts['validate:downstream-consumer-lineage'] !== LINEAGE_COMMAND) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_LINEAGE_SCRIPT_MISSING',
      'The dedicated lineage script is missing or renamed.',
    ));
  }

  const requiredMvkCommands = [PRIMARY_COMMAND, LOCK_COMMAND, LINEAGE_COMMAND];
  if (requiredMvkCommands.some((command) => count(mvkParts, command) !== 1)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_CANONICAL_MVK_GATE_SET_INVALID',
      'validate:mvk must include each KROAD-010 gate exactly once.',
    ));
  } else {
    const indexes = requiredMvkCommands.map((command) => mvkParts.indexOf(command));
    if (!(indexes[0] < indexes[1] && indexes[1] < indexes[2])) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_CANONICAL_MVK_GATE_ORDER_INVALID',
        'validate:mvk must run primary, canonical-lock, then lineage validation.',
      ));
    }
  }

  for (const path of [
    MANIFEST_PATH,
    POLICY_PATH,
    PRIMARY_VALIDATOR_PATH,
    LINEAGE_VALIDATOR_PATH,
    LOCK_VALIDATOR_PATH,
    LOCK_CASES_PATH,
    ...(manifest?.lineage_cases || []),
  ]) {
    if (!existsSync(join(ROOT, path))) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_CANONICAL_REFERENCED_ARTIFACT_MISSING',
        `Referenced artifact is missing: ${path}`,
      ));
    }
  }

  return diagnostics;
}

function mutateState(kind, manifest, policy, pkg) {
  const next = {
    manifest: deepClone(manifest),
    policy: deepClone(policy),
    pkg: deepClone(pkg),
  };

  switch (kind) {
    case 'remove_lineage_script':
      delete next.pkg.scripts['validate:downstream-consumer-lineage'];
      break;
    case 'rename_canonical_lock_script':
      next.pkg.scripts['validate:downstream-consumer-canonical-lock'] = 'node kernel/validator/renamed-lock.mjs';
      break;
    case 'remove_lineage_gate_from_mvk':
      next.pkg.scripts['validate:mvk'] = splitCommands(next.pkg.scripts['validate:mvk'])
        .filter((command) => command !== LINEAGE_COMMAND)
        .join(' && ');
      break;
    case 'duplicate_primary_gate_in_mvk':
      next.pkg.scripts['validate:mvk'] = `${next.pkg.scripts['validate:mvk']} && ${PRIMARY_COMMAND}`;
      break;
    case 'reorder_kroad_010_gates': {
      const others = splitCommands(next.pkg.scripts['validate:mvk'])
        .filter((command) => ![PRIMARY_COMMAND, LOCK_COMMAND, LINEAGE_COMMAND].includes(command));
      next.pkg.scripts['validate:mvk'] = [...others, PRIMARY_COMMAND, LINEAGE_COMMAND, LOCK_COMMAND].join(' && ');
      break;
    }
    case 'manifest_policy_case_drift':
      next.manifest.lineage_cases = (next.manifest.lineage_cases || []).slice(0, -1);
      break;
    case 'snapshot_execution_set_drift':
      next.policy.snapshot_execution_files = [...(next.policy.snapshot_execution_files || []), 'package.json'];
      break;
    default:
      throw new Error(`Unknown canonical-lock mutation kind: ${kind}`);
  }

  return next;
}

function runMutationSuite(manifest, policy, pkg) {
  const suite = readJson(LOCK_CASES_PATH);
  const failures = [];

  for (const testCase of suite.cases || []) {
    const mutated = mutateState(testCase.mutation_kind, manifest, policy, pkg);
    const codes = new Set(validateState(mutated.manifest, mutated.policy, mutated.pkg).map((item) => item.code));
    if (!codes.has(testCase.expected_diagnostic)) {
      failures.push(diagnostic(
        'DOWNSTREAM_CONSUMER_CANONICAL_MUTATION_NOT_DETECTED',
        `${testCase.case_id} did not emit ${testCase.expected_diagnostic}`,
      ));
    }
  }

  return failures;
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const policy = readJson(POLICY_PATH);
  const pkg = readJson('package.json');

  const diagnostics = [
    ...validateState(manifest, policy, pkg),
    ...runMutationSuite(manifest, policy, pkg),
  ];

  if (diagnostics.length > 0) {
    for (const item of diagnostics) console.error(`${item.code}: ${item.message}`);
    process.exit(1);
  }

  console.log('KROAD-010 canonical lineage lock: PASS');
}

main();
