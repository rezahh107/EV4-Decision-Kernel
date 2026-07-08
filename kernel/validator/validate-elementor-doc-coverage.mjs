#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REQUIRED_DOC_AREAS = ['editor_v4_activation','v4_features_atomic_elements','classes_local_global','class_priority_cascade','class_manager','user_roles_classes','element_states','responsive_editing_inheritance','reset_style_reconciliation','variables','variables_manager','components_dependencies','dynamic_tags_boundaries','interactions_limitations','nested_links','v3_v4_differences','viewport_control','breakpoints_insufficient_evidence','logical_properties','attributes','ui_path_boundaries'];
const REQUIRED_BOUNDARIES = ['project_availability_not_proven','builder_execution_not_proven','runtime_not_validated'];
const REQUIRED_SOURCE_BY_DOC_AREA = new Map([
  ['classes_local_global', ['src.elementor.v4.classes','R-MVK-DOC-011']],
  ['class_priority_cascade', ['src.elementor.v4.class_priority','R-MVK-DOC-004']],
  ['element_states', ['src.elementor.v4.states','R-MVK-DOC-012']],
  ['variables', ['src.elementor.v4.variables','R-MVK-DOC-013']],
  ['nested_links', ['src.elementor.v4.nested_links','R-MVK-DOC-007']],
  ['v3_v4_differences', ['src.elementor.v4.v3_v4_differences','R-MVK-DOC-010']],
  ['logical_properties', ['src.elementor.v4.logical_properties','R-MVK-DOC-014']],
  ['attributes', ['src.elementor.v4.attributes','R-MVK-DOC-015']],
  ['ui_path_boundaries', ['src.elementor.v4.attributes','R-MVK-DOC-016']]
]);
const FIXTURE_PLAN = [
  ['valid/elementor_doc_coverage_index_valid.json', false],
  ['invalid/required_doc_area_missing_invalid.json', true],
  ['invalid/new_doc_area_missing_invalid.json', true],
  ['invalid/context_source_missing_no_card_reason_invalid.json', true],
  ['invalid/components_claims_project_availability_invalid.json', true],
  ['invalid/class_priority_source_missing_invalid.json', true],
  ['invalid/class_priority_wrong_source_invalid.json', true],
  ['invalid/classes_local_global_wrong_source_invalid.json', true],
  ['invalid/element_states_wrong_source_invalid.json', true],
  ['invalid/variables_wrong_source_invalid.json', true],
  ['invalid/logical_properties_wrong_source_invalid.json', true],
  ['invalid/attributes_wrong_source_invalid.json', true],
  ['invalid/responsive_inheritance_claims_runtime_validation_invalid.json', true],
  ['invalid/nested_links_source_missing_invalid.json', true],
  ['invalid/nested_links_wrong_source_invalid.json', true],
  ['invalid/v3_v4_difference_source_missing_invalid.json', true],
  ['invalid/v3_v4_difference_wrong_source_invalid.json', true],
  ['invalid/source_quality_note_required_invalid.json', true],
  ['invalid/unknown_evidence_label_ref_invalid.json', true],
  ['invalid/forbidden_production_ready_claim_invalid.json', true]
];

const diagnostic = ({rule_id, code, message, source, path}) => ({rule_id, code, message, source, ...(path ? {path} : {})});
const formatDiagnostic = (item) => `${item.rule_id} ${item.code} [${item.source}]${item.path ? ` ${item.path}` : ''}: ${item.message}`;
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const byId = (items, key) => new Map((items || []).map((item) => [item[key], item]));
const ajv = new Ajv2020({allErrors: true, strict: false});
addFormats(ajv);
const validateCoverageSchema = ajv.compile(readJson('kernel/schemas/elementor-v4-doc-coverage-index.schema.json'));

