#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const schemaPath = 'kernel/schemas/resolver-rule.v0.schema.json';
const p0MatrixPath = 'kernel/decision-governance/p0-decision-matrices.v0.json';

const EVIDENCE_TIER_RANK = new Map([
  ['none', 0],
  ['official_docs', 1],
  ['project_export', 2],
  ['runtime_browser', 3],
  ['downstream_validated', 4]
]);

const CONDITION_BUCKETS = [
  ['auto_resolution_conditions', 'auto_resolved'],
  ['conditional_conditions', 'conditional'],
  ['unresolvable_conditions', 'unresolvable']
];

const fixturePlan = [
  { path: 'valid/resolver_contract/valid_layout_structure_rule_contract.json', shouldFail: false, expectedCodes: [] },
  { path: 'invalid/resolver_contract/invalid_missing_evidence_refs.json', shouldFail: true, expectedCodes: ['SCHEMA_MINITEMS', 'RESOLVER_RULE_EVIDENCE_REFS_REQUIRED', 'RESOLVER_RULE_EVIDENCE_TIER_UNSATISFIED'] },
  { path: 'invalid/resolver_contract/invalid_unknown_family_auto_resolved.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_UNKNOWN_DECISION_FAMILY'] },
  { path: 'invalid/resolver_contract/invalid_official_docs_project_ready_auto_condition.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_OFFICIAL_DOCS_NOT_PROJECT_READY'] },
  { path: 'invalid/resolver_contract/invalid_matrix_guidance_as_output.json', shouldFail: true, expectedCodes: ['SCHEMA_CONST', 'RESOLVER_RULE_FREE_TEXT_OPINION_FORBIDDEN', 'RESOLVER_RULE_MATRIX_GUIDANCE_NOT_RESOLVER_OUTPUT'] },
  { path: 'invalid/resolver_contract/invalid_project_export_with_official_docs_only.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_EVIDENCE_TIER_UNSATISFIED', 'RESOLVER_RULE_CONDITION_EVIDENCE_TIER_UNSATISFIED'] },
  { path: 'invalid/resolver_contract/invalid_runtime_browser_with_project_export_only.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_EVIDENCE_TIER_UNSATISFIED', 'RESOLVER_RULE_CONDITION_EVIDENCE_TIER_UNSATISFIED'] },
  { path: 'invalid/resolver_contract/invalid_downstream_validated_with_runtime_only.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_EVIDENCE_TIER_UNSATISFIED', 'RESOLVER_RULE_CONDITION_EVIDENCE_TIER_UNSATISFIED'] },
  { path: 'invalid/resolver_contract/invalid_auto_condition_unresolvable_status.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_CONDITION_BUCKET_STATUS_MISMATCH'] },
  { path: 'invalid/resolver_contract/invalid_conditional_condition_auto_status.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_CONDITION_BUCKET_STATUS_MISMATCH'] },
  { path: 'invalid/resolver_contract/invalid_unresolvable_condition_conditional_status.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_CONDITION_BUCKET_STATUS_MISMATCH'] }
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(root, pathFromRoot), 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isKnownEvidenceTier(tier) {
  return typeof tier === 'string' && EVIDENCE_TIER_RANK.has(tier);
}

function diagnostic(rule_id, code, message, source, path) {
  return { rule_id, code, message, source, ...(path ? { path } : {}) };
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
  const valid = validate(record);
  if (valid) return [];
  return (validate.errors || []).map((error) => diagnostic('RESOLVER_RULE_SCHEMA', codeFromAjvError(error), `resolver_rule_contract: ${error.message}`, 'schema', pathFromAjvError(error)));
}

function tierRank(tier) {
  return isKnownEvidenceTier(tier) ? EVIDENCE_TIER_RANK.get(tier) : -1;
}

function p0Index() {
  const registry = readJson(p0MatrixPath);
  return new Map((registry.matrices || []).map((matrix) => [matrix.decision_family_id, { matrixId: matrix.matrix_id, options: new Set((matrix.candidate_options || []).map((option) => option.option_id)) }]));
}

function evidenceIndex(record) {
  return new Map((Array.isArray(record?.evidence_refs) ? record.evidence_refs : []).map((ref) => [ref.evidence_id, ref]));
}

function hasEvidenceAtOrAbove(refs, requiredTier) {
  if (!isKnownEvidenceTier(requiredTier)) return false;
  if (requiredTier === 'none') return true;
  const requiredRank = tierRank(requiredTier);
  return Array.isArray(refs) && refs.some((ref) => isKnownEvidenceTier(ref?.evidence_tier) && tierRank(ref.evidence_tier) >= requiredRank);
}

