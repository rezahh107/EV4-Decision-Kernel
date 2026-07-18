#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import { parseDocument } from 'yaml';
import {
  analyzeWorkflowYaml,
  classifyDependencyChange,
  permissionExpansions,
  scopeRevision,
} from '../kernel/validator/validate-aigov-governance.mjs';
import { recoveryProgramDiagnostics } from '../kernel/validator/validate-recovery-execution-program.mjs';
import {
  RECOVERY_AUTHORITATIVE_WORKFLOWS,
  analyzeRecoveryWorkflowSource,
} from './lib/aigov-ci-descriptor.mjs';

const ROOT = process.cwd();
const PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4';
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const BASE_SHA = '435add8ee3f3274f781b6e391f11e3262e380c4e';
const SCOPE_PATH = 'planning/governance/scopes/aigov-owner-policy-recovery-activation.scope.json';
const POLICY_PATH = 'kernel/decision-governance/aigov-repository-policy.v1.json';
const POLICY_SCHEMA_PATH = 'kernel/schemas/aigov-repository-policy.v1.schema.json';
const diagnostics = [];
const fail = (code, message, source = 'repository') => diagnostics.push({ code, message, source });
const read = (relativePath) => readFileSync(path.join(ROOT, relativePath), 'utf8');
const readJson = (relativePath) => JSON.parse(read(relativePath));
const git = (args) => {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }).trim();
  } catch {
    return '';
  }
};

function parseWorkflowObject(text, source) {
  if (typeof text !== 'string') return null;
  const document = parseDocument(text, { prettyErrors: false, strict: true, uniqueKeys: true });
  if (document.errors.length > 0) return null;
  return document.toJS({ mapAsMap: false });
}

function jobIsStaticallyDisabled(job) {
  if (job?.if === false) return true;
  const condition = String(job?.if ?? '').replaceAll(/\s+/g, '').toLowerCase();
  return condition === 'false' || condition === '${{false}}';
}

function permissionsAreReadOnly(value) {
  if (value === 'read-all') return true;
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const levels = Object.values(value);
  return levels.length > 0 && levels.every((level) => level === 'read' || level === 'none');
}

export function ownerPolicyWorkflowDiagnosticAllowed(
  item,
  { source, currentText, baseText },
) {
  const current = parseWorkflowObject(currentText, source);
  const base = parseWorkflowObject(baseText, `${source}@base`);

  if (item.code === 'AIGOV_SECRET_ACCESS_FORBIDDEN') {
    const expected = Object.values(RECOVERY_AUTHORITATIVE_WORKFLOWS)
      .find((candidate) => candidate.path === source);
    const expectedMessage = expected
      ? `Workflow accesses a credential at jobs.${expected.jobKey}.env.RECOVERY_GITHUB_TOKEN.`
      : null;
    return Boolean(expected
      && item.message === expectedMessage
      && analyzeRecoveryWorkflowSource(Buffer.from(currentText), expected).length === 0);
  }

  if (item.code === 'AIGOV_LOCAL_SCRIPT_UNRESOLVED' && current) {
    const jobs = Object.values(current.jobs || {});
    if (jobs.length > 0 && jobs.every(jobIsStaticallyDisabled)) return true;
  }

  if (item.code === 'AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN'
    && current
    && base
    && item.message.includes('jobs.coverage-diagnostics')) {
    const currentJob = current.jobs?.['coverage-diagnostics'];
    const currentPermissions = currentJob?.permissions ?? current.permissions;
    const basePermissions = base.permissions;
    return currentJob?.permissions != null
      && permissionsAreReadOnly(currentPermissions)
      && permissionsAreReadOnly(basePermissions)
      && permissionExpansions(basePermissions, currentPermissions).length === 0;
  }

  return false;
}

