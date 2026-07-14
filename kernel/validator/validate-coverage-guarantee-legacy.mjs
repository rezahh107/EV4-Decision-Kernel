#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
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
  subjectRegistry: 'kernel/decision-governance/coverage-evidence-subject-registry.v1.json',
  subjectRegistrySchema: 'kernel/schemas/coverage-evidence-subject-registry.v1.schema.json',
  runtimeProofSchema: 'kernel/schemas/coverage-runtime-proof-receipt.v1.schema.json',
  consumerProofSchema: 'kernel/schemas/coverage-consumer-proof-receipt.v1.schema.json',
  coverageCreditSchema: 'kernel/schemas/coverage-credit-receipt.v1.schema.json',
  notApplicableDispositionSchema: 'kernel/schemas/coverage-not-applicable-disposition.v1.schema.json',
  proofProducerRegistry: 'kernel/decision-governance/coverage-proof-producer-registry.v1.json',
  proofProducerRegistrySchema: 'kernel/schemas/coverage-proof-producer-registry.v1.schema.json',
  proofCaptureSchema: 'kernel/schemas/coverage-proof-capture.v1.schema.json',
  denominatorDispositionSchema: 'kernel/schemas/coverage-denominator-disposition.v1.schema.json',
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
  subjectRegistry: PATHS.subjectRegistrySchema,
  runtimeProof: PATHS.runtimeProofSchema,
  consumerProof: PATHS.consumerProofSchema,
  coverageCredit: PATHS.coverageCreditSchema,
  notApplicableDisposition: PATHS.notApplicableDispositionSchema,
  proofProducerRegistry: PATHS.proofProducerRegistrySchema,
  proofCapture: PATHS.proofCaptureSchema,
  denominatorDisposition: PATHS.denominatorDispositionSchema,
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
const EXCLUDED_MEMBERSHIPS = new Set([
  'excluded_duplicate',
  'excluded_superseded',
  'not_applicable_with_validated_reason',
]);
const EXPECTED_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const SUPERSESSION_NOTE = 'Superseded: manual parent_authority promotion was removed from the active execution model.';
const DENOMINATOR_TRANSITION_FAILURE_CODES = new Set([
  'COV_DENOMINATOR_CHANGE_REQUIRED',
  'COV_DENOMINATOR_COUNT_MISMATCH',
  'COV_DENOMINATOR_DISPOSITION_INVALID',
  'COV_DENOMINATOR_EVIDENCE_LINEAGE_MISMATCH',
  'COV_DENOMINATOR_EVIDENCE_REASON_MISMATCH',
  'COV_DENOMINATOR_EVIDENCE_SUBJECT_MISMATCH',
  'COV_DENOMINATOR_REASON_MISSING',
  'COV_DENOMINATOR_REDUCTION_UNJUSTIFIED',
  'COV_DENOMINATOR_TARGET_INVALID',
  'COV_DENOMINATOR_TRANSITION_MISMATCH',
  'COV_EVIDENCE_CARRIER_INVALID',
  'COV_EVIDENCE_REQUIRED',
]);

const ROLE_PATH_RULES = {
  catalog_record: ['kernel/decision-cards/', 'planning/coverage/decision-question-catalog.'],
  matrix: ['kernel/decision-governance/p0-decision-matrices.'],
  resolver_rule: ['kernel/decision-governance/resolver-rules/'],
  deterministic_evaluator: ['kernel/resolver-mvp/', 'kernel/validator/'],
  valid_fixture: ['kernel/fixtures/valid/'],
  invalid_fixture: ['kernel/fixtures/invalid/'],
  adversarial_fixture: ['kernel/fixtures/adversarial/'],
  l2_audit: ['kernel/validator/validate-l2-', 'kernel/fixtures/valid/l2_decision_correctness/', 'kernel/decision-governance/l2-'],
  runtime_proof: ['planning/coverage/proofs/runtime/'],
  consumer_proof: ['planning/coverage/proofs/consumer/'],
  coverage_credit: ['planning/coverage/credits/'],
  decision_question: ['kernel/decision-cards/', 'planning/coverage/decision-question-catalog.'],
  p0_family: ['kernel/decision-governance/p0-decision-matrices.'],
  safety_gate: ['kernel/decision-cards/', 'kernel/decision-governance/'],
  runtime_check: ['planning/coverage/proofs/runtime/'],
  not_applicable_evidence: ['planning/coverage/dispositions/not-applicable/'],
  denominator_change: ['kernel/', 'planning/', 'docs/'],
};

const PROOF_CAPTURE_PATHS = {
  runtime_proof: 'planning/coverage/captures/runtime/',
  consumer_proof: 'planning/coverage/captures/consumer/',
};

const CREDIT_SOURCE_CHAIN = CHAIN_NAMES.filter((name) => name !== 'coverage_credit');

const VERSION_FIELDS = [
  'version',
  'schema_version',
  'contract_version',
  'rule_version',
  'fixture_version',
  'baseline_version',
  'impact_version',
  'receipt_version',
  'credit_version',
  'disposition_version',
];

let activeSchemaValidators = {};
let activeFixtureArtifacts = null;
let activeFixtureRuntimeContext = null;
const commitExistsCache = new Map();
const commitAncestorCache = new Map();
const repositoryContentCache = new Map();

class FixtureMutationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

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
  if (pointer === '' || pointer === '/') {
    throw new FixtureMutationError(
      'COV_FIXTURE_ROOT_POINTER_FORBIDDEN',
      'Root mutation requires the explicit replace_artifact operation.',
    );
  }
  if (!pointer.startsWith('/')) {
    throw new FixtureMutationError(
      'COV_FIXTURE_POINTER_INVALID',
      'Mutation path must be a JSON Pointer: ' + pointer,
    );
  }
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
      const replacement = mutation.value_from_artifact
        ? bundle[mutation.value_from_artifact]
        : mutation.value;
      if (replacement === undefined) {
        throw new FixtureMutationError(
          'COV_FIXTURE_REPLACEMENT_INVALID',
          'Explicit artifact replacement requires a value or canonical artifact source.',
        );
      }
      result[mutation.artifact] = clone(replacement);
      continue;
    }
    const target = result[mutation.artifact];
    if (target === undefined) throw new Error('Unknown mutation artifact: ' + mutation.artifact);
    const { parent, key } = parentAt(target, mutation.path, mutation.op === 'set');
    if (mutation.op === 'set') parent[key] = clone(mutation.value);
    else if (mutation.op === 'delete') {
      if (Array.isArray(parent) && /^[0-9]+$/.test(key)) {
        parent.splice(Number.parseInt(key, 10), 1);
      } else {
        delete parent[key];
      }
    }
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

function obligationEntries(record) {
  const groups = record?.element_obligations || {};
  return Object.entries(groups).flatMap(([group, items]) =>
    (items || []).map((item) => ({ group, item })));
}

function evidencePointerParts(pointer) {
  if (pointer === '' || pointer === '/') return [];
  if (typeof pointer !== 'string' || !pointer.startsWith('/')) return null;
  return pointer.slice(1).split('/').map((part) =>
    part.replaceAll('~1', '/').replaceAll('~0', '~'));
}

function valueAtPointer(value, pointer) {
  const parts = evidencePointerParts(pointer);
  if (parts === null) return { found: false, value: undefined };
  let current = value;
  for (const part of parts) {
    if (current === null || current === undefined
      || !Object.prototype.hasOwnProperty.call(Object(current), part)) {
      return { found: false, value: undefined };
    }
    current = current[part];
  }
  return { found: true, value: current };
}

function safeEvidencePath(path) {
  if (typeof path !== 'string' || path.length === 0) return false;
  const absolute = resolve(ROOT, path);
  return absolute.startsWith(ROOT + sep) && !path.split('/').includes('..');
}

function fixtureArtifactContent(path) {
  if (!activeFixtureArtifacts?.has(path)) return null;
  const value = activeFixtureArtifacts.get(path);
  return typeof value === 'string' ? value : JSON.stringify(value);
}

function evidenceContent(ref) {
  if (!safeEvidencePath(ref.artifact_path)) {
    return { error: diagnostic('COV_EVIDENCE_PATH_INVALID', 'Evidence path must remain inside the repository.', ref.artifact_path || '(missing)') };
  }
  try {
    const fixtureContent = fixtureArtifactContent(ref.artifact_path);
    if (fixtureContent !== null
      && ((ref.head_binding === 'git_runtime_head' && ref.repository_commit === null)
        || (ref.head_binding === 'pinned_commit'
          && ref.repository_commit === activeFixtureRuntimeContext?.headSha))) {
      return { content: fixtureContent };
    }
    if (ref.head_binding === 'pinned_commit') {
      if (!/^[0-9a-f]{40}$/.test(ref.repository_commit || '')) {
        return { error: diagnostic('COV_EVIDENCE_HEAD_BINDING_INVALID', 'Pinned evidence requires a 40-character repository commit.', ref.evidence_id) };
      }
      return {
        content: execFileSync(
          'git',
          ['show', ref.repository_commit + ':' + ref.artifact_path],
          { cwd: ROOT, encoding: 'utf8' },
        ),
      };
    }
    if (ref.head_binding !== 'git_runtime_head' || ref.repository_commit !== null) {
      return { error: diagnostic('COV_EVIDENCE_HEAD_BINDING_INVALID', 'Runtime-head evidence must use git_runtime_head and a null repository_commit.', ref.evidence_id) };
    }
    if (!existsSync(join(ROOT, ref.artifact_path)) || !statSync(join(ROOT, ref.artifact_path)).isFile()) {
      return { error: diagnostic('COV_EVIDENCE_PATH_MISSING', 'Evidence artifact does not exist as a repository file.', ref.artifact_path) };
    }
    return { content: readText(ref.artifact_path) };
  } catch {
    return { error: diagnostic('COV_EVIDENCE_PATH_MISSING', 'Evidence artifact cannot be resolved at its required head.', ref.artifact_path || ref.evidence_id) };
  }
}

function artifactVersionMatches(content, ref) {
  if (ref.artifact_version === 'sha256:' + ref.content_sha256) return true;
  try {
    const value = JSON.parse(content);
    return VERSION_FIELDS.some((field) => value?.[field] === ref.artifact_version);
  } catch {
    return false;
  }
}

