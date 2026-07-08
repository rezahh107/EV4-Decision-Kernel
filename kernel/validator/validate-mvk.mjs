#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const coreElementIds = [
  'v4.div_block',
  'v4.flexbox',
  'v4.grid',
  'v4.heading',
  'v4.paragraph',
  'v4.button',
  'v4.image',
  'v4.svg'
];

const fixturePlan = [
  ['valid/element_decision_svg_absolute_valid.json', 'element_decision_record', false],
  ['valid/ce_closure_builder_ready_valid.json', 'ce_decision_closure', false],
  ['valid/builder_resolution_emit_action_valid.json', 'builder_resolution_result', false],
  ['valid/project_gate_acceptance_packet_valid.json', 'project_gate_acceptance_packet', false],
  ['invalid/absolute_without_containing_block_invalid.json', 'position_decision_record', true],
  ['invalid/nested_clickable_topology_invalid.json', 'builder_resolution_result', true],
  ['invalid/builder_ready_without_ce_closure_invalid.json', 'builder_resolution_result', true],
  ['invalid/project_gate_missing_kernel_pin_invalid.json', 'project_gate_acceptance_packet', true],
  ['invalid/unlisted_builder_fallback_invalid.json', 'builder_resolution_result', true],
  ['invalid/builder_button_inside_clickable_ancestor_invalid.json', 'builder_resolution_result', true],
  ['invalid/builder_button_with_clickable_descendant_invalid.json', 'builder_resolution_result', true],
  ['invalid/builder_missing_interaction_topology_invalid.json', 'builder_resolution_result', true],
  ['invalid/builder_linked_image_inside_clickable_ancestor_invalid.json', 'builder_resolution_result', true],
  ['invalid/project_gate_malformed_kernel_pin_invalid.json', 'project_gate_acceptance_packet', true]
];

const elementRegistryById = new Map();

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(repoRoot, pathFromRoot), 'utf8'));
}

function failWhen(errors, condition, message) {
  if (condition) errors.push(message);
}

function hasItems(value) {
  return Array.isArray(value) && value.length > 0;
}

