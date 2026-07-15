#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const POLICY_PATH = 'kernel/decision-governance/aigov-repository-policy.v1.json';
const POLICY_SCHEMA_PATH = 'kernel/schemas/aigov-repository-policy.v1.schema.json';
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';
const SCOPE_SCHEMA_PATH = 'kernel/schemas/aigov-scope-manifest.v1.schema.json';
const EVIDENCE_SCHEMA_PATH = 'kernel/schemas/aigov-evidence-manifest.v1.schema.json';
const EVIDENCE_PATH = 'planning/governance/evidence/aigov-v2-batch-a.evidence.json';
const REVIEW_SCHEMA_PATH = 'kernel/schemas/aigov-review-receipt.v1.schema.json';
const FIXTURE_ROOT = 'kernel/fixtures/aigov';
const PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2';
const BASE_SHA = '5ff5d7b20db11af36ab787eb8ac2d1127ea74644';
const EXPECTED_RULES = [
  'AIGOV-START-001',
  'AIGOV-SCOPE-001',
  'AIGOV-SCOPE-DISCLOSURE-001',
  'AIGOV-PROGRESS-001',
  'AIGOV-EVIDENCE-001',
  'AIGOV-INDEPENDENCE-001',
  'AIGOV-STALE-001',
  'AIGOV-MERGE-001',
  'AIGOV-CHANGE-CLASS-001',
  'AIGOV-EVIDENCE-PROPORTIONALITY-001',
  'AIGOV-REPORTING-001',
  'AIGOV-SECURITY-PROFILE-001',
  'AIGOV-HUMAN-001',
  'AIGOV-COACH-001',
];
const REQUIRED_KROADS = ['KROAD-012', 'KROAD-013', 'KROAD-014', 'KROAD-015', 'KROAD-016', 'KROAD-017', 'KROAD-018'];
const FORBIDDEN_SECURITY_CHANGES = new Set([
  'secret_change', 'permission_change', 'ruleset_change', 'branch_protection_change',
  'force_push', 'history_rewrite', 'external_repository_write', 'broad_dependency_upgrade',
  'destructive_deletion', 'auto_merge',
]);
const CLASS_RANK = new Map(['L0', 'L1', 'L2', 'L3', 'L4'].map((value, index) => [value, index]));

const readJson = (relativePath) => JSON.parse(readFileSync(path.join(ROOT, relativePath), 'utf8'));
const diagnostic = (code, message, source = 'repository') => ({ rule_id: code.split('_').slice(0, 2).join('-'), code, message, source });
const uniqueSorted = (values) => [...new Set(values)].sort();

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export function scopeRevision(scope) {
  const projection = structuredClone(scope);
  delete projection.scope_revision;
  return `sha256:${crypto.createHash('sha256').update(JSON.stringify(canonical(projection))).digest('hex')}`;
}

function schemaDiagnostics(validator, value, label) {
  if (validator(value)) return [];
  return (validator.errors || []).map((error) => diagnostic(
    'AIGOV_SCHEMA_INVALID',
    `${label}${error.instancePath || '/'} ${error.message}`,
    label,
  ));
}

