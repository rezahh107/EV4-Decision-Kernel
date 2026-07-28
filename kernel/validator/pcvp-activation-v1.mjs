import Ajv2020 from 'ajv/dist/2020.js';

export const ACTIVATION_ID = 'EV4-PCVP-ACT-ARCH-PG-CE-20260728-R1';
export const ENABLED_EDGE = 'ARCHITECT_TO_PROJECT_GATE_TO_CE';
export const DISABLED_EDGES = Object.freeze([
  'BUILDER_TO_RESPONSIVE',
  'CE_TO_BUILDER',
  'RESPONSIVE_TO_FINAL',
]);

export const EXPECTED_PREREQUISITES = Object.freeze({
  CANONICAL_FOUNDATION: Object.freeze({
    repository: 'rezahh107/EV4-Decision-Kernel',
    pull_request: 54,
    exact_head_sha: '029e646f2f45f8b33563198dfe80ffade279cf30',
    merge_commit_sha: '03336312f6c3fcc4c315e56592bac3bac0bf7465',
    evidence_run_ids: Object.freeze([30243953834]),
  }),
  PROJECT_GATE_TOLERANT_READER: Object.freeze({
    repository: 'rezahh107/EV4-Project-Gate',
    pull_request: 64,
    exact_head_sha: '3fb55b7e6e705f828a9cc9398596cf5c8a0ea668',
    merge_commit_sha: '89411685922cb956b8bd46dc5b75d410c91695c1',
    evidence_run_ids: Object.freeze([30296158479, 30296158661]),
  }),
  CE_TOLERANT_CONSUMER: Object.freeze({
    repository: 'rezahh107/EV4-Constructability-Engineer-Repo',
    pull_request: 47,
    exact_head_sha: '20cfc352a75754923bac0fe76efd02de0eb616d4',
    merge_commit_sha: 'bc4a901d82fcdbdb131e30058b399508262706c5',
    evidence_run_ids: Object.freeze([30350235353, 30350235890]),
  }),
  BUILDER_TOLERANT_CONSUMER: Object.freeze({
    repository: 'rezahh107/EV4-Builder-Assistant-Repo',
    pull_request: 68,
    exact_head_sha: 'd7561ac874ad2850e48cb057d4009fba0a08c417',
    merge_commit_sha: '8d0c0521c6ce2148ce351666ba20895975a19c1c',
    evidence_run_ids: Object.freeze([30275887318]),
  }),
  RESPONSIVE_TOLERANT_CONSUMER: Object.freeze({
    repository: 'rezahh107/EV4-Responsive-Architect',
    pull_request: 191,
    exact_head_sha: 'b6d269d12f0809514dd9fbb15429af94721a1c32',
    merge_commit_sha: '261f87c4496bdd4e1a5184076974f9a850767c20',
    evidence_run_ids: Object.freeze([30348251382, 30348251684]),
  }),
  ARCHITECT_DORMANT_PRODUCER: Object.freeze({
    repository: 'rezahh107/EV4-Architect-Repo',
    pull_request: 43,
    exact_head_sha: 'a74bf709b93bcc08bc6969a0a34002ff529d16f0',
    merge_commit_sha: '1e61f4aa9485d98791780487eccdac5bb7fd4b2d',
    evidence_run_ids: Object.freeze([30278322110]),
  }),
  ARCHITECT_STAGE_QC_DORMANT_AUTHORITY: Object.freeze({
    repository: 'rezahh107/EV4-Architect-Stage-QC',
    pull_request: 10,
    exact_head_sha: 'dcfc115cf2bae9770c2526469eea1346c5175c92',
    merge_commit_sha: '849fbff5372e9de5273669a26402de44d4bdb90f',
    evidence_run_ids: Object.freeze([30294970496]),
  }),
});

function diagnostic(layer, code, subject, detail) {
  return { layer, code, subject, detail };
}

function sorted(values) {
  return [...values].sort();
}

function sameArray(left, right) {
  return JSON.stringify(sorted(left)) === JSON.stringify(sorted(right));
}

