#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const schemaPath = 'kernel/schemas/resolver-rule.v0.schema.json';

const fixturePlan = [
  { path: 'valid/resolver_contract/valid_layout_structure_rule_contract.json', shouldFail: false, expectedCodes: [] },
  { path: 'invalid/resolver_contract/invalid_missing_evidence_refs.json', shouldFail: true, expectedCodes: ['SCHEMA_MIN_ITEMS', 'RESOLVER_RULE_EVIDENCE_REFS_REQUIRED'] },
  { path: 'invalid/resolver_contract/invalid_unknown_family_auto_resolved.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_UNKNOWN_DECISION_FAMILY'] },
  { path: 'invalid/resolver_contract/invalid_official_docs_project_ready_auto_condition.json', shouldFail: true, expectedCodes: ['RESOLVER_RULE_OFFICIAL_DOCS_NOT_PROJECT_READY'] },
  { path: 'invalid/resolver_contract/invalid_matrix_guidance_as_output.json', shouldFail: true, expectedCodes: ['SCHEMA_CONST', 'RESOLVER_RULE_FREE_TEXT_OPINION_FORBIDDEN', 'RESOLVER_RULE_MATRIX_GUIDANCE_NOT_RESOLVER_OUTPUT'] }
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(root, pathFromRoot), 'utf8'));
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

function p0Index() {
  const registry = readJson('kernel/decision-governance/p0-decision-matrices.v0.json');
  return new Map((registry.matrices || []).map((matrix) => [matrix.decision_family_id, { matrixId: matrix.matrix_id, options: new Set((matrix.candidate_options || []).map((option) => option.option_id)) }]));
}

function validateVocabularyAndRegistry() {
  const diagnostics = [];
  const vocabulary = readJson('kernel/decision-governance/resolver-status-vocabulary.v0.json');
  const registry = readJson('kernel/decision-governance/resolver-rule-registry.v0.json');
  const statuses = (vocabulary.allowed_resolver_statuses || []).map((item) => item.status_id);
  const expected = ['auto_resolved', 'conditional', 'unresolvable'];
  if (JSON.stringify(statuses) !== JSON.stringify(expected)) diagnostics.push(diagnostic('RESOLVER_STATUS_VOCABULARY', 'RESOLVER_STATUS_VOCABULARY_MUST_BE_EXACT', 'Resolver status vocabulary must contain exactly auto_resolved, conditional, unresolvable in stable order.', 'semantic', 'allowed_resolver_statuses'));
  if (registry.resolver_mvp_implemented !== false) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_MUST_NOT_CLAIM_MVP', 'KROAD-005 registry must not claim Resolver MVP implementation.', 'semantic', 'resolver_mvp_implemented'));
  if (registry.matrix_guidance_is_not_resolver_result !== true) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_MATRIX_GUIDANCE_BOUNDARY_REQUIRED', 'Registry must state matrix guidance is not resolver output.', 'semantic', 'matrix_guidance_is_not_resolver_result'));
  if (registry.unknown_decision_family_policy?.outcome !== 'unresolvable') diagnostics.push(diagnostic('RESOLVER_REGISTRY_FAIL_CLOSED', 'RESOLVER_REGISTRY_UNKNOWN_FAMILY_MUST_BE_UNRESOLVABLE', 'Unknown decision family must fail closed as unresolvable.', 'semantic', 'unknown_decision_family_policy.outcome'));
  if (Array.isArray(registry.active_rules) && registry.active_rules.length > 0) diagnostics.push(diagnostic('RESOLVER_REGISTRY_BOUNDARY', 'RESOLVER_REGISTRY_ACTIVE_RULES_DEFERRED_TO_KROAD_006', 'KROAD-005 may define examples and contracts but must not register active Resolver MVP rules.', 'semantic', 'active_rules'));
  return diagnostics;
}