function repositoryContentAtEvidenceHead(ref, path) {
  if (!safeEvidencePath(path)) return null;
  try {
    const fixtureContent = fixtureArtifactContent(path);
    if (fixtureContent !== null
      && ((ref.head_binding === 'git_runtime_head' && ref.repository_commit === null)
        || (ref.head_binding === 'pinned_commit'
          && ref.repository_commit === activeFixtureRuntimeContext?.headSha))) {
      return fixtureContent;
    }
    if (ref.head_binding === 'pinned_commit') {
      return execFileSync(
        'git',
        ['show', ref.repository_commit + ':' + path],
        { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
      );
    }
    if (ref.head_binding === 'git_runtime_head' && ref.repository_commit === null) {
      return readText(path);
    }
  } catch {
    return null;
  }
  return null;
}

function repositoryContentAtCommit(repository, commit, path) {
  if (repository !== EXPECTED_REPOSITORY || !/^[0-9a-f]{40}$/.test(commit || '')
    || !safeEvidencePath(path)) return null;
  const fixtureContent = fixtureArtifactContent(path);
  if (fixtureContent !== null && commit === activeFixtureRuntimeContext?.headSha) {
    return fixtureContent;
  }
  const key = repository + '|' + commit + '|' + path;
  if (repositoryContentCache.has(key)) return repositoryContentCache.get(key);
  try {
    const content = execFileSync(
      'git',
      ['show', commit + ':' + path],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    );
    repositoryContentCache.set(key, content);
    return content;
  } catch {
    repositoryContentCache.set(key, null);
    return null;
  }
}

function repositoryJsonAtCommit(repository, commit, path) {
  const content = repositoryContentAtCommit(repository, commit, path);
  if (content === null) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function commitExistsOrFixture(commit) {
  if (commit === activeFixtureRuntimeContext?.headSha) return true;
  if (commitExistsCache.has(commit)) return commitExistsCache.get(commit);
  try {
    execFileSync('git', ['cat-file', '-e', commit + '^{commit}'], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    commitExistsCache.set(commit, true);
    return true;
  } catch {
    commitExistsCache.set(commit, false);
    return false;
  }
}

function commitIsAncestorOrFixture(ancestor, descendant) {
  if (ancestor === descendant) return true;
  if (descendant === activeFixtureRuntimeContext?.headSha
    && ancestor === activeFixtureRuntimeContext?.headSha) return true;
  const key = String(ancestor) + '|' + String(descendant);
  if (commitAncestorCache.has(key)) return commitAncestorCache.get(key);
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    commitAncestorCache.set(key, true);
    return true;
  } catch {
    commitAncestorCache.set(key, false);
    return false;
  }
}

function evidenceCommitPreexistsValidatedBase(commit, context) {
  const baseSha = context.runtimeContext?.baseSha;
  return /^[0-9a-f]{40}$/.test(baseSha || '')
    && commitExistsOrFixture(commit)
    && commitIsAncestorOrFixture(commit, baseSha);
}

function repositoryJsonAtEvidenceHead(ref, path) {
  const content = repositoryContentAtEvidenceHead(ref, path);
  if (content === null) return null;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function activeRuleForFamily(ref, decisionFamilyId) {
  const registry = repositoryJsonAtEvidenceHead(
    ref,
    'kernel/decision-governance/resolver-rule-registry.v0.json',
  );
  return Array.isArray(registry?.active_rules)
    ? registry.active_rules.find((rule) =>
      rule?.decision_family_id === decisionFamilyId) || null
    : null;
}

function normalizedFamilyToken(value) {
  return String(value || '').toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function familyFromP0Obligation(ref, obligationId) {
  const registry = repositoryJsonAtEvidenceHead(
    ref,
    'kernel/decision-governance/p0-decision-matrices.v0.json',
  );
  const candidates = (registry?.matrices || [])
    .map((matrix) => matrix?.decision_family_id)
    .filter(Boolean)
    .sort((left, right) => right.length - left.length);
  return candidates.find((familyId) =>
    String(obligationId || '').startsWith('OB-P0-' + normalizedFamilyToken(familyId))) || null;
}

function expectedDecisionFamily(ref, context) {
  if (context.decisionFamilyId) return context.decisionFamilyId;
  if (context.obligationGroup === 'applicable_p0_families') {
    return familyFromP0Obligation(ref, context.coverageSubjectId);
  }
  return null;
}

function subjectRegistryBinding(ref) {
  const registry = repositoryJsonAtEvidenceHead(ref, PATHS.subjectRegistry);
  if (!registry || !activeSchemaValidators.subjectRegistry
    || !activeSchemaValidators.subjectRegistry(registry)) {
    return { registry, binding: null, invalid: true };
  }
  const binding = (registry.bindings || []).find((item) =>
    item.artifact_role === ref.artifact_role
      && item.artifact_path === ref.artifact_path
      && item.symbol === ref.symbol) || null;
  return { registry, binding, invalid: false };
}

function fixtureRegistryRefs(activeRule, role) {
  const field = role === 'valid_fixture'
    ? 'valid_fixture_refs'
    : role === 'invalid_fixture'
      ? 'invalid_fixture_refs'
      : 'adversarial_fixture_refs';
  return activeRule?.fixture_triplet_coverage?.[field] || [];
}

function receiptSubjectMatches(subject, context, expectedFamily, expectedRuleId) {
  if (!subject || subject.subject_record_id !== context.subjectRecordId
    || subject.coverage_subject_id !== context.coverageSubjectId) return false;
  if (context.questionId && subject.question_id !== context.questionId) return false;
  if (context.obligationId && subject.obligation_id !== context.obligationId) return false;
  if (expectedFamily && subject.decision_family_id !== expectedFamily) return false;
  if (expectedRuleId && subject.rule_id !== expectedRuleId) return false;
  return true;
}

function resolvedLineageValue(source) {
  const content = repositoryContentAtCommit(
    source?.repository,
    source?.repository_commit,
    source?.artifact_path,
  );
  if (content === null) return { content: null, value: null, located: false };
  let artifact;
  try {
    artifact = JSON.parse(content);
  } catch {
    return { content, value: null, located: false };
  }
  const located = valueAtPointer(artifact, source.json_pointer);
  return { content, value: located.value, located: located.found };
}

function notApplicableDispositionDiagnostics(ref, artifact, context) {
  const diagnostics = [];
  if (!ref.artifact_path.startsWith('planning/coverage/dispositions/not-applicable/')) {
    diagnostics.push(diagnostic('COV_NOT_APPLICABLE_ARTIFACT_FORBIDDEN', 'Not-applicable credit requires a dedicated disposition artifact.', ref.evidence_id));
  }
  const schemaValid = artifact && activeSchemaValidators.notApplicableDisposition
    && activeSchemaValidators.notApplicableDisposition(artifact);
  if (!schemaValid) {
    diagnostics.push(diagnostic('COV_NOT_APPLICABLE_DISPOSITION_INVALID', 'Not-applicable evidence must resolve to the dedicated schema-valid disposition type.', ref.evidence_id));
    return diagnostics;
  }

  const expectedReason = context.notApplicableReasonCode;
  const expectedFamily = expectedDecisionFamily(ref, context);
  const subjectRecord = context.elementRecord || context.questionRecord;
  const verifiedSources = subjectRecord?.source_references || [];
  const subject = artifact.subject || {};
  const subjectMatches = subject.subject_record_id === context.subjectRecordId
    && subject.coverage_subject_id === context.coverageSubjectId
    && subject.record_kind === context.recordKind
    && subject.obligation_id === (context.obligationId || null)
    && subject.question_id === (context.questionId || null)
    && subject.question_link === (context.linkName || null)
    && subject.decision_family_id === expectedFamily;
  if (!subjectMatches) {
    diagnostics.push(diagnostic('COV_NOT_APPLICABLE_DISPOSITION_SUBJECT_MISMATCH', 'The disposition does not intrinsically identify the exact obligation or Question link.', ref.evidence_id));
  }
  if (artifact.reason?.reason_code !== expectedReason
    || artifact.reason?.validator_rule_id !== 'COV-NOT-APPLICABLE-V1'
    || artifact.reason?.validator_rule_version !== '1.0.0') {
    diagnostics.push(diagnostic('COV_NOT_APPLICABLE_DISPOSITION_REASON_MISMATCH', 'The disposition reason and validator rule must match the requested non-applicability reason.', ref.evidence_id));
  }

  const evidenceHead = artifact.evidence_head?.exact_head_sha;
  const runtimeHead = context.runtimeContext?.headSha;
  if (!commitExistsOrFixture(evidenceHead)
    || (runtimeHead && !commitIsAncestorOrFixture(evidenceHead, runtimeHead))) {
    diagnostics.push(diagnostic('COV_NOT_APPLICABLE_EVIDENCE_HEAD_MISMATCH', 'The disposition evidence head must be an immutable ancestor of the validated head.', ref.evidence_id));
  }
  if (!evidenceCommitPreexistsValidatedBase(evidenceHead, context)) {
    diagnostics.push(diagnostic('COV_NOT_APPLICABLE_SOURCE_NOT_BASE_ANCHORED', 'A not-applicable disposition can derive credit only from source evidence that predates and is reachable from the validated PR base.', ref.evidence_id));
  }

  for (const source of artifact.source_lineage || []) {
    const verifiedSource = verifiedSources.find((candidate) =>
      candidate.path === source.artifact_path
        && candidate.repository_commit === source.repository_commit
        && candidate.artifact_version === source.artifact_version
        && candidate.content_hash === source.content_sha256
        && (candidate.json_pointer || '') === (source.json_pointer || ''));
    if (!verifiedSource) {
      diagnostics.push(diagnostic('COV_NOT_APPLICABLE_LINEAGE_SOURCE_MISMATCH', 'Disposition lineage must equal a verified source reference of the affected record.', source.source_id || ref.evidence_id));
    }
    const resolved = resolvedLineageValue(source);
    if (resolved.content === null || !resolved.located) {
      diagnostics.push(diagnostic('COV_NOT_APPLICABLE_LINEAGE_UNRESOLVED', 'Every disposition lineage item must resolve at its exact repository commit and pointer.', source.source_id || ref.evidence_id));
      continue;
    }
    if (source.repository_commit !== evidenceHead
      || sha256Text(resolved.content) !== source.content_sha256
      || !artifactVersionMatches(resolved.content, {
        artifact_version: source.artifact_version,
        content_sha256: source.content_sha256,
      })) {
      diagnostics.push(diagnostic('COV_NOT_APPLICABLE_LINEAGE_MISMATCH', 'Disposition lineage head, hash, or version does not match the resolved source.', source.source_id));
    }
    const statement = resolved.value?.coverage_non_applicability || resolved.value;
    if (statement?.applicability !== 'not_applicable'
      || statement?.subject_record_id !== context.subjectRecordId
      || statement?.coverage_subject_id !== context.coverageSubjectId
      || statement?.reason_code !== expectedReason) {
      diagnostics.push(diagnostic('COV_NOT_APPLICABLE_LINEAGE_SUBJECT_MISMATCH', 'The source must intrinsically state non-applicability for the exact subject and reason.', source.source_id));
    }
  }
  return diagnostics;
}

function proofProducerBindingAtCommit(receipt, receiptType, commit) {
  const registry = repositoryJsonAtCommit(
    EXPECTED_REPOSITORY,
    commit,
    PATHS.proofProducerRegistry,
  );
  if (!registry || !activeSchemaValidators.proofProducerRegistry
    || !activeSchemaValidators.proofProducerRegistry(registry)) {
    return { registry, binding: null, invalid: true };
  }
  const binding = (registry.producers || []).find((producer) =>
    producer.active === true
      && producer.producer_id === receipt.provenance.producer_id
      && producer.producer_repository === receipt.provenance.producer_repository
      && producer.producer_role === receipt.provenance.producer_role
      && producer.receipt_types.includes(receiptType)) || null;
  return { registry, binding, invalid: false };
}

function normalizedProducerBinding(binding) {
  if (!binding) return null;
  return {
    producer_id: binding.producer_id,
    producer_repository: binding.producer_repository,
    producer_role: binding.producer_role,
    receipt_types: sortedUnique(binding.receipt_types),
    allowed_environment_ids: sortedUnique(binding.allowed_environment_ids),
    allowed_consumer_ids: sortedUnique(binding.allowed_consumer_ids),
    registration_source: binding.registration_source,
    active: binding.active,
  };
}

function producerBindingPreexistsBase(receipt, receiptType, context, headBinding) {
  const baseSha = context.runtimeContext?.baseSha;
  const base = proofProducerBindingAtCommit(receipt, receiptType, baseSha);
  return !base.invalid
    && base.binding
    && evidenceCommitPreexistsValidatedBase(
      headBinding.registration_source?.repository_commit,
      context,
    )
    && JSON.stringify(normalizedProducerBinding(base.binding))
      === JSON.stringify(normalizedProducerBinding(headBinding));
}

function proofProducerRegistrationDiagnostics(producer) {
  const diagnostics = [];
  if (!producer) return diagnostics;
  const source = producer.registration_source;
  const resolved = resolvedLineageValue({
    ...source,
    artifact_version: 'sha256:' + source.content_sha256,
  });
  const statement = resolved.value?.coverage_proof_producer_registration
    || resolved.value;
  if (resolved.content === null || !resolved.located
    || sha256Text(resolved.content) !== source.content_sha256
    || statement?.registration_type !== 'coverage_proof_producer'
    || statement?.producer_id !== producer.producer_id
    || statement?.producer_repository !== producer.producer_repository
    || statement?.producer_role !== producer.producer_role
    || !arraysEqual(statement?.receipt_types || [], producer.receipt_types || [])) {
    diagnostics.push(diagnostic('COV_PROOF_PRODUCER_REGISTRATION_UNVERIFIED', 'Registered producer identity and receipt roles must resolve intrinsically from immutable source evidence.', producer.producer_id));
  }
  return diagnostics;
}

function proofTimeDiagnostics(receipt, receiptType, context) {
  const diagnostics = [];
  const observedAt = receiptType === 'runtime_proof'
    ? receipt.runtime_scope?.captured_at
    : receipt.contract_result?.observed_at;
  const observed = Date.parse(observedAt || '');
  const validationTime = Date.parse(context.runtimeContext?.headCommittedAt || '');
  if (!Number.isFinite(observed) || !Number.isFinite(validationTime)) {
    diagnostics.push(diagnostic('COV_PROOF_TIME_INVALID', 'Proof observation time and validation-head time must be parseable.', receipt.receipt_id));
    return diagnostics;
  }
  if (observed > validationTime) {
    diagnostics.push(diagnostic('COV_PROOF_FUTURE_DATED', 'Future-dated proof cannot create coverage credit.', receipt.receipt_id));
  }
  const maxAgeDays = context.bundle?.contract?.evidence_binding?.proof_provenance?.max_age_days ?? 30;
  if (validationTime - observed > maxAgeDays * 24 * 60 * 60 * 1000) {
    diagnostics.push(diagnostic('COV_PROOF_STALE', 'Proof observation exceeds the contract freshness window.', receipt.receipt_id));
  }
  return diagnostics;
}

function proofLineageDiagnostics(receipt, receiptType, context, producerBinding) {
  const diagnostics = [];
  const expectedCaptureType = receiptType === 'runtime_proof'
    ? 'runtime_observation'
    : 'consumer_contract';
  const expectedPrefix = PROOF_CAPTURE_PATHS[receiptType];
  const referencedSourceIds = receiptType === 'runtime_proof'
    ? (receipt.observations || []).map((item) => item.capture_source_id)
    : [receipt.contract_result?.capture_source_id].filter(Boolean);
  const lineageIds = (receipt.source_lineage || []).map((source) => source.source_id);
  if (!arraysEqual(referencedSourceIds, lineageIds)
    || referencedSourceIds.length !== lineageIds.length) {
    diagnostics.push(diagnostic('COV_PROOF_LINEAGE_SET_MISMATCH', 'Receipt observations must reference every lineage capture exactly once.', receipt.receipt_id));
  }

  for (const source of receipt.source_lineage || []) {
    if (!source.artifact_path?.startsWith(expectedPrefix)) {
      diagnostics.push(diagnostic('COV_PROOF_CAPTURE_PATH_FORBIDDEN', 'Proof lineage must use the dedicated capture directory for its receipt type.', source.source_id));
    }
    const resolved = resolvedLineageValue(source);
    if (resolved.content === null || !resolved.located) {
      diagnostics.push(diagnostic('COV_PROOF_LINEAGE_UNRESOLVED', 'Every proof lineage item must resolve at its exact repository commit and pointer.', source.source_id));
      continue;
    }
    if (source.repository_commit !== receipt.provenance.evidence_head_sha) {
      diagnostics.push(diagnostic('COV_PROOF_LINEAGE_HEAD_MISMATCH', 'Every lineage item must bind to the receipt evidence head.', source.source_id));
    }
    if (sha256Text(resolved.content) !== source.content_sha256
      || !artifactVersionMatches(resolved.content, {
        artifact_version: source.artifact_version,
        content_sha256: source.content_sha256,
      })) {
      diagnostics.push(diagnostic('COV_PROOF_LINEAGE_HASH_MISMATCH', 'Proof lineage content hash or version does not match the immutable capture.', source.source_id));
    }
    const capture = resolved.value;
    const captureValid = capture && activeSchemaValidators.proofCapture
      && activeSchemaValidators.proofCapture(capture);
    if (!captureValid) {
      diagnostics.push(diagnostic('COV_PROOF_CAPTURE_INVALID', 'Resolved proof lineage must be a schema-valid capture receipt.', source.source_id));
      continue;
    }
    if (capture.capture_type !== expectedCaptureType
      || capture.repository !== EXPECTED_REPOSITORY
      || capture.exact_head_sha !== receipt.provenance.evidence_head_sha
      || !receiptSubjectMatches(
        capture.subject,
        context,
        context.expectedFamily,
        context.expectedRuleId,
      )) {
      diagnostics.push(diagnostic('COV_PROOF_CAPTURE_SUBJECT_MISMATCH', 'Capture type, head, and intrinsic subject must match the proof receipt.', source.source_id));
    }
    if (!producerBinding
      || capture.producer?.producer_id !== receipt.provenance.producer_id
      || capture.producer?.producer_repository !== receipt.provenance.producer_repository
      || capture.producer?.producer_role !== receipt.provenance.producer_role) {
      diagnostics.push(diagnostic('COV_PROOF_CAPTURE_PRODUCER_MISMATCH', 'Capture producer must match the registered receipt producer.', source.source_id));
    }
    const expectedResult = receiptType === 'runtime_proof'
      ? receipt.runtime_scope?.result
      : receipt.contract_result?.result;
    const expectedObservedAt = receiptType === 'runtime_proof'
      ? receipt.runtime_scope?.captured_at
      : receipt.contract_result?.observed_at;
    const scopeMatches = receiptType === 'runtime_proof'
      ? capture.scope?.environment_id === receipt.runtime_scope?.environment_id
        && capture.scope?.observation_type === receipt.runtime_scope?.observation_kind
      : capture.scope?.consumer_id === receipt.consumer?.consumer_id
        && capture.scope?.contract_id === receipt.contract_result?.contract_id;
    if (!scopeMatches || capture.result !== expectedResult) {
      diagnostics.push(diagnostic('COV_PROOF_CAPTURE_RESULT_MISMATCH', 'Capture scope and result must match the enclosing proof receipt.', source.source_id));
    }
    if (capture.captured_at !== expectedObservedAt) {
      diagnostics.push(diagnostic('COV_PROOF_CAPTURE_TIME_MISMATCH', 'Capture time must exactly match the verified receipt observation time.', source.source_id));
    }
    const rawPrefix = expectedPrefix + 'raw/';
    if (!capture.raw_evidence?.artifact_path?.startsWith(rawPrefix)) {
      diagnostics.push(diagnostic('COV_PROOF_RAW_CAPTURE_PATH_FORBIDDEN', 'Raw proof bytes must remain in the dedicated immutable capture directory.', source.source_id));
    }
    const rawContent = repositoryContentAtCommit(
      EXPECTED_REPOSITORY,
      receipt.provenance.evidence_head_sha,
      capture.raw_evidence?.artifact_path,
    );
    if (rawContent === null
      || sha256Text(rawContent) !== capture.raw_evidence?.content_sha256) {
      diagnostics.push(diagnostic('COV_PROOF_RAW_CAPTURE_UNVERIFIED', 'Capture raw evidence must resolve and match its immutable hash.', source.source_id));
    }
  }
  return diagnostics;
}

function proofReceiptDiagnostics(artifact, role, context) {
  const diagnostics = [];
  const receiptType = role === 'consumer_proof' ? 'consumer_proof' : 'runtime_proof';
  const schemaKey = receiptType === 'runtime_proof' ? 'runtimeProof' : 'consumerProof';
  const schemaValid = artifact && activeSchemaValidators[schemaKey]
    && activeSchemaValidators[schemaKey](artifact);
  if (!schemaValid) {
    diagnostics.push(diagnostic('COV_EVIDENCE_PROOF_RECEIPT_INVALID', 'Runtime and consumer proof require their dedicated schema-valid receipt type.', context.evidenceId));
    return diagnostics;
  }
  if (!receiptSubjectMatches(
    artifact.subject,
    context,
    context.expectedFamily,
    context.expectedRuleId,
  )) {
    diagnostics.push(diagnostic('COV_EVIDENCE_PROOF_SUBJECT_MISMATCH', 'Proof receipt subject does not match the expected record, obligation or Question, Family, and Rule.', context.evidenceId));
  }

  const evidenceHead = artifact.provenance?.evidence_head_sha;
  const runtimeHead = context.runtimeContext?.headSha;
  if (!commitExistsOrFixture(evidenceHead)) {
    diagnostics.push(diagnostic('COV_PROOF_HEAD_UNRESOLVED', 'Proof evidence head must resolve to an immutable repository commit.', artifact.receipt_id));
  } else if (runtimeHead && !commitIsAncestorOrFixture(evidenceHead, runtimeHead)) {
    diagnostics.push(diagnostic('COV_PROOF_HEAD_MISMATCH', 'Proof evidence head must be an ancestor of the validated exact head.', artifact.receipt_id));
  }
  if (!evidenceCommitPreexistsValidatedBase(evidenceHead, context)) {
    diagnostics.push(diagnostic('COV_PROOF_EVIDENCE_NOT_BASE_ANCHORED', 'Proof credit requires immutable capture evidence that predates and is reachable from the validated PR base.', artifact.receipt_id));
  }

  const registered = proofProducerBindingAtCommit(
    artifact,
    receiptType,
    evidenceHead,
  );
  const registrationDiagnostics = proofProducerRegistrationDiagnostics(
    registered.binding,
  );
  diagnostics.push(...registrationDiagnostics);
  if (registered.invalid || !registered.binding) {
    diagnostics.push(diagnostic('COV_PROOF_PRODUCER_UNKNOWN', 'Proof producer must be registered at the exact evidence head for this receipt type.', artifact.receipt_id));
  } else {
    if (!producerBindingPreexistsBase(
      artifact,
      receiptType,
      context,
      registered.binding,
    )) {
      diagnostics.push(diagnostic('COV_PROOF_PRODUCER_NOT_BASE_ANCHORED', 'A producer added or changed in the current PR cannot authorize proof credit in that same PR.', artifact.receipt_id));
    }
    const allowed = receiptType === 'runtime_proof'
      ? registered.binding.allowed_environment_ids.includes(artifact.runtime_scope.environment_id)
      : registered.binding.allowed_consumer_ids.includes(artifact.consumer.consumer_id);
    if (!allowed) {
      diagnostics.push(diagnostic('COV_PROOF_PRODUCER_SCOPE_MISMATCH', 'Registered producer scope does not authorize this environment or consumer.', artifact.receipt_id));
    }
  }

  if (receiptType === 'consumer_proof'
    && artifact.contract_result?.result !== 'accepted') {
    diagnostics.push(diagnostic('COV_CONSUMER_PROOF_REJECTED', 'A consumer rejection is blocking negative evidence and cannot create proof credit.', artifact.receipt_id));
  }
  if (receiptType === 'runtime_proof'
    && (artifact.runtime_scope?.result !== 'observed_pass'
      || (artifact.observations || []).some((item) => item.result !== 'observed_pass'
        || item.observation_type !== artifact.runtime_scope.observation_kind))) {
    diagnostics.push(diagnostic('COV_RUNTIME_PROOF_OBSERVATION_INVALID', 'Runtime credit requires allowed, consistent observed_pass results.', artifact.receipt_id));
  }
  diagnostics.push(...proofTimeDiagnostics(artifact, receiptType, context));
  diagnostics.push(...proofLineageDiagnostics(
    artifact,
    receiptType,
    context,
    registrationDiagnostics.length === 0 ? registered.binding : null,
  ));
  return diagnostics;
}

function creditSourceEvidence(record, runtimeContext) {
  const items = [];
  for (const name of CREDIT_SOURCE_CHAIN) {
    const link = record?.coverage_chain?.[name];
    const refs = link?.status === 'not_applicable_with_validated_reason'
      ? link.not_applicable_reason?.evidence_refs
      : link?.evidence_refs;
    for (const ref of refs || []) {
      if (!ref || typeof ref !== 'object' || Array.isArray(ref)) continue;
      items.push({
        link_name: name,
        evidence_id: ref.evidence_id,
        subject_record_id: ref.subject_record_id,
        coverage_subject_id: ref.coverage_subject_id,
        content_sha256: ref.content_sha256,
        evidence_head_sha: ref.head_binding === 'pinned_commit'
          ? ref.repository_commit
          : runtimeContext?.headSha,
      });
    }
  }
  return items.sort((left, right) => {
    const linkOrder = CREDIT_SOURCE_CHAIN.indexOf(left.link_name)
      - CREDIT_SOURCE_CHAIN.indexOf(right.link_name);
    return linkOrder || left.evidence_id.localeCompare(right.evidence_id);
  });
}

function currentBaselineIdentityEligible(bundle) {
  if (!bundle?.baseline || !activeSchemaValidators.baseline
    || !activeSchemaValidators.baseline(bundle.baseline)) return false;
  const requiredPaths = new Set([PATHS.contract, PATHS.ledger, PATHS.catalog]);
  const hashes = new Map((bundle.baseline.content_hashes || [])
    .map((item) => [item.path, item.sha256]));
  for (const path of requiredPaths) {
    if (!hashes.has(path) || !existsSync(join(ROOT, path))
      || sha256Text(readText(path)) !== hashes.get(path)) return false;
  }
  return true;
}

function generatedCoverageCreditProjection(record, bundle, context) {
  const questionId = record.question_id;
  const baselineId = bundle?.baseline?.baseline_id;
  const ruleId = context.expectedRuleId;
  if (!baselineId || !ruleId || !currentBaselineIdentityEligible(bundle)) return null;
  return {
    credit_id: 'coverage-credit.' + questionId.toLowerCase().replaceAll('_', '-') + '.v1',
    credit_version: '1.0.0',
    receipt_type: 'coverage_credit_projection',
    subject: {
      subject_record_id: questionId,
      coverage_subject_id: questionId + '#coverage_credit',
      question_id: questionId,
      decision_family_id: record.decision_family_id,
      rule_id: ruleId,
    },
    baseline_id: baselineId,
    derivation: {
      rule_id: 'COV-QUESTION-CREDIT-V1',
      rule_version: '1.0.0',
      mode: 'validator_recomputed',
      required_chain: CREDIT_SOURCE_CHAIN,
    },
    source_evidence: creditSourceEvidence(record, context.runtimeContext),
    claims: {
      coverage_granted: false,
      readiness: false,
      release_readiness: false,
      production_readiness: false,
    },
  };
}

function creditEvidenceKey(item) {
  return [
    item?.link_name,
    item?.evidence_id,
    item?.subject_record_id,
    item?.coverage_subject_id,
    item?.content_sha256,
    item?.evidence_head_sha,
  ].join('|');
}

function coverageCreditProjectionDiagnostics(artifact, context) {
  const diagnostics = [];
  const schemaValid = artifact && activeSchemaValidators.coverageCredit
    && activeSchemaValidators.coverageCredit(artifact);
  if (!schemaValid) {
    diagnostics.push(diagnostic('COV_EVIDENCE_CREDIT_RECEIPT_INVALID', 'Coverage credit requires a schema-valid validator projection.', context.evidenceId));
  }
  if (artifact?.coverage_granted === true
    || artifact?.derivation?.coverage_granted === true
    || artifact?.claims?.coverage_granted === true) {
    diagnostics.push(diagnostic('COV_CREDIT_PRODUCER_ASSERTION_FORBIDDEN', 'Producer-authored coverage_granted cannot create Question credit.', context.evidenceId));
  }
  if (!schemaValid) return diagnostics;

  const expected = generatedCoverageCreditProjection(
    context.questionRecord,
    context.bundle,
    context,
  );
  if (!expected) {
    diagnostics.push(diagnostic('COV_CREDIT_DERIVATION_CHAIN_UNVERIFIED', 'The validator cannot generate credit without the active Rule and current baseline.', context.evidenceId));
    return diagnostics;
  }
  if (!receiptSubjectMatches(
    artifact.subject,
    context,
    context.expectedFamily,
    context.expectedRuleId,
  )) {
    diagnostics.push(diagnostic('COV_EVIDENCE_CREDIT_SUBJECT_MISMATCH', 'Coverage credit projection does not match the exact Question, Family, and Rule.', context.evidenceId));
  }
  if (artifact.baseline_id !== expected.baseline_id) {
    diagnostics.push(diagnostic('COV_CREDIT_BASELINE_MISMATCH', 'Coverage credit baseline must equal the current schema-and-hash-validated baseline identity.', context.evidenceId));
  }
  if (artifact.credit_id !== expected.credit_id
    || JSON.stringify(artifact.derivation) !== JSON.stringify(expected.derivation)) {
    diagnostics.push(diagnostic('COV_CREDIT_DERIVATION_MISMATCH', 'Coverage credit identity and derivation must equal the validator-generated projection.', context.evidenceId));
  }

  const actualEvidence = artifact.source_evidence || [];
  const actualKeys = actualEvidence.map(creditEvidenceKey);
  const expectedKeys = expected.source_evidence.map(creditEvidenceKey);
  if (new Set(actualKeys).size !== actualKeys.length) {
    diagnostics.push(diagnostic('COV_CREDIT_SOURCE_EVIDENCE_DUPLICATE', 'Coverage credit source evidence cannot contain duplicate link evidence.', context.evidenceId));
  }
  if (actualEvidence.some((item) => item.subject_record_id !== context.questionId
    || !String(item.coverage_subject_id || '').startsWith(context.questionId + '#'))) {
    diagnostics.push(diagnostic('COV_CREDIT_SOURCE_EVIDENCE_CROSS_SUBJECT', 'Coverage credit cannot reuse evidence from another Question.', context.evidenceId));
  }
  const expectedSet = new Set(expectedKeys);
  const actualSet = new Set(actualKeys);
  if (expectedKeys.some((key) => !actualSet.has(key))) {
    diagnostics.push(diagnostic('COV_CREDIT_SOURCE_EVIDENCE_MISSING', 'Coverage credit must include every required preceding link evidence identity and hash.', context.evidenceId));
  }
  if (actualKeys.some((key) => !expectedSet.has(key))) {
    diagnostics.push(diagnostic('COV_CREDIT_SOURCE_EVIDENCE_EXTRA', 'Coverage credit cannot include unverified or unrelated source evidence.', context.evidenceId));
  }
  const expectedById = new Map(expected.source_evidence.map((item) => [
    item.link_name + '|' + item.evidence_id,
    item,
  ]));
  if (actualEvidence.some((item) => {
    const expectedItem = expectedById.get(item.link_name + '|' + item.evidence_id);
    return expectedItem && expectedItem.evidence_head_sha !== item.evidence_head_sha;
  })) {
    diagnostics.push(diagnostic('COV_CREDIT_SOURCE_EVIDENCE_STALE', 'Coverage credit source evidence head is stale or cross-head.', context.evidenceId));
  }
  return diagnostics;
}

function evidenceSemanticDiagnostics(ref, content, context) {
  const diagnostics = [];
  const role = ref.artifact_role;
  if (role === 'denominator_change') return diagnostics;
  let artifact = null;
  try {
    artifact = JSON.parse(content);
  } catch {
    artifact = null;
  }
  const located = ref.json_pointer !== null && artifact !== null
    ? valueAtPointer(artifact, ref.json_pointer)
    : { found: false, value: undefined };
  const value = located.found ? located.value : artifact;
  const expectedFamily = expectedDecisionFamily(ref, context);
  const activeRule = expectedFamily ? activeRuleForFamily(ref, expectedFamily) : null;
  const expectedRuleId = activeRule?.rule_id || null;
  const resolvedContext = {
    ...context,
    evidenceId: ref.evidence_id,
    expectedFamily,
    expectedRuleId,
  };

  if (role === 'not_applicable_evidence') {
    diagnostics.push(...notApplicableDispositionDiagnostics(
      ref,
      artifact,
      resolvedContext,
    ));
    return diagnostics;
  }

  if (role === 'catalog_record' || role === 'decision_question') {
    const expectedQuestionId = context.questionId
      || (String(context.coverageSubjectId || '').startsWith('OB-DQ-')
        ? String(context.coverageSubjectId).slice(3)
        : null);
    if (!expectedQuestionId || value?.question_id !== expectedQuestionId) {
      diagnostics.push(diagnostic('COV_EVIDENCE_QUESTION_SUBJECT_MISMATCH', 'Resolved Question evidence does not intrinsically identify the expected Question.', ref.evidence_id));
    }
    return diagnostics;
  }

  if (role === 'matrix' || role === 'p0_family') {
    const expectedMatrixId = activeRule?.matrix_id
      || (expectedFamily ? 'p0.matrix.' + expectedFamily + '.v0' : null);
    if (!expectedFamily || value?.decision_family_id !== expectedFamily
      || (expectedMatrixId && value?.matrix_id !== expectedMatrixId)) {
      diagnostics.push(diagnostic(
        role === 'matrix'
          ? 'COV_EVIDENCE_MATRIX_SUBJECT_MISMATCH'
          : 'COV_EVIDENCE_P0_FAMILY_SUBJECT_MISMATCH',
        'Resolved Matrix evidence belongs to a different decision Family or Matrix subject.',
        ref.evidence_id,
      ));
    }
    return diagnostics;
  }

  if (role === 'resolver_rule') {
    if (!expectedFamily || !expectedRuleId
      || value?.decision_family_id !== expectedFamily
      || value?.rule_id !== expectedRuleId
      || value?.matrix_ref?.matrix_id !== activeRule?.matrix_id) {
      diagnostics.push(diagnostic('COV_EVIDENCE_RESOLVER_SUBJECT_MISMATCH', 'Resolved Resolver Rule does not match the expected Family, active Rule, and Matrix.', ref.evidence_id));
    }
    return diagnostics;
  }

  if (role === 'deterministic_evaluator' || (role === 'l2_audit' && ref.symbol !== null)) {
    const registered = subjectRegistryBinding(ref);
    if (registered.invalid || !registered.binding) {
      diagnostics.push(diagnostic('COV_EVIDENCE_JS_SYMBOL_UNREGISTERED', 'A JS symbol cannot create coverage credit without a schema-valid exact subject registry binding.', ref.evidence_id));
      return diagnostics;
    }
    const binding = registered.binding;
    const matches = expectedFamily
      && expectedRuleId
      && binding.decision_family_id === expectedFamily
      && binding.rule_id === expectedRuleId
      && binding.eligible_question_ids.includes(context.questionId)
      && binding.coverage_credit_granted === false;
    if (!matches) {
      diagnostics.push(diagnostic(
        role === 'deterministic_evaluator'
          ? 'COV_EVIDENCE_EVALUATOR_SUBJECT_MISMATCH'
          : 'COV_EVIDENCE_L2_SUBJECT_MISMATCH',
        'Registered JS symbol belongs to a different Question, Family, or active Rule.',
        ref.evidence_id,
      ));
    }
    return diagnostics;
  }

  if (['valid_fixture', 'invalid_fixture', 'adversarial_fixture'].includes(role)) {
    const expectedKind = role.replace('_fixture', '');
    const registeredPaths = fixtureRegistryRefs(activeRule, role);
    if (!expectedFamily || !expectedRuleId
      || artifact?.fixture_type !== 'resolver_mvp_case'
      || artifact?.case_kind !== expectedKind
      || artifact?.input?.decision_family_id !== expectedFamily
      || !registeredPaths.includes(ref.artifact_path)) {
      diagnostics.push(diagnostic('COV_EVIDENCE_FIXTURE_SUBJECT_MISMATCH', 'Resolved fixture is not the registered role-specific fixture for the expected Family and Rule.', ref.evidence_id));
    }
    return diagnostics;
  }

  if (role === 'l2_audit') {
    if (!expectedFamily || !expectedRuleId
      || artifact?.fixture_type !== 'l2_decision_correctness_case'
      || artifact?.case_kind !== 'valid'
      || artifact?.input?.decision_record?.decision_family_id !== expectedFamily
      || artifact?.input?.decision_record?.rule_id !== expectedRuleId
      || artifact?.expected_result?.audit_status !== 'pass') {
      diagnostics.push(diagnostic('COV_EVIDENCE_L2_SUBJECT_MISMATCH', 'Resolved L2 audit does not target the expected Question Family and active Rule.', ref.evidence_id));
    }
    return diagnostics;
  }

  if (role === 'runtime_proof' || role === 'runtime_check' || role === 'consumer_proof') {
    const runtime = role !== 'consumer_proof';
    const dedicatedPrefix = runtime
      ? 'planning/coverage/proofs/runtime/'
      : 'planning/coverage/proofs/consumer/';
    if (!ref.artifact_path.startsWith(dedicatedPrefix)) {
      diagnostics.push(diagnostic('COV_EVIDENCE_PROOF_ARTIFACT_FORBIDDEN', 'Generic fixtures, planning files, and review prose cannot satisfy runtime or consumer proof roles.', ref.evidence_id));
    }
    diagnostics.push(...proofReceiptDiagnostics(
      artifact,
      role,
      resolvedContext,
    ));
    return diagnostics;
  }

  if (role === 'coverage_credit') {
    if (!ref.artifact_path.startsWith('planning/coverage/credits/')) {
      diagnostics.push(diagnostic('COV_EVIDENCE_CREDIT_ARTIFACT_FORBIDDEN', 'Coverage credit requires a dedicated derived credit receipt.', ref.evidence_id));
    }
    diagnostics.push(...coverageCreditProjectionDiagnostics(
      artifact,
      resolvedContext,
    ));
    return diagnostics;
  }

  if (role === 'safety_gate') {
    const ids = Array.isArray(value?.coverage_obligation_ids)
      ? value.coverage_obligation_ids
      : [value?.obligation_id].filter(Boolean);
    if (!ids.includes(context.coverageSubjectId)) {
      diagnostics.push(diagnostic('COV_EVIDENCE_SAFETY_GATE_SUBJECT_MISMATCH', 'Safety-gate evidence does not intrinsically name the expected obligation.', ref.evidence_id));
    }
  }
  return diagnostics;
}

function subjectRegistryDiagnostics(bundle) {
  const diagnostics = [];
  let registry;
  try {
    registry = readJson(PATHS.subjectRegistry);
  } catch {
    return [diagnostic('COV_EVIDENCE_SUBJECT_REGISTRY_MISSING', 'The JS evidence subject registry is required for semantic symbol binding.', PATHS.subjectRegistry)];
  }
  const schemaIssues = schemaDiagnostics(
    'subjectRegistry',
    registry,
    activeSchemaValidators,
  );
  diagnostics.push(...schemaIssues);
  if (schemaIssues.length > 0) return diagnostics;

  const resolverRegistry = readJson(
    'kernel/decision-governance/resolver-rule-registry.v0.json',
  );
  const catalogById = new Map((bundle.catalog?.records || [])
    .map((record) => [record.question_id, record]));
  const bindingKeys = new Set();
  for (const binding of registry.bindings || []) {
    const bindingKey = [binding.artifact_role, binding.artifact_path, binding.symbol].join('|');
    if (bindingKeys.has(bindingKey)) {
      diagnostics.push(diagnostic('COV_EVIDENCE_SUBJECT_REGISTRY_BINDING_INVALID', 'JS subject registry role/path/symbol bindings must be unique.', binding.binding_id));
    }
    bindingKeys.add(bindingKey);
    const activeRule = (resolverRegistry.active_rules || []).find((rule) =>
      rule?.decision_family_id === binding.decision_family_id);
    if (!activeRule || activeRule.rule_id !== binding.rule_id) {
      diagnostics.push(diagnostic('COV_EVIDENCE_SUBJECT_REGISTRY_BINDING_INVALID', 'JS subject binding must match an active Resolver Family and Rule.', binding.binding_id));
    }
    const questionsMatch = binding.eligible_question_ids.every((questionId) =>
      catalogById.get(questionId)?.decision_family_id === binding.decision_family_id);
    if (!questionsMatch) {
      diagnostics.push(diagnostic('COV_EVIDENCE_SUBJECT_REGISTRY_QUESTION_MISMATCH', 'Every registered Question must exist in the same decision Family as the JS binding.', binding.binding_id));
    }
    if (binding.artifact_role === 'deterministic_evaluator') {
      const expectedRef = binding.artifact_path + '#' + binding.symbol;
      const registeredEntrypoints = new Set([
        activeRule?.implementation_ref,
        resolverRegistry.l2_audit_scope?.resolver_entrypoint,
      ].filter(Boolean));
      if (!registeredEntrypoints.has(expectedRef)) {
        diagnostics.push(diagnostic('COV_EVIDENCE_SUBJECT_REGISTRY_BINDING_INVALID', 'Evaluator binding must equal an active Rule implementation or registered Resolver entrypoint.', binding.binding_id));
      }
    } else if (binding.artifact_role === 'l2_audit'
      && resolverRegistry.l2_audit_scope?.implementation_ref !== binding.artifact_path) {
      diagnostics.push(diagnostic('COV_EVIDENCE_SUBJECT_REGISTRY_BINDING_INVALID', 'L2 binding path must equal the active L2 audit implementation.', binding.binding_id));
    }
    const content = existsSync(join(ROOT, binding.artifact_path))
      ? readText(binding.artifact_path)
      : '';
    const escaped = String(binding.symbol).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp('\\b' + escaped + '\\b').test(content)) {
      diagnostics.push(diagnostic('COV_EVIDENCE_SUBJECT_REGISTRY_BINDING_INVALID', 'Registered JS symbol must exist in its exact artifact path.', binding.binding_id));
    }
  }
  return diagnostics;
}

function proofProducerRegistryDiagnostics() {
  const diagnostics = [];
  let registry;
  try {
    registry = readJson(PATHS.proofProducerRegistry);
  } catch {
    return [diagnostic('COV_PROOF_PRODUCER_REGISTRY_MISSING', 'The proof producer registry is required and fail-closed.', PATHS.proofProducerRegistry)];
  }
  const schemaIssues = schemaDiagnostics(
    'proofProducerRegistry',
    registry,
    activeSchemaValidators,
  );
  diagnostics.push(...schemaIssues);
  if (schemaIssues.length > 0) return diagnostics;
  const ids = (registry.producers || []).map((producer) => producer.producer_id);
  if (ids.length !== new Set(ids).size) {
    diagnostics.push(diagnostic('COV_PROOF_PRODUCER_REGISTRY_DUPLICATE', 'Proof producer IDs must be unique.', PATHS.proofProducerRegistry));
  }
  for (const producer of registry.producers || []) {
    diagnostics.push(...proofProducerRegistrationDiagnostics(producer));
  }
  return diagnostics;
}

function evidenceCarrierDiagnostics(
  ref,
  expectedRoles,
  subjectRecordId,
  coverageSubjectId,
  semanticContext = {},
) {
  const diagnostics = [];
  if (!ref || typeof ref !== 'object' || Array.isArray(ref)) {
    return [diagnostic('COV_EVIDENCE_CARRIER_INVALID', 'Credit-bearing evidence must use a typed evidence carrier.', subjectRecordId)];
  }
  const required = [
    'evidence_id',
    'subject_record_id',
    'coverage_subject_id',
    'artifact_role',
    'artifact_path',
    'artifact_version',
    'content_sha256',
    'head_binding',
    'repository_commit',
    'json_pointer',
    'symbol',
  ];
  if (required.some((field) => !Object.prototype.hasOwnProperty.call(ref, field))) {
    diagnostics.push(diagnostic('COV_EVIDENCE_CARRIER_INVALID', 'Typed evidence carrier is missing a required field.', ref.evidence_id || subjectRecordId));
    return diagnostics;
  }
  if (ref.subject_record_id !== subjectRecordId) {
    diagnostics.push(diagnostic('COV_EVIDENCE_CROSS_RECORD', 'Evidence subject does not match the credit-bearing record.', ref.evidence_id));
  }
  if (ref.coverage_subject_id !== coverageSubjectId) {
    diagnostics.push(diagnostic('COV_EVIDENCE_CROSS_SUBJECT', 'Evidence is bound to a different obligation or Question-chain link.', ref.evidence_id));
  }
  if (!expectedRoles.includes(ref.artifact_role)) {
    diagnostics.push(diagnostic('COV_EVIDENCE_ROLE_MISMATCH', 'Evidence role is not valid for this obligation or chain link.', ref.evidence_id));
  }
  const pathRules = ROLE_PATH_RULES[ref.artifact_role] || [];
  if (pathRules.length === 0 || !pathRules.some((prefix) => ref.artifact_path?.startsWith(prefix))) {
    diagnostics.push(diagnostic('COV_EVIDENCE_ARTIFACT_TYPE_MISMATCH', 'Evidence artifact path is incompatible with its declared role.', ref.evidence_id));
  }
  const resolved = evidenceContent(ref);
  if (resolved.error) {
    diagnostics.push(resolved.error);
    return diagnostics;
  }
  const observedHash = sha256Text(resolved.content);
  if (ref.content_sha256 !== observedHash) {
    diagnostics.push(diagnostic('COV_EVIDENCE_HASH_MISMATCH', 'Evidence content hash does not match the resolved artifact.', ref.evidence_id));
  }
  if (!artifactVersionMatches(resolved.content, ref)) {
    diagnostics.push(diagnostic('COV_EVIDENCE_VERSION_MISMATCH', 'Evidence artifact version does not match the resolved artifact.', ref.evidence_id));
  }
  if (ref.json_pointer === null && ref.symbol === null) {
    diagnostics.push(diagnostic('COV_EVIDENCE_LOCATOR_MISSING', 'Evidence requires a JSON Pointer or symbol locator.', ref.evidence_id));
  }
  if (ref.json_pointer !== null) {
    try {
      const parsed = JSON.parse(resolved.content);
      if (!valueAtPointer(parsed, ref.json_pointer).found) {
        diagnostics.push(diagnostic('COV_EVIDENCE_POINTER_INVALID', 'Evidence JSON Pointer does not resolve.', ref.evidence_id));
      }
    } catch {
      diagnostics.push(diagnostic('COV_EVIDENCE_POINTER_INVALID', 'JSON Pointer evidence must reference a JSON artifact.', ref.evidence_id));
    }
  }
  if (ref.symbol !== null) {
    const escaped = String(ref.symbol).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    if (!new RegExp('\\b' + escaped + '\\b').test(resolved.content)) {
      diagnostics.push(diagnostic('COV_EVIDENCE_SYMBOL_MISSING', 'Evidence symbol does not exist in the resolved artifact.', ref.evidence_id));
    }
  }
  diagnostics.push(...evidenceSemanticDiagnostics(ref, resolved.content, {
    ...semanticContext,
    subjectRecordId,
    coverageSubjectId,
  }));
  return diagnostics;
}

function evidenceRefsDiagnostics(
  refs,
  expectedRoles,
  subjectRecordId,
  requireTyped,
  coverageSubjectId = subjectRecordId,
  semanticContext = {},
) {
  if (!Array.isArray(refs) || refs.length === 0) {
    return requireTyped
      ? [diagnostic('COV_EVIDENCE_REQUIRED', 'Credit-bearing state requires resolvable evidence.', subjectRecordId)]
      : [];
  }
  const diagnostics = [];
  for (const ref of refs) {
    if (typeof ref === 'string') {
      if (requireTyped) {
        diagnostics.push(diagnostic('COV_EVIDENCE_CARRIER_INVALID', 'Free-form evidence references cannot create coverage credit.', subjectRecordId));
      }
      continue;
    }
    diagnostics.push(...evidenceCarrierDiagnostics(
      ref,
      expectedRoles,
      subjectRecordId,
      coverageSubjectId,
      semanticContext,
    ));
  }
  return diagnostics;
}

function validNotApplicable(
  item,
  subjectRecordId,
  coverageSubjectId,
  semanticContext = {},
) {
  if (!item || item.status !== 'not_applicable_with_validated_reason') return true;
  const reason = item.not_applicable_reason;
  if (reason && Object.prototype.hasOwnProperty.call(reason, 'validator_accepted')) {
    return false;
  }
  return Boolean(
    reason
    && typeof reason.reason_code === 'string'
    && reason.reason_code.length > 0
    && Array.isArray(reason.evidence_refs)
    && reason.evidence_refs.length === 1
    && evidenceRefsDiagnostics(
      reason.evidence_refs,
      ['not_applicable_evidence'],
      subjectRecordId,
      true,
      coverageSubjectId,
      {
        ...semanticContext,
        notApplicableReasonCode: reason.reason_code,
      },
    ).length === 0
  );
}

function obligationCovered(item, group, record, bundle, validationContext = {}) {
  if (!COVERED_OBLIGATION_STATES.has(item?.status)) return false;
  const semanticContext = {
    ...validationContext,
    bundle,
    recordKind: 'element',
    elementRecord: record,
    elementId: record.element_id,
    obligationId: item.obligation_id,
    obligationGroup: group,
  };
  if (!validNotApplicable(
    item,
    record.record_id,
    item.obligation_id,
    semanticContext,
  )) return false;
  if (item.status === 'not_applicable_with_validated_reason') return true;
  const roles = bundle?.contract?.evidence_binding?.element_obligation_roles?.[group] || [];
  return evidenceRefsDiagnostics(
    item.evidence_refs,
    roles,
    record.record_id,
    true,
    item.obligation_id,
    semanticContext,
  ).length === 0;
}

function elementCovered(record, bundle, validationContext = {}) {
  const obligations = obligationEntries(record);
  return obligations.length > 0
    && obligations.every(({ group, item }) => obligationCovered(
      item,
      group,
      record,
      bundle,
      validationContext,
    ));
}

function chainLinkCovered(link, name, record, bundle, validationContext = {}) {
  if (!COMPLETE_CHAIN_STATES.has(link?.status)) return false;
  if (name === 'coverage_credit'
    && link.status === 'not_applicable_with_validated_reason') return false;
  const coverageSubjectId = record.question_id + '#' + name;
  const semanticContext = {
    ...validationContext,
    bundle,
    questionRecord: record,
    recordKind: 'question',
    questionId: record.question_id,
    decisionFamilyId: record.decision_family_id,
    linkName: name,
  };
  if (!validNotApplicable(
    link,
    record.question_id,
    coverageSubjectId,
    semanticContext,
  )) return false;
  if (link.status === 'not_applicable_with_validated_reason') return true;
  const roles = bundle?.contract?.evidence_binding?.question_link_roles?.[name] || [];
  return evidenceRefsDiagnostics(
    link.evidence_refs,
    roles,
    record.question_id,
    true,
    coverageSubjectId,
    semanticContext,
  ).length === 0;
}

function questionCovered(record, bundle, validationContext = {}) {
  const chain = record?.coverage_chain || {};
  return CREDIT_SOURCE_CHAIN.every((name) => chainLinkCovered(
    chain[name],
    name,
    record,
    bundle,
    validationContext,
  )) && chainLinkCovered(
    chain.coverage_credit,
    'coverage_credit',
    record,
    bundle,
    validationContext,
  );
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

function deriveCoverage(bundle, validationContext = {}) {
  const ledgerRecords = Array.isArray(bundle.ledger?.records) ? bundle.ledger.records : [];
  const catalogRecords = Array.isArray(bundle.catalog?.records) ? bundle.catalog.records : [];

  const elementDenominatorRecords = ledgerRecords.filter((record) => record.denominator_membership === 'confirmed');
  const questionDenominatorRecords = catalogRecords.filter((record) => record.denominator_membership === 'confirmed');
  const elementNumerator = elementDenominatorRecords
    .filter((record) => elementCovered(record, bundle, validationContext)).length;
  const questionNumerator = questionDenominatorRecords
    .filter((record) => questionCovered(record, bundle, validationContext)).length;

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
    .filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership)
      && record.critical === true
      && questionCovered(record, bundle, validationContext))
    .length
    + ledgerRecords
      .filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership))
      .flatMap((record) => obligationEntries(record)
        .filter(({ group, item }) => item.critical === true
          && group === 'required_safety_gates'
          && obligationCovered(item, group, record, bundle, validationContext)))
      .length;
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

function sortedUnique(values) {
  return [...new Set(values || [])].sort();
}

function arraysEqual(left, right) {
  return JSON.stringify(sortedUnique(left)) === JSON.stringify(sortedUnique(right));
}

function denominatorRecordMap(bundle) {
  const records = [
    ...(bundle?.ledger?.records || []),
    ...(bundle?.catalog?.records || []),
  ];
  return new Map(records.map((record) => [
    record.record_id || record.question_id,
    record,
  ]));
}

function deriveDenominatorTransition(baseBundle, headBundle, validationContext = {}) {
  const hasBase = Boolean(baseBundle?.ledger && baseBundle?.catalog && baseBundle?.baseline);
  if (!hasBase) {
    return {
      initialBootstrap: true,
      hasChange: false,
      addedRecordIds: [],
      removedRecordIds: [],
      changedRecordIds: [],
      baseDerived: null,
      headDerived: deriveCoverage(headBundle, validationContext),
      baseBundle: null,
      baseRecords: new Map(),
      headRecords: denominatorRecordMap(headBundle),
    };
  }
  const baseRecords = denominatorRecordMap(baseBundle);
  const headRecords = denominatorRecordMap(headBundle);
  const addedRecordIds = [...headRecords.keys()].filter((id) => !baseRecords.has(id)).sort();
  const removedRecordIds = [...baseRecords.keys()].filter((id) => !headRecords.has(id)).sort();
  const changedRecordIds = [...headRecords.keys()].filter((id) =>
    baseRecords.has(id)
      && baseRecords.get(id).denominator_membership
        !== headRecords.get(id).denominator_membership).sort();
  return {
    initialBootstrap: false,
    hasChange: addedRecordIds.length > 0
      || removedRecordIds.length > 0
      || changedRecordIds.length > 0,
    addedRecordIds,
    removedRecordIds,
    changedRecordIds,
    baseDerived: deriveCoverage(baseBundle, validationContext),
    headDerived: deriveCoverage(headBundle, validationContext),
    baseBundle,
    baseRecords,
    headRecords,
  };
}

function expectedReasonShape(recordId, transition) {
  const before = transition.baseRecords.get(recordId);
  const after = transition.headRecords.get(recordId);
  return {
    change_kind: !before ? 'added' : !after ? 'removed' : 'reclassified',
    previous_membership: before?.denominator_membership ?? null,
    new_membership: after?.denominator_membership ?? null,
  };
}

function denominatorTargetDiagnostics(reason, transition) {
  const diagnostics = [];
  const after = transition.headRecords.get(reason.record_id);
  const membership = after?.denominator_membership;
  const targetId = membership === 'excluded_duplicate'
    ? after.duplicate_of
    : membership === 'excluded_superseded'
      ? after.superseded_by
      : reason.target_record_id;
  const targetRequired = membership === 'excluded_duplicate'
    || membership === 'excluded_superseded'
    || ['duplicate', 'superseded'].includes(reason.reason_code);
  if (targetRequired) {
    const target = transition.headRecords.get(targetId);
    if (!targetId || targetId === reason.record_id || !target
      || EXCLUDED_MEMBERSHIPS.has(target.denominator_membership)) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_TARGET_INVALID', 'Duplicate or supersession disposition requires a distinct active target record.', reason.record_id));
    }
    if (reason.target_record_id !== targetId) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_TARGET_INVALID', 'Reason target must match the record duplicate/supersession relationship.', reason.record_id));
    }
  } else if (reason.target_record_id !== null) {
    diagnostics.push(diagnostic('COV_DENOMINATOR_TARGET_INVALID', 'This denominator reason must not name an unrelated target.', reason.record_id));
  }
  return diagnostics;
}

