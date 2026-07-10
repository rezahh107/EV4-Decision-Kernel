#!/usr/bin/env node
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const profilePath = 'kernel/decision-governance/consumer-decision-receipt-safety-profile.v1.json';
const schemaPath = 'kernel/schemas/consumer-decision-receipt-safety-profile.v1.schema.json';
const validFixtureDirectory = 'kernel/fixtures/valid/consumer_decision_receipt';
const invalidFixtureDirectory = 'kernel/fixtures/invalid/consumer_decision_receipt';

const requiredTraceFields = [
  'decision_family',
  'decision_card_ref',
  'selected_option',
  'rejected_options',
  'evidence_refs',
  'evidence_state',
  'consumer_stage'
];

const forbiddenEvidenceStates = new Set([
  'provided',
  'expected_unverified',
  'unverified',
  'proposed',
  'derived',
  'insufficient_evidence'
]);

const expectedForbiddenStatusUpgrades = [
  'ci_enforced',
  'sequence_ci_enforced',
  'downstream_contract_enforced',
  'runtime_monitor_enforced',
  'os_harness_enforced',
  'resolved',
  'production_ready',
  'release_ready'
];

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(repoRoot, pathFromRoot), 'utf8'));
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNonEmptyValue(value) {
  if (isNonEmptyString(value)) return true;
  if (Array.isArray(value)) return value.length > 0;
  return isObject(value) && Object.keys(value).length > 0;
}

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (!isObject(value)) return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .map((key) => [key, canonicalize(value[key])])
  );
}

function canonicallyEqual(left, right) {
  return JSON.stringify(canonicalize(left)) === JSON.stringify(canonicalize(right));
}

function diagnostic(code, message, path = '(root)', severity = 'error') {
  return {
    rule_id: 'EV4_RECEIPT_SAFETY_PROFILE_V1',
    code,
    message,
    source: 'consumer_receipt_profile',
    path,
    severity
  };
}

function sortDiagnostics(diagnostics) {
  return [...diagnostics].sort((left, right) =>
    [left.code, left.path, left.message].join('|').localeCompare(
      [right.code, right.path, right.message].join('|')
    )
  );
}

function pathFromAjvError(error) {
  const basePath = error.instancePath
    ? error.instancePath.slice(1).replaceAll('/', '.')
    : '(root)';
  if (error.keyword === 'required' && error.params?.missingProperty) {
    return basePath === '(root)'
      ? error.params.missingProperty
      : `${basePath}.${error.params.missingProperty}`;
  }
  return basePath;
}

function profileDiagnostics(profile, validateProfile) {
  const diagnostics = [];
  if (!validateProfile(profile)) {
    for (const error of validateProfile.errors || []) {
      diagnostics.push(diagnostic(
        'EV4.RECEIPT.PROFILE_SCHEMA_INVALID',
        `profile ${error.message}`,
        pathFromAjvError(error)
      ));
    }
    return sortDiagnostics(diagnostics);
  }

  const invariants = [
    {
      valid: canonicallyEqual(profile.trace_closure.required_fields, requiredTraceFields),
      path: 'trace_closure.required_fields',
      message: 'receipt success must require the exact seven-field trace closure'
    },
    {
      valid: canonicallyEqual(profile.success_policy.allowed_evidence_states, ['validated']),
      path: 'success_policy.allowed_evidence_states',
      message: 'validated must be the only success-authorizing evidence state'
    },
    {
      valid: profile.multi_entry_aggregation.aggregate_success_quantifier === 'every' &&
        profile.multi_entry_aggregation.any_complete_trace_authorizes_success === false,
      path: 'multi_entry_aggregation',
      message: 'aggregate receipt success must use every(), never any()'
    },
    {
      valid: canonicallyEqual(profile.forbidden_status_upgrades, expectedForbiddenStatusUpgrades),
      path: 'forbidden_status_upgrades',
      message: 'the forbidden receipt status-upgrade set must remain complete and ordered'
    },
    {
      valid: profile.lifecycle.authority_scope === 'wave_5_receipt_safety_semantics_only' &&
        profile.lifecycle.wave_5_implementation_status === 'extension_not_complete',
      path: 'lifecycle',
      message: 'canonical authority must remain limited to receipt-safety semantics'
    }
  ];

  for (const invariant of invariants) {
    if (!invariant.valid) {
      diagnostics.push(diagnostic(
        'EV4.RECEIPT.PROFILE_INVARIANT_VIOLATION',
        invariant.message,
        invariant.path
      ));
    }
  }
  return sortDiagnostics(diagnostics);
}

function exactBindingExists(bindings, trace) {
  return Array.isArray(bindings) && bindings.some((binding) =>
    isObject(binding) &&
    binding.trace_id === trace.trace_id &&
    isObject(binding.accepted_trace) &&
    canonicallyEqual(binding.accepted_trace, trace)
  );
}

