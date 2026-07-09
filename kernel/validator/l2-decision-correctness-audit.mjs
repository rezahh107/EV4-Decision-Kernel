#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDecision } from '../resolver-mvp/resolve-high-risk-p0.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const EVIDENCE_TIER_RANK = new Map([
  ['none', 0],
  ['official_docs', 1],
  ['project_export', 2],
  ['runtime_browser', 3],
  ['downstream_validated', 4]
]);

const fixturePlan = [
  { path: 'valid/l2_decision_audit/layout_structure_auto_resolved_flexbox_consistent.json', expectedStatus: 'passed', expectedCodes: [] },
  { path: 'valid/l2_decision_audit/layout_structure_conditional_official_docs_bounded_choice.json', expectedStatus: 'passed', expectedCodes: [] },
  { path: 'invalid/l2_decision_audit/invalid_schema_valid_resolver_wrong_selected_option.json', expectedStatus: 'failed', expectedCodes: ['L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET', 'L2_SELECTED_OPTION_MISMATCH', 'L2_HUMAN_OVERRIDE_NOT_MARKED'] },
  { path: 'invalid/l2_decision_audit/invalid_forbidden_option_selected.json', expectedStatus: 'failed', expectedCodes: ['L2_FORBIDDEN_OPTION_SELECTED', 'L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET', 'L2_HUMAN_OVERRIDE_NOT_MARKED'] },
  { path: 'invalid/l2_decision_audit/invalid_missing_or_under_tier_evidence.json', expectedStatus: 'failed', expectedCodes: ['L2_EVIDENCE_TIER_TOO_LOW', 'L2_REQUIRED_EVIDENCE_REF_MISSING_FROM_RECORD'] },
  { path: 'invalid/l2_decision_audit/invalid_conditional_missing_justification.json', expectedStatus: 'failed', expectedCodes: ['L2_CONDITIONAL_DECISION_MUST_BE_PROVISIONAL', 'L2_CONDITIONAL_JUSTIFICATION_REQUIRED', 'L2_CONDITIONAL_JUSTIFICATION_EVIDENCE_REF_REQUIRED'] },
  { path: 'invalid/l2_decision_audit/invalid_rule_version_mismatch_requires_reaudit.json', expectedStatus: 'failed', expectedCodes: ['L2_RULE_VERSION_MISMATCH', 'L2_DECISION_REQUIRES_REAUDIT'] },
  { path: 'adversarial/l2_decision_audit/adversarial_official_docs_project_ready_overclaim.json', expectedStatus: 'failed', expectedCodes: ['L2_UNSUPPORTED_OVERCLAIM_ASSERTED'] },
  { path: 'adversarial/l2_decision_audit/adversarial_unsupported_family_not_covered.json', expectedStatus: 'unsupported', expectedCodes: ['L2_UNSUPPORTED_DECISION_FAMILY'] }
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(repoRoot, pathFromRoot), 'utf8'));
}

function isPlainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function knownTier(tier) {
  return typeof tier === 'string' && EVIDENCE_TIER_RANK.has(tier);
}

function tierRank(tier) {
  return knownTier(tier) ? EVIDENCE_TIER_RANK.get(tier) : -1;
}

function diagnostic(code, message, path, severity = 'error') {
  return { code, severity, message, ...(path ? { path } : {}) };
}

function sortedDiagnostics(diagnostics) {
  return [...diagnostics].sort((left, right) => {
    const leftKey = `${left.code}|${left.path || ''}|${left.message}`;
    const rightKey = `${right.code}|${right.path || ''}|${right.message}`;
    return leftKey.localeCompare(rightKey);
  });
}

function optionIds(options) {
  if (!Array.isArray(options)) return [];
  return options
    .map((option) => (typeof option === 'string' ? option : option?.option_id))
    .filter((option) => typeof option === 'string' && option.length > 0)
    .sort();
}

function selectedOptionId(decisionRecord) {
  return decisionRecord?.selected_option?.option_id || null;
}

function evidenceRefs(value) {
  return Array.isArray(value?.evidence_refs) ? value.evidence_refs : [];
}

function evidenceById(refs) {
  const indexed = new Map();
  for (const ref of refs || []) {
    if (typeof ref?.evidence_id === 'string') indexed.set(ref.evidence_id, ref);
  }
  return indexed;
}

