#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import {auditDecisionRecord} from './validate-l2-decision-correctness.mjs';

const MODULE_PATH = fileURLToPath(import.meta.url);
const ROOT = join(dirname(MODULE_PATH), '..', '..');

export const PATHS = Object.freeze({
  manifest: 'kernel/decision-governance/downstream-consumer-contract.v0.json',
  schema: 'kernel/schemas/downstream-consumer-contract.v0.schema.json',
  validator: 'kernel/validator/validate-downstream-consumer-contract.mjs',
  decisionRecordSchema: 'kernel/schemas/decision-record.v2.schema.json',
  matrices: 'kernel/decision-governance/p0-decision-matrices.v0.json',
  decisionCards: 'kernel/decision-cards/elements.core.v0.json',
  resolverRegistry: 'kernel/decision-governance/resolver-rule-registry.v0.json',
  resolverMvp: 'kernel/resolver-mvp/resolve-high-risk-p0.mjs',
  verticalSlice: 'kernel/decision-governance/kroad-009-layout-structure-vertical-slice.v0.json',
  l2Validator: 'kernel/validator/validate-l2-decision-correctness.mjs',
  documentation: 'docs/decision-governance/KROAD_010_DOWNSTREAM_CONSUMER_CONTRACT.md',
});

const L2_AUDIT_REF = `${PATHS.l2Validator}#auditDecisionRecord`;
const REQUIRED_KERNEL_REF_FIELDS = Object.freeze([
  'matrix_ref',
  'decision_card_ref',
  'resolver_registry_ref',
  'resolver_rule_ref',
  'decision_record_schema_ref',
  'decision_record_ref',
  'l2_audit_contract_ref',
  'l2_audit_result_ref',
  'vertical_slice_ref',
]);
const NULL_DECISION_REF_FIELDS = Object.freeze([
  'decision_card_ref',
  'resolver_rule_ref',
  'decision_record_ref',
  'l2_audit_result_ref',
  'vertical_slice_ref',
]);
const NULL_DECISION_FIELDS = Object.freeze([
  'decision_id',
  'resolver_status',
  'selected_option_id',
  'rule_id',
  'rule_version',
]);
const REQUIRED_OVERCLAIM_ACKNOWLEDGEMENTS = Object.freeze([
  'kernel_local_contract_is_not_downstream_enforcement',
  'synthetic_fixture_is_not_real_target_project_proof',
  'decision_record_is_not_runtime_validation',
  'decision_record_is_not_builder_execution_proof',
  'kernel_contract_is_not_project_gate_acceptance',
  'kernel_contract_is_not_production_readiness',
]);
const FORBIDDEN_CLAIMS = Object.freeze({
  downstream_enforcement_proven: 'DOWNSTREAM_CONSUMER_OVERCLAIM_DOWNSTREAM_ENFORCEMENT',
  runtime_validated: 'DOWNSTREAM_CONSUMER_OVERCLAIM_RUNTIME_VALIDATION',
  builder_execution_proven: 'DOWNSTREAM_CONSUMER_OVERCLAIM_BUILDER_EXECUTION',
  project_gate_accepted: 'DOWNSTREAM_CONSUMER_OVERCLAIM_PROJECT_GATE_ACCEPTANCE',
  production_ready: 'DOWNSTREAM_CONSUMER_OVERCLAIM_PRODUCTION_READINESS',
  real_target_project_proof: 'DOWNSTREAM_CONSUMER_OVERCLAIM_REAL_TARGET_PROJECT_PROOF',
});

