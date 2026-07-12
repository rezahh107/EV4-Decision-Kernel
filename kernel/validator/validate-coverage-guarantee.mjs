#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PATHS = {
  contract: 'kernel/decision-governance/coverage-guarantee-contract.v1.json',
  contractSchema: 'kernel/schemas/coverage-guarantee-contract.v1.schema.json',
  ledger: 'planning/coverage/element-reconciliation-ledger.v1.json',
  ledgerSchema: 'kernel/schemas/element-reconciliation-ledger.v1.schema.json',
  catalog: 'planning/coverage/decision-question-catalog.v1.json',
  catalogSchema: 'kernel/schemas/decision-question-catalog.v1.schema.json',
  baseline: 'planning/coverage/coverage-baseline.v1.json',
  baselineSchema: 'kernel/schemas/coverage-baseline.v1.schema.json',
  debt: 'planning/coverage/open-decision-debt.v1.json',
  debtSchema: 'kernel/schemas/open-decision-debt.v1.schema.json',
  impactSchema: 'kernel/schemas/coverage-impact.v1.schema.json',
  impactDir: 'planning/coverage/impacts',
  markdown: 'docs/decision-governance/COVERAGE_GUARANTEE_CONTRACT.md',
  workflow: '.github/workflows/validate-mvk.yml',
  package: 'package.json',
  fixtureRoot: 'kernel/fixtures/coverage-guarantee',
};

const SCHEMA_PATHS = {
  contract: PATHS.contractSchema,
  ledger: PATHS.ledgerSchema,
  catalog: PATHS.catalogSchema,
  baseline: PATHS.baselineSchema,
  debt: PATHS.debtSchema,
  impact: PATHS.impactSchema,
};

const CHAIN_NAMES = [
  'catalog',
  'matrix',
  'resolver_rule',
  'deterministic_evaluator',
  'valid_fixture',
  'invalid_fixture',
  'adversarial_fixture',
  'l2_audit',
  'required_runtime_or_consumer_proof',
  'coverage_credit',
];

const COVERED_OBLIGATION_STATES = new Set([
  'end_to_end_covered',
  'not_applicable_with_validated_reason',
]);

const COMPLETE_CHAIN_STATES = new Set([
  'complete',
  'not_applicable_with_validated_reason',
]);

const IN_SCOPE_MEMBERSHIPS = new Set(['confirmed', 'candidate', 'unresolved']);
const SUPERSESSION_NOTE = 'Superseded: manual parent_authority promotion was removed from the active execution model.';

function readText(pathFromRoot) {
  return readFileSync(join(ROOT, pathFromRoot), 'utf8');
}

function readJson(pathFromRoot) {
  return JSON.parse(readText(pathFromRoot));
}

function sha256Text(text) {
  return createHash('sha256').update(text).digest('hex');
}

function diagnostic(code, message, path = null) {
  return { code, message, ...(path ? { path } : {}) };
}

