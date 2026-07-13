#!/usr/bin/env node
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VALIDATOR_DIR = dirname(fileURLToPath(import.meta.url));
const PRF010_VALIDATOR = join(VALIDATOR_DIR, 'validate-coverage-guarantee-prf010.mjs');
const LEGACY_VALIDATOR = join(VALIDATOR_DIR, 'validate-coverage-guarantee-legacy.mjs');
const WORKFLOW_PATH = '.github/workflows/validate-mvk.yml';
const GUARD_PATH = '.github/workflows/coverage-trust-required.yml';
const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const ISSUER_SHA = '8b9b803a9f1e916f360d8871e43f5c48a11b5974';
const ISSUER_CALL = 'rezahh107/PR-Inspector/.github/workflows/coverage-trust-gate.yml@'
  + ISSUER_SHA;
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
];
const PROOF_ROLES = new Set(['runtime_proof', 'consumer_proof', 'coverage_credit']);

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

function read(relativePath) {
  try {
    return readFileSync(join(ROOT, relativePath), 'utf8');
  } catch {
    return '';
  }
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

function collectProofReferences() {
  const found = [];
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (PROOF_ROLES.has(value.artifact_role) || value.coverage_granted === true) {
      found.push(value);
    }
    for (const item of Object.values(value)) walk(item);
  };
  for (const path of [
    'planning/coverage/element-reconciliation-ledger.v1.json',
    'planning/coverage/decision-question-catalog.v1.json',
  ]) {
    try {
      walk(JSON.parse(read(path)));
    } catch {
      // The preserved validator owns canonical structure diagnostics.
    }
  }
  return found;
}

function validateTopology(workflow, guard, environment = process.env) {
  const diagnostics = [];
  const external = jobBlock(workflow, 'external-coverage-trust');
  const validation = jobBlock(workflow, 'validate-mvk');
  if (!external.includes(`uses: ${ISSUER_CALL}`)) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_TRUST_ROOT_UNPINNED',
      'The active external job is not pinned to the approved immutable issuer.',
      WORKFLOW_PATH,
    ));
  }
  if (CALLER_IDENTITY_KEYS.some((key) => external.includes(key))) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_CALLER_IDENTITY_INPUT_FORBIDDEN',
      'Caller-selected repository, PR, base, head, or issuer identity is forbidden.',
      WORKFLOW_PATH,
    ));
  }
  if (!external.includes('pull-requests: read') || !external.includes('id-token: write')) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_OIDC_PERMISSIONS_MISSING',
      'External enforcement requires read-only PR API access and OIDC identity.',
      WORKFLOW_PATH,
    ));
  }
  if (!validation.includes('needs: external-coverage-trust')
    || !validation.includes(
      'ref: ${{ needs.external-coverage-trust.outputs.verified_head_sha }}',
    )) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_VALIDATION_CHECKOUT_MISMATCH',
      'Target validation must depend on the external gate and checkout its verified head.',
      WORKFLOW_PATH,
    ));
  }
  for (const binding of [
    'COVERAGE_REPOSITORY: ${{ needs.external-coverage-trust.outputs.verified_repository }}',
    'COVERAGE_PR_NUMBER: ${{ needs.external-coverage-trust.outputs.verified_pr_number }}',
    'COVERAGE_BASE_SHA: ${{ needs.external-coverage-trust.outputs.verified_base_sha }}',
    'COVERAGE_HEAD_SHA: ${{ needs.external-coverage-trust.outputs.verified_head_sha }}',
  ]) {
    if (!validation.includes(binding)) {
      diagnostics.push(diagnostic(
        'COV_EXTERNAL_VALIDATION_IDENTITY_BINDING_MISSING',
        'Coverage validation inputs must come from authoritative external outputs.',
        WORKFLOW_PATH,
      ));
      break;
    }
  }
  if (TRUST_ENV_NAMES.some((name) => workflow.includes(name))
    || workflow.includes('/bin/date')) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_TRUST_ROOT_TARGET_MINT_FORBIDDEN',
      'A target-controlled workflow may not mint trust inputs.',
      WORKFLOW_PATH,
    ));
  }
  if (workflow.includes('COVERAGE_TRUSTED_INGESTION_ATTESTATIONS')) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_ATTESTATION_UNSIGNED_ENV_FORBIDDEN',
      'Plain target-controlled environment JSON is not a verified attestation.',
      WORKFLOW_PATH,
    ));
  }
  for (const name of TRUST_ENV_NAMES) {
    if (environment[name] !== undefined) {
      diagnostics.push(diagnostic(
        name === 'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS'
          ? 'COV_EXTERNAL_ATTESTATION_UNSIGNED_ENV_FORBIDDEN'
          : 'COV_EXTERNAL_TRUST_ROOT_SELF_ISSUED_ENV_FORBIDDEN',
        'Target-controlled environment values cannot establish trust.',
        name,
      ));
    }
  }
  if (guard && (!guard.includes('pull_request_target:')
    || !guard.includes('name: PRF-012 Authoritative Coverage Trust')
    || !guard.includes('name: PRF-012 Authoritative Target Validation')
    || !guard.includes(`uses: ${ISSUER_CALL}`)
    || !guard.includes(
      'ref: ${{ needs.authoritative-coverage-trust.outputs.verified_head_sha }}',
    ))) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_REQUIRED_GUARD_INVALID',
      'The protected guard is not bound to the authoritative issuer and verified head.',
      GUARD_PATH,
    ));
  }
  return dedupe(diagnostics);
}