export const PRIMARY_FIXTURE_CASES = Object.freeze([
  {
    path: 'valid/downstream_consumer/architect_layout_structure_kernel_consumed_valid.json',
    expectedStatus: 'pass',
    requiredDiagnostics: [],
  },
  {
    path: 'valid/downstream_consumer/architect_layout_structure_insufficient_evidence_valid.json',
    expectedStatus: 'insufficient_evidence',
    requiredDiagnostics: ['DOWNSTREAM_CONSUMER_ACTIVE_FAMILY_INSUFFICIENT_EVIDENCE'],
  },
  {
    path: 'valid/downstream_consumer/architect_media_choice_insufficient_evidence_valid.json',
    expectedStatus: 'insufficient_evidence',
    requiredDiagnostics: ['DOWNSTREAM_CONSUMER_RESOLVER_FAMILY_UNSUPPORTED'],
  },
  {
    path: 'invalid/downstream_consumer/architect_layout_structure_missing_kernel_refs_invalid.json',
    expectedStatus: 'fail',
    requiredDiagnostics: [
      'DOWNSTREAM_CONSUMER_REQUIRED_KERNEL_REF_MISSING',
      'DOWNSTREAM_CONSUMER_DECISION_RECORD_REF_REQUIRED',
      'DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_REQUIRED',
    ],
  },
  {
    path: 'adversarial/downstream_consumer/architect_unsupported_family_resolver_backed_adversarial.json',
    expectedStatus: 'fail',
    requiredDiagnostics: ['DOWNSTREAM_CONSUMER_UNSUPPORTED_RESOLVER_FAMILY'],
  },
  {
    path: 'adversarial/downstream_consumer/architect_synthetic_evidence_overclaim_adversarial.json',
    expectedStatus: 'fail',
    requiredDiagnostics: [
      'DOWNSTREAM_CONSUMER_OVERCLAIM_DOWNSTREAM_ENFORCEMENT',
      'DOWNSTREAM_CONSUMER_OVERCLAIM_REAL_TARGET_PROJECT_PROOF',
      'DOWNSTREAM_CONSUMER_OVERCLAIM_PRODUCTION_READINESS',
    ],
  },
  {
    path: 'adversarial/downstream_consumer/architect_layout_structure_insufficient_with_fake_decision_adversarial.json',
    expectedStatus: 'fail',
    requiredDiagnostics: [
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_DECISION_FIELDS_FORBIDDEN',
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_ARTIFACT_REFS_FORBIDDEN',
      'DOWNSTREAM_CONSUMER_MISSING_REF_SET_MISMATCH',
    ],
  },
  {
    path: 'adversarial/downstream_consumer/architect_unknown_kernel_commit_adversarial.json',
    expectedStatus: 'fail',
    requiredDiagnostics: ['DOWNSTREAM_CONSUMER_PINNED_COMMIT_UNAVAILABLE'],
  },
  {
    path: 'adversarial/downstream_consumer/architect_ancestor_missing_contract_adversarial.json',
    expectedStatus: 'fail',
    requiredDiagnostics: ['DOWNSTREAM_CONSUMER_PINNED_CONTRACT_MISSING'],
  },
]);

function readJson(path) {
  return JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function diagnostic(
  code,
  path,
  severity = 'error',
  source = 'semantic',
  message = code,
) {
  return {code, path, severity, source, message};
}

function sameStringSet(left, right) {
  const a = new Set(left || []);
  const b = new Set(right || []);
  return a.size === b.size && [...a].every((value) => b.has(value));
}

function splitRef(value) {
  const index = typeof value === 'string' ? value.indexOf('#') : -1;
  return index < 0
    ? {path: value, fragment: null}
    : {path: value.slice(0, index), fragment: value.slice(index + 1)};
}

function formatDiagnostic(item) {
  return `${item.code} [${item.severity}/${item.source}] ${item.path}: ${item.message}`;
}

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function isSafeRepositoryPath(path) {
  return typeof path === 'string'
    && path.length > 0
    && !path.startsWith('/')
    && !path.includes('..')
    && !path.includes('\\')
    && !path.includes('\0');
}

function readPinnedText(
  commit,
  path,
  diagnostics,
  missingCode = 'DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING',
) {
  if (!isSafeRepositoryPath(path)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_PATH_INVALID',
      path || '(empty)',
    ));
    return null;
  }

  try {
    return git(['show', `${commit}:${path}`]);
  } catch {
    diagnostics.push(diagnostic(
      missingCode,
      path,
      'error',
      'snapshot',
      `Pinned commit ${commit} does not contain ${path}.`,
    ));
    return null;
  }
}