export function validateBehaviorCase(testCase, policy) {
  const item = testCase.case || {};
  const diagnostics = [];
  if (!item.preflight_present) diagnostics.push(diagnostic('AIGOV_START_PREFLIGHT_MISSING', 'Repository/session preflight is required.', testCase.fixture_id));
  if (!item.head_identity_matches) diagnostics.push(diagnostic('AIGOV_HEAD_MISMATCH', 'Validated checkout does not match the expected exact head.', testCase.fixture_id));
  if (!item.scope_disclosure_matches) diagnostics.push(diagnostic('AIGOV_SCOPE_DISCLOSURE_MISMATCH', 'Computed scope disclosure does not match declared scope.', testCase.fixture_id));

  const missingDeferred = REQUIRED_KROADS.filter((id) => !(item.deferred_ids || []).includes(id));
  if (missingDeferred.length) diagnostics.push(diagnostic('AIGOV_DEFERRED_ITEM_DELETED', `Deferred items disappeared: ${missingDeferred.join(', ')}.`, testCase.fixture_id));
  if (!item.evidence_manifest_complete) diagnostics.push(diagnostic('AIGOV_EVIDENCE_INCOMPLETE', 'Evidence manifest is missing or incomplete.', testCase.fixture_id));
  if (item.completion?.state === 'completed' && item.completion?.exact_main_verified !== true) {
    diagnostics.push(diagnostic('AIGOV_PREMAIN_COMPLETION_FORBIDDEN', 'Completion cannot be asserted before exact-main verification.', testCase.fixture_id));
  }

  const review = item.review_receipt;
  if (review) {
    if (review.reviewer_identity === review.implementer_identity) diagnostics.push(diagnostic('AIGOV_REVIEW_NOT_INDEPENDENT', 'Reviewer and implementer identities must differ.', testCase.fixture_id));
    if (!review.head_matches) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_HEAD', 'Review receipt is bound to a stale head.', testCase.fixture_id));
    if (!review.scope_revision_matches) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_SCOPE', 'Review receipt is bound to a stale scope revision.', testCase.fixture_id));
  }

  if ((CLASS_RANK.get(item.declared_change_class) ?? -1) < (CLASS_RANK.get(item.required_change_class) ?? 99)) {
    diagnostics.push(diagnostic('AIGOV_CHANGE_CLASS_UNDERSPECIFIED', 'Declared change class is below the deterministic minimum.', testCase.fixture_id));
  }
  if ((item.verification_budget_executed ?? 0) < (item.verification_budget_required ?? 1)) {
    diagnostics.push(diagnostic('AIGOV_VERIFICATION_BUDGET_INSUFFICIENT', 'Executed verification budget is below the required budget.', testCase.fixture_id));
  }
  if ((item.reporting_budget_reported ?? 0) < (item.reporting_budget_required ?? 1) || item.material_failures_omitted) {
    diagnostics.push(diagnostic('AIGOV_REPORTING_OMISSION', 'Reporting budget or material-failure disclosure is incomplete.', testCase.fixture_id));
  }
  if ((item.security_changes || []).some((value) => FORBIDDEN_SECURITY_CHANGES.has(value))) {
    diagnostics.push(diagnostic('AIGOV_SECURITY_PROFILE_VIOLATION', 'Forbidden security or authority mutation requested.', testCase.fixture_id));
  }
  if (item.human_technical_proof) diagnostics.push(diagnostic('AIGOV_HUMAN_TECHNICAL_PROOF_FORBIDDEN', 'Human approval cannot substitute for technical evidence.', testCase.fixture_id));
  if (item.coach_text_as_evidence) diagnostics.push(diagnostic('AIGOV_COACH_EVIDENCE_CONFUSION', 'Coaching text cannot be completion evidence.', testCase.fixture_id));
  if (item.coverage_status !== 'not_measurable_pending_external_promotion') diagnostics.push(diagnostic('AIGOV_COVERAGE_SELF_PROMOTION', 'Target-authored Coverage promotion is forbidden.', testCase.fixture_id));
  if (REQUIRED_KROADS.some((id) => !(item.kroad_ids || []).includes(id))) diagnostics.push(diagnostic('AIGOV_KROAD_PRESERVATION_FAILED', 'KROAD-012 through KROAD-018 must remain preserved.', testCase.fixture_id));

  const expectedOrder = policy.sequence.ordered_events;
  const events = item.events || [];
  let sequenceInvalid = false;
  for (const [eventIndex, event] of events.entries()) {
    const orderIndex = expectedOrder.indexOf(event);
    if (orderIndex < 0) {
      sequenceInvalid = true;
      break;
    }
    const priorEvents = expectedOrder.slice(0, orderIndex);
    if (priorEvents.some((required) => !events.slice(0, eventIndex).includes(required))) {
      sequenceInvalid = true;
      break;
    }
  }
  if (sequenceInvalid) diagnostics.push(diagnostic('AIGOV_SEQUENCE_INVALID', 'Cross-turn governance event order is invalid or skips a predecessor.', testCase.fixture_id));
  return diagnostics;
}

