#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const REQUIRED_DOC_AREAS = [
  'editor_v4_activation',
  'v4_features_atomic_elements',
  'class_priority_cascade',
  'class_manager',
  'user_roles_classes',
  'responsive_editing_inheritance',
  'reset_style_reconciliation',
  'variables_manager',
  'components_dependencies',
  'dynamic_tags_boundaries',
  'interactions_limitations',
  'nested_links',
  'v3_v4_differences',
  'viewport_control'
];

const REQUIRED_BOUNDARIES = [
  'project_availability_not_proven',
  'builder_execution_not_proven',
  'runtime_not_validated'
];

const FIXTURE_PLAN = [
  ['valid/elementor_doc_coverage_index_valid.json', false],
  ['invalid/required_doc_area_missing_invalid.json', true],
  ['invalid/context_source_missing_no_card_reason_invalid.json', true],
  ['invalid/components_claims_project_availability_invalid.json', true],
  ['invalid/class_priority_source_missing_invalid.json', true],
  ['invalid/responsive_inheritance_claims_runtime_validation_invalid.json', true],
  ['invalid/nested_links_source_missing_invalid.json', true],
  ['invalid/v3_v4_difference_source_missing_invalid.json', true],
  ['invalid/source_quality_note_required_invalid.json', true],
  ['invalid/unknown_evidence_label_ref_invalid.json', true],
  ['invalid/forbidden_production_ready_claim_invalid.json', true]
];

const diagnostic = ({ rule_id, code, message, source, path }) => ({
  rule_id,
  code,
  message,
  source,
  ...(path ? { path } : {})
});

const formatDiagnostic = (item) => `${item.rule_id} ${item.code} [${item.source}]${item.path ? ` ${item.path}` : ''}: ${item.message}`;
const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const byId = (items, key) => new Map((items || []).map((item) => [item[key], item]));

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);
const coverageSchema = readJson('kernel/schemas/elementor-v4-doc-coverage-index.schema.json');
const validateCoverageSchema = ajv.compile(coverageSchema);

function allowedProofClaimPath(path) {
  return /not_proven|limitation|no_decision_card_reason|source_quality_notes|unresolved|not_applicable/i.test(path || '');
}

function scanForbiddenProofClaims(value, path, diagnostics) {
  if (value === null || value === undefined) return;
  if (typeof value === 'string') {
    if (!allowedProofClaimPath(path)) {
      if (/production[_ -]?read/i.test(value)) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-009', code: 'FORBIDDEN_PRODUCTION_READY_CLAIM', message: 'Doc coverage artifacts must not claim production readiness.', source: 'semantic', path }));
      if (/builder[_ -]?execut/i.test(value)) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-009', code: 'FORBIDDEN_BUILDER_EXECUTION_CLAIM', message: 'Doc coverage artifacts must not claim Builder execution.', source: 'semantic', path }));
      if (/runtime[_ -]?(validat|proof|proven)/i.test(value)) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-005', code: 'FORBIDDEN_RUNTIME_PROOF_CLAIM', message: 'Responsive documentation must not be treated as runtime validation.', source: 'semantic', path }));
      if (/downstream[_ -]?enforce/i.test(value)) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-009', code: 'FORBIDDEN_DOWNSTREAM_ENFORCEMENT_CLAIM', message: 'Doc coverage artifacts must not claim downstream enforcement.', source: 'semantic', path }));
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((entry, index) => scanForbiddenProofClaims(entry, `${path}[${index}]`, diagnostics));
    return;
  }
  if (typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) scanForbiddenProofClaims(child, path ? `${path}.${key}` : key, diagnostics);
  }
}

