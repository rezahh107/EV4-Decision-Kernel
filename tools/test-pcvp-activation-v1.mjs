import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateActivationRecord } from '../kernel/validator/pcvp-activation-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const record = JSON.parse(readFileSync(path.join(ROOT, 'kernel/pcvp/pcvp-activation.v1.json'), 'utf8'));
const schema = JSON.parse(readFileSync(path.join(ROOT, 'kernel/pcvp/pcvp-activation.v1.schema.json'), 'utf8'));

function clone(value) {
  return structuredClone(value);
}

function expectFailure(candidate, code) {
  const result = validateActivationRecord(candidate, schema);
  assert.equal(result.result, 'FAIL');
  assert(
    result.diagnostics.some((item) => item.code === code),
    `${code} not observed: ${JSON.stringify(result.diagnostics)}`,
  );
}

assert.equal(validateActivationRecord(record, schema).result, 'PASS');

{
  const candidate = clone(record);
  candidate.prerequisites.pop();
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_MINITEMS');
}

{
  const candidate = clone(record);
  candidate.prerequisites[1].exact_head_sha = '0'.repeat(40);
  expectFailure(candidate, 'PCVP_PREREQUISITE_IDENTITY_MISMATCH');
}

{
  const candidate = clone(record);
  candidate.prerequisites[2].exact_head_ci_passed = false;
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_CONST');
}

{
  const candidate = clone(record);
  candidate.activation_scope.enabled_edges = ['CE_TO_BUILDER'];
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_ENUM');
}

{
  const candidate = clone(record);
  candidate.runtime_authorization.ce_to_builder_emission = true;
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_CONST');
}

{
  const candidate = clone(record);
  candidate.full_rollout_authorized = true;
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_CONST');
}

{
  const candidate = clone(record);
  candidate.authority_boundaries.project_gate_pass_created = true;
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_CONST');
}

{
  const candidate = clone(record);
  candidate.bounded_non_blocking_trial.production_run = true;
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_CONST');
}

{
  const candidate = clone(record);
  candidate.rollback.weakens_legacy_validation = true;
  expectFailure(candidate, 'PCVP_ACTIVATION_SCHEMA_CONST');
}

console.log(JSON.stringify({
  result: 'PASS',
  canonical_case: 1,
  fail_closed_mutations: 9,
  enabled_edge: record.activation_scope.enabled_edges[0],
  full_rollout_authorized: record.full_rollout_authorized,
}, null, 2));