function loadResolverMetadata() {
  const diagnostics = [];
  const families = new Map();
  let vocabulary = { forbidden_overclaims: [] };

  try {
    vocabulary = readJson('kernel/decision-governance/resolver-status-vocabulary.v0.json');
  } catch (error) {
    diagnostics.push(diagnostic('L2_RESOLVER_STATUS_VOCABULARY_READ_FAILED', `Resolver status vocabulary could not be read: ${error.message}`, 'kernel/decision-governance/resolver-status-vocabulary.v0.json'));
  }

  try {
    const registry = readJson('kernel/decision-governance/resolver-rule-registry.v0.json');
    const activeRules = Array.isArray(registry.active_rules) ? registry.active_rules : [];

    for (const [index, entry] of activeRules.entries()) {
      if (!isPlainObject(entry) || typeof entry.path !== 'string') {
        diagnostics.push(diagnostic('L2_ACTIVE_RULE_ENTRY_INVALID', 'Active resolver rule entries must be objects with a path.', `active_rules[${index}]`));
        continue;
      }

      try {
        const rule = readJson(entry.path);
        if (typeof rule.decision_family_id === 'string') {
          families.set(rule.decision_family_id, {
            registry_entry: entry,
            rule,
            forbidden_overclaims: [
              ...(Array.isArray(vocabulary.forbidden_overclaims) ? vocabulary.forbidden_overclaims : []),
              ...(Array.isArray(rule.forbidden_overclaims) ? rule.forbidden_overclaims : [])
            ].sort()
          });
        }
      } catch (error) {
        diagnostics.push(diagnostic('L2_ACTIVE_RULE_READ_FAILED', `Active resolver rule could not be read: ${error.message}`, entry.path));
      }
    }
  } catch (error) {
    diagnostics.push(diagnostic('L2_RESOLVER_RULE_REGISTRY_READ_FAILED', `Resolver rule registry could not be read: ${error.message}`, 'kernel/decision-governance/resolver-rule-registry.v0.json'));
  }

  return { families, diagnostics };
}

function conditionEvidenceRefs(input) {
  return Array.isArray(input?.context?.required_evidence_refs)
    ? [...new Set(input.context.required_evidence_refs.filter((item) => typeof item === 'string'))].sort()
    : [];
}

function justificationText(decisionRecord) {
  const parts = [];
  if (typeof decisionRecord?.provisional_status?.reason === 'string') parts.push(decisionRecord.provisional_status.reason);
  if (Array.isArray(decisionRecord?.notes)) parts.push(...decisionRecord.notes.filter((item) => typeof item === 'string'));
  return parts.join('\n');
}

function assertedClaims(auditInput) {
  return Array.isArray(auditInput?.asserted_claims) ? auditInput.asserted_claims.filter((claim) => typeof claim === 'string') : [];
}

function hasUnsupportedFamily(resolverResult, resolverInput, metadata) {
  const familyId = resolverInput?.decision_family_id;
  const resolverCodes = new Set((resolverResult.diagnostics || []).map((item) => item.code));
  return typeof familyId !== 'string' || !metadata.families.has(familyId) || resolverCodes.has('RESOLVER_MVP_UNKNOWN_DECISION_FAMILY');
}