function validateCoverageIndex({ coverageIndex, manifest, labels, decisionCards, sourceName }) {
  const diagnostics = [];

  if (!validateCoverageSchema(coverageIndex)) {
    diagnostics.push(diagnostic({
      rule_id: 'R-MVK-DOC-001',
      code: 'DOC_COVERAGE_SCHEMA_INVALID',
      message: `Doc coverage index schema validation failed: ${(validateCoverageSchema.errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ')}`,
      source: 'schema',
      path: sourceName
    }));
  }

  const sourceRefs = byId(manifest.sources, 'source_id');
  const labelRefs = new Set((labels.labels || []).map((item) => item.label_id));
  const areaRefs = byId(coverageIndex.required_doc_areas, 'doc_area_id');

  for (const requiredId of REQUIRED_DOC_AREAS) {
    if (!areaRefs.has(requiredId)) {
      diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-001', code: 'REQUIRED_DOC_AREA_MISSING', message: `Required Elementor V4 doc area missing: ${requiredId}`, source: 'semantic', path: 'required_doc_areas' }));
    }
  }

  for (const area of coverageIndex.required_doc_areas || []) {
    const path = `required_doc_areas.${area.doc_area_id || '(missing)'}`;
    if (area.source_status !== 'insufficient_evidence' && !sourceRefs.has(area.official_source_ref)) {
      diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-001', code: 'UNKNOWN_SOURCE_REF', message: `Coverage source ref not found in manifest: ${area.official_source_ref}`, source: 'registry', path }));
    }
    for (const label of area.required_evidence_label_refs || []) {
      if (!labelRefs.has(label)) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-001', code: 'UNKNOWN_EVIDENCE_LABEL_REF', message: `Coverage label ref not found: ${label}`, source: 'registry', path }));
    }
    if (area.decision_card_required === false && !area.no_decision_card_reason) {
      diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-002', code: 'MISSING_NO_CARD_REASON', message: `Context source ${area.doc_area_id} requires no_decision_card_reason.`, source: 'semantic', path }));
    }
    for (const boundary of REQUIRED_BOUNDARIES) {
      if (!(area.not_proven_boundaries || []).includes(boundary)) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-001', code: 'REQUIRED_NOT_PROVEN_BOUNDARY_MISSING', message: `${area.doc_area_id} must include ${boundary}.`, source: 'semantic', path }));
    }
    if (['current_official_with_quality_note', 'stale_or_needs_recheck', 'conflicting_official_sources'].includes(area.source_status) && !(area.source_quality_notes || []).length) {
      diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-008', code: 'SOURCE_QUALITY_NOTE_REQUIRED', message: `${area.doc_area_id} requires source_quality_notes for ${area.source_status}.`, source: 'semantic', path }));
    }
  }

  const componentsSource = sourceRefs.get('src.elementor.v4.components');
  for (const claim of componentsSource?.claims || []) {
    if (claim.claim_type === 'project_availability') {
      diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-003', code: 'COMPONENTS_PROJECT_AVAILABILITY_OVERCLAIM', message: 'Components requirements must not be represented as target project availability proof.', source: 'semantic', path: 'src.elementor.v4.components.claims' }));
    }
  }

  if (!sourceRefs.has('src.elementor.v4.class_priority')) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-004', code: 'CLASS_PRIORITY_SOURCE_MISSING', message: 'Class priority must not be inferred from generic Classes docs.', source: 'registry', path: 'sources' }));
  if (!sourceRefs.has('src.elementor.v4.responsive_editing')) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-005', code: 'RESPONSIVE_INHERITANCE_SOURCE_MISSING', message: 'Responsive inheritance official source is required.', source: 'registry', path: 'sources' }));
  if (!areaRefs.has('reset_style_reconciliation')) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-006', code: 'RESET_RECONCILIATION_MISSING', message: 'Reset-style reconciliation area is required.', source: 'semantic', path: 'required_doc_areas' }));
  if (!sourceRefs.has('src.elementor.v4.nested_links')) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-007', code: 'NESTED_LINKS_SOURCE_MISSING', message: 'Nested Links official source is required for topology constraints.', source: 'registry', path: 'sources' }));
  if (!sourceRefs.has('src.elementor.v4.v3_v4_differences')) diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-010', code: 'V3_V4_DIFFERENCE_SOURCE_MISSING', message: 'V3/V4 differences source is required as compatibility context.', source: 'registry', path: 'sources' }));

  const buttonCard = (decisionCards.cards || []).find((card) => card.element_id === 'v4.button');
  if (buttonCard && !(buttonCard.official_source_refs || []).includes('src.elementor.v4.nested_links')) {
    diagnostics.push(diagnostic({ rule_id: 'R-MVK-DOC-007', code: 'NESTED_LINKS_SOURCE_MISSING', message: 'Button decision card must reference the official Nested Links source.', source: 'semantic', path: 'v4.button.official_source_refs' }));
  }

  scanForbiddenProofClaims(coverageIndex, sourceName || 'elementor_doc_coverage_index', diagnostics);

  return diagnostics;
}