function validateRuleContract(record, knownFamilies) {
  const diagnostics = [];
  const family = knownFamilies.get(record.decision_family_id);
  if (!Array.isArray(record.evidence_refs) || record.evidence_refs.length === 0) diagnostics.push(diagnostic('RESOLVER_RULE_EVIDENCE', 'RESOLVER_RULE_EVIDENCE_REFS_REQUIRED', 'Resolver rules must include at least one evidence reference.', 'semantic', 'evidence_refs'));
  if (record.matrix_ref?.decision_family_id !== record.decision_family_id) diagnostics.push(diagnostic('RESOLVER_RULE_MATRIX_ALIGNMENT', 'RESOLVER_RULE_MATRIX_REF_FAMILY_MISMATCH', 'matrix_ref.decision_family_id must match decision_family_id.', 'semantic', 'matrix_ref.decision_family_id'));
  if (!family) {
    diagnostics.push(diagnostic('RESOLVER_RULE_FAIL_CLOSED', 'RESOLVER_RULE_UNKNOWN_DECISION_FAMILY', 'Unknown decision_family_id must fail closed as unresolvable; do not invent resolver output.', 'semantic', 'decision_family_id'));
  } else {
    if (record.matrix_ref?.matrix_id !== family.matrixId) diagnostics.push(diagnostic('RESOLVER_RULE_MATRIX_ALIGNMENT', 'RESOLVER_RULE_MATRIX_ID_MISMATCH', 'matrix_ref.matrix_id must match the P0 matrix registry entry for the decision family.', 'semantic', 'matrix_ref.matrix_id'));
    const optionIds = new Set((record.option_set || []).map((option) => option.option_id));
    for (const optionId of optionIds) if (!family.options.has(optionId)) diagnostics.push(diagnostic('RESOLVER_RULE_OPTION_SET', 'RESOLVER_RULE_OPTION_NOT_IN_P0_MATRIX', `Option ${optionId} is not in the P0 matrix option set for ${record.decision_family_id}.`, 'semantic', 'option_set'));
    for (const optionId of record.allowed_options || []) if (!optionIds.has(optionId)) diagnostics.push(diagnostic('RESOLVER_RULE_OPTION_SET', 'RESOLVER_RULE_ALLOWED_OPTION_NOT_IN_OPTION_SET', `Allowed option ${optionId} is missing from option_set.`, 'semantic', 'allowed_options'));
  }
  if (record.output_contract?.human_or_llm_free_text_opinion_allowed !== false) diagnostics.push(diagnostic('RESOLVER_RULE_OUTPUT_BOUNDARY', 'RESOLVER_RULE_FREE_TEXT_OPINION_FORBIDDEN', 'Human/LLM free-text opinion must not be treated as resolver output.', 'semantic', 'output_contract.human_or_llm_free_text_opinion_allowed'));
  if (record.output_contract?.matrix_guidance_is_resolver_output !== false) diagnostics.push(diagnostic('RESOLVER_RULE_OUTPUT_BOUNDARY', 'RESOLVER_RULE_MATRIX_GUIDANCE_NOT_RESOLVER_OUTPUT', 'P0 matrix guidance must not be treated as resolver output.', 'semantic', 'output_contract.matrix_guidance_is_resolver_output'));
  if (record.output_contract?.assigns_real_final_decision !== false) diagnostics.push(diagnostic('RESOLVER_RULE_OUTPUT_BOUNDARY', 'RESOLVER_RULE_MUST_NOT_ASSIGN_REAL_FINAL_DECISION', 'KROAD-005 contract artifacts must not assign real final target-project decisions.', 'semantic', 'output_contract.assigns_real_final_decision'));
  const allConditions = [...(record.auto_resolution_conditions || []), ...(record.conditional_conditions || []), ...(record.unresolvable_conditions || [])];
  for (const [index, condition] of allConditions.entries()) {
    if (condition.required_evidence_tier === 'official_docs' && condition.project_ready_claim_allowed === true) diagnostics.push(diagnostic('RESOLVER_RULE_EVIDENCE_BOUNDARY', 'RESOLVER_RULE_OFFICIAL_DOCS_NOT_PROJECT_READY', 'official_docs-only evidence cannot make a resolver condition project-ready.', 'semantic', `conditions[${index}].project_ready_claim_allowed`));
  }
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
  knownFamilies = p0Index();
  output.push('Schema setup: PASS');
} catch (error) {
  failed = true;
  output.push('Schema setup: FAIL');
  output.push(`  - RESOLVER_RULE_SCHEMA SCHEMA_COMPILE_FAILED [schema] ${schemaPath}: ${error.message}`);
}
const mainDiagnostics = validate ? validateVocabularyAndRegistry() : [];
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

if (validate) {
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
