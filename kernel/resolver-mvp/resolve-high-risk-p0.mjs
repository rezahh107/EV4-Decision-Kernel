#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const EVIDENCE_TIER_RANK = new Map([
  ['none', 0],
  ['official_docs', 1],
  ['project_export', 2],
  ['runtime_browser', 3],
  ['downstream_validated', 4]
]);

const fixturePlan = [
  {
    path: 'valid/resolver_mvp/layout_structure_auto_resolved_flexbox.json',
    mode: 'match'
  },
  {
    path: 'valid/resolver_mvp/layout_structure_conditional_official_docs_only.json',
    mode: 'match'
  },
  {
    path: 'valid/resolver_mvp/layout_structure_unresolvable_missing_project_export.json',
    mode: 'match'
  },
  {
    path: 'invalid/resolver_mvp/invalid_missing_evidence_refs.json',
    mode: 'diagnostics',
    expectedCodes: ['RESOLVER_MVP_MISSING_EVIDENCE_REFS', 'RESOLVER_MVP_REQUIRED_EVIDENCE_TIER_UNSATISFIED']
  },
  {
    path: 'invalid/resolver_mvp/invalid_unknown_family_auto_resolved.json',
    mode: 'diagnostics',
    expectedCodes: ['RESOLVER_MVP_UNKNOWN_DECISION_FAMILY', 'RESOLVER_MVP_EXPECTED_STATUS_MISMATCH']
  },
  {
    path: 'adversarial/resolver_mvp/adversarial_official_docs_auto_resolved.json',
    mode: 'diagnostics',
    expectedCodes: ['RESOLVER_MVP_OFFICIAL_DOCS_ONLY_CONDITIONAL', 'RESOLVER_MVP_EXPECTED_STATUS_MISMATCH']
  },
  {
    path: 'adversarial/resolver_mvp/adversarial_grid_without_availability.json',
    mode: 'diagnostics',
    expectedCodes: ['RESOLVER_MVP_GRID_REQUIRES_AVAILABILITY', 'RESOLVER_MVP_EXPECTED_STATUS_MISMATCH']
  }
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(root, pathFromRoot), 'utf8'));
}

function tierRank(tier) {
  return EVIDENCE_TIER_RANK.get(tier) ?? -1;
}

function diagnostic(code, message, path, severity = 'error') {
  return { code, severity, message, ...(path ? { path } : {}) };
}

function evidenceRefs(input) {
  return Array.isArray(input?.evidence_refs) ? input.evidence_refs : [];
}

function highestEvidenceTier(refs) {
  let highest = 'none';
  for (const ref of refs) {
    if (tierRank(ref?.evidence_tier) > tierRank(highest)) highest = ref.evidence_tier;
  }
  return highest;
}

function hasEvidenceAtOrAbove(refs, requiredTier) {
  if (requiredTier === 'none') return true;
  const requiredRank = tierRank(requiredTier);
  return refs.some((ref) => tierRank(ref?.evidence_tier) >= requiredRank);
}

function hasOfficialDocs(refs) {
  return refs.some((ref) => ref?.evidence_tier === 'official_docs');
}

function sortedOptionObjects(options) {
  return [...options].sort().map((option_id) => ({ option_id }));
}

function optionLabel(rule, optionId) {
  const match = (rule.option_set || []).find((option) => option.option_id === optionId);
  return match?.display_name || optionId;
}

function result({ rule, status, selectedOption = null, allowedOptions, diagnostics, evidenceTier }) {
  const stableAllowed = [...new Set(allowedOptions || [])].sort();
  return {
    resolver_status: status,
    selected_option: selectedOption ? { option_id: selectedOption, label: optionLabel(rule, selectedOption) } : null,
    allowed_options: sortedOptionObjects(stableAllowed),
    forbidden_options: [...new Set(rule.forbidden_options || [])].sort(),
    evidence_tier: evidenceTier,
    rule_id: rule.rule_id,
    rule_version: rule.rule_version,
    diagnostics: diagnostics.map((item) => ({
      code: item.code,
      severity: item.severity,
      message: item.message,
      ...(item.path ? { path: item.path } : {})
    }))
  };
}

function loadActiveRules() {
  const registry = readJson('kernel/decision-governance/resolver-rule-registry.v0.json');
  const rules = new Map();
  for (const entry of registry.active_rules || []) {
    if (!entry?.path) continue;
    const rule = readJson(entry.path);
    rules.set(rule.decision_family_id, rule);
  }
  return rules;
}