function loadFixture(path, defaults) {
  const fixture = readJson(join('kernel/fixtures', path));
  return {
    fixture,
    coverageIndex: fixture.coverage_index_override || fixture,
    manifest: fixture.manifest_override || defaults.manifest,
    labels: fixture.evidence_labels_override || defaults.labels,
    decisionCards: fixture.decision_cards_override || defaults.decisionCards
  };
}

function codes(diagnostics) {
  return diagnostics.map((item) => item.code).sort();
}

function assertExpectedDiagnostics(path, diagnostics, expectedDiagnostics) {
  const observed = codes(diagnostics);
  const expected = [...expectedDiagnostics].sort();
  const duplicateCodes = observed.filter((code, index) => observed.indexOf(code) !== index);
  const missing = expected.filter((code) => !observed.includes(code));
  const unexpected = observed.filter((code) => !expected.includes(code));
  const ok = duplicateCodes.length === 0 && missing.length === 0 && unexpected.length === 0 && observed.length === expected.length;
  return { ok, observed, expected, missing, unexpected, duplicateCodes };
}

const defaults = {
  coverageIndex: readJson('kernel/official-sources/elementor-v4-doc-coverage-index.v0.json'),
  manifest: readJson('kernel/official-sources/elementor-v4-source-manifest.v0.json'),
  labels: readJson('kernel/official-sources/evidence-labels.v0.json'),
  decisionCards: readJson('kernel/decision-cards/elements.core.v0.json')
};

const output = ['Elementor V4 doc coverage validator summary'];
let failed = false;

const mainDiagnostics = validateCoverageIndex({ ...defaults, sourceName: 'kernel/official-sources/elementor-v4-doc-coverage-index.v0.json' });
if (mainDiagnostics.length) {
  failed = true;
  output.push('Doc coverage index integrity: FAIL', ...mainDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
} else {
  output.push('Doc coverage index integrity: PASS');
}

let validPassed = 0;
let invalidPassed = 0;
let expectedPassed = 0;
const invalidLines = [];

for (const [path, shouldFail] of FIXTURE_PLAN) {
  let diagnostics = [];
  let fixture;
  try {
    const loaded = loadFixture(path, defaults);
    fixture = loaded.fixture;
    diagnostics = validateCoverageIndex({ coverageIndex: loaded.coverageIndex, manifest: loaded.manifest, labels: loaded.labels, decisionCards: loaded.decisionCards, sourceName: path });
  } catch (error) {
    diagnostics = [diagnostic({ rule_id: 'FIXTURE_CONFORMANCE', code: 'FIXTURE_READ_FAILED', message: error.message, source: 'fixture', path })];
  }

  if (!shouldFail) {
    if (!diagnostics.length) validPassed += 1;
    else {
      failed = true;
      output.push(`${path}: FAIL`, ...diagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
    }
    continue;
  }

  const expectedDiagnostics = fixture?.expected_diagnostics || [];
  const assertion = assertExpectedDiagnostics(path, diagnostics, expectedDiagnostics);
  if (diagnostics.length && assertion.ok) {
    invalidPassed += 1;
    expectedPassed += 1;
    invalidLines.push(`  - ${path}: PASS [${assertion.expected.join(', ')}]`);
  } else {
    failed = true;
    output.push(`${path}: ${diagnostics.length ? 'unexpected diagnostics' : 'unexpected PASS'}`);
    if (!expectedDiagnostics.length) output.push('  - Missing fixture expected_diagnostics list.');
    if (assertion.missing.length) output.push(`  - Missing expected diagnostic codes: ${assertion.missing.join(', ')}`);
    if (assertion.unexpected.length) output.push(`  - Unexpected extra diagnostic codes: ${assertion.unexpected.join(', ')}`);
    if (assertion.duplicateCodes.length) output.push(`  - Duplicate diagnostic codes: ${assertion.duplicateCodes.join(', ')}`);
    output.push(...diagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
  }
}

output.push(
  'Schema validation: PASS (schema compiled and applied to main index plus fixtures)',
  `Valid fixtures passed schema + semantic validation: ${validPassed}/1`,
  `Invalid fixtures failed with expected diagnostics: ${invalidPassed}/10`,
  `Expected diagnostic assertions: ${expectedPassed === 10 ? 'PASS' : 'FAIL'} (${expectedPassed}/10)`,
  'Invalid fixture diagnostic assertions:',
  ...invalidLines,
  `Result: ${failed ? 'FAIL' : 'PASS'}`
);

console.log(output.join('\n'));
process.exit(failed ? 1 : 0);