function denominatorRecordSourceReferences(reason, transition) {
  const before = transition.baseRecords.get(reason.record_id);
  const after = transition.headRecords.get(reason.record_id);
  return [
    ...(before?.source_references || []),
    ...(after?.source_references || []),
  ];
}

function carrierMatchesRecordSource(ref, source) {
  return ref.head_binding === 'pinned_commit'
    && ref.artifact_path === source?.path
    && ref.artifact_version === source?.artifact_version
    && ref.content_sha256 === source?.content_hash
    && ref.repository_commit === source?.repository_commit
    && ref.json_pointer === (source?.json_pointer ?? null)
    && ref.symbol === null;
}

function lineageMatchesRecordSource(lineage, source) {
  return lineage?.path === source?.path
    && lineage?.artifact_version === source?.artifact_version
    && lineage?.retrieval_identity === source?.retrieval_identity
    && lineage?.content_hash === source?.content_hash
    && lineage?.repository_commit === source?.repository_commit
    && (lineage?.json_pointer ?? null) === (source?.json_pointer ?? null);
}

function denominatorReasonEvidenceDiagnostics(reason, transition) {
  const diagnostics = [];
  const sources = denominatorRecordSourceReferences(reason, transition);
  let reasonHasValidEvidence = false;
  for (const ref of reason.source_evidence || []) {
    if (!ref || typeof ref !== 'object' || Array.isArray(ref)) continue;
    if (sources.some((source) => carrierMatchesRecordSource(ref, source))) {
      reasonHasValidEvidence = true;
      continue;
    }
    const resolved = evidenceContent(ref);
    let disposition = null;
    try {
      disposition = resolved.error ? null : JSON.parse(resolved.content);
    } catch {
      disposition = null;
    }
    const dedicatedPath = ref.artifact_path?.startsWith(
      'planning/coverage/denominator-dispositions/',
    );
    const schemaValid = dedicatedPath
      && disposition
      && activeSchemaValidators.denominatorDisposition
      && activeSchemaValidators.denominatorDisposition(disposition);
    if (!schemaValid) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_EVIDENCE_SUBJECT_MISMATCH', 'Denominator evidence is neither an exact verified source reference for the affected record nor a dedicated disposition.', ref.evidence_id || reason.record_id));
      diagnostics.push(diagnostic('COV_DENOMINATOR_EVIDENCE_REASON_MISMATCH', 'Unstructured or unrelated denominator evidence cannot prove the declared reason code and membership transition.', ref.evidence_id || reason.record_id));
      continue;
    }
    const subjectMatches = disposition.record_id === reason.record_id
      && disposition.previous_membership === reason.previous_membership
      && disposition.new_membership === reason.new_membership
      && disposition.target_record_id === reason.target_record_id;
    const reasonMatches = disposition.reason_code === reason.reason_code;
    const lineageMatches = (disposition.source_lineage || []).some((lineage) =>
      sources.some((source) => lineageMatchesRecordSource(lineage, source)));
    if (!subjectMatches) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_EVIDENCE_SUBJECT_MISMATCH', 'Denominator disposition does not identify the affected record, memberships, and target relationship.', ref.evidence_id));
    }
    if (!reasonMatches) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_EVIDENCE_REASON_MISMATCH', 'Denominator disposition reason_code does not match the declared record-level reason.', ref.evidence_id));
    }
    if (!lineageMatches) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_EVIDENCE_LINEAGE_MISMATCH', 'Denominator disposition lineage does not resolve to the affected record source references.', ref.evidence_id));
    }
    if (subjectMatches && reasonMatches && lineageMatches) {
      reasonHasValidEvidence = true;
    }
  }
  return { diagnostics, valid: reasonHasValidEvidence };
}

