#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { resolveDecision } from '../resolver-mvp/resolve-high-risk-p0.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const decisionRecordSchemaPath = 'kernel/schemas/decision-record.v2.schema.json';
const resolverRegistryPath = 'kernel/decision-governance/resolver-rule-registry.v0.json';

const EVIDENCE_TIER_RANK = new Map([
  ['none', 0],
  ['official_docs', 1],
  ['project_export', 2],
  ['runtime_browser', 3],
  ['downstream_validated', 4]
]);

const fixturePlan = [
  {
    path: 'valid/l2_decision_correctness/layout_structure_auto_resolved_flexbox_pass.json',
    expectedStatus: 'pass',
    expectedCodes: []
  },
  {
    path: 'valid/l2_decision_correctness/layout_structure_conditional_official_docs_pass.json',
    expectedStatus: 'pass',
    expectedCodes: ['L2_DECISION_REQUIRES_REAUDIT']
  },
  {
    path: 'valid/l2_decision_correctness/layout_structure_human_override_visible_pass.json',
    expectedStatus: 'pass',
    expectedCodes: ['L2_HUMAN_OVERRIDE_OBSERVED']
  },
  {
    path: 'valid/l2_decision_correctness/unsupported_family_not_fully_audited.json',
    expectedStatus: 'unsupported',
    expectedCodes: ['L2_DECISION_FAMILY_NOT_RESOLVER_COVERED']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_resolver_result_mismatch_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_RESOLVER_STATUS_MISMATCH', 'L2_SELECTED_OPTION_RESOLVER_MISMATCH']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_selected_outside_allowed_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET', 'L2_ALLOWED_OPTIONS_OUTSIDE_RESOLVER_OUTPUT']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_forbidden_option_selected_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_FORBIDDEN_OPTION_SELECTED']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_evidence_tier_too_low_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_EVIDENCE_TIER_BELOW_RESOLVER_OUTPUT']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_missing_required_evidence_ref_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_DECISION_MISSING_REQUIRED_EVIDENCE_REF']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_conditional_missing_justification_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_CONDITIONAL_JUSTIFICATION_REQUIRED']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_human_override_not_marked_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_HUMAN_OVERRIDE_REQUIRED']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_rule_version_mismatch_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_RULE_VERSION_MISMATCH']
  },
  {
    path: 'invalid/l2_decision_correctness/layout_structure_requires_reaudit_final_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_DECISION_REQUIRES_REAUDIT']
  },
  {
    path: 'adversarial/l2_decision_correctness/layout_structure_production_ready_overclaim_invalid.json',
    expectedStatus: 'fail',
    expectedCodes: ['L2_UNSUPPORTED_OVERCLAIM']
  }
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(repoRoot, pathFromRoot), 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function diagnostic(code, message, source, path, severity = 'error') {
  return { code, severity, message, source, ...(path ? { path } : {}) };
}

function tierRank(tier) {
  return EVIDENCE_TIER_RANK.has(tier) ? EVIDENCE_TIER_RANK.get(tier) : -1;
}

function optionIds(options) {
  return new Set((Array.isArray(options) ? options : []).map((option) => typeof option === 'string' ? option : option?.option_id).filter(Boolean));
}

function evidenceIds(refs) {
  return new Set((Array.isArray(refs) ? refs : []).map((ref) => ref?.evidence_id).filter(Boolean));
}

function evidenceById(refs) {
  const indexed = new Map();
  for (const ref of Array.isArray(refs) ? refs : []) {
    if (typeof ref?.evidence_id === 'string') indexed.set(ref.evidence_id, ref);
  }
  return indexed;
}

function hasEvidenceAtOrAbove(refs, requiredTier) {
  if (!EVIDENCE_TIER_RANK.has(requiredTier)) return false;
  if (requiredTier === 'none') return true;
  const requiredRank = tierRank(requiredTier);
  return (Array.isArray(refs) ? refs : []).some((ref) => EVIDENCE_TIER_RANK.has(ref?.evidence_tier) && tierRank(ref.evidence_tier) >= requiredRank);
}

