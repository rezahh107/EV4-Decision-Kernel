#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const P0 = [
  'v4_element_identity',
  'layout_structure',
  'media_choice',
  'text_semantics',
  'interaction_link_topology',
  'positioning_safety',
  'styling_mechanism',
  'class_scope',
  'value_binding',
  'unit_decision'
];
const RISK = [
  'version_and_release_gate',
  'official_dependency_boundary',
  'atomic_export_schema_boundary',
  'capability_proof_boundary',
  'forbidden_overclaim_boundary',
  'custom_css_environment_gate_when_custom_css_selected',
  'v4_only_target_gate'
];
const TIERS = [
  'official_elementor_help',
  'official_elementor_developer_docs',
  'elementor_release_or_update_note',
  'project_export',
  'real_editor_capture',
  'frontend_runtime',
  'browser_computed_style',
  'controlled_fixture',
  'downstream_repo_evidence'
];
const STAGES = [
  'documented_capability',
  'installed_version_supported',
  'feature_enabled',
  'core_or_pro',
  'admin_permission_required',
  'license_required',
  'addon_required',
  'third_party_dependency',
  'project_availability_evidence_required'
];
const DIST = [
  'export_json_not_frontend_dom',
  'editor_settings_not_frontend_output',
  'saved_settings_styles_interactions_not_computed_css',
  'documented_atomic_schema_not_target_project_export_observed'
];
const CLASS = new Set([
  'decision_family',
  'evidence_domain',
  'safety_gate',
  'source_boundary_rule',
  'capability_proof_rule',
  'execution_risk_control',
  'future_expansion',
  'merge_candidate'
]);
const OFF = new Set([
  'official_elementor_help',
  'official_elementor_developer_docs',
  'elementor_release_or_update_note'
]);
const OFF_NOT = [
  'installed_version_availability',
  'project_feature_enabled_state',
  'elementor_pro_availability',
  'admin_or_user_permission',
  'constructability',
  'builder_execution',
  'frontend_runtime_behavior',
  'production_readiness'
];
const OFFICIAL_DOC_FORBIDDEN_CLAIM_TYPES = new Set([
  'project_availability',
  'installed_version_availability',
  'feature_enabled',
  'project_feature_enabled_state',
  'elementor_pro_availability',
  'admin_permission',
  'admin_or_user_permission',
  'constructability',
  'builder_execution',
  'frontend_runtime_behavior',
  'production_readiness'
]);
const V3_ALLOWED_CONTEXT_PATH = /forbidden_valid_target|allowed_context|legacy|migration|unsupported|forbidden_fallback|compatibility|forbidden_overclaims|not_in_scope|purpose|description|policy|not_proven/i;

const FX = [
  ['valid/decision_governance_foundation/valid_v4_only_taxonomy_foundation.json', []],
  ['valid/decision_governance_foundation/valid_capability_dependency_gate_foundation.json', []],
  ['valid/decision_governance_foundation/valid_atomic_export_boundary_foundation.json', []],
  ['invalid/decision_governance_foundation/invalid_v3_widget_as_target_option.json', ['DGOV_V3_TARGET_FORBIDDEN']],
  ['invalid/decision_governance_foundation/invalid_official_docs_claim_project_availability.json', ['DGOV_OFFICIAL_DOCS_NOT_PROJECT_AVAILABILITY']],
  ['invalid/decision_governance_foundation/invalid_official_docs_claim_project_feature_enabled_state.json', ['DGOV_OFFICIAL_DOCS_NOT_PROJECT_AVAILABILITY']],
  ['invalid/decision_governance_foundation/invalid_official_docs_claim_admin_or_user_permission.json', ['DGOV_OFFICIAL_DOCS_NOT_PROJECT_AVAILABILITY']],
  ['invalid/decision_governance_foundation/invalid_roadmap_claim_as_current_capability.json', ['DGOV_ROADMAP_NOT_CURRENT_CAPABILITY']],
  ['invalid/decision_governance_foundation/invalid_future_feature_as_installed_capability.json', ['DGOV_FUTURE_FEATURE_NOT_INSTALLED_CAPABILITY']],
  ['invalid/decision_governance_foundation/invalid_component_without_pro_or_admin_evidence.json', ['DGOV_COMPONENT_REQUIRES_PRO_OR_ADMIN_EVIDENCE']],
  ['invalid/decision_governance_foundation/invalid_addon_feature_as_native_v4.json', ['DGOV_ADDON_FEATURE_NOT_NATIVE_V4']],
  ['invalid/decision_governance_foundation/invalid_atomic_export_treated_as_frontend_dom.json', ['DGOV_EXPORT_JSON_NOT_FRONTEND_DOM']],
  ['invalid/decision_governance_foundation/invalid_editor_settings_claimed_as_frontend_output.json', ['DGOV_EDITOR_SETTINGS_NOT_FRONTEND_OUTPUT']],
  ['invalid/decision_governance_foundation/invalid_runtime_computed_style_claimed_from_export_json.json', ['DGOV_COMPUTED_STYLE_REQUIRES_RUNTIME_EVIDENCE']],
  ['invalid/decision_governance_foundation/invalid_custom_css_without_environment_boundary.json', ['DGOV_CUSTOM_CSS_REQUIRES_ENVIRONMENT_BOUNDARY']],
  ['invalid/decision_governance_foundation/invalid_builder_ready_with_unproven_capability.json', ['DGOV_BUILDER_READY_REQUIRES_CAPABILITY_PROOF']],
  ['invalid/decision_governance_foundation/invalid_published_runtime_claim_from_editor_preview.json', ['DGOV_EDITOR_PREVIEW_NOT_PUBLISHED_RUNTIME']]
];

