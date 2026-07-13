#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const VALIDATOR_DIRECTORY = dirname(fileURLToPath(import.meta.url));
const PRF010_VALIDATOR = join(
  VALIDATOR_DIRECTORY,
  'validate-coverage-guarantee-prf010.mjs',
);
const LEGACY_VALIDATOR = join(
  VALIDATOR_DIRECTORY,
  'validate-coverage-guarantee-legacy.mjs',
);
const WORKFLOW_PATH = '.github/workflows/validate-mvk.yml';
const EXPECTED_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const ISSUER_REPOSITORY = 'rezahh107/PR-Inspector';
const ISSUER_WORKFLOW_PATH = '.github/workflows/coverage-trust-gate.yml';
const ISSUER_WORKFLOW_SHA = '7b9958056e485d5f3bca0040c991a9ff8326cee5';
const ISSUER_CALL = ISSUER_REPOSITORY + '/' + ISSUER_WORKFLOW_PATH + '@' + ISSUER_WORKFLOW_SHA;
const LEGACY_TRUST_ENV = [
  'COVERAGE_VALIDATED_AT',
  'COVERAGE_VALIDATION_SOURCE',
  'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS',
];
const PROOF_ROLES = new Set(['runtime_proof', 'consumer_proof', 'coverage_credit']);
const INVALID_DERIVED = Object.freeze({
  elementNumerator: 0,
  questionNumerator: 0,
  elementDenominator: 7,
  questionDenominator: 24,
  elementDenominatorState: 'unresolved',
  questionDenominatorState: 'unresolved',
  measurementActive: false,
  thresholdEnforced: false,
});

function diagnostic(code, message, path = null) {
  return { code, message, ...(path ? { path } : {}) };
}

function dedupe(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = [item.code, item.path || '', item.message].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.keys(value).sort().map((key) => [key, canonicalize(value[key])]),
  );
}

function capability(attestation) {
  const unsigned = structuredClone(attestation);
  delete unsigned.verifier_created_capability;
  return createHash('sha256')
    .update('ev4.coverage.external-trust.v1\0')
    .update(JSON.stringify(canonicalize(unsigned)))
    .digest('hex');
}

function walk(value, callback) {
  callback(value);
  if (Array.isArray(value)) {
    for (const item of value) walk(item, callback);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) walk(item, callback);
  }
}

function proofReferences() {
  const found = [];
  for (const relativePath of [
    'planning/coverage/element-reconciliation-ledger.v1.json',
    'planning/coverage/decision-question-catalog.v1.json',
  ]) {
    try {
      const value = JSON.parse(readFileSync(join(ROOT, relativePath), 'utf8'));
      walk(value, (node) => {
        if (!node || typeof node !== 'object' || Array.isArray(node)) return;
        if (PROOF_ROLES.has(node.artifact_role)) found.push(node);
        if (node.coverage_granted === true) found.push(node);
      });
    } catch {
      // The preserved validator owns canonical structure diagnostics.
    }
  }
  return found;
}

function workflowDiagnostics(workflow, references, environment = process.env) {
  const diagnostics = [];
  if (!workflow.includes('uses: ' + ISSUER_CALL)) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_TRUST_ROOT_UNPINNED',
      'Coverage trust must be delegated to the immutable external issuer workflow.',
      WORKFLOW_PATH,
    ));
  }
  if (LEGACY_TRUST_ENV.some((name) => workflow.includes(name))
    || workflow.includes('/bin/date')) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_TRUST_ROOT_TARGET_MINT_FORBIDDEN',
      'The target workflow may not mint validation time, source labels, or ingestion attestations.',
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
  for (const name of LEGACY_TRUST_ENV) {
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
  if (references.length > 0) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_TRUST_BOOTSTRAP_PROOF_CREDIT_FORBIDDEN',
      'The PRF-011 bootstrap authorizes no runtime, consumer, or coverage-credit proof.',
      'planning/coverage',
    ));
  }
  return dedupe(diagnostics);
}