function dedupeDiagnostics(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.code + '|' + (item.path || '') + '|' + item.message;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function codeFromAjv(error, artifact) {
  const suffix = String(error.keyword || 'conformance').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
  return 'COV_SCHEMA_' + artifact.toUpperCase() + '_' + suffix;
}

function pathFromAjv(error) {
  const base = error.instancePath ? error.instancePath.slice(1).replaceAll('/', '.') : '(root)';
  if (error.keyword === 'required' && error.params?.missingProperty) {
    return base === '(root)' ? error.params.missingProperty : base + '.' + error.params.missingProperty;
  }
  return base;
}

function buildSchemaValidators() {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validators = {};
  const diagnostics = [];
  for (const [artifact, schemaPath] of Object.entries(SCHEMA_PATHS)) {
    try {
      validators[artifact] = ajv.compile(readJson(schemaPath));
    } catch (error) {
      diagnostics.push(diagnostic('COV_SCHEMA_COMPILE_FAILED', artifact + ': ' + error.message, schemaPath));
    }
  }
  return { validators, diagnostics };
}

function schemaDiagnostics(artifact, value, validators) {
  const validate = validators[artifact];
  if (!validate || value === undefined || value === null) return [];
  if (validate(value)) return [];
  return (validate.errors || []).map((error) => diagnostic(
    codeFromAjv(error, artifact),
    artifact + ': ' + error.message,
    pathFromAjv(error),
  ));
}

function clone(value) {
  return structuredClone(value);
}

function pointerParts(pointer) {
  if (pointer === '' || pointer === '/') return [];
  if (!pointer.startsWith('/')) throw new Error('Mutation path must be a JSON Pointer: ' + pointer);
  return pointer.slice(1).split('/').map((part) => part.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function parentAt(root, pointer, create = false) {
  const parts = pointerParts(pointer);
  const key = parts.pop();
  let current = root;
  for (const part of parts) {
    if (current[part] === undefined && create) current[part] = {};
    current = current[part];
    if (current === undefined || current === null) throw new Error('Mutation path not found: ' + pointer);
  }
  return { parent: current, key };
}

function applyMutations(bundle, mutations) {
  const result = clone(bundle);
  for (const mutation of mutations || []) {
    if (mutation.op === 'remove_artifact') {
      delete result[mutation.artifact];
      continue;
    }
    if (mutation.op === 'replace_artifact') {
      result[mutation.artifact] = clone(mutation.value);
      continue;
    }
    const target = result[mutation.artifact];
    if (target === undefined) throw new Error('Unknown mutation artifact: ' + mutation.artifact);
    const { parent, key } = parentAt(target, mutation.path, mutation.op === 'set');
    if (mutation.op === 'set') parent[key] = clone(mutation.value);
    else if (mutation.op === 'delete') delete parent[key];
    else if (mutation.op === 'append') {
      if (!Array.isArray(parent[key])) throw new Error('Append target is not an array: ' + mutation.path);
      parent[key].push(clone(mutation.value));
    } else {
      throw new Error('Unknown mutation op: ' + mutation.op);
    }
  }
  return result;
}

function allObligations(record) {
  const groups = record?.element_obligations || {};
  return [
    ...(groups.applicable_decision_questions || []),
    ...(groups.applicable_p0_families || []),
    ...(groups.required_safety_gates || []),
    ...(groups.required_runtime_checks || []),
    ...(groups.required_consumer_proofs || []),
  ];
}

function validNotApplicable(item) {
  if (!item || !['not_applicable_with_validated_reason'].includes(item.status)) return true;
  const reason = item.not_applicable_reason;
  return Boolean(
    reason
    && typeof reason.reason_code === 'string'
    && reason.reason_code.length > 0
    && Array.isArray(reason.evidence_refs)
    && reason.evidence_refs.length > 0
    && reason.validator_accepted === true
  );
}

function elementCovered(record) {
  const obligations = allObligations(record);
  return obligations.length > 0
    && obligations.every((item) => COVERED_OBLIGATION_STATES.has(item.status) && validNotApplicable(item));
}

function questionCovered(record) {
  const chain = record?.coverage_chain || {};
  return CHAIN_NAMES.every((name) => COMPLETE_CHAIN_STATES.has(chain[name]?.status) && validNotApplicable(chain[name]));
}

function roundPercent(numerator, denominator) {
  if (!Number.isInteger(denominator) || denominator <= 0) return null;
  return Number(((numerator / denominator) * 100).toFixed(2));
}

function sourceDiagnostics(records, repositoryChecks) {
  const diagnostics = [];
  for (const record of records || []) {
    const recordId = record.record_id || record.question_id || '(record)';
    const refs = record.source_references;
    if (!Array.isArray(refs) || refs.length === 0) {
      diagnostics.push(diagnostic('COV_SOURCE_REF_MISSING', 'Every denominator candidate needs at least one source reference.', recordId));
      continue;
    }
    for (const [index, ref] of refs.entries()) {
      const refPath = recordId + '.source_references[' + index + ']';
      if (!ref?.artifact_version || !ref?.retrieval_identity) {
        diagnostics.push(diagnostic('COV_SOURCE_VERSION_MISSING', 'Source reference needs artifact_version and retrieval_identity.', refPath));
        continue;
      }
      if (!ref?.path || !ref?.content_hash || !ref?.repository_commit || !ref?.repository_blob_sha) {
        diagnostics.push(diagnostic('COV_SOURCE_REF_MISSING', 'Source reference is missing path, hash, commit, or blob identity.', refPath));
        continue;
      }
      if (!repositoryChecks) continue;
      try {
        let content;
        if (ref.verification_mode === 'git_blob_at_commit') {
          content = execFileSync('git', ['show', ref.repository_commit + ':' + ref.path], { cwd: ROOT, encoding: 'utf8' });
          const observedBlob = execFileSync('git', ['rev-parse', ref.repository_commit + ':' + ref.path], { cwd: ROOT, encoding: 'utf8' }).trim();
          if (observedBlob !== ref.repository_blob_sha) {
            diagnostics.push(diagnostic('COV_SOURCE_BLOB_MISMATCH', 'Historical source blob identity does not match.', refPath));
          }
        } else {
          if (!existsSync(join(ROOT, ref.path))) {
            diagnostics.push(diagnostic('COV_SOURCE_REF_MISSING', 'Source path does not exist.', refPath));
            continue;
          }
          content = readText(ref.path);
          const observedBlob = execFileSync('git', ['hash-object', ref.path], { cwd: ROOT, encoding: 'utf8' }).trim();
          if (observedBlob !== ref.repository_blob_sha) {
            diagnostics.push(diagnostic('COV_SOURCE_BLOB_MISMATCH', 'Local source blob identity does not match.', refPath));
          }
        }
        if (sha256Text(content) !== ref.content_hash) {
          diagnostics.push(diagnostic('COV_SOURCE_HASH_MISMATCH', 'Source content hash does not match.', refPath));
        }
      } catch (error) {
        diagnostics.push(diagnostic('COV_SOURCE_REF_UNVERIFIABLE', error.message, refPath));
      }
    }
  }
  return diagnostics;
}

function deriveCoverage(bundle) {
  const ledgerRecords = Array.isArray(bundle.ledger?.records) ? bundle.ledger.records : [];
  const catalogRecords = Array.isArray(bundle.catalog?.records) ? bundle.catalog.records : [];

  const elementDenominatorRecords = ledgerRecords.filter((record) => record.denominator_membership === 'confirmed');
  const questionDenominatorRecords = catalogRecords.filter((record) => record.denominator_membership === 'confirmed');
  const elementNumerator = elementDenominatorRecords.filter(elementCovered).length;
  const questionNumerator = questionDenominatorRecords.filter(questionCovered).length;

  const unresolvedElements = ledgerRecords.some((record) => ['candidate', 'unresolved'].includes(record.denominator_membership));
  const unresolvedQuestions = catalogRecords.some((record) => ['candidate', 'unresolved'].includes(record.denominator_membership));
  const elementDenominatorState = unresolvedElements ? 'unresolved' : 'validated';
  const questionDenominatorState = unresolvedQuestions ? 'unresolved' : 'validated';

  const criticalQuestionIds = catalogRecords
    .filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership) && record.critical === true)
    .map((record) => record.question_id);
  const criticalSafety = ledgerRecords
    .filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership))
    .flatMap((record) => record.element_obligations?.required_safety_gates || [])
    .filter((item) => item.critical === true);
  const criticalNumerator = catalogRecords
    .filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership) && record.critical === true && questionCovered(record))
    .length
    + criticalSafety.filter((item) => COVERED_OBLIGATION_STATES.has(item.status) && validNotApplicable(item)).length;
  const criticalDenominator = criticalQuestionIds.length + criticalSafety.length;

  return {
    knownElementScopeCount: ledgerRecords.filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership)).length,
    knownQuestionScopeCount: catalogRecords.filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership)).length,
    elementDenominator: elementDenominatorRecords.length,
    questionDenominator: questionDenominatorRecords.length,
    elementDenominatorState,
    questionDenominatorState,
    elementNumerator,
    questionNumerator,
    elementPercent: elementDenominatorState === 'validated' ? roundPercent(elementNumerator, elementDenominatorRecords.length) : null,
    questionPercent: questionDenominatorState === 'validated' ? roundPercent(questionNumerator, questionDenominatorRecords.length) : null,
    criticalNumerator,
    criticalDenominator,
    criticalPercent: elementDenominatorState === 'validated' && questionDenominatorState === 'validated'
      ? roundPercent(criticalNumerator, criticalDenominator)
      : null,
  };
}

