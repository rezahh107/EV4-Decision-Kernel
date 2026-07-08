#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const STATUSES = ['not_provided','declared_not_available','provided_unvalidated','provided_schema_valid','implemented_awaiting_fixture_validation','validated_fixture','collected_runtime_evidence','rejected_invalid','insufficient_evidence','not_applicable_with_reason'];
const RANK = new Map([['not_provided',0],['declared_not_available',0],['insufficient_evidence',0],['not_applicable_with_reason',0],['rejected_invalid',1],['provided_unvalidated',1],['provided_schema_valid',2],['implemented_awaiting_fixture_validation',3],['validated_fixture',4],['collected_runtime_evidence',5]]);
const REQUIRED_NOT_PROVEN = ['production_ready','builder_executed','downstream_contract_enforced','official_docs_fully_covered','cross_repo_integrated','project_gate_integrated'];
const FORBIDDEN = new Map([
  ['production_ready',['R-MVK-EVIDENCE-004','FORBIDDEN_PRODUCTION_READY_CLAIM','Evidence workspace artifacts must not claim production readiness.']],
  ['builder_executed',['R-MVK-EVIDENCE-004','FORBIDDEN_BUILDER_EXECUTION_CLAIM','Evidence workspace artifacts must not claim Builder execution.']],
  ['builder_execution_proven',['R-MVK-EVIDENCE-004','FORBIDDEN_BUILDER_EXECUTION_CLAIM','Evidence workspace artifacts must not claim Builder execution.']],
  ['runtime_validated',['R-MVK-EVIDENCE-004','FORBIDDEN_RUNTIME_VALIDATION_CLAIM','Fixture or project availability evidence must not claim runtime validation.']],
  ['runtime_validation_proven',['R-MVK-EVIDENCE-004','FORBIDDEN_RUNTIME_VALIDATION_CLAIM','Fixture or project availability evidence must not claim runtime validation.']],
  ['downstream_contract_enforced',['R-MVK-EVIDENCE-004','FORBIDDEN_DOWNSTREAM_ENFORCEMENT_CLAIM','Kernel-local evidence workspace must not claim downstream enforcement.']],
  ['cross_repo_integrated',['R-MVK-EVIDENCE-004','FORBIDDEN_DOWNSTREAM_ENFORCEMENT_CLAIM','Kernel-local evidence workspace must not claim cross-repo integration.']],
  ['project_gate_integrated',['R-MVK-EVIDENCE-004','FORBIDDEN_DOWNSTREAM_ENFORCEMENT_CLAIM','Kernel-local evidence workspace must not claim Project Gate integration.']],
  ['official_docs_fully_covered',['R-MVK-EVIDENCE-004','REQUIRED_NOT_PROVEN_BOUNDARY_MISSING','Official documentation coverage must remain explicitly bounded.']]
]);
const FORBIDDEN_PATTERNS = [
  [/production_read(?:y|iness)/, FORBIDDEN.get('production_ready')],
  [/builder_execut/, FORBIDDEN.get('builder_executed')],
  [/runtime_(?:validat|proof|proven)/, FORBIDDEN.get('runtime_validated')],
  [/downstream_(?:contract_)?enforce/, FORBIDDEN.get('downstream_contract_enforced')],
  [/cross_(?:repo|repository)_integrat/, FORBIDDEN.get('cross_repo_integrated')],
  [/project_gate_integrat/, FORBIDDEN.get('project_gate_integrated')],
  [/official_(?:docs|documentation).*?(?:full.*cover|fully.*cover|complete)/, FORBIDDEN.get('official_docs_fully_covered')]
];
const ALLOWED_PATHS = ['limitations','known_limitations','unresolved_gaps','unresolved_evidence_gaps','not_proven_by_workspace','not_proven_by_profile','not_proven_by_evidence'];
const SCHEMAS = {
  evidence_workspace_envelope: 'kernel/schemas/evidence-workspace-envelope.schema.json',
  project_environment_profile: 'kernel/schemas/project-environment-profile.schema.json',
  wordpress_context_evidence: 'kernel/schemas/wordpress-context-evidence.schema.json',
  elementor_project_availability_evidence: 'kernel/schemas/elementor-project-availability-evidence.schema.json',
  runtime_snapshot_evidence: 'kernel/schemas/runtime-snapshot-evidence.schema.json',
  responsive_runtime_evidence: 'kernel/schemas/responsive-runtime-evidence.schema.json'
};
const PLAN = [
  ['valid/evidence_workspace_minimal_not_provided_valid.json','evidence_workspace_envelope',false,[]],
  ['valid/project_environment_profile_with_unknowns_valid.json','project_environment_profile',false,[]],
  ['valid/wordpress_context_evidence_declared_not_available_valid.json','wordpress_context_evidence',false,[]],
  ['valid/elementor_project_availability_schema_valid_valid.json','elementor_project_availability_evidence',false,[]],
  ['valid/runtime_snapshot_collected_with_limitations_valid.json','runtime_snapshot_evidence',false,[]],
  ['valid/responsive_runtime_evidence_with_overflow_observation_valid.json','responsive_runtime_evidence',false,[]],
  ['invalid/evidence_workspace_claims_production_ready_invalid.json','evidence_workspace_envelope',true,['FORBIDDEN_PRODUCTION_READY_CLAIM']],
  ['invalid/project_environment_profile_missing_kernel_pin_invalid.json','project_environment_profile',true,['MISSING_KERNEL_PIN']],
  ['invalid/wordpress_context_claims_builder_execution_invalid.json','wordpress_context_evidence',true,['FORBIDDEN_BUILDER_EXECUTION_CLAIM']],
  ['invalid/elementor_availability_claims_runtime_validation_invalid.json','elementor_project_availability_evidence',true,['FORBIDDEN_RUNTIME_VALIDATION_CLAIM']],
  ['invalid/runtime_snapshot_claims_downstream_enforcement_invalid.json','runtime_snapshot_evidence',true,['FORBIDDEN_DOWNSTREAM_ENFORCEMENT_CLAIM']],
  ['invalid/responsive_runtime_missing_viewport_set_invalid.json','responsive_runtime_evidence',true,['SCHEMA_REQUIRED_VIEWPORT_SET','VIEWPORT_SET_REQUIRED']],
  ['invalid/evidence_workspace_missing_not_proven_boundary_invalid.json','evidence_workspace_envelope',true,['REQUIRED_NOT_PROVEN_BOUNDARY_MISSING']],
  ['invalid/evidence_workspace_unknown_package_ref_invalid.json','evidence_workspace_envelope',true,['UNKNOWN_EVIDENCE_PACKAGE_REF']],
  ['invalid/evidence_package_status_overclaim_invalid.json','evidence_workspace_envelope',true,['STATUS_OVERCLAIM']],
  ['invalid/evidence_workspace_malformed_packages_invalid.json','evidence_workspace_envelope',true,['SCHEMA_TYPE']],
  ['invalid/evidence_workspace_summary_status_overclaim_invalid.json','evidence_workspace_envelope',true,['STATUS_OVERCLAIM']],
  ['invalid/evidence_workspace_forbidden_prose_variants_invalid.json','evidence_workspace_envelope',true,['FORBIDDEN_PRODUCTION_READY_CLAIM','FORBIDDEN_BUILDER_EXECUTION_CLAIM','FORBIDDEN_RUNTIME_VALIDATION_CLAIM','FORBIDDEN_DOWNSTREAM_ENFORCEMENT_CLAIM','REQUIRED_NOT_PROVEN_BOUNDARY_MISSING']],
  ['invalid/evidence_workspace_missing_compatibility_profile_invalid.json','evidence_workspace_envelope',true,['KERNEL_PIN_COMPATIBILITY_PROFILE_REQUIRED']],
  ['invalid/project_environment_profile_missing_compatibility_profile_fields_invalid.json','project_environment_profile',true,['KERNEL_PIN_PROFILE_ID_REQUIRED','KERNEL_PIN_CONSUMER_STAGE_REQUIRED']]
];