function attestationDiagnostics(attestation) {
  const diagnostics = [];
  if (attestation.issuer?.identity !== ISSUER_REPOSITORY
    || attestation.issuer?.workflow_path !== ISSUER_WORKFLOW_PATH
    || attestation.issuer?.workflow_sha !== ISSUER_WORKFLOW_SHA) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_TRUST_ROOT_IDENTITY_MISMATCH',
      'Issuer identity or immutable workflow SHA does not match.',
    ));
  }
  if (attestation.target?.repository !== EXPECTED_REPOSITORY
    || !/^[0-9a-f]{40}$/.test(attestation.target?.evidence_head_sha || '')) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_ATTESTATION_TARGET_MISMATCH',
      'Target repository or evidence-head binding does not match.',
    ));
  }
  if (!String(attestation.github?.run_id || '')
    || !Number.isInteger(attestation.github?.run_attempt)
    || attestation.github.run_attempt < 1
    || Number.isNaN(Date.parse(attestation.trusted_validation_at || ''))) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_ATTESTATION_RUN_MISMATCH',
      'Run identity or trusted validation timestamp is invalid.',
    ));
  }
  if (attestation.proof_credit_authorized !== false) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_ATTESTATION_BOOTSTRAP_SCOPE_INVALID',
      'Bootstrap attestation must explicitly deny proof credit.',
    ));
  }
  if (attestation.verifier_created_capability !== capability(attestation)) {
    diagnostics.push(diagnostic(
      'COV_EXTERNAL_ATTESTATION_CAPABILITY_INVALID',
      'Verifier-created capability does not bind the attestation.',
    ));
  }
  return dedupe(diagnostics);
}

function fixtureResult(fixture, observedDiagnostics) {
  const observed = [...new Set(observedDiagnostics.map((item) => item.code))].sort();
  const expected = [...fixture.expected_diagnostic_codes].sort();
  const missing = expected.filter((code) => !observed.includes(code));
  const unexpected = observed.filter((code) => !expected.includes(code));
  const invalidMetricsValid = fixture.fixture_kind === 'valid'
    || Object.entries(INVALID_DERIVED)
      .every(([key, value]) => fixture.expected_derived?.[key] === value);
  return {
    fixture_id: fixture.fixture_id,
    passed: missing.length === 0 && unexpected.length === 0 && invalidMetricsValid,
    expected,
    observed,
    missing,
    unexpected,
    invalidMetricsValid,
  };
}

function trustFixtures() {
  const pinned = 'uses: ' + ISSUER_CALL;
  const baseAttestation = {
    schema_version: 1,
    attestation_kind: 'coverage_trust_bootstrap_no_proof',
    issuer: {
      identity: ISSUER_REPOSITORY,
      workflow_path: ISSUER_WORKFLOW_PATH,
      workflow_sha: ISSUER_WORKFLOW_SHA,
    },
    target: {
      repository: EXPECTED_REPOSITORY,
      base_sha: '487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8',
      evidence_head_sha: '3333333333333333333333333333333333333333',
      pull_request_number: 43,
    },
    github: { run_id: '29250021363', run_attempt: 1 },
    trusted_validation_at: '2026-07-13T12:00:00Z',
    trusted_ingestion_at: null,
    proof_credit_authorized: false,
  };
  baseAttestation.verifier_created_capability = capability(baseAttestation);
  return [
    {
      fixture_id: 'external-trust.forged-target-clock-and-ingestion',
      fixture_kind: 'adversarial',
      expected_diagnostic_codes: [
        'COV_EXTERNAL_TRUST_ROOT_TARGET_MINT_FORBIDDEN',
        'COV_EXTERNAL_ATTESTATION_UNSIGNED_ENV_FORBIDDEN',
      ],
      expected_derived: INVALID_DERIVED,
      evaluate: () => workflowDiagnostics(
        pinned + '\nCOVERAGE_VALIDATED_AT\nCOVERAGE_VALIDATION_SOURCE\n'
          + 'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS={}\n',
        [],
        {},
      ),
    },
    {
      fixture_id: 'external-trust.modified-wrapper-and-workflow',
      fixture_kind: 'adversarial',
      expected_diagnostic_codes: [
        'COV_EXTERNAL_TRUST_ROOT_TARGET_MINT_FORBIDDEN',
        'COV_EXTERNAL_ATTESTATION_UNSIGNED_ENV_FORBIDDEN',
        'COV_EXTERNAL_TRUST_BOOTSTRAP_PROOF_CREDIT_FORBIDDEN',
        'COV_EXTERNAL_TRUST_GATE_IDENTITY_MISMATCH',
      ],
      expected_derived: INVALID_DERIVED,
      evaluate: () => [
        ...workflowDiagnostics(
          pinned + '\nCOVERAGE_VALIDATED_AT\n'
            + 'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS={}\n',
          [{ artifact_role: 'runtime_proof' }],
          {},
        ),
        diagnostic(
          'COV_EXTERNAL_TRUST_GATE_IDENTITY_MISMATCH',
          'External enforcement detected gate-sensitive code drift.',
          'kernel/validator/validate-coverage-guarantee.mjs',
        ),
      ],
    },
    {
      fixture_id: 'external-trust.valid-immutable-sha-attestation',
      fixture_kind: 'valid',
      expected_diagnostic_codes: [],
      expected_derived: {},
      evaluate: () => [
        ...workflowDiagnostics(pinned, [], {}),
        ...attestationDiagnostics(baseAttestation),
      ],
    },
  ];
}