export function auditL2DecisionCorrectness(auditInput, metadata = loadResolverMetadata()) {
  const diagnostics = [...metadata.diagnostics];

  if (!isPlainObject(auditInput)) {
    return { audit_status: 'failed', covered_decision_family: null, human_override_count: 0, diagnostics: [diagnostic('L2_AUDIT_INPUT_OBJECT_REQUIRED', 'L2 audit input must be a JSON object.', '(root)')] };
  }

  const resolverInput = auditInput.resolver_input;
  const decisionRecord = auditInput.decision_record;

  if (!isPlainObject(resolverInput)) diagnostics.push(diagnostic('L2_RESOLVER_INPUT_REQUIRED', 'L2 audit requires resolver_input.', 'resolver_input'));
  if (!isPlainObject(decisionRecord)) diagnostics.push(diagnostic('L2_DECISION_RECORD_REQUIRED', 'L2 audit requires decision_record.', 'decision_record'));

  if (!isPlainObject(resolverInput) || !isPlainObject(decisionRecord)) {
    return { audit_status: 'failed', covered_decision_family: null, human_override_count: 0, diagnostics: sortedDiagnostics(diagnostics) };
  }

  const resolverResult = resolveDecision(resolverInput);
  const unsupportedFamily = hasUnsupportedFamily(resolverResult, resolverInput, metadata);
  const humanOverrideCount = decisionRecord.decision_type === 'human_override' && isPlainObject(decisionRecord.human_override) ? 1 : 0;

  if (unsupportedFamily) {
    diagnostics.push(diagnostic('L2_UNSUPPORTED_DECISION_FAMILY', `L2 active coverage is limited to resolver-covered families; ${resolverInput.decision_family_id || '(missing)'} is not covered.`, 'resolver_input.decision_family_id'));
    return {
      audit_status: 'unsupported',
      covered_decision_family: null,
      resolver_result: {
        resolver_status: resolverResult.resolver_status,
        selected_option: resolverResult.selected_option,
        allowed_options: resolverResult.allowed_options,
        rule_id: resolverResult.rule_id,
        rule_version: resolverResult.rule_version,
        evidence_tier: resolverResult.evidence_tier
      },
      human_override_count: humanOverrideCount,
      diagnostics: sortedDiagnostics(diagnostics)
    };
  }

  const selected = selectedOptionId(decisionRecord);
  const resolverSelected = resolverResult.selected_option?.option_id || null;
  const resolverAllowed = optionIds(resolverResult.allowed_options);
  const resolverForbidden = new Set(optionIds(resolverResult.forbidden_options));
  const differenceRequiresOverride = [];

  if (decisionRecord.resolver_status !== resolverResult.resolver_status) {
    diagnostics.push(diagnostic('L2_RESOLVER_STATUS_MISMATCH', `Decision record resolver_status=${decisionRecord.resolver_status} does not match resolver output ${resolverResult.resolver_status}.`, 'decision_record.resolver_status'));
    differenceRequiresOverride.push('resolver_status');
  }

  if (decisionRecord.rule_id !== resolverResult.rule_id) diagnostics.push(diagnostic('L2_RULE_ID_MISMATCH', `Decision record rule_id=${decisionRecord.rule_id} does not match resolver output ${resolverResult.rule_id}.`, 'decision_record.rule_id'));
  if (decisionRecord.rule_version !== resolverResult.rule_version) diagnostics.push(diagnostic('L2_RULE_VERSION_MISMATCH', `Decision record rule_version=${decisionRecord.rule_version} does not match active resolver rule_version ${resolverResult.rule_version}.`, 'decision_record.rule_version'));
  if (decisionRecord.requires_reaudit === true) diagnostics.push(diagnostic('L2_DECISION_REQUIRES_REAUDIT', 'Decision record requires_reaudit=true and cannot be treated as L2 accepted.', 'decision_record.requires_reaudit'));

  if (selected && selected !== 'none' && !resolverAllowed.includes(selected)) {
    diagnostics.push(diagnostic('L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET', `Selected option ${selected} is outside resolver allowed set: ${resolverAllowed.join(', ') || '(empty)'}.`, 'decision_record.selected_option.option_id'));
    differenceRequiresOverride.push('selected_option');
  }

  if (selected && resolverForbidden.has(selected)) {
    diagnostics.push(diagnostic('L2_FORBIDDEN_OPTION_SELECTED', `Selected option ${selected} is forbidden by the active resolver rule.`, 'decision_record.selected_option.option_id'));
    differenceRequiresOverride.push('selected_option');
  }

  if (resolverResult.resolver_status === 'auto_resolved' && resolverSelected && selected !== resolverSelected) {
    diagnostics.push(diagnostic('L2_SELECTED_OPTION_MISMATCH', `Resolver auto_resolved selected_option=${resolverSelected}, but decision record selected ${selected}.`, 'decision_record.selected_option.option_id'));
    differenceRequiresOverride.push('selected_option');
  }

  if (resolverResult.resolver_status !== 'unresolvable' && tierRank(decisionRecord.evidence_tier) < tierRank(resolverResult.evidence_tier)) {
    diagnostics.push(diagnostic('L2_EVIDENCE_TIER_TOO_LOW', `Decision record evidence_tier=${decisionRecord.evidence_tier} is below resolver evidence_tier=${resolverResult.evidence_tier}.`, 'decision_record.evidence_tier'));
  }

  const resolverInputEvidenceById = evidenceById(evidenceRefs(resolverInput));
  const decisionEvidenceById = evidenceById(evidenceRefs(decisionRecord));
  for (const requiredId of conditionEvidenceRefs(resolverInput)) {
    const resolverEvidence = resolverInputEvidenceById.get(requiredId);
    const decisionEvidence = decisionEvidenceById.get(requiredId);
    if (!decisionEvidence) {
      diagnostics.push(diagnostic('L2_REQUIRED_EVIDENCE_REF_MISSING_FROM_RECORD', `Decision record is missing required resolver evidence ref ${requiredId}.`, 'decision_record.evidence_refs'));
      continue;
    }
    if (resolverEvidence && tierRank(decisionEvidence.evidence_tier) < tierRank(resolverEvidence.evidence_tier)) {
      diagnostics.push(diagnostic('L2_REQUIRED_EVIDENCE_REF_UNDER_TIER', `Decision evidence ref ${requiredId} is below the resolver input tier ${resolverEvidence.evidence_tier}.`, 'decision_record.evidence_refs'));
    }
  }

  if (resolverResult.resolver_status === 'conditional') {
    const justification = justificationText(decisionRecord).trim();
    const requiredRefs = conditionEvidenceRefs(resolverInput);
    if (decisionRecord.provisional_status?.is_provisional !== true) diagnostics.push(diagnostic('L2_CONDITIONAL_DECISION_MUST_BE_PROVISIONAL', 'Conditional resolver output must remain visibly provisional in the decision record.', 'decision_record.provisional_status.is_provisional'));
    if (justification.length < 20 || /^(tbd|n\/a|unknown|because)$/i.test(justification)) diagnostics.push(diagnostic('L2_CONDITIONAL_JUSTIFICATION_REQUIRED', 'Conditional decisions require a specific bounded justification, not a placeholder.', 'decision_record.provisional_status.reason'));
    const evidenceAnchored = requiredRefs.length > 0 && requiredRefs.some((requiredId) => justification.includes(requiredId));
    if (!evidenceAnchored) diagnostics.push(diagnostic('L2_CONDITIONAL_JUSTIFICATION_EVIDENCE_REF_REQUIRED', 'Conditional justification must cite at least one resolver-required evidence_id.', 'decision_record.provisional_status.reason'));
  }

  if (differenceRequiresOverride.length > 0 && decisionRecord.decision_type !== 'human_override') diagnostics.push(diagnostic('L2_HUMAN_OVERRIDE_NOT_MARKED', `Decision differs from resolver output in ${[...new Set(differenceRequiresOverride)].sort().join(', ')} but decision_type is not human_override.`, 'decision_record.decision_type'));

  const familyMetadata = metadata.families.get(resolverInput.decision_family_id);
  const forbiddenOverclaims = new Set(familyMetadata?.forbidden_overclaims || []);
  for (const claim of assertedClaims(auditInput)) {
    if (forbiddenOverclaims.has(claim)) diagnostics.push(diagnostic('L2_UNSUPPORTED_OVERCLAIM_ASSERTED', `Audit context asserts unsupported claim ${claim}.`, 'asserted_claims'));
  }

  const finalDiagnostics = sortedDiagnostics(diagnostics);
  return {
    audit_status: finalDiagnostics.some((item) => item.severity === 'error') ? 'failed' : 'passed',
    covered_decision_family: resolverInput.decision_family_id,
    resolver_result: {
      resolver_status: resolverResult.resolver_status,
      selected_option: resolverResult.selected_option,
      allowed_options: resolverResult.allowed_options,
      rule_id: resolverResult.rule_id,
      rule_version: resolverResult.rule_version,
      evidence_tier: resolverResult.evidence_tier
    },
    human_override_count: humanOverrideCount,
    diagnostics: finalDiagnostics
  };
}