const readJson = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const diagnostic = (code, message, path = '') => ({
  rule_id: 'R-DGOV-FOUNDATION',
  code,
  message,
  source: 'semantic',
  ...(path ? { path } : {})
});
const ids = (items, key) => new Set((items || []).map((item) => item[key]));
const containsV3 = (value) => typeof value === 'string' && /(^|[^a-z0-9])(?:elementor_)?v3(?:[^a-z0-9]|$)|v3\.widget/i.test(value);
const requireIds = (required, present, code, noun, path, diagnostics) => {
  for (const id of required) {
    if (!present.has(id)) diagnostics.push(diagnostic(code, `Missing required ${noun}: ${id}`, path));
  }
};

function scanV3(value, path, diagnostics) {
  if (value == null) return;
  if (typeof value === 'string') {
    if (containsV3(value) && !V3_ALLOWED_CONTEXT_PATH.test(path)) {
      diagnostics.push(diagnostic('DGOV_V3_TARGET_FORBIDDEN', 'Elementor V3 must not appear as a valid target option.', path));
    }
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((child, index) => scanV3(child, `${path}[${index}]`, diagnostics));
    return;
  }
  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => scanV3(child, path ? `${path}.${key}` : key, diagnostics));
  }
}

function validateMain() {
  const diagnostics = [];
  const tax = readJson('kernel/decision-governance/decision-domain-taxonomy.v0.json');
  const reg = readJson('kernel/decision-governance/p0-decision-family-registry.v0.json');
  const src = readJson('kernel/decision-governance/source-tier-boundaries.v0.json');
  const cap = readJson('kernel/decision-governance/capability-dependency-gate.v0.json');
  const atom = readJson('kernel/decision-governance/atomic-export-boundary.v0.json');
  const risk = readJson('kernel/decision-governance/execution-risk-domain-registry.v0.json');

  if ((tax.target_scope?.valid_target_options || []).some(containsV3)) {
    diagnostics.push(diagnostic('DGOV_V3_TARGET_FORBIDDEN', 'Taxonomy valid targets must be V4-only.', 'target_scope.valid_target_options'));
  }
  const domainIds = ids(tax.domains, 'id');
  requireIds(P0, domainIds, 'DGOV_P0_FAMILY_DOMAIN_MISSING', 'P0 domain', 'domains', diagnostics);
  requireIds(RISK, domainIds, 'DGOV_EXECUTION_RISK_DOMAIN_MISSING', 'risk domain', 'domains', diagnostics);

  for (const [index, domain] of (tax.domains || []).entries()) {
    const count = (domain.primary_classification ? 1 : 0) + (Array.isArray(domain.primary_classifications) ? domain.primary_classifications.length : 0);
    if (count !== 1) diagnostics.push(diagnostic('DGOV_DOMAIN_PRIMARY_CLASSIFICATION_NOT_EXACTLY_ONE', 'Every domain must have exactly one primary classification.', `domains[${index}]`));
    if (domain.primary_classification && !CLASS.has(domain.primary_classification)) diagnostics.push(diagnostic('DGOV_DOMAIN_PRIMARY_CLASSIFICATION_INVALID', 'Unknown primary classification.', `domains[${index}].primary_classification`));
  }

  scanV3(tax, 'decision-domain-taxonomy', diagnostics);
  requireIds(P0, ids(reg.families, 'id'), 'DGOV_P0_FAMILY_MISSING', 'P0 family', 'families', diagnostics);
  scanV3(reg, 'p0-decision-family-registry', diagnostics);
  requireIds(TIERS, ids(src.source_tiers, 'tier_id'), 'DGOV_SOURCE_TIER_MISSING', 'source tier', 'source_tiers', diagnostics);

  for (const tier of src.source_tiers || []) {
    if (!OFF.has(tier.tier_id)) continue;
    const proves = new Set(tier.proves || []);
    const mustNotProve = new Set(tier.must_not_prove || []);
    for (const item of ['project_availability', ...OFF_NOT]) {
      if (proves.has(item)) diagnostics.push(diagnostic('DGOV_OFFICIAL_DOCS_NOT_PROJECT_AVAILABILITY', 'Official docs cannot prove project/dependency/runtime/execution state.', `source_tiers.${tier.tier_id}.proves`));
    }
    for (const item of OFF_NOT) {
      if (!mustNotProve.has(item)) diagnostics.push(diagnostic('DGOV_OFFICIAL_SOURCE_BOUNDARY_MISSING', `Official source tier must not prove ${item}.`, `source_tiers.${tier.tier_id}.must_not_prove`));
    }
  }

  requireIds(STAGES, ids(cap.proof_stages, 'stage_id'), 'DGOV_CAPABILITY_STAGE_MISSING', 'proof stage', 'proof_stages', diagnostics);
  if (cap.builder_ready_policy?.builder_ready_requires_capability_proof !== true) diagnostics.push(diagnostic('DGOV_BUILDER_READY_POLICY_MISSING', 'Builder-ready must require capability proof.', 'builder_ready_policy'));
  requireIds(DIST, ids(atom.distinctions, 'distinction_id'), 'DGOV_ATOMIC_DISTINCTION_MISSING', 'atomic distinction', 'distinctions', diagnostics);
  requireIds(RISK, ids(risk.domains, 'domain_id'), 'DGOV_EXECUTION_RISK_DOMAIN_MISSING', 'risk domain', 'domains', diagnostics);
  return diagnostics;
}