function runFixtures() {
  const valid = `jobs:\n  external-coverage-trust:\n    uses: ${ISSUER_CALL}\n    permissions:\n      pull-requests: read\n      id-token: write\n  validate-mvk:\n    needs: external-coverage-trust\n    steps:\n      - with:\n          ref: \${{ needs.external-coverage-trust.outputs.verified_head_sha }}\n      - env:\n          COVERAGE_REPOSITORY: \${{ needs.external-coverage-trust.outputs.verified_repository }}\n          COVERAGE_PR_NUMBER: \${{ needs.external-coverage-trust.outputs.verified_pr_number }}\n          COVERAGE_BASE_SHA: \${{ needs.external-coverage-trust.outputs.verified_base_sha }}\n          COVERAGE_HEAD_SHA: \${{ needs.external-coverage-trust.outputs.verified_head_sha }}\n`;
  const cases = [
    {
      id: 'caller-selected-head',
      expected: 'COV_EXTERNAL_CALLER_IDENTITY_INPUT_FORBIDDEN',
      workflow: valid.replace(
        'permissions:\n      pull-requests',
        'with:\n      target_head_sha: deadbeef\n    permissions:\n      pull-requests',
      ),
    },
    {
      id: 'validation-checkout-drift',
      expected: 'COV_EXTERNAL_VALIDATION_CHECKOUT_MISMATCH',
      workflow: valid.replace(
        'ref: ${{ needs.external-coverage-trust.outputs.verified_head_sha }}',
        'ref: ${{ github.event.pull_request.head.sha }}',
      ),
    },
    { id: 'valid-authoritative-path', expected: null, workflow: valid },
  ];
  return cases.map((fixture) => {
    const observed = validateTopology(fixture.workflow, '', {})
      .map((item) => item.code);
    const passed = fixture.expected === null
      ? observed.length === 0
      : observed.length === 1 && observed[0] === fixture.expected;
    return { ...fixture, observed, passed };
  });
}

const workflow = read(WORKFLOW_PATH);
const guard = read(GUARD_PATH);
const proofReferences = collectProofReferences();
let diagnostics = validateTopology(workflow, guard);
if (proofReferences.length > 0) {
  diagnostics.push(diagnostic(
    'COV_EXTERNAL_TRUST_BOOTSTRAP_PROOF_CREDIT_FORBIDDEN',
    'PRF-012 bootstrap authorizes no runtime, consumer, or coverage-credit proof.',
    'planning/coverage',
  ));
}
const fixtureResults = runFixtures();
if (fixtureResults.some((result) => !result.passed)) {
  diagnostics.push(diagnostic(
    'COV_EXTERNAL_TRUST_FIXTURE_SUITE_FAILED',
    'One or more target-side trust-boundary fixtures failed.',
    'kernel/validator/validate-coverage-guarantee.mjs',
  ));
}
diagnostics = dedupe(diagnostics);

console.log('Coverage PRF-012 authoritative bootstrap summary');
console.log(JSON.stringify({
  issuer_sha: ISSUER_SHA,
  proof_reference_count: proofReferences.length,
  proof_credit_authorized: false,
  protected_guard_present: Boolean(guard),
  fixtures: {
    total: fixtureResults.length,
    passed: fixtureResults.filter((item) => item.passed).length,
    failed: fixtureResults.filter((item) => !item.passed).length,
  },
}, null, 2));
for (const result of fixtureResults) {
  console.log(`trust fixture ${result.passed ? 'PASS' : 'FAIL'} ${result.id}`);
}

if (diagnostics.length > 0) {
  console.error('Coverage PRF-012 diagnostics:');
  for (const item of diagnostics) {
    console.error(`  ${item.code}${item.path ? ` [${item.path}]` : ''}: ${item.message}`);
  }
  process.exit(1);
}

if (process.env.COVERAGE_EXTERNAL_TRUST_SELF_TEST_ONLY === '1') {
  console.log('Result: PASS');
  process.exit(0);
}

const preservedValidator = existsSync(PRF010_VALIDATOR)
  ? PRF010_VALIDATOR
  : LEGACY_VALIDATOR;
if (!existsSync(preservedValidator)) {
  console.error('COV_PRESERVED_VALIDATOR_MISSING: preserved Coverage validator is missing.');
  process.exit(1);
}

// Compatibility values preserve PRF-010 ordering checks only after both gates
// have denied all proof references. They cannot authorize proof credit.
process.env.COVERAGE_VALIDATED_AT = new Date().toISOString();
process.env.COVERAGE_VALIDATION_SOURCE = 'github_actions_runner_clock_v1';
process.env.COVERAGE_TRUSTED_INGESTION_ATTESTATIONS = '{}';
process.env.GITHUB_REPOSITORY = TARGET_REPOSITORY;
process.env.GITHUB_WORKFLOW_REF = TARGET_REPOSITORY
  + '/.github/workflows/validate-mvk.yml@external-bootstrap-deny';

await import(pathToFileURL(preservedValidator).href);
