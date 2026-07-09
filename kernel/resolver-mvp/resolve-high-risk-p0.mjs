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
  'valid/resolver_mvp/layout_structure_auto_resolved_flexbox.json',
  'valid/resolver_mvp/layout_structure_conditional_official_docs_only.json',
  'valid/resolver_mvp/layout_structure_unresolvable_missing_project_export.json',
  'invalid/resolver_mvp/invalid_missing_evidence_refs.json',
  'invalid/resolver_mvp/invalid_unknown_family_auto_resolved.json',
  'invalid/resolver_mvp/invalid_unsupported_required_evidence_tier.json',
  'invalid/resolver_mvp/invalid_malformed_registry_active_rules_not_array.json',
  'invalid/resolver_mvp/invalid_malformed_active_rule_entry_string.json',
  'invalid/resolver_mvp/invalid_malformed_active_rule_file_null.json',
  'adversarial/resolver_mvp/adversarial_official_docs_auto_resolved.json',
  'adversarial/resolver_mvp/adversarial_grid_without_availability.json',
  'adversarial/resolver_mvp/adversarial_unrelated_project_export_ref.json',
  'adversarial/resolver_mvp/adversarial_missing_context_required_evidence_refs.json',
  'adversarial/resolver_mvp/adversarial_absent_context_required_evidence_ref.json'
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

function tierRank(tier) {
  return isKnownEvidenceTier(tier) ? EVIDENCE_TIER_RANK.get(tier) : -1;
}

function diagnostic(code, message, path, severity = 'error') {
  return { code, severity, message, ...(path ? { path } : {}) };
}

function evidenceRefs(input) {
  return Array.isArray(input?.evidence_refs) ? input.evidence_refs : [];
}

function evidenceById(refs) {
  const indexed = new Map();
  for (const ref of refs) {
    if (typeof ref?.evidence_id === 'string') indexed.set(ref.evidence_id, ref);
  }
  return indexed;
}

function highestEvidenceTier(refs) {
  let highest = 'none';
  for (const ref of refs) {
    if (isKnownEvidenceTier(ref?.evidence_tier) && tierRank(ref.evidence_tier) > tierRank(highest)) {
      highest = ref.evidence_tier;
    }
  }
  return highest;
}

function hasEvidenceAtOrAbove(refs, requiredTier) {
  if (!isKnownEvidenceTier(requiredTier)) return false;
  if (requiredTier === 'none') return true;
  const requiredRank = tierRank(requiredTier);
  return Array.isArray(refs) && refs.some((ref) => isKnownEvidenceTier(ref?.evidence_tier) && tierRank(ref.evidence_tier) >= requiredRank);
}

function hasOfficialDocs(refs) {
  return Array.isArray(refs) && refs.some((ref) => ref?.evidence_tier === 'official_docs');
}

function sortedOptionObjects(options) {
  return [...options].sort().map((option_id) => ({ option_id }));
}

function optionLabel(rule, optionId) {
  const optionSet = Array.isArray(rule?.option_set) ? rule.option_set : [];
  const match = optionSet.find((option) => option?.option_id === optionId);
  return match?.display_name || optionId;
}

function result({ rule, status, selectedOption = null, allowedOptions, diagnostics, evidenceTier }) {
  const safeRule = isPlainObject(rule) ? rule : {};
  const stableAllowed = [...new Set(allowedOptions || [])].sort();
  return {
    resolver_status: status,
    selected_option: selectedOption ? { option_id: selectedOption, label: optionLabel(safeRule, selectedOption) } : null,
    allowed_options: sortedOptionObjects(stableAllowed),
    forbidden_options: [...new Set(Array.isArray(safeRule.forbidden_options) ? safeRule.forbidden_options : [])].sort(),
    evidence_tier: evidenceTier,
    rule_id: safeRule.rule_id || 'resolver.rule.unknown',
    rule_version: safeRule.rule_version || '0.0.0',
    diagnostics: diagnostics.map((item) => ({
      code: item.code,
      severity: item.severity,
      message: item.message,
      ...(item.path ? { path: item.path } : {})
    }))
  };
}