function validateConditionBucket({ conditions, bucketName, expectedStatus, evidenceById }) {
  const diagnostics = [];
  if (!Array.isArray(conditions)) return diagnostics;
  for (const [index, condition] of conditions.entries()) {
    const path = `${bucketName}[${index}]`;
    if (!isPlainObject(condition)) {
      diagnostics.push(diagnostic('RESOLVER_RULE_CONDITION_BUCKET', 'RESOLVER_RULE_CONDITION_INVALID_OBJECT', `${bucketName} entries must be JSON objects.`, 'semantic', path));
      continue;
    }
    if (condition.outcome_status !== expectedStatus) {
      diagnostics.push(diagnostic('RESOLVER_RULE_CONDITION_BUCKET', 'RESOLVER_RULE_CONDITION_BUCKET_STATUS_MISMATCH', `${bucketName} entries must use outcome_status=${expectedStatus}.`, 'semantic', `${path}.outcome_status`));
    }
    if (condition.required_evidence_tier === 'official_docs' && condition.project_ready_claim_allowed === true) {
      diagnostics.push(diagnostic('RESOLVER_RULE_EVIDENCE_BOUNDARY', 'RESOLVER_RULE_OFFICIAL_DOCS_NOT_PROJECT_READY', 'official_docs-only evidence cannot make a resolver condition project-ready.', 'semantic', `${path}.project_ready_claim_allowed`));
    }
    if (condition.outcome_status === 'unresolvable') continue;
    const refs = condition.required_evidence_refs || [];
    const matchedRefs = refs.map((refId) => evidenceById.get(refId)).filter(Boolean);
    for (const refId of refs) {
      if (!evidenceById.has(refId)) diagnostics.push(diagnostic('RESOLVER_RULE_CONDITION_EVIDENCE', 'RESOLVER_RULE_CONDITION_EVIDENCE_REF_NOT_FOUND', `Condition evidence ref ${refId} must match an evidence_refs.evidence_id entry.`, 'semantic', `${path}.required_evidence_refs`));
    }
    if (!hasEvidenceAtOrAbove(matchedRefs, condition.required_evidence_tier)) {
      diagnostics.push(diagnostic('RESOLVER_RULE_CONDITION_EVIDENCE', 'RESOLVER_RULE_CONDITION_EVIDENCE_TIER_UNSATISFIED', `${bucketName} requires evidence tier ${condition.required_evidence_tier}, but matching refs do not satisfy it.`, 'semantic', `${path}.required_evidence_tier`));
    }
  }
  return diagnostics;
}