function readPinnedJson(commit, path, diagnostics, missingCode) {
  const text = readPinnedText(commit, path, diagnostics, missingCode);
  if (text === null) return null;

  try {
    return JSON.parse(text);
  } catch {
    diagnostics.push(diagnostic('DOWNSTREAM_CONSUMER_PINNED_JSON_INVALID', path));
    return null;
  }
}

function validateKernelPin(record, diagnostics) {
  const commit = record?.kernel_pin?.kernel_ref;
  if (record?.kernel_pin?.kernel_ref_type !== 'commit'
    || !/^[0-9a-f]{40}$/.test(commit || '')) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_IMMUTABLE_KERNEL_PIN_REQUIRED',
      'kernel_pin',
    ));
    return null;
  }

  try {
    git(['cat-file', '-e', `${commit}^{commit}`]);
  } catch {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PINNED_COMMIT_UNAVAILABLE',
      'kernel_pin.kernel_ref',
    ));
    return null;
  }

  try {
    git(['merge-base', '--is-ancestor', commit, 'HEAD']);
  } catch {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PINNED_COMMIT_NOT_ANCESTOR',
      'kernel_pin.kernel_ref',
    ));
    return null;
  }

  const manifest = readPinnedJson(
    commit,
    record.kernel_pin.contract_ref,
    diagnostics,
    'DOWNSTREAM_CONSUMER_PINNED_CONTRACT_MISSING',
  );
  if (!manifest) return null;

  if (manifest.contract_id !== 'kroad-010.downstream-consumer-contract.v0'
    || manifest.version !== '0.1.0') {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PINNED_CONTRACT_IDENTITY_INVALID',
      'kernel_pin.contract_ref',
    ));
    return null;
  }

  return commit;
}

function validatePinnedBytes(commit, paths, diagnostics) {
  for (const path of paths) {
    const pinned = readPinnedText(commit, path, diagnostics);
    if (pinned !== null && pinned !== readFileSync(join(ROOT, path), 'utf8')) {
      diagnostics.push(diagnostic('DOWNSTREAM_CONSUMER_PINNED_EXECUTION_DRIFT', path));
    }
  }
}

function schemaDiagnosticCode(error) {
  if (error.keyword === 'required') {
    return `SCHEMA_REQUIRED_${String(error.params.missingProperty)
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '_')}`;
  }
  return `SCHEMA_${String(error.keyword).toUpperCase()}`;
}

function schemaDiagnosticPath(error) {
  const base = error.instancePath
    ? error.instancePath.slice(1).replaceAll('/', '.')
    : '(root)';
  if (error.keyword !== 'required') return base;
  return base === '(root)'
    ? error.params.missingProperty
    : `${base}.${error.params.missingProperty}`;
}

function validateSchema(record, validateRecordSchema) {
  if (validateRecordSchema(record)) return [];
  return (validateRecordSchema.errors || [])
    .filter((error) => error.keyword !== 'if')
    .map((error) => diagnostic(
      schemaDiagnosticCode(error),
      schemaDiagnosticPath(error),
      'error',
      'schema',
      error.message,
    ));
}