export function validateActivationRecord(record, schema) {
  const diagnostics = [];
  let validate;
  try {
    validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);
  } catch (error) {
    return {
      result: 'FAIL',
      diagnostics: [diagnostic('SCHEMA', 'PCVP_ACTIVATION_SCHEMA_COMPILE_FAILED', 'schema', error.message)],
    };
  }

  if (!validate(record)) {
    for (const error of validate.errors ?? []) {
      diagnostics.push(diagnostic(
        'JSON_SCHEMA',
        `PCVP_ACTIVATION_SCHEMA_${String(error.keyword).toUpperCase()}`,
        error.instancePath || '/',
        error.message ?? 'activation schema validation failed',
      ));
    }
    return { result: 'FAIL', diagnostics };
  }

  if (record.activation_id !== ACTIVATION_ID) {
    diagnostics.push(diagnostic('ACTIVATION_AUTHORITY', 'PCVP_ACTIVATION_ID_MISMATCH', 'activation_id', record.activation_id));
  }

  if (!sameArray(record.activation_scope.enabled_edges, [ENABLED_EDGE])) {
    diagnostics.push(diagnostic('ACTIVATION_SCOPE', 'PCVP_ENABLED_EDGE_SET_INVALID', 'activation_scope.enabled_edges', JSON.stringify(record.activation_scope.enabled_edges)));
  }
  if (!sameArray(record.activation_scope.disabled_edges, DISABLED_EDGES)) {
    diagnostics.push(diagnostic('ACTIVATION_SCOPE', 'PCVP_DISABLED_EDGE_SET_INVALID', 'activation_scope.disabled_edges', JSON.stringify(record.activation_scope.disabled_edges)));
  }

  const observedRoles = record.prerequisites.map((item) => item.role);
  const expectedRoles = Object.keys(EXPECTED_PREREQUISITES);
  if (!sameArray(observedRoles, expectedRoles) || new Set(observedRoles).size !== observedRoles.length) {
    diagnostics.push(diagnostic('PREREQUISITE', 'PCVP_PREREQUISITE_ROLE_SET_INVALID', 'prerequisites', JSON.stringify(observedRoles)));
  }

  const byRole = new Map(record.prerequisites.map((item) => [item.role, item]));
  for (const [role, expected] of Object.entries(EXPECTED_PREREQUISITES)) {
    const observed = byRole.get(role);
    if (!observed) {
      diagnostics.push(diagnostic('PREREQUISITE', 'PCVP_PREREQUISITE_MISSING', role, 'required prerequisite absent'));
      continue;
    }
    for (const key of ['repository', 'pull_request', 'exact_head_sha', 'merge_commit_sha']) {
      if (observed[key] !== expected[key]) {
        diagnostics.push(diagnostic('PREREQUISITE', 'PCVP_PREREQUISITE_IDENTITY_MISMATCH', `${role}.${key}`, `${observed[key]} != ${expected[key]}`));
      }
    }
    if (observed.merged !== true || observed.exact_head_ci_passed !== true) {
      diagnostics.push(diagnostic('PREREQUISITE', 'PCVP_PREREQUISITE_NOT_READY', role, 'merged and exact-head CI evidence are required'));
    }
    if (!sameArray(observed.evidence_run_ids, expected.evidence_run_ids)) {
      diagnostics.push(diagnostic('PREREQUISITE', 'PCVP_PREREQUISITE_RUN_SET_MISMATCH', role, JSON.stringify(observed.evidence_run_ids)));
    }
  }

  const trial = record.bounded_non_blocking_trial;
  const architect = EXPECTED_PREREQUISITES.ARCHITECT_DORMANT_PRODUCER;
  if (
    trial.completed !== true
    || trial.source_repository !== architect.repository
    || trial.pull_request !== architect.pull_request
    || trial.exact_head_sha !== architect.exact_head_sha
    || trial.evidence_run_id !== architect.evidence_run_ids[0]
    || trial.path !== ENABLED_EDGE
    || trial.carrier_emission_mode !== 'dormant_fixture_integration'
    || trial.production_run !== false
  ) {
    diagnostics.push(diagnostic('PREREQUISITE', 'PCVP_BOUNDED_TRIAL_EVIDENCE_INVALID', 'bounded_non_blocking_trial', 'trial must bind the reviewed Architect dormant cross-boundary evidence without claiming production use'));
  }

  if (
    record.full_rollout_authorized !== false
    || record.runtime_authorization.ce_to_builder_emission !== false
    || record.runtime_authorization.builder_to_responsive_emission !== false
    || record.runtime_authorization.responsive_to_final_emission !== false
  ) {
    diagnostics.push(diagnostic('ACTIVATION_SCOPE', 'PCVP_DOWNSTREAM_ACTIVATION_FORBIDDEN', 'runtime_authorization', 'downstream producer edges must remain disabled'));
  }

  if (
    record.authority_boundaries.runtime_correctness_created !== false
    || record.authority_boundaries.project_gate_pass_created !== false
    || record.authority_boundaries.ce_correctness_created !== false
    || record.authority_boundaries.production_readiness_created !== false
    || record.authority_boundaries.official_verification_replacement !== false
  ) {
    diagnostics.push(diagnostic('AUTHORITY_BOUNDARY', 'PCVP_ACTIVATION_AUTHORITY_OVERREACH', 'authority_boundaries', 'activation may authorize transport/emission only; it cannot create correctness or verification evidence'));
  }

  if (
    record.rollback.strategy !== 'dedicated_canonical_activation_reversal'
    || record.rollback.requires_history_rewrite !== false
    || record.rollback.deletes_canonical_evidence !== false
    || record.rollback.accepts_invalid_carriers !== false
    || record.rollback.weakens_legacy_validation !== false
  ) {
    diagnostics.push(diagnostic('ROLLBACK', 'PCVP_ROLLBACK_CONTRACT_INVALID', 'rollback', 'rollback must be explicit, non-destructive, and validation-preserving'));
  }

  return {
    result: diagnostics.length ? 'FAIL' : 'PASS',
    diagnostics,
    activation_scope: record.activation_scope,
    runtime_authorization: record.runtime_authorization,
  };
}
