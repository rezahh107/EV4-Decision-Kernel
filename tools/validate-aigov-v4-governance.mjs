#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeWorkflowYaml,
  classifyDependencyChange,
  scopeRevision,
} from '../kernel/validator/validate-aigov-governance.mjs';

const ROOT = process.cwd();
const PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4';
const PREVIOUS_PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3';
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const BASE_SHA = '86e25a9073df7e257ca7df799de85baf9b3fafb0';
const SCOPE_PATH = 'planning/governance/scopes/aigov-v3-batch-b.scope.json';
const LEGACY_VALIDATOR = 'kernel/validator/validate-aigov-governance.mjs';
const EXPECTED_RUNTIME_PATHS = new Set([
  '?? _external/',
  '?? aigov-v4-batch-a-reconciliation.json',
  '?? aigov-v4-batch-b-scope-disclosure.json',
]);
const diagnostics = [];

const fail = (code, message, source = 'repository') => diagnostics.push({ code, message, source });
const read = (relativePath) => readFileSync(path.join(ROOT, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));
const git = (args) => {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  } catch {
    return '';
  }
};

function validateLegacyContractsAndFixtures() {
  try {
    const stdout = execFileSync('node', [path.join(ROOT, LEGACY_VALIDATOR), '--fixtures-only'], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    const report = JSON.parse(stdout);
    if (report.status !== 'pass') fail('AIGOV_V4_LEGACY_CONTRACT_VALIDATION_FAILED', 'The frozen V2 schemas, evidence template or fixtures did not pass.', LEGACY_VALIDATOR);
    return { status: report.status, fixture_count: report.fixture_count, plan_id: report.plan_id };
  } catch (error) {
    fail('AIGOV_V4_LEGACY_CONTRACT_VALIDATION_FAILED', `Frozen V2 contract validation failed: ${error.message}`, LEGACY_VALIDATOR);
    return { status: 'fail', fixture_count: null, plan_id: null };
  }
}

function validateV4RepositoryState(scope) {
  const nextWork = read('planning/NEXT_WORK.md');
  const decision = read('planning/decisions/AIGOV_ADOPTION_DECISION.md');
  const audit = read('planning/reviews/AIGOV_ADOPTION_AUDIT.md');
  const reconciliation = read('planning/reviews/AIGOV_BATCH_A_V3_POST_MERGE_RECONCILIATION.md');
  const protocol = read('docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md');
  const historical = read('planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md');

  const requiredNextWork = [
    `active_plan: ${PLAN_ID}`,
    `previous_plan: ${PREVIOUS_PLAN_ID}`,
    'repository_adoption_status: pending_batch_b_exact_main_completion',
    'status: exact_main_reconciled_under_v4_squash_equivalence',
    'closure_mode: v4_one_time_squash_equivalence',
    'AIGOV-ADOPT-000_through_007: merged_and_post_merge_reconciled',
    'increment: AIGOV-ADOPT-008',
    'status: implementation_active_pending_exact_head_validation_and_review',
    'status: not_measurable_pending_external_promotion',
    'coverage_promotion_effect: none',
    'product_effect: none',
  ];
  for (const token of requiredNextWork) if (!nextWork.includes(token)) fail('AIGOV_V4_PROGRESS_STATE_MISMATCH', `Required V4 state is missing: ${token}`, 'planning/NEXT_WORK.md');
  if (!nextWork.includes('KROAD-012: next_product_task_blocked_pending_final_aigov_closure')) fail('AIGOV_KROAD_PRESERVATION_FAILED', 'KROAD-012 is not preserved behind final AIGOV closure.', 'planning/NEXT_WORK.md');
  const laterKroadsPreserved = nextWork.includes('KROAD-013_through_018: not_started') || nextWork.includes('`KROAD-013` through `KROAD-018` remain `not_started`');
  if (!laterKroadsPreserved) fail('AIGOV_KROAD_PRESERVATION_FAILED', 'KROAD-013 through KROAD-018 are not preserved as not_started.', 'planning/NEXT_WORK.md');
  if (!nextWork.includes('KROAD-012R: historical_non_authoritative')) fail('AIGOV_KROAD_012R_AUTHORITY_VIOLATION', 'KROAD-012R must remain historical_non_authoritative.', 'planning/NEXT_WORK.md');
  if (/GREEN_MERGE_RECOMMENDED|merge_permitted:\s*true|repository_adoption_status:\s*(?:adopted|complete)/i.test(nextWork)) fail('AIGOV_V4_PREMAIN_COMPLETION_FORBIDDEN', 'Batch B cannot claim Merge authority or final adoption on the PR head.', 'planning/NEXT_WORK.md');

  if (!decision.includes(`plan_id: ${PLAN_ID}`) || !decision.includes(`previous_plan_id: ${PREVIOUS_PLAN_ID}`) || !decision.includes('deterministic_merge_result_equivalence')) fail('AIGOV_V4_PLAN_IDENTITY_MISMATCH', 'The adoption decision is not bound to the approved V4 correction.', 'planning/decisions/AIGOV_ADOPTION_DECISION.md');
  if (!audit.includes(`plan_id: ${PLAN_ID}`) || !audit.includes('record_status: current_v4_audit')) fail('AIGOV_V4_PLAN_IDENTITY_MISMATCH', 'The adoption audit is not bound to V4.', 'planning/reviews/AIGOV_ADOPTION_AUDIT.md');
  if (!reconciliation.includes('status: pass') || !reconciliation.includes('closure_mode: v4_one_time_squash_equivalence') || !reconciliation.includes('historical_independent_green_receipt: not_claimed')) fail('AIGOV_V4_RECONCILIATION_RECORD_INVALID', 'Batch A V4 reconciliation evidence is incomplete.', 'planning/reviews/AIGOV_BATCH_A_V3_POST_MERGE_RECONCILIATION.md');
  if (!protocol.includes(`**Plan:** \`${PLAN_ID}\``) || !protocol.includes('exact_tree_equality') || !protocol.includes('merge_commit:') || !protocol.includes('squash:') || !protocol.includes('rebase:')) fail('AIGOV_V4_PROTOCOL_INCOMPLETE', 'The method-aware exact-main protocol is incomplete.', 'docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md');
  if (!historical.includes('historical_non_authoritative') || !historical.includes('implementation_authority`: `none')) fail('AIGOV_KROAD_012R_AUTHORITY_VIOLATION', 'KROAD-012R gained active authority.', 'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md');

  if (scope.schema_version !== 'aigov-scope-manifest.v1' || scope.plan_id !== PLAN_ID || scope.batch_id !== 'BATCH_B' || scope.repository !== REPOSITORY || scope.base_sha !== BASE_SHA || scope.head_binding !== 'derived_at_runtime') fail('AIGOV_V4_SCOPE_IDENTITY_MISMATCH', 'Batch B scope identity is not exact.', SCOPE_PATH);
  const derivedRevision = scopeRevision(scope);
  if (scope.scope_revision !== derivedRevision) fail('AIGOV_SCOPE_REVISION_MISMATCH', `scope_revision must equal ${derivedRevision}.`, SCOPE_PATH);
  for (const forbidden of ['agent_merge', 'auto_merge', 'coverage_promotion', 'product_implementation', 'krec_task_implementation', 'kroad_012_implementation']) if (!scope.forbidden_changes.includes(forbidden)) fail('AIGOV_V4_SCOPE_BOUNDARY_INCOMPLETE', `Missing forbidden change: ${forbidden}.`, SCOPE_PATH);
}

function validateLiveWorkflowsAndDiff(scope) {
  const workflowDir = path.join(ROOT, '.github/workflows');
  const readRepositoryFile = (relativePath) => {
    const normalized = path.posix.normalize(relativePath.replace(/^\.\//, ''));
    if (normalized.startsWith('../') || path.posix.isAbsolute(normalized)) return null;
    const absolute = path.join(ROOT, normalized);
    return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
  };
  for (const name of readdirSync(workflowDir).filter((entry) => /\.ya?ml$/.test(entry)).sort()) {
    const relativePath = `.github/workflows/${name}`;
    const currentText = read(relativePath);
    const baseText = git(['show', `${BASE_SHA}:${relativePath}`]) || null;
    for (const item of analyzeWorkflowYaml(currentText, { source: relativePath, baseText, readRepositoryFile })) fail(item.code, item.message, item.source || relativePath);
  }

  const basePackage = git(['show', `${BASE_SHA}:package.json`]);
  if (!basePackage) fail('AIGOV_V4_BASE_PACKAGE_UNAVAILABLE', 'The exact V4 base package.json is unavailable.', 'package.json');
  else {
    const dependencyChange = classifyDependencyChange(JSON.parse(basePackage), readJson('package.json'));
    if (dependencyChange.broad) fail('AIGOV_BROAD_DEPENDENCY_UPGRADE_FORBIDDEN', `Broad dependency mutation detected: ${JSON.stringify(dependencyChange)}.`, 'package.json');
  }

  const changedPaths = git(['diff', '--name-only', `${BASE_SHA}..HEAD`]).split('\n').filter(Boolean).sort();
  const declaredPaths = [...scope.committed].sort();
  if (JSON.stringify(changedPaths) !== JSON.stringify(declaredPaths)) fail('AIGOV_SCOPE_DISCLOSURE_MISMATCH', `Changed paths do not equal committed scope. observed=${JSON.stringify(changedPaths)}`, SCOPE_PATH);
  const deleted = git(['diff', '--name-only', '--diff-filter=D', `${BASE_SHA}..HEAD`]).split('\n').filter(Boolean);
  if (deleted.length) fail('AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN', `Batch B must not delete repository files: ${deleted.join(', ')}.`, 'git_diff');
  const unexpectedStatus = git(['status', '--porcelain=v1', '--untracked-files=all']).split('\n').filter(Boolean).filter((line) => !EXPECTED_RUNTIME_PATHS.has(line));
  if (unexpectedStatus.length) fail('AIGOV_V4_WORKTREE_NOT_CLEAN', `Unexpected worktree entries: ${unexpectedStatus.join(', ')}.`, 'git_status');
}

function main() {
  const legacy = validateLegacyContractsAndFixtures();
  let scope = null;
  try {
    scope = readJson(SCOPE_PATH);
  } catch (error) {
    fail('AIGOV_V4_SCOPE_INVALID', `Scope manifest is unreadable: ${error.message}`, SCOPE_PATH);
  }
  if (scope) {
    validateV4RepositoryState(scope);
    validateLiveWorkflowsAndDiff(scope);
  }
  const report = {
    validator: 'validate-aigov-v4-governance',
    plan_id: PLAN_ID,
    batch_id: 'BATCH_B',
    repository: REPOSITORY,
    repository_id: REPOSITORY_ID,
    base_sha: BASE_SHA,
    tested_head: git(['rev-parse', 'HEAD']) || 'unknown',
    scope_revision: scope?.scope_revision || null,
    legacy_contract_validation: legacy,
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostic_count: diagnostics.length,
    diagnostics: diagnostics.map((item) => ({ ...item })),
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (process.env.AIGOV_V4_REPORT) writeFileSync(process.env.AIGOV_V4_REPORT, output);
  process.stdout.write(output);
  if (diagnostics.length) process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main();