export function validateManifest(manifest, packageJson) {
  const diagnostics = [];
  if (!isObject(manifest)) {
    return [diagnostic('DOWNSTREAM_CONSUMER_MANIFEST_OBJECT_REQUIRED', PATHS.manifest)];
  }

  if (manifest.contract_id !== 'kroad-010.downstream-consumer-contract.v0'
    || manifest.version !== '0.1.0') {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_MANIFEST_IDENTITY_INVALID',
      PATHS.manifest,
    ));
  }

  if (manifest.selected_consumer?.repository !== 'rezahh107/EV4-Architect-Repo'
    || manifest.selected_consumer?.role !== 'architect'
    || manifest.selected_consumer?.target_count !== 1) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_SINGLE_ARCHITECT_TARGET_REQUIRED',
      'selected_consumer',
    ));
  }

  const expectedRefs = {
    schema_ref: PATHS.schema,
    validator_ref: PATHS.validator,
    documentation_ref: PATHS.documentation,
    decision_record_schema_ref: PATHS.decisionRecordSchema,
    resolver_registry_ref: PATHS.resolverRegistry,
    l2_audit_ref: L2_AUDIT_REF,
  };
  for (const [field, expected] of Object.entries(expectedRefs)) {
    if (manifest[field] !== expected) {
      diagnostics.push(diagnostic('DOWNSTREAM_CONSUMER_MANIFEST_REF_MISMATCH', field));
    }
  }

  const insufficientPolicy = manifest.insufficient_evidence_policy;
  if (!sameStringSet(manifest.required_kernel_artifact_ref_fields, REQUIRED_KERNEL_REF_FIELDS)
    || !sameStringSet(
      insufficientPolicy?.decision_bearing_ref_fields_must_be_null,
      NULL_DECISION_REF_FIELDS,
    )
    || insufficientPolicy?.decision_fields_must_be_null !== true
    || insufficientPolicy?.missing_ref_set_must_equal_null_decision_ref_fields !== true) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_POLICY_INVALID',
      'insufficient_evidence_policy',
    ));
  }

  const pinPolicy = manifest.pin_snapshot_policy || {};
  for (const field of [
    'commit_must_exist',
    'commit_must_be_ancestor_of_validation_head',
    'contract_must_exist_at_pinned_commit',
    'all_referenced_artifacts_read_from_pinned_commit',
    'current_execution_files_must_match_pinned_snapshot',
  ]) {
    if (pinPolicy[field] !== true) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_PIN_POLICY_INVALID',
        `pin_snapshot_policy.${field}`,
      ));
    }
  }
  if (pinPolicy.shallow_checkout_allowed !== false) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PIN_POLICY_INVALID',
      'pin_snapshot_policy.shallow_checkout_allowed',
    ));
  }

  const expectedFixturePaths = PRIMARY_FIXTURE_CASES
    .map(({path}) => `kernel/fixtures/${path}`);
  const actualFixturePaths = [
    ...(manifest.fixtures?.valid || []),
    ...(manifest.fixtures?.invalid || []),
    ...(manifest.fixtures?.adversarial || []),
  ];
  if (!sameStringSet(expectedFixturePaths, actualFixturePaths)) {
    diagnostics.push(diagnostic('DOWNSTREAM_CONSUMER_FIXTURE_SET_INVALID', 'fixtures'));
  }

  for (const path of [
    PATHS.schema,
    PATHS.validator,
    PATHS.documentation,
    ...expectedFixturePaths,
  ]) {
    if (!existsSync(join(ROOT, path))) {
      diagnostics.push(diagnostic('DOWNSTREAM_CONSUMER_REFERENCED_ARTIFACT_MISSING', path));
    }
  }

  const scripts = packageJson.scripts || {};
  const primaryCommand = `node ${PATHS.validator}`;
  const mvkCommands = String(scripts['validate:mvk'] || '')
    .split('&&')
    .map((part) => part.trim());
  if (scripts['validate:downstream-consumer-contract'] !== primaryCommand
    || !mvkCommands.includes(primaryCommand)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PACKAGE_SCRIPT_MISMATCH',
      'package.json',
    ));
  }

  return diagnostics;
}

function validateInsufficientEvidence(record, expectedL2Status, warningCode, diagnostics) {
  const refs = record.kernel_artifact_refs || {};
  const decisionOutput = record.decision_output || {};

  if (NULL_DECISION_FIELDS.some((field) => decisionOutput[field] !== null)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_DECISION_FIELDS_FORBIDDEN',
      'decision_output',
    ));
  }
  if (NULL_DECISION_REF_FIELDS.some((field) => refs[field] !== null)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_ARTIFACT_REFS_FORBIDDEN',
      'kernel_artifact_refs',
    ));
  }
  if (!sameStringSet(record.missing_kernel_refs, NULL_DECISION_REF_FIELDS)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_MISSING_REF_SET_MISMATCH',
      'missing_kernel_refs',
    ));
  }
  if (decisionOutput.l2_audit_status !== expectedL2Status) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_L2_STATUS_INVALID',
      'decision_output.l2_audit_status',
    ));
  }
  if (decisionOutput.provisional !== true) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_MUST_BE_PROVISIONAL',
      'decision_output.provisional',
    ));
  }
  if (!(record.evidence_refs || []).every((item) => item?.source_type === 'evidence_gap')) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_GAP_SOURCE_REQUIRED',
      'evidence_refs',
    ));
  }
  if (!diagnostics.some((item) => item.severity === 'error')) {
    diagnostics.push(diagnostic(warningCode, 'decision_family_id', 'warning'));
  }
}