function resolveConsumerStage(trace, enclosingCarrier) {
  const carrierValid = isObject(enclosingCarrier) &&
    enclosingCarrier.authoritative === true &&
    isNonEmptyString(enclosingCarrier.source_ref) &&
    isNonEmptyString(enclosingCarrier.consumer_stage) &&
    exactBindingExists(enclosingCarrier.trace_bindings, trace);

  if (isNonEmptyString(trace.consumer_stage)) {
    if (carrierValid && enclosingCarrier.consumer_stage !== trace.consumer_stage) {
      return { stage: null, source: null, valid: false, ambiguous: true };
    }
    return { stage: trace.consumer_stage, source: 'trace', valid: true };
  }
  if (!carrierValid) {
    return { stage: null, source: null, valid: false };
  }
  return {
    stage: enclosingCarrier.consumer_stage,
    source: enclosingCarrier.source_ref,
    valid: true
  };
}

function authoritativeAcceptanceDiagnostics(validationResult, traces, receiptTraceIds, profile) {
  const diagnostics = [];
  const allowedAuthorities = new Set(
    profile.success_policy.authoritative_validation_result.allowed_authority_types
  );

  if (!isObject(validationResult)) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.AUTHORITATIVE_ACCEPTANCE_REQUIRED',
      'success receipt requires an inspected authoritative validator or Project Gate result',
      'validation_result'
    ));
    return diagnostics;
  }

  const provenanceValid =
    allowedAuthorities.has(validationResult.authority_type) &&
    isNonEmptyString(validationResult.authority_id) &&
    isNonEmptyString(validationResult.artifact_ref) &&
    validationResult.result === 'accepted';

  if (!provenanceValid) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.AUTHORITATIVE_PROVENANCE_REQUIRED',
      'raw accepted status is insufficient without authority type, authority id, artifact ref, and accepted result',
      'validation_result'
    ));
  }

  for (const traceId of receiptTraceIds) {
    const trace = traces.find((item) => item?.trace_id === traceId);
    if (trace && !exactBindingExists(validationResult.trace_bindings, trace)) {
      diagnostics.push(diagnostic(
        'EV4.RECEIPT.EXACT_TRACE_BINDING_REQUIRED',
        `authoritative acceptance is not bound to the exact trace ${traceId}`,
        `validation_result.trace_bindings.${traceId}`
      ));
    }
  }
  return diagnostics;
}

function traceDiagnostics(trace, traceIndex, enclosingCarrier) {
  const diagnostics = [];
  const basePath = `traces.${traceIndex}`;

  if (!isObject(trace)) {
    return [diagnostic(
      'EV4.RECEIPT.TRACE_OBJECT_REQUIRED',
      'each applicable lineage entry must be a machine-readable trace object',
      basePath
    )];
  }

  for (const field of requiredTraceFields.filter((item) => item !== 'consumer_stage')) {
    if (!isNonEmptyValue(trace[field])) {
      diagnostics.push(diagnostic(
        'EV4.RECEIPT.TRACE_REQUIRED_FIELD_MISSING',
        `required trace closure field is missing or empty: ${field}`,
        `${basePath}.${field}`
      ));
    }
  }

  if (!Array.isArray(trace.rejected_options) || trace.rejected_options.length === 0) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.REJECTED_OPTIONS_REQUIRED',
      'success receipt requires at least one rejected option',
      `${basePath}.rejected_options`
    ));
  }

  if (!Array.isArray(trace.evidence_refs) || trace.evidence_refs.length === 0) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.EVIDENCE_REFS_REQUIRED',
      'success receipt requires at least one evidence reference',
      `${basePath}.evidence_refs`
    ));
  }

  const stageResolution = resolveConsumerStage(trace, enclosingCarrier);
  if (!stageResolution.valid) {
    diagnostics.push(diagnostic(
      stageResolution.ambiguous
        ? 'EV4.RECEIPT.CONSUMER_STAGE_AMBIGUOUS'
        : 'EV4.RECEIPT.CONSUMER_STAGE_MISSING',
      stageResolution.ambiguous
        ? 'trace and authoritative carrier supply conflicting consumer_stage values'
        : 'consumer_stage must be present on the trace or supplied by an authoritative, source-retaining, deterministic carrier binding',
      `${basePath}.consumer_stage`
    ));
  }

  if (trace.evidence_state !== 'validated') {
    const detail = forbiddenEvidenceStates.has(trace.evidence_state)
      ? `evidence_state ${trace.evidence_state} cannot authorize receipt success`
      : 'receipt success requires evidence_state=validated';
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.EVIDENCE_STATE_NOT_VALIDATED',
      detail,
      `${basePath}.evidence_state`
    ));
  }

  return diagnostics;
}

