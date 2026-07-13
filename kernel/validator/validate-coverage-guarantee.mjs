#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const LEGACY_VALIDATOR = join(
  dirname(fileURLToPath(import.meta.url)),
  'validate-coverage-guarantee-legacy.mjs',
);
const TEMPORAL_FIXTURE_ROOT = join(
  ROOT,
  'kernel/fixtures/coverage-guarantee/trusted-time',
);
const EXPECTED_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const EXPECTED_WORKFLOW_REF_PREFIX = EXPECTED_REPOSITORY
  + '/.github/workflows/validate-mvk.yml@';
const TRUSTED_VALIDATION_SOURCE = 'github_actions_runner_clock_v1';
const TRUSTED_INGESTION_SOURCE = 'github_actions_trusted_ingestion_v1';
const MAX_FUTURE_SKEW_MS = 5 * 60 * 1000;
const MAX_PROOF_AGE_MS = 30 * 24 * 60 * 60 * 1000;
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

function dedupeDiagnostics(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = [item.code, item.path || '', item.message].join('|');
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function strictTimestamp(value) {
  if (typeof value !== 'string'
    || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) {
    return null;
  }
  const epoch = Date.parse(value);
  return Number.isFinite(epoch) ? epoch : null;
}

function trustedValidationContext(environment, options = {}) {
  const diagnostics = [];
  const nowMs = options.nowMs ?? Date.now();
  const ciMode = options.ciMode ?? environment.GITHUB_ACTIONS === 'true';
  let validatedAt = environment.COVERAGE_VALIDATED_AT;
  let source = environment.COVERAGE_VALIDATION_SOURCE;

  if (ciMode) {
    if (!validatedAt) {
      diagnostics.push(diagnostic(
        'COV_TRUSTED_VALIDATION_TIME_MISSING',
        'CI Coverage validation requires COVERAGE_VALIDATED_AT from the canonical workflow.',
        'COVERAGE_VALIDATED_AT',
      ));
    }
    if (source !== TRUSTED_VALIDATION_SOURCE) {
      diagnostics.push(diagnostic(
        'COV_TRUSTED_VALIDATION_SOURCE_INVALID',
        'CI Coverage validation time was not supplied by the canonical runner-clock source.',
        'COVERAGE_VALIDATION_SOURCE',
      ));
    }
    if (environment.GITHUB_REPOSITORY !== EXPECTED_REPOSITORY
      || !String(environment.GITHUB_WORKFLOW_REF || '')
        .startsWith(EXPECTED_WORKFLOW_REF_PREFIX)) {
      diagnostics.push(diagnostic(
        'COV_TRUSTED_VALIDATION_WORKFLOW_UNVERIFIED',
        'CI trusted time must originate from the canonical Validate MVK workflow in the expected repository.',
        'GITHUB_WORKFLOW_REF',
      ));
    }
    if (environment.COVERAGE_TRUSTED_INGESTION_ATTESTATIONS === undefined) {
      diagnostics.push(diagnostic(
        'COV_TRUSTED_INGESTION_ATTESTATIONS_MISSING',
        'CI must supply the trusted ingestion attestation set, including an explicit empty object when no proof is claimed.',
        'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS',
      ));
    }
  } else if (!validatedAt) {
    validatedAt = new Date(nowMs).toISOString();
    source = 'local_system_clock_v1';
  }

  const validatedAtMs = strictTimestamp(validatedAt);
  if (validatedAt && validatedAtMs === null) {
    diagnostics.push(diagnostic(
      'COV_TRUSTED_VALIDATION_TIME_MALFORMED',
      'Trusted validation time must be a strict RFC 3339 timestamp.',
      'COVERAGE_VALIDATED_AT',
    ));
  }
  if (validatedAtMs !== null && validatedAtMs > nowMs + MAX_FUTURE_SKEW_MS) {
    diagnostics.push(diagnostic(
      'COV_TRUSTED_VALIDATION_TIME_FUTURE_SKEW',
      'Trusted validation time exceeds the permitted runner-clock future skew.',
      'COVERAGE_VALIDATED_AT',
    ));
  }

  return {
    diagnostics,
    validatedAt,
    validatedAtMs,
    source,
    ciMode,
  };
}

function trustedAttestations(environment, ciMode) {
  const diagnostics = [];
  const raw = environment.COVERAGE_TRUSTED_INGESTION_ATTESTATIONS;
  if (raw === undefined || raw === '') {
    return {
      diagnostics: ciMode ? diagnostics : [],
      attestations: new Map(),
    };
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    diagnostics.push(diagnostic(
      'COV_TRUSTED_INGESTION_ATTESTATIONS_MALFORMED',
      'Trusted ingestion attestations must be a JSON object.',
      'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS',
    ));
    return { diagnostics, attestations: new Map() };
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    diagnostics.push(diagnostic(
      'COV_TRUSTED_INGESTION_ATTESTATIONS_MALFORMED',
      'Trusted ingestion attestations must be keyed by attestation_id.',
      'COVERAGE_TRUSTED_INGESTION_ATTESTATIONS',
    ));
    return { diagnostics, attestations: new Map() };
  }
  const attestations = new Map();
  for (const [key, value] of Object.entries(parsed)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)
      || value.attestation_id !== key
      || value.source !== TRUSTED_INGESTION_SOURCE
      || !/^[0-9a-f]{40}$/.test(value.evidence_head_sha || '')
      || strictTimestamp(value.trusted_ingested_at) === null) {
      diagnostics.push(diagnostic(
        'COV_TRUSTED_INGESTION_ATTESTATION_INVALID',
        'Every trusted ingestion attestation must have canonical source, exact evidence head, and a strict timestamp.',
        key,
      ));
      continue;
    }
    attestations.set(key, value);
  }
  return { diagnostics, attestations };
}