function loadActiveRulesFromRegistry(registry, readRule = readJson) {
  const diagnostics = [];
  const rules = new Map();

  if (!isPlainObject(registry)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_REGISTRY_INVALID_OBJECT', 'Resolver MVP registry must be a JSON object.', 'resolver-rule-registry.v0.json'));
    return { rules, diagnostics };
  }

  if (!Array.isArray(registry.active_rules)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_ACTIVE_RULES_ARRAY_REQUIRED', 'resolver-rule-registry.v0.json active_rules must be an array.', 'active_rules'));
    return { rules, diagnostics };
  }

  for (const [index, entry] of registry.active_rules.entries()) {
    if (!isPlainObject(entry)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_ACTIVE_RULE_ENTRY_INVALID', 'Active rule registry entry must be a JSON object.', `active_rules[${index}]`));
      continue;
    }

    if (typeof entry.path !== 'string' || entry.path.trim().length === 0) {
      diagnostics.push(diagnostic('RESOLVER_MVP_ACTIVE_RULE_PATH_REQUIRED', 'Active rule registry entry requires a non-empty path.', `active_rules[${index}].path`));
      continue;
    }

    let rule;
    try {
      rule = readRule(entry.path);
    } catch (error) {
      diagnostics.push(diagnostic('RESOLVER_MVP_ACTIVE_RULE_FILE_READ_FAILED', `Active rule file failed to read or parse: ${error.message}`, entry.path));
      continue;
    }

    if (!isPlainObject(rule)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_ACTIVE_RULE_FILE_INVALID_OBJECT', 'Active rule file must parse to a JSON object.', entry.path));
      continue;
    }

    if (typeof rule.decision_family_id !== 'string' || rule.decision_family_id.trim().length === 0) {
      diagnostics.push(diagnostic('RESOLVER_MVP_ACTIVE_RULE_DECISION_FAMILY_REQUIRED', 'Active rule file requires a non-empty decision_family_id.', `${entry.path}.decision_family_id`));
      continue;
    }

    rules.set(rule.decision_family_id, rule);
  }

  return { rules, diagnostics };
}

function loadActiveRules() {
  try {
    return loadActiveRulesFromRegistry(readJson('kernel/decision-governance/resolver-rule-registry.v0.json'));
  } catch (error) {
    return {
      rules: new Map(),
      diagnostics: [diagnostic('RESOLVER_MVP_REGISTRY_READ_FAILED', `Resolver MVP registry failed to read or parse: ${error.message}`, 'kernel/decision-governance/resolver-rule-registry.v0.json')]
    };
  }
}

function normalizeActiveRuleLoad(activeRuleLoad) {
  if (activeRuleLoad instanceof Map) return { rules: activeRuleLoad, diagnostics: [] };
  if (isPlainObject(activeRuleLoad) && activeRuleLoad.rules instanceof Map) {
    return {
      rules: activeRuleLoad.rules,
      diagnostics: Array.isArray(activeRuleLoad.diagnostics) ? activeRuleLoad.diagnostics : []
    };
  }
  return {
    rules: new Map(),
    diagnostics: [diagnostic('RESOLVER_MVP_ACTIVE_RULE_LOAD_INVALID', 'Active rule load must be a Map or { rules: Map, diagnostics: [] } object.', 'activeRules')]
  };
}

function fallbackRule() {
  return { rule_id: 'resolver.rule.unknown', rule_version: '0.0.0', forbidden_options: [], allowed_options: ['none'], option_set: [] };
}

function findCondition(rule, bucketName, conditionId) {
  const bucket = Array.isArray(rule?.[bucketName]) ? rule[bucketName] : [];
  return bucket.find((condition) => condition?.condition_id === conditionId) || null;
}

function failClosed(rule, diagnostics, evidenceTier) {
  return result({ rule, status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier });
}