function validateRuleContract(record, knownFamilies) {
  const diagnostics = [];
  if (!isPlainObject(record)) {
    return [diagnostic('RESOLVER_RULE_SCHEMA', 'RESOLVER_RULE_INVALID_OBJECT', 'Resolver rule contract fixture must be a JSON object.', 'semantic', '(root)')];
  }

  const family = knownFamilies.get(record.decision_family_id);
  const refs = Array.isArray(record.evidence_refs) ? record.evidence_refs : [];
  const evidenceById = evidenceIndex(record);

  if (!Array.isArray(record.evidence_refs) || record.evidence_refs.length === 0) diagnostics.push(diagnostic('RESOLVER_RULE_EVIDENCE', 'RESOLVER_RULE_EVIDENCE_REFS_REQUIRED', 'Resolver rules must include at least one evidence reference.', 'semantic', 'evidence_refs'));
  if (!hasEvidenceAtOrAbove(refs, record.required_evidence_tier)) diagnostics.push(diagnostic('RESOLVER_RULE_EVIDENCE', 'RESOLVER_RULE_EVIDENCE_TIER_UNSATISFIED', `required_evidence_tier=${record.required_evidence_tier} must be satisfied by at least one evidence_ref at or above that tier.`, 'semantic', 'required_evidence_tier'));
  if (record.matrix_ref?.decision_family_id !== record.decision_family_id) diagnostics.push(diagnostic('RESOLVER_RULE_MATRIX_ALIGNMENT', 'RESOLVER_RULE_MATRIX_REF_FAMILY_MISMATCH', 'matrix_ref.decision_family_id must match decision_family_id.', 'semantic', 'matrix_ref.decision_family_id'));

  if (!family) {
    diagnostics.push(diagnostic('RESOLVER_RULE_FAIL_CLOSED', 'RESOLVER_RULE_UNKNOWN_DECISION_FAMILY', 'Unknown decision_family_id must fail closed as unresolvable; do not invent resolver output.', 'semantic', 'decision_family_id'));
  } else {
    if (record.matrix_ref?.matrix_id !== family.matrixId) diagnostics.push(diagnostic('RESOLVER_RULE_MATRIX_ALIGNMENT', 'RESOLVER_RULE_MATRIX_ID_MISMATCH', 'matrix_ref.matrix_id must match the P0 matrix registry entry for the decision family.', 'semantic', 'matrix_ref.matrix_id'));
    const optionIds = new Set((Array.isArray(record.option_set) ? record.option_set : []).map((option) => option.option_id));
    for (const optionId of optionIds) if (!family.options.has(optionId)) diagnostics.push(diagnostic('RESOLVER_RULE_OPTION_SET', 'RESOLVER_RULE_OPTION_NOT_IN_P0_MATRIX', `Option ${optionId} is not in the P0 matrix option set for ${record.decision_family_id}.`, 'semantic', 'option_set'));
    for (const optionId of record.allowed_options || []) if (!optionIds.has(optionId)) diagnostics.push(diagnostic('RESOLVER_RULE_OPTION_SET', 'RESOLVER_RULE_ALLOWED_OPTION_NOT_IN_OPTION_SET', `Allowed option ${optionId} is missing from option_set.`, 'semantic', 'allowed_options'));
  }

  if (record.output_contract?.human_or_llm_free_text_opinion_allowed !== false) diagnostics.push(diagnostic('RESOLVER_RULE_OUTPUT_BOUNDARY', 'RESOLVER_RULE_FREE_TEXT_OPINION_FORBIDDEN', 'Human/LLM free-text opinion must not be treated as resolver output.', 'semantic', 'output_contract.human_or_llm_free_text_opinion_allowed'));
  if (record.output_contract?.matrix_guidance_is_resolver_output !== false) diagnostics.push(diagnostic('RESOLVER_RULE_OUTPUT_BOUNDARY', 'RESOLVER_RULE_MATRIX_GUIDANCE_NOT_RESOLVER_OUTPUT', 'P0 matrix guidance must not be treated as resolver output.', 'semantic', 'output_contract.matrix_guidance_is_resolver_output'));
  if (record.output_contract?.assigns_real_final_decision !== false) diagnostics.push(diagnostic('RESOLVER_RULE_OUTPUT_BOUNDARY', 'RESOLVER_RULE_MUST_NOT_ASSIGN_REAL_FINAL_DECISION', 'Resolver contract artifacts must not assign real final target-project decisions.', 'semantic', 'output_contract.assigns_real_final_decision'));

  for (const [bucketName, expectedStatus] of CONDITION_BUCKETS) {
    diagnostics.push(...validateConditionBucket({ conditions: record[bucketName], bucketName, expectedStatus, evidenceById }));
  }

  return diagnostics;
}