function baselineDiagnostics(bundle, derived, repositoryChecks, transition) {
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
  if (!transition.initialBootstrap && transition.hasChange && !change) {
    diagnostics.push(diagnostic('COV_DENOMINATOR_CHANGE_REQUIRED', 'The verified base-to-head denominator transition requires a Coverage Baseline change record.', 'baseline.denominator_change'));
    if ((transition.baseDerived.elementDenominator > transition.headDerived.elementDenominator)
      || (transition.baseDerived.questionDenominator > transition.headDerived.questionDenominator)) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_REDUCTION_UNJUSTIFIED', 'A derived denominator reduction cannot omit record-level reasons.', 'baseline.denominator_change'));
    }
  }
  if (!transition.initialBootstrap && !transition.hasChange && change) {
    diagnostics.push(diagnostic('COV_DENOMINATOR_TRANSITION_MISMATCH', 'denominator_change is present without a verified record or membership transition.', 'baseline.denominator_change'));
  }
  if (change) {
    const expected = {
      previous_baseline_ref: transition.baseBundle?.baseline?.baseline_id
        || bundle.baseline.previous_baseline_ref,
      new_baseline_ref: baseline.baseline_id,
      previous_element_denominator: transition.baseDerived?.elementDenominator,
      new_element_denominator: transition.headDerived.elementDenominator,
      previous_question_denominator: transition.baseDerived?.questionDenominator,
      new_question_denominator: transition.headDerived.questionDenominator,
      previous_element_percent: transition.baseDerived?.elementPercent ?? null,
      new_element_percent: transition.headDerived.elementPercent,
      previous_question_percent: transition.baseDerived?.questionPercent ?? null,
      new_question_percent: transition.headDerived.questionPercent,
    };
    for (const [field, value] of Object.entries(expected)) {
      if (value !== undefined && change[field] !== value) {
        diagnostics.push(diagnostic('COV_DENOMINATOR_TRANSITION_MISMATCH', field + ' disagrees with the verified base-to-head transition.', 'baseline.denominator_change.' + field));
      }
    }
    if (!arraysEqual(change.added_record_ids, transition.addedRecordIds)
      || !arraysEqual(change.removed_record_ids, transition.removedRecordIds)
      || !arraysEqual(change.changed_record_ids, transition.changedRecordIds)) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_TRANSITION_MISMATCH', 'Changed record IDs must equal the verified base-to-head record transition.', 'baseline.denominator_change'));
    }
    const requiredReasonIds = sortedUnique([
      ...transition.addedRecordIds,
      ...transition.removedRecordIds,
      ...transition.changedRecordIds,
    ]);
    const reasons = Array.isArray(change.record_level_reasons)
      ? change.record_level_reasons
      : [];
    const reasonIds = reasons.map((reason) => reason.record_id);
    if (!arraysEqual(reasonIds, requiredReasonIds)
      || reasonIds.length !== new Set(reasonIds).size) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_REASON_MISSING', 'Every changed denominator record requires exactly one source-backed reason.', 'baseline.denominator_change.record_level_reasons'));
    }
    for (const reason of reasons) {
      const shape = expectedReasonShape(reason.record_id, transition);
      if (reason.change_kind !== shape.change_kind
        || reason.previous_membership !== shape.previous_membership
        || reason.new_membership !== shape.new_membership) {
        diagnostics.push(diagnostic('COV_DENOMINATOR_TRANSITION_MISMATCH', 'Record-level reason does not match the derived membership transition.', reason.record_id));
      }
      diagnostics.push(...evidenceRefsDiagnostics(
        reason.source_evidence,
        ['denominator_change'],
        reason.record_id,
        true,
      ));
      const evidence = denominatorReasonEvidenceDiagnostics(reason, transition);
      diagnostics.push(...evidence.diagnostics);
      if (!evidence.valid) {
        diagnostics.push(diagnostic('COV_DENOMINATOR_REDUCTION_UNJUSTIFIED', 'The changed denominator record lacks evidence semantically bound to its source identity and exact disposition reason.', reason.record_id));
      }
      diagnostics.push(...denominatorTargetDiagnostics(reason, transition));
    }
    if (!transition.initialBootstrap) {
      const expectedChain = [transition.baseBundle.baseline.baseline_id, baseline.baseline_id];
      if (JSON.stringify(change.supersession_chain) !== JSON.stringify(expectedChain)) {
        diagnostics.push(diagnostic('COV_DENOMINATOR_TRANSITION_MISMATCH', 'Supersession chain must bind the previous and new baselines.', 'baseline.denominator_change.supersession_chain'));
      }
    }
    const elementReduced = transition.baseDerived
      && transition.headDerived.elementDenominator < transition.baseDerived.elementDenominator;
    const questionReduced = transition.baseDerived
      && transition.headDerived.questionDenominator < transition.baseDerived.questionDenominator;
    const declaredReduction = change.new_element_denominator
      < change.previous_element_denominator
      || change.new_question_denominator < change.previous_question_denominator;
    if (((elementReduced || questionReduced)
      && (reasons.length === 0 || diagnostics.some((item) =>
        ['COV_DENOMINATOR_REASON_MISSING', 'COV_DENOMINATOR_TARGET_INVALID', 'COV_EVIDENCE_REQUIRED', 'COV_EVIDENCE_CARRIER_INVALID', 'COV_DENOMINATOR_EVIDENCE_SUBJECT_MISMATCH', 'COV_DENOMINATOR_EVIDENCE_REASON_MISMATCH', 'COV_DENOMINATOR_EVIDENCE_LINEAGE_MISMATCH', 'COV_DENOMINATOR_REDUCTION_UNJUSTIFIED'].includes(item.code))))
      || (declaredReduction && reasons.length === 0)) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_REDUCTION_UNJUSTIFIED', 'A denominator reduction requires complete record-level reasons, valid targets and typed source evidence.', 'baseline.denominator_change'));
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