function validateDecisionEnvelope(
  record,
  commit,
  activeRule,
  decisionCardIds,
  decisionRecordSchema,
  diagnostics,
) {
  const refs = record.kernel_artifact_refs;
  const decisionRef = splitRef(refs.decision_record_ref);
  const envelope = readPinnedJson(commit, decisionRef.path, diagnostics);
  if (!envelope) return;

  if (decisionRef.fragment !== 'decision_record'
    || !isObject(envelope.decision_record)
    || !isObject(envelope.resolver_input)) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_DECISION_RECORD_ENVELOPE_INVALID',
      'kernel_artifact_refs.decision_record_ref',
    ));
    return;
  }

  validatePinnedBytes(commit, [
    PATHS.l2Validator,
    PATHS.resolverMvp,
    PATHS.resolverRegistry,
    activeRule.path,
    PATHS.decisionRecordSchema,
  ], diagnostics);
  if (diagnostics.some((item) => item.code === 'DOWNSTREAM_CONSUMER_PINNED_EXECUTION_DRIFT')) {
    return;
  }

  let validateDecisionRecordSchema;
  try {
    const ajv = new Ajv2020({allErrors: true, strict: false});
    addFormats(ajv);
    validateDecisionRecordSchema = ajv.compile(decisionRecordSchema);
  } catch {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_PINNED_DECISION_SCHEMA_COMPILE_FAILED',
      PATHS.decisionRecordSchema,
    ));
    return;
  }

  const decisionRecord = envelope.decision_record;
  const audit = auditDecisionRecord({
    decisionRecord,
    resolverInput: envelope.resolver_input,
    auditContext: envelope.audit_context || {},
    validateDecisionRecordSchema,
  });
  if (audit.audit_status !== 'pass') {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_REFERENCED_L2_AUDIT_NOT_PASS',
      'kernel_artifact_refs.l2_audit_result_ref',
    ));
  }

  const expectedDecisionOutput = {
    decision_id: decisionRecord.decision_id,
    resolver_status: decisionRecord.resolver_status,
    selected_option_id: decisionRecord.selected_option?.option_id,
    rule_id: decisionRecord.rule_id,
    rule_version: decisionRecord.rule_version,
  };
  for (const [field, expected] of Object.entries(expectedDecisionOutput)) {
    if (record.decision_output?.[field] !== expected) {
      diagnostics.push(diagnostic(
        `DOWNSTREAM_CONSUMER_${field.toUpperCase()}_MISMATCH`,
        `decision_output.${field}`,
      ));
    }
  }

  if (decisionRecord.decision_family_id !== record.decision_family_id
    || envelope.resolver_input.decision_family_id !== record.decision_family_id) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_DECISION_FAMILY_REF_MISMATCH',
      'decision_family_id',
    ));
  }

  const l2Ref = splitRef(refs.l2_audit_result_ref);
  const l2Envelope = readPinnedJson(commit, l2Ref.path, diagnostics);
  const l2Value = l2Ref.fragment
    ?.split('.')
    .reduce((current, segment) => current?.[segment], l2Envelope);
  if (l2Value !== 'pass') {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_MISMATCH',
      'kernel_artifact_refs.l2_audit_result_ref',
    ));
  }

  const decisionCardRef = splitRef(refs.decision_card_ref);
  if (decisionCardRef.path !== PATHS.decisionCards
    || !decisionCardIds.has(decisionCardRef.fragment)
    || decisionCardRef.fragment !== `v4.${record.decision_output?.selected_option_id}`) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_DECISION_CARD_REF_MISMATCH',
      'kernel_artifact_refs.decision_card_ref',
    ));
  }
}