function validateActiveMvpRule(rule, knownFamilies, path) {
  const diagnostics = [];
  if (!isPlainObject(rule)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_RULE_SHAPE', 'RESOLVER_MVP_RULE_INVALID_OBJECT', 'Active Resolver MVP rule must be a JSON object.', 'semantic', path));
    return diagnostics;
  }

  const required = ['artifact_type', 'rule_id', 'rule_version', 'decision_family_id', 'required_evidence_tier', 'evidence_refs', 'allowed_options', 'forbidden_options', 'diagnostics', 'fixture_requirements', 'output_contract'];
  for (const field of required) {
    if (!(field in rule)) diagnostics.push(diagnostic('RESOLVER_MVP_RULE_SHAPE', `RESOLVER_MVP_RULE_${field.toUpperCase()}_REQUIRED`, `Active Resolver MVP rule requires ${field}.`, 'semantic', `${path}.${field}`));
  }
  if (rule.artifact_type !== 'resolver_mvp_rule') diagnostics.push(diagnostic('RESOLVER_MVP_RULE_SHAPE', 'RESOLVER_MVP_RULE_ARTIFACT_TYPE_REQUIRED', 'Active Resolver MVP rule artifact_type must be resolver_mvp_rule.', 'semantic', `${path}.artifact_type`));
  if (!knownFamilies.has(rule.decision_family_id)) diagnostics.push(diagnostic('RESOLVER_MVP_RULE_FAIL_CLOSED', 'RESOLVER_MVP_RULE_UNKNOWN_DECISION_FAMILY', 'Active Resolver MVP rule must reference a known P0 decision family.', 'semantic', `${path}.decision_family_id`));
  if (!Array.isArray(rule.evidence_refs) || rule.evidence_refs.length === 0) diagnostics.push(diagnostic('RESOLVER_MVP_RULE_EVIDENCE', 'RESOLVER_MVP_RULE_EVIDENCE_REFS_REQUIRED', 'Active Resolver MVP rule requires non-empty evidence_refs.', 'semantic', `${path}.evidence_refs`));
  if (!hasEvidenceAtOrAbove(rule.evidence_refs || [], rule.required_evidence_tier)) diagnostics.push(diagnostic('RESOLVER_MVP_RULE_EVIDENCE', 'RESOLVER_MVP_RULE_EVIDENCE_TIER_UNSATISFIED', 'Active Resolver MVP rule evidence_refs must satisfy required_evidence_tier.', 'semantic', `${path}.required_evidence_tier`));
  if (rule.output_contract?.human_or_llm_free_text_opinion_allowed !== false) diagnostics.push(diagnostic('RESOLVER_MVP_RULE_OUTPUT_BOUNDARY', 'RESOLVER_MVP_RULE_FREE_TEXT_OPINION_FORBIDDEN', 'Active Resolver MVP rule must not allow free-text opinion as resolver output.', 'semantic', `${path}.output_contract.human_or_llm_free_text_opinion_allowed`));
  if (rule.output_contract?.matrix_guidance_is_resolver_output !== false) diagnostics.push(diagnostic('RESOLVER_MVP_RULE_OUTPUT_BOUNDARY', 'RESOLVER_MVP_RULE_MATRIX_GUIDANCE_NOT_RESOLVER_OUTPUT', 'Active Resolver MVP rule must not treat matrix guidance as resolver output.', 'semantic', `${path}.output_contract.matrix_guidance_is_resolver_output`));
  if (rule.output_contract?.assigns_real_final_decision !== false) diagnostics.push(diagnostic('RESOLVER_MVP_RULE_OUTPUT_BOUNDARY', 'RESOLVER_MVP_RULE_NO_REAL_FINAL_DECISION_CLAIM', 'Active Resolver MVP rule remains fixture-scoped and must not claim real final target-project decisions.', 'semantic', `${path}.output_contract.assigns_real_final_decision`));
  return diagnostics;
}