function proofTimeDiagnostics(observedAt, trustedValidation, subjectId = 'proof') {
  const diagnostics = [];
  const observedAtMs = strictTimestamp(observedAt);
  if (observedAtMs === null || trustedValidation.validatedAtMs === null) {
    diagnostics.push(diagnostic(
      'COV_PROOF_TIME_INVALID',
      'Proof observation time and trusted validation time must be parseable.',
      subjectId,
    ));
    return diagnostics;
  }
  if (observedAtMs > trustedValidation.validatedAtMs) {
    diagnostics.push(diagnostic(
      'COV_PROOF_FUTURE_DATED',
      'Future-dated proof cannot create coverage credit.',
      subjectId,
    ));
  }
  if (trustedValidation.validatedAtMs - observedAtMs > MAX_PROOF_AGE_MS) {
    diagnostics.push(diagnostic(
      'COV_PROOF_STALE',
      'Proof observation exceeds the 30-day freshness window measured by trusted validation time.',
      subjectId,
    ));
  }
  return diagnostics;
}

function captureTemporalDiagnostics(capture, attestations, trustedValidation, subjectId = 'capture') {
  const diagnostics = [];
  const trustedIngestion = capture?.trusted_ingestion;
  if (!trustedIngestion || typeof trustedIngestion !== 'object') {
    diagnostics.push(diagnostic(
      'COV_PROOF_TRUSTED_INGESTION_MISSING',
      'Proof capture lacks machine-verifiable trusted ingestion evidence.',
      subjectId,
    ));
    return diagnostics;
  }
  const attestation = attestations.get(trustedIngestion.attestation_id);
  if (!attestation) {
    diagnostics.push(diagnostic(
      'COV_PROOF_TRUSTED_INGESTION_MISSING',
      'The capture trusted_ingestion record has no matching workflow-supplied immutable attestation.',
      subjectId,
    ));
    return diagnostics;
  }
  if (trustedIngestion.source !== TRUSTED_INGESTION_SOURCE
    || trustedIngestion.evidence_head_sha !== capture.exact_head_sha
    || trustedIngestion.attestation_id !== attestation.attestation_id
    || trustedIngestion.source !== attestation.source
    || trustedIngestion.evidence_head_sha !== attestation.evidence_head_sha
    || trustedIngestion.trusted_ingested_at !== attestation.trusted_ingested_at) {
    diagnostics.push(diagnostic(
      'COV_PROOF_TRUSTED_INGESTION_MISMATCH',
      'Capture ingestion metadata must exactly match the trusted workflow attestation and evidence head.',
      subjectId,
    ));
    return diagnostics;
  }

  const capturedAtMs = strictTimestamp(capture.captured_at);
  const ingestedAtMs = strictTimestamp(trustedIngestion.trusted_ingested_at);
  if (capturedAtMs === null || ingestedAtMs === null
    || trustedValidation.validatedAtMs === null) {
    diagnostics.push(diagnostic(
      'COV_PROOF_TEMPORAL_PROVENANCE_INVALID',
      'Capture, trusted ingestion, and trusted validation timestamps must be parseable.',
      subjectId,
    ));
    return diagnostics;
  }
  if (capturedAtMs > ingestedAtMs) {
    diagnostics.push(diagnostic(
      'COV_PROOF_CAPTURE_AFTER_TRUSTED_INGESTION',
      'Capture time cannot be later than its trusted ingestion attestation.',
      subjectId,
    ));
  }
  if (ingestedAtMs > trustedValidation.validatedAtMs) {
    diagnostics.push(diagnostic(
      'COV_PROOF_INGESTION_AFTER_VALIDATION',
      'Trusted ingestion time cannot be later than trusted validation time.',
      subjectId,
    ));
  }
  return diagnostics;
}