function validateConditionEvidenceBinding({ rule, refs, context, condition, diagnostics, evidenceTier }) {
  if (!condition || !isPlainObject(condition)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_CONDITION_NOT_FOUND', 'Active resolver condition must exist before non-unresolvable output.', 'rule.conditions'));
    return { ok: false, response: failClosed(rule, diagnostics, evidenceTier) };
  }

  if (!Array.isArray(context.required_evidence_refs) || context.required_evidence_refs.length === 0) {
    diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_REFS_REQUIRED', 'context.required_evidence_refs must be a non-empty array before non-unresolvable output.', 'input.context.required_evidence_refs'));
    return { ok: false, response: failClosed(rule, diagnostics, evidenceTier) };
  }

  const conditionRequiredRefs = Array.isArray(condition.required_evidence_refs) ? condition.required_evidence_refs : [];
  if (conditionRequiredRefs.length === 0) {
    diagnostics.push(diagnostic('RESOLVER_MVP_CONDITION_REQUIRED_EVIDENCE_REFS_REQUIRED', 'Resolver condition must declare required_evidence_refs before non-unresolvable output.', `rule.conditions.${condition.condition_id}.required_evidence_refs`));
    return { ok: false, response: failClosed(rule, diagnostics, evidenceTier) };
  }

  const byId = evidenceById(refs);
  const contextRequiredSet = new Set(context.required_evidence_refs);
  const conditionRequiredSet = new Set(conditionRequiredRefs);
  const matchedRefs = [];

  for (const requiredId of contextRequiredSet) {
    if (!conditionRequiredSet.has(requiredId)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_REF_NOT_ALLOWED', `context.required_evidence_refs contains ${requiredId}, which is not required by the active resolver condition.`, 'input.context.required_evidence_refs'));
    }
    if (!byId.has(requiredId)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_REF_NOT_FOUND', `Required evidence ref ${requiredId} is not present in input.evidence_refs.`, 'input.evidence_refs'));
    }
  }

  for (const requiredId of conditionRequiredSet) {
    if (!contextRequiredSet.has(requiredId)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_REF_NOT_DECLARED', `Active resolver condition requires ${requiredId}, but input.context.required_evidence_refs does not declare it.`, 'input.context.required_evidence_refs'));
      continue;
    }
    const matched = byId.get(requiredId);
    if (matched) matchedRefs.push(matched);
  }

  const requiredTier = condition.required_evidence_tier || rule.required_evidence_tier;
  if (!hasEvidenceAtOrAbove(matchedRefs, requiredTier)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_REF_TIER_UNSATISFIED', `Matched required evidence refs do not satisfy required tier ${requiredTier}.`, 'input.evidence_refs'));
  }

  if (diagnostics.some((item) => item.severity === 'error')) {
    return { ok: false, response: failClosed(rule, diagnostics, evidenceTier) };
  }

  return { ok: true, response: null };
}

function resolveLayoutStructure(input, rule, inheritedDiagnostics = []) {
  const diagnostics = [...inheritedDiagnostics];
  const refs = evidenceRefs(input);
  const evidenceTier = highestEvidenceTier(refs);
  const allowedAll = Array.isArray(rule.allowed_options) ? rule.allowed_options : ['div_block', 'flexbox', 'grid'];

  if (!isKnownEvidenceTier(rule.required_evidence_tier)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_TIER_INVALID', 'Resolver rule required_evidence_tier must be one of the known evidence tiers.', 'rule.required_evidence_tier'));
    return failClosed(rule, diagnostics, evidenceTier);
  }

  if (refs.length === 0) {
    diagnostics.push(diagnostic('RESOLVER_MVP_MISSING_EVIDENCE_REFS', 'Resolver MVP input must include evidence_refs.', 'input.evidence_refs'));
    diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_TIER_UNSATISFIED', 'layout_structure requires project_export evidence for auto_resolved output.', 'input.evidence_refs'));
    return failClosed(rule, diagnostics, evidenceTier);
  }

  const context = input?.context;
  if (!isPlainObject(context)) {
    diagnostics.push(diagnostic('RESOLVER_MVP_UNSUPPORTED_CONTEXT', 'layout_structure requires a structured context object.', 'input.context'));
    return failClosed(rule, diagnostics, evidenceTier);
  }

  if (!hasEvidenceAtOrAbove(refs, rule.required_evidence_tier)) {
    if (hasOfficialDocs(refs)) {
      const condition = findCondition(rule, 'conditional_conditions', 'layout_structure.conditional.official_docs_only');
      const binding = validateConditionEvidenceBinding({ rule, refs, context, condition, diagnostics, evidenceTier });
      if (!binding.ok) return binding.response;
      diagnostics.push(diagnostic('RESOLVER_MVP_OFFICIAL_DOCS_ONLY_CONDITIONAL', 'Official-doc-only evidence supports documented capability only; project-specific layout remains conditional.', 'input.evidence_refs', 'warning'));
      return result({ rule, status: 'conditional', selectedOption: null, allowedOptions: allowedAll, diagnostics, evidenceTier });
    }

    diagnostics.push(diagnostic('RESOLVER_MVP_REQUIRED_EVIDENCE_TIER_UNSATISFIED', 'layout_structure requires project_export evidence for project-specific resolution.', 'input.evidence_refs'));
    return failClosed(rule, diagnostics, evidenceTier);
  }

  const layoutIntent = context.layout_intent;
  const childTopology = context.child_topology;
  const axis = context.axis;
  const twoAxisRequired = context.two_axis_required === true;
  const simpleWrapperOnly = context.simple_wrapper_only === true;
  const gridAvailabilityProven = context.grid_availability_proven === true;

  if (layoutIntent === 'wrapper' && simpleWrapperOnly && !twoAxisRequired) {
    const condition = findCondition(rule, 'auto_resolution_conditions', 'layout_structure.auto_resolve.div_block.simple_wrapper_project_export');
    const binding = validateConditionEvidenceBinding({ rule, refs, context, condition, diagnostics, evidenceTier });
    if (!binding.ok) return binding.response;
    return result({ rule, status: 'auto_resolved', selectedOption: 'div_block', allowedOptions: ['div_block'], diagnostics, evidenceTier });
  }

  if (layoutIntent === 'single_axis' && ['row', 'column'].includes(axis) && ['linear', 'wrapping'].includes(childTopology) && !twoAxisRequired) {
    const condition = findCondition(rule, 'auto_resolution_conditions', 'layout_structure.auto_resolve.flexbox.single_axis_project_export');
    const binding = validateConditionEvidenceBinding({ rule, refs, context, condition, diagnostics, evidenceTier });
    if (!binding.ok) return binding.response;
    return result({ rule, status: 'auto_resolved', selectedOption: 'flexbox', allowedOptions: ['flexbox'], diagnostics, evidenceTier });
  }

  if (layoutIntent === 'two_axis' || twoAxisRequired) {
    const condition = findCondition(rule, 'auto_resolution_conditions', 'layout_structure.auto_resolve.grid.two_axis_project_export');
    const binding = validateConditionEvidenceBinding({ rule, refs, context, condition, diagnostics, evidenceTier });
    if (!binding.ok) return binding.response;
    if (childTopology === 'two_dimensional' && gridAvailabilityProven) {
      return result({ rule, status: 'auto_resolved', selectedOption: 'grid', allowedOptions: ['grid'], diagnostics, evidenceTier });
    }
    diagnostics.push(diagnostic('RESOLVER_MVP_GRID_REQUIRES_AVAILABILITY', 'Grid may not be auto_resolved unless two-dimensional topology and grid availability are both evidenced.', 'input.context.grid_availability_proven'));
    return failClosed(rule, diagnostics, evidenceTier);
  }

  const condition = findCondition(rule, 'conditional_conditions', 'layout_structure.conditional.ambiguous_project_export');
  const binding = validateConditionEvidenceBinding({ rule, refs, context, condition, diagnostics, evidenceTier });
  if (!binding.ok) return binding.response;
  diagnostics.push(diagnostic('RESOLVER_MVP_AMBIGUOUS_PROJECT_EXPORT_CONDITIONAL', 'Project_export evidence is present but does not satisfy a single deterministic layout rule.', 'input.context', 'warning'));
  return result({ rule, status: 'conditional', selectedOption: null, allowedOptions: allowedAll, diagnostics, evidenceTier });
}