export function validateConsumerRecord(record, compiledValidators) {
  const diagnostics = validateSchema(record, compiledValidators.recordSchema);
  if (!isObject(record)) {
    return [
      ...diagnostics,
      diagnostic('DOWNSTREAM_CONSUMER_RECORD_OBJECT_REQUIRED', '(root)'),
    ];
  }

  if (record.consumer?.repository !== 'rezahh107/EV4-Architect-Repo'
    || record.consumer?.role !== 'architect') {
    diagnostics.push(diagnostic('DOWNSTREAM_CONSUMER_TARGET_MISMATCH', 'consumer'));
  }

  const acknowledgements = new Set(record.forbidden_overclaims_acknowledged || []);
  for (const required of REQUIRED_OVERCLAIM_ACKNOWLEDGEMENTS) {
    if (!acknowledgements.has(required)) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_OVERCLAIM_ACKNOWLEDGEMENT_REQUIRED',
        'forbidden_overclaims_acknowledged',
      ));
    }
  }
  for (const [claim, code] of Object.entries(FORBIDDEN_CLAIMS)) {
    if (record.claims?.[claim] === true) diagnostics.push(diagnostic(code, `claims.${claim}`));
  }

  const commit = validateKernelPin(record, diagnostics);
  if (!commit) return diagnostics;

  validatePinnedBytes(commit, [PATHS.manifest, PATHS.schema, PATHS.validator], diagnostics);

  const refs = record.kernel_artifact_refs || {};
  const matrixRef = splitRef(refs.matrix_ref);
  const registryRef = splitRef(refs.resolver_registry_ref);
  const decisionSchemaRef = splitRef(refs.decision_record_schema_ref);
  const matrices = readPinnedJson(commit, matrixRef.path, diagnostics);
  const registry = readPinnedJson(commit, registryRef.path, diagnostics);
  const decisionRecordSchema = readPinnedJson(commit, decisionSchemaRef.path, diagnostics);
  if (!matrices || !registry || !decisionRecordSchema) return diagnostics;

  if (matrixRef.path !== PATHS.matrices
    || registryRef.path !== PATHS.resolverRegistry
    || decisionSchemaRef.path !== PATHS.decisionRecordSchema
    || refs.l2_audit_contract_ref !== L2_AUDIT_REF) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_KERNEL_REF_MISMATCH',
      'kernel_artifact_refs',
    ));
  }

  const matrix = (matrices.matrices || [])
    .find((item) => item.decision_family_id === record.decision_family_id);
  if (!matrix) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_UNKNOWN_DECISION_FAMILY',
      'decision_family_id',
    ));
    return diagnostics;
  }

  const activeRule = (registry.active_rules || [])
    .find((item) => item.decision_family_id === record.decision_family_id);
  if (record.consumption_status === 'insufficient_evidence') {
    validateInsufficientEvidence(
      record,
      activeRule ? 'not_run' : 'unsupported',
      activeRule
        ? 'DOWNSTREAM_CONSUMER_ACTIVE_FAMILY_INSUFFICIENT_EVIDENCE'
        : 'DOWNSTREAM_CONSUMER_RESOLVER_FAMILY_UNSUPPORTED',
      diagnostics,
    );
    return diagnostics;
  }

  if (!activeRule) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_UNSUPPORTED_RESOLVER_FAMILY',
      'decision_family_id',
    ));
    return diagnostics;
  }

  for (const field of REQUIRED_KERNEL_REF_FIELDS) {
    if (typeof refs[field] !== 'string' || !refs[field]) {
      diagnostics.push(diagnostic(
        'DOWNSTREAM_CONSUMER_REQUIRED_KERNEL_REF_MISSING',
        `kernel_artifact_refs.${field}`,
      ));
      if (field === 'decision_record_ref') {
        diagnostics.push(diagnostic(
          'DOWNSTREAM_CONSUMER_DECISION_RECORD_REF_REQUIRED',
          `kernel_artifact_refs.${field}`,
        ));
      }
      if (field === 'l2_audit_result_ref') {
        diagnostics.push(diagnostic(
          'DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_REQUIRED',
          `kernel_artifact_refs.${field}`,
        ));
      }
    }
  }

  const ruleRef = splitRef(refs.resolver_rule_ref);
  const pinnedRule = readPinnedJson(commit, ruleRef.path, diagnostics);
  if (!pinnedRule
    || ruleRef.path !== activeRule.path
    || ruleRef.fragment !== `${activeRule.rule_id}@${activeRule.rule_version}`) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_ACTIVE_RULE_REF_MISMATCH',
      'kernel_artifact_refs.resolver_rule_ref',
    ));
  }

  const verticalSliceRef = splitRef(refs.vertical_slice_ref);
  const verticalSlice = readPinnedJson(commit, verticalSliceRef.path, diagnostics);
  if (!verticalSlice
    || verticalSliceRef.path !== PATHS.verticalSlice
    || verticalSlice.decision_family_id !== record.decision_family_id) {
    diagnostics.push(diagnostic(
      'DOWNSTREAM_CONSUMER_KERNEL_REF_MISMATCH',
      'kernel_artifact_refs.vertical_slice_ref',
    ));
  }

  const decisionCardIds = new Set(
    (readPinnedJson(commit, PATHS.decisionCards, diagnostics)?.cards || [])
      .map((item) => item.element_id),
  );
  validateDecisionEnvelope(
    record,
    commit,
    activeRule,
    decisionCardIds,
    decisionRecordSchema,
    diagnostics,
  );
  return diagnostics;
}