function validateVocabularyAndRegistry(knownFamilies) {
  const diagnostics = [];
  const vocabulary = readJson('kernel/decision-governance/resolver-status-vocabulary.v0.json');
  const registry = readJson('kernel/decision-governance/resolver-rule-registry.v0.json');
  const statuses = (vocabulary.allowed_resolver_statuses || []).map((item) => item.status_id);
  const expected = ['auto_resolved', 'conditional', 'unresolvable'];
  if (JSON.stringify(statuses) !== JSON.stringify(expected)) diagnostics.push(diagnostic('RESOLVER_STATUS_VOCABULARY', 'RESOLVER_STATUS_VOCABULARY_MUST_BE_EXACT', 'Resolver status vocabulary must contain exactly auto_resolved, conditional, unresolvable in stable order.', 'semantic', 'allowed_resolver_statuses'));
  if (registry.matrix_guidance_is_not_resolver_result !== true) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_MATRIX_GUIDANCE_BOUNDARY_REQUIRED', 'Registry must state matrix guidance is not resolver output.', 'semantic', 'matrix_guidance_is_not_resolver_result'));
  if (registry.unknown_decision_family_policy?.outcome !== 'unresolvable') diagnostics.push(diagnostic('RESOLVER_REGISTRY_FAIL_CLOSED', 'RESOLVER_REGISTRY_UNKNOWN_FAMILY_MUST_BE_UNRESOLVABLE', 'Unknown decision family must fail closed as unresolvable.', 'semantic', 'unknown_decision_family_policy.outcome'));

  const activeRules = Array.isArray(registry.active_rules) ? registry.active_rules : [];
  if (!Array.isArray(registry.active_rules)) {
    diagnostics.push(diagnostic('RESOLVER_REGISTRY_MVP', 'RESOLVER_REGISTRY_ACTIVE_RULES_ARRAY_REQUIRED', 'active_rules must be an array when the Resolver MVP registry is present.', 'semantic', 'active_rules'));
  }
  if (registry.resolver_mvp_implemented === false && activeRules.length > 0) {
    diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_ACTIVE_RULES_REQUIRE_MVP', 'active_rules may be non-empty only after KROAD-006 enables Resolver MVP.', 'semantic', 'active_rules'));
  }
  if (registry.resolver_mvp_implemented === true) {
    if (activeRules.length === 0) diagnostics.push(diagnostic('RESOLVER_REGISTRY_MVP', 'RESOLVER_REGISTRY_ACTIVE_RULES_REQUIRED', 'KROAD-006 Resolver MVP must register at least one active rule.', 'semantic', 'active_rules'));
    if (![true, false].includes(registry.resolver_mvp_scope?.l2_audit_implemented)) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_L2_AUDIT_FLAG_REQUIRED', 'resolver_mvp_scope.l2_audit_implemented must be boolean.', 'semantic', 'resolver_mvp_scope.l2_audit_implemented'));
    if (registry.resolver_mvp_scope?.l2_audit_implemented === true) {
      if (registry.l2_audit_scope?.implemented !== true) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_L2_STATUS_CARRIER_REQUIRED', 'Registry may mark L2 audit implemented only with l2_audit_scope.implemented=true.', 'semantic', 'l2_audit_scope.implemented'));
      if (registry.l2_audit_scope?.reruns_resolver !== true) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_L2_MUST_RERUN_RESOLVER', 'KROAD-007 L2 audit must rerun the deterministic resolver.', 'semantic', 'l2_audit_scope.reruns_resolver'));
      if (registry.l2_audit_scope?.free_text_llm_judgment_allowed !== false) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_L2_FREE_TEXT_JUDGMENT_FORBIDDEN', 'KROAD-007 L2 audit must not be a free-text LLM judgment.', 'semantic', 'l2_audit_scope.free_text_llm_judgment_allowed'));
      if (registry.l2_audit_scope?.kroad_008_or_later_implemented !== false) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_MUST_NOT_CLAIM_KROAD_008_PLUS', 'KROAD-007 registry state must not claim KROAD-008 or later.', 'semantic', 'l2_audit_scope.kroad_008_or_later_implemented'));
    }
    if (registry.resolver_mvp_scope?.downstream_enforcement_implemented !== false) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_MUST_NOT_CLAIM_DOWNSTREAM_ENFORCEMENT', 'KROAD-006/KROAD-007 must not claim downstream enforcement.', 'semantic', 'resolver_mvp_scope.downstream_enforcement_implemented'));
    if (registry.resolver_mvp_scope?.runtime_browser_evidence_implemented !== false) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_MUST_NOT_CLAIM_RUNTIME_PROOF', 'KROAD-006/KROAD-007 must not claim runtime/browser evidence implementation.', 'semantic', 'resolver_mvp_scope.runtime_browser_evidence_implemented'));
    if (registry.resolver_mvp_scope?.production_readiness_claimed !== false) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_MUST_NOT_CLAIM_PRODUCTION_READINESS', 'KROAD-006/KROAD-007 must not claim production readiness.', 'semantic', 'resolver_mvp_scope.production_readiness_claimed'));
    for (const [index, entry] of activeRules.entries()) {
      if (!isPlainObject(entry)) {
        diagnostics.push(diagnostic('RESOLVER_REGISTRY_MVP', 'RESOLVER_REGISTRY_ACTIVE_RULE_INVALID', 'Active rule registry entry must be a JSON object.', 'semantic', `active_rules[${index}]`));
        continue;
      }
      for (const field of ['rule_id', 'rule_version', 'decision_family_id', 'path', 'implementation_ref', 'produces_statuses']) {
        if (!(field in entry)) diagnostics.push(diagnostic('RESOLVER_REGISTRY_MVP', `RESOLVER_REGISTRY_ACTIVE_RULE_${field.toUpperCase()}_REQUIRED`, `Active rule registry entry requires ${field}.`, 'semantic', `active_rules[${index}].${field}`));
      }
      if (typeof entry.path !== 'string' || entry.path.trim().length === 0) continue;
      try {
        const rule = readJson(entry.path);
        diagnostics.push(...validateActiveMvpRule(rule, knownFamilies, entry.path));
      } catch (error) {
        diagnostics.push(diagnostic('RESOLVER_REGISTRY_MVP', 'RESOLVER_REGISTRY_ACTIVE_RULE_READ_FAILED', `Active rule file failed to read or parse: ${error.message}`, 'fixture', `active_rules[${index}].path`));
      }
    }
  }
  if (![true, false].includes(registry.resolver_mvp_implemented)) diagnostics.push(diagnostic('RESOLVER_REGISTRY_MVP', 'RESOLVER_REGISTRY_MVP_FLAG_REQUIRED', 'resolver_mvp_implemented must be boolean.', 'semantic', 'resolver_mvp_implemented'));
  return diagnostics;
}

