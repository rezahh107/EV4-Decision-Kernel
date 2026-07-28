import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { evaluatePcvpCarrier, validatePcvpBundle } from '../kernel/validator/pcvp-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE_ROOT = path.join(ROOT, 'kernel/pcvp/v1.0.0/bundle');
const validation = validatePcvpBundle(BUNDLE_ROOT);
assert.equal(validation.result, 'PASS');
assert.equal(validation.fixtures.total, 18);
assert.equal(validation.fixtures.valid, 8);
assert.equal(validation.fixtures.invalid, 10);
assert.equal(validation.fixtures.all_passed_at_declared_layer, true);

function readFixture(relative) {
  return JSON.parse(readFileSync(path.join(BUNDLE_ROOT, '05-FIXTURES', relative), 'utf8'));
}

function clone(value) {
  return structuredClone(value);
}

function expectLayer(document, layer, code) {
  const result = evaluatePcvpCarrier(document, validation.validateCarrier);
  assert.equal(result.observed_layer, layer);
  if (code) assert(result.diagnostics.some((item) => item.code === code), `${code} not observed`);
}

const verifiedGreen = readFixture('valid/01_verified_green.json');
const ownerAuthorized = readFixture('valid/02_owner_authorized_provisional.json');
const contradictedRed = readFixture('valid/06_contradicted_blocked_red.json');

{
  const candidate = clone(verifiedGreen);
  candidate.continuation_assurance.effects[0].effect_id = candidate.continuation_assurance.claims[0].claim_id;
  candidate.continuation_assurance.stage_summary.current_effect_id = candidate.continuation_assurance.effects[0].effect_id;
  candidate.continuation_assurance.authorizations[0].allowed_effect_ids = [candidate.continuation_assurance.effects[0].effect_id];
  expectLayer(candidate, 'CROSS_RECORD', 'PCVP_ID_NOT_GLOBALLY_UNIQUE');
}

{
  const candidate = clone(ownerAuthorized);
  candidate.continuation_assurance.effects[0].depends_on_claim_ids = ['CLM-MISSING'];
  candidate.continuation_assurance.stage_summary.derived_from_claim_ids = [];
  expectLayer(candidate, 'CROSS_RECORD', 'PCVP_EFFECT_CLAIM_REF_UNRESOLVED');
}

{
  const candidate = clone(ownerAuthorized);
  candidate.continuation_assurance.authorizations[0].status = 'REVOKED';
  expectLayer(candidate, 'CROSS_RECORD', 'PCVP_EFFECT_AUTH_NOT_ACTIVE');
}

{
  const candidate = clone(ownerAuthorized);
  candidate.continuation_assurance.authorizations[0].permitted_scope = 'different scope';
  expectLayer(candidate, 'CROSS_RECORD', 'PCVP_EFFECT_AUTH_SCOPE_MISMATCH');
}

{
  const candidate = clone(ownerAuthorized);
  candidate.continuation_assurance.stage_summary.current_effect_id = 'EFF-MISSING';
  expectLayer(candidate, 'CROSS_RECORD', 'PCVP_SUMMARY_EFFECT_REF_UNRESOLVED');
}

{
  const candidate = clone(ownerAuthorized);
  candidate.continuation_assurance.claims.push({
    claim_id: 'CLM-EXTRA',
    statement: 'Unrelated claim',
    criticality: 'INFORMATIONAL',
    applicability_state: 'APPLICABLE',
    verification_state: 'UNVERIFIED',
    lifecycle_state: 'ACTIVE',
    evidence_refs: [],
    dependency_refs: [],
    assumption_refs: [],
  });
  candidate.continuation_assurance.stage_summary.derived_from_claim_ids = ['CLM-EXTRA'];
  expectLayer(candidate, 'CROSS_RECORD', 'PCVP_SUMMARY_CLAIM_NOT_EFFECT_DEPENDENCY');
}

{
  const candidate = clone(contradictedRed);
  candidate.continuation_assurance.effects[0].continuation_state = 'AUTHORIZATION_REQUIRED';
  candidate.continuation_assurance.effects[0].blocker_reason = 'OWNER_DECISION_REQUIRED';
  candidate.continuation_assurance.stage_summary.owner_projection = 'YELLOW';
  candidate.continuation_assurance.stage_summary.yellow_substate = 'OWNER_CHOICE_REQUIRED';
  expectLayer(candidate, 'SEMANTIC_POLICY', 'PCVP_CONTRADICTED_CRITICAL_EFFECT_NOT_BLOCKED');
}

{
  const candidate = clone(ownerAuthorized);
  candidate.continuation_assurance.stage_summary.owner_projection = 'GREEN';
  candidate.continuation_assurance.stage_summary.yellow_substate = null;
  expectLayer(candidate, 'SEMANTIC_POLICY', 'PCVP_GREEN_PROJECTION_INVALID');
}

{
  const candidate = clone(ownerAuthorized);
  candidate.continuation_assurance.stage_summary.yellow_substate = 'OWNER_CHOICE_REQUIRED';
  expectLayer(candidate, 'SEMANTIC_POLICY', 'PCVP_YELLOW_PROJECTION_INVALID');
}

console.log(JSON.stringify({
  result: 'PASS',
  indexed_fixture_cases: validation.fixtures.total,
  focused_mutation_cases: 9,
  exact_head: 'LOCAL_STAGING_NOT_REMOTE_HEAD',
  activation_effect: 'NONE',
}, null, 2));
