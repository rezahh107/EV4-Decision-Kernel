#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {auditDecisionRecord} from './validate-l2-decision-correctness.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const POLICY_PATH = 'kernel/decision-governance/downstream-consumer-lineage-binding.v0.json';
const VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-lineage.mjs';
const LOCK_VALIDATOR_PATH = 'kernel/validator/validate-downstream-consumer-canonical-lock.mjs';

const REQUIRED_EXECUTION_SNAPSHOT_FILES = Object.freeze([
  'kernel/decision-governance/downstream-consumer-contract.v0.json',
  'kernel/schemas/downstream-consumer-contract.v0.schema.json',
  'kernel/validator/validate-downstream-consumer-contract.mjs',
  POLICY_PATH,
  VALIDATOR_PATH,
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

function readText(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function readJson(path) {
  return JSON.parse(readText(path));
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

function readPinnedText(commit, path) {
  return git(['show', `${commit}:${path}`]);
}

function readPinnedJson(commit, path) {
  return JSON.parse(readPinnedText(commit, path));
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function setPath(target, dottedPath, value) {
  const parts = dottedPath.split('.');
  let current = target;
  for (const part of parts.slice(0, -1)) {
    if (!current[part] || typeof current[part] !== 'object') current[part] = {};
    current = current[part];
  }
  current[parts.at(-1)] = deepClone(value);
}

function applyPatch(target, patch = {}) {
  for (const [path, value] of Object.entries(patch)) setPath(target, path, value);
  return target;
}

function diagnostic(code, path, message = code) {
  return {code, path, severity: 'error', source: 'lineage', message};
}

function sameStringSet(left, right) {
  const a = new Set(Array.isArray(left) ? left : []);
  const b = new Set(Array.isArray(right) ? right : []);
  return a.size === b.size && [...a].every((item) => b.has(item));
}

function canonicalEvidenceIdentity(item) {
  return JSON.stringify([
    item?.evidence_id ?? null,
    item?.evidence_tier ?? null,
    item?.source_type ?? null,
    item?.ref ?? null,
  ]);
}

function normalizedLimitations(value) {
  return [...new Set((Array.isArray(value) ? value : [])
    .filter((item) => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean))].sort();
}

function evidenceIdentityMatches(consumerEvidence, decisionEvidence) {
  const left = (consumerEvidence || []).map(canonicalEvidenceIdentity).sort();
  const right = (decisionEvidence || []).map(canonicalEvidenceIdentity).sort();
  return JSON.stringify(left) === JSON.stringify(right);
}

function evidenceLimitationsMatch(consumerEvidence, decisionEvidence) {
  if (!evidenceIdentityMatches(consumerEvidence, decisionEvidence)) return false;

  const decisionByIdentity = new Map((decisionEvidence || []).map((item) => [
    canonicalEvidenceIdentity(item),
    normalizedLimitations(item?.limitations),
  ]));

  for (const item of consumerEvidence || []) {
    const identity = canonicalEvidenceIdentity(item);
    const consumerLimitations = normalizedLimitations(item?.limitations);
    const decisionLimitations = decisionByIdentity.get(identity);
    if (JSON.stringify(consumerLimitations) !== JSON.stringify(decisionLimitations)) return false;
  }
  return true;
}

function decisionSiblingFragment(decisionFragment, sibling) {
  const parts = decisionFragment?.split('.') || [];
  if (parts.at(-1) !== 'decision_record') return null;
  return [...parts.slice(0, -1), sibling].join('.');
}

function validateExecutionSnapshot(commit, policy) {
  const diagnostics = [];

  if (!sameStringSet(policy.snapshot_execution_files, REQUIRED_EXECUTION_SNAPSHOT_FILES)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_LINEAGE_EXECUTION_SET_INVALID',
      'snapshot_execution_files',
      'Lineage policy must enumerate the complete hard-coded acceptance-semantics snapshot set.',
    ));
    return diagnostics;
  }

  for (const path of REQUIRED_EXECUTION_SNAPSHOT_FILES) {
    let pinned;
    try {
      pinned = readPinnedText(commit, path);
    } catch {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING',
        path,
        `Pinned commit ${commit} does not contain required execution file ${path}.`,
      ));
      continue;
    }

    let current;
    try {
      current = readText(path);
    } catch {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_LINEAGE_CURRENT_EXECUTION_FILE_MISSING',
        path,
        `Current checkout does not contain required execution file ${path}.`,
      ));
      continue;
    }

    if (pinned !== current) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT',
        path,
        `Current execution file ${path} differs from pinned commit ${commit}.`,
      ));
    }
  }

  return diagnostics;
}