function readFixture(fixturePath) {
  try { return { fixture: readJson(`kernel/fixtures/${fixturePath}`), diagnostics: [] }; }
  catch (error) { return { fixture: null, diagnostics: [diagnostic('L2_FIXTURE_READ_FAILED', `${fixturePath} failed to read or parse: ${error.message}`, `kernel/fixtures/${fixturePath}`)] }; }
}

function category(path) { return path.split('/')[0]; }
function codes(result) { return new Set((result.diagnostics || []).map((item) => item.code)); }

function compareExpected(fixturePlanEntry, fixture, actual) {
  const diagnostics = [];
  const expected = fixture?.expected_result || {};
  const expectedStatus = expected.audit_status || fixturePlanEntry.expectedStatus;
  const expectedCodes = expected.diagnostic_codes || fixturePlanEntry.expectedCodes || [];
  if (actual.audit_status !== expectedStatus) diagnostics.push(diagnostic('L2_EXPECTED_AUDIT_STATUS_MISMATCH', `Expected audit_status=${expectedStatus}, observed ${actual.audit_status}.`, 'expected_result.audit_status'));
  for (const expectedCode of expectedCodes) {
    if (!codes(actual).has(expectedCode)) diagnostics.push(diagnostic('L2_EXPECTED_DIAGNOSTIC_MISSING', `Expected diagnostic ${expectedCode} was not emitted.`, 'expected_result.diagnostic_codes'));
  }
  return diagnostics;
}