function effectiveCoverageAfterDenominatorValidation(rawDerived, transition, diagnostics) {
  const invalidTransition = !transition.initialBootstrap
    && transition.hasChange
    && transition.baseDerived
    && diagnostics.some((item) => DENOMINATOR_TRANSITION_FAILURE_CODES.has(item.code));
  if (!invalidTransition) {
    return { derived: rawDerived, quarantined: false };
  }
  return {
    derived: { ...transition.baseDerived },
    quarantined: true,
  };
}

function semanticDiagnostics(bundle, validationContext = {}) {
  const diagnostics = [];
  const ledgerRecords = bundle.ledger?.records || [];
  const catalogRecords = bundle.catalog?.records || [];
  diagnostics.push(...subjectRegistryDiagnostics(bundle));
  diagnostics.push(...proofProducerRegistryDiagnostics());

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

  const allRecordsById = denominatorRecordMap(bundle);
  for (const record of allRecordsById.values()) {
    const recordId = record.record_id || record.question_id;
    if (record.denominator_membership === 'excluded_duplicate') {
      const target = allRecordsById.get(record.duplicate_of);
      if (!target || record.duplicate_of === recordId
        || EXCLUDED_MEMBERSHIPS.has(target.denominator_membership)) {
        diagnostics.push(diagnostic('COV_DENOMINATOR_TARGET_INVALID', 'excluded_duplicate requires a distinct active duplicate target.', recordId));
      }
    }
    if (record.denominator_membership === 'excluded_superseded') {
      const target = allRecordsById.get(record.superseded_by);
      if (!target || record.superseded_by === recordId
        || EXCLUDED_MEMBERSHIPS.has(target.denominator_membership)) {
        diagnostics.push(diagnostic('COV_DENOMINATOR_TARGET_INVALID', 'excluded_superseded requires a distinct active supersession target.', recordId));
      }
    }
    if (record.denominator_membership === 'not_applicable_with_validated_reason'
      && (record.evidence_state !== 'not_applicable_with_validated_reason'
        || record.resolution_state !== 'not_applicable_with_validated_reason')) {
      diagnostics.push(diagnostic('COV_DENOMINATOR_DISPOSITION_INVALID', 'A not-applicable denominator member must preserve the same evidence and resolution state.', recordId));
    }
  }

  for (const record of ledgerRecords) {
    if (record.resolution_state === 'covered'
      && !elementCovered(record, bundle, validationContext)) {
      diagnostics.push(diagnostic('COV_ELEMENT_OBLIGATION_INCOMPLETE', 'Element cannot be covered while any applicable obligation is incomplete.', record.record_id));
    }
    for (const { group, item } of obligationEntries(record)) {
      const roles = bundle.contract?.evidence_binding?.element_obligation_roles?.[group] || [];
      if (item.status === 'end_to_end_covered') {
        diagnostics.push(...evidenceRefsDiagnostics(
          item.evidence_refs,
          roles,
          record.record_id,
          true,
          item.obligation_id,
          {
            ...validationContext,
            bundle,
            recordKind: 'element',
            elementRecord: record,
            elementId: record.element_id,
            obligationId: item.obligation_id,
            obligationGroup: group,
          },
        ));
      } else {
        diagnostics.push(...evidenceRefsDiagnostics(
          item.evidence_refs,
          roles,
          record.record_id,
          false,
          item.obligation_id,
          {
            ...validationContext,
            bundle,
            recordKind: 'element',
            elementRecord: record,
            elementId: record.element_id,
            obligationId: item.obligation_id,
            obligationGroup: group,
          },
        ));
      }
      if (item.status === 'not_applicable_with_validated_reason'
        && Object.prototype.hasOwnProperty.call(
          item.not_applicable_reason || {},
          'validator_accepted',
        )) {
        diagnostics.push(diagnostic('COV_NOT_APPLICABLE_PRODUCER_ASSERTION_FORBIDDEN', 'Producer-supplied validator_accepted cannot authorize non-applicability.', item.obligation_id));
      }
      if (item.status === 'not_applicable_with_validated_reason'
        && !validNotApplicable(
          item,
          record.record_id,
          item.obligation_id,
          {
            ...validationContext,
            bundle,
            recordKind: 'element',
            elementRecord: record,
            elementId: record.element_id,
            obligationId: item.obligation_id,
            obligationGroup: group,
          },
        )) {
        diagnostics.push(diagnostic('COV_NOT_APPLICABLE_REASON_INVALID', 'Not-applicable obligations require a validator-derived exact disposition.', item.obligation_id));
        diagnostics.push(...evidenceRefsDiagnostics(
          item.not_applicable_reason?.evidence_refs,
          ['not_applicable_evidence'],
          record.record_id,
          true,
          item.obligation_id,
          {
            ...validationContext,
            bundle,
            recordKind: 'element',
            elementRecord: record,
            elementId: record.element_id,
            obligationId: item.obligation_id,
            obligationGroup: group,
            notApplicableReasonCode: item.not_applicable_reason?.reason_code,
          },
        ));
      }
    }
  }

  for (const record of catalogRecords) {
    const chain = record.coverage_chain || {};
    for (const name of CHAIN_NAMES) {
      const link = chain[name];
      const roles = bundle.contract?.evidence_binding?.question_link_roles?.[name] || [];
      if (Array.isArray(link?.evidence_refs)
        && link.evidence_refs.some((ref) => ref && typeof ref === 'object')) {
        diagnostics.push(...evidenceRefsDiagnostics(
          link.evidence_refs,
          roles,
          record.question_id,
          false,
          record.question_id + '#' + name,
          {
            ...validationContext,
            bundle,
            questionRecord: record,
            recordKind: 'question',
            questionId: record.question_id,
            decisionFamilyId: record.decision_family_id,
            linkName: name,
          },
        ));
      }
      if (link?.status === 'not_applicable_with_validated_reason'
        && name === 'coverage_credit') {
        diagnostics.push(diagnostic('COV_CREDIT_NOT_APPLICABLE_FORBIDDEN', 'Coverage credit is validator-generated and cannot be dispositioned as not applicable.', record.question_id + '.' + name));
      }
      if (link?.status === 'not_applicable_with_validated_reason'
        && Object.prototype.hasOwnProperty.call(
          link.not_applicable_reason || {},
          'validator_accepted',
        )) {
        diagnostics.push(diagnostic('COV_NOT_APPLICABLE_PRODUCER_ASSERTION_FORBIDDEN', 'Producer-supplied validator_accepted cannot authorize non-applicability.', record.question_id + '.' + name));
      }
      if (link?.status === 'not_applicable_with_validated_reason'
        && !validNotApplicable(
          link,
          record.question_id,
          record.question_id + '#' + name,
          {
            ...validationContext,
            bundle,
            questionRecord: record,
            recordKind: 'question',
            questionId: record.question_id,
            decisionFamilyId: record.decision_family_id,
            linkName: name,
          },
        )) {
        diagnostics.push(diagnostic('COV_NOT_APPLICABLE_REASON_INVALID', 'Not-applicable chain links require a validator-derived exact disposition.', record.question_id + '.' + name));
        diagnostics.push(...evidenceRefsDiagnostics(
          link.not_applicable_reason?.evidence_refs,
          ['not_applicable_evidence'],
          record.question_id,
          true,
          record.question_id + '#' + name,
          {
            ...validationContext,
            bundle,
            questionRecord: record,
            recordKind: 'question',
            questionId: record.question_id,
            decisionFamilyId: record.decision_family_id,
            linkName: name,
            notApplicableReasonCode: link.not_applicable_reason?.reason_code,
          },
        ));
      }
    }
    if (chain.resolver_rule?.status === 'complete' && (!Array.isArray(chain.resolver_rule.evidence_refs) || chain.resolver_rule.evidence_refs.length === 0)) {
      diagnostics.push(diagnostic('COV_MATRIX_ONLY_RESOLVER_CREDIT', 'A Matrix cannot be counted as active Resolver coverage.', record.question_id));
    }
    const creditClaimed = chain.coverage_credit?.status === 'complete' || record.resolution_state === 'covered';
    if (creditClaimed) {
      for (const name of CHAIN_NAMES) {
        const link = chain[name];
        if (link?.status === 'complete') {
          const roles = bundle.contract?.evidence_binding?.question_link_roles?.[name] || [];
          diagnostics.push(...evidenceRefsDiagnostics(
            link.evidence_refs,
            roles,
            record.question_id,
            true,
            record.question_id + '#' + name,
            {
              ...validationContext,
              bundle,
              questionRecord: record,
              recordKind: 'question',
              questionId: record.question_id,
              decisionFamilyId: record.decision_family_id,
              linkName: name,
            },
          ));
        }
      }
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
      if (!questionCovered(record, bundle, validationContext)) {
        diagnostics.push(diagnostic('COV_QUESTION_CHAIN_INCOMPLETE', 'Coverage credit cannot precede the complete applicable Question chain.', record.question_id));
      }
    }
  }

  if (bundle.debt && bundle.debt.open_item_count !== (bundle.debt.items || []).length) {
    diagnostics.push(diagnostic('COV_DEBT_COUNT_MISMATCH', 'open_item_count must match the debt item array.', PATHS.debt));
  }

  return diagnostics;
}