function fixturePaths() {
  const paths = [];
  for (const kind of ['valid', 'invalid', 'adversarial']) {
    const dir = path.join(ROOT, FIXTURE_ROOT, kind);
    for (const name of readdirSync(dir).filter((entry) => entry.endsWith('.json')).sort()) paths.push(`${FIXTURE_ROOT}/${kind}/${name}`);
  }
  return paths;
}

function validateFixtures(policy, selectedCase = null) {
  const diagnostics = [];
  const results = [];
  for (const fixturePath of fixturePaths()) {
    const fixture = readJson(fixturePath);
    if (selectedCase && !fixture.fixture_id.includes(selectedCase) && !fixturePath.includes(selectedCase)) continue;
    const observed = uniqueSorted(validateBehaviorCase(fixture, policy).map((item) => item.code));
    const expected = uniqueSorted(fixture.expected_diagnostics || []);
    const expectedValid = fixture.expected_valid === true;
    const actualValid = observed.length === 0;
    const matches = expectedValid === actualValid && JSON.stringify(observed) === JSON.stringify(expected);
    results.push({ fixture: fixturePath, expected_valid: expectedValid, actual_valid: actualValid, expected_diagnostics: expected, observed_diagnostics: observed, matches });
    if (!matches) diagnostics.push(diagnostic('AIGOV_FIXTURE_EXPECTATION_MISMATCH', `${fixturePath}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(observed)}.`, fixturePath));
  }
  if (selectedCase && results.length === 0) diagnostics.push(diagnostic('AIGOV_FIXTURE_NOT_FOUND', `No fixture matched ${selectedCase}.`, FIXTURE_ROOT));
  return { diagnostics, results };
}

function git(args, options = {}) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], ...options }).trim();
  } catch {
    return '';
  }
}