function baselineDiagnostics(bundle, derived, repositoryChecks) {
  const diagnostics = [];
  const baseline = bundle.baseline;
  if (!baseline) return diagnostics;

  const expected = {
    element_denominator: derived.elementDenominator,
    question_denominator: derived.questionDenominator,
    known_element_scope_count: derived.knownElementScopeCount,
    known_question_scope_count: derived.knownQuestionScopeCount,
    element_denominator_state: derived.elementDenominatorState,
    question_denominator_state: derived.questionDenominatorState,
  };
  for (const [field, value] of Object.entries(expected)) {
    if (baseline[field] !== value) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_COUNT_MISMATCH', field + ' must be derived from actual records.', 'baseline.' + field));
    }
  }

  const coverageExpected = {
    element_numerator: derived.elementNumerator,
    element_percent: derived.elementPercent,
    question_numerator: derived.questionNumerator,
    question_percent: derived.questionPercent,
    critical_p0_and_safety_numerator: derived.criticalNumerator,
    critical_p0_and_safety_denominator: derived.criticalDenominator,
    critical_p0_and_safety_percent: derived.criticalPercent,
  };
  for (const [field, value] of Object.entries(coverageExpected)) {
    if (baseline.coverage?.[field] !== value) {
      diagnostics.push(diagnostic('COV_PERCENTAGE_MANUAL_MISMATCH', field + ' disagrees with the computed value or must remain null.', 'baseline.coverage.' + field));
    }
  }

  if (baseline.baseline_status === 'proposed_on_pr' && (baseline.effective_main_commit !== null || baseline.effective_on_main_at !== null)) {
    diagnostics.push(diagnostic('COV_BASELINE_PREMERGE_EFFECTIVE_FORBIDDEN', 'A proposed PR baseline cannot assert its final main commit or effective time.', 'baseline'));
  }

  const change = baseline.denominator_change;
  if (change) {
    const elementReduced = change.new_element_denominator < change.previous_element_denominator;
    const questionReduced = change.new_question_denominator < change.previous_question_denominator;
    if ((elementReduced || questionReduced) && (!Array.isArray(change.record_level_reasons) || change.record_level_reasons.length === 0)) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_REDUCTION_UNJUSTIFIED', 'A denominator reduction requires record-level reasons and source evidence.', 'baseline.denominator_change'));
    }
  }

  if (repositoryChecks) {
    for (const item of baseline.content_hashes || []) {
      if (!existsSync(join(ROOT, item.path))) {
        diagnostics.push(diagnostic('COV_BASELINE_HASH_PATH_MISSING', 'Baseline hash path does not exist.', item.path));
        continue;
      }
      if (sha256Text(readText(item.path)) !== item.sha256) {
        diagnostics.push(diagnostic('COV_BASELINE_HASH_MISMATCH', 'Baseline content hash does not match the local artifact.', item.path));
      }
    }
  }

  return diagnostics;
}