function validatePolicy() {
  const schema = readJson(POLICY_SCHEMA_PATH);
  const policy = readJson(POLICY_PATH);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  const validate = ajv.compile(schema);
  if (!validate(policy)) {
    for (const error of validate.errors || []) {
      fail(
        'AIGOV_OWNER_POLICY_SCHEMA_INVALID',
        `${error.instancePath || '/'} ${error.message}`,
        POLICY_PATH,
      );
    }
  }
  const authority = policy.authority || {};
  const sequence = policy.sequence?.ordered_events || [];
  if (policy.plan?.plan_id !== PLAN_ID
    || policy.plan?.audit_base_sha !== BASE_SHA
    || policy.capability_lifecycle?.current_state !== 'completed') {
    fail(
      'AIGOV_OWNER_POLICY_PLAN_IDENTITY_INVALID',
      'Active V4 owner-policy identity is incomplete.',
      POLICY_PATH,
    );
  }
  if (authority.merge_authority !== 'owner_only' || authority.auto_merge !== 'forbidden') {
    fail(
      'AIGOV_OWNER_MERGE_BOUNDARY_INVALID',
      'Owner-only Merge or auto-merge prohibition changed.',
      POLICY_PATH,
    );
  }
  if (authority.independent_review_required !== false
    || authority.independent_exact_head_review !== 'optional_advisory'
    || authority.missing_independent_review_is_blocking !== false
    || authority.stale_independent_review_is_blocking !== false
    || authority.review_sequence_is_blocking !== false
    || authority.review_provenance_is_blocking !== false) {
    fail(
      'AIGOV_INDEPENDENT_REVIEW_POLICY_INVALID',
      'Independent review is not optional advisory.',
      POLICY_PATH,
    );
  }
  if (sequence.includes('independent_review_green')
    || sequence.includes('pending_independent_review')) {
    fail(
      'AIGOV_REVIEW_GATE_STILL_ACTIVE',
      'Active sequence still contains mandatory review.',
      POLICY_PATH,
    );
  }
  for (const required of ['exact_head_validated', 'owner_merge', 'exact_main_verified']) {
    if (!sequence.includes(required)) {
      fail('AIGOV_REMAINING_GATE_MISSING', `Required event missing: ${required}`, POLICY_PATH);
    }
  }
  return policy;
}

function validateState() {
  const next = read('planning/NEXT_WORK.md');
  const protocol = read('docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md');
  const decision = read('planning/decisions/AIGOV_INDEPENDENT_REVIEW_POLICY_CHANGE.md');
  const adoption = read('planning/decisions/AIGOV_ADOPTION_DECISION.md');
  const closure = read('planning/reviews/AIGOV_V4_BATCH_B_POST_MERGE_CLOSURE.md');
  const activation = read('planning/reviews/RECOVERY_PROGRAM_ACTIVATION.md');
  const statusTokens = [
    'repository_adoption_status: complete',
    'status: merged_and_post_merge_verified',
    'merge_commit_sha: 435add8ee3f3274f781b6e391f11e3262e380c4e',
    'required: false',
    'status: not_required_by_owner_policy',
    'program_status: active',
    'KREC-001_through_009: active',
    'coverage_promotion_effect: none',
    'product_effect: none',
    'kroad_supersession_effect: none',
  ];
  for (const token of statusTokens) {
    if (!next.includes(token)) {
      fail(
        'AIGOV_STATUS_MEMORY_INCOMPLETE',
        `Missing status token: ${token}`,
        'planning/NEXT_WORK.md',
      );
    }
  }
  if (!decision.includes('decision_status: active')
    || !decision.includes('mandatory_independent_review_removed: true')
    || !decision.includes('effective_scope: repository_wide')
    || !decision.includes('historical_review_fabrication: forbidden')) {
    fail(
      'AIGOV_OWNER_POLICY_DECISION_INCOMPLETE',
      'Owner policy decision record is incomplete.',
      'planning/decisions/AIGOV_INDEPENDENT_REVIEW_POLICY_CHANGE.md',
    );
  }
  if (!protocol.includes('independent_pre_merge_review_required: false')
    || !protocol.includes('optional_advisory')
    || !protocol.includes('method-aware')
    || !protocol.includes('current-main validation')) {
    fail(
      'AIGOV_PROTOCOL_INCOMPLETE',
      'Active closure protocol is incomplete.',
      'docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md',
    );
  }
  if (!adoption.includes('repository_adoption_status: complete')
    || !adoption.includes('independent_review_required: false')) {
    fail(
      'AIGOV_ADOPTION_DECISION_STALE',
      'Adoption decision is stale.',
      'planning/decisions/AIGOV_ADOPTION_DECISION.md',
    );
  }
  if (!closure.includes('435add8ee3f3274f781b6e391f11e3262e380c4e')
    || !closure.includes('not_required_by_owner_policy')) {
    fail(
      'AIGOV_POST_MERGE_CLOSURE_RECORD_INCOMPLETE',
      'Post-Merge closure record is incomplete.',
      'planning/reviews/AIGOV_V4_BATCH_B_POST_MERGE_CLOSURE.md',
    );
  }
  if (!activation.includes('program_status: active')
    || !activation.includes('KREC-001_through_009')) {
    fail(
      'RECOVERY_ACTIVATION_RECORD_INCOMPLETE',
      'Recovery activation record is incomplete.',
      'planning/reviews/RECOVERY_PROGRAM_ACTIVATION.md',
    );
  }
  const activeProduction = [
    'tools/lib/aigov-v3-closure.mjs',
    'tools/verify-aigov-v3-exact-main.mjs',
    '.github/workflows/finalize-aigov-batch-b.yml',
    '.github/workflows/validate-rereview-sequence.yml',
  ];
  for (const file of activeProduction) {
    const text = read(file);
    for (const forbidden of [
      'AIGOV_BATCH_B_REVIEW_REQUIRED',
      'AIGOV_BATCH_B_REVIEW_STALE',
      'AIGOV_BATCH_B_REVIEW_PROVENANCE_UNVERIFIED',
      'AIGOV_BATCH_B_REVIEW_SEQUENCE_INVALID',
    ]) {
      if (text.includes(forbidden)) {
        fail(
          'AIGOV_REVIEW_GATE_STILL_ACTIVE',
          `Blocking diagnostic remains: ${forbidden}`,
          file,
        );
      }
    }
  }
}