function runValidation() {
  const output = ['L2 Decision Correctness Audit validator summary'];
  const metadata = loadResolverMetadata();
  let failed = false;
  const passedByCategory = new Map([['valid', 0], ['invalid', 0], ['adversarial', 0]]);
  const expectedByCategory = new Map([
    ['valid', fixturePlan.filter((item) => category(item.path) === 'valid').length],
    ['invalid', fixturePlan.filter((item) => category(item.path) === 'invalid').length],
    ['adversarial', fixturePlan.filter((item) => category(item.path) === 'adversarial').length]
  ]);

  if (metadata.diagnostics.length > 0) {
    failed = true;
    output.push('Resolver metadata: FAIL');
    output.push(...metadata.diagnostics.map((item) => `  - ${item.code}: ${item.message}`));
  } else if (!metadata.families.has('layout_structure')) {
    failed = true;
    output.push('Resolver metadata: FAIL');
    output.push('  - L2_LAYOUT_STRUCTURE_ACTIVE_RULE_REQUIRED: layout_structure must remain the active KROAD-007 covered family.');
  } else {
    output.push('Resolver metadata: PASS');
  }

  for (const planEntry of fixturePlan) {
    const { fixture, diagnostics: readDiagnostics } = readFixture(planEntry.path);
    if (readDiagnostics.length > 0) {
      failed = true;
      output.push(`${planEntry.path}: FAIL`);
      output.push(...readDiagnostics.map((item) => `  - ${item.code}: ${item.message}`));
      continue;
    }
    const actual = auditL2DecisionCorrectness(fixture.input, metadata);
    const expectationDiagnostics = compareExpected(planEntry, fixture, actual);
    if (expectationDiagnostics.length > 0) {
      failed = true;
      output.push(`${planEntry.path}: FAIL`);
      output.push(...expectationDiagnostics.map((item) => `  - ${item.code}: ${item.message}`));
      output.push(...actual.diagnostics.map((item) => `  - observed ${item.code}: ${item.message}`));
      continue;
    }
    passedByCategory.set(category(planEntry.path), (passedByCategory.get(category(planEntry.path)) || 0) + 1);
    output.push(`${planEntry.path}: PASS [${actual.audit_status}; human_overrides=${actual.human_override_count}]`);
  }

  output.push(`Valid L2 fixtures matched expected deterministic results: ${passedByCategory.get('valid')}/${expectedByCategory.get('valid')}`);
  output.push(`Invalid L2 fixtures failed with expected diagnostics: ${passedByCategory.get('invalid')}/${expectedByCategory.get('invalid')}`);
  output.push(`Adversarial L2 fixtures matched expected anti-overclaim/unsupported-family results: ${passedByCategory.get('adversarial')}/${expectedByCategory.get('adversarial')}`);
  output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
  console.log(output.join('\n'));
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) runValidation();