function safeRepositoryPath(pathFromRoot) {
  if (typeof pathFromRoot !== 'string' || pathFromRoot.length === 0) return false;
  const absolute = resolve(ROOT, pathFromRoot);
  return absolute.startsWith(ROOT + sep) && !pathFromRoot.split('/').includes('..');
}

function gitValue(args) {
  try {
    return execFileSync('git', args, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return null;
  }
}

function repositoryContentAtRef(commit, pathFromRoot) {
  if (!/^[0-9a-f]{40}$/.test(commit || '') || !safeRepositoryPath(pathFromRoot)) {
    return null;
  }
  try {
    return execFileSync('git', ['show', commit + ':' + pathFromRoot], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    return null;
  }
}

function evidenceContent(ref) {
  if (!safeRepositoryPath(ref?.artifact_path)) return null;
  if (ref.head_binding === 'pinned_commit') {
    return repositoryContentAtRef(ref.repository_commit, ref.artifact_path);
  }
  if (ref.head_binding === 'git_runtime_head' && ref.repository_commit === null) {
    try {
      return readFileSync(join(ROOT, ref.artifact_path), 'utf8');
    } catch {
      return null;
    }
  }
  return null;
}

function collectProofReferences() {
  const references = [];
  const paths = [
    'planning/coverage/element-reconciliation-ledger.v1.json',
    'planning/coverage/decision-question-catalog.v1.json',
  ];
  const walk = (value) => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (!value || typeof value !== 'object') return;
    if (['runtime_proof', 'consumer_proof'].includes(value.artifact_role)
      && typeof value.artifact_path === 'string') {
      references.push(value);
    }
    for (const child of Object.values(value)) walk(child);
  };
  for (const pathFromRoot of paths) {
    try {
      walk(JSON.parse(readFileSync(join(ROOT, pathFromRoot), 'utf8')));
    } catch {
      // The preserved validator owns structural diagnostics for canonical artifacts.
    }
  }
  const unique = new Map();
  for (const ref of references) {
    unique.set([
      ref.artifact_role,
      ref.artifact_path,
      ref.repository_commit || '',
      ref.content_sha256 || '',
    ].join('|'), ref);
  }
  return [...unique.values()];
}

function actualProofTemporalDiagnostics(ref, trustedValidation, attestations) {
  const diagnostics = [];
  const content = evidenceContent(ref);
  if (content === null) return diagnostics;
  let receipt;
  try {
    receipt = JSON.parse(content);
  } catch {
    return diagnostics;
  }
  const receiptType = ref.artifact_role;
  const observedAt = receiptType === 'runtime_proof'
    ? receipt.runtime_scope?.captured_at
    : receipt.contract_result?.observed_at;
  diagnostics.push(...proofTimeDiagnostics(
    observedAt,
    trustedValidation,
    receipt.receipt_id || ref.evidence_id,
  ));

  for (const source of receipt.source_lineage || []) {
    const captureContent = repositoryContentAtRef(
      source.repository_commit,
      source.artifact_path,
    );
    if (captureContent === null) continue;
    let capture;
    try {
      capture = JSON.parse(captureContent);
    } catch {
      continue;
    }
    diagnostics.push(...captureTemporalDiagnostics(
      capture,
      attestations,
      trustedValidation,
      source.source_id || capture.capture_id,
    ));
  }
  return diagnostics;
}

function temporalFixtureFiles() {
  if (!existsSync(TEMPORAL_FIXTURE_ROOT)) return [];
  const files = [];
  const walk = (directory) => {
    for (const name of readdirSync(directory).sort()) {
      const absolute = join(directory, name);
      if (statSync(absolute).isDirectory()) walk(absolute);
      else if (name.endsWith('.fixture')) files.push(absolute);
    }
  };
  walk(TEMPORAL_FIXTURE_ROOT);
  return files;
}

function sameDerived(actual, expected) {
  return Object.entries(expected || {}).every(([key, value]) => actual[key] === value);
}

function runTemporalFixtures() {
  const results = [];
  for (const absolute of temporalFixtureFiles()) {
    const pathFromRoot = relative(ROOT, absolute).replaceAll('\\', '/');
    let fixture;
    try {
      fixture = JSON.parse(readFileSync(absolute, 'utf8'));
      const nowMs = strictTimestamp(fixture.scenario?.host_now);
      const environment = fixture.scenario?.environment || {};
      const validation = trustedValidationContext(environment, {
        nowMs: nowMs ?? Date.now(),
        ciMode: fixture.scenario?.ci_mode === true,
      });
      const attestationResult = trustedAttestations(
        environment,
        fixture.scenario?.ci_mode === true,
      );
      let diagnostics = [
        ...validation.diagnostics,
        ...attestationResult.diagnostics,
      ];
      if (fixture.scenario?.proof) {
        diagnostics.push(...proofTimeDiagnostics(
          fixture.scenario.proof.observed_at,
          validation,
          fixture.fixture_id,
        ));
      }
      if (fixture.scenario?.capture) {
        diagnostics.push(...captureTemporalDiagnostics(
          fixture.scenario.capture,
          attestationResult.attestations,
          validation,
          fixture.fixture_id,
        ));
      }
      diagnostics = dedupeDiagnostics(diagnostics);
      const observed = [...new Set(diagnostics.map((item) => item.code))].sort();
      const expected = [...(fixture.expected_diagnostic_codes || [])].sort();
      const missing = expected.filter((code) => !observed.includes(code));
      const unexpected = observed.filter((code) => !expected.includes(code));
      const invalidKind = fixture.fixture_kind !== 'valid';
      const derived = fixture.expected_derived || {};
      const invalidMetricsValid = !invalidKind
        || sameDerived(derived, INVALID_DERIVED);
      const passed = missing.length === 0
        && unexpected.length === 0
        && invalidMetricsValid;
      results.push({
        path: pathFromRoot,
        kind: fixture.fixture_kind,
        passed,
        expected,
        observed,
        missing,
        unexpected,
        invalidMetricsValid,
      });
    } catch (error) {
      results.push({
        path: pathFromRoot,
        kind: fixture?.fixture_kind || 'unknown',
        passed: false,
        expected: fixture?.expected_diagnostic_codes || [],
        observed: ['COV_TRUSTED_TIME_FIXTURE_EXECUTION_FAILED'],
        missing: fixture?.expected_diagnostic_codes || [],
        unexpected: ['COV_TRUSTED_TIME_FIXTURE_EXECUTION_FAILED'],
        invalidMetricsValid: false,
        error: error.message,
      });
    }
  }
  return results;
}

const hostNowMs = Date.now();
const trustedValidation = trustedValidationContext(process.env, { nowMs: hostNowMs });
const attestationResult = trustedAttestations(
  process.env,
  trustedValidation.ciMode,
);
let diagnostics = [
  ...trustedValidation.diagnostics,
  ...attestationResult.diagnostics,
];
for (const ref of collectProofReferences()) {
  diagnostics.push(...actualProofTemporalDiagnostics(
    ref,
    trustedValidation,
    attestationResult.attestations,
  ));
}
diagnostics = dedupeDiagnostics(diagnostics);

const fixtureResults = runTemporalFixtures();
if (fixtureResults.length === 0) {
  diagnostics.push(diagnostic(
    'COV_TRUSTED_TIME_FIXTURE_SUITE_MISSING',
    'Trusted time and ingestion adversarial fixtures are missing.',
    relative(ROOT, TEMPORAL_FIXTURE_ROOT),
  ));
}
if (fixtureResults.some((result) => !result.passed)) {
  diagnostics.push(diagnostic(
    'COV_TRUSTED_TIME_FIXTURE_SUITE_FAILED',
    'One or more trusted time or ingestion fixtures failed.',
    relative(ROOT, TEMPORAL_FIXTURE_ROOT),
  ));
}

const headSha = gitValue(['rev-parse', 'HEAD']);
const headCommittedAt = headSha
  ? gitValue(['show', '-s', '--format=%cI', headSha])
  : null;
const summary = {
  validator: 'validate-coverage-guarantee.mjs',
  temporal_authority: 'trusted_validation_time_and_ingestion_attestation',
  trusted_validation_time: trustedValidation.validatedAt,
  trusted_validation_source: trustedValidation.source,
  trusted_ingestion_attestation_count: attestationResult.attestations.size,
  exact_head_sha: headSha,
  head_committed_at_diagnostic_only: headCommittedAt,
  freshness_limit_days: 30,
  temporal_fixtures: {
    total: fixtureResults.length,
    passed: fixtureResults.filter((result) => result.passed).length,
    failed: fixtureResults.filter((result) => !result.passed).length,
  },
};
console.log('Coverage trusted-time gate summary');
console.log(JSON.stringify(summary, null, 2));
for (const result of fixtureResults) {
  console.log(
    'temporal fixture ' + (result.passed ? 'PASS ' : 'FAIL ')
      + result.path
      + ' expected=[' + result.expected.join(',') + ']'
      + ' observed=[' + result.observed.join(',') + ']',
  );
  if (result.error) console.log('  error: ' + result.error);
  if (result.missing.length) console.log('  missing: ' + result.missing.join(','));
  if (result.unexpected.length) console.log('  unexpected: ' + result.unexpected.join(','));
  if (!result.invalidMetricsValid) {
    console.log('  invalid fixture metrics do not preserve 0/0 over 7/24 unresolved states.');
  }
}

if (diagnostics.length > 0) {
  console.error('Coverage trusted-time diagnostics:');
  for (const item of diagnostics) {
    console.error('  ' + item.code
      + (item.path ? ' [' + item.path + ']' : '')
      + ': ' + item.message);
  }
  process.exit(1);
}

if (process.env.COVERAGE_TEMPORAL_SELF_TEST_ONLY === '1') {
  console.log('Result: PASS');
  process.exit(0);
}

if (!existsSync(LEGACY_VALIDATOR)) {
  console.error('COV_LEGACY_VALIDATOR_MISSING: preserved Coverage validator implementation is missing.');
  process.exit(1);
}
if (trustedValidation.validatedAtMs === null) {
  console.error('COV_TRUSTED_VALIDATION_TIME_MALFORMED: trusted validation time is unavailable.');
  process.exit(1);
}

// Preserve the Git commit timestamp as diagnostic metadata while ensuring that the
// previously verified validator's sole Date.parse use for its validation clock is
// evaluated against the independent trusted validation clock. Observation timestamps
// and fixture clocks retain their literal values.
const nativeDateParse = Date.parse.bind(Date);
Date.parse = (value) => {
  if (typeof value === 'string'
    && headCommittedAt !== null
    && value === headCommittedAt) {
    return trustedValidation.validatedAtMs;
  }
  return nativeDateParse(value);
};

await import(pathToFileURL(LEGACY_VALIDATOR).href);
