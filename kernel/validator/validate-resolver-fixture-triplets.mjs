#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDecision } from '../resolver-mvp/resolve-high-risk-p0.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const registryPath = 'kernel/decision-governance/resolver-rule-registry.v0.json';
const policyPath = 'kernel/decision-governance/resolver-fixture-triplet-policy.v0.json';

const REQUIRED_KINDS = ['valid', 'invalid', 'adversarial'];
const RESOLVER_STATUSES = new Set(['auto_resolved', 'conditional', 'unresolvable']);
const FORBIDDEN_BOUNDARY_TRUE_FIELDS = [
  'new_resolver_families_added',
  'kroad_009_vertical_slice_implemented',
  'downstream_consumer_contract_implemented',
  'project_gate_intake_implemented',
  'runtime_browser_evidence_implemented',
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

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (isPlainObject(value)) {
    return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

function contentHash(value) {
  return createHash('sha256').update(stableStringify(value)).digest('hex');
}

function diagnosticCodes(result) {
  return new Set((result.diagnostics || []).map((item) => item.code));
}

function fixtureEvidenceRefs(fixture) {
  return Array.isArray(fixture?.input?.evidence_refs) ? fixture.input.evidence_refs : [];
}

function hasSyntheticBoundaryNote(fixture) {
  const notes = Array.isArray(fixture?.notes) ? fixture.notes.join(' ').toLowerCase() : '';
  const saysNotReal = notes.includes('not real target-project proof') || notes.includes('not real target-project evidence');
  const saysNotRuntime = notes.includes('not runtime validation');
  return saysNotReal && saysNotRuntime;
}

function validatePolicyShape(policy) {
  const diagnostics = [];

  if (!isPlainObject(policy)) {
    return [diagnostic('RESOLVER_FIXTURE_TRIPLET_POLICY_INVALID_OBJECT', 'Fixture triplet policy must be a JSON object.', policyPath)];
  }

  if (policy.policy_id !== 'resolver-fixture-triplet-policy.v0') {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_POLICY_ID_INVALID', 'Policy id must be resolver-fixture-triplet-policy.v0.', 'policy_id'));
  }

  const completion = policy.rule_completion_policy || {};
  if (completion.active_resolver_rule_requires_triplet !== true) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_REQUIRED_FLAG_MISSING', 'Policy must require triplet coverage for every active resolver rule.', 'rule_completion_policy.active_resolver_rule_requires_triplet'));
  }
  if (completion.missing_triplet_blocks_complete !== true) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_MISSING_MUST_BLOCK_COMPLETE', 'Missing triplet coverage must block resolver rule completion.', 'rule_completion_policy.missing_triplet_blocks_complete'));
  }
  if (completion.empty_fixture_stub_counts !== false) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EMPTY_STUBS_MUST_NOT_COUNT', 'Empty fixture stubs must not count as triplet coverage.', 'rule_completion_policy.empty_fixture_stub_counts'));
  }
  if (completion.case_name_dispatch_allowed !== false) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_CASE_NAME_DISPATCH_FORBIDDEN', 'Fixture validation must not pass by case-name dispatch.', 'rule_completion_policy.case_name_dispatch_allowed'));
  }
  if (completion.synthetic_fixture_evidence_only !== true || completion.real_target_project_proof_claimed !== false || completion.production_readiness_claimed !== false) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EVIDENCE_BOUNDARY_INVALID', 'Policy must keep fixture evidence synthetic and must not claim target-project proof or production readiness.', 'rule_completion_policy'));
  }

  const requiredKinds = policy.rule_completion_policy?.required_fixture_kinds || [];
  if (JSON.stringify(requiredKinds) !== JSON.stringify(REQUIRED_KINDS)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_REQUIRED_KINDS_INVALID', 'Policy must require valid, invalid, and adversarial fixture kinds in stable order.', 'rule_completion_policy.required_fixture_kinds'));
  }

  if (!Array.isArray(policy.active_rule_triplets)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_ACTIVE_RULE_TRIPLETS_ARRAY_REQUIRED', 'Policy active_rule_triplets must be an array.', 'active_rule_triplets'));
  }

  for (const field of FORBIDDEN_BOUNDARY_TRUE_FIELDS) {
    if (policy.boundaries?.[field] !== false) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_BOUNDARY_OVERCLAIM', `Policy boundary ${field} must remain false for KROAD-008.`, `boundaries.${field}`));
    }
  }

  return diagnostics;
}