export function resolveDecision(input, activeRuleLoad = loadActiveRules()) {
  const { rules, diagnostics: activeRuleDiagnostics } = normalizeActiveRuleLoad(activeRuleLoad);
  const decisionFamilyId = input?.decision_family_id;

  if (!decisionFamilyId || typeof decisionFamilyId !== 'string') {
    const diagnostics = [...activeRuleDiagnostics, diagnostic('RESOLVER_MVP_DECISION_FAMILY_REQUIRED', 'decision_family_id is required.', 'input.decision_family_id')];
    return result({ rule: fallbackRule(), status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier: highestEvidenceTier(evidenceRefs(input)) });
  }

  const rule = rules.get(decisionFamilyId);
  if (!rule) {
    const diagnostics = [...activeRuleDiagnostics, diagnostic('RESOLVER_MVP_UNKNOWN_DECISION_FAMILY', `No active Resolver MVP rule is registered for ${decisionFamilyId}.`, 'input.decision_family_id')];
    return result({ rule: fallbackRule(), status: 'unresolvable', selectedOption: null, allowedOptions: ['none'], diagnostics, evidenceTier: highestEvidenceTier(evidenceRefs(input)) });
  }

  if (decisionFamilyId === 'layout_structure') return resolveLayoutStructure(input, rule, activeRuleDiagnostics);

  const diagnostics = [...activeRuleDiagnostics, diagnostic('RESOLVER_MVP_UNSUPPORTED_CONTEXT', `Registered rule ${rule.rule_id} has no evaluator implementation.`, 'input.decision_family_id')];
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
    diagnostics.push(diagnostic('RESOLVER_MVP_EXPECTED_RESULT_MISMATCH', `Expected resolver_status=${expected.resolver_status}, observed ${actual.resolver_status}.`, 'expected_result.resolver_status'));
  }

  if ('selected_option' in expected) {
    const actualOption = actual.selected_option?.option_id ?? null;
    if (actualOption !== expected.selected_option) {
      diagnostics.push(diagnostic('RESOLVER_MVP_EXPECTED_RESULT_MISMATCH', `Expected selected_option=${expected.selected_option}, observed ${actualOption}.`, 'expected_result.selected_option'));
    }
  }

  for (const expectedCode of expectedCodes) {
    if (!codes(actual).has(expectedCode)) {
      diagnostics.push(diagnostic('RESOLVER_MVP_EXPECTED_DIAGNOSTIC_MISSING', `Expected diagnostic ${expectedCode} was not emitted.`, 'expected_result.diagnostic_codes'));
    }
  }

  return diagnostics;
}