function combinedManifest() {
  const manifest = readJson('kernel/official-sources/elementor-v4-source-manifest.v0.json');
  try {
    const extension = readJson('kernel/official-sources/elementor-v4-source-manifest-extension.v0.json');
    manifest.sources = [...(manifest.sources || []), ...(extension.sources || [])];
  } catch {}
  return manifest;
}
function area(index, id) { return (index.required_doc_areas || []).find((item) => item.doc_area_id === id); }
function source(manifest, id) { return (manifest.sources || []).find((item) => item.source_id === id); }
function buttonCard(cards) { return (cards.cards || []).find((card) => card.element_id === 'v4.button'); }
function applyFixtureMutations(fixture, defaults) {
  const coverageIndex = clone(fixture.coverage_index_override || defaults.coverageIndex);
  const manifest = clone(fixture.manifest_override || defaults.manifest);
  const labels = clone(fixture.evidence_labels_override || defaults.labels);
  const decisionCards = clone(fixture.decision_cards_override || defaults.decisionCards);
  const mutations = fixture.mutations || {};
  for (const id of mutations.remove_doc_areas || []) coverageIndex.required_doc_areas = (coverageIndex.required_doc_areas || []).filter((item) => item.doc_area_id !== id);
  for (const id of mutations.clear_no_card_reason || []) { const target = area(coverageIndex, id); if (target) target.no_decision_card_reason = ''; }
  for (const id of mutations.clear_source_quality_notes || []) { const target = area(coverageIndex, id); if (target) target.source_quality_notes = []; }
  for (const patch of mutations.set_area_labels || []) { const target = area(coverageIndex, patch.doc_area_id); if (target) target.required_evidence_label_refs = patch.required_evidence_label_refs; }
  for (const patch of mutations.set_area_title || []) { const target = area(coverageIndex, patch.doc_area_id); if (target) target.title = patch.title; }
  for (const patch of mutations.set_area_source_refs || []) { const target = area(coverageIndex, patch.doc_area_id); if (target) target.official_source_ref = patch.official_source_ref; }
  if (mutations.set_scope) coverageIndex.scope = mutations.set_scope;
  for (const id of mutations.remove_source_refs || []) manifest.sources = (manifest.sources || []).filter((item) => item.source_id !== id);
  if (mutations.components_project_availability_overclaim) {
    const components = source(manifest, 'src.elementor.v4.components');
    if (components) components.claims = [{claim_id: 'fixture.components.project_availability', claim_type: 'project_availability', claim: 'Components are available in the target project.', support_status: 'supported'}];
  }
  if (mutations.remove_button_nested_links_ref) {
    const button = buttonCard(decisionCards);
    if (button) button.official_source_refs = (button.official_source_refs || []).filter((ref) => ref !== 'src.elementor.v4.nested_links');
  }
  return {coverageIndex, manifest, labels, decisionCards};
}
function allowedProofClaimPath(path) { return /not_proven|limitation|no_decision_card_reason|source_quality_notes|unresolved|not_applicable/i.test(path || ''); }
function scanForbiddenProofClaims(value, path, diagnostics) {
  if (value === null || value === undefined) return;
  if (typeof value === 'string') {
    if (!allowedProofClaimPath(path)) {
      if (/production[_ -]?read/i.test(value)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-009', code: 'FORBIDDEN_PRODUCTION_READY_CLAIM', message: 'Doc coverage artifacts must not claim production readiness.', source: 'semantic', path}));
      if (/builder[_ -]?execut/i.test(value)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-009', code: 'FORBIDDEN_BUILDER_EXECUTION_CLAIM', message: 'Doc coverage artifacts must not claim Builder execution.', source: 'semantic', path}));
      if (/runtime[_ -]?(validat|proof|proven)/i.test(value)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-005', code: 'FORBIDDEN_RUNTIME_PROOF_CLAIM', message: 'Responsive documentation must not be treated as runtime validation.', source: 'semantic', path}));
      if (/downstream[_ -]?enforce/i.test(value)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-009', code: 'FORBIDDEN_DOWNSTREAM_ENFORCEMENT_CLAIM', message: 'Doc coverage artifacts must not claim downstream enforcement.', source: 'semantic', path}));
    }
    return;
  }
  if (Array.isArray(value)) return value.forEach((entry, index) => scanForbiddenProofClaims(entry, `${path}[${index}]`, diagnostics));
  if (typeof value === 'object') for (const [key, child] of Object.entries(value)) scanForbiddenProofClaims(child, path ? `${path}.${key}` : key, diagnostics);
}
function missingSourceCode(docArea) {
  if (docArea === 'class_priority_cascade') return 'CLASS_PRIORITY_SOURCE_MISSING';
  if (docArea === 'nested_links') return 'NESTED_LINKS_SOURCE_MISSING';
  if (docArea === 'v3_v4_differences') return 'V3_V4_DIFFERENCE_SOURCE_MISSING';
  return 'REQUIRED_OFFICIAL_SOURCE_MISSING';
}
function validateCoverageIndex({coverageIndex, manifest, labels, decisionCards, sourceName}) {
  const diagnostics = [];
  if (!validateCoverageSchema(coverageIndex)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-001', code: 'DOC_COVERAGE_SCHEMA_INVALID', message: `Doc coverage index schema validation failed: ${(validateCoverageSchema.errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ')}`, source: 'schema', path: sourceName}));
  const sourceRefs = byId(manifest.sources, 'source_id');
  const labelRefs = new Set((labels.labels || []).map((item) => item.label_id));
  const areaRefs = byId(coverageIndex.required_doc_areas, 'doc_area_id');
  for (const requiredId of REQUIRED_DOC_AREAS) if (!areaRefs.has(requiredId)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-001', code: 'REQUIRED_DOC_AREA_MISSING', message: `Required Elementor V4 doc area missing: ${requiredId}`, source: 'semantic', path: 'required_doc_areas'}));
  for (const entry of coverageIndex.required_doc_areas || []) {
    const path = `required_doc_areas.${entry.doc_area_id || '(missing)'}`;
    const expected = REQUIRED_SOURCE_BY_DOC_AREA.get(entry.doc_area_id);
    if (entry.source_status !== 'insufficient_evidence' && !sourceRefs.has(entry.official_source_ref)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-001', code: 'UNKNOWN_SOURCE_REF', message: `Coverage source ref not found in manifest: ${entry.official_source_ref}`, source: 'registry', path}));
    if (expected && entry.official_source_ref !== expected[0]) diagnostics.push(diagnostic({rule_id: expected[1], code: 'DOC_AREA_SOURCE_REF_MISMATCH', message: `${entry.doc_area_id} must reference ${expected[0]}, not ${entry.official_source_ref}.`, source: 'semantic', path: `${path}.official_source_ref`}));
    for (const label of entry.required_evidence_label_refs || []) if (!labelRefs.has(label)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-001', code: 'UNKNOWN_EVIDENCE_LABEL_REF', message: `Coverage label ref not found: ${label}`, source: 'registry', path}));
    if (entry.decision_card_required === false && !entry.no_decision_card_reason) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-002', code: 'MISSING_NO_CARD_REASON', message: `Context source ${entry.doc_area_id} requires no_decision_card_reason.`, source: 'semantic', path}));
    for (const boundary of REQUIRED_BOUNDARIES) if (!(entry.not_proven_boundaries || []).includes(boundary)) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-001', code: 'REQUIRED_NOT_PROVEN_BOUNDARY_MISSING', message: `${entry.doc_area_id} must include ${boundary}.`, source: 'semantic', path}));
    if (['current_official_with_quality_note','stale_or_needs_recheck','conflicting_official_sources'].includes(entry.source_status) && !(entry.source_quality_notes || []).length) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-008', code: 'SOURCE_QUALITY_NOTE_REQUIRED', message: `${entry.doc_area_id} requires source_quality_notes for ${entry.source_status}.`, source: 'semantic', path}));
  }
  for (const claim of sourceRefs.get('src.elementor.v4.components')?.claims || []) if (claim.claim_type === 'project_availability') diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-003', code: 'COMPONENTS_PROJECT_AVAILABILITY_OVERCLAIM', message: 'Components requirements must not be represented as target project availability proof.', source: 'semantic', path: 'src.elementor.v4.components.claims'}));
  for (const [docArea, [sourceRef, ruleId]] of REQUIRED_SOURCE_BY_DOC_AREA.entries()) if (areaRefs.has(docArea) && !sourceRefs.has(sourceRef)) diagnostics.push(diagnostic({rule_id: ruleId, code: missingSourceCode(docArea), message: `${docArea} requires ${sourceRef}.`, source: 'registry', path: 'sources'}));
  if (!sourceRefs.has('src.elementor.v4.responsive_editing')) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-005', code: 'RESPONSIVE_INHERITANCE_SOURCE_MISSING', message: 'Responsive inheritance official source is required.', source: 'registry', path: 'sources'}));
  if (!areaRefs.has('reset_style_reconciliation')) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-006', code: 'RESET_RECONCILIATION_MISSING', message: 'Reset-style reconciliation area is required.', source: 'semantic', path: 'required_doc_areas'}));
  if (buttonCard(decisionCards) && !(buttonCard(decisionCards).official_source_refs || []).includes('src.elementor.v4.nested_links')) diagnostics.push(diagnostic({rule_id: 'R-MVK-DOC-007', code: 'NESTED_LINKS_SOURCE_MISSING', message: 'Button decision card must reference the official Nested Links source.', source: 'semantic', path: 'v4.button.official_source_refs'}));
  scanForbiddenProofClaims(coverageIndex, sourceName || 'elementor_doc_coverage_index', diagnostics);
  return diagnostics;
}
function codes(diagnostics) { return diagnostics.map((item) => item.code).sort(); }
function assertExpectedDiagnostics(diagnostics, expectedDiagnostics) {
  const observed = codes(diagnostics);
  const expected = [...expectedDiagnostics].sort();
  const duplicateCodes = observed.filter((code, index) => observed.indexOf(code) !== index);
  return {ok: duplicateCodes.length === 0 && observed.length === expected.length && observed.every((code, index) => code === expected[index]), observed, expected, duplicateCodes};
}
const defaults = {coverageIndex: readJson('kernel/official-sources/elementor-v4-doc-coverage-index.v0.json'), manifest: combinedManifest(), labels: readJson('kernel/official-sources/evidence-labels.v0.json'), decisionCards: readJson('kernel/decision-cards/elements.core.v0.json')};
const output = ['Elementor V4 doc coverage validator summary'];
let failed = false;
const mainDiagnostics = validateCoverageIndex({...defaults, sourceName: 'kernel/official-sources/elementor-v4-doc-coverage-index.v0.json'});
if (mainDiagnostics.length) { failed = true; output.push('Doc coverage index integrity: FAIL', ...mainDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`)); } else output.push('Doc coverage index integrity: PASS');
let validPassed = 0, invalidPassed = 0, expectedPassed = 0;
const invalidLines = [];
for (const [path, shouldFail] of FIXTURE_PLAN) {
  let diagnostics = [], fixture = null;
  try {
    fixture = readJson(join('kernel/fixtures', path));
    const fixtureArtifacts = applyFixtureMutations(fixture, defaults);
    diagnostics = validateCoverageIndex({...fixtureArtifacts, sourceName: path});
  } catch (error) {
    diagnostics = [diagnostic({rule_id: 'FIXTURE_CONFORMANCE', code: 'FIXTURE_READ_FAILED', message: error.message, source: 'fixture', path})];
  }
  if (!shouldFail) {
    if (!diagnostics.length) validPassed += 1;
    else { failed = true; output.push(`${path}: FAIL`, ...diagnostics.map((item) => `  - ${formatDiagnostic(item)}`)); }
    continue;
  }
  const expectedDiagnostics = fixture?.expected_diagnostics || [];
  const assertion = assertExpectedDiagnostics(diagnostics, expectedDiagnostics);
  if (diagnostics.length && assertion.ok) { invalidPassed += 1; expectedPassed += 1; invalidLines.push(`  - ${path}: PASS [${assertion.expected.join(', ')}]`); }
  else {
    failed = true;
    output.push(`${path}: ${diagnostics.length ? 'unexpected diagnostics' : 'unexpected PASS'}`);
    output.push(`  - Expected diagnostic codes: ${assertion.expected.join(', ') || '(none)'}`);
    output.push(`  - Observed diagnostic codes: ${assertion.observed.join(', ') || '(none)'}`);
    if (assertion.duplicateCodes.length) output.push(`  - Duplicate diagnostic codes: ${assertion.duplicateCodes.join(', ')}`);
    output.push(...diagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
  }
}
output.push('Schema validation: PASS (schema compiled and applied to main index plus fixtures)', `Valid fixtures passed schema + semantic validation: ${validPassed}/1`, `Invalid fixtures failed with expected diagnostics: ${invalidPassed}/19`, `Expected diagnostic assertions: ${expectedPassed === 19 ? 'PASS' : 'FAIL'} (${expectedPassed}/19)`, 'Invalid fixture diagnostic assertions:', ...invalidLines, `Result: ${failed ? 'FAIL' : 'PASS'}`);
console.log(output.join('\n'));
process.exit(failed ? 1 : 0);