function executionClaimPresent(receipt) {
  const structuredClaim = Array.isArray(receipt.execution_claims) &&
    receipt.execution_claims.some((claim) =>
      ['builder_execution', 'fallback_execution'].includes(claim)
    );
  const text = String(receipt.text || '').toLowerCase();
  const textClaim = /builder (was )?executed|builder execution (was )?completed|fallback (was )?executed|fallback execution (was )?completed/.test(text);
  return structuredClaim || textClaim;
}

function hasInspectedExecutionEvidence(executionEvidence) {
  return Array.isArray(executionEvidence) && executionEvidence.some((item) =>
    isObject(item) &&
    ['builder_execution', 'fallback_execution'].includes(item.claim_type) &&
    item.inspected === true &&
    isNonEmptyString(item.evidence_ref)
  );
}

function validateReceiptCase(input, profile) {
  if (!isObject(input)) {
    return {
      result: 'blocked',
      diagnostics: [diagnostic(
        'EV4.RECEIPT.INPUT_OBJECT_REQUIRED',
        'fixture input must be an object'
      )]
    };
  }

  const diagnostics = [];
  const receipt = isObject(input.receipt) ? input.receipt : {};
  const traces = Array.isArray(input.traces) ? input.traces : [];
  const receiptTraceIds = Array.isArray(receipt.trace_ids) ? receipt.trace_ids : [];
  const successRequested = receipt.visible_state === 'success';

  if (!successRequested) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.SUCCESS_STATE_REQUIRED_FOR_SUCCESS_FIXTURE',
      'the receipt under conformance review must explicitly request success',
      'receipt.visible_state'
    ));
  }

  if (traces.length === 0 || receiptTraceIds.length === 0) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.MACHINE_TRACE_REQUIRED',
      'success receipt requires at least one referenced machine trace',
      'receipt.trace_ids'
    ));
  }

  for (const traceId of receiptTraceIds) {
    if (!traces.some((trace) => trace?.trace_id === traceId)) {
      diagnostics.push(diagnostic(
        'EV4.RECEIPT.TRACE_REFERENCE_UNKNOWN',
        `receipt references unknown trace ${traceId}`,
        'receipt.trace_ids'
      ));
    }
  }

  const referencedTraces = traces.filter((trace) => receiptTraceIds.includes(trace?.trace_id));
  for (const [traceIndex, trace] of referencedTraces.entries()) {
    diagnostics.push(...traceDiagnostics(trace, traceIndex, input.enclosing_carrier));
  }

  if (receipt.aggregation_mode === 'aggregate') {
    const everyApplicableTraceReferenced =
      traces.length > 0 &&
      traces.every((trace) => receiptTraceIds.includes(trace?.trace_id));
    const allTraceDiagnostics = traces.flatMap((trace, traceIndex) =>
      traceDiagnostics(trace, traceIndex, input.enclosing_carrier)
    );
    if (!everyApplicableTraceReferenced || allTraceDiagnostics.length > 0) {
      diagnostics.push(diagnostic(
        'EV4.RECEIPT.AGGREGATE_TRACE_INCOMPLETE',
        'aggregate success requires every applicable trace to be referenced, complete, validated, and correctly bound',
        'receipt.aggregation_mode'
      ));
    }
  } else if (receipt.aggregation_mode !== 'per_trace') {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.AGGREGATION_MODE_INVALID',
      'receipt aggregation_mode must be per_trace or aggregate',
      'receipt.aggregation_mode'
    ));
  }

  diagnostics.push(...authoritativeAcceptanceDiagnostics(
    input.validation_result,
    traces,
    receiptTraceIds,
    profile
  ));

  if (executionClaimPresent(receipt) && !hasInspectedExecutionEvidence(input.execution_evidence)) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.EXECUTION_EVIDENCE_REQUIRED',
      'Builder or fallback execution wording requires separately inspected execution evidence',
      'receipt.execution_claims'
    ));
  }

  const claimedUpgrades = Array.isArray(receipt.claimed_status_upgrades)
    ? receipt.claimed_status_upgrades
    : [];
  const text = String(receipt.text || '');
  const forbiddenUpgrade = profile.forbidden_status_upgrades.find((status) =>
    claimedUpgrades.includes(status) || new RegExp(`\\b${status}\\b`).test(text)
  );
  if (forbiddenUpgrade) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.STATUS_UPGRADE_FORBIDDEN',
      `receipt presence cannot upgrade ${forbiddenUpgrade}`,
      'receipt.claimed_status_upgrades'
    ));
  }

  if (receipt.machine_trace_action && receipt.machine_trace_action !== 'preserve') {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.MACHINE_TRACE_IMMUTABLE',
      'receipt must preserve machine trace and must not replace, repair, or mutate it',
      'receipt.machine_trace_action'
    ));
  }

  if (
    receipt.technical_details_visible_by_default === true &&
    receipt.technical_details_actionable !== true
  ) {
    diagnostics.push(diagnostic(
      'EV4.RECEIPT.TECHNICAL_DETAILS_NOT_ACTIONABLE',
      'technical identifiers should be visible by default only when actionable',
      'receipt.technical_details_visible_by_default',
      'warning'
    ));
  }

  const sorted = sortDiagnostics(diagnostics);
  const hasError = sorted.some((item) => item.severity === 'error');
  return {
    result: hasError ? 'blocked' : sorted.length > 0 ? 'warning' : 'success',
    diagnostics: sorted
  };
}