const read = (path) => JSON.parse(readFileSync(join(root, path), 'utf8'));
const isObj = (x) => x !== null && typeof x === 'object' && !Array.isArray(x);
const hasText = (x) => typeof x === 'string' && x.trim().length > 0;
const diag = ({rule_id, code, message, source, path}) => ({rule_id, code, message, source, ...(path ? {path} : {})});
const add = (arr, condition, item) => { if (condition) arr.push(diag(item)); };
const fmt = (x) => `${x.rule_id} ${x.code} [${x.source}]${x.path ? ` ${x.path}` : ''}: ${x.message}`;

function pathFromAjv(error) {
  const base = error.instancePath ? error.instancePath.slice(1).replaceAll('/', '.') : '(root)';
  if (error.keyword === 'required' && error.params?.missingProperty) return base === '(root)' ? error.params.missingProperty : `${base}.${error.params.missingProperty}`;
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) return base === '(root)' ? error.params.additionalProperty : `${base}.${error.params.additionalProperty}`;
  return base;
}
function codeFromAjv(error) {
  if (error.keyword === 'required' && error.params?.missingProperty) return `SCHEMA_REQUIRED_${String(error.params.missingProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) return `SCHEMA_ADDITIONAL_PROPERTY_${String(error.params.additionalProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  return `SCHEMA_${String(error.keyword || 'CONFORMANCE').toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}
function buildSchemas() {
  const ajv = new Ajv2020({allErrors: true, strict: false});
  addFormats(ajv);
  const compiled = new Map(), diagnostics = [];
  for (const [kind, path] of Object.entries(SCHEMAS)) {
    try { compiled.set(kind, ajv.compile(read(path))); }
    catch (error) { diagnostics.push(diag({rule_id:'SCHEMA_CONFORMANCE', code:'SCHEMA_COMPILE_FAILED', message:`${kind} schema failed to compile: ${error.message}`, source:'schema', path})); }
  }
  return {compiled, diagnostics};
}
function schemaDiagnostics(kind, record, compiled) {
  const validate = compiled.get(kind);
  if (!validate) return [diag({rule_id:'SCHEMA_CONFORMANCE', code:'SCHEMA_VALIDATOR_MISSING', message:`No schema validator registered for ${kind}`, source:'schema', path:kind})];
  if (validate(record)) return [];
  return (validate.errors || []).filter((e) => e.keyword !== 'if').map((e) => diag({rule_id:'SCHEMA_CONFORMANCE', code:codeFromAjv(e), message:`${kind}: ${e.message}`, source:'schema', path:pathFromAjv(e)}));
}
function validateKernelPin(pin, diagnostics, label) {
  if (!isObj(pin)) {
    diagnostics.push(diag({rule_id:'R-MVK-EVIDENCE-001', code:'MISSING_KERNEL_PIN', message:`${label} requires kernel_pin`, source:'semantic', path:`${label}.kernel_pin`}));
    return;
  }
  add(diagnostics, !hasText(pin.kernel_version), {rule_id:'R-MVK-EVIDENCE-001', code:'KERNEL_PIN_VERSION_REQUIRED', message:`${label}.kernel_pin.kernel_version is required`, source:'semantic', path:`${label}.kernel_pin.kernel_version`});
  add(diagnostics, !/^[a-f0-9]{40}$/i.test(pin.kernel_source_commit || ''), {rule_id:'R-MVK-EVIDENCE-001', code:'KERNEL_PIN_COMMIT_SHA_INVALID', message:`${label}.kernel_pin.kernel_source_commit must be a 40-character hex SHA`, source:'semantic', path:`${label}.kernel_pin.kernel_source_commit`});
  add(diagnostics, !hasText(pin.registry_manifest_ref), {rule_id:'R-MVK-EVIDENCE-001', code:'KERNEL_PIN_MANIFEST_REF_REQUIRED', message:`${label}.kernel_pin.registry_manifest_ref is required`, source:'semantic', path:`${label}.kernel_pin.registry_manifest_ref`});
  add(diagnostics, !/^[a-f0-9]{64}$/i.test(pin.registry_manifest_sha256 || ''), {rule_id:'R-MVK-EVIDENCE-001', code:'KERNEL_PIN_MANIFEST_SHA256_INVALID', message:`${label}.kernel_pin.registry_manifest_sha256 must be a 64-character hex SHA256`, source:'semantic', path:`${label}.kernel_pin.registry_manifest_sha256`});
  if (!isObj(pin.compatibility_profile)) {
    diagnostics.push(diag({rule_id:'R-MVK-EVIDENCE-001', code:'KERNEL_PIN_COMPATIBILITY_PROFILE_REQUIRED', message:`${label}.kernel_pin.compatibility_profile must be an object`, source:'semantic', path:`${label}.kernel_pin.compatibility_profile`}));
    return;
  }
  add(diagnostics, !hasText(pin.compatibility_profile.profile_id), {rule_id:'R-MVK-EVIDENCE-001', code:'KERNEL_PIN_PROFILE_ID_REQUIRED', message:`${label}.kernel_pin.compatibility_profile.profile_id is required`, source:'semantic', path:`${label}.kernel_pin.compatibility_profile.profile_id`});
  add(diagnostics, !hasText(pin.compatibility_profile.consumer_stage), {rule_id:'R-MVK-EVIDENCE-001', code:'KERNEL_PIN_CONSUMER_STAGE_REQUIRED', message:`${label}.kernel_pin.compatibility_profile.consumer_stage is required`, source:'semantic', path:`${label}.kernel_pin.compatibility_profile.consumer_stage`});
}
function allowedPath(path) { return ALLOWED_PATHS.some((allowed) => path.includes(allowed)); }
function normalizeClaim(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
}
function emitForbiddenMatches(rawValue, path, diagnostics) {
  const normalized = normalizeClaim(rawValue);
  const emitted = new Set();
  for (const [token, [rule_id, code, message]] of FORBIDDEN.entries()) {
    if (normalized.includes(token) && !emitted.has(code)) {
      diagnostics.push(diag({rule_id, code, message, source:'semantic', path}));
      emitted.add(code);
    }
  }
  for (const [pattern, detail] of FORBIDDEN_PATTERNS) {
    if (pattern.test(normalized)) {
      const [rule_id, code, message] = detail;
      if (!emitted.has(code)) {
        diagnostics.push(diag({rule_id, code, message, source:'semantic', path}));
        emitted.add(code);
      }
    }
  }
}
function scanForbidden(value, path, diagnostics) {
  if (value === null || value === undefined) return;
  if (typeof value === 'string') {
    if (!allowedPath(path)) emitForbiddenMatches(value, path, diagnostics);
    return;
  }
  if (Array.isArray(value)) return value.forEach((entry, index) => scanForbidden(entry, `${path}[${index}]`, diagnostics));
  if (isObj(value)) for (const [key, child] of Object.entries(value)) {
    const childPath = path ? `${path}.${key}` : key;
    if (!allowedPath(childPath) && (child === true || String(child).toLowerCase() === 'true')) {
      emitForbiddenMatches(key, childPath, diagnostics);
    }
    scanForbidden(child, childPath, diagnostics);
  }
}
function validateBoundary(record, field, diagnostics, label) {
  const boundary = record[field];
  for (const claim of REQUIRED_NOT_PROVEN) add(diagnostics, !Array.isArray(boundary) || !boundary.includes(claim), {rule_id:'R-MVK-EVIDENCE-002', code:'REQUIRED_NOT_PROVEN_BOUNDARY_MISSING', message:`${label}.${field} must include ${claim}`, source:'semantic', path:`${label}.${field}`});
}
function scanStatuses(value, path, diagnostics) {
  if (value === null || value === undefined) return;
  if (isObj(value)) {
    if ('status' in value) add(diagnostics, !STATUSES.includes(value.status), {rule_id:'R-MVK-EVIDENCE-003', code:'INVALID_EVIDENCE_STATUS', message:`Invalid evidence status: ${value.status}`, source:'semantic', path:`${path}.status`});
    for (const [key, child] of Object.entries(value)) scanStatuses(child, path ? `${path}.${key}` : key, diagnostics);
  } else if (Array.isArray(value)) value.forEach((entry, index) => scanStatuses(entry, `${path}[${index}]`, diagnostics));
}
const packageStatusByRef = new Map(), packageKindByRef = new Map();
function loadKnownPackages() {
  packageStatusByRef.clear(); packageKindByRef.clear();
  for (const [fixturePath, kind, shouldFail] of PLAN) {
    if (shouldFail || kind === 'evidence_workspace_envelope' || kind === 'project_environment_profile') continue;
    const record = read(`kernel/fixtures/${fixturePath}`);
    packageStatusByRef.set(record.evidence_id, record.collection_status?.status);
    packageKindByRef.set(record.evidence_id, kind);
  }
  const profile = read('kernel/fixtures/valid/project_environment_profile_with_unknowns_valid.json');
  packageStatusByRef.set(profile.environment_profile_id, profile.site_context_status?.status);
  packageKindByRef.set(profile.environment_profile_id, 'project_environment_profile');
}
function statusOverclaim(diagnostics, path, label, claimed, actual) {
  if (actual && RANK.has(claimed) && RANK.get(claimed) > RANK.get(actual)) diagnostics.push(diag({rule_id:'R-MVK-EVIDENCE-003', code:'STATUS_OVERCLAIM', message:`${label} claims ${claimed} but referenced package is ${actual}`, source:'semantic', path}));
}
function validateWorkspace(record) {
  const diagnostics = [], seenIds = new Set(), actualStatusByPackageId = new Map();
  validateKernelPin(record.kernel_pin, diagnostics, 'evidence_workspace_envelope');
  validateBoundary(record, 'not_proven_by_workspace', diagnostics, 'evidence_workspace_envelope');

  const packages = Array.isArray(record.evidence_packages) ? record.evidence_packages : [];
  for (const pkg of packages) {
    if (!isObj(pkg)) continue;
    const id = hasText(pkg.package_id) ? pkg.package_id : '(missing-package-id)';
    add(diagnostics, seenIds.has(id), {rule_id:'R-MVK-EVIDENCE-005', code:'DUPLICATE_EVIDENCE_PACKAGE_ID', message:`Duplicate evidence package ID: ${id}`, source:'registry', path:'evidence_packages'});
    seenIds.add(id);
    const actualStatus = packageStatusByRef.get(pkg.package_ref);
    add(diagnostics, !packageStatusByRef.has(pkg.package_ref), {rule_id:'R-MVK-EVIDENCE-005', code:'UNKNOWN_EVIDENCE_PACKAGE_REF', message:`Unknown evidence package ref: ${pkg.package_ref}`, source:'registry', path:`evidence_packages.${id}.package_ref`});
    const actualKind = packageKindByRef.get(pkg.package_ref);
    add(diagnostics, actualKind && actualKind !== pkg.package_kind, {rule_id:'R-MVK-EVIDENCE-005', code:'EVIDENCE_PACKAGE_KIND_MISMATCH', message:`Evidence package kind mismatch for ${pkg.package_ref}`, source:'registry', path:`evidence_packages.${id}.package_kind`});
    if (actualStatus) actualStatusByPackageId.set(id, actualStatus);
    statusOverclaim(diagnostics, `evidence_packages.${id}.evidence_status`, id, pkg.evidence_status, actualStatus);
  }

  if (isObj(record.evidence_status_summary)) {
    for (const [summaryKey, summaryStatus] of Object.entries(record.evidence_status_summary)) {
      if (summaryKey === 'workspace') continue;
      const actualStatus = actualStatusByPackageId.get(summaryKey);
      add(diagnostics, !actualStatus, {rule_id:'R-MVK-EVIDENCE-003', code:'UNKNOWN_EVIDENCE_STATUS_SUMMARY_KEY', message:`evidence_status_summary key does not match a workspace package_id: ${summaryKey}`, source:'semantic', path:`evidence_status_summary.${summaryKey}`});
      statusOverclaim(diagnostics, `evidence_status_summary.${summaryKey}`, `evidence_status_summary.${summaryKey}`, summaryStatus, actualStatus);
    }
  }

  scanStatuses(record, 'evidence_workspace_envelope', diagnostics);
  scanForbidden(record, 'evidence_workspace_envelope', diagnostics);
  return diagnostics;
}
function validateProfile(record) {
  const diagnostics = [];
  validateKernelPin(record.kernel_pin, diagnostics, 'project_environment_profile');
  validateBoundary(record, 'not_proven_by_profile', diagnostics, 'project_environment_profile');
  scanStatuses(record, 'project_environment_profile', diagnostics);
  scanForbidden(record, 'project_environment_profile', diagnostics);
  return diagnostics;
}
function validateEvidence(record, label) {
  const diagnostics = [];
  validateBoundary(record, 'not_proven_by_evidence', diagnostics, label);
  scanStatuses(record, label, diagnostics);
  scanForbidden(record, label, diagnostics);
  return diagnostics;
}
function validateResponsive(record) {
  const diagnostics = validateEvidence(record, 'responsive_runtime_evidence');
  add(diagnostics, !Array.isArray(record.viewport_set) || record.viewport_set.length === 0, {rule_id:'R-MVK-EVIDENCE-006', code:'VIEWPORT_SET_REQUIRED', message:'responsive runtime evidence requires viewport_set', source:'semantic', path:'responsive_runtime_evidence.viewport_set'});
  return diagnostics;
}
const SEMANTIC = {
  evidence_workspace_envelope: validateWorkspace,
  project_environment_profile: validateProfile,
  wordpress_context_evidence: (record) => validateEvidence(record, 'wordpress_context_evidence'),
  elementor_project_availability_evidence: (record) => validateEvidence(record, 'elementor_project_availability_evidence'),
  runtime_snapshot_evidence: (record) => validateEvidence(record, 'runtime_snapshot_evidence'),
  responsive_runtime_evidence: validateResponsive
};
function readFixture(path) {
  try { return {record: read(`kernel/fixtures/${path}`), diagnostics: []}; }
  catch (error) { return {record: null, diagnostics: [diag({rule_id:'FIXTURE_CONFORMANCE', code:'FIXTURE_JSON_READ_OR_PARSE_FAILED', message:`${path} failed to read or parse: ${error.message}`, source:'fixture', path})]}; }
}

const out = ['Evidence workspace validator summary'];
let failed = false;
const {compiled, diagnostics: setupDiagnostics} = buildSchemas();
if (setupDiagnostics.length) { failed = true; out.push('Schema setup: FAIL', ...setupDiagnostics.map((x) => `  - ${fmt(x)}`)); }
else out.push(`Schema setup: PASS (${compiled.size}/${Object.keys(SCHEMAS).length} schemas compiled)`);
try { loadKnownPackages(); out.push(`Evidence package registry load: PASS (${packageStatusByRef.size} package refs)`); }
catch (error) { failed = true; out.push('Evidence package registry load: FAIL', `  - ${fmt(diag({rule_id:'R-MVK-EVIDENCE-005', code:'EVIDENCE_PACKAGE_REGISTRY_LOAD_FAILED', message:error.message, source:'registry'}))}`); }

let executed = 0, validSchema = 0, validPassed = 0, invalidFailed = 0, expectedPassed = 0;
const invalidLines = [];
const expectedValid = PLAN.filter((x) => !x[2]).length;
const expectedInvalid = PLAN.filter((x) => x[2]).length;
for (const [fixturePath, kind, shouldFail, expectedCodes] of PLAN) {
  const fixture = readFixture(fixturePath);
  const schemaItems = fixture.record ? schemaDiagnostics(kind, fixture.record, compiled) : [];
  if (fixture.record) executed += 1;
  const semanticItems = fixture.record ? SEMANTIC[kind](fixture.record) : [];
  const all = [...fixture.diagnostics, ...schemaItems, ...semanticItems];

  if (!shouldFail) {
    if (!schemaItems.length) validSchema += 1;
    if (!all.length) validPassed += 1;
    else { failed = true; out.push(`${fixturePath}: FAIL`, ...all.map((x) => `  - ${fmt(x)}`)); }
    continue;
  }

  const observed = new Set(all.map((x) => x.code));
  const missing = expectedCodes.filter((code) => !observed.has(code));
  const extra = all.filter((x) => !expectedCodes.includes(x.code));
  if (all.length && !missing.length && !extra.length) {
    invalidFailed += 1; expectedPassed += 1;
    invalidLines.push(`  - ${fixturePath}: PASS [${expectedCodes.join(', ')}]`);
  } else {
    failed = true;
    out.push(`${fixturePath}: ${all.length ? 'unexpected diagnostics' : 'unexpected PASS'}`);
    if (missing.length) out.push(`  - Missing expected diagnostic codes: ${missing.join(', ')}`);
    if (extra.length) out.push(`  - Unexpected extra diagnostic codes: ${extra.map((x) => x.code).join(', ')}`);
    out.push(...all.map((x) => `  - ${fmt(x)}`));
  }
}
out.push(
  `Schema validation: ${validSchema === expectedValid && executed === PLAN.length ? 'PASS' : 'FAIL'} (executed ${executed}/${PLAN.length}; valid fixtures schema-clean ${validSchema}/${expectedValid})`,
  `Valid fixtures passed schema + semantic validation: ${validPassed}/${expectedValid}`,
  `Invalid fixtures failed with expected diagnostics: ${invalidFailed}/${expectedInvalid}`,
  `Expected diagnostic assertions: ${expectedPassed === expectedInvalid ? 'PASS' : 'FAIL'} (${expectedPassed}/${expectedInvalid})`,
  'Invalid fixture diagnostic assertions:',
  ...invalidLines,
  `Result: ${failed ? 'FAIL' : 'PASS'}`
);
console.log(out.join('\n'));
process.exit(failed ? 1 : 0);