function activeRuleKey(rule) {
  return `${rule.rule_id}@${rule.rule_version}:${rule.decision_family_id}`;
}

function policyTripletKey(entry) {
  return `${entry.rule_id}@${entry.rule_version}:${entry.decision_family_id}`;
}

function assertPolicyCoversActiveRules(registry, policy) {
  const diagnostics = [];
  const activeRules = Array.isArray(registry?.active_rules) ? registry.active_rules : [];
  const policyEntries = Array.isArray(policy?.active_rule_triplets) ? policy.active_rule_triplets : [];
  const entriesByKey = new Map(policyEntries.map((entry) => [policyTripletKey(entry), entry]));

  for (const [index, rule] of activeRules.entries()) {
    if (!isPlainObject(rule)) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_ACTIVE_RULE_INVALID', 'Active rule entry must be a JSON object before fixture coverage can be evaluated.', `active_rules[${index}]`));
      continue;
    }
    const key = activeRuleKey(rule);
    if (!entriesByKey.has(key)) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_MISSING_FOR_ACTIVE_RULE', `Active resolver rule ${key} has no fixture triplet policy entry.`, `active_rules[${index}]`));
      continue;
    }

    const entry = entriesByKey.get(key);
    if (entry.coverage_status !== 'complete') {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_INCOMPLETE_STATUS', `Active resolver rule ${key} fixture coverage must be marked complete only after triplet validation passes.`, `active_rule_triplets.${key}.coverage_status`));
    }
    if (entry.rule_ref !== rule.path) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_RULE_REF_MISMATCH', `Policy rule_ref must match active registry path for ${key}.`, `active_rule_triplets.${key}.rule_ref`));
    }
    if (entry.fixture_scope_only !== true || entry.synthetic_fixture_evidence_only !== true || entry.real_target_project_proof_claimed !== false) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_RULE_EVIDENCE_BOUNDARY_INVALID', `Policy entry for ${key} must remain fixture-scoped and synthetic-only.`, `active_rule_triplets.${key}`));
    }
  }

  return diagnostics;
}

function validateTripletEntry(entry) {
  const diagnostics = [];
  const inputHashesByKind = new Map();

  if (!isPlainObject(entry.triplet)) {
    return [diagnostic('RESOLVER_FIXTURE_TRIPLET_OBJECT_REQUIRED', 'Policy entry requires a triplet object.', `active_rule_triplets.${policyTripletKey(entry)}.triplet`)];
  }

  for (const kind of REQUIRED_KINDS) {
    const fixtures = entry.triplet[kind];
    if (!Array.isArray(fixtures) || fixtures.length === 0) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_KIND_MISSING', `${policyTripletKey(entry)} is missing ${kind} fixture coverage.`, `active_rule_triplets.${policyTripletKey(entry)}.triplet.${kind}`));
      continue;
    }

    inputHashesByKind.set(kind, []);

    for (const [fixtureIndex, fixtureMeta] of fixtures.entries()) {
      const basePath = `active_rule_triplets.${policyTripletKey(entry)}.triplet.${kind}[${fixtureIndex}]`;
      diagnostics.push(...validateFixtureMeta(entry, fixtureMeta, kind, basePath, inputHashesByKind));
    }
  }

  const validHashes = new Set(inputHashesByKind.get('valid') || []);
  const invalidHashes = new Set(inputHashesByKind.get('invalid') || []);
  const adversarialHashes = new Set(inputHashesByKind.get('adversarial') || []);

  for (const hash of validHashes) {
    if (invalidHashes.has(hash)) diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_VALID_INVALID_NOT_DISTINCT', 'Valid and invalid triplet fixtures must not have identical resolver input.', 'active_rule_triplets.triplet'));
    if (adversarialHashes.has(hash)) diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_VALID_ADVERSARIAL_NOT_DISTINCT', 'Valid and adversarial triplet fixtures must not have identical resolver input.', 'active_rule_triplets.triplet'));
  }
  for (const hash of adversarialHashes) {
    if (invalidHashes.has(hash)) diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_ADVERSARIAL_INVALID_NOT_DISTINCT', 'Adversarial and ordinary invalid triplet fixtures must not have identical resolver input.', 'active_rule_triplets.triplet'));
  }

  return diagnostics;
}