function validateRecovery() {
  const program = readJson('planning/recovery/recovery-execution-program.v1.json');
  const observed = recoveryProgramDiagnostics(program);
  for (const code of observed) {
    fail(
      code,
      'Active Recovery Program failed production lifecycle validation.',
      'planning/recovery/recovery-execution-program.v1.json',
    );
  }
  if (program.program_status !== 'active'
    || program.task_activation_effect !== 'one_or_more_active'
    || program.tasks?.length !== 9
    || program.tasks.some((task) => task.status !== 'active'
      || task.implementation_authorized !== true
      || task.coverage_credit !== false
      || task.readiness_claim !== false)) {
    fail(
      'RECOVERY_ACTIVATION_STATE_INVALID',
      'All nine KREC tasks must be active and authorized without credit claims.',
      'planning/recovery/recovery-execution-program.v1.json',
    );
  }
}

function validateScopeAndWorkflows(scope) {
  if (scope.schema_version !== 'aigov-scope-manifest.v1'
    || scope.plan_id !== PLAN_ID
    || scope.batch_id !== 'BATCH_B'
    || scope.repository !== REPOSITORY
    || scope.base_sha !== BASE_SHA
    || scope.head_binding !== 'derived_at_runtime') {
    fail('AIGOV_SCOPE_IDENTITY_MISMATCH', 'Activation scope identity is invalid.', SCOPE_PATH);
  }
  const derived = scopeRevision(scope);
  if (scope.scope_revision !== derived) {
    fail('AIGOV_SCOPE_REVISION_MISMATCH', `Expected ${derived}`, SCOPE_PATH);
  }
  const activationChange = process.env.COVERAGE_BASE_SHA === BASE_SHA;
  if (activationChange) {
    const changed = git(['diff', '--name-only', `${BASE_SHA}..HEAD`])
      .split('\n')
      .filter(Boolean)
      .sort();
    const declared = [...(scope.committed || [])].sort();
    if (JSON.stringify(changed) !== JSON.stringify(declared)) {
      fail(
        'AIGOV_SCOPE_DISCLOSURE_MISMATCH',
        `observed=${JSON.stringify(changed)}`,
        SCOPE_PATH,
      );
    }
    const deleted = git(['diff', '--name-only', '--diff-filter=D', `${BASE_SHA}..HEAD`])
      .split('\n')
      .filter(Boolean);
    if (deleted.length) {
      fail('AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN', deleted.join(', '), 'git_diff');
    }
  }
  const readRepositoryFile = (relativePath) => {
    const normalized = path.posix.normalize(relativePath.replace(/^\.\//, ''));
    const absolute = path.join(ROOT, normalized);
    return normalized.startsWith('../')
      || path.posix.isAbsolute(normalized)
      || !existsSync(absolute)
      ? null
      : readFileSync(absolute, 'utf8');
  };
  const workflowDir = path.join(ROOT, '.github/workflows');
  for (const name of readdirSync(workflowDir).filter((entry) => /\.ya?ml$/.test(entry)).sort()) {
    const source = `.github/workflows/${name}`;
    const current = read(source);
    const base = process.env.COVERAGE_BASE_SHA === BASE_SHA
      ? (git(['show', `${BASE_SHA}:${source}`]) || null)
      : null;
    for (const item of analyzeWorkflowYaml(current, {
      source,
      baseText: base,
      readRepositoryFile,
    })) {
      const readOnlyBuiltinToken = item.code === 'AIGOV_SECRET_ACCESS_FORBIDDEN'
        && source === '.github/workflows/finalize-aigov-batch-b.yml'
        && current.includes('${{ github.token }}')
        && !/permissions:[\s\S]*?\b(?:contents|actions|pull-requests):\s*write\b/.test(current);
      const allowedOwnerPolicyDiagnostic = ownerPolicyWorkflowDiagnosticAllowed(item, {
        source,
        currentText: current,
        baseText: base,
      });
      if (!readOnlyBuiltinToken && !allowedOwnerPolicyDiagnostic) {
        fail(item.code, item.message, item.source || source);
      }
    }
    if (/enable_auto_merge|enablePullRequestAutoMerge|gh\s+pr\s+merge/i.test(current)) {
      fail(
        'AIGOV_AUTO_MERGE_FORBIDDEN',
        'Workflow contains Merge or auto-merge execution.',
        source,
      );
    }
  }
  if (process.env.COVERAGE_BASE_SHA === BASE_SHA) {
    const basePackage = git(['show', `${BASE_SHA}:package.json`]);
    if (!basePackage) {
      fail('AIGOV_BASE_PACKAGE_UNAVAILABLE', 'Base package.json unavailable.', 'package.json');
    } else {
      const mutation = classifyDependencyChange(JSON.parse(basePackage), readJson('package.json'));
      if (mutation.broad) {
        fail('AIGOV_BROAD_DEPENDENCY_UPGRADE_FORBIDDEN', JSON.stringify(mutation), 'package.json');
      }
    }
  }
}

function main() {
  let scope = null;
  try {
    scope = readJson(SCOPE_PATH);
  } catch (error) {
    fail('AIGOV_SCOPE_INVALID', error.message, SCOPE_PATH);
  }
  validatePolicy();
  validateState();
  validateRecovery();
  if (scope) validateScopeAndWorkflows(scope);
  const report = {
    validator: 'validate-aigov-v4-owner-policy',
    plan_id: PLAN_ID,
    repository: REPOSITORY,
    repository_id: REPOSITORY_ID,
    base_sha: BASE_SHA,
    tested_head: git(['rev-parse', 'HEAD']) || 'unknown',
    scope_revision: scope?.scope_revision || null,
    independent_review_required: false,
    independent_review_policy: 'optional_advisory',
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostic_count: diagnostics.length,
    diagnostics,
  };
  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (process.env.AIGOV_V4_REPORT) writeFileSync(process.env.AIGOV_V4_REPORT, output);
  process.stdout.write(output);
  if (diagnostics.length) process.exitCode = 1;
}

const isMain = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main();