export function createCompiledValidators() {
  const ajv = new Ajv2020({allErrors: true, strict: false});
  addFormats(ajv);
  return {recordSchema: ajv.compile(readJson(PATHS.schema))};
}

function observedStatus(record, diagnostics) {
  if (diagnostics.some((item) => item.severity !== 'warning')) return 'fail';
  if (record.consumption_status === 'insufficient_evidence') return 'insufficient_evidence';
  return 'pass';
}

export function runPrimaryValidator({json = false} = {}) {
  const output = ['KROAD-010 Downstream Consumer Contract validator summary'];
  const caseResults = [];
  let failed = false;
  let compiledValidators;

  try {
    compiledValidators = createCompiledValidators();
    const manifestDiagnostics = validateManifest(
      readJson(PATHS.manifest),
      readJson('package.json'),
    );
    if (manifestDiagnostics.length > 0) {
      failed = true;
      output.push(
        'Manifest: FAIL',
        ...manifestDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`),
      );
    } else {
      output.push('Manifest: PASS');
    }
  } catch (error) {
    failed = true;
    output.push(`Setup: FAIL ${error.message}`);
  }

  if (compiledValidators) {
    for (const testCase of PRIMARY_FIXTURE_CASES) {
      const fixture = readJson(`kernel/fixtures/${testCase.path}`);
      const diagnostics = validateConsumerRecord(fixture.record, compiledValidators);
      const status = observedStatus(fixture.record, diagnostics);
      const observedCodes = [...new Set(diagnostics.map((item) => item.code))];
      const missingDiagnostics = testCase.requiredDiagnostics
        .filter((code) => !observedCodes.includes(code));
      const passed = status === testCase.expectedStatus && missingDiagnostics.length === 0;

      caseResults.push({
        path: testCase.path,
        expected_status: testCase.expectedStatus,
        observed_status: status,
        required_diagnostic_codes: testCase.requiredDiagnostics,
        observed_diagnostic_codes: observedCodes,
        missing_diagnostic_codes: missingDiagnostics,
        passed,
      });

      if (!passed) {
        failed = true;
        output.push(
          `${testCase.path}: FAIL expected=${testCase.expectedStatus} observed=${status}`,
          ...missingDiagnostics.map((code) => `  - missing ${code}`),
          ...diagnostics.map((item) => `  - ${formatDiagnostic(item)}`),
        );
      } else {
        output.push(`${testCase.path}: PASS [${status}]`);
      }
    }
  }

  output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
  const result = {failed, output, cases: caseResults};
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.log(output.join('\n'));
  return result;
}

if (process.argv[1] === MODULE_PATH) {
  const result = runPrimaryValidator({json: process.argv.includes('--json')});
  process.exit(result.failed ? 1 : 0);
}