function coveredObligationIds(bundle) {
  const occurrences = new Map();
  for (const record of bundle?.ledger?.records || []) {
    for (const { group, item } of obligationEntries(record)) {
      if (!occurrences.has(item.obligation_id)) {
        occurrences.set(item.obligation_id, []);
      }
      occurrences.get(item.obligation_id).push(
        obligationCovered(item, group, record, bundle),
      );
    }
  }
  return new Set([...occurrences.entries()]
    .filter(([, states]) => states.length > 0 && states.every(Boolean))
    .map(([id]) => id));
}

function allObligationIds(bundle) {
  return new Set((bundle?.ledger?.records || [])
    .flatMap((record) => allObligations(record))
    .map((item) => item.obligation_id));
}

function familyObligationId(familyId) {
  return 'OB-P0-' + String(familyId).toUpperCase().replace(/[^A-Z0-9]+/g, '_');
}

function closedFamilyIds(bundle) {
  const catalog = bundle?.catalog?.records || [];
  const ledger = bundle?.ledger?.records || [];
  const families = sortedUnique(catalog
    .filter((record) => IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership))
    .map((record) => record.decision_family_id));
  return new Set(families.filter((familyId) => {
    const questions = catalog.filter((record) =>
      IN_SCOPE_MEMBERSHIPS.has(record.denominator_membership)
        && record.decision_family_id === familyId);
    const familyObligations = ledger.flatMap((record) =>
      (record.element_obligations?.applicable_p0_families || [])
        .filter((item) => item.obligation_id === familyObligationId(familyId))
        .map((item) => ({ record, item })));
    return questions.length > 0
      && familyObligations.length > 0
      && questions.every((record) => questionCovered(record, bundle))
      && familyObligations.every(({ record, item }) =>
        obligationCovered(item, 'applicable_p0_families', record, bundle));
  }));
}

function deriveProgressTransition(transition, headBundle) {
  if (transition.initialBootstrap || !transition.baseBundle) return null;
  const baseCovered = coveredObligationIds(transition.baseBundle);
  const headCovered = coveredObligationIds(headBundle);
  const baseFamilies = closedFamilyIds(transition.baseBundle);
  const headFamilies = closedFamilyIds(headBundle);
  const completedObligationIds = [...headCovered]
    .filter((id) => !baseCovered.has(id)).sort();
  const closedFamilies = [...headFamilies]
    .filter((id) => !baseFamilies.has(id)).sort();
  const base = transition.baseDerived;
  const head = transition.headDerived;
  const elementCoverageDelta = base.elementPercent === null || head.elementPercent === null
    ? null
    : Number((head.elementPercent - base.elementPercent).toFixed(2));
  const questionCoverageDelta = base.questionPercent === null || head.questionPercent === null
    ? null
    : Number((head.questionPercent - base.questionPercent).toFixed(2));
  const numeratorGrowth = (head.elementNumerator - base.elementNumerator)
    + (head.questionNumerator - base.questionNumerator);
  return {
    completedObligationIds,
    closedFamilyIds: closedFamilies,
    elementCoverageDelta,
    questionCoverageDelta,
    numeratorGrowth,
    zeroDelta: numeratorGrowth === 0
      && completedObligationIds.length === 0
      && closedFamilies.length === 0,
  };
}