function resolveLayoutStructure(input, rule) {
  const diagnostics = [];
  const refs = evidenceRefs(input);
  const evidenceTier = highestEvidenceTier(refs);
  const allowedAll = rule.allowed_options || ['div_block', 'flexbox', 'grid'];

  if (refs.length === 0) {
    diagnostics.push(diagnostic('RESOLVER_MVP_MISSING_EVIDENCE_REFS', 'Resolver MVP input must include evidence_refs.', 'input.evidence_refs'));
    diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_TIER_UNSATISFIED', 'layout_structure requires project_export evidence for auto_resolved output.', 'input.evidence_refs'));
    return result({ rule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier });
  }

  if (!hasEvidenceAtOrAbove(refs, rule.required_evidence_tier)) {
    if (hasOfficialDocs(refs)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_OFFICIAL_DOCS_ONLY_CONDITIONAL', 'Official-doc-only evidence supports documented capability only; project-specific layout remains conditional.', 'input.evidence_refs', 'warning'));
      return result({ rule, status: 'conditional', selectedOption: null, allowedOptions: allowedAll, diagnostics, evidenceTier });
    }

    diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_TIER_UNSATISFIED', 'layout_structure requires project_export evidence for project-specific resolution.', 'input.evidence_refs'));
    return result({ rule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier });
  }

  const context = input?.context;
  if (!context || typeof context !== 'object' || Array.isArray(context)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_UNSUPPORTED_CONTEXT', 'layout_structure requires a structured context object.', 'input.context'));
    return result({ rule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier });
  }

  const layoutIntent = context.layout_intent;
  const childTopology = context.child_topology;
  const axis = context.axis;
  const twoAxisRequired = context.two_axis_required === true;
  const simpleWrapperOnly = context.simple_wrapper_only === true;
  const gridAvailabilityProven = context.grid_availability_proven === true;

  if (layoutIntent === 'wrapper' && simpleWrapperOnly && !twoAxisRequired) {
    return result({ rule, status: 'auto_resolved', selectedOption: 'div_block', allowedOptions: ['div_block'], diagnostics, evidenceTier });
  }

  if (layoutIntent === 'single_axis' && ['row', 'column'].includes(axis) && ['linear', 'wrapping'].includes(childTopology) && !twoAxisRequired) {
    return result({ rule, status: 'auto_resolved', selectedOption: 'flexbox', allowedOptions: ['flexbox'], diagnostics, evidenceTier });
  }

  if (layoutIntent === 'two_axis' || twoAxisRequired) {
    if (childTopology === 'two_dimensional' && gridAvailabilityProven) {
      return result({ rule, status: 'auto_resolved', selectedOption: 'grid', allowedOptions: ['grid'], diagnostics, evidenceTier });
    }
    diagnostics.push(diagnostic('RESOLVER_MVP_GRID_REQUIRES_AVAILABILITY', 'Grid may not be auto_resolved unless two-dimensional topology and grid availability are both evidenced.', 'input.context.grid_availability_proven'));
    return result({ rule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier });
  }

  diagnostics.push(diagnostic('RESOLVER_MVP_AMBIGUOUS_PROJECT_EXPORT_CONDITIONAL', 'Project_export evidence is present but does not satisfy a single deterministic layout rule.', 'input.context', 'warning'));
  return result({ rule, status: 'conditional', selectedOption: null, allowedOptions: allowedAll, diagnostics, evidenceTier });
}

export function resolveDecision(input, activeRules = loadActiveRules()) {
  const decisionFamilyId = input?.decision_family_id;
  if (!decisionFamilyId || typeof decisionFamilyId !== 'string') {
    const fallbackRule = { rule_id: 'resolver.rule.unknown', rule_version: '0.0.0', forbidden_options: [], allowed_options: ['none'], option_set: [] };
    const diagnostics = [diagnostic('RESOLVER_MVP_DECISION_FAMILY_REQUIRED', 'decision_family_id is required.', 'input.decision_family_id')];
    return result({ rule: fallbackRule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier: highestEvidenceTier(evidenceRefs(input)) });
  }

  const rule = activeRules.get(decisionFamilyId);
  if (!rule) {
    const fallbackRule = { rule_id: 'resolver.rule.unknown', rule_version: '0.0.0', forbidden_options: [], allowed_options: ['none'], option_set: [] };
    const diagnostics = [diagnostic('RESOLVER_MVP_UNKNOWN_DECISION_FAMILY', `No active Resolver MVP rule is registered for ${decisionFamilyId}.`, 'input.decision_family_id')];
    return result({ rule: fallbackRule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier: highestEvidenceTier(evidenceRefs(input)) });
  }

  if (decisionFamilyId === 'layout_structure') return resolveLayoutStructure(input, rule);

  const diagnostics = [diagnostic('RESOLVER_MVP_UNSUPPORTED_CONTEXT', `Registered rule ${rule.rule_id} has no evaluator implementation.`, 'input.decision_family_id')];
  return result({ rule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier: highestEvidenceTier(evidenceRefs(input)) });
}