function workflowSecurityDiagnostics(policy) {
  const diagnostics = [];
  const workflowDir = path.join(ROOT, '.github/workflows');
  for (const name of readdirSync(workflowDir).filter((entry) => /\.ya?ml$/.test(entry)).sort()) {
    const relativePath = `.github/workflows/${name}`;
    const text = readFileSync(path.join(ROOT, relativePath), 'utf8');
    for (const match of text.matchAll(/^\s*uses:\s*([^\s#]+)(?:\s*#.*)?$/gm)) {
      const target = match[1];
      if (target.startsWith('./') || target.startsWith('docker://')) continue;
      if (!/@[0-9a-fA-F]{40}$/.test(target)) diagnostics.push(diagnostic('AIGOV_ACTION_NOT_IMMUTABLY_PINNED', `Workflow action is not pinned by a 40-character SHA: ${target}.`, relativePath));
    }
  }

  const workflowDiff = git(['diff', '--unified=0', BASE_SHA, '--', '.github/workflows']);
  for (const line of workflowDiff.split('\n').filter((value) => /^\+(?!\+\+)/.test(value))) {
    if (/^\+\s*permissions:|^\+\s+(contents|pull-requests|id-token|actions|checks|statuses):\s*(write|read-all|write-all)/.test(line)) {
      diagnostics.push(diagnostic('AIGOV_WORKFLOW_PERMISSION_EXPANSION', `Workflow permission mutation is forbidden: ${line.slice(1).trim()}.`, '.github/workflows'));
    }
    if (/secrets\.|\bsecret\b/i.test(line)) diagnostics.push(diagnostic('AIGOV_SECRET_CHANGE_FORBIDDEN', 'Workflow secret mutation is forbidden.', '.github/workflows'));
  }

  const basePackage = git(['show', `${BASE_SHA}:package.json`]);
  if (basePackage) {
    const baseDependencies = JSON.stringify(JSON.parse(basePackage).dependencies || {});
    const currentDependencies = JSON.stringify(readJson('package.json').dependencies || {});
    if (baseDependencies !== currentDependencies) diagnostics.push(diagnostic('AIGOV_BROAD_DEPENDENCY_UPGRADE_FORBIDDEN', 'Batch A must not change dependency versions.', 'package.json'));
  }
  if (git(['diff', '--name-only', '--diff-filter=D', BASE_SHA]).split('\n').filter(Boolean).length) diagnostics.push(diagnostic('AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN', 'Batch A must not delete repository files.', 'git_diff'));
  for (const value of policy.security_profile.forbidden_changes) {
    if (!FORBIDDEN_SECURITY_CHANGES.has(value) && !['branch_protection_change'].includes(value)) continue;
  }
  return diagnostics;
}

function repositoryStateDiagnostics(policy, scope) {
  const diagnostics = [];
  const nextWork = readFileSync(path.join(ROOT, 'planning/NEXT_WORK.md'), 'utf8');
  const decision = readFileSync(path.join(ROOT, 'planning/decisions/AIGOV_ADOPTION_DECISION.md'), 'utf8');
  const audit = readFileSync(path.join(ROOT, 'planning/reviews/AIGOV_ADOPTION_AUDIT.md'), 'utf8');
  const kroadReview = readFileSync(path.join(ROOT, 'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md'), 'utf8');
  if (!nextWork.includes('Repository adoption status: `blocked_open_enforcement_gaps`')) diagnostics.push(diagnostic('AIGOV_PREMAIN_COMPLETION_FORBIDDEN', 'Repository adoption must remain blocked before Batch A exact-main verification.', 'planning/NEXT_WORK.md'));
  for (const token of [
    'Active batch: `BATCH_A`',
    'AIGOV-ADOPT-000: `merged_pending_batch_a_reconciliation`',
    'AIGOV-ADOPT-001 through AIGOV-ADOPT-007: `in_batch_a_implementation`',
    'AIGOV-ADOPT-008: `blocked_pending_batch_a_exact_main`',
    'Coverage proposal state: `not_measurable_pending_external_promotion`',
  ]) if (!nextWork.includes(token)) diagnostics.push(diagnostic('AIGOV_PROGRESS_STATE_MISMATCH', `Required Batch A status is missing: ${token}.`, 'planning/NEXT_WORK.md'));
  for (const id of REQUIRED_KROADS) if (!nextWork.includes(id)) diagnostics.push(diagnostic('AIGOV_KROAD_PRESERVATION_FAILED', `${id} is absent from current roadmap memory.`, 'planning/NEXT_WORK.md'));
  if (!kroadReview.includes('historical_non_authoritative')) diagnostics.push(diagnostic('AIGOV_KROAD_012R_AUTHORITY_VIOLATION', 'KROAD-012R must remain historical_non_authoritative.', 'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md'));
  if (!decision.includes(`plan_id: ${PLAN_ID}`) || !audit.includes(`plan_id: ${PLAN_ID}`)) diagnostics.push(diagnostic('AIGOV_PLAN_IDENTITY_MISMATCH', 'Decision and audit must bind the frozen V2 plan.', 'planning'));
  if (scope.scope_revision !== scopeRevision(scope)) diagnostics.push(diagnostic('AIGOV_SCOPE_REVISION_MISMATCH', `scope_revision must equal ${scopeRevision(scope)}.`, SCOPE_PATH));
  const policyRules = uniqueSorted(policy.rules.map((item) => item.rule_id));
  if (JSON.stringify(policyRules) !== JSON.stringify(uniqueSorted(EXPECTED_RULES))) diagnostics.push(diagnostic('AIGOV_POLICY_RULE_SET_INCOMPLETE', 'Policy must contain exactly the fourteen required AIGOV rules.', POLICY_PATH));
  if (JSON.stringify(policy.roadmap_preservation.original_kroad_ids) !== JSON.stringify(REQUIRED_KROADS)) diagnostics.push(diagnostic('AIGOV_KROAD_PRESERVATION_FAILED', 'Policy KROAD preservation set is not exact.', POLICY_PATH));
  return diagnostics;
}

function parseArgs(argv) {
  const result = { fixturesOnly: false, selectedCase: null, reviewReceipt: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--fixtures-only') result.fixturesOnly = true;
    else if (argv[index] === '--case') result.selectedCase = argv[++index];
    else if (argv[index] === '--review-receipt') result.reviewReceipt = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const policy = readJson(POLICY_PATH);
  const scope = readJson(SCOPE_PATH);
  const evidence = readJson(EVIDENCE_PATH);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const policyValidator = ajv.compile(readJson(POLICY_SCHEMA_PATH));
  const scopeValidator = ajv.compile(readJson(SCOPE_SCHEMA_PATH));
  const evidenceValidator = ajv.compile(readJson(EVIDENCE_SCHEMA_PATH));
  const reviewValidator = ajv.compile(readJson(REVIEW_SCHEMA_PATH));
  const diagnostics = [
    ...schemaDiagnostics(policyValidator, policy, POLICY_PATH),
    ...schemaDiagnostics(scopeValidator, scope, SCOPE_PATH),
    ...schemaDiagnostics(evidenceValidator, evidence, EVIDENCE_PATH),
  ];
  const fixtureResult = validateFixtures(policy, args.selectedCase);
  diagnostics.push(...fixtureResult.diagnostics);
  if (evidence.scope_revision !== scope.scope_revision) diagnostics.push(diagnostic('AIGOV_EVIDENCE_SCOPE_MISMATCH', 'Evidence manifest and scope manifest revisions must match.', EVIDENCE_PATH));
  if (evidence.completion_receipt.exact_main_verified || evidence.completion_receipt.state !== 'pending_exact_main_verification') diagnostics.push(diagnostic('AIGOV_PREMAIN_COMPLETION_FORBIDDEN', 'Batch A evidence must remain pending exact-main verification on the PR head.', EVIDENCE_PATH));
  if (!args.fixturesOnly) diagnostics.push(...repositoryStateDiagnostics(policy, scope), ...workflowSecurityDiagnostics(policy));
  if (args.reviewReceipt) {
    if (!existsSync(path.join(ROOT, args.reviewReceipt))) diagnostics.push(diagnostic('AIGOV_REVIEW_RECEIPT_MISSING', 'External review receipt was not found.', args.reviewReceipt));
    else {
      const receipt = readJson(args.reviewReceipt);
      diagnostics.push(...schemaDiagnostics(reviewValidator, receipt, args.reviewReceipt));
      if (receipt.reviewer?.identity === receipt.implementer?.identity) diagnostics.push(diagnostic('AIGOV_REVIEW_NOT_INDEPENDENT', 'Reviewer and implementer identities must differ.', args.reviewReceipt));
      if (receipt.scope_revision !== scope.scope_revision) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_SCOPE', 'Review receipt scope revision is stale.', args.reviewReceipt));
      const head = git(['rev-parse', 'HEAD']);
      if (receipt.head_sha !== head) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_HEAD', 'Review receipt head is stale.', args.reviewReceipt));
    }
  }
  const report = {
    validator: 'validate-aigov-governance',
    plan_id: PLAN_ID,
    batch_id: 'BATCH_A',
    tested_head: git(['status', '--porcelain=v1', '--untracked-files=all'])
      ? `worktree_uncommitted_from_${git(['rev-parse', 'HEAD']) || 'unknown'}`
      : (git(['rev-parse', 'HEAD']) || 'unknown'),
    scope_revision: scope.scope_revision,
    fixture_count: fixtureResult.results.length,
    fixture_results: fixtureResult.results,
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostic_count: diagnostics.length,
    diagnostics,
  };
  console.log(JSON.stringify(report, null, 2));
  if (diagnostics.length) process.exitCode = 1;
}

main();
