#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const MANIFEST_PATH = 'kernel/decision-governance/downstream-consumer-contract.v0.json';
const POLICY_PATH = 'kernel/decision-governance/downstream-consumer-lineage-binding.v0.json';
const PRIMARY_VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-contract.mjs';
const LINEAGE_VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-lineage.mjs';
const LOCK_VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-canonical-lock.mjs';
const LIMITATIONS_FIXTURE_PATH = 'kernel/fixtures/lineage/downstream_consumer/evidence_limitations_mismatch_invalid.json';

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function splitRef(value) {
  const index = typeof value === 'string' ? value.indexOf('#') : -1;
  return index < 0
    ? {path: value, fragment: null}
    : {path: value.slice(0, index), fragment: value.slice(index + 1)};
}

function resolveFragment(value, fragment) {
  if (!fragment) return value;
  return fragment.split('.').reduce((current, key) => current?.[key], value);
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setPath(target, dottedPath, value) {
  const parts = dottedPath.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (current[part] === undefined || current[part] === null) current[part] = {};
    current = current[part];
  }
  current[parts.at(-1)] = deepClone(value);
}

function applyPatch(target, patch = {}) {
  for (const [path, value] of Object.entries(patch)) setPath(target, path, value);
  return target;
}

function sameStringSet(left, right) {
  const a = new Set(Array.isArray(left) ? left : []);
  const b = new Set(Array.isArray(right) ? right : []);
  return a.size === b.size && [...a].every((item) => b.has(item));
}

function normalizedLimitations(value) {
  return [...new Set((Array.isArray(value) ? value : [])
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean))].sort();
}

function limitationsByEvidenceId(refs) {
  return new Map((Array.isArray(refs) ? refs : []).map((item) => [
    item?.evidence_id,
    normalizedLimitations(item?.limitations),
  ]));
}

function evidenceLimitationsMatch(consumerEvidence, decisionEvidence) {
  const left = limitationsByEvidenceId(consumerEvidence);
  const right = limitationsByEvidenceId(decisionEvidence);
  if (left.size !== right.size) return false;
  for (const [id, limitations] of left) {
    if (!right.has(id)) return false;
    if (JSON.stringify(limitations) !== JSON.stringify(right.get(id))) return false;
  }
  return true;
}

function fail(code, message) {
  console.error(`${code}: ${message}`);
  process.exitCode = 1;
}

function validateManifestLock(manifest, policy, pkg) {
  const expectedCases = policy.cases || [];
  const scripts = pkg.scripts || {};
  const mvkParts = (scripts['validate:mvk'] || '').split('&&').map((part) => part.trim());

  const expectedRefs = {
    lineage_policy_ref: POLICY_PATH,
    lineage_validator_ref: LINEAGE_VALIDATOR_PATH,
    canonical_lock_validator_ref: LOCK_VALIDATOR_PATH,
  };

  for (const [field, expected] of Object.entries(expectedRefs)) {
    if (manifest[field] !== expected) {
      fail('DOWNSTREAM_CONSUMER_CANONICAL_LINEAGE_REF_MISMATCH', `${field} must equal ${expected}`);
    }
  }

  if (!sameStringSet(manifest.lineage_cases, expectedCases)) {
    fail('DOWNSTREAM_CONSUMER_CANONICAL_LINEAGE_CASE_SET_MISMATCH', 'Manifest lineage_cases must exactly match policy cases.');
  }

  const expectedCommands = [
    'npm run validate:downstream-consumer-contract',
    'npm run validate:downstream-consumer-canonical-lock',
    'npm run validate:downstream-consumer-lineage',
    'npm run validate:mvk',
    'npm run validate:roadmap-memory',
  ];
  if (!sameStringSet(manifest.validation_commands, expectedCommands)) {
    fail('DOWNSTREAM_CONSUMER_CANONICAL_VALIDATION_COMMANDS_MISMATCH', 'Manifest validation_commands are incomplete or drifted.');
  }

  if (scripts['validate:downstream-consumer-lineage'] !== `node ${LINEAGE_VALIDATOR_PATH}`) {
    fail('DOWNSTREAM_CONSUMER_CANONICAL_LINEAGE_SCRIPT_MISSING', 'Dedicated lineage script is missing or renamed.');
  }
  if (scripts['validate:downstream-consumer-canonical-lock'] !== `node ${LOCK_VALIDATOR_PATH}`) {
    fail('DOWNSTREAM_CONSUMER_CANONICAL_LOCK_SCRIPT_MISSING', 'Canonical lock script is missing or renamed.');
  }
  if (scripts['validate:downstream-consumer-contract'] !== `node ${PRIMARY_VALIDATOR_PATH} && node ${LOCK_VALIDATOR_PATH}`) {
    fail('DOWNSTREAM_CONSUMER_CANONICAL_PRIMARY_COMMAND_MISMATCH', 'Primary contract command must include the canonical lock.');
  }

  for (const command of [
    `node ${PRIMARY_VALIDATOR_PATH}`,
    `node ${LOCK_VALIDATOR_PATH}`,
    `node ${LINEAGE_VALIDATOR_PATH}`,
  ]) {
    if (!mvkParts.includes(command)) {
      fail('DOWNSTREAM_CONSUMER_CANONICAL_MVK_GATE_MISSING', `validate:mvk must include ${command}`);
    }
  }
}

function validateLimitationsBinding() {
  const testCase = readJson(LIMITATIONS_FIXTURE_PATH);
  const baseFixture = readJson(testCase.base_record_fixture);
  const record = applyPatch(deepClone(baseFixture.record), testCase.record_patch);
  const commit = record.kernel_pin.kernel_ref;
  const decisionRef = splitRef(record.kernel_artifact_refs.decision_record_ref);
  const envelope = JSON.parse(git(['show', `${commit}:${decisionRef.path}`]));
  const decisionRecord = resolveFragment(envelope, decisionRef.fragment);

  if (evidenceLimitationsMatch(record.evidence_refs, decisionRecord.evidence_refs)) {
    fail(
      'DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH_NOT_DETECTED',
      'Limitation-only mutation unexpectedly preserved evidence semantics.',
    );
    return;
  }

  const expectedCodes = testCase.expected_result?.diagnostic_codes || [];
  if (!expectedCodes.includes('DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH')) {
    fail(
      'DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_FIXTURE_INVALID',
      'Limitation-only fixture must require the stable mismatch diagnostic.',
    );
  }

  const validRecord = deepClone(baseFixture.record);
  const validEnvelope = JSON.parse(git(['show', `${validRecord.kernel_pin.kernel_ref}:${decisionRef.path}`]));
  const validDecision = resolveFragment(validEnvelope, decisionRef.fragment);
  if (!evidenceLimitationsMatch(validRecord.evidence_refs, validDecision.evidence_refs)) {
    fail(
      'DOWNSTREAM_CONSUMER_VALID_EVIDENCE_LIMITATIONS_DRIFT',
      'The unchanged valid fixture does not preserve pinned evidence limitations.',
    );
  }
}

function main() {
  const manifest = readJson(MANIFEST_PATH);
  const policy = readJson(POLICY_PATH);
  const pkg = readJson('package.json');

  validateManifestLock(manifest, policy, pkg);
  validateLimitationsBinding();

  if (process.exitCode) process.exit(process.exitCode);
  console.log('KROAD-010 canonical lineage lock: PASS');
}

main();