function orderedImpactHistory(impacts) {
  return [...(impacts || [])].sort((left, right) =>
    (left.sequence_number ?? Number.MAX_SAFE_INTEGER)
      - (right.sequence_number ?? Number.MAX_SAFE_INTEGER)
      || String(left.impact_id || '').localeCompare(String(right.impact_id || '')));
}

function impactChronologyDiagnostics(impacts, impactSourcePaths = {}) {
  const diagnostics = [];
  const ordered = orderedImpactHistory(impacts);
  const ids = ordered.map((impact) => impact.impact_id);
  if (ids.length !== new Set(ids).size) {
    diagnostics.push(diagnostic('COV_IMPACT_ID_DUPLICATE', 'Coverage Impact IDs must be unique across append-only history.', PATHS.impactDir));
  }
  const sequenceNumbers = ordered.map((impact) => impact.sequence_number);
  if (sequenceNumbers.length !== new Set(sequenceNumbers).size) {
    diagnostics.push(diagnostic('COV_IMPACT_SEQUENCE_DUPLICATE', 'Coverage Impact sequence_number values must be unique.', PATHS.impactDir));
  }
  for (const [index, impact] of ordered.entries()) {
    const expectedSequence = index + 1;
    if (impact.sequence_number !== expectedSequence) {
      diagnostics.push(diagnostic('COV_IMPACT_SEQUENCE_GAP', 'Coverage Impact sequence_number must form a contiguous history starting at 1.', impact.impact_id));
    }
    const expectedPrevious = index === 0 ? null : ordered[index - 1].impact_id;
    if (impact.previous_impact_id !== expectedPrevious) {
      diagnostics.push(diagnostic('COV_IMPACT_PREDECESSOR_MISMATCH', 'Coverage Impact previous_impact_id must identify the immediately preceding canonical sequence member.', impact.impact_id));
    }
  }
  const predecessorCounts = new Map();
  for (const impact of ordered) {
    if (impact.previous_impact_id === null) continue;
    predecessorCounts.set(
      impact.previous_impact_id,
      (predecessorCounts.get(impact.previous_impact_id) || 0) + 1,
    );
  }
  if ([...predecessorCounts.values()].some((count) => count > 1)) {
    diagnostics.push(diagnostic('COV_IMPACT_HISTORY_FORK', 'Coverage Impact history cannot fork from one predecessor.', PATHS.impactDir));
  }

  const allPathsKnown = ordered.length > 0
    && ordered.every((impact) => typeof impactSourcePaths[impact.impact_id] === 'string');
  if (allPathsKnown) {
    const filenameOrder = [...ordered].sort((left, right) =>
      impactSourcePaths[left.impact_id].localeCompare(impactSourcePaths[right.impact_id]));
    if (filenameOrder.some((impact, index) => impact.impact_id !== ordered[index].impact_id)) {
      diagnostics.push(diagnostic('COV_IMPACT_FILENAME_SEQUENCE_MISMATCH', 'Impact filenames must not disagree with canonical sequence order; filename order never controls execution chronology.', PATHS.impactDir));
    }
  }
  return { diagnostics, ordered };
}