function semanticDiagnostics(bundle) {
  const diagnostics = [];
  const ledgerRecords = bundle.ledger?.records || [];
  const catalogRecords = bundle.catalog?.records || [];

  if (bundle.ledger && (!Array.isArray(bundle.ledger.records) || bundle.ledger.records.length === 0)) {
    diagnostics.push(diagnostic('COV_LEDGER_EMPTY', 'The Element Ledger must contain real records.', PATHS.ledger));
  }
  if (bundle.catalog && (!Array.isArray(bundle.catalog.records) || bundle.catalog.records.length === 0)) {
    diagnostics.push(diagnostic('COV_CATALOG_EMPTY', 'The Decision Question Catalog must contain real records.', PATHS.catalog));
  }

  const ledgerIds = ledgerRecords.map((record) => record.record_id);
  if (ledgerIds.length !== new Set(ledgerIds).size) {
    diagnostics.push(diagnostic('COV_LEDGER_DUPLICATE_ID', 'Element Ledger record IDs must be unique.', PATHS.ledger));
  }
  const questionIds = catalogRecords.map((record) => record.question_id);
  if (questionIds.length !== new Set(questionIds).size) {
    diagnostics.push(diagnostic('COV_CATALOG_DUPLICATE_ID', 'Decision Question IDs must be unique.', PATHS.catalog));
  }

  const knownElements = ledgerRecords.filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership)).length;
  const confirmedElements = ledgerRecords.filter((record) => record.denominator_membership === 'confirmed').length;
  if (bundle.ledger && (bundle.ledger.known_scope_count !== knownElements || bundle.ledger.confirmed_denominator_count !== confirmedElements)) {
    diagnostics.push(diagnostic('COV_DENOMINATOR_COUNT_MISMATCH', 'Ledger summary counts must be derived from records.', PATHS.ledger));
  }
  const knownQuestions = catalogRecords.filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership)).length;
  const confirmedQuestions = catalogRecords.filter((record) => record.denominator_membership === 'confirmed').length;
  if (bundle.catalog && (bundle.catalog.known_scope_count !== knownQuestions || bundle.catalog.confirmed_denominator_count !== confirmedQuestions)) {
    diagnostics.push(diagnostic('COV_DENOMINATOR_COUNT_MISMATCH', 'Catalog summary counts must be derived from records.', PATHS.catalog));
  }

  for (const record of ledgerRecords) {
    if (record.resolution_state === 'covered' && !elementCovered(record)) {
      diagnostics.push(diagnostic('COV_ELEMENT_OBLIGATION_INCOMPLETE', 'Element cannot be covered while any applicable obligation is incomplete.', record.record_id));
    }
    for (const item of allObligations(record)) {
      if (item.status === 'not_applicable_with_validated_reason' && !validNotApplicable(item)) {
        diagnostics.push(diagnostic('COV_NOT_APPLICABLE_REASON_INVALID', 'Not-applicable obligations require reason, evidence and validator acceptance.', item.obligation_id));
      }
    }
  }

  for (const record of catalogRecords) {
    const chain = record.coverage_chain || {};
    for (const name of CHAIN_NAMES) {
      const link = chain[name];
      if (link?.status === 'not_applicable_with_validated_reason' && !validNotApplicable(link)) {
        diagnostics.push(diagnostic('COV_NOT_APPLICABLE_REASON_INVALID', 'Not-applicable chain links require reason, evidence and validator acceptance.', record.question_id + '.' + name));
      }
    }
    if (chain.resolver_rule?.status === 'complete' && (!Array.isArray(chain.resolver_rule.evidence_refs) || chain.resolver_rule.evidence_refs.length === 0)) {
      diagnostics.push(diagnostic('COV_MATRIX_ONLY_RESOLVER_CREDIT', 'A Matrix cannot be counted as active Resolver coverage.', record.question_id));
    }
    const creditClaimed = chain.coverage_credit?.status === 'complete' || record.resolution_state === 'covered';
    if (creditClaimed) {
      const triplet = ['valid_fixture', 'invalid_fixture', 'adversarial_fixture'];
      if (triplet.some((name) => chain[name]?.status !== 'complete')) {
        diagnostics.push(diagnostic('COV_RESOLVER_FIXTURE_TRIPLET_INCOMPLETE', 'Resolver credit requires valid, invalid and adversarial fixtures.', record.question_id));
      }
      if (chain.l2_audit?.status !== 'complete') {
        diagnostics.push(diagnostic('COV_RESOLVER_L2_INCOMPLETE', 'Resolver credit requires an L2 audit.', record.question_id));
      }
      if (!COMPLETE_CHAIN_STATES.has(chain.required_runtime_or_consumer_proof?.status)) {
        diagnostics.push(diagnostic('COV_REQUIRED_PROOF_MISSING', 'Question credit requires every applicable runtime or consumer proof.', record.question_id));
      }
      if (!questionCovered(record)) {
        diagnostics.push(diagnostic('COV_QUESTION_CHAIN_INCOMPLETE', 'Coverage credit cannot precede the complete applicable Question chain.', record.question_id));
      }
    }
  }

  if (bundle.debt && bundle.debt.open_item_count !== (bundle.debt.items || []).length) {
    diagnostics.push(diagnostic('COV_DEBT_COUNT_MISMATCH', 'open_item_count must match the debt item array.', PATHS.debt));
  }

  return diagnostics;
}

function materialProgressDiagnostics(bundle, derived) {
  const diagnostics = [];
  const impacts = Array.isArray(bundle.impacts) ? bundle.impacts : [];
  for (const impact of impacts) {
    if (impact.bootstrap_exception === true) {
      const validBootstrap = impact.work_package_id === 'DCOV-EXEC-001'
        && impact.work_type === 'foundation_bootstrap'
        && impact.reason === 'introduces_the_coverage_measurement_system'
        && impact.coverage_state_before === 'not_measurable'
        && impact.coverage_state_after === 'policy_active'
        && impact.baseline_before === null
        && impact.element_coverage_delta === null
        && impact.question_coverage_delta === null
        && (bundle.ledger?.records || []).length > 0
        && (bundle.catalog?.records || []).length > 0;
      if (!validBootstrap) {
        diagnostics.push(diagnostic('COV_BOOTSTRAP_EXCEPTION_INVALID', 'The bootstrap exception is limited to the real DCOV-EXEC-001 measurement-system activation.', impact.impact_id));
      }
      continue;
    }

    if (impact.coverage_sensitive && impact.work_type === 'content_expansion') {
      if (derived.elementDenominatorState === 'validated' && derived.questionDenominatorState === 'validated') {
        const denominator = Math.max(derived.elementDenominator, derived.questionDenominator);
        const minimumItems = Math.max(2, Math.ceil(0.05 * denominator));
        const option1 = Math.max(impact.element_coverage_delta || 0, impact.question_coverage_delta || 0) >= 5;
        const option2 = (impact.completed_obligation_ids || []).length >= minimumItems;
        const option3 = (impact.closed_family_ids || []).length >= 1
          && Math.max(impact.element_coverage_delta || 0, impact.question_coverage_delta || 0) > 0;
        if (!option1 && !option2 && !option3) {
          diagnostics.push(diagnostic('COV_MATERIAL_PROGRESS_INSUFFICIENT', 'Content expansion does not satisfy any measurement-active progress option.', impact.impact_id));
        }
      } else {
        const boundedSet = (impact.completed_obligation_ids || []).length >= 2;
        const closedSlice = (impact.closed_family_ids || []).length >= 1;
        if (!boundedSet || !closedSlice) {
          diagnostics.push(diagnostic('COV_MATERIAL_PROGRESS_INSUFFICIENT', 'During policy_active, content expansion must complete bounded obligations and close one real Family slice.', impact.impact_id));
        }
      }
    }

    if (impact.zero_delta === true) {
      const validZeroDelta = impact.work_type === 'blocking_defect'
        && impact.blocking_defect
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      if (!validZeroDelta) {
        diagnostics.push(diagnostic('COV_ZERO_DELTA_NOT_BLOCKING_DEFECT', 'Zero-delta coverage-sensitive work is limited to a blocking defect with a named next content package.', impact.impact_id));
      }
    }
  }

  const sensitive = impacts.filter((impact) => impact.coverage_sensitive);
  if (sensitive.length >= 3 && sensitive.slice(-3).every((impact) => impact.zero_delta === true)) {
    diagnostics.push(diagnostic('COV_THREE_CONSECUTIVE_ZERO_DELTA', 'Three consecutive zero-delta coverage-sensitive packages are forbidden.', PATHS.impactDir));
  }
  return diagnostics;
}