function codes(result) {
  return new Set((result.diagnostics || []).map((item) => item.code));
}

function compareExpected(fixture, actual) {
  const diagnostics = [];
  const expected = fixture.expected_result || {};
  const expectedCodes = new Set(expected.diagnostic_codes || []);

  if (expected.resolver_status && actual.resolver_status !== expected.resolver_status) {
    diagnostics.push(diagnostic('RESOLVER_MVP_EXPECTED_STATUS_MISMATCH', `Expected resolver_status=${expected.resolver_status}, observed ${actual.resolver_status}.`, 'expected_result.resolver_status'));
  }

  if ('selected_option' in expected) {
    const actualOption = actual.selected_option?.option_id ?? null;
    if (actualOption !== expected.selected_option) {
      diagnostics.push(diagnostic('RESOLVER_MVP_EXPECTED_SELECTED_OPTION_MISMATCH', `Expected selected_option=${expected.selected_option}, observed ${actualOption}.`, 'expected_result.selected_option'));
    }
  }

  for (const expectedCode of expectedCodes) {
    if (!codes(actual).has(expectedCode)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_EXPECTED_DIAGNOSTIC_MISSING', `Expected diagnostic ${expectedCode} was not emitted.`, 'expected_result.diagnostic_codes'));
    }
  }

  return diagnostics;
}

function validateFixture(fixture, plan) {
  const actual = resolveDecision(fixture.input);
  const expectedDiagnostics = compareExpected(fixture, actual);
  const allCodes = new Set([...actual.diagnostics.map((item) => item.code), ...expectedDiagnostics.map((item) => item.code)]);

  if (plan.mode === 'match') {
    return { actual, diagnostics: expectedDiagnostics };
  }

  const missingExpectedCodes = (plan.expectedCodes || []).filter((code) => !allCodes.has(code));
  const diagnostics = [];
  for (const code of missingExpectedCodes) {
    diagnostics.push(diagnostic('RESOLVER_MVP_EXPECTED_REJECTION_DIAGNOSTIC_MISSING', `Expected rejection diagnostic ${code} was not observed.`, plan.path));
  }
  return { actual, diagnostics };
}

function runValidation() {
  const output = ['Resolver MVP validator summary'];
  let failed = false;
  let validMatched = 0;
  let invalidRejected = 0;
  let adversarialRejected = 0;

  try {
    const activeRules = loadActiveRules();
    if (!activeRules.has('layout_structure')) {
      failed = true;
      output.push('Active rule registry: FAIL');
      output.push('  - RESOLVER_MVP_ACTIVE_LAYOUT_STRUCTURE_RULE_REQUIRED');
    } else {
      output.push('Active rule registry: PASS');
    }
  } catch (error) {
    failed = true;
    output.push('Active rule registry: FAIL');
    output.push(`  - RESOLVER_MVP_ACTIVE_RULE_LOAD_FAILED: ${error.message}`);
  }

  for (const plan of fixturePlan) {
    let fixture;
    try {
      fixture = readJson(`kernel/fixtures/${plan.path}`);
    } catch (error) {
      failed = true;
      output.push(`${plan.path}: FAIL`);
      output.push(`  - RESOLVER_MVP_FIXTURE_READ_FAILED: ${error.message}`);
      continue;
    }

    const { actual, diagnostics } = validateFixture(fixture, plan);
    if (diagnostics.length > 0) {
      failed = true;
      output.push(`${plan.path}: FAIL`);
      output.push(...diagnostics.map((item) => `  - ${item.code}: ${item.message}`));
      output.push(`  - observed_status=${actual.resolver_status}`);
      continue;
    }

    if (plan.mode === 'match') {
      validMatched += 1;
      output.push(`${plan.path}: PASS [${actual.resolver_status}]`);
    } else if (plan.path.startsWith('invalid/')) {
      invalidRejected += 1;
      output.push(`${plan.path}: PASS [expected rejection diagnostics observed]`);
    } else if (plan.path.startsWith('adversarial/')) {
      adversarialRejected += 1;
      output.push(`${plan.path}: PASS [adversarial overclaim rejected]`);
    }
  }

  output.push(`Valid Resolver MVP fixtures matched expected deterministic results: ${validMatched}/3`);
  output.push(`Invalid Resolver MVP fixtures rejected with expected diagnostics: ${invalidRejected}/2`);
  output.push(`Adversarial Resolver MVP fixtures rejected with expected diagnostics: ${adversarialRejected}/2`);
  output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
  console.log(output.join('\n'));
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}
