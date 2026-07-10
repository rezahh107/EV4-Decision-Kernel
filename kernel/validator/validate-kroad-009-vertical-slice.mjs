#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
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
const resolverMvpPath = 'kernel/resolver-mvp/resolve-high-risk-p0.mjs';
const resolverEntrypointRef = `${resolverMvpPath}#resolveDecision`;
const l2ValidatorPath = 'kernel/validator/validate-l2-decision-correctness.mjs';
const l2AuditRef = `${l2ValidatorPath}#auditDecisionRecord`;
const validatorPath = 'kernel/validator/validate-kroad-009-vertical-slice.mjs';
const documentationPath = 'docs/decision-governance/KROAD_009_LAYOUT_STRUCTURE_VERTICAL_SLICE.md';
const packagePath = 'package.json';
const malformedNullFixturePath = 'kernel/fixtures/invalid/vertical_slice/malformed_null_vertical_slice_invalid.json';
const REQUIRED_CASE_KINDS = ['valid', 'invalid', 'adversarial'];
const EXPECTED_ACTIVE_FAMILIES = ['layout_structure'];
const EXPECTED_VALIDATION_COMMANDS = [
  'npm run validate:kroad-009-vertical-slice',
  'npm run validate:mvk',
  'npm run validate:roadmap-memory'
];
const REQUIRED_EXISTING_VALIDATORS = [
  'kernel/validator/validate-decision-record-v2.mjs',
  'kernel/validator/validate-resolver-contract.mjs',
  resolverMvpPath,
  'kernel/validator/validate-resolver-fixture-triplets.mjs',
  l2ValidatorPath
];
const CANONICAL_GRAPH_FILES = [
  matrixPath,
  registryPath,
  rulePath,
  tripletPolicyPath,
  decisionRecordSchemaPath,
  resolverMvpPath,
  l2ValidatorPath,
  validatorPath,
  documentationPath,
  packagePath
];
const FORBIDDEN_TRUE_BOUNDARIES = [
  'real_target_project_proof_claimed',
  'runtime_validation_claimed',
  'downstream_enforcement_claimed',
  'builder_execution_proof_claimed',
  'project_gate_acceptance_claimed',
  'production_readiness_claimed'
];
const REQUIRED_FALSE_SCOPE_BOUNDARIES = [
  'new_resolver_mvp_families_added',
  'kroad_010_downstream_consumer_contract_implemented',
  'project_gate_intake_implemented',
  'runtime_browser_evidence_implemented',
  'reaudit_policy_implemented',
  'all_p0_coverage_claimed',
  'downstream_enforcement_claimed',
  'builder_execution_proof_claimed',
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

function stringSet(values) {
  return new Set((Array.isArray(values) ? values : []).filter((value) => typeof value === 'string'));
}

function sameSet(left, right) {
  if (left.size !== right.size) return false;
  for (const value of left) if (!right.has(value)) return false;
  return true;
}

function sameOrderedStrings(left, right) {
  return Array.isArray(left)
    && left.length === right.length
    && left.every((value, index) => value === right[index]);
}

function cloneJson(value) {
  return JSON.parse(JSON.stringify(value));
}

function errorMessage(error) {
  return error instanceof Error ? error.message : String(error);
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

function exactFamilyScope(values) {
  return sameOrderedStrings(values, EXPECTED_ACTIVE_FAMILIES);
}

function validateArtifactGraph(manifest, matrixRegistry, registry, rule, policy, packageJson, artifactExists = (pathFromRoot) => existsSync(join(root, pathFromRoot))) {
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
  if (manifest.resolver_registry_ref !== registryPath || registry.registry_id !== 'resolver-rule-registry.v0') diagnostics.push(diagnostic('KROAD_009_RESOLVER_REGISTRY_REF_MISMATCH', 'Manifest resolver_registry_ref must resolve to the live resolver registry.', 'manifest.resolver_registry_ref'));
  if (manifest.resolver_entrypoint !== resolverEntrypointRef) diagnostics.push(diagnostic('KROAD_009_RESOLVER_ENTRYPOINT_REF_MISMATCH', 'Manifest resolver_entrypoint must resolve to the imported Resolver MVP entrypoint.', 'manifest.resolver_entrypoint'));
  if (manifest.decision_record_schema_ref !== decisionRecordSchemaPath) diagnostics.push(diagnostic('KROAD_009_DECISION_RECORD_SCHEMA_REF_MISMATCH', 'Manifest decision_record_schema_ref must resolve to the active Decision Record v2 schema.', 'manifest.decision_record_schema_ref'));
  if (manifest.fixture_triplet_policy_ref !== tripletPolicyPath || policy.policy_id !== 'resolver-fixture-triplet-policy.v0') diagnostics.push(diagnostic('KROAD_009_TRIPLET_POLICY_REF_MISMATCH', 'Manifest fixture_triplet_policy_ref must resolve to the live fixture-triplet policy.', 'manifest.fixture_triplet_policy_ref'));
  if (manifest.l2_audit_ref !== l2AuditRef) diagnostics.push(diagnostic('KROAD_009_L2_AUDIT_REF_MISMATCH', 'Manifest l2_audit_ref must resolve to the imported L2 audit entrypoint.', 'manifest.l2_audit_ref'));
  if (manifest.validator_ref !== validatorPath) diagnostics.push(diagnostic('KROAD_009_VALIDATOR_REF_MISMATCH', 'Manifest validator_ref must resolve to this validator.', 'manifest.validator_ref'));
  if (manifest.documentation_ref !== documentationPath) diagnostics.push(diagnostic('KROAD_009_DOCUMENTATION_REF_MISMATCH', 'Manifest documentation_ref must resolve to the KROAD-009 documentation.', 'manifest.documentation_ref'));

  for (const referencedPath of CANONICAL_GRAPH_FILES) {
    if (!artifactExists(referencedPath)) diagnostics.push(diagnostic('KROAD_009_REFERENCED_ARTIFACT_MISSING', `Required graph artifact ${referencedPath} is missing.`, referencedPath));
  }

  if (!activeRule || activeRule.rule_id !== rule.rule_id || activeRule.rule_version !== rule.rule_version || activeRule.path !== rulePath) diagnostics.push(diagnostic('KROAD_009_REGISTRY_RULE_ALIGNMENT_INVALID', 'Resolver registry must activate the exact layout_structure rule used by the slice.', registryPath));
  if (!exactFamilyScope((registry.active_rules || []).map((entry) => entry?.decision_family_id))) diagnostics.push(diagnostic('KROAD_009_ACTIVE_FAMILY_SCOPE_INVALID', 'The live active resolver-family set must be exactly layout_structure.', `${registryPath}.active_rules`));
  if (!exactFamilyScope(registry.resolver_mvp_scope?.covered_decision_families)) diagnostics.push(diagnostic('KROAD_009_RESOLVER_SCOPE_DECLARATION_INVALID', 'Resolver MVP covered families must be exactly layout_structure.', `${registryPath}.resolver_mvp_scope.covered_decision_families`));
  if (!exactFamilyScope(registry.l2_audit_scope?.covered_decision_families)) diagnostics.push(diagnostic('KROAD_009_L2_SCOPE_DECLARATION_INVALID', 'L2 covered families must be exactly layout_structure.', `${registryPath}.l2_audit_scope.covered_decision_families`));
  if (!exactFamilyScope(registry.fixture_triplet_scope?.covered_decision_families)) diagnostics.push(diagnostic('KROAD_009_TRIPLET_SCOPE_DECLARATION_INVALID', 'Fixture-triplet covered families must be exactly layout_structure.', `${registryPath}.fixture_triplet_scope.covered_decision_families`));
  if (!exactFamilyScope((policy.active_rule_triplets || []).map((entry) => entry?.decision_family_id))) diagnostics.push(diagnostic('KROAD_009_POLICY_FAMILY_SCOPE_INVALID', 'Fixture-triplet policy active family set must be exactly layout_structure.', `${tripletPolicyPath}.active_rule_triplets`));

  if (!policyEntry || policyEntry.rule_id !== rule.rule_id || policyEntry.rule_version !== rule.rule_version) diagnostics.push(diagnostic('KROAD_009_TRIPLET_POLICY_ENTRY_REQUIRED', 'Fixture triplet policy must cover the active layout_structure rule.', tripletPolicyPath));
  for (const kind of REQUIRED_CASE_KINDS) {
    const anchor = manifest.fixture_triplet_anchors?.[kind];
    const policyPaths = new Set((policyEntry?.triplet?.[kind] || []).map((entry) => entry?.path));
    if (!anchor || !policyPaths.has(anchor)) diagnostics.push(diagnostic('KROAD_009_TRIPLET_ANCHOR_NOT_ENFORCED', `Manifest ${kind} triplet anchor must be enforced by the active triplet policy.`, `manifest.fixture_triplet_anchors.${kind}`));
  }

  if (!sameSet(stringSet(manifest.required_existing_validators), new Set(REQUIRED_EXISTING_VALIDATORS)) || manifest.required_existing_validators?.length !== REQUIRED_EXISTING_VALIDATORS.length) diagnostics.push(diagnostic('KROAD_009_EXISTING_VALIDATOR_SET_INVALID', 'Manifest required_existing_validators must exactly match the canonical KROAD-009 validation path.', 'manifest.required_existing_validators'));

  if (manifest.source_evidence_boundary?.fixture_evidence_source_type !== 'kernel_fixture') diagnostics.push(diagnostic('KROAD_009_FIXTURE_SOURCE_TYPE_INVALID', 'Manifest fixture_evidence_source_type must be kernel_fixture.', 'manifest.source_evidence_boundary.fixture_evidence_source_type'));
  if (manifest.source_evidence_boundary?.synthetic_fixture_evidence_only !== true) diagnostics.push(diagnostic('KROAD_009_SYNTHETIC_BOUNDARY_REQUIRED', 'Manifest must state that fixture evidence is synthetic only.', 'manifest.source_evidence_boundary.synthetic_fixture_evidence_only'));
  for (const field of FORBIDDEN_TRUE_BOUNDARIES) {
    if (manifest.source_evidence_boundary?.[field] !== false) diagnostics.push(diagnostic('KROAD_009_MANIFEST_OVERCLAIM_BOUNDARY_INVALID', `Manifest boundary ${field} must be false.`, `manifest.source_evidence_boundary.${field}`));
  }
  for (const field of REQUIRED_FALSE_SCOPE_BOUNDARIES) {
    if (manifest.boundaries?.[field] !== false) diagnostics.push(diagnostic('KROAD_009_SCOPE_BOUNDARY_INVALID', `KROAD-009 scope boundary ${field} must remain false.`, `manifest.boundaries.${field}`));
  }

  if (!sameOrderedStrings(manifest.validation_commands, EXPECTED_VALIDATION_COMMANDS)) diagnostics.push(diagnostic('KROAD_009_VALIDATION_COMMANDS_INVALID', 'Manifest validation_commands must list the three canonical KROAD-009 validation commands in stable order.', 'manifest.validation_commands'));
  const scripts = isPlainObject(packageJson?.scripts) ? packageJson.scripts : {};
  if (scripts['validate:kroad-009-vertical-slice'] !== `node ${validatorPath}`) diagnostics.push(diagnostic('KROAD_009_PACKAGE_SCRIPT_MISMATCH', 'package.json must map validate:kroad-009-vertical-slice to the canonical validator.', `${packagePath}.scripts.validate:kroad-009-vertical-slice`));
  if (scripts['validate:roadmap-memory'] !== 'node tools/validate-roadmap-memory.mjs') diagnostics.push(diagnostic('KROAD_009_PACKAGE_SCRIPT_MISMATCH', 'package.json must retain the canonical roadmap-memory validator command.', `${packagePath}.scripts.validate:roadmap-memory`));
  const mvkSegments = new Set((typeof scripts['validate:mvk'] === 'string' ? scripts['validate:mvk'] : '').split('&&').map((segment) => segment.trim()).filter(Boolean));
  for (const requiredPath of [...REQUIRED_EXISTING_VALIDATORS, validatorPath]) {
    if (!mvkSegments.has(`node ${requiredPath}`)) diagnostics.push(diagnostic('KROAD_009_MVK_VALIDATION_PATH_MISSING', `validate:mvk must execute node ${requiredPath}.`, `${packagePath}.scripts.validate:mvk`));
  }

  return diagnostics;
}

function validateCase(caseMeta, validateDecisionRecordSchema, readCase = readJson) {
  if (!isPlainObject(caseMeta)
    || !REQUIRED_CASE_KINDS.includes(caseMeta.case_kind)
    || typeof caseMeta.path !== 'string'
    || caseMeta.path.trim().length === 0) {
    return {
      diagnostics: [diagnostic('KROAD_009_CASE_METADATA_INVALID', 'Vertical slice case metadata must be a plain object with a valid case_kind and non-empty string path.', 'manifest.vertical_slice_cases')],
      summary: null
    };
  }

  const diagnostics = [];
  const casePath = caseMeta.path;
  let fixture;
  try {
    fixture = readCase(casePath);
  } catch (error) {
    return { diagnostics: [diagnostic('KROAD_009_CASE_READ_FAILED', errorMessage(error), casePath)], summary: null };
  }

  if (!isPlainObject(fixture)) {
    return {
      diagnostics: [diagnostic('KROAD_009_CASE_SHAPE_INVALID', 'Vertical slice case must be a plain object.', casePath)],
      summary: null
    };
  }

  if (fixture.fixture_type !== 'kroad_009_vertical_slice_case') diagnostics.push(diagnostic('KROAD_009_CASE_SHAPE_INVALID', 'Vertical slice case must be a kroad_009_vertical_slice_case object.', casePath));
  if (fixture.case_kind !== caseMeta.case_kind) diagnostics.push(diagnostic('KROAD_009_CASE_KIND_MISMATCH', 'Manifest case_kind must match fixture case_kind.', `${casePath}.case_kind`));
  if (fixture.decision_family_id !== 'layout_structure' || fixture.resolver_input?.decision_family_id !== 'layout_structure' || fixture.decision_record?.decision_family_id !== 'layout_structure') diagnostics.push(diagnostic('KROAD_009_CASE_FAMILY_SCOPE_INVALID', 'Every vertical slice layer must remain layout_structure.', casePath));

  if (fixture.boundaries?.synthetic_fixture_evidence_only !== true) diagnostics.push(diagnostic('KROAD_009_CASE_SYNTHETIC_BOUNDARY_REQUIRED', 'Case must mark evidence as synthetic fixture evidence only.', `${casePath}.boundaries.synthetic_fixture_evidence_only`));
  for (const field of FORBIDDEN_TRUE_BOUNDARIES) {
    if (fixture.boundaries?.[field] !== false) diagnostics.push(diagnostic('KROAD_009_CASE_OVERCLAIM_BOUNDARY_INVALID', `Case boundary ${field} must be false.`, `${casePath}.boundaries.${field}`));
  }

  for (const [index, ref] of (fixture.resolver_input?.evidence_refs || []).entries()) {
    if (!hasSyntheticLimitations(ref)) diagnostics.push(diagnostic('KROAD_009_RESOLVER_EVIDENCE_BOUNDARY_INVALID', 'Resolver evidence must remain source_type=kernel_fixture, synthetic, not target-project proof, and not runtime validation.', `${casePath}.resolver_input.evidence_refs[${index}]`));
  }
  for (const [index, ref] of (fixture.decision_record?.evidence_refs || []).entries()) {
    if (!hasSyntheticLimitations(ref)) diagnostics.push(diagnostic('KROAD_009_DECISION_EVIDENCE_BOUNDARY_INVALID', 'Decision record evidence must remain source_type=kernel_fixture, synthetic, not target-project proof, and not runtime validation.', `${casePath}.decision_record.evidence_refs[${index}]`));
  }

  const expectedSchemaValid = fixture.expected_result?.schema_valid;
  const schemaValid = validateDecisionRecordSchema(fixture.decision_record);
  if (schemaValid !== expectedSchemaValid) diagnostics.push(diagnostic('KROAD_009_SCHEMA_EXPECTATION_MISMATCH', `Expected schema_valid=${expectedSchemaValid}, observed ${schemaValid}.`, `${casePath}.decision_record`));
  if (!schemaValid && expectedSchemaValid !== false) {
    for (const error of validateDecisionRecordSchema.errors || []) diagnostics.push(diagnostic('KROAD_009_DECISION_RECORD_SCHEMA_INVALID', error.message || 'Decision Record v2 schema validation failed.', `${casePath}.decision_record${error.instancePath || ''}`));
  }

  const resolverOutput = resolveDecision(fixture.resolver_input);
  const actualResolverOption = resolverOutput.selected_option?.option_id ?? null;
  if (resolverOutput.resolver_status !== fixture.expected_result?.resolver_status) diagnostics.push(diagnostic('KROAD_009_RESOLVER_STATUS_MISMATCH', `Expected resolver status ${fixture.expected_result?.resolver_status}, observed ${resolverOutput.resolver_status}.`, `${casePath}.expected_result.resolver_status`));
  if (actualResolverOption !== fixture.expected_result?.resolver_selected_option) diagnostics.push(diagnostic('KROAD_009_RESOLVER_SELECTED_OPTION_MISMATCH', `Expected resolver option ${fixture.expected_result?.resolver_selected_option}, observed ${actualResolverOption}.`, `${casePath}.expected_result.resolver_selected_option`));
  assertExpectedCodes(resolverOutput.diagnostics, fixture.expected_result?.resolver_diagnostic_codes, `${casePath}.expected_result.resolver_diagnostic_codes`, diagnostics);

  const auditResult = auditDecisionRecord({
    decisionRecord: fixture.decision_record,
    resolverInput: fixture.resolver_input,
    auditContext: fixture.audit_context || {},
    validateDecisionRecordSchema
  });
  if (auditResult.audit_status !== fixture.expected_result?.l2_audit_status) diagnostics.push(diagnostic('KROAD_009_L2_STATUS_MISMATCH', `Expected L2 status ${fixture.expected_result?.l2_audit_status}, observed ${auditResult.audit_status}.`, `${casePath}.expected_result.l2_audit_status`));
  assertExpectedCodes(auditResult.diagnostics, fixture.expected_result?.l2_diagnostic_codes, `${casePath}.expected_result.l2_diagnostic_codes`, diagnostics);

  if (caseMeta.case_kind === 'valid' && (!schemaValid || resolverOutput.resolver_status !== 'auto_resolved' || auditResult.audit_status !== 'pass')) diagnostics.push(diagnostic('KROAD_009_VALID_PATH_NOT_DETERMINISTIC_PASS', 'Valid vertical slice must pass schema, resolver, and L2 deterministically.', casePath));
  if (caseMeta.case_kind === 'invalid' && expectedSchemaValid === true) {
    if (!schemaValid) diagnostics.push(diagnostic('KROAD_009_INVALID_CASE_MUST_BE_SCHEMA_VALID', 'The resolver-wrong invalid vertical slice must remain schema-valid so L2 proves semantic rejection.', casePath));
    if (auditResult.audit_status !== 'fail' || !codes(auditResult.diagnostics).has('L2_SELECTED_OPTION_RESOLVER_MISMATCH')) diagnostics.push(diagnostic('KROAD_009_SCHEMA_VALID_RESOLVER_WRONG_NOT_REJECTED', 'Schema-valid resolver-wrong decision must fail L2 with selected-option mismatch.', casePath));
  }
  if (caseMeta.case_kind === 'adversarial' && !['conditional', 'unresolvable'].includes(resolverOutput.resolver_status)) diagnostics.push(diagnostic('KROAD_009_ADVERSARIAL_CASE_OVER_RESOLVED', 'Adversarial near-valid case must become conditional or unresolvable.', casePath));

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

function validateMalformedNullFixtureRegression(validateDecisionRecordSchema) {
  let result;
  try {
    result = validateCase(
      { case_kind: 'invalid', path: malformedNullFixturePath },
      validateDecisionRecordSchema
    );
  } catch (error) {
    return [diagnostic('KROAD_009_NULL_FIXTURE_REGRESSION_CRASHED', `Malformed null fixture caused an unexpected exception: ${errorMessage(error)}`, malformedNullFixturePath)];
  }

  const regressionDiagnostics = [];
  const observedCodes = codes(result.diagnostics);
  if (!observedCodes.has('KROAD_009_CASE_SHAPE_INVALID')) regressionDiagnostics.push(diagnostic('KROAD_009_NULL_FIXTURE_REGRESSION_DIAGNOSTIC_MISSING', 'Malformed null fixture must return KROAD_009_CASE_SHAPE_INVALID.', malformedNullFixturePath));
  if (result.summary !== null) regressionDiagnostics.push(diagnostic('KROAD_009_NULL_FIXTURE_REGRESSION_SUMMARY_INVALID', 'Malformed null fixture must not produce a case summary.', malformedNullFixturePath));
  if ((result.diagnostics || []).some((item) => !isPlainObject(item) || typeof item.code !== 'string' || item.code.length === 0)) regressionDiagnostics.push(diagnostic('KROAD_009_NULL_FIXTURE_REGRESSION_DIAGNOSTIC_NOT_MACHINE_READABLE', 'Malformed null fixture diagnostics must remain machine-readable objects with stable codes.', malformedNullFixturePath));
  return regressionDiagnostics;
}

function validateMalformedCaseMetadataRegressions(validateDecisionRecordSchema) {
  const malformedCases = [
    { label: 'null', value: null },
    { label: 'primitive', value: 'invalid-case' },
    { label: 'empty-object', value: {} },
    { label: 'missing-path', value: { case_kind: 'invalid' } },
    { label: 'non-string-path', value: { case_kind: 'invalid', path: 42 } }
  ];
  const regressionDiagnostics = [];

  for (const regression of malformedCases) {
    let readInvoked = false;
    let result;
    try {
      result = validateCase(regression.value, validateDecisionRecordSchema, () => {
        readInvoked = true;
        return {};
      });
    } catch (error) {
      regressionDiagnostics.push(diagnostic('KROAD_009_CASE_METADATA_REGRESSION_CRASHED', `${regression.label} metadata caused an unexpected exception: ${errorMessage(error)}`, `regression.case_metadata.${regression.label}`));
      continue;
    }

    if (!codes(result.diagnostics).has('KROAD_009_CASE_METADATA_INVALID')) regressionDiagnostics.push(diagnostic('KROAD_009_CASE_METADATA_REGRESSION_DIAGNOSTIC_MISSING', `${regression.label} metadata must return KROAD_009_CASE_METADATA_INVALID.`, `regression.case_metadata.${regression.label}`));
    if (result.summary !== null) regressionDiagnostics.push(diagnostic('KROAD_009_CASE_METADATA_REGRESSION_SUMMARY_INVALID', `${regression.label} metadata must not produce a case summary.`, `regression.case_metadata.${regression.label}`));
    if (readInvoked) regressionDiagnostics.push(diagnostic('KROAD_009_CASE_METADATA_REGRESSION_READ_OCCURRED', `${regression.label} metadata must fail before fixture reading.`, `regression.case_metadata.${regression.label}`));
    if ((result.diagnostics || []).some((item) => !isPlainObject(item) || typeof item.code !== 'string' || item.code.length === 0)) regressionDiagnostics.push(diagnostic('KROAD_009_CASE_METADATA_REGRESSION_NOT_MACHINE_READABLE', `${regression.label} metadata diagnostics must remain machine-readable.`, `regression.case_metadata.${regression.label}`));
  }

  return regressionDiagnostics;
}

function validateArtifactGraphRegressions(liveInputs) {
  const regressionCases = [
    { label: 'resolver-registry-ref', expectedCode: 'KROAD_009_RESOLVER_REGISTRY_REF_MISMATCH', mutate: ({ manifest }) => { manifest.resolver_registry_ref = 'stale/resolver-registry.json'; } },
    { label: 'resolver-entrypoint-ref', expectedCode: 'KROAD_009_RESOLVER_ENTRYPOINT_REF_MISMATCH', mutate: ({ manifest }) => { manifest.resolver_entrypoint = `${resolverMvpPath}#staleResolver`; } },
    { label: 'decision-record-schema-ref', expectedCode: 'KROAD_009_DECISION_RECORD_SCHEMA_REF_MISMATCH', mutate: ({ manifest }) => { manifest.decision_record_schema_ref = 'kernel/schemas/stale.schema.json'; } },
    { label: 'triplet-policy-ref', expectedCode: 'KROAD_009_TRIPLET_POLICY_REF_MISMATCH', mutate: ({ manifest }) => { manifest.fixture_triplet_policy_ref = 'kernel/decision-governance/stale-policy.json'; } },
    { label: 'l2-audit-ref', expectedCode: 'KROAD_009_L2_AUDIT_REF_MISMATCH', mutate: ({ manifest }) => { manifest.l2_audit_ref = `${l2ValidatorPath}#staleAudit`; } },
    { label: 'validator-ref', expectedCode: 'KROAD_009_VALIDATOR_REF_MISMATCH', mutate: ({ manifest }) => { manifest.validator_ref = 'kernel/validator/stale-validator.mjs'; } },
    { label: 'documentation-ref', expectedCode: 'KROAD_009_DOCUMENTATION_REF_MISMATCH', mutate: ({ manifest }) => { manifest.documentation_ref = 'docs/decision-governance/STALE.md'; } },
    { label: 'required-validator-set', expectedCode: 'KROAD_009_EXISTING_VALIDATOR_SET_INVALID', mutate: ({ manifest }) => { manifest.required_existing_validators.push('kernel/validator/stale.mjs'); } },
    { label: 'fixture-source-type', expectedCode: 'KROAD_009_FIXTURE_SOURCE_TYPE_INVALID', mutate: ({ manifest }) => { manifest.source_evidence_boundary.fixture_evidence_source_type = 'target_project'; } },
    { label: 'validation-commands', expectedCode: 'KROAD_009_VALIDATION_COMMANDS_INVALID', mutate: ({ manifest }) => { manifest.validation_commands[0] = 'npm run stale'; } },
    { label: 'package-script', expectedCode: 'KROAD_009_PACKAGE_SCRIPT_MISMATCH', mutate: ({ packageJson }) => { packageJson.scripts['validate:kroad-009-vertical-slice'] = 'node stale.mjs'; } },
    { label: 'mvk-path', expectedCode: 'KROAD_009_MVK_VALIDATION_PATH_MISSING', mutate: ({ packageJson }) => { packageJson.scripts['validate:mvk'] = packageJson.scripts['validate:mvk'].replace(` && node ${validatorPath}`, ''); } },
    { label: 'active-family-set', expectedCode: 'KROAD_009_ACTIVE_FAMILY_SCOPE_INVALID', mutate: ({ registry }) => { registry.active_rules.push({ decision_family_id: 'media_choice' }); } },
    { label: 'resolver-covered-family-set', expectedCode: 'KROAD_009_RESOLVER_SCOPE_DECLARATION_INVALID', mutate: ({ registry }) => { registry.resolver_mvp_scope.covered_decision_families.push('media_choice'); } },
    { label: 'l2-covered-family-set', expectedCode: 'KROAD_009_L2_SCOPE_DECLARATION_INVALID', mutate: ({ registry }) => { registry.l2_audit_scope.covered_decision_families.push('media_choice'); } },
    { label: 'triplet-covered-family-set', expectedCode: 'KROAD_009_TRIPLET_SCOPE_DECLARATION_INVALID', mutate: ({ registry }) => { registry.fixture_triplet_scope.covered_decision_families.push('media_choice'); } },
    { label: 'policy-family-set', expectedCode: 'KROAD_009_POLICY_FAMILY_SCOPE_INVALID', mutate: ({ policy }) => { policy.active_rule_triplets.push({ decision_family_id: 'media_choice' }); } },
    { label: 'missing-documentation', expectedCode: 'KROAD_009_REFERENCED_ARTIFACT_MISSING', artifactExists: (pathFromRoot) => pathFromRoot !== documentationPath, mutate: () => {} }
  ];
  const regressionDiagnostics = [];

  for (const regression of regressionCases) {
    const inputs = {
      manifest: cloneJson(liveInputs.manifest),
      matrixRegistry: cloneJson(liveInputs.matrixRegistry),
      registry: cloneJson(liveInputs.registry),
      rule: cloneJson(liveInputs.rule),
      policy: cloneJson(liveInputs.policy),
      packageJson: cloneJson(liveInputs.packageJson)
    };
    try {
      regression.mutate(inputs);
      const result = validateArtifactGraph(
        inputs.manifest,
        inputs.matrixRegistry,
        inputs.registry,
        inputs.rule,
        inputs.policy,
        inputs.packageJson,
        regression.artifactExists || (() => true)
      );
      if (!codes(result).has(regression.expectedCode)) regressionDiagnostics.push(diagnostic('KROAD_009_GRAPH_REGRESSION_DIAGNOSTIC_MISSING', `${regression.label} mutation must emit ${regression.expectedCode}.`, `regression.graph.${regression.label}`));
      if (result.some((item) => !isPlainObject(item) || typeof item.code !== 'string' || item.code.length === 0)) regressionDiagnostics.push(diagnostic('KROAD_009_GRAPH_REGRESSION_NOT_MACHINE_READABLE', `${regression.label} mutation diagnostics must remain machine-readable.`, `regression.graph.${regression.label}`));
    } catch (error) {
      regressionDiagnostics.push(diagnostic('KROAD_009_GRAPH_REGRESSION_CRASHED', `${regression.label} mutation caused an unexpected exception: ${errorMessage(error)}`, `regression.graph.${regression.label}`));
    }
  }

  return regressionDiagnostics;
}

function runValidation() {
  const output = ['KROAD-009 layout_structure vertical slice validator summary'];
  const diagnostics = [];
  let manifest;
  let validateDecisionRecordSchema;
  let liveInputs;
  let malformedNullRegressionPassed = false;
  let malformedMetadataRegressionPassed = false;
  let graphRegressionPassed = false;

  try {
    manifest = readJson(manifestPath);
    const ajv = new Ajv2020({ allErrors: true, strict: false });
    addFormats(ajv);
    validateDecisionRecordSchema = ajv.compile(readJson(decisionRecordSchemaPath));
    liveInputs = {
      manifest,
      matrixRegistry: readJson(matrixPath),
      registry: readJson(registryPath),
      rule: readJson(rulePath),
      policy: readJson(tripletPolicyPath),
      packageJson: readJson(packagePath)
    };
    diagnostics.push(...validateArtifactGraph(
      liveInputs.manifest,
      liveInputs.matrixRegistry,
      liveInputs.registry,
      liveInputs.rule,
      liveInputs.policy,
      liveInputs.packageJson
    ));

    const graphRegressionDiagnostics = validateArtifactGraphRegressions(liveInputs);
    graphRegressionPassed = graphRegressionDiagnostics.length === 0;
    diagnostics.push(...graphRegressionDiagnostics);
  } catch (error) {
    diagnostics.push(diagnostic('KROAD_009_SETUP_FAILED', errorMessage(error), manifestPath));
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

    const nullRegressionDiagnostics = validateMalformedNullFixtureRegression(validateDecisionRecordSchema);
    malformedNullRegressionPassed = nullRegressionDiagnostics.length === 0;
    diagnostics.push(...nullRegressionDiagnostics);

    const metadataRegressionDiagnostics = validateMalformedCaseMetadataRegressions(validateDecisionRecordSchema);
    malformedMetadataRegressionPassed = metadataRegressionDiagnostics.length === 0;
    diagnostics.push(...metadataRegressionDiagnostics);
  }

  if (diagnostics.length === 0) {
    output.push('Artifact graph: PASS');
    if (graphRegressionPassed) output.push('Artifact graph negative regressions: PASS');
    for (const summary of caseSummaries) output.push(`${summary.case_kind}: PASS [schema=${summary.schema_valid ? 'valid' : 'invalid'} resolver=${summary.resolver_status} l2=${summary.l2_audit_status}]`);
    if (malformedNullRegressionPassed) output.push('Malformed null fixture fail-closed regression: PASS [KROAD_009_CASE_SHAPE_INVALID]');
    if (malformedMetadataRegressionPassed) output.push('Malformed case metadata fail-closed regressions: PASS [KROAD_009_CASE_METADATA_INVALID]');
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