function fixturePaths(directory) {
  return readdirSync(join(repoRoot, directory), { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
    .map((entry) => `${directory}/${entry.name}`)
    .sort();
}

function runFixture(fixturePath, profile) {
  const fixture = readJson(fixturePath);
  const actual = validateReceiptCase(fixture.input, profile);
  const expectedResult = fixture.expected?.result;
  const expectedCodes = Array.isArray(fixture.expected?.diagnostics)
    ? fixture.expected.diagnostics
    : [];
  const actualCodes = new Set(actual.diagnostics.map((item) => item.code));
  const missingCodes = expectedCodes.filter((code) => !actualCodes.has(code));
  const unexpectedSuccessDiagnostic = expectedResult === 'success' && actual.diagnostics.length > 0;
  const pass =
    actual.result === expectedResult &&
    missingCodes.length === 0 &&
    !unexpectedSuccessDiagnostic;
  return {
    fixture_id: fixture.fixture_id,
    path: fixturePath,
    expectedResult,
    expectedCodes,
    actual,
    missingCodes,
    pass
  };
}

function formatDiagnostic(item) {
  return `${item.code} [${item.severity}] ${item.path}: ${item.message}`;
}

const output = ['Consumer Decision Receipt Safety Profile validator summary'];
let failed = false;
let profile;
let validateProfile;

try {
  profile = readJson(profilePath);
  const schema = readJson(schemaPath);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  validateProfile = ajv.compile(schema);
  const diagnostics = profileDiagnostics(profile, validateProfile);
  if (diagnostics.length > 0) {
    failed = true;
    output.push('Profile schema + invariants: FAIL');
    output.push(...diagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
  } else {
    output.push('Profile schema + invariants: PASS');
  }
} catch (error) {
  failed = true;
  output.push('Profile schema + invariants: FAIL');
  output.push(`  - EV4.RECEIPT.PROFILE_READ_OR_COMPILE_FAILED [error] ${schemaPath}: ${error.message}`);
}

let fixtureResults = [];
if (profile && validateProfile && !failed) {
  try {
    const paths = [
      ...fixturePaths(validFixtureDirectory),
      ...fixturePaths(invalidFixtureDirectory)
    ];
    fixtureResults = paths.map((path) => runFixture(path, profile));
    for (const result of fixtureResults) {
      if (!result.pass) {
        failed = true;
        output.push(`${result.path}: FAIL`);
        output.push(`  - expected result: ${result.expectedResult}`);
        output.push(`  - actual result: ${result.actual.result}`);
        if (result.missingCodes.length > 0) {
          output.push(`  - missing expected diagnostics: ${result.missingCodes.join(', ')}`);
        }
        output.push(...result.actual.diagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
      }
    }
  } catch (error) {
    failed = true;
    output.push('Fixture execution: FAIL');
    output.push(`  - EV4.RECEIPT.FIXTURE_READ_OR_PARSE_FAILED [error]: ${error.message}`);
  }
}

const validResults = fixtureResults.filter((item) => item.path.includes('/valid/'));
const invalidResults = fixtureResults.filter((item) => item.path.includes('/invalid/'));
output.push(`Valid receipt fixtures passed: ${validResults.filter((item) => item.pass).length}/${validResults.length}`);
output.push(`Invalid receipt fixtures failed closed with expected diagnostics: ${invalidResults.filter((item) => item.pass).length}/${invalidResults.length}`);
output.push('Invalid fixture diagnostic assertions:');
for (const result of invalidResults) {
  output.push(`  - ${result.path}: ${result.pass ? 'PASS' : 'FAIL'} [${result.expectedCodes.join(', ')}]`);
}
output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
console.log(output.join('\n'));
process.exit(failed ? 1 : 0);

export {
  validateReceiptCase,
  profileDiagnostics,
  canonicalize,
  canonicallyEqual
};