function readFixture(path) {
  try { return { record: readJson(`kernel/fixtures/${path}`), diagnostics: [] }; }
  catch (error) { return { record: null, diagnostics: [diagnostic('RESOLVER_RULE_FIXTURE', 'RESOLVER_RULE_FIXTURE_READ_FAILED', `${path} failed to read or parse: ${error.message}`, 'fixture', `kernel/fixtures/${path}`)] }; }
}

function formatDiagnostic(item) {
  return `${item.rule_id} ${item.code} [${item.source}]${item.path ? ` ${item.path}` : ''}: ${item.message}`;
}

const output = ['Resolver contract validator summary'];
let failed = false;
let validate;
let knownFamilies;
try {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  validate = ajv.compile(readJson(schemaPath));
  output.push('Schema setup: PASS');
} catch (error) {
  failed = true;
  output.push('Schema setup: FAIL');
  output.push(`  - RESOLVER_RULE_SCHEMA SCHEMA_COMPILE_FAILED [schema] ${schemaPath}: ${error.message}`);
}

if (validate) {
  try {
    knownFamilies = p0Index();
    output.push('P0 matrix index: PASS');
  } catch (error) {
    failed = true;
    output.push('P0 matrix index: FAIL');
    output.push(`  - RESOLVER_RULE_P0_INDEX P0_INDEX_LOAD_FAILED [index] ${p0MatrixPath}: ${error.message}`);
  }
}

const mainDiagnostics = validate && knownFamilies ? validateVocabularyAndRegistry(knownFamilies) : [];
if (mainDiagnostics.length) {
  failed = true;
  output.push('Resolver vocabulary/registry: FAIL', ...mainDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
} else if (validate) output.push('Resolver vocabulary/registry: PASS');

let validPassed = 0;
let invalidFailed = 0;
let expectedDiagnosticsPassed = 0;
const expectedValid = fixturePlan.filter(({ shouldFail }) => !shouldFail).length;
const expectedInvalid = fixturePlan.filter(({ shouldFail }) => shouldFail).length;
const invalidDiagnosticLines = [];

if (validate && knownFamilies) {
  for (const fixture of fixturePlan) {
    const fixtureRead = readFixture(fixture.path);
    const record = fixtureRead.record;
    const allDiagnostics = [...fixtureRead.diagnostics, ...(record ? schemaDiagnostics(record, validate) : []), ...(record ? validateRuleContract(record, knownFamilies) : [])];
    if (!fixture.shouldFail) {
      if (allDiagnostics.length === 0) validPassed += 1;
      else {
        failed = true;
        output.push(`${fixture.path}: FAIL`, ...allDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
      }
      continue;
    }
    const observedCodes = new Set(allDiagnostics.map((item) => item.code));
    const missingCodes = fixture.expectedCodes.filter((code) => !observedCodes.has(code));
    if (allDiagnostics.length > 0 && missingCodes.length === 0) {
      invalidFailed += 1;
      expectedDiagnosticsPassed += 1;
      invalidDiagnosticLines.push(`  - ${fixture.path}: PASS [${fixture.expectedCodes.join(', ')}]`);
    } else {
      failed = true;
      output.push(`${fixture.path}: ${allDiagnostics.length === 0 ? 'unexpected PASS' : 'unexpected diagnostics'}`);
      if (missingCodes.length > 0) output.push(`  - Missing expected diagnostic codes: ${missingCodes.join(', ')}`);
      output.push(...allDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
    }
  }
}

output.push(`Valid resolver contract fixtures passed schema + semantic validation: ${validPassed}/${expectedValid}`);
output.push(`Invalid resolver contract fixtures failed with expected diagnostics: ${invalidFailed}/${expectedInvalid}`);
output.push(`Expected diagnostic assertions: ${expectedDiagnosticsPassed === expectedInvalid ? 'PASS' : 'FAIL'} (${expectedDiagnosticsPassed}/${expectedInvalid})`);
output.push('Invalid fixture diagnostic assertions:');
output.push(...invalidDiagnosticLines);
output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
console.log(output.join('\n'));
process.exit(failed ? 1 : 0);