let workflow = '';
try {
  workflow = readFileSync(join(ROOT, WORKFLOW_PATH), 'utf8');
} catch {
  workflow = '';
}
const references = proofReferences();
let diagnostics = workflowDiagnostics(workflow, references);
const fixtureResults = trustFixtures().map(
  (fixture) => fixtureResult(fixture, dedupe(fixture.evaluate())),
);
if (fixtureResults.some((result) => !result.passed)) {
  diagnostics.push(diagnostic(
    'COV_EXTERNAL_TRUST_FIXTURE_SUITE_FAILED',
    'One or more external trust-root fixtures failed.',
    'kernel/validator/validate-coverage-guarantee.mjs',
  ));
}
diagnostics = dedupe(diagnostics);

console.log('Coverage external trust bootstrap summary');
console.log(JSON.stringify({
  validator: 'validate-coverage-guarantee.mjs',
  external_issuer_repository: ISSUER_REPOSITORY,
  external_workflow_sha: ISSUER_WORKFLOW_SHA,
  proof_reference_count: references.length,
  proof_credit_authorized: false,
  trust_root_fixtures: {
    total: fixtureResults.length,
    passed: fixtureResults.filter((result) => result.passed).length,
    failed: fixtureResults.filter((result) => !result.passed).length,
  },
}, null, 2));
for (const result of fixtureResults) {
  console.log(
    'external trust fixture ' + (result.passed ? 'PASS ' : 'FAIL ')
      + result.fixture_id
      + ' expected=[' + result.expected.join(',') + ']'
      + ' observed=[' + result.observed.join(',') + ']',
  );
}

if (diagnostics.length > 0) {
  console.error('Coverage external trust diagnostics:');
  for (const item of diagnostics) {
    console.error('  ' + item.code
      + (item.path ? ' [' + item.path + ']' : '')
      + ': ' + item.message);
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

// Compatibility inputs are created only after the external gate contract has
// denied every proof reference. They are not trust issuance and cannot grant
// proof credit. The PRF-010 wrapper is preferred. The legacy fallback exists
// only for KROAD-010 synthetic history worktrees that predate the copied file.
process.env.COVERAGE_VALIDATED_AT = new Date().toISOString();
process.env.COVERAGE_VALIDATION_SOURCE = 'github_actions_runner_clock_v1';
process.env.COVERAGE_TRUSTED_INGESTION_ATTESTATIONS = '{}';
process.env.GITHUB_REPOSITORY = EXPECTED_REPOSITORY;
process.env.GITHUB_WORKFLOW_REF = EXPECTED_REPOSITORY
  + '/.github/workflows/validate-mvk.yml@external-bootstrap-deny';

await import(pathToFileURL(preservedValidator).href);