function activeRuleLoadForFixture(fixture) {
  if (fixture.rule_patch && isPlainObject(fixture.rule_patch)) {
    const loaded = loadActiveRules();
    const baseRule = loaded.rules.get('layout_structure');
    if (!baseRule) return loaded;
    const patchedRule = { ...baseRule, ...fixture.rule_patch };
    const rules = new Map(loaded.rules);
    rules.set('layout_structure', patchedRule);
    return { rules, diagnostics: loaded.diagnostics };
  }

  if (fixture.registry_override !== undefined) {
    const ruleOverrides = isPlainObject(fixture.rule_file_overrides) ? fixture.rule_file_overrides : {};
    return loadActiveRulesFromRegistry(fixture.registry_override, (path) => {
      if (Object.prototype.hasOwnProperty.call(ruleOverrides, path)) return ruleOverrides[path];
      return readJson(path);
    });
  }

  return loadActiveRules();
}

function validateFixture(fixture) {
  const actual = resolveDecision(fixture.input, activeRuleLoadForFixture(fixture));
  return { actual, diagnostics: compareExpected(fixture, actual) };
}

function category(path) {
  return path.split('/')[0];
}

function runValidation() {
  const output = ['Resolver MVP validator summary'];
  let failed = false;
  const passedByCategory = new Map([
    ['valid', 0],
    ['invalid', 0],
    ['adversarial', 0]
  ]);
  const expectedByCategory = new Map([
    ['valid', fixturePlan.filter((path) => category(path) === 'valid').length],
    ['invalid', fixturePlan.filter((path) => category(path) === 'invalid').length],
    ['adversarial', fixturePlan.filter((path) => category(path) === 'adversarial').length]
  ]);

  const activeRules = loadActiveRules();
  if (!activeRules.rules.has('layout_structure')) {
    failed = true;
    output.push('Active rule registry: FAIL');
    output.push(...activeRules.diagnostics.map((item) => `  - ${item.code}: ${item.message}`));
    output.push('  - RESOLVER_MVP_ACTIVE_LAYOUT_STRUCTURE_RULE_REQUIRED');
  } else if (activeRules.diagnostics.length > 0) {
    failed = true;
    output.push('Active rule registry: FAIL');
    output.push(...activeRules.diagnostics.map((item) => `  - ${item.code}: ${item.message}`));
  } else {
    output.push('Active rule registry: PASS');
  }

  for (const path of fixturePlan) {
    let fixture;
    try {
      fixture = readJson(`kernel/fixtures/${path}`);
    } catch (error) {
      failed = true;
      output.push(`${path}: FAIL`);
      output.push(`  - RESOLVER_MVP_FIXTURE_READ_FAILED: ${error.message}`);
      continue;
    }

    const { actual, diagnostics } = validateFixture(fixture);
    if (diagnostics.length > 0) {
      failed = true;
      output.push(`${path}: FAIL`);
      output.push(...diagnostics.map((item) => `  - ${item.code}: ${item.message}`));
      output.push(`  - observed_status=${actual.resolver_status}`);
      continue;
    }

    passedByCategory.set(category(path), (passedByCategory.get(category(path)) || 0) + 1);
    output.push(`${path}: PASS [${actual.resolver_status}]`);
  }

  output.push(`Valid Resolver MVP fixtures matched expected deterministic results: ${passedByCategory.get('valid')}/${expectedByCategory.get('valid')}`);
  output.push(`Invalid Resolver MVP fixtures matched expected fail-closed results: ${passedByCategory.get('invalid')}/${expectedByCategory.get('invalid')}`);
  output.push(`Adversarial Resolver MVP fixtures matched expected anti-overclaim results: ${passedByCategory.get('adversarial')}/${expectedByCategory.get('adversarial')}`);
  output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
  console.log(output.join('\n'));
  process.exit(failed ? 1 : 0);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runValidation();
}
