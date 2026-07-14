#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VALIDATOR_DIR = dirname(fileURLToPath(import.meta.url));
const PRF010_VALIDATOR = join(VALIDATOR_DIR, 'validate-coverage-guarantee-prf010.mjs');
const LEGACY_VALIDATOR = join(VALIDATOR_DIR, 'validate-coverage-guarantee-legacy.mjs');
const WORKFLOW_PATH = '.github/workflows/validate-mvk.yml';
const CONTRACT_PATH = 'kernel/decision-governance/coverage-guarantee-contract.v1.json';
const RECOVERY_SPEC_PATH = 'docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md';
const NEXT_WORK_PATH = 'planning/NEXT_WORK.md';
const EXECUTION_PLAN_PATH = 'planning/KERNEL_EXECUTION_PLAN.md';
const MUTATION_FIXTURE_PATH = 'kernel/fixtures/coverage-guarantee/invalid/enforcement-surface-impact-mutations.json';
const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const ISSUER_SHA = '7a21045366bb9ad1ca2f950b8341ebb867dd8a52';
const ISSUER_CALL = `rezahh107/PR-Inspector/.github/workflows/coverage-trust-gate.yml@${ISSUER_SHA}`;
const CHECKOUT_SHA = '11bd71901bbe5b1630ceea73d27597364c9af683';
const PROOF_ROLES = new Set(['runtime_proof', 'consumer_proof', 'coverage_credit']);
const TRUST_ENV_NAMES = [
  'COVERAGE_VALIDATED_AT',
  'COVERAGE_VALIDATION_SOURCE',
  'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS',
];
const CALLER_IDENTITY_KEYS = [
  'target_repository:',
  'target_repository_id:',
  'target_head_sha:',
  'target_base_sha:',
  'pull_request_number:',
  'issuer_workflow_sha:',
  'independent_policy_pr_number:',
];
const EXACT_VALIDATION_COMMAND = [
  'set -euo pipefail',
  'git reset --hard "${COVERAGE_HEAD_SHA}"',
  'git clean -ffdx',
  'test "$(git rev-parse HEAD)" = "${COVERAGE_HEAD_SHA}"',
  'test -z "$(git status --porcelain=v1 --untracked-files=all)"',
  'npm ci',
  'npm run validate:coverage',
].join('\n');
const REQUIRED_PROMOTION_PREDICATES = [
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
const REQUIRED_SENSITIVE_PATHS = [
  '.github/workflows/validate-mvk.yml',
  'package.json',
  'kernel/validator/validate-coverage-guarantee',
];

function read(relativePath) {
  try {
    return readFileSync(join(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
}

function readJson(relativePath) {
  try {
    return JSON.parse(read(relativePath));
  } catch {
    return null;
  }
}

function diagnostic(code, message, path = null) {
  return { code, message, ...(path ? { path } : {}) };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.code}|${item.path || ''}|${item.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function jobBlock(workflow, jobName) {
  const lines = workflow.split(/\r?\n/);
  const start = lines.findIndex((line) => line === `  ${jobName}:`);
  if (start < 0) return '';
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^  [A-Za-z0-9_-]+:\s*$/.test(lines[index])) {
      end = index;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

function markdownSection(text, heading) {
  const lines = text.split(/\r?\n/);
  const start = lines.findIndex((line) => line === heading);
  if (start < 0) return '';
  const level = heading.match(/^#+/)?.[0].length || 1;
  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    const match = lines[index].match(/^(#+)\s/);
    if (match && match[1].length <= level) {
      end = index;
      break;
    }
  }
  return lines.slice(start, end).join('\n');
}

function stepBlocks(job) {
  const lines = job.split(/\r?\n/);
  const starts = [];
  for (let index = 0; index < lines.length; index += 1) {
    if (/^      - name:/.test(lines[index])) starts.push(index);
  }
  return starts.map((start, index) => lines.slice(start, starts[index + 1] ?? lines.length).join('\n'));
}

function normalizeRun(step) {
  const match = step.match(/\n        run: \|\n([\s\S]*)$/);
  if (!match) return '';
  return match[1].split(/\r?\n/)
    .map((line) => line.startsWith('          ') ? line.slice(10) : line)
    .join('\n').trim();
}

function validateTopology(workflow, environment = process.env) {
  const diagnostics = [];
  const external = jobBlock(workflow, 'external-coverage-trust');
  const validation = jobBlock(workflow, 'validate-mvk');
  if (!external.includes(`uses: ${ISSUER_CALL}`)) {
    diagnostics.push(diagnostic('COV_EXTERNAL_TRUST_ROOT_UNPINNED', 'Protected validation must use the active locked v1.10.1 issuer.', WORKFLOW_PATH));
  }
  if (!external || /^    (if|needs|strategy|continue-on-error|with):/m.test(external)) {
    diagnostics.push(diagnostic('COV_EXTERNAL_REQUIRED_JOB_TOPOLOGY_INVALID', 'The external job may not accept inputs or be conditionally bypassed.', WORKFLOW_PATH));
  }
  if (CALLER_IDENTITY_KEYS.some((key) => external.includes(key))) {
    diagnostics.push(diagnostic('COV_EXTERNAL_CALLER_IDENTITY_INPUT_FORBIDDEN', 'Target callers may not select repository, PR, base, head, issuer or one-off identity.', WORKFLOW_PATH));
  }
  if (!external.includes('contents: read') || !external.includes('pull-requests: read') || !external.includes('id-token: write')) {
    diagnostics.push(diagnostic('COV_EXTERNAL_OIDC_PERMISSIONS_MISSING', 'External enforcement requires read-only repository/PR access and OIDC identity.', WORKFLOW_PATH));
  }
  if (!validation.includes('needs: external-coverage-trust')) {
    diagnostics.push(diagnostic('COV_EXTERNAL_VALIDATION_NEEDS_MISSING', 'Protected validation must depend directly on external identity verification.', WORKFLOW_PATH));
  }
  const steps = stepBlocks(validation);
  if (steps.length !== 2) {
    diagnostics.push(diagnostic('COV_EXTERNAL_VALIDATION_STEP_TOPOLOGY_INVALID', 'Protected validation must contain exactly checkout plus one fail-propagating validation step.', WORKFLOW_PATH));
  } else {
    const [checkout, command] = steps;
    if (!checkout.includes(`uses: actions/checkout@${CHECKOUT_SHA}`)
      || !checkout.includes('ref: ${{ needs.external-coverage-trust.outputs.verified_head_sha }}')
      || !checkout.includes('persist-credentials: false')) {
      diagnostics.push(diagnostic('COV_EXTERNAL_VALIDATION_CHECKOUT_MISMATCH', 'Checkout must use the approved immutable action and externally verified head only.', WORKFLOW_PATH));
    }
    const expectedBindings = [
      'COVERAGE_REPOSITORY: ${{ needs.external-coverage-trust.outputs.verified_repository }}',
      'COVERAGE_PR_NUMBER: ${{ needs.external-coverage-trust.outputs.verified_pr_number }}',
      'COVERAGE_BASE_SHA: ${{ needs.external-coverage-trust.outputs.verified_base_sha }}',
      'COVERAGE_HEAD_SHA: ${{ needs.external-coverage-trust.outputs.verified_head_sha }}',
    ];
    if (!command.includes('shell: bash') || expectedBindings.some((binding) => !command.includes(binding))) {
      diagnostics.push(diagnostic('COV_EXTERNAL_VALIDATION_IDENTITY_BINDING_MISSING', 'Protected validation must use only the four authoritative Coverage identity outputs.', WORKFLOW_PATH));
    }
    const envKeys = [...command.matchAll(/^          ([A-Z0-9_]+):/gm)].map((match) => match[1]).sort();
    const expectedKeys = ['COVERAGE_BASE_SHA', 'COVERAGE_HEAD_SHA', 'COVERAGE_PR_NUMBER', 'COVERAGE_REPOSITORY'];
    if (JSON.stringify(envKeys) !== JSON.stringify(expectedKeys) || normalizeRun(command) !== EXACT_VALIDATION_COMMAND) {
      diagnostics.push(diagnostic('COV_EXTERNAL_VALIDATION_COMMAND_TOPOLOGY_INVALID', 'Protected command must reset, clean, verify HEAD/worktree, npm ci and validate:coverage exactly.', WORKFLOW_PATH));
    }
  }
  if (TRUST_ENV_NAMES.some((name) => workflow.includes(name)) || workflow.includes('/bin/date')) {
    diagnostics.push(diagnostic('COV_EXTERNAL_TRUST_ROOT_TARGET_MINT_FORBIDDEN', 'A target workflow may not mint trust timestamps, sources or ingestion attestations.', WORKFLOW_PATH));
  }
  for (const name of TRUST_ENV_NAMES) {
    if (environment[name] !== undefined) {
      diagnostics.push(diagnostic(
        name === 'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS'
          ? 'COV_EXTERNAL_ATTESTATION_UNSIGNED_ENV_FORBIDDEN'
          : 'COV_EXTERNAL_TRUST_ROOT_SELF_ISSUED_ENV_FORBIDDEN',
        'Target-controlled environment values cannot establish external authority.',
        name,
      ));
    }
  }
  return dedupe(diagnostics);
}

function promotionDiagnostics(contract, recoverySpec, nextWork, executionPlan) {
  const diagnostics = [];
  const boundary = contract?.promotion_boundary;
  if (!boundary
    || !['proposal_pending_external_governance_approval', 'approved_external_governance_authority'].includes(boundary.status)
    || boundary.authority_source !== 'external_project_owner_governance'
    || boundary.target_repository_content_can_approve !== false
    || boundary.merge_or_ci_can_approve !== false
    || boundary.self_authored_closure_can_approve !== false
    || JSON.stringify(boundary.required_predicates) !== JSON.stringify(REQUIRED_PROMOTION_PREDICATES)) {
    diagnostics.push(diagnostic('COV_EXTERNAL_PROMOTION_BOUNDARY_MISSING', 'Coverage artifacts must remain proposals until every external promotion predicate is verified.', CONTRACT_PATH));
  }
  if (!['not_measurable_pending_external_promotion', 'policy_active'].includes(contract?.expected_state_after_dcov_exec_001)
    || (contract?.promotion_boundary?.status === 'approved_external_governance_authority'
      && (contract?.promotion_boundary?.parent_authority !== 'approved_recovery_source_of_record'
        || contract?.promotion_boundary?.promotion_status !== 'approved'
        || contract?.promotion_boundary?.repeated_owner_approval_required_for_child_packages !== false))
    || !contract?.state_machine?.eligibility?.policy_active?.requirements?.includes('external_governance_approval_verified')) {
    diagnostics.push(diagnostic('COV_SELF_AUTHORIZED_POLICY_ACTIVATION', 'The target contract may not make its own implementation policy-active.', CONTRACT_PATH));
  }
  const requiredRecoveryText = [
    'parent_authority: approved_recovery_source_of_record',
    'CI success',
    'do not independently or collectively imply this authority transition',
  ];
  if (requiredRecoveryText.some((text) => !recoverySpec.includes(text))
    || recoverySpec.includes('No separate manual promotion step remains')) {
    diagnostics.push(diagnostic('COV_EXTERNAL_PROMOTION_PREDICATE_MISSING', 'The trusted-base promotion predicate must remain explicit and fail closed.', RECOVERY_SPEC_PATH));
  }
  if (!nextWork.includes('KROAD-012')
    || nextWork.includes('superseded_by_coverage_execution_program')
    || false) {
    diagnostics.push(diagnostic('COV_ROADMAP_SELF_PROMOTION_FORBIDDEN', 'Roadmap memory must preserve KROAD-012 alignment and DCOV-EXEC-002 next-task consistency.', NEXT_WORK_PATH));
  }
  const proposalOverlay = markdownSection(
  executionPlan,
  '# Coverage Guarantee Execution Overlay — Active Parent Authority',
);
const proposedProgram = markdownSection(
  executionPlan,
  '## Unified Coverage Execution Program — Parent Approved',
);
if (!proposalOverlay.includes('parent_authority: approved_recovery_source_of_record')
  || !proposedProgram.includes('- **Status:** parent approved.')
  || !proposedProgram.includes('- **Next executable package:** DCOV-EXEC-002.')
  || proposedProgram.includes('superseded_by_coverage_execution_program')) {
  diagnostics.push(diagnostic('COV_EXECUTION_PLAN_SELF_PROMOTION_FORBIDDEN', 'The Coverage overlay must record approved parent authority while preserving KROAD-012 through KROAD-018 dependency alignment.', EXECUTION_PLAN_PATH));
}
  return diagnostics;
}

function attemptedPromotionDiagnostics(candidate) {
  const approved = candidate?.external_project_owner_approval === true
    && candidate?.independent_review_passed === true
    && candidate?.evidence_closure_accepted === true;
  return approved ? [] : [diagnostic('COV_EXTERNAL_PROMOTION_AUTHORITY_REQUIRED', 'Merge, CI, target declarations and self-authored closure cannot approve recovery implementation.')];
}

function pathMatchesSensitive(path, patterns) {
  return patterns.some((pattern) => path === pattern || path.startsWith(pattern));
}

function sensitivityDiagnostics(contract, mutationFixture) {
  const diagnostics = [];
  const patterns = contract?.coverage_sensitive_paths || [];
  for (const required of REQUIRED_SENSITIVE_PATHS) {
    if (!patterns.includes(required)) {
      diagnostics.push(diagnostic('COV_SENSITIVE_ENFORCEMENT_PATH_MISSING', `Coverage sensitivity is missing ${required}.`, CONTRACT_PATH));
    }
  }
  const cases = mutationFixture?.cases;
  if (!Array.isArray(cases) || cases.length === 0) {
    diagnostics.push(diagnostic('COV_ENFORCEMENT_SURFACE_MUTATION_FIXTURE_MISSING', 'Enforcement-surface impact mutation fixtures must be present and non-empty.', MUTATION_FIXTURE_PATH));
    return diagnostics;
  }
  const baseSha = '1'.repeat(40);
  const headSha = '2'.repeat(40);
  for (const fixture of cases) {
    const currentImpacts = fixture.impact_record_present ? [{
      impact_id: 'coverage-impact.dcov-exec-001.fixture',
      repository: TARGET_REPOSITORY,
      pull_request: 43,
      base_sha: baseSha,
      exact_head_sha: 'derived_at_pr_runtime',
      work_package_id: 'DCOV-EXEC-001',
      changed_paths: fixture.impact_changed_paths || [],
    }] : [];
    const payload = {
      bundle: { contract: { coverage_sensitive_paths: patterns } },
      changed_paths: [fixture.changed_path],
      current_impacts: currentImpacts,
      runtime_context: {
        repository: TARGET_REPOSITORY,
        pullRequestNumber: 43,
        baseSha,
        expectedBaseSha: baseSha,
        headSha,
        expectedHeadSha: headSha,
        currentWorkPackage: 'DCOV-EXEC-001',
      },
    };
    try {
      const output = execFileSync(process.execPath, [LEGACY_VALIDATOR], {
        cwd: ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          COVERAGE_IMPACT_MUTATION_CASE: JSON.stringify(payload),
        },
      });
      const observed = new Set(JSON.parse(output).codes || []);
      if (!observed.has(fixture.expected_diagnostic)) {
        diagnostics.push(diagnostic('COV_ENFORCEMENT_SURFACE_MUTATION_FIXTURE_FAILED', `Mutation fixture failed: ${fixture.id}; expected ${fixture.expected_diagnostic}, observed ${[...observed].join(',') || 'none'}.`, MUTATION_FIXTURE_PATH));
      }
    } catch (error) {
      diagnostics.push(diagnostic('COV_ENFORCEMENT_SURFACE_MUTATION_FIXTURE_FAILED', `Mutation fixture execution failed: ${fixture.id}: ${error.message}.`, MUTATION_FIXTURE_PATH));
    }
  }
  return diagnostics;
}

function collectProofReferences() {
  const found = [];
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (PROOF_ROLES.has(value.artifact_role) || value.coverage_granted === true) found.push(value);
    for (const child of Object.values(value)) walk(child);
  };
  for (const path of [
    'planning/coverage/element-reconciliation-ledger.v1.json',
    'planning/coverage/decision-question-catalog.v1.json',
  ]) {
    const value = readJson(path);
    if (value) walk(value);
  }
  return found;
}

function runSelfTests() {
  const authorityCases = [
    { id: 'merge-status-cannot-approve', value: { merged: true } },
    { id: 'ci-success-cannot-approve', value: { ci_success: true } },
    { id: 'self-authored-closure-cannot-approve', value: { evidence_closure_accepted: true } },
    { id: 'target-file-declaration-cannot-approve', value: { target_declares_authority: true } },
  ];
  return authorityCases.map((fixture) => ({
    id: fixture.id,
    passed: attemptedPromotionDiagnostics(fixture.value).some((item) => item.code === 'COV_EXTERNAL_PROMOTION_AUTHORITY_REQUIRED'),
  }));
}

const contract = readJson(CONTRACT_PATH);
const workflow = read(WORKFLOW_PATH);
const proofReferences = collectProofReferences();
const mutationFixture = readJson(MUTATION_FIXTURE_PATH);
let diagnostics = [
  ...validateTopology(workflow),
  ...promotionDiagnostics(contract, read(RECOVERY_SPEC_PATH), read(NEXT_WORK_PATH), read(EXECUTION_PLAN_PATH)),
  ...sensitivityDiagnostics(contract, mutationFixture),
];
if (proofReferences.length > 0) {
  diagnostics.push(diagnostic('COV_EXTERNAL_TRUST_BOOTSTRAP_PROOF_CREDIT_FORBIDDEN', 'Bootstrap validation authorizes no runtime, consumer or coverage-credit proof.', 'planning/coverage'));
}
const selfTests = runSelfTests();
if (selfTests.some((item) => !item.passed)) {
  diagnostics.push(diagnostic('COV_EXTERNAL_PROMOTION_FIXTURE_SUITE_FAILED', 'One or more external-authority negative activation tests failed.', CONTRACT_PATH));
}
diagnostics = dedupe(diagnostics);

console.log('Coverage external-authority and v1.10.1 topology summary');
console.log(JSON.stringify({
  issuer_sha: ISSUER_SHA,
  promotion_status: contract?.promotion_boundary?.status || null,
  proof_reference_count: proofReferences.length,
  proof_credit_authorized: false,
  authority_tests: selfTests,
  enforcement_mutation_tests: mutationFixture?.cases?.length || 0,
}, null, 2));

if (diagnostics.length > 0) {
  console.error('Coverage repair diagnostics:');
  for (const item of diagnostics) {
    console.error(`  ${item.code}${item.path ? ` [${item.path}]` : ''}: ${item.message}`);
  }
  process.exit(1);
}

if (process.env.COVERAGE_EXTERNAL_TRUST_SELF_TEST_ONLY === '1') {
  console.log('Result: PASS');
  process.exit(0);
}

const preservedValidator = existsSync(PRF010_VALIDATOR) ? PRF010_VALIDATOR : LEGACY_VALIDATOR;
if (!existsSync(preservedValidator)) {
  console.error('COV_PRESERVED_VALIDATOR_MISSING: preserved Coverage validator is missing.');
  process.exit(1);
}

// Compatibility values preserve the established PRF-010 ordering checks only
// after this wrapper has denied self-promotion and proof credit. They are not
// external authority, trusted ingestion, or Coverage proof.
process.env.COVERAGE_VALIDATED_AT = new Date().toISOString();
process.env.COVERAGE_VALIDATION_SOURCE = 'github_actions_runner_clock_v1';
process.env.COVERAGE_TRUSTED_INGESTION_ATTESTATIONS = '{}';
process.env.GITHUB_REPOSITORY = TARGET_REPOSITORY;
process.env.GITHUB_WORKFLOW_REF = `${TARGET_REPOSITORY}/.github/workflows/validate-mvk.yml@external-bootstrap-deny`;

await import(pathToFileURL(preservedValidator).href);