function validateFixtureMeta(entry, fixtureMeta, kind, basePath, inputHashesByKind) {
  const diagnostics = [];

  if (!isPlainObject(fixtureMeta)) {
    return [diagnostic('RESOLVER_FIXTURE_TRIPLET_FIXTURE_META_INVALID', 'Fixture triplet metadata entry must be a JSON object.', basePath)];
  }

  if (typeof fixtureMeta.path !== 'string' || fixtureMeta.path.trim().length === 0) {
    return [diagnostic('RESOLVER_FIXTURE_TRIPLET_FIXTURE_PATH_REQUIRED', 'Fixture triplet metadata requires a non-empty path.', `${basePath}.path`)];
  }

  const expectedPrefix = `kernel/fixtures/${kind}/resolver_mvp/`;
  if (!fixtureMeta.path.startsWith(expectedPrefix)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_PATH_KIND_MISMATCH', `${kind} fixture path must start with ${expectedPrefix}.`, `${basePath}.path`));
  }

  let fixture;
  try {
    fixture = readJson(fixtureMeta.path);
  } catch (error) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_FIXTURE_READ_FAILED', `Fixture failed to read or parse: ${error.message}`, fixtureMeta.path));
    return diagnostics;
  }

  if (!isPlainObject(fixture)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_FIXTURE_INVALID_OBJECT', 'Fixture must parse to a non-empty JSON object.', fixtureMeta.path));
    return diagnostics;
  }

  const requiredFixtureFields = ['fixture_type', 'schema_version', 'case_id', 'case_kind', 'input', 'expected_result'];
  for (const field of requiredFixtureFields) {
    if (!(field in fixture)) diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_FIXTURE_STUB_FIELD_MISSING', `Fixture is missing required field ${field}; empty stubs do not count.`, `${fixtureMeta.path}.${field}`));
  }

  if (fixture.fixture_type !== 'resolver_mvp_case') {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_FIXTURE_TYPE_INVALID', 'Triplet fixture must use fixture_type=resolver_mvp_case.', `${fixtureMeta.path}.fixture_type`));
  }

  if (fixture.case_kind !== kind || fixtureMeta.case_kind !== kind) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_CASE_KIND_MISMATCH', `Fixture case_kind and metadata case_kind must both equal ${kind}.`, `${fixtureMeta.path}.case_kind`));
  }

  if (!isPlainObject(fixture.input) || Object.keys(fixture.input).length === 0) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_INPUT_REQUIRED', 'Fixture input must be a non-empty object; empty stubs do not count.', `${fixtureMeta.path}.input`));
  } else {
    inputHashesByKind.get(kind).push(contentHash(fixture.input));
  }

  if (fixture.input?.decision_family_id !== entry.decision_family_id) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_DECISION_FAMILY_MISMATCH', `Fixture input decision_family_id must match active rule family ${entry.decision_family_id}.`, `${fixtureMeta.path}.input.decision_family_id`));
  }

  if (!isPlainObject(fixture.expected_result)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EXPECTED_RESULT_REQUIRED', 'Fixture expected_result must be a non-empty object.', `${fixtureMeta.path}.expected_result`));
    return diagnostics;
  }

  const expected = fixture.expected_result;
  if (!RESOLVER_STATUSES.has(expected.resolver_status)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EXPECTED_STATUS_INVALID', 'Fixture expected_result.resolver_status must be a known resolver status.', `${fixtureMeta.path}.expected_result.resolver_status`));
  }

  if (fixtureMeta.expected_status && fixtureMeta.expected_status !== expected.resolver_status) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EXPECTED_STATUS_MISMATCH', 'Policy expected_status must match fixture expected_result.resolver_status.', `${basePath}.expected_status`));
  }

  if (!Object.prototype.hasOwnProperty.call(expected, 'selected_option')) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_SELECTED_OPTION_EXPECTATION_REQUIRED', 'Fixture expected_result must explicitly include selected_option, including null for no selection.', `${fixtureMeta.path}.expected_result.selected_option`));
  }

  const expectedCodes = Array.isArray(expected.diagnostic_codes) ? expected.diagnostic_codes : [];
  if (!Array.isArray(expected.diagnostic_codes)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EXPECTED_DIAGNOSTICS_ARRAY_REQUIRED', 'Fixture expected_result.diagnostic_codes must be an array.', `${fixtureMeta.path}.expected_result.diagnostic_codes`));
  }

  if ((kind === 'invalid' || kind === 'adversarial') && expectedCodes.length === 0) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EXPECTED_DIAGNOSTIC_REQUIRED', `${kind} fixture must assert at least one expected diagnostic code.`, `${fixtureMeta.path}.expected_result.diagnostic_codes`));
  }

  if (kind === 'invalid' && expected.resolver_status !== 'unresolvable') {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_INVALID_MUST_FAIL_CLOSED', 'Invalid triplet fixtures must fail closed as unresolvable.', `${fixtureMeta.path}.expected_result.resolver_status`));
  }

  if (kind === 'adversarial') {
    if (!['conditional', 'unresolvable'].includes(expected.resolver_status)) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_ADVERSARIAL_OUTCOME_INVALID', 'Adversarial fixtures must become conditional or unresolvable, never auto_resolved.', `${fixtureMeta.path}.expected_result.resolver_status`));
    }
    if (!isPlainObject(fixtureMeta.adversarial_distinction_from_invalid) || typeof fixtureMeta.adversarial_distinction_from_invalid.mutation_kind !== 'string') {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_ADVERSARIAL_DISTINCTION_REQUIRED', 'Adversarial metadata must describe how it differs meaningfully from ordinary invalid fixtures.', `${basePath}.adversarial_distinction_from_invalid`));
    }
  }

  if (!hasSyntheticBoundaryNote(fixture)) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_SYNTHETIC_BOUNDARY_NOTE_REQUIRED', 'Fixture notes must explicitly say the evidence is not real target-project proof/evidence and not runtime validation.', `${fixtureMeta.path}.notes`));
  }

  for (const [index, ref] of fixtureEvidenceRefs(fixture).entries()) {
    if (ref?.source_type !== 'kernel_fixture') {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_SOURCE_TYPE_MUST_BE_KERNEL_FIXTURE', 'Resolver MVP triplet evidence refs must remain source_type=kernel_fixture.', `${fixtureMeta.path}.input.evidence_refs[${index}].source_type`));
    }
    const limitations = Array.isArray(ref?.limitations) ? ref.limitations.join(' ').toLowerCase() : '';
    const saysSynthetic = limitations.includes('controlled fixture') || limitations.includes('matrix guidance only') || limitations.includes('unrelated controlled fixture');
    const saysNotReal = limitations.includes('not real target-project evidence') || limitations.includes('not real target-project proof') || limitations.includes('does not prove target project availability');
    if (!saysSynthetic || !saysNotReal) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EVIDENCE_REF_BOUNDARY_REQUIRED', 'Each evidence ref must stay synthetic and must not claim real target-project proof.', `${fixtureMeta.path}.input.evidence_refs[${index}].limitations`));
    }
  }

  const actual = resolveDecision(fixture.input);
  if (actual.resolver_status !== expected.resolver_status) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_ACTUAL_STATUS_MISMATCH', `Resolver output status ${actual.resolver_status} did not match fixture expected status ${expected.resolver_status}.`, `${fixtureMeta.path}.expected_result.resolver_status`));
  }

  const actualSelected = actual.selected_option?.option_id ?? null;
  if (actualSelected !== expected.selected_option) {
    diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_ACTUAL_SELECTED_OPTION_MISMATCH', `Resolver selected_option ${actualSelected} did not match fixture expected selected_option ${expected.selected_option}.`, `${fixtureMeta.path}.expected_result.selected_option`));
  }

  const actualCodes = diagnosticCodes(actual);
  for (const expectedCode of expectedCodes) {
    if (!actualCodes.has(expectedCode)) {
      diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_EXPECTED_DIAGNOSTIC_MISSING', `Resolver output did not emit expected diagnostic code ${expectedCode}.`, `${fixtureMeta.path}.expected_result.diagnostic_codes`));
    }
  }

  if (Array.isArray(fixtureMeta.expected_diagnostic_codes)) {
    for (const expectedCode of fixtureMeta.expected_diagnostic_codes) {
      if (!expectedCodes.includes(expectedCode)) {
        diagnostics.push(diagnostic('RESOLVER_FIXTURE_TRIPLET_POLICY_DIAGNOSTIC_NOT_IN_FIXTURE', `Policy expected diagnostic ${expectedCode} must also be asserted by the fixture.`, `${basePath}.expected_diagnostic_codes`));
      }
    }
  }

  return diagnostics;
}