function normativeProjection(contract) {
  return {
    contract_version: contract.contract_version,
    thresholds: contract.thresholds,
    state_names: contract.state_machine.ordered_states,
    element_coverage_definition: contract.coverage_semantics.element.definition_id,
    question_coverage_chain: contract.coverage_semantics.question.required_chain,
    material_progress_rules: {
      option_1: 'coverage_delta_gte_' + contract.material_progress.measurement_active_options.option_1.coverage_delta_gte_percentage_points + '_percentage_points',
      option_2: contract.material_progress.measurement_active_options.option_2.formula,
      option_3: 'complete_p0_family_with_measurable_numerator_growth',
      policy_active: contract.material_progress.policy_active_rule,
      zero_delta: contract.material_progress.zero_delta_rule,
      three_consecutive_zero_delta_fail: contract.material_progress.three_consecutive_zero_delta_fail,
    },
    merge_gate_requirements: Object.keys(contract.merge_gate),
  };
}

function markdownDiagnostics(contract) {
  const diagnostics = [];
  try {
    const text = readText(PATHS.markdown);
    const match = text.match(/<!-- COVERAGE-GUARANTEE-NORMATIVE-VIEW:START -->[\s\S]*?```json\s*([\s\S]*?)\s*```[\s\S]*?<!-- COVERAGE-GUARANTEE-NORMATIVE-VIEW:END -->/);
    if (!match) {
      return [diagnostic('COV_CONTRACT_MARKDOWN_MISMATCH', 'Normative Markdown mirror block is missing.', PATHS.markdown)];
    }
    const observed = JSON.parse(match[1]);
    const expected = normativeProjection(contract);
    if (JSON.stringify(observed) !== JSON.stringify(expected)) {
      diagnostics.push(diagnostic('COV_CONTRACT_MARKDOWN_MISMATCH', 'Markdown material fields disagree with the authoritative JSON contract.', PATHS.markdown));
    }
  } catch (error) {
    diagnostics.push(diagnostic('COV_CONTRACT_MARKDOWN_MISMATCH', error.message, PATHS.markdown));
  }
  return diagnostics;
}

function authorityReferenceDiagnostics() {
  const diagnostics = [];
  const files = [
    'AGENTS.md',
    '.github/PULL_REQUEST_TEMPLATE.md',
    'docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md',
    'planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md',
    'planning/KERNEL_EXECUTION_PLAN.md',
    'planning/NEXT_WORK.md',
    'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md',
  ];
  let active = 0;
  let historical = 0;
  for (const file of files) {
    const text = readText(file);
    const matches = [...text.matchAll(/parent[_ ]authority/gi)];
    if (matches.length === 0) continue;
    const historicalFile = file.startsWith('planning/reviews/') && text.includes(SUPERSESSION_NOTE);
    const start = text.indexOf('<!-- PARENT-AUTHORITY-HISTORY:START -->');
    const end = text.indexOf('<!-- PARENT-AUTHORITY-HISTORY:END -->');
    for (const match of matches) {
      const inMarkedHistory = start !== -1 && end !== -1 && match.index > start && match.index < end;
      if (historicalFile || inMarkedHistory) historical += 1;
      else active += 1;
    }
  }
  if (active > 0) {
    diagnostics.push(diagnostic('COV_ACTIVE_PARENT_AUTHORITY_REFERENCE', 'Active manual authority references remain: ' + active + '.', 'repository_governance'));
  }
  return { diagnostics, active, historical };
}

function repositoryWiringDiagnostics() {
  const diagnostics = [];
  const packageJson = readJson(PATHS.package);
  const workflow = readText(PATHS.workflow);
  if (packageJson.scripts?.['validate:coverage'] !== 'node kernel/validator/validate-coverage-guarantee.mjs') {
    diagnostics.push(diagnostic('COV_PACKAGE_SCRIPT_MISSING', 'package.json must expose npm run validate:coverage.', PATHS.package));
  }
  if (!String(packageJson.scripts?.['validate:mvk'] || '').includes('validate-coverage-guarantee.mjs')) {
    diagnostics.push(diagnostic('COV_MVK_WIRING_MISSING', 'validate:mvk must include the Coverage Guarantee validator.', PATHS.package));
  }
  if (!workflow.includes('npm run validate:coverage')) {
    diagnostics.push(diagnostic('COV_CI_WIRING_MISSING', 'The existing Validate MVK workflow must call npm run validate:coverage.', PATHS.workflow));
  }
  return diagnostics;
}