function validateRecord(record, path) {
  const diagnostics = [];
  if (containsV3(record.selected_target_scope) || (record.valid_target_option === true && containsV3(record.target_option))) diagnostics.push(diagnostic('DGOV_V3_TARGET_FORBIDDEN', 'Elementor V3 cannot be accepted as a valid target option.', path));
  if (OFF.has(record.source_tier) && OFFICIAL_DOC_FORBIDDEN_CLAIM_TYPES.has(record.claim_type)) diagnostics.push(diagnostic('DGOV_OFFICIAL_DOCS_NOT_PROJECT_AVAILABILITY', 'Official docs cannot be project/dependency/runtime proof.', path));
  if (['roadmap', 'future', 'planned', 'preview_future'].includes(record.temporal_status) && ['current_capability', 'installed_capability', 'installed_version_supported'].includes(record.claim_type)) diagnostics.push(diagnostic('DGOV_ROADMAP_NOT_CURRENT_CAPABILITY', 'Roadmap or future feature cannot be current capability.', path));
  if (record.temporal_status === 'future_feature' && (record.installed_version_supported === true || record.claim_type === 'installed_capability')) diagnostics.push(diagnostic('DGOV_FUTURE_FEATURE_NOT_INSTALLED_CAPABILITY', 'Future feature cannot be installed capability.', path));
  if (record.selected_feature === 'components' && ((record.pro_required && record.pro_availability_evidence_status !== 'provided') || (record.admin_permission_required && record.admin_permission_evidence_status !== 'provided'))) diagnostics.push(diagnostic('DGOV_COMPONENT_REQUIRES_PRO_OR_ADMIN_EVIDENCE', 'Components require Pro/Admin evidence when applicable.', path));
  if ((record.dependency_type === 'third_party_dependency' || record.addon_required === true) && record.claim_native_v4 === true) diagnostics.push(diagnostic('DGOV_ADDON_FEATURE_NOT_NATIVE_V4', 'Addon dependency cannot be native V4.', path));
  if (record.evidence_source === 'export_json' && record.claim_type === 'frontend_dom') diagnostics.push(diagnostic('DGOV_EXPORT_JSON_NOT_FRONTEND_DOM', 'Export JSON is not frontend DOM.', path));
  if (record.source_field === 'editor_settings' && record.claim_type === 'frontend_output') diagnostics.push(diagnostic('DGOV_EDITOR_SETTINGS_NOT_FRONTEND_OUTPUT', 'editor_settings is not frontend output.', path));
  if (['export_json', 'project_export'].includes(record.evidence_source) && ['computed_css', 'runtime_computed_style', 'browser_computed_style'].includes(record.claim_type)) diagnostics.push(diagnostic('DGOV_COMPUTED_STYLE_REQUIRES_RUNTIME_EVIDENCE', 'Computed style requires runtime evidence.', path));
  if (record.selected_styling_mechanism === 'custom_css' && record.external_style_environment_risk_declared !== true) diagnostics.push(diagnostic('DGOV_CUSTOM_CSS_REQUIRES_ENVIRONMENT_BOUNDARY', 'Custom CSS requires environment boundary.', path));
  if (record.builder_ready === true && !['proven', 'proven_for_fixture_scope'].includes(record.capability_proof_status)) diagnostics.push(diagnostic('DGOV_BUILDER_READY_REQUIRES_CAPABILITY_PROOF', 'Builder-ready requires capability proof.', path));
  if (record.evidence_source === 'real_editor_capture' && record.capture_context === 'editor_preview' && record.published_runtime_claim === true) diagnostics.push(diagnostic('DGOV_EDITOR_PREVIEW_NOT_PUBLISHED_RUNTIME', 'Editor preview is not published runtime proof.', path));
  return diagnostics;
}