function hasText(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function requireFields(record, fields, errors, label) {
  for (const field of fields) {
    failWhen(errors, !isObject(record) || !(field in record), `${label}: missing ${field}`);
  }
}

function validateRegistries() {
  const errors = [];
  let elements;
  let constraints;
  let manifest;

  elementRegistryById.clear();

  try {
    elements = readJson('kernel/registries/elements.core.v0.json');
    constraints = readJson('kernel/registries/constraints.core.v0.json');
    manifest = readJson('kernel/registries/registry-manifest.v0.json');
  } catch (error) {
    errors.push(`failed to read or parse registry files: ${error.message}`);
    return errors;
  }

  if (!isObject(elements) || !Array.isArray(elements.elements)) {
    errors.push('elements.core.v0.json: missing or invalid elements array');
    return errors;
  }
  if (!isObject(constraints) || !Array.isArray(constraints.constraints)) {
    errors.push('constraints.core.v0.json: missing or invalid constraints array');
    return errors;
  }
  if (!isObject(manifest) || !Array.isArray(manifest.registries)) {
    errors.push('registry-manifest.v0.json: missing or invalid registries array');
    return errors;
  }

  const ids = elements.elements.map((entry) => entry.element_id);
  const uniqueIds = new Set(ids);

  failWhen(errors, ids.length !== 8 || uniqueIds.size !== 8, 'element IDs must be unique and limited to eight MVK IDs');
  for (const id of coreElementIds) {
    failWhen(errors, !uniqueIds.has(id), `missing core element ID: ${id}`);
  }

  for (const entry of elements.elements) {
    const label = entry?.element_id || 'element';
    requireFields(entry, ['element_id', 'display_name', 'element_generation', 'category', 'semantic_roles', 'meaningful_content_allowed', 'interactive_capability', 'requires_pro', 'requires_permission', 'status', 'evidence'], errors, label);
    failWhen(errors, !hasItems(entry?.semantic_roles), `${label}: semantic_roles required`);
    failWhen(errors, !hasItems(entry?.evidence), `${label}: evidence required`);
    if (hasText(entry?.element_id)) elementRegistryById.set(entry.element_id, entry);
  }

  failWhen(errors, constraints.constraints.length !== 6, 'expected six MVK constraints');
  failWhen(errors, !hasItems(manifest.registries), 'registry manifest must list registries');
  return errors;
}

function elementIsInteractive(record) {
  const entry = elementRegistryById.get(record.selected_element_id);
  const capability = entry?.interactive_capability;
  if (capability === 'primary_click_action') return true;
  return record.interaction_topology?.self_interactive === true || record.interaction_topology?.self_link_enabled === true;
}

function validateInteractionTopology(record, errors) {
  if (!('selected_element_id' in record)) return;

  const topology = record.interaction_topology;
  failWhen(errors, !topology, 'interaction_topology is required for records with selected_element_id');
  if (!topology) return;

  requireFields(topology, ['clickable_ancestor', 'clickable_descendant'], errors, 'interaction_topology');
  const selfInteractive = elementIsInteractive(record);
function validateInteractionTopology(record, errors) {
  const topology = record.interaction_topology;
  const label = record.record_type || 'record';
  if (!topology) {
    errors.push(`${label}: missing interaction_topology`);
    return;
  }
  const isClickable = record.selected_element_id === 'v4.button';
  const hasAncestor = topology.clickable_ancestor === true;
  const hasDescendant = topology.clickable_descendant === true;
  failWhen(
    errors,
    (hasAncestor && hasDescendant) || (isClickable && (hasAncestor || hasDescendant)),
    'nested clickable topology rejected'
  );
}

function validateElementDecision(record) {
  const errors = [];
  requireFields(record, ['decision_id', 'node_id', 'selected_element_id', 'candidate_elements', 'rejected_alternatives', 'selection_reasons', 'required_capabilities', 'evidence_refs', 'decision_owner', 'decision_status', 'interaction_topology'], errors, 'element_decision_record');
  failWhen(errors, !coreElementIds.includes(record.selected_element_id), 'selected_element_id must be a core MVK element ID');
  failWhen(errors, record.decision_owner !== 'architect', 'element decision owner must be architect');
  failWhen(errors, !hasItems(record.candidate_elements) || !record.candidate_elements.some((candidate) => candidate.element_id === record.selected_element_id && candidate.fit_status === 'selected'), 'selected element must appear as selected candidate');
  validateInteractionTopology(record, errors);
  return errors;
}

function validatePositionDecision(record) {
  const errors = [];
  requireFields(record, ['decision_id', 'node_id', 'selected_position', 'candidates', 'rejected_positions', 'containing_block_required', 'evidence_refs', 'decision_status'], errors, 'position_decision_record');
  if (record.selected_position === 'absolute') {
    failWhen(errors, record.containing_block_required !== true, 'absolute position requires containing_block_required=true');
    failWhen(errors, !record.containing_block_proof, 'absolute position requires containing_block_proof');
  }
  return errors;
}

function validateCeClosure(record) {
  const errors = [];
  requireFields(record, ['closure_id', 'architect_decision_refs', 'constructability_status', 'architecture_decisions_open', 'constructability_decisions_open', 'bounded_execution_details_open', 'runtime_evidence_open', 'builder_ready', 'evidence_refs', 'repair_route_if_blocked'], errors, 'ce_decision_closure');
  if (record.builder_ready === true) {
    failWhen(errors, record.architecture_decisions_open !== 0, 'builder_ready requires architecture_decisions_open=0');
    failWhen(errors, record.constructability_decisions_open !== 0, 'builder_ready requires constructability_decisions_open=0');
    failWhen(errors, record.constructability_status !== 'proven', 'builder_ready requires constructability_status=proven');
  }
  return errors;
}

function validateBuilderResolution(record) {
  const errors = [];
  requireFields(record, ['resolution_id', 'action_id', 'target_node', 'selected_element_id', 'decision_ref', 'ce_closure_ref', 'control_resolution', 'value_unit_resolution', 'position_resolution', 'decision', 'interaction_topology'], errors, 'builder_resolution_result');
  failWhen(errors, !coreElementIds.includes(record.selected_element_id), 'selected_element_id must be a core MVK element ID');
  if (record.decision === 'emit_action') {
    failWhen(errors, !hasText(record.decision_ref), 'emit_action requires decision_ref');
    failWhen(errors, !hasText(record.ce_closure_ref), 'emit_action requires ce_closure_ref');
    failWhen(errors, !hasText(record.control_resolution?.locked_decision_ref), 'emit_action requires locked decision reference');
  }
  const proof = record.position_resolution?.relative_parent_proof;
  if (proof) {
    failWhen(errors, proof.proof_present !== true, 'relative_parent_proof must be true when present');
  }
  if (record.fallback_policy?.fallback_used) {
    failWhen(errors, !coreElementIds.includes(record.fallback_policy.fallback_element_id), 'unlisted fallback is invalid');
    failWhen(errors, record.fallback_policy.fallback_element_id !== record.selected_element_id, 'fallback substitution is invalid');
  }
  validateInteractionTopology(record, errors);
  return errors;
}

function validateKernelPin(pin, errors, label) {
  if (!isObject(pin)) {
    errors.push(`${label}: kernel_pin must be an object`);
    return;
  }

  requireFields(pin, ['kernel_version', 'kernel_source_commit', 'registry_manifest_ref', 'registry_manifest_sha256', 'compatibility_profile'], errors, `${label}.kernel_pin`);
  failWhen(errors, !hasText(pin.kernel_version), `${label}.kernel_pin: kernel_version must be a non-empty string`);
  failWhen(errors, !/^[a-f0-9]{40}$/i.test(pin.kernel_source_commit || ''), `${label}.kernel_pin: kernel_source_commit must be a 40-character hex string`);
  failWhen(errors, !hasText(pin.registry_manifest_ref), `${label}.kernel_pin: registry_manifest_ref must be a non-empty string`);
  failWhen(errors, !/^[a-f0-9]{64}$/i.test(pin.registry_manifest_sha256 || ''), `${label}.kernel_pin: registry_manifest_sha256 must be a 64-character hex string`);

  if (!isObject(pin.compatibility_profile)) {
    errors.push(`${label}.kernel_pin: compatibility_profile must be an object`);
    return;
  }

  requireFields(pin.compatibility_profile, ['profile_id', 'consumer_stage'], errors, `${label}.kernel_pin.compatibility_profile`);
  failWhen(errors, !hasText(pin.compatibility_profile.profile_id), `${label}.kernel_pin.compatibility_profile: profile_id must be a non-empty string`);
  failWhen(errors, !hasText(pin.compatibility_profile.consumer_stage), `${label}.kernel_pin.compatibility_profile: consumer_stage must be a non-empty string`);
}

function validateProjectGatePacket(record) {
  const errors = [];
  requireFields(record, ['packet_id', 'kernel_pin', 'input_artifact_refs', 'validation_reports', 'lineage', 'gate_decision'], errors, 'project_gate_acceptance_packet');
  failWhen(errors, 'selected_element_id' in record || 'selected_position' in record || 'candidate_elements' in record, 'Project Gate packet must not contain design-choice fields');
  if (record.kernel_pin) validateKernelPin(record.kernel_pin, errors, 'project_gate_acceptance_packet');
  if (record.gate_decision === 'accept') {
    failWhen(errors, !record.kernel_pin, 'accept requires kernel_pin');
    failWhen(errors, !hasItems(record.validation_reports) || !record.validation_reports.some((report) => report.status === 'passed'), 'accept requires at least one passed validation report');
  }
  return errors;
}

const validators = {
  element_decision_record: validateElementDecision,
  position_decision_record: validatePositionDecision,
  ce_decision_closure: validateCeClosure,
  builder_resolution_result: validateBuilderResolution,
  project_gate_acceptance_packet: validateProjectGatePacket
};

const output = ['MVK validator summary'];
let failed = false;
const registryErrors = validateRegistries();
if (registryErrors.length > 0) {
  failed = true;
  output.push('Registries: FAIL', ...registryErrors.map((error) => `  - ${error}`));
} else {
  output.push('Registries: PASS');
}

let validPassed = 0;
let invalidFailed = 0;
const expectedValid = fixturePlan.filter(([, , shouldFail]) => !shouldFail).length;
const expectedInvalid = fixturePlan.filter(([, , shouldFail]) => shouldFail).length;
for (const [fixturePath, validatorName, shouldFail] of fixturePlan) {
  const record = readJson(`kernel/fixtures/${fixturePath}`);
  const errors = validators[validatorName](record);
  if (!shouldFail && errors.length === 0) validPassed += 1;
  else if (shouldFail && errors.length > 0) invalidFailed += 1;
  else {
    failed = true;
    output.push(`${fixturePath}: ${shouldFail ? 'unexpected PASS' : 'FAIL'}`);
    output.push(...errors.map((error) => `  - ${error}`));
  }
}

output.push(`Valid fixtures passed: ${validPassed}/${expectedValid}`);
output.push(`Invalid fixtures failed as expected: ${invalidFailed}/${expectedInvalid}`);
output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
console.log(output.join('\n'));
process.exit(failed ? 1 : 0);