function loadCoveredFamilies() {
  const registry = readJson(resolverRegistryPath);
  if (!isPlainObject(registry) || !Array.isArray(registry.active_rules)) return new Set();
  return new Set(registry.active_rules.map((entry) => entry?.decision_family_id).filter(Boolean));
}

function pathFromAjvError(error) {
  const basePath = error.instancePath ? error.instancePath.slice(1).replaceAll('/', '.') : '(root)';
  if (error.keyword === 'required' && error.params?.missingProperty) return basePath === '(root)' ? error.params.missingProperty : `${basePath}.${error.params.missingProperty}`;
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) return basePath === '(root)' ? error.params.additionalProperty : `${basePath}.${error.params.additionalProperty}`;
  return basePath;
}

function codeFromAjvError(error) {
  if (error.keyword === 'required' && error.params?.missingProperty) return `SCHEMA_REQUIRED_${String(error.params.missingProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) return `SCHEMA_ADDITIONAL_PROPERTY_${String(error.params.additionalProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  return `SCHEMA_${String(error.keyword || 'CONFORMANCE').toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

function schemaDiagnostics(record, validate) {
  if (validate(record)) return [];
  return (validate.errors || []).map((error) => diagnostic(
    codeFromAjvError(error),
    `decision_record_v2: ${error.message}`,
    'schema',
    pathFromAjvError(error)
  ));
}

function compareAllowedOptions(record, resolverOutput, diagnostics) {
  const recordAllowed = optionIds(record.allowed_options);
  const resolverAllowed = optionIds(resolverOutput.allowed_options);

  for (const optionId of recordAllowed) {
    if (!resolverAllowed.has(optionId)) {
      diagnostics.push(diagnostic('L2_ALLOWED_OPTIONS_OUTSIDE_RESOLVER_OUTPUT', `Decision record allowed option ${optionId} is not allowed by resolver output.`, 'semantic', 'decision_record.allowed_options'));
    }
  }

  for (const optionId of resolverAllowed) {
    if (!recordAllowed.has(optionId)) {
      diagnostics.push(diagnostic('L2_ALLOWED_OPTIONS_MISSING_RESOLVER_OUTPUT', `Decision record is missing resolver allowed option ${optionId}.`, 'semantic', 'decision_record.allowed_options'));
    }
  }
}

function validateConditionalJustification(record, resolverInput, auditContext, diagnostics) {
  const justification = auditContext?.conditional_justification;
  if (!isPlainObject(justification) || typeof justification.summary !== 'string' || justification.summary.trim().length === 0) {
    diagnostics.push(diagnostic('L2_CONDITIONAL_JUSTIFICATION_REQUIRED', 'Conditional decisions require a non-empty conditional justification summary.', 'semantic', 'audit_context.conditional_justification.summary'));
    return;
  }

  if (!Array.isArray(justification.evidence_refs) || justification.evidence_refs.length === 0) {
    diagnostics.push(diagnostic('L2_CONDITIONAL_JUSTIFICATION_EVIDENCE_REFS_REQUIRED', 'Conditional justification requires at least one evidence ref.', 'semantic', 'audit_context.conditional_justification.evidence_refs'));
    return;
  }

  const recordEvidenceIds = evidenceIds(record.evidence_refs);
  for (const refId of justification.evidence_refs) {
    if (!recordEvidenceIds.has(refId)) {
      diagnostics.push(diagnostic('L2_CONDITIONAL_JUSTIFICATION_EVIDENCE_REF_NOT_IN_RECORD', `Conditional justification evidence ref ${refId} is not present in decision_record.evidence_refs.`, 'semantic', 'audit_context.conditional_justification.evidence_refs'));
    }
  }

  const contextRequiredRefs = Array.isArray(resolverInput?.context?.required_evidence_refs) ? resolverInput.context.required_evidence_refs : [];
  for (const refId of contextRequiredRefs) {
    if (!justification.evidence_refs.includes(refId)) {
      diagnostics.push(diagnostic('L2_CONDITIONAL_JUSTIFICATION_REQUIRED_REF_MISSING', `Conditional justification must mention resolver-required evidence ref ${refId}.`, 'semantic', 'audit_context.conditional_justification.evidence_refs'));
    }
  }
}

function validateEvidenceBinding(record, resolverInput, resolverOutput, diagnostics) {
  const requiredRefs = Array.isArray(resolverInput?.context?.required_evidence_refs) ? resolverInput.context.required_evidence_refs : [];
  const recordRefsById = evidenceById(record.evidence_refs);

  for (const refId of requiredRefs) {
    if (!recordRefsById.has(refId)) {
      diagnostics.push(diagnostic('L2_DECISION_MISSING_REQUIRED_EVIDENCE_REF', `Decision record is missing resolver-required evidence ref ${refId}.`, 'semantic', 'decision_record.evidence_refs'));
    }
  }

  const matchedRefs = requiredRefs.map((refId) => recordRefsById.get(refId)).filter(Boolean);
  if (requiredRefs.length > 0 && resolverOutput.resolver_status !== 'unresolvable' && !hasEvidenceAtOrAbove(matchedRefs, resolverOutput.evidence_tier)) {
    diagnostics.push(diagnostic('L2_DECISION_REQUIRED_EVIDENCE_REF_TIER_UNSATISFIED', `Decision record required evidence refs do not satisfy resolver evidence tier ${resolverOutput.evidence_tier}.`, 'semantic', 'decision_record.evidence_refs'));
  }
}

function validateUnsupportedOverclaims(auditContext, diagnostics) {
  const forbiddenClaims = new Set([
    'production_ready',
    'builder_execution_proof',
    'runtime_validated',
    'downstream_enforced',
    'project_gate_accepted',
    'all_p0_resolver_coverage',
    'universal_semantic_correctness'
  ]);
  const claims = Array.isArray(auditContext?.claims) ? auditContext.claims : [];
  for (const claim of claims) {
    if (forbiddenClaims.has(claim)) {
      diagnostics.push(diagnostic('L2_UNSUPPORTED_OVERCLAIM', `L2 audit fixture contains unsupported claim ${claim}.`, 'semantic', 'audit_context.claims'));
    }
  }
}

export function auditDecisionRecord({ decisionRecord, resolverInput, auditContext = {}, validateDecisionRecordSchema = null, coveredFamilies = loadCoveredFamilies() }) {
  const diagnostics = [];

  if (!isPlainObject(decisionRecord)) {
    return {
      audit_status: 'fail',
      human_override_observed: false,
      resolver_output: null,
      diagnostics: [diagnostic('L2_DECISION_RECORD_OBJECT_REQUIRED', 'L2 audit requires a decision_record object.', 'semantic', 'decision_record')]
    };
  }

  if (!isPlainObject(resolverInput)) {
    return {
      audit_status: 'fail',
      human_override_observed: false,
      resolver_output: null,
      diagnostics: [diagnostic('L2_RESOLVER_INPUT_OBJECT_REQUIRED', 'L2 audit requires a resolver_input object.', 'semantic', 'resolver_input')]
    };
  }

  if (validateDecisionRecordSchema) diagnostics.push(...schemaDiagnostics(decisionRecord, validateDecisionRecordSchema));

  const decisionFamilyId = decisionRecord.decision_family_id;
  if (!coveredFamilies.has(decisionFamilyId)) {
    return {
      audit_status: 'unsupported',
      human_override_observed: decisionRecord.decision_type === 'human_override',
      resolver_output: null,
      diagnostics: [
        ...diagnostics,
        diagnostic('L2_DECISION_FAMILY_NOT_RESOLVER_COVERED', `Decision family ${decisionFamilyId} is not currently resolver-covered by KROAD-006/KROAD-007.`, 'semantic', 'decision_record.decision_family_id', 'warning')
      ]
    };
  }

  const resolverOutput = resolveDecision(resolverInput);
  const selectedOptionId = decisionRecord.selected_option?.option_id || null;
  const resolverSelectedOptionId = resolverOutput.selected_option?.option_id || null;
  const resolverAllowed = optionIds(resolverOutput.allowed_options);
  const resolverForbidden = optionIds(resolverOutput.forbidden_options);
  const recordForbidden = optionIds(decisionRecord.forbidden_options);
  const hasHumanOverride = decisionRecord.decision_type === 'human_override' && isPlainObject(decisionRecord.human_override);

  if (hasHumanOverride) {
    diagnostics.push(diagnostic('L2_HUMAN_OVERRIDE_OBSERVED', 'Human override is explicitly marked and visible to L2 audit.', 'semantic', 'decision_record.human_override', 'warning'));
  }

  if (decisionRecord.resolver_status !== resolverOutput.resolver_status) {
    diagnostics.push(diagnostic('L2_RESOLVER_STATUS_MISMATCH', `Decision record resolver_status=${decisionRecord.resolver_status} does not match resolver output ${resolverOutput.resolver_status}.`, 'semantic', 'decision_record.resolver_status'));
  }

  if (decisionRecord.rule_id !== resolverOutput.rule_id) {
    diagnostics.push(diagnostic('L2_RULE_ID_MISMATCH', `Decision record rule_id=${decisionRecord.rule_id} does not match resolver output ${resolverOutput.rule_id}.`, 'semantic', 'decision_record.rule_id'));
  }

  if (decisionRecord.rule_version !== resolverOutput.rule_version) {
    diagnostics.push(diagnostic('L2_RULE_VERSION_MISMATCH', `Decision record rule_version=${decisionRecord.rule_version} does not match resolver output ${resolverOutput.rule_version}.`, 'semantic', 'decision_record.rule_version'));
  }

  if (resolverSelectedOptionId && selectedOptionId !== resolverSelectedOptionId) {
    diagnostics.push(diagnostic('L2_SELECTED_OPTION_RESOLVER_MISMATCH', `Decision record selected_option=${selectedOptionId} does not match resolver selected_option=${resolverSelectedOptionId}.`, 'semantic', 'decision_record.selected_option.option_id'));
    if (!hasHumanOverride) {
      diagnostics.push(diagnostic('L2_HUMAN_OVERRIDE_REQUIRED', 'A selected-option mismatch against resolver output requires an explicit human_override.', 'semantic', 'decision_record.human_override'));
    }
  }

  if (selectedOptionId && selectedOptionId !== 'none' && !resolverAllowed.has(selectedOptionId)) {
    diagnostics.push(diagnostic('L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET', `Decision record selected_option=${selectedOptionId} is outside resolver allowed_options.`, 'semantic', 'decision_record.selected_option.option_id'));
  }

  if (selectedOptionId && (resolverForbidden.has(selectedOptionId) || recordForbidden.has(selectedOptionId))) {
    diagnostics.push(diagnostic('L2_FORBIDDEN_OPTION_SELECTED', `Decision record selected forbidden option ${selectedOptionId}.`, 'semantic', 'decision_record.selected_option.option_id'));
  }

  compareAllowedOptions(decisionRecord, resolverOutput, diagnostics);

  if (tierRank(decisionRecord.evidence_tier) < tierRank(resolverOutput.evidence_tier)) {
    diagnostics.push(diagnostic('L2_EVIDENCE_TIER_BELOW_RESOLVER_OUTPUT', `Decision record evidence_tier=${decisionRecord.evidence_tier} is below resolver output evidence_tier=${resolverOutput.evidence_tier}.`, 'semantic', 'decision_record.evidence_tier'));
  }

  validateEvidenceBinding(decisionRecord, resolverInput, resolverOutput, diagnostics);

  if (resolverOutput.resolver_status === 'conditional' || decisionRecord.resolver_status === 'conditional') {
    validateConditionalJustification(decisionRecord, resolverInput, auditContext, diagnostics);
  }

  if (decisionRecord.requires_reaudit === true) {
    const severity = resolverOutput.resolver_status === 'auto_resolved' && decisionRecord.provisional_status?.is_provisional === false ? 'error' : 'warning';
    diagnostics.push(diagnostic('L2_DECISION_REQUIRES_REAUDIT', 'Decision record is explicitly marked requires_reaudit=true.', 'semantic', 'decision_record.requires_reaudit', severity));
  }

  validateUnsupportedOverclaims(auditContext, diagnostics);

  const hasErrors = diagnostics.some((item) => item.severity !== 'warning');
  return {
    audit_status: hasErrors ? 'fail' : 'pass',
    human_override_observed: hasHumanOverride,
    resolver_output: resolverOutput,
    diagnostics
  };
}

function compileDecisionRecordSchema() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  return ajv.compile(readJson(decisionRecordSchemaPath));
}

function validateFixture(fixture, validateDecisionRecordSchema) {
  const input = fixture.input || {};
  return auditDecisionRecord({
    decisionRecord: input.decision_record,
    resolverInput: input.resolver_input,
    auditContext: input.audit_context || {},
    validateDecisionRecordSchema
  });
}

function formatDiagnostic(item) {
  return `${item.code} [${item.severity}/${item.source}]${item.path ? ` ${item.path}` : ''}: ${item.message}`;
}

function category(path) {
  return path.split('/')[0];
}

function runValidation() {
  const output = ['L2 Decision Correctness validator summary'];
  let failed = false;
  let validateDecisionRecordSchema;

  try {
    validateDecisionRecordSchema = compileDecisionRecordSchema();
    output.push('Decision Record v2 schema setup: PASS');
  } catch (error) {
    failed = true;
    output.push('Decision Record v2 schema setup: FAIL');
    output.push(`  - L2_SCHEMA_SETUP_FAILED: ${error.message}`);
  }

  const expectedByCategory = new Map([
    ['valid', fixturePlan.filter((fixture) => category(fixture.path) === 'valid').length],
    ['invalid', fixturePlan.filter((fixture) => category(fixture.path) === 'invalid').length],
    ['adversarial', fixturePlan.filter((fixture) => category(fixture.path) === 'adversarial').length]
  ]);
  const passedByCategory = new Map([
    ['valid', 0],
    ['invalid', 0],
    ['adversarial', 0]
  ]);

  if (validateDecisionRecordSchema) {
    for (const fixtureMeta of fixturePlan) {
      let fixture;
      try {
        fixture = readJson(`kernel/fixtures/${fixtureMeta.path}`);
      } catch (error) {
        failed = true;
        output.push(`${fixtureMeta.path}: FAIL`);
        output.push(`  - L2_FIXTURE_READ_OR_PARSE_FAILED: ${error.message}`);
        continue;
      }

      const auditResult = validateFixture(fixture, validateDecisionRecordSchema);
      const observedCodes = new Set((auditResult.diagnostics || []).map((item) => item.code));
      const missingCodes = fixtureMeta.expectedCodes.filter((code) => !observedCodes.has(code));
      if (auditResult.audit_status !== fixtureMeta.expectedStatus || missingCodes.length > 0) {
        failed = true;
        output.push(`${fixtureMeta.path}: FAIL`);
        output.push(`  - expected_status=${fixtureMeta.expectedStatus}, observed_status=${auditResult.audit_status}`);
        if (missingCodes.length > 0) output.push(`  - Missing expected diagnostic codes: ${missingCodes.join(', ')}`);
        output.push(...auditResult.diagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
        continue;
      }

      passedByCategory.set(category(fixtureMeta.path), (passedByCategory.get(category(fixtureMeta.path)) || 0) + 1);
      output.push(`${fixtureMeta.path}: PASS [${auditResult.audit_status}]`);
    }
  }

  output.push(`Valid L2 fixtures matched expected results: ${passedByCategory.get('valid')}/${expectedByCategory.get('valid')}`);
  output.push(`Invalid L2 fixtures matched expected diagnostics: ${passedByCategory.get('invalid')}/${expectedByCategory.get('invalid')}`);
  output.push(`Adversarial L2 fixtures matched expected anti-overclaim diagnostics: ${passedByCategory.get('adversarial')}/${expectedByCategory.get('adversarial')}`);
  output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
  console.log(output.join('\n'));
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}