function validateFixture(fixture, path) {
  return (fixture.records || []).flatMap((record) => validateRecord(record, `${path}.${record.record_id || '(missing)'}`));
}

const output = ['Decision governance foundation validator summary'];
let failed = false;
const mainDiagnostics = validateMain();
if (mainDiagnostics.length) {
  failed = true;
  output.push('Main governance artifacts: FAIL', ...mainDiagnostics.map((item) => `  - ${item.rule_id} ${item.code} [${item.source}]${item.path ? ` ${item.path}` : ''}: ${item.message}`));
} else output.push('Main governance artifacts: PASS');

let validPassed = 0;
let invalidPassed = 0;
let expectedPassed = 0;
const invalidLines = [];
for (const [path, expected] of FX) {
  let diagnostics = [];
  try {
    diagnostics = validateFixture(readJson(`kernel/fixtures/${path}`), path);
  } catch (error) {
    diagnostics = [diagnostic('DGOV_FIXTURE_READ_FAILED', error.message, path)];
  }
  const observed = diagnostics.map((item) => item.code).sort();
  const expectedSorted = [...expected].sort();
  const ok = observed.length === expectedSorted.length && observed.every((code, index) => code === expectedSorted[index]);
  if (expected.length === 0) {
    if (ok) validPassed += 1;
    else {
      failed = true;
      output.push(`${path}: FAIL`, ...diagnostics.map((item) => `  - ${item.code}: ${item.message}`));
    }
  } else if (ok) {
    invalidPassed += 1;
    expectedPassed += 1;
    invalidLines.push(`  - ${path}: PASS [${expected.join(', ')}]`);
  } else {
    failed = true;
    output.push(`${path}: unexpected diagnostics`, diagnostics.map((item) => `  - ${item.code}: ${item.message}`).join('\n'));
  }
}

const expectedValid = FX.filter(([, expected]) => !expected.length).length;
const expectedInvalid = FX.filter(([, expected]) => expected.length).length;
output.push(`Valid fixtures passed: ${validPassed}/${expectedValid}`);
output.push(`Invalid fixtures failed with expected diagnostics: ${invalidPassed}/${expectedInvalid}`);
output.push(`Expected diagnostic assertions: ${expectedPassed === expectedInvalid ? 'PASS' : 'FAIL'} (${expectedPassed}/${expectedInvalid})`);
output.push('Invalid fixture diagnostic assertions:', ...invalidLines);
output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
console.log(output.join('\n'));
process.exit(failed ? 1 : 0);