function gitLines(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' })
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function changedPathsFromGit() {
  const changed = new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]);
  try {
    const mergeBase = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: ROOT, encoding: 'utf8' }).trim();
    for (const path of gitLines(['diff', '--name-only', mergeBase + '..HEAD'])) changed.add(path);
  } catch {
    for (const path of gitLines(['diff', '--name-only', 'HEAD^..HEAD'])) changed.add(path);
  }
  return [...changed];
}

function pathMatchesSensitive(path, patterns) {
  return patterns.some((pattern) => path === pattern || path.startsWith(pattern));
}

function impactRequirementDiagnostics(bundle, changedPaths) {
  const diagnostics = [];
  const sensitive = changedPaths.filter((path) => pathMatchesSensitive(path, bundle.contract?.coverage_sensitive_paths || []));
  if (sensitive.length > 0 && (!Array.isArray(bundle.impacts) || bundle.impacts.length === 0)) {
    diagnostics.push(diagnostic('COV_IMPACT_RECORD_MISSING', 'Coverage-sensitive changes require a Coverage Impact Record.', sensitive[0]));
  }
  return diagnostics;
}

function impactHistoryAppendOnlyDiagnostics() {
  const diagnostics = [];
  let base = null;
  try {
    base = execFileSync('git', ['merge-base', 'HEAD', 'origin/main'], { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    base = 'HEAD^';
  }
  const lines = [
    ...gitLines(['diff', '--name-status', base + '..HEAD', '--', PATHS.impactDir]),
    ...gitLines(['diff', '--name-status', 'HEAD', '--', PATHS.impactDir]),
  ];
  for (const line of lines) {
    const status = line.split(/\s+/)[0];
    if (status !== 'A') {
      diagnostics.push(diagnostic('COV_IMPACT_HISTORY_NOT_APPEND_ONLY', 'Coverage Impact history is append-only; existing records cannot be modified or removed.', line));
    }
  }
  return diagnostics;
}

function loadImpactRecords() {
  if (!existsSync(join(ROOT, PATHS.impactDir))) return [];
  return readdirSync(join(ROOT, PATHS.impactDir))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => readJson(PATHS.impactDir + '/' + name));
}

function loadCanonicalBundle() {
  return {
    contract: readJson(PATHS.contract),
    ledger: readJson(PATHS.ledger),
    catalog: readJson(PATHS.catalog),
    baseline: readJson(PATHS.baseline),
    debt: readJson(PATHS.debt),
    impacts: loadImpactRecords(),
  };
}

function validateBundle(bundle, options) {
  const repositoryChecks = options.repositoryChecks === true;
  const diagnostics = [];
  const { validators, diagnostics: schemaSetup } = options.schemaSetup;
  diagnostics.push(...schemaSetup);

  if (!bundle.contract) diagnostics.push(diagnostic('COV_CONTRACT_MISSING', 'Coverage Guarantee contract is missing.', PATHS.contract));
  if (!bundle.ledger) diagnostics.push(diagnostic('COV_LEDGER_MISSING', 'Element Ledger is missing.', PATHS.ledger));
  if (!bundle.catalog) diagnostics.push(diagnostic('COV_CATALOG_MISSING', 'Decision Question Catalog is missing.', PATHS.catalog));
  if (!bundle.baseline) diagnostics.push(diagnostic('COV_BASELINE_MISSING', 'Coverage baseline is missing.', PATHS.baseline));
  if (!bundle.debt) diagnostics.push(diagnostic('COV_DEBT_MISSING', 'Open decision debt record is missing.', PATHS.debt));

  if (bundle.contract) diagnostics.push(...schemaDiagnostics('contract', bundle.contract, validators));
  if (bundle.ledger?.records?.length) diagnostics.push(...schemaDiagnostics('ledger', bundle.ledger, validators));
  if (bundle.catalog?.records?.length) diagnostics.push(...schemaDiagnostics('catalog', bundle.catalog, validators));
  if (bundle.baseline) diagnostics.push(...schemaDiagnostics('baseline', bundle.baseline, validators));
  if (bundle.debt) diagnostics.push(...schemaDiagnostics('debt', bundle.debt, validators));
  for (const impact of bundle.impacts || []) diagnostics.push(...schemaDiagnostics('impact', impact, validators));

  diagnostics.push(...semanticDiagnostics(bundle));
  diagnostics.push(...sourceDiagnostics(bundle.ledger?.records || [], repositoryChecks));
  diagnostics.push(...sourceDiagnostics(bundle.catalog?.records || [], repositoryChecks));

  const derived = deriveCoverage(bundle);
  diagnostics.push(...baselineDiagnostics(bundle, derived, repositoryChecks));
  diagnostics.push(...materialProgressDiagnostics(bundle, derived));

  if (options.requestedState === 'measurement_active'
    && (derived.elementDenominatorState !== 'validated'
      || derived.questionDenominatorState !== 'validated'
      || bundle.baseline?.baseline_status === undefined)) {
    diagnostics.push(diagnostic('COV_MEASUREMENT_BASELINE_INVALID', 'measurement_active requires validated source-bound denominators and a valid baseline.', 'state_machine'));
  }

  if (options.requestedState === 'threshold_enforced') {
    const thresholds = bundle.contract?.thresholds || {};
    const coverage = bundle.baseline?.coverage || {};
    const below = derived.elementDenominatorState !== 'validated'
      || derived.questionDenominatorState !== 'validated'
      || Math.min(coverage.element_percent ?? -1, coverage.question_percent ?? -1) < thresholds.minimum_content_floor
      || Math.min(coverage.element_percent ?? -1, coverage.question_percent ?? -1) < thresholds.owner_acceptance_target
      || (coverage.critical_p0_and_safety_percent ?? -1) < thresholds.critical_p0_and_safety_coverage
      || bundle.baseline?.release_checks_connected !== true
      || !Array.isArray(bundle.baseline?.readiness_check_refs)
      || bundle.baseline.readiness_check_refs.length === 0;
    if (below) {
      diagnostics.push(diagnostic('COV_THRESHOLD_BELOW_REQUIRED', 'threshold_enforced is ineligible until computed 90%, 95% and critical 100% thresholds are satisfied.', 'state_machine'));
    }
  }

  const latestImpact = Array.isArray(bundle.impacts) && bundle.impacts.length > 0 ? bundle.impacts[bundle.impacts.length - 1] : null;
  if (latestImpact?.coverage_state_after === 'measurement_active'
    && (derived.elementDenominatorState !== 'validated'
      || derived.questionDenominatorState !== 'validated'
      || bundle.baseline?.coverage?.element_percent !== derived.elementPercent
      || bundle.baseline?.coverage?.question_percent !== derived.questionPercent)) {
    diagnostics.push(diagnostic('COV_MEASUREMENT_BASELINE_INVALID', 'A Coverage Impact Record cannot promote measurement_active without validated denominators and derived percentages.', latestImpact.impact_id));
  }
  if (latestImpact?.coverage_state_after === 'threshold_enforced') {
    const thresholds = bundle.contract?.thresholds || {};
    const below = derived.elementDenominatorState !== 'validated'
      || derived.questionDenominatorState !== 'validated'
      || Math.min(derived.elementPercent ?? -1, derived.questionPercent ?? -1) < thresholds.owner_acceptance_target
      || (derived.criticalPercent ?? -1) < thresholds.critical_p0_and_safety_coverage
      || bundle.baseline?.release_checks_connected !== true
      || !Array.isArray(bundle.baseline?.readiness_check_refs)
      || bundle.baseline.readiness_check_refs.length === 0;
    if (below) diagnostics.push(diagnostic('COV_THRESHOLD_BELOW_REQUIRED', 'A Coverage Impact Record cannot promote threshold_enforced before computed thresholds and connected release checks are satisfied.', latestImpact.impact_id));
  }

  for (const claim of options.claims || []) {
    if (['ready', 'release_ready', 'production_ready'].includes(claim)
      && options.requestedState !== 'threshold_enforced') {
      diagnostics.push(diagnostic('COV_READINESS_CLAIM_UNSUPPORTED', 'Readiness or release claims require eligible threshold_enforced state.', 'claims'));
    }
  }

  if (repositoryChecks) {
    diagnostics.push(...markdownDiagnostics(bundle.contract));
    diagnostics.push(...repositoryWiringDiagnostics());
    diagnostics.push(...impactRequirementDiagnostics(bundle, options.changedPaths || []));
    diagnostics.push(...impactHistoryAppendOnlyDiagnostics());
  }

  return { diagnostics: dedupeDiagnostics(diagnostics), derived };
}

function fixtureFiles() {
  if (!existsSync(join(ROOT, PATHS.fixtureRoot))) return [];
  const files = [];
  function walk(dir) {
    for (const name of readdirSync(dir).sort()) {
      const abs = join(dir, name);
      if (statSync(abs).isDirectory()) walk(abs);
      else if (name.endsWith('.json')) files.push(relative(ROOT, abs));
    }
  }
  walk(join(ROOT, PATHS.fixtureRoot));
  return files;
}

function runFixtureSuite(canonical, schemaSetup) {
  const results = [];
  let failed = false;
  for (const path of fixtureFiles()) {
    let fixture;
    try {
      fixture = readJson(path);
      const mutated = applyMutations(canonical, fixture.scenario?.mutations || []);
      const validation = validateBundle(mutated, {
        repositoryChecks: false,
        schemaSetup,
        changedPaths: fixture.scenario?.changed_paths || [],
        requestedState: fixture.scenario?.requested_state || null,
        claims: fixture.scenario?.claims || [],
      });
      if ((fixture.scenario?.changed_paths || []).length > 0) {
        validation.diagnostics.push(...impactRequirementDiagnostics(mutated, fixture.scenario.changed_paths));
      }
      const observed = new Set(validation.diagnostics.map((item) => item.code));
      const expected = fixture.expected_diagnostic_codes || [];
      const missing = expected.filter((code) => !observed.has(code));
      const shouldPass = fixture.fixture_kind === 'valid';
      const passed = shouldPass
        ? validation.diagnostics.length === 0
        : expected.length > 0 && missing.length === 0;
      if (!passed) failed = true;
      results.push({
        path,
        kind: fixture.fixture_kind,
        passed,
        expected,
        observed: [...observed].sort(),
        missing,
      });
    } catch (error) {
      failed = true;
      results.push({ path, kind: fixture?.fixture_kind || 'unknown', passed: false, expected: fixture?.expected_diagnostic_codes || [], observed: ['COV_FIXTURE_EXECUTION_FAILED'], missing: fixture?.expected_diagnostic_codes || [], error: error.message });
    }
  }
  return { results, failed };
}

function deriveState(bundle, mainDiagnostics, fixturesPassed) {
  const derived = deriveCoverage(bundle);
  const structuralCodes = new Set(mainDiagnostics.map((item) => item.code));
  const policyActive = mainDiagnostics.length === 0 && fixturesPassed;
  const measurementActive = policyActive
    && derived.elementDenominatorState === 'validated'
    && derived.questionDenominatorState === 'validated'
    && !structuralCodes.has('COV_BASELINE_HASH_MISMATCH')
    && bundle.baseline?.coverage?.element_percent === derived.elementPercent
    && bundle.baseline?.coverage?.question_percent === derived.questionPercent;
  const thresholds = bundle.contract.thresholds;
  const thresholdEnforced = measurementActive
    && Math.min(derived.elementPercent, derived.questionPercent) >= thresholds.minimum_content_floor
    && Math.min(derived.elementPercent, derived.questionPercent) >= thresholds.owner_acceptance_target
    && derived.criticalPercent === thresholds.critical_p0_and_safety_coverage
    && bundle.baseline?.release_checks_connected === true
    && Array.isArray(bundle.baseline?.readiness_check_refs)
    && bundle.baseline.readiness_check_refs.length > 0;
  return {
    policy_active: policyActive,
    measurement_active: measurementActive,
    threshold_enforced: thresholdEnforced,
    current_state: thresholdEnforced ? 'threshold_enforced' : measurementActive ? 'measurement_active' : policyActive ? 'policy_active' : 'inactive',
  };
}

const schemaSetup = buildSchemaValidators();
let canonical;
try {
  canonical = loadCanonicalBundle();
} catch (error) {
  console.error('Coverage Guarantee validation failed to load canonical artifacts: ' + error.message);
  process.exit(1);
}

const changedPaths = changedPathsFromGit();
const main = validateBundle(canonical, {
  repositoryChecks: true,
  schemaSetup,
  changedPaths,
  requestedState: null,
  claims: [],
});
const authority = authorityReferenceDiagnostics();
main.diagnostics.push(...authority.diagnostics);
main.diagnostics = dedupeDiagnostics(main.diagnostics);

const fixtures = runFixtureSuite(canonical, schemaSetup);
if (fixtures.results.length === 0) {
  main.diagnostics.push(diagnostic('COV_FIXTURE_SUITE_MISSING', 'Coverage Guarantee fixtures are missing.', PATHS.fixtureRoot));
}
const kinds = new Set(fixtures.results.map((result) => result.kind));
for (const requiredKind of ['valid', 'invalid', 'adversarial']) {
  if (!kinds.has(requiredKind)) {
    main.diagnostics.push(diagnostic('COV_FIXTURE_KIND_MISSING', 'Missing fixture kind: ' + requiredKind, PATHS.fixtureRoot));
  }
}

const state = deriveState(canonical, main.diagnostics, !fixtures.failed && fixtures.results.length > 0);
const exactHead = gitLines(['rev-parse', 'HEAD'])[0] || 'unavailable';

const summary = {
  validator: 'validate-coverage-guarantee.mjs',
  exact_head_sha: exactHead,
  contract_version: canonical.contract.contract_version,
  active_parent_authority_reference_count: authority.active,
  historical_parent_authority_reference_count: authority.historical,
  ledger: {
    records: canonical.ledger.records.length,
    known_scope_count: main.derived.knownElementScopeCount,
    confirmed_denominator: main.derived.elementDenominator,
    denominator_state: main.derived.elementDenominatorState,
  },
  question_catalog: {
    records: canonical.catalog.records.length,
    known_scope_count: main.derived.knownQuestionScopeCount,
    confirmed_denominator: main.derived.questionDenominator,
    denominator_state: main.derived.questionDenominatorState,
  },
  coverage: {
    element_numerator: main.derived.elementNumerator,
    element_percent: main.derived.elementPercent,
    question_numerator: main.derived.questionNumerator,
    question_percent: main.derived.questionPercent,
    critical_p0_and_safety_numerator: main.derived.criticalNumerator,
    critical_p0_and_safety_denominator: main.derived.criticalDenominator,
    critical_p0_and_safety_percent: main.derived.criticalPercent,
  },
  contract_state: state,
  fixtures: {
    total: fixtures.results.length,
    passed: fixtures.results.filter((result) => result.passed).length,
    valid: fixtures.results.filter((result) => result.kind === 'valid').length,
    invalid: fixtures.results.filter((result) => result.kind === 'invalid').length,
    adversarial: fixtures.results.filter((result) => result.kind === 'adversarial').length,
  },
  changed_paths: changedPaths,
};

console.log('Coverage Guarantee validator summary');
console.log(JSON.stringify(summary, null, 2));
for (const result of fixtures.results) {
  const status = result.passed ? 'PASS' : 'FAIL';
  console.log('fixture ' + status + ' ' + result.path + ' expected=[' + result.expected.join(',') + '] observed=[' + result.observed.join(',') + ']');
  if (result.error) console.log('  error: ' + result.error);
  if (result.missing.length) console.log('  missing: ' + result.missing.join(','));
}

const failed = main.diagnostics.length > 0 || fixtures.failed || state.current_state !== canonical.contract.expected_state_after_dcov_exec_001;
if (main.diagnostics.length > 0) {
  console.error('Coverage Guarantee diagnostics:');
  for (const item of main.diagnostics) {
    console.error('  ' + item.code + (item.path ? ' [' + item.path + ']' : '') + ': ' + item.message);
  }
}
if (state.current_state !== canonical.contract.expected_state_after_dcov_exec_001) {
  console.error('  COV_EXPECTED_STATE_NOT_REACHED: expected ' + canonical.contract.expected_state_after_dcov_exec_001 + ', observed ' + state.current_state);
}
console.log('Result: ' + (failed ? 'FAIL' : 'PASS'));
process.exit(failed ? 1 : 0);
