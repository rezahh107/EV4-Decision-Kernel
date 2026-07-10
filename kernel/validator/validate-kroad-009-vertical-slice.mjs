#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { resolveDecision } from '../resolver-mvp/resolve-high-risk-p0.mjs';
import { auditDecisionRecord } from './validate-l2-decision-correctness.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const manifestPath = 'kernel/decision-governance/kroad-009-layout-structure-vertical-slice.v0.json';
const matrixPath = 'kernel/decision-governance/p0-decision-matrices.v0.json';
const registryPath = 'kernel/decision-governance/resolver-rule-registry.v0.json';
const rulePath = 'kernel/decision-governance/resolver-rules/layout-structure.v0.json';
const tripletPolicyPath = 'kernel/decision-governance/resolver-fixture-triplet-policy.v0.json';
const decisionRecordSchemaPath = 'kernel/schemas/decision-record.v2.schema.json';
const REQUIRED_CASE_KINDS = ['valid', 'invalid', 'adversarial'];
const FORBIDDEN_TRUE_BOUNDARIES = [
  'real_target_project_proof_claimed',
  'runtime_validation_claimed',
  'downstream_enforcement_claimed',
  'builder_execution_proof_claimed',
  'project_gate_acceptance_claimed',
  'production_readiness_claimed'
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(root, pathFromRoot), 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function diagnostic(code, message, path, severity = 'error') {
  return { code, severity, message, path };
}

function codes(items) {
  return new Set((items || []).map((item) => item.code));
}

function optionIds(options) {
  return new Set((Array.isArray(options) ? options : []).map((item) => item?.option_id).filter(Boolean));
}

function sameSet(left, right) {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

function assertExpectedCodes(actualDiagnostics, expectedCodes, path, diagnostics) {
  const observed = codes(actualDiagnostics);
  for (const expectedCode of expectedCodes || []) {
    if (!observed.has(expectedCode)) {
      diagnostics.push(diagnostic('KROAD_009_EXPECTED_DIAGNOSTIC_MISSING', `Expected diagnostic ${expectedCode} was not emitted.`, path));
    }
  }
}

function hasSyntheticLimitations(ref) {
  const limitations = Array.isArray(ref?.limitations) ? ref.limitations.join(' ').toLowerCase() : '';
  const saysSynthetic = limitations.includes('fixture') || limitations.includes('matrix guidance');
  const saysNotReal = limitations.includes('not real target-project evidence') || limitations.includes('not real target-project proof') || limitations.includes('does not prove target project availability');
  const saysNotRuntime = limitations.includes('not runtime validation');
  return ref?.source_type === 'kernel_fixture' && saysSynthetic && saysNotReal && saysNotRuntime;
}

function validateArtifactGraph(manifest, matrixRegistry, registry, rule, policy) {
  const diagnostics = [];
  const matrix = (matrixRegistry.matrices || []).find((entry) => entry?.decision_family_id === 'layout_structure');
  const activeRule = (registry.active_rules || []).find((entry) => entry?.decision_family_id === 'layout_structure');
  const policyEntry = (policy.active_rule_triplets || []).find((entry) => entry?.decision_family_id === 'layout_structure');

  if (manifest.decision_family_id !== 'layout_structure') diagnostics.push(diagnostic('KROAD_009_FAMILY_SCOPE_INVALID', 'Vertical slice must remain limited to layout_structure.', 'manifest.decision_family_id'));
  if (manifest.matrix_ref?.path !== matrixPath || manifest.matrix_ref?.registry_id !== matrixRegistry.matrix_registry_id || manifest.matrix_ref?.matrix_id !== matrix?.matrix_id) diagnostics.push(diagnostic('KROAD_009_MATRIX_REF_MISMATCH', 'Manifest matrix_ref must resolve to the live layout_structure matrix.', 'manifest.matrix_ref'));
  if (!matrix || matrix.matrix_id !== 'p0.matrix.layout_structure.v0') diagnostics.push(diagnostic('KROAD_009_LAYOUT_MATRIX_REQUIRED', 'The layout_structure P0 matrix must exist.', matrixPath));
  if (matrix && !sameSet(optionIds(matrix.candidate_options), new Set(['div_block', 'flexbox', 'grid']))) diagnostics.push(diagnostic('KROAD_009_MATRIX_OPTION_SET_INVALID', 'layout_structure matrix must expose div_block, flexbox, and grid.', `${matrixPath}#layout_structure.candidate_options`));

  if (manifest.resolver_rule_ref?.path !== rulePath || manifest.resolver_rule_ref?.rule_id !== rule.rule_id || manifest.resolver_rule_ref?.rule_version !== rule.rule_version) diagnostics.push(diagnostic('KROAD_009_RULE_REF_MISMATCH', 'Manifest resolver_rule_ref must resolve to the active layout_structure rule.', 'manifest.resolver_rule_ref'));
  if (rule.decision_family_id !== 'layout_structure' || rule.matrix_ref?.matrix_id !== matrix?.matrix_id) diagnostics.push(diagnostic('KROAD_009_RULE_MATRIX_ALIGNMENT_INVALID', 'Active rule must remain aligned to the layout_structure matrix.', rulePath));
  if (!activeRule || activeRule.rule_id !== rule.rule_id || activeRule.rule_version !== rule.rule_version || activeRule.path !== rulePath) diagnostics.push(diagnostic('KROAD_009_REGISTRY_RULE_ALIGNMENT_INVALID', 'Resolver registry must activate the exact layout_structure rule used by the slice.', registryPath));

  if (!policyEntry || policyEntry.rule_id !== rule.rule_id || policyEntry.rule_version !== rule.rule_version) diagnostics.push(diagnostic('KROAD_009_TRIPLET_POLICY_ENTRY_REQUIRED', 'Fixture triplet policy must cover the active layout_structure rule.', tripletPolicyPath));
  for (const kind of REQUIRED_CASE_KINDS) {
    const anchor = manifest.fixture_triplet_anchors?.[kind];
    const policyPaths = new Set((policyEntry?.triplet?.[kind] || []).map((entry) => entry?.path));
    if (!anchor || !policyPaths.has(anchor)) diagnostics.push(diagnostic('KROAD_009_TRIPLET_ANCHOR_NOT_ENFORCED', `Manifest ${kind} triplet anchor must be enforced by the active triplet policy.`, `manifest.fixture_triplet_anchors.${kind}`));
  }

  const requiredValidators = new Set(manifest.required_existing_validators || []);
  for (const required of [
    'kernel/validator/validate-decision-record-v2.mjs',
    'kernel/validator/validate-resolver-contract.mjs',
    'kernel/resolver-mvp/resolve-high-risk-p0.mjs',
    'kernel/validator/validate-resolver-fixture-triplets.mjs',
    'kernel/validator/validate-l2-decision-correctness.mjs'
  ]) {
    if (!requiredValidators.has(required)) diagnostics.push(diagnostic('KROAD_009_EXISTING_VALIDATOR_NOT_CONNECTED', `Vertical slice manifest must retain ${required} in its validation path.`, 'manifest.required_existing_validators'));
  }

  if (manifest.source_evidence_boundary?.synthetic_fixture_evidence_only !== true) diagnostics.push(diagnostic('KROAD_009_SYNTHETIC_BOUNDARY_REQUIRED', 'Manifest must state that fixture evidence is synthetic only.', 'manifest.source_evidence_boundary.synthetic_fixture_evidence_only'));
  for (const field of FORBIDDEN_TRUE_BOUNDARIES) {
    if (manifest.source_evidence_boundary?.[field] !== false) diagnostics.push(diagnostic('KROAD_009_MANIFEST_OVERCLAIM_BOUNDARY_INVALID', `Manifest boundary ${field} must be false.`, `manifest.source_evidence_boundary.${field}`));
  }

  return diagnostics;
}

function validateCase(caseMeta, validateDecisionRecordSchema) {
  const diagnostics = [];
  let fixture;
  try {
    fixture = readJson(caseMeta.path);
  } catch (error) {
    return { diagnostics: [diagnostic('KROAD_009_CASE_READ_FAILED', error.message, caseMeta.path)], summary: null };
  }

  if (!isPlainObject(fixture) || fixture.fixture_type !== 'kroad_009_vertical_slice_case') diagnostics.push(diagnostic('KROAD_009_CASE_SHAPE_INVALID', 'Vertical slice case must be a kroad_009_vertical_slice_case object.', caseMeta.path));
  if (fixture.case_kind !== caseMeta.case_kind) diagnostics.push(diagnostic('KROAD_009_CASE_KIND_MISMATCH', 'Manifest case_kind must match fixture case_kind.', `${caseMeta.path}.case_kind`));
  if (fixture.decision_family_id !== 'layout_structure' || fixture.resolver_input?.decision_family_id !== 'layout_structure' || fixture.decision_record?.decision_family_id !== 'layout_structure') diagnostics.push(diagnostic('KROAD_009_CASE_FAMILY_SCOPE_INVALID', 'Every vertical slice layer must remain layout_structure.', caseMeta.path));

  if (fixture.boundaries?.synthetic_fixture_evidence_only !== true) diagnostics.push(diagnostic('KROAD_009_CASE_SYNTHETIC_BOUNDARY_REQUIRED', 'Case must mark evidence as synthetic fixture evidence only.', `${caseMeta.path}.boundaries.synthetic_fixture_evidence_only`));
  for (const field of FORBIDDEN_TRUE_BOUNDARIES) {
    if (fixture.boundaries?.[field] !== false) diagnostics.push(diagnostic('KROAD_009_CASE_OVERCLAIM_BOUNDARY_INVALID', `Case boundary ${field} must be false.`, `${caseMeta.path}.boundaries.${field}`));
  }

  for (const [index, ref] of (fixture.resolver_input?.evidence_refs || []).entries()) {
    if (!hasSyntheticLimitations(ref)) diagnostics.push(diagnostic('KROAD_009_RESOLVER_EVIDENCE_BOUNDARY_INVALID', 'Resolver evidence must remain source_type=kernel_fixture, synthetic, not target-project proof, and not runtime validation.', `${caseMeta.path}.resolver_input.evidence_refs[${index}]`));
  }
  for (const [index, ref] of (fixture.decision_record?.evidence_refs || []).entries()) {
    if (!hasSyntheticLimitations(ref)) diagnostics.push(diagnostic('KROAD_009_DECISION_EVIDENCE_BOUNDARY_INVALID', 'Decision record evidence must remain source_type=kernel_fixture, synthetic, not target-project proof, and not runtime validation.', `${caseMeta.path}.decision_record.evidence_refs[${index}]`));
  }

  const schemaValid = validateDecisionRecordSchema(fixture.decision_record);
  if (schemaValid !== fixture.expected_result?.schema_valid) diagnostics.push(diagnostic('KROAD_009_SCHEMA_EXPECTATION_MISMATCH', `Expected schema_valid=${fixture.expected_result?.schema_valid}, observed ${schemaValid}.`, `${caseMeta.path}.decision_record`));
  if (!schemaValid) {
    for (const error of validateDecisionRecordSchema.errors || []) diagnostics.push(diagnostic('KROAD_009_DECISION_RECORD_SCHEMA_INVALID', error.message || 'Decision Record v2 schema validation failed.', `${caseMeta.path}.decision_record${error.instancePath || ''}`));
  }

  const resolverOutput = resolveDecision(fixture.resolver_input);
  const actualResolverOption = resolverOutput.selected_option?.option_id ?? null;
  if (resolverOutput.resolver_status !== fixture.expected_result?.resolver_status) diagnostics.push(diagnostic('KROAD_009_RESOLVER_STATUS_MISMATCH', `Expected resolver status ${fixture.expected_result?.resolver_status}, observed ${resolverOutput.resolver_status}.`, `${caseMeta.path}.expected_result.resolver_status`));
  if (actualResolverOption !== fixture.expected_result?.resolver_selected_option) diagnostics.push(diagnostic('KROAD_009_RESOLVER_SELECTED_OPTION_MISMATCH', `Expected resolver option ${fixture.expected_result?.resolver_selected_option}, observed ${actualResolverOption}.`, `${caseMeta.path}.expected_result.resolver_selected_option`));
  assertExpectedCodes(resolverOutput.diagnostics, fixture.expected_result?.resolver_diagnostic_codes, `${caseMeta.path}.expected_result.resolver_diagnostic_codes`, diagnostics);

  const auditResult = auditDecisionRecord({
    decisionRecord: fixture.decision_record,
    resolverInput: fixture.resolver_input,
    auditContext: fixture.audit_context || {},
    validateDecisionRecordSchema
  });
  if (auditResult.audit_status !== fixture.expected_result?.l2_audit_status) diagnostics.push(diagnostic('KROAD_009_L2_STATUS_MISMATCH', `Expected L2 status ${fixture.expected_result?.l2_audit_status}, observed ${auditResult.audit_status}.`, `${caseMeta.path}.expected_result.l2_audit_status`));
  assertExpectedCodes(auditResult.diagnostics, fixture.expected_result?.l2_diagnostic_codes, `${caseMeta.path}.expected_result.l2_diagnostic_codes`, diagnostics);

  if (caseMeta.case_kind === 'valid' && (!schemaValid || resolverOutput.resolver_status !== 'auto_resolved' || auditResult.audit_status !== 'pass')) diagnostics.push(diagnostic('KROAD_009_VALID_PATH_NOT_DETERMINISTIC_PASS', 'Valid vertical slice must pass schema, resolver, and L2 deterministically.', caseMeta.path));
  if (caseMeta.case_kind === 'invalid') {
    if (!schemaValid) diagnostics.push(diagnostic('KROAD_009_INVALID_CASE_MUST_BE_SCHEMA_VALID', 'Invalid vertical slice must be schema-valid so L2 proves semantic rejection.', caseMeta.path));
    if (auditResult.audit_status !== 'fail' || !codes(auditResult.diagnostics).has('L2_SELECTED_OPTION_RESOLVER_MISMATCH')) diagnostics.push(diagnostic('KROAD_009_SCHEMA_VALID_RESOLVER_WRONG_NOT_REJECTED', 'Schema-valid resolver-wrong decision must fail L2 with selected-option mismatch.', caseMeta.path));
  }
  if (caseMeta.case_kind === 'adversarial' && !['conditional', 'unresolvable'].includes(resolverOutput.resolver_status)) diagnostics.push(diagnostic('KROAD_009_ADVERSARIAL_CASE_OVER_RESOLVED', 'Adversarial near-valid case must become conditional or unresolvable.', caseMeta.path));

  return {
    diagnostics,
    summary: {
      case_kind: caseMeta.case_kind,
      schema_valid: schemaValid,
      resolver_status: resolverOutput.resolver_status,
      l2_audit_status: auditResult.audit_status
    }
  };
}

function runValidation() {
  const output = ['KROAD-009 layout_structure vertical slice validator summary'];
  const diagnostics = [];
  let manifest;
  let validateDecisionRecordSchema;

  try {
    manifest = readJson(manifestPath);
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    validateDecisionRecordSchema = ajv.compile(readJson(decisionRecordSchemaPath));
    diagnostics.push(...validateArtifactGraph(
      manifest,
      readJson(matrixPath),
      readJson(registryPath),
      readJson(rulePath),
      readJson(tripletPolicyPath)
    ));
  } catch (error) {
    diagnostics.push(diagnostic('KROAD_009_SETUP_FAILED', error.message, manifestPath));
  }

  const caseSummaries = [];
  if (manifest && validateDecisionRecordSchema) {
    const cases = Array.isArray(manifest.vertical_slice_cases) ? manifest.vertical_slice_cases : [];
    const observedKinds = cases.map((entry) => entry?.case_kind);
    if (JSON.stringify(observedKinds) !== JSON.stringify(REQUIRED_CASE_KINDS)) diagnostics.push(diagnostic('KROAD_009_CASE_TRIPLET_INVALID', 'Manifest must list valid, invalid, and adversarial vertical slice cases in stable order.', 'manifest.vertical_slice_cases'));

    for (const caseMeta of cases) {
      const result = validateCase(caseMeta, validateDecisionRecordSchema);
      diagnostics.push(...result.diagnostics);
      if (result.summary) caseSummaries.push(result.summary);
    }
  }

  if (diagnostics.length === 0) {
    output.push('Artifact graph: PASS');
    for (const summary of caseSummaries) output.push(`${summary.case_kind}: PASS [schema=${summary.schema_valid ? 'valid' : 'invalid'} resolver=${summary.resolver_status} l2=${summary.l2_audit_status}]`);
    output.push('Synthetic evidence boundary: PASS');
    output.push('KROAD-010+ boundary: PASS');
    output.push('Result: PASS');
    console.log(output.join('\n'));
    process.exit(0);
  }

  output.push('Artifact graph or cases: FAIL');
  for (const item of diagnostics) output.push(`  - ${item.code} [${item.severity}] ${item.path}: ${item.message}`);
  output.push('Result: FAIL');
  console.error(output.join('\n'));
  process.exit(1);
}

runValidation();