function validateBinding(record, policy, envelopeOverride = null) {
  const diagnostics = [];
  const commit = record?.kernel_pin?.kernel_ref;

  try {
    git(['cat-file', '-e', `${commit}^{commit}`]);
    git(['merge-base', '--is-ancestor', commit, 'HEAD']);
  } catch {
    return [diagnostic(
      'DOWNSTREAM_CONSUMER_LINEAGE_PIN_UNAVAILABLE',
      'kernel_pin.kernel_ref',
      'Lineage validation requires an available ancestor commit.',
    )];
  }

  diagnostics.push(...validateExecutionSnapshot(commit, policy));
  if (diagnostics.length > 0) return diagnostics;

  const decisionRef = splitRef(record.kernel_artifact_refs?.decision_record_ref);
  let envelope;

  try {
    envelope = readPinnedJson(commit, decisionRef.path);
  } catch {
    return [diagnostic(
      'DOWNSTREAM_CONSUMER_LINEAGE_DECISION_ENVELOPE_MISSING',
      'kernel_artifact_refs.decision_record_ref',
    )];
  }

  if (envelopeOverride) applyPatch(envelope, envelopeOverride);

  const decisionRecord = resolveFragment(envelope, decisionRef.fragment);
  const resolverInput = resolveFragment(
    envelope,
    decisionSiblingFragment(decisionRef.fragment, 'resolver_input'),
  );
  const auditContext = resolveFragment(
    envelope,
    decisionSiblingFragment(decisionRef.fragment, 'audit_context'),
  ) || {};

  if (!decisionRecord || !resolverInput) {
    return [diagnostic(
      'DOWNSTREAM_CONSUMER_LINEAGE_ENVELOPE_INVALID',
      'kernel_artifact_refs.decision_record_ref',
    )];
  }

  let validateDecisionRecordSchema;
  try {
    const schemaRef = splitRef(record.kernel_artifact_refs.decision_record_schema_ref);
    const schema = readPinnedJson(commit, schemaRef.path);
    const ajv = new Ajv2020({allErrors: true, strict: false});
    addFormats(ajv);
    validateDecisionRecordSchema = ajv.compile(schema);
  } catch {
    return [diagnostic(
      'DOWNSTREAM_CONSUMER_LINEAGE_SCHEMA_UNAVAILABLE',
      'kernel_artifact_refs.decision_record_schema_ref',
    )];
  }

  const audit = auditDecisionRecord({
    decisionRecord,
    resolverInput,
    auditContext,
    validateDecisionRecordSchema,
  });

  if (
    record.decision_output?.provisional
    !== Boolean(decisionRecord.provisional_status?.is_provisional)
  ) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PROVISIONAL_STATUS_MISMATCH',
      'decision_output.provisional',
    ));
  }

  if (decisionRecord.downstream_owner !== record.consumer?.role) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_DECISION_OWNER_MISMATCH',
      'consumer.role',
    ));
  }

  if (!evidenceIdentityMatches(record.evidence_refs, decisionRecord.evidence_refs)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_EVIDENCE_LINEAGE_MISMATCH',
      'evidence_refs',
    ));
  } else if (!evidenceLimitationsMatch(record.evidence_refs, decisionRecord.evidence_refs)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH',
      'evidence_refs',
    ));
  }

  if (record.decision_output?.l2_audit_status !== audit.audit_status) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_L2_STATUS_MISMATCH',
      'decision_output.l2_audit_status',
    ));
  }

  const l2Ref = splitRef(record.kernel_artifact_refs?.l2_audit_result_ref);
  if (l2Ref.path !== decisionRef.path) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_L2_RESULT_ENVELOPE_MISMATCH',
      'kernel_artifact_refs.l2_audit_result_ref',
    ));
  } else if (resolveFragment(envelope, l2Ref.fragment) !== audit.audit_status) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_MISMATCH',
      'kernel_artifact_refs.l2_audit_result_ref',
    ));
  }

  try {
    const matrixRef = splitRef(record.kernel_artifact_refs?.matrix_ref);
    const matrices = readPinnedJson(commit, matrixRef.path);
    const matrix = (matrices.matrices || []).find(
      (item) => item.decision_family_id === record.decision_family_id,
    );
    if (!matrix || matrixRef.fragment !== matrix.matrix_id) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_MATRIX_REF_MISMATCH',
        'kernel_artifact_refs.matrix_ref',
      ));
    }
  } catch {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_MATRIX_REF_MISMATCH',
      'kernel_artifact_refs.matrix_ref',
    ));
  }

  const verticalRef = splitRef(record.kernel_artifact_refs?.vertical_slice_ref);
  const requiredProvenance = [
    record.kernel_pin.contract_ref,
    decisionRef.path,
    verticalRef.path,
  ];

  for (const required of requiredProvenance) {
    if (!(record.provenance_refs || []).includes(required)) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_PROVENANCE_REF_MISSING',
        'provenance_refs',
        `Required provenance reference is missing: ${required}`,
      ));
    }
  }

  return diagnostics;
}