function formatDiagnostic(item) {
  return `${item.code} [${item.severity}] ${item.path}: ${item.message}`;
}

function runValidation() {
  const output = ['Resolver fixture triplet validator summary'];
  let failed = false;
  let registry;
  let policy;

  try {
    registry = readJson(registryPath);
    output.push('Resolver registry: PASS');
  } catch (error) {
    failed = true;
    output.push('Resolver registry: FAIL');
    output.push(`  - RESOLVER_FIXTURE_TRIPLET_REGISTRY_READ_FAILED: ${error.message}`);
  }

  try {
    policy = readJson(policyPath);
    output.push('Fixture triplet policy: PASS');
  } catch (error) {
    failed = true;
    output.push('Fixture triplet policy: FAIL');
    output.push(`  - RESOLVER_FIXTURE_TRIPLET_POLICY_READ_FAILED: ${error.message}`);
  }

  const diagnostics = [
    ...(policy ? validatePolicyShape(policy) : []),
    ...(registry && policy ? assertPolicyCoversActiveRules(registry, policy) : [])
  ];

  if (policy && Array.isArray(policy.active_rule_triplets)) {
    for (const entry of policy.active_rule_triplets) diagnostics.push(...validateTripletEntry(entry));
  }

  if (diagnostics.length > 0) {
    failed = true;
    output.push('Fixture triplet coverage: FAIL');
    output.push(...diagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
  } else {
    const count = Array.isArray(policy?.active_rule_triplets) ? policy.active_rule_triplets.length : 0;
    output.push(`Fixture triplet coverage: PASS (${count} active rule triplet(s))`);
    output.push('Missing valid/invalid/adversarial coverage would fail this validator.');
    output.push('Empty fixture stubs, case-kind mismatches, case-name-only coverage, and real target-project proof claims are rejected.');
  }

  output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
  console.log(output.join('\n'));
  process.exit(failed ? 1 : 0);
}

runValidation();