function materialProgressDiagnostics(bundle, derived, transition, currentImpacts) {
  const diagnostics = [];
  const impacts = Array.isArray(bundle.impacts) ? bundle.impacts : [];
  const chronology = impactChronologyDiagnostics(
    impacts,
    bundle.impactSourcePaths || {},
  );
  diagnostics.push(...chronology.diagnostics);
  const progress = deriveProgressTransition(transition, bundle);
  const allIds = allObligationIds(bundle);
  const knownFamilies = new Set((bundle.catalog?.records || [])
    .map((record) => record.decision_family_id));
  for (const impact of currentImpacts) {
    if (impact.bootstrap_exception === true) {
      const validBootstrap = impact.work_package_id === 'DCOV-EXEC-001'
        && impact.work_type === 'foundation_bootstrap'
        && impact.reason === 'introduces_proposed_coverage_measurement_system_pending_external_promotion'
        && impact.coverage_state_before === 'not_measurable'
        && impact.coverage_state_after === 'not_measurable'
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

    if (impact.baseline_before !== transition.baseBundle?.baseline?.baseline_id
      || impact.baseline_after !== bundle.baseline?.baseline_id) {
      diagnostics.push(diagnostic('COV_PROGRESS_BASELINE_MISMATCH', 'Progress claims must bind the verified base and head baselines.', impact.impact_id));
    }
    const claimedIds = impact.completed_obligation_ids || [];
    if (claimedIds.length !== new Set(claimedIds).size) {
      diagnostics.push(diagnostic('COV_PROGRESS_DUPLICATE_OBLIGATION', 'Completed obligation IDs cannot be counted twice.', impact.impact_id));
    }
    if (claimedIds.some((id) => !allIds.has(id))) {
      diagnostics.push(diagnostic('COV_PROGRESS_UNKNOWN_OBLIGATION', 'Completed obligation claim contains an unknown ID.', impact.impact_id));
    }
    if ((impact.closed_family_ids || []).some((id) => !knownFamilies.has(id))) {
      diagnostics.push(diagnostic('COV_PROGRESS_UNKNOWN_FAMILY', 'Closed Family claim contains an unknown Family ID.', impact.impact_id));
    }
    if (!progress) {
      diagnostics.push(diagnostic('COV_PROGRESS_BASELINE_MISMATCH', 'Non-bootstrap progress cannot be derived without verified base artifacts.', impact.impact_id));
    } else {
      const unchanged = claimedIds.filter((id) =>
        allIds.has(id) && !progress.completedObligationIds.includes(id));
      if (unchanged.length > 0
        || !arraysEqual(claimedIds, progress.completedObligationIds)) {
        diagnostics.push(diagnostic('COV_PROGRESS_UNCHANGED_OBLIGATION', 'Completed obligations must transition from incomplete to evidence-bound complete.', impact.impact_id));
      }
      if (!arraysEqual(impact.closed_family_ids, progress.closedFamilyIds)) {
        diagnostics.push(diagnostic('COV_PROGRESS_FAMILY_MISMATCH', 'Closed Families must be derived from all applicable Questions and Element obligations.', impact.impact_id));
      }
      if (impact.element_coverage_delta !== progress.elementCoverageDelta
        || impact.question_coverage_delta !== progress.questionCoverageDelta) {
        diagnostics.push(diagnostic('COV_PROGRESS_DELTA_MISMATCH', 'Coverage deltas must equal the derived base-to-head percentages.', impact.impact_id));
      }
      if (impact.zero_delta !== progress.zeroDelta) {
        diagnostics.push(diagnostic('COV_PROGRESS_ZERO_DELTA_MISMATCH', 'zero_delta must equal the derived numerator and obligation transition.', impact.impact_id));
      }
    }

    if (impact.coverage_sensitive && impact.work_type === 'content_expansion') {
      if (derived.elementDenominatorState === 'validated' && derived.questionDenominatorState === 'validated') {
        const denominator = Math.max(derived.elementDenominator, derived.questionDenominator);
        const minimumItems = Math.max(2, Math.ceil(0.05 * denominator));
        const option1 = progress
          && Math.max(progress.elementCoverageDelta || 0, progress.questionCoverageDelta || 0) >= 5;
        const option2 = progress
          && progress.completedObligationIds.length >= minimumItems;
        const option3 = progress
          && progress.closedFamilyIds.length >= 1
          && progress.numeratorGrowth > 0;
        if (!option1 && !option2 && !option3) {
          diagnostics.push(diagnostic('COV_MATERIAL_PROGRESS_INSUFFICIENT', 'Content expansion does not satisfy any measurement-active progress option.', impact.impact_id));
        }
      } else {
        const boundedSet = progress && progress.completedObligationIds.length >= 2;
        const closedSlice = progress && progress.closedFamilyIds.length >= 1;
        if (!boundedSet || !closedSlice) {
          diagnostics.push(diagnostic('COV_MATERIAL_PROGRESS_INSUFFICIENT', 'During policy_active, content expansion must complete bounded obligations and close one real Family slice.', impact.impact_id));
        }
      }
    }

    if ((progress?.zeroDelta ?? impact.zero_delta) === true) {
      const validZeroDelta = impact.work_type === 'blocking_defect'
        && impact.blocking_defect
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      if (!validZeroDelta) {
        diagnostics.push(diagnostic('COV_ZERO_DELTA_NOT_BLOCKING_DEFECT', 'Zero-delta coverage-sensitive work is limited to a blocking defect with a named next content package.', impact.impact_id));
      }
    }
  }

  const sensitive = chronology.ordered.filter((impact) => impact.coverage_sensitive);
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
    evidence_binding: {
      carrier_kind: contract.evidence_binding.carrier_kind,
      head_binding_modes: contract.evidence_binding.head_binding_modes,
      semantic_subject_binding_required: contract.evidence_binding.semantic_subject_binding_required,
      js_symbol_subject_registry: contract.evidence_binding.js_symbol_subject_registry,
      proof_receipt_schemas: contract.evidence_binding.proof_receipt_schemas,
      not_applicable_disposition: contract.evidence_binding.not_applicable_disposition,
      proof_provenance: contract.evidence_binding.proof_provenance,
      coverage_credit_derivation: contract.evidence_binding.coverage_credit_derivation,
      generic_fixture_or_document_proof_allowed: contract.evidence_binding.generic_fixture_or_document_proof_allowed,
    },
    denominator_transition: {
      mode: 'verified_base_head_diff_with_typed_record_reasons',
      semantic_reason_evidence_required: contract.denominator_integrity.reason_evidence_must_match_affected_record_source_or_disposition,
      disposition_schema: contract.denominator_integrity.disposition_schema,
      invalid_change_effective_coverage: contract.denominator_integrity.invalid_change_effective_coverage,
    },
    coverage_impact_binding: {
      current_pr: 'one_new_runtime_head_bound_record_per_sensitive_pr',
      history_ordering: contract.coverage_impact_binding.history_ordering,
    },
    material_progress_rules: {
      option_1: 'coverage_delta_gte_' + contract.material_progress.measurement_active_options.option_1.coverage_delta_gte_percentage_points + '_percentage_points',
      option_2: contract.material_progress.measurement_active_options.option_2.formula,
      option_3: 'complete_p0_family_with_measurable_numerator_growth',
      policy_active: contract.material_progress.policy_active_rule,
      zero_delta: contract.material_progress.zero_delta_rule,
      three_consecutive_zero_delta_fail: contract.material_progress.three_consecutive_zero_delta_fail,
      derived_from_verified_base_head: contract.material_progress.derived_from_verified_base_head,
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
  const recovery = readText('docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md');
  const plan = readText('planning/KERNEL_EXECUTION_PLAN.md');
  const next = readText('planning/NEXT_WORK.md');
  const contract = readJson(PATHS.contract);
  const boundary = contract.promotion_boundary;
  const required = [
    'repository_evidence_capture_complete',
    'official_source_fingerprints_complete',
    'contradiction_review_complete',
    'independent_review_passed',
    'project_owner_governance_approval',
    'planning_memory_synchronized',
    'exact_head_validation_passed',
    'merged_pr_evidence_recorded',
    'post_merge_evidence_closure_accepted',
  ];
  if (!boundary
    || boundary.status !== 'proposal_pending_external_governance_approval'
    || boundary.authority_source !== 'external_project_owner_governance'
    || boundary.target_repository_content_can_approve !== false
    || boundary.merge_or_ci_can_approve !== false
    || boundary.self_authored_closure_can_approve !== false
    || !arraysEqual(boundary.required_predicates, required)) {
    diagnostics.push(diagnostic('COV_EXTERNAL_PROMOTION_BOUNDARY_MISSING', 'Coverage implementation remains ineligible until the complete external governance promotion carrier is verified.', PATHS.contract));
  }
  if (!recovery.includes('parent_authority: approved_recovery_source_of_record')
    || !recovery.includes('CI success')
    || !recovery.includes('do not independently or collectively imply this authority transition')) {
    diagnostics.push(diagnostic('COV_EXTERNAL_PROMOTION_PREDICATE_MISSING', 'The trusted-base promotion predicate is incomplete.', 'docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md'));
  }
  if (!plan.includes('**Status:** proposed')
    || plan.includes('Coverage Execution Program — Active')
    || plan.includes('replaces KROAD-012 through KROAD-018')) {
    diagnostics.push(diagnostic('COV_EXECUTION_PLAN_SELF_PROMOTION_FORBIDDEN', 'The Coverage recovery overlay must remain proposed and non-executable.', 'planning/KERNEL_EXECUTION_PLAN.md'));
  }
  if (!next.includes('KROAD-012')
    || next.includes('superseded_by_coverage_execution_program')
    || !next.includes('blocked_pending_external_governance_approval')) {
    diagnostics.push(diagnostic('COV_ROADMAP_SELF_PROMOTION_FORBIDDEN', 'KROAD-012 must remain next-allowed and the Coverage proposal must remain blocked.', 'planning/NEXT_WORK.md'));
  }
  return { diagnostics, active: 0, historical: 1 };
}

function repositoryWiringDiagnostics() {
  const diagnostics = [];
  const packageJson = readJson(PATHS.package);
  const workflow = readText(PATHS.workflow);
  if (packageJson.scripts?.['validate:coverage'] !== 'node kernel/validator/validate-coverage-guarantee.mjs') {
    diagnostics.push(diagnostic('COV_PACKAGE_SCRIPT_MISSING', 'package.json must expose npm run validate:coverage.', PATHS.package));
  }
  const validateMvkScript = String(packageJson.scripts?.['validate:mvk'] || '');
  if (!validateMvkScript.includes('validate-coverage-guarantee.mjs')
    && !validateMvkScript.includes('npm run validate:coverage')) {
    diagnostics.push(diagnostic('COV_MVK_WIRING_MISSING', 'validate:mvk must include the Coverage Guarantee validator.', PATHS.package));
  }
  if (!workflow.includes('npm run validate:coverage')) {
    diagnostics.push(diagnostic('COV_CI_WIRING_MISSING', 'The existing Validate MVK workflow must call npm run validate:coverage.', PATHS.workflow));
  }
  for (const binding of [
    'COVERAGE_REPOSITORY',
    'COVERAGE_PR_NUMBER',
    'COVERAGE_BASE_SHA',
    'COVERAGE_HEAD_SHA',
  ]) {
    if (!workflow.includes(binding)) {
      diagnostics.push(diagnostic('COV_CI_RUNTIME_BINDING_MISSING', 'CI must bind Coverage Impact validation to ' + binding + '.', PATHS.workflow));
    }
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

function gitValue(args) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return null;
  }
}

function mergeBaseFromGit() {
  return gitValue(['merge-base', 'HEAD', 'origin/main'])
    || gitValue(['rev-parse', 'HEAD^']);
}

function changedPathsFromGit(baseSha) {
  const changed = new Set([
    ...gitLines(['diff', '--name-only', 'HEAD']),
    ...gitLines(['ls-files', '--others', '--exclude-standard']),
  ]);
  for (const path of gitLines(['diff', '--name-only', baseSha + '..HEAD'])) changed.add(path);
  return [...changed].sort();
}

function pathMatchesSensitive(path, patterns) {
  return patterns.some((pattern) => path === pattern || path.startsWith(pattern));
}

function currentImpactRecords(baseBundle, headBundle) {
  const baseIds = new Set((baseBundle?.impacts || []).map((impact) => impact.impact_id));
  return (headBundle.impacts || []).filter((impact) => !baseIds.has(impact.impact_id));
}

function impactRequirementDiagnostics(bundle, changedPaths, currentImpacts, runtimeContext) {
  const diagnostics = [];
  const sensitive = changedPaths
    .filter((path) => pathMatchesSensitive(
      path,
      bundle.contract?.coverage_sensitive_paths || [],
    )).sort();
  if (sensitive.length > 0 && currentImpacts.length === 0) {
    diagnostics.push(diagnostic('COV_IMPACT_RECORD_MISSING', 'Coverage-sensitive changes require a Coverage Impact Record.', sensitive[0]));
    return diagnostics;
  }
  if (sensitive.length > 0 && currentImpacts.length !== 1) {
    diagnostics.push(diagnostic('COV_IMPACT_RECORD_MULTIPLE', 'Exactly one newly added Coverage Impact Record must bind the current coverage-sensitive PR.', PATHS.impactDir));
    return diagnostics;
  }
  if (sensitive.length === 0 || currentImpacts.length === 0) return diagnostics;

  const impact = currentImpacts[0];
  if (impact.repository !== EXPECTED_REPOSITORY
    || (runtimeContext.repository && impact.repository !== runtimeContext.repository)) {
    diagnostics.push(diagnostic('COV_IMPACT_REPOSITORY_MISMATCH', 'Coverage Impact repository does not match the validated checkout.', impact.impact_id));
  }
  if (runtimeContext.pullRequestNumber
    && impact.pull_request !== runtimeContext.pullRequestNumber) {
    diagnostics.push(diagnostic('COV_IMPACT_PR_MISMATCH', 'Coverage Impact PR number does not match the CI pull-request event.', impact.impact_id));
  }
  if (impact.base_sha !== runtimeContext.baseSha
    || (runtimeContext.expectedBaseSha
      && impact.base_sha !== runtimeContext.expectedBaseSha)) {
    diagnostics.push(diagnostic('COV_IMPACT_BASE_MISMATCH', 'Coverage Impact base SHA does not match the verified merge base.', impact.impact_id));
  }
  if (impact.exact_head_sha !== 'derived_at_pr_runtime') {
    diagnostics.push(diagnostic('COV_IMPACT_HEAD_BINDING_INVALID', 'Committed impact records must bind the exact head through Git/CI runtime derivation.', impact.impact_id));
  }
  if (runtimeContext.expectedHeadSha
    && runtimeContext.headSha !== runtimeContext.expectedHeadSha) {
    diagnostics.push(diagnostic('COV_IMPACT_HEAD_MISMATCH', 'Checked-out Git HEAD does not match the CI pull-request head.', impact.impact_id));
  }
  if (impact.work_package_id !== runtimeContext.currentWorkPackage
    || !impact.impact_id.includes(impact.work_package_id.toLowerCase())) {
    diagnostics.push(diagnostic('COV_IMPACT_WORK_PACKAGE_MISMATCH', 'Coverage Impact work package must match repository roadmap memory and impact identity.', impact.impact_id));
  }
  if (!arraysEqual(impact.changed_paths, sensitive)
    || impact.changed_paths.length !== sensitive.length) {
    diagnostics.push(diagnostic('COV_IMPACT_CHANGED_PATHS_MISMATCH', 'Coverage Impact changed_paths must exactly equal the verified sensitive diff.', impact.impact_id));
  }
  return diagnostics;
}

function impactHistoryAppendOnlyDiagnostics() {
  const diagnostics = [];
  const base = mergeBaseFromGit() || 'HEAD^';
  const lines = [
    ...gitLines(['diff', '--name-status', base, '--', PATHS.impactDir]),
    ...gitLines(['ls-files', '--others', '--exclude-standard', PATHS.impactDir])
      .map((path) => 'A\t' + path),
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

function loadImpactSourcePaths() {
  if (!existsSync(join(ROOT, PATHS.impactDir))) return {};
  return Object.fromEntries(readdirSync(join(ROOT, PATHS.impactDir))
    .filter((name) => name.endsWith('.json'))
    .sort()
    .map((name) => {
      const path = PATHS.impactDir + '/' + name;
      return [readJson(path).impact_id, path];
    }));
}

function readJsonAtCommit(commit, path) {
  try {
    return JSON.parse(execFileSync(
      'git',
      ['show', commit + ':' + path],
      { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ));
  } catch {
    return null;
  }
}

function loadImpactRecordsAtCommit(commit) {
  return gitLines(['ls-tree', '-r', '--name-only', commit, '--', PATHS.impactDir])
    .filter((path) => path.endsWith('.json'))
    .sort()
    .map((path) => readJsonAtCommit(commit, path))
    .filter(Boolean);
}

function loadImpactSourcePathsAtCommit(commit) {
  return Object.fromEntries(gitLines(['ls-tree', '-r', '--name-only', commit, '--', PATHS.impactDir])
    .filter((path) => path.endsWith('.json'))
    .sort()
    .map((path) => [readJsonAtCommit(commit, path)?.impact_id, path])
    .filter(([impactId]) => typeof impactId === 'string'));
}

function loadBundleAtCommit(commit) {
  if (!commit) return null;
  return {
    contract: readJsonAtCommit(commit, PATHS.contract),
    ledger: readJsonAtCommit(commit, PATHS.ledger),
    catalog: readJsonAtCommit(commit, PATHS.catalog),
    baseline: readJsonAtCommit(commit, PATHS.baseline),
    debt: readJsonAtCommit(commit, PATHS.debt),
    impacts: loadImpactRecordsAtCommit(commit),
    impactSourcePaths: loadImpactSourcePathsAtCommit(commit),
  };
}

function loadCanonicalBundle() {
  return {
    contract: readJson(PATHS.contract),
    ledger: readJson(PATHS.ledger),
    catalog: readJson(PATHS.catalog),
    baseline: readJson(PATHS.baseline),
    debt: readJson(PATHS.debt),
    impacts: loadImpactRecords(),
    impactSourcePaths: loadImpactSourcePaths(),
  };
}

function currentWorkPackageFromRoadmap() {
  const match = readText('planning/NEXT_WORK.md')
    .match(/Current PR[\s\S]*?DCOV-EXEC-[0-9]{3}/);
  return match?.[0].match(/DCOV-EXEC-[0-9]{3}/)?.[0] || null;
}

function runtimeContextFromGit(overrides = {}) {
  const baseSha = overrides.baseSha
    || process.env.COVERAGE_BASE_SHA
    || mergeBaseFromGit();
  const headSha = overrides.headSha || gitValue(['rev-parse', 'HEAD']);
  const headCommittedAt = overrides.headCommittedAt
    || gitValue(['show', '-s', '--format=%cI', headSha]);
  const environmentPr = Number.parseInt(process.env.COVERAGE_PR_NUMBER || '', 10);
  return {
    repository: overrides.repository
      || process.env.COVERAGE_REPOSITORY
      || EXPECTED_REPOSITORY,
    pullRequestNumber: overrides.pullRequestNumber
      || (Number.isInteger(environmentPr) ? environmentPr : null),
    baseSha,
    headSha,
    headCommittedAt,
    expectedBaseSha: overrides.expectedBaseSha
      || process.env.COVERAGE_BASE_SHA
      || null,
    expectedHeadSha: overrides.expectedHeadSha
      || process.env.COVERAGE_HEAD_SHA
      || null,
    currentWorkPackage: overrides.currentWorkPackage
      || currentWorkPackageFromRoadmap(),
  };
}

function validateBundle(bundle, options) {
  const repositoryChecks = options.repositoryChecks === true;
  const diagnostics = [];
  const runtimeContext = options.runtimeContext || runtimeContextFromGit();
  const validationContext = { runtimeContext };
  const transition = deriveDenominatorTransition(
    options.baseBundle || null,
    bundle,
    validationContext,
  );
  const currentImpacts = currentImpactRecords(options.baseBundle || null, bundle);
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

  diagnostics.push(...semanticDiagnostics(bundle, validationContext));
  diagnostics.push(...sourceDiagnostics(bundle.ledger?.records || [], repositoryChecks));
  diagnostics.push(...sourceDiagnostics(bundle.catalog?.records || [], repositoryChecks));

  const rawDerived = deriveCoverage(bundle, validationContext);
  const denominatorDiagnostics = baselineDiagnostics(
    bundle,
    rawDerived,
    repositoryChecks,
    transition,
  );
  diagnostics.push(...denominatorDiagnostics);
  const effectiveCoverage = effectiveCoverageAfterDenominatorValidation(
    rawDerived,
    transition,
    diagnostics,
  );
  const derived = effectiveCoverage.derived;
  if (effectiveCoverage.quarantined) {
    diagnostics.push(diagnostic(
      'COV_DENOMINATOR_CHANGE_QUARANTINED',
      'An invalid denominator transition cannot alter effective coverage metrics; the verified base metrics remain authoritative.',
      'baseline.denominator_change',
    ));
  }
  diagnostics.push(...materialProgressDiagnostics(
    bundle,
    derived,
    transition,
    currentImpacts,
  ));

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

  const orderedImpacts = orderedImpactHistory(bundle.impacts || []);
  const latestImpact = orderedImpacts.length > 0
    ? orderedImpacts[orderedImpacts.length - 1]
    : null;
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
    diagnostics.push(...impactHistoryAppendOnlyDiagnostics());
  }
  diagnostics.push(...impactRequirementDiagnostics(
    bundle,
    options.changedPaths || [],
    currentImpacts,
    runtimeContext,
  ));

  return {
    diagnostics: dedupeDiagnostics(diagnostics),
    derived,
    transition,
    currentImpacts,
  };
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
    activeFixtureArtifacts = null;
    activeFixtureRuntimeContext = null;
    try {
      fixture = readJson(path);
      const mutated = applyMutations(canonical, fixture.scenario?.mutations || []);
      const baseBundle = fixture.scenario?.base_bundle === 'canonical_coverage_bundle'
        ? applyMutations(canonical, fixture.scenario?.base_mutations || [])
        : null;
      const runtimeContext = runtimeContextFromGit({
        ...(fixture.scenario?.runtime_context || {}),
        currentWorkPackage: fixture.scenario?.current_work_package
          || currentWorkPackageFromRoadmap(),
      });
      activeFixtureArtifacts = new Map(Object.entries(
        fixture.scenario?.repository_artifacts || {},
      ));
      activeFixtureRuntimeContext = runtimeContext;
      const validation = validateBundle(mutated, {
        repositoryChecks: false,
        schemaSetup,
        baseBundle,
        runtimeContext,
        changedPaths: fixture.scenario?.changed_paths || [],
        requestedState: fixture.scenario?.requested_state || null,
        claims: fixture.scenario?.claims || [],
      });
      activeFixtureArtifacts = null;
      activeFixtureRuntimeContext = null;
      for (const [field, value] of Object.entries(fixture.expected_derived || {})) {
        if (validation.derived[field] !== value) {
          validation.diagnostics.push(diagnostic(
            'COV_FIXTURE_DERIVED_MISMATCH',
            field + ' expected ' + JSON.stringify(value)
              + ', observed ' + JSON.stringify(validation.derived[field]) + '.',
            path,
          ));
        }
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
      activeFixtureArtifacts = null;
      activeFixtureRuntimeContext = null;
      const observedCode = error instanceof FixtureMutationError
        ? error.code
        : 'COV_FIXTURE_EXECUTION_FAILED';
      const expected = fixture?.expected_diagnostic_codes || [];
      const kind = fixture?.fixture_kind || 'unknown';
      const passed = kind !== 'valid'
        && expected.length > 0
        && expected.includes(observedCode);
      if (!passed) failed = true;
      results.push({
        path,
        kind,
        passed,
        expected,
        observed: [observedCode],
        missing: expected.filter((code) => code !== observedCode),
        error: error.message,
      });
    }
  }
  return { results, failed };
}

function deriveState(bundle, mainDiagnostics, fixturesPassed, runtimeContext = runtimeContextFromGit()) {
  const derived = deriveCoverage(bundle, { runtimeContext });
  const structuralCodes = new Set(mainDiagnostics.map((item) => item.code));
  const proposalValidated = mainDiagnostics.length === 0 && fixturesPassed;
  const policyActive = proposalValidated
    && bundle.contract?.promotion_boundary?.status === 'approved_external_governance_authority';
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
    current_state: thresholdEnforced ? 'threshold_enforced'
      : measurementActive ? 'measurement_active'
        : policyActive ? 'policy_active'
          : proposalValidated
            && bundle.contract?.promotion_boundary?.status === 'proposal_pending_external_governance_approval'
            ? 'not_measurable_pending_external_promotion'
            : 'inactive',
  };
}

const schemaSetup = buildSchemaValidators();
activeSchemaValidators = schemaSetup.validators;
let canonical;
try {
  canonical = loadCanonicalBundle();
} catch (error) {
  console.error('Coverage Guarantee validation failed to load canonical artifacts: ' + error.message);
  process.exit(1);
}

const runtimeContext = runtimeContextFromGit();
const baseBundle = loadBundleAtCommit(runtimeContext.baseSha);
const changedPaths = changedPathsFromGit(runtimeContext.baseSha);
const main = validateBundle(canonical, {
  repositoryChecks: true,
  schemaSetup,
  baseBundle,
  runtimeContext,
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

const state = deriveState(
  canonical,
  main.diagnostics,
  !fixtures.failed && fixtures.results.length > 0,
  runtimeContext,
);
const exactHead = runtimeContext.headSha || 'unavailable';

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
  transition: {
    base_sha: runtimeContext.baseSha,
    exact_head_sha: exactHead,
    repository: runtimeContext.repository,
    pull_request: runtimeContext.pullRequestNumber,
    current_work_package: runtimeContext.currentWorkPackage,
    initial_bootstrap: main.transition.initialBootstrap,
    added_record_ids: main.transition.addedRecordIds,
    removed_record_ids: main.transition.removedRecordIds,
    changed_record_ids: main.transition.changedRecordIds,
    current_impact_ids: main.currentImpacts.map((impact) => impact.impact_id),
  },
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