function loadCase(casePath) {
  const testCase = readJson(casePath);
  const baseFixture = readJson(testCase.base_record_fixture);
  const record = applyPatch(deepClone(baseFixture.record), testCase.record_patch);
  return {
    testCase,
    record,
    envelopePatch: testCase.envelope_patch || null,
  };
}

function main() {
  const policy = readJson(POLICY_PATH);
  const output = ['KROAD-010 downstream consumer lineage validator summary'];
  let failed = false;

  if (
    policy.policy_id !== 'kroad-010.downstream-consumer-lineage-binding.v0'
    || policy.version !== '0.1.0'
    || policy.selected_consumer !== 'rezahh107/EV4-Architect-Repo'
  ) {
    console.error('Lineage policy identity is invalid.');
    process.exit(1);
  }

  if (!sameStringSet(policy.snapshot_execution_files, REQUIRED_EXECUTION_SNAPSHOT_FILES)) {
    console.error('Lineage policy execution snapshot set is invalid.');
    process.exit(1);
  }

  if (!sameStringSet(policy.required_bindings, REQUIRED_BINDINGS)) {
    console.error('Lineage policy required binding set is invalid.');
    process.exit(1);
  }

  for (const casePath of policy.cases) {
    let loaded;
    try {
      loaded = loadCase(casePath);
    } catch (error) {
      failed = true;
      output.push(`${casePath}: FAIL`, `  - FIXTURE_READ_FAILED: ${error.message}`);
      continue;
    }

    const diagnostics = validateBinding(loaded.record, policy, loaded.envelopePatch);
    const observedCodes = new Set(diagnostics.map((item) => item.code));
    const expected = loaded.testCase.expected_result;
    const observedStatus = diagnostics.length === 0 ? 'pass' : 'fail';
    const missing = expected.diagnostic_codes.filter((code) => !observedCodes.has(code));

    if (observedStatus !== expected.validation_status || missing.length > 0) {
      failed = true;
      output.push(
        `${casePath}: FAIL expected=${expected.validation_status} observed=${observedStatus}`,
        ...missing.map((code) => `  - Missing expected diagnostic: ${code}`),
        ...diagnostics.map((item) => `  - ${item.code} [${item.path}]`),
      );
    } else {
      output.push(
        `${casePath}: PASS [${observedStatus}]`
        + (expected.diagnostic_codes.length
          ? ` ${expected.diagnostic_codes.join(', ')}`
          : ''),
      );
    }
  }

  output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
  console.log(output.join('\n'));
  process.exit(failed ? 1 : 0);
}

main();
