#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

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

const schemaMap = {
  element_decision_record: 'kernel/schemas/element-decision-record.schema.json',
  position_decision_record: 'kernel/schemas/position-decision-record.schema.json',
  value_unit_decision_record: 'kernel/schemas/value-unit-decision-record.schema.json',
  ce_decision_closure: 'kernel/schemas/ce-decision-closure.schema.json',
  builder_resolution_result: 'kernel/schemas/builder-resolution-result.schema.json',
  project_gate_acceptance_packet: 'kernel/schemas/project-gate-acceptance-packet.schema.json',
  kernel_pin: 'kernel/schemas/kernel-pin.schema.json',
  evidence: 'kernel/schemas/evidence.schema.json'
};

const fixturePlan = [
  {
    path: 'valid/element_decision_svg_absolute_valid.json',
    kind: 'element_decision_record',
    shouldFail: false,
    expectedCodes: []
  },
  {
    path: 'valid/position_decision_absolute_with_containing_block_valid.json',
    kind: 'position_decision_record',
    shouldFail: false,
    expectedCodes: []
  },
  {
    path: 'valid/ce_closure_builder_ready_valid.json',
    kind: 'ce_decision_closure',
    shouldFail: false,
    expectedCodes: []
  },
  {
    path: 'valid/builder_resolution_emit_action_valid.json',
    kind: 'builder_resolution_result',
    shouldFail: false,
    expectedCodes: []
  },
  {
    path: 'valid/project_gate_acceptance_packet_valid.json',
    kind: 'project_gate_acceptance_packet',
    shouldFail: false,
    expectedCodes: []
  },
  {
    path: 'invalid/absolute_without_containing_block_invalid.json',
    kind: 'position_decision_record',
    shouldFail: true,
    expectedCodes: ['ABSOLUTE_REQUIRES_CONTAINING_BLOCK_PROOF']
  },
  {
    path: 'invalid/nested_clickable_topology_invalid.json',
    kind: 'builder_resolution_result',
    shouldFail: true,
    expectedCodes: ['NESTED_CLICKABLE_TOPOLOGY_REJECTED']
  },
  {
    path: 'invalid/builder_ready_without_ce_closure_invalid.json',
    kind: 'builder_resolution_result',
    shouldFail: true,
    expectedCodes: ['BUILDER_READY_REQUIRES_CE_CLOSURE']
  },
  {
    path: 'invalid/project_gate_missing_kernel_pin_invalid.json',
    kind: 'project_gate_acceptance_packet',
    shouldFail: true,
    expectedCodes: ['KERNEL_PIN_REQUIRED']
  },
  {
    path: 'invalid/unlisted_builder_fallback_invalid.json',
    kind: 'builder_resolution_result',
    shouldFail: true,
    expectedCodes: ['BUILDER_FALLBACK_ELEMENT_NOT_LISTED']
  },
  {
    path: 'invalid/builder_button_inside_clickable_ancestor_invalid.json',
    kind: 'builder_resolution_result',
    shouldFail: true,
    expectedCodes: ['INTERACTIVE_ELEMENT_INSIDE_CLICKABLE_ANCESTOR']
  },
  {
    path: 'invalid/builder_button_with_clickable_descendant_invalid.json',
    kind: 'builder_resolution_result',
    shouldFail: true,
    expectedCodes: ['INTERACTIVE_ELEMENT_WITH_CLICKABLE_DESCENDANT']
  },
  {
    path: 'invalid/builder_missing_interaction_topology_invalid.json',
    kind: 'builder_resolution_result',
    shouldFail: true,
    expectedCodes: ['INTERACTION_TOPOLOGY_REQUIRED']
  },
  {
    path: 'invalid/builder_linked_image_inside_clickable_ancestor_invalid.json',
    kind: 'builder_resolution_result',
    shouldFail: true,
    expectedCodes: ['INTERACTIVE_ELEMENT_INSIDE_CLICKABLE_ANCESTOR']
  },
  {
    path: 'invalid/project_gate_malformed_kernel_pin_invalid.json',
    kind: 'project_gate_acceptance_packet',
    shouldFail: true,
    expectedCodes: [
      'KERNEL_PIN_VERSION_REQUIRED',
      'KERNEL_PIN_COMMIT_SHA_INVALID',
      'KERNEL_PIN_MANIFEST_REF_REQUIRED',
      'KERNEL_PIN_MANIFEST_SHA256_INVALID',
      'KERNEL_PIN_PROFILE_ID_REQUIRED',
      'KERNEL_PIN_CONSUMER_STAGE_REQUIRED'
    ]
  },
  {
    path: 'invalid/element_decision_selected_candidate_mismatch_invalid.json',
    kind: 'element_decision_record',
    shouldFail: true,
    expectedCodes: ['SELECTED_ELEMENT_MUST_APPEAR_AS_SELECTED_CANDIDATE']
  }
];

const elementRegistryById = new Map();

function readJson(pathFromRoot) {
  return JSON.parse(readFileSync(join(repoRoot, pathFromRoot), 'utf8'));
}

function diagnostic({ rule_id, code, message, source, path }) {
  return {
    rule_id,
    code,
    message,
    source,
    ...(path ? { path } : {})
  };
}

function pushWhen(diagnostics, condition, detail) {
  if (condition) diagnostics.push(diagnostic(detail));
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

function requiredFieldCode(label, field) {
  return `${label}_${field}`.toUpperCase().replace(/[^A-Z0-9]+/g, '_') + '_REQUIRED';
}

function requireFields(record, fields, diagnostics, label, ruleId = 'SEMANTIC_REQUIRED_FIELD') {
  for (const field of fields) {
    pushWhen(diagnostics, !isObject(record) || !(field in record), {
      rule_id: ruleId,
      code: requiredFieldCode(label, field),
      message: `${label} requires ${field}`,
      source: 'semantic',
      path: `${label}.${field}`
    });
  }
}

function validateRegistries() {
  const diagnostics = [];
  let elements;
  let constraints;
  let manifest;

  elementRegistryById.clear();

  try {
    elements = readJson('kernel/registries/elements.core.v0.json');
    constraints = readJson('kernel/registries/constraints.core.v0.json');
    manifest = readJson('kernel/registries/registry-manifest.v0.json');
  } catch (error) {
    diagnostics.push(diagnostic({
      rule_id: 'REGISTRY_CONFORMANCE',
      code: 'REGISTRY_READ_OR_PARSE_FAILED',
      message: `failed to read or parse registry files: ${error.message}`,
      source: 'registry'
    }));
    return diagnostics;
  }

  if (!isObject(elements) || !Array.isArray(elements.elements)) {
    diagnostics.push(diagnostic({
      rule_id: 'REGISTRY_CONFORMANCE',
      code: 'ELEMENT_REGISTRY_ELEMENTS_ARRAY_REQUIRED',
      message: 'elements.core.v0.json requires an elements array',
      source: 'registry',
      path: 'kernel/registries/elements.core.v0.json.elements'
    }));
    return diagnostics;
  }
  if (!isObject(constraints) || !Array.isArray(constraints.constraints)) {
    diagnostics.push(diagnostic({
      rule_id: 'REGISTRY_CONFORMANCE',
      code: 'CONSTRAINT_REGISTRY_CONSTRAINTS_ARRAY_REQUIRED',
      message: 'constraints.core.v0.json requires a constraints array',
      source: 'registry',
      path: 'kernel/registries/constraints.core.v0.json.constraints'
    }));
    return diagnostics;
  }
  if (!isObject(manifest) || !Array.isArray(manifest.registries)) {
    diagnostics.push(diagnostic({
      rule_id: 'REGISTRY_CONFORMANCE',
      code: 'REGISTRY_MANIFEST_REGISTRIES_ARRAY_REQUIRED',
      message: 'registry-manifest.v0.json requires a registries array',
      source: 'registry',
      path: 'kernel/registries/registry-manifest.v0.json.registries'
    }));
    return diagnostics;
  }

  const ids = elements.elements.map((entry) => entry.element_id);
  const uniqueIds = new Set(ids);

  pushWhen(diagnostics, ids.length !== 8 || uniqueIds.size !== 8, {
    rule_id: 'REGISTRY_CONFORMANCE',
    code: 'CORE_ELEMENT_ID_SET_MUST_CONTAIN_EIGHT_UNIQUE_IDS',
    message: 'element IDs must be unique and limited to eight MVK IDs',
    source: 'registry',
    path: 'kernel/registries/elements.core.v0.json.elements'
  });

  for (const id of coreElementIds) {
    pushWhen(diagnostics, !uniqueIds.has(id), {
      rule_id: 'REGISTRY_CONFORMANCE',
      code: 'CORE_ELEMENT_ID_MISSING',
      message: `missing core element ID: ${id}`,
      source: 'registry',
      path: 'kernel/registries/elements.core.v0.json.elements'
    });
  }

  for (const entry of elements.elements) {
    const label = entry?.element_id || 'element';
    requireFields(
      entry,
      ['element_id', 'display_name', 'element_generation', 'category', 'semantic_roles', 'meaningful_content_allowed', 'interactive_capability', 'requires_pro', 'requires_permission', 'status', 'evidence'],
      diagnostics,
      label,
      'REGISTRY_CONFORMANCE'
    );
    pushWhen(diagnostics, !hasItems(entry?.semantic_roles), {
      rule_id: 'REGISTRY_CONFORMANCE',
      code: 'ELEMENT_SEMANTIC_ROLES_REQUIRED',
      message: `${label} requires semantic_roles`,
      source: 'registry',
      path: `${label}.semantic_roles`
    });
    pushWhen(diagnostics, !hasItems(entry?.evidence), {
      rule_id: 'REGISTRY_CONFORMANCE',
      code: 'ELEMENT_EVIDENCE_REQUIRED',
      message: `${label} requires evidence`,
      source: 'registry',
      path: `${label}.evidence`
    });
    if (hasText(entry?.element_id)) elementRegistryById.set(entry.element_id, entry);
  }

  pushWhen(diagnostics, constraints.constraints.length !== 6, {
    rule_id: 'REGISTRY_CONFORMANCE',
    code: 'MVK_CONSTRAINT_SET_MUST_CONTAIN_SIX_CORE_CONSTRAINTS',
    message: 'expected six MVK constraints',
    source: 'registry',
    path: 'kernel/registries/constraints.core.v0.json.constraints'
  });
  pushWhen(diagnostics, !hasItems(manifest.registries), {
    rule_id: 'REGISTRY_CONFORMANCE',
    code: 'REGISTRY_MANIFEST_ENTRIES_REQUIRED',
    message: 'registry manifest must list registries',
    source: 'registry',
    path: 'kernel/registries/registry-manifest.v0.json.registries'
  });
  return diagnostics;
}

function buildSchemaValidators() {
  const diagnostics = [];
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const compiled = new Map();

  for (const [kind, schemaPath] of Object.entries(schemaMap)) {
    try {
      compiled.set(kind, ajv.compile(readJson(schemaPath)));
    } catch (error) {
      diagnostics.push(diagnostic({
        rule_id: 'SCHEMA_CONFORMANCE',
        code: 'SCHEMA_COMPILE_FAILED',
        message: `${kind} schema failed to compile: ${error.message}`,
        source: 'schema',
        path: schemaPath
      }));
    }
  }

  return { compiled, diagnostics };
}

function pathFromAjvError(error) {
  const basePath = error.instancePath
    ? error.instancePath.slice(1).replaceAll('/', '.')
    : '(root)';
  if (error.keyword === 'required' && error.params?.missingProperty) {
    return basePath === '(root)' ? error.params.missingProperty : `${basePath}.${error.params.missingProperty}`;
  }
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
    return basePath === '(root)' ? error.params.additionalProperty : `${basePath}.${error.params.additionalProperty}`;
  }
  return basePath;
}

function codeFromAjvError(error) {
  if (error.keyword === 'required' && error.params?.missingProperty) {
    return `SCHEMA_REQUIRED_${String(error.params.missingProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  }
  if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
    return `SCHEMA_ADDITIONAL_PROPERTY_${String(error.params.additionalProperty).toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
  }
  return `SCHEMA_${String(error.keyword || 'CONFORMANCE').toUpperCase().replace(/[^A-Z0-9]+/g, '_')}`;
}

function schemaDiagnostics(kind, record, compiled) {
  const validate = compiled.get(kind);
  if (!validate) {
    return [diagnostic({
      rule_id: 'SCHEMA_CONFORMANCE',
      code: 'SCHEMA_VALIDATOR_MISSING',
      message: `No schema validator registered for ${kind}`,
      source: 'schema',
      path: kind
    })];
  }
  const valid = validate(record);
  if (valid) return [];
  return (validate.errors || []).map((error) => diagnostic({
    rule_id: 'SCHEMA_CONFORMANCE',
    code: codeFromAjvError(error),
    message: `${kind}: ${error.message}`,
    source: 'schema',
    path: pathFromAjvError(error)
  }));
}

function elementIsInteractive(record) {
  const entry = elementRegistryById.get(record.selected_element_id);
  const capability = entry?.interactive_capability;
  if (capability === 'primary_click_action') return true;
  return record.interaction_topology?.self_interactive === true || record.interaction_topology?.self_link_enabled === true;
}

function validateInteractionTopology(record, diagnostics) {
  if (!('selected_element_id' in record)) return;

  const topology = record.interaction_topology;
  pushWhen(diagnostics, !topology, {
    rule_id: 'R-MVK-006',
    code: 'INTERACTION_TOPOLOGY_REQUIRED',
    message: 'interaction_topology is required for records with selected_element_id',
    source: 'semantic',
    path: 'interaction_topology'
  });
  if (!topology) return;

  requireFields(
    topology,
    ['clickable_ancestor', 'clickable_descendant'],
    diagnostics,
    'interaction_topology',
    'R-MVK-006'
  );
  const selfInteractive = elementIsInteractive(record);

  pushWhen(diagnostics, topology.clickable_ancestor === true && topology.clickable_descendant === true, {
    rule_id: 'R-MVK-006',
    code: 'NESTED_CLICKABLE_TOPOLOGY_REJECTED',
    message: 'nested clickable topology is rejected',
    source: 'semantic',
    path: 'interaction_topology'
  });
  pushWhen(diagnostics, selfInteractive && topology.clickable_ancestor === true, {
    rule_id: 'R-MVK-006',
    code: 'INTERACTIVE_ELEMENT_INSIDE_CLICKABLE_ANCESTOR',
    message: 'interactive element inside clickable ancestor is rejected',
    source: 'semantic',
    path: 'interaction_topology.clickable_ancestor'
  });
  pushWhen(diagnostics, selfInteractive && topology.clickable_descendant === true, {
    rule_id: 'R-MVK-006',
    code: 'INTERACTIVE_ELEMENT_WITH_CLICKABLE_DESCENDANT',
    message: 'interactive element with clickable descendant is rejected',
    source: 'semantic',
    path: 'interaction_topology.clickable_descendant'
  });
}

function validateElementDecision(record) {
  const diagnostics = [];
  requireFields(
    record,
    ['decision_id', 'node_id', 'selected_element_id', 'candidate_elements', 'rejected_alternatives', 'selection_reasons', 'required_capabilities', 'evidence_refs', 'decision_owner', 'decision_status', 'interaction_topology'],
    diagnostics,
    'element_decision_record',
    'R-MVK-003'
  );
  pushWhen(diagnostics, !coreElementIds.includes(record.selected_element_id), {
    rule_id: 'R-MVK-001',
    code: 'SELECTED_ELEMENT_ID_NOT_IN_CORE_REGISTRY',
    message: 'selected_element_id must be a core MVK element ID',
    source: 'semantic',
    path: 'selected_element_id'
  });
  pushWhen(diagnostics, record.decision_owner !== 'architect', {
    rule_id: 'R-MVK-003',
    code: 'ELEMENT_DECISION_OWNER_MUST_BE_ARCHITECT',
    message: 'element decision owner must be architect',
    source: 'semantic',
    path: 'decision_owner'
  });
  pushWhen(
    diagnostics,
    !hasItems(record.candidate_elements) ||
      !record.candidate_elements.some((candidate) => candidate.element_id === record.selected_element_id && candidate.fit_status === 'selected'),
    {
      rule_id: 'R-MVK-003',
      code: 'SELECTED_ELEMENT_MUST_APPEAR_AS_SELECTED_CANDIDATE',
      message: 'selected element must appear as selected candidate',
      source: 'semantic',
      path: 'candidate_elements'
    }
  );
  validateInteractionTopology(record, diagnostics);
  return diagnostics;
}

function validatePositionDecision(record) {
  const diagnostics = [];
  requireFields(
    record,
    ['decision_id', 'node_id', 'selected_position', 'candidates', 'rejected_positions', 'containing_block_required', 'evidence_refs', 'decision_status'],
    diagnostics,
    'position_decision_record',
    'R-MVK-005'
  );
  if (record.selected_position === 'absolute') {
    pushWhen(diagnostics, record.containing_block_required !== true, {
      rule_id: 'R-MVK-005',
      code: 'ABSOLUTE_REQUIRES_CONTAINING_BLOCK_REQUIRED_TRUE',
      message: 'absolute position requires containing_block_required=true',
      source: 'semantic',
      path: 'containing_block_required'
    });
    pushWhen(diagnostics, !record.containing_block_proof, {
      rule_id: 'R-MVK-005',
      code: 'ABSOLUTE_REQUIRES_CONTAINING_BLOCK_PROOF',
      message: 'absolute position requires containing_block_proof',
      source: 'semantic',
      path: 'containing_block_proof'
    });
    if (isObject(record.containing_block_proof)) {
      const proof = record.containing_block_proof;
      pushWhen(diagnostics, proof.proof_present !== true, {
        rule_id: 'R-MVK-005',
        code: 'CONTAINING_BLOCK_PROOF_PRESENT_TRUE_REQUIRED',
        message: 'containing_block_proof.proof_present must be true',
        source: 'semantic',
        path: 'containing_block_proof.proof_present'
      });
      pushWhen(diagnostics, !hasText(proof.parent_node_id) && !hasText(proof.parent_node_ref), {
        rule_id: 'R-MVK-005',
        code: 'CONTAINING_BLOCK_PARENT_NODE_REF_REQUIRED',
        message: 'containing_block_proof requires parent node reference',
        source: 'semantic',
        path: 'containing_block_proof.parent_node_ref'
      });
      pushWhen(diagnostics, !hasText(proof.parent_position) && !hasText(proof.parent_positioning_strategy), {
        rule_id: 'R-MVK-005',
        code: 'CONTAINING_BLOCK_PARENT_POSITIONING_STRATEGY_REQUIRED',
        message: 'containing_block_proof requires parent positioning strategy',
        source: 'semantic',
        path: 'containing_block_proof.parent_positioning_strategy'
      });
      pushWhen(diagnostics, !hasItems(proof.evidence_refs), {
        rule_id: 'R-MVK-005',
        code: 'CONTAINING_BLOCK_EVIDENCE_REFS_REQUIRED',
        message: 'containing_block_proof requires evidence_refs',
        source: 'semantic',
        path: 'containing_block_proof.evidence_refs'
      });
    }
  }
  return diagnostics;
}

function validateCeClosure(record) {
  const diagnostics = [];
  requireFields(
    record,
    ['closure_id', 'architect_decision_refs', 'constructability_status', 'architecture_decisions_open', 'constructability_decisions_open', 'bounded_execution_details_open', 'runtime_evidence_open', 'builder_ready', 'evidence_refs', 'repair_route_if_blocked'],
    diagnostics,
    'ce_decision_closure',
    'R-MVK-002'
  );
  if (record.builder_ready === true) {
    pushWhen(diagnostics, record.architecture_decisions_open !== 0, {
      rule_id: 'R-MVK-002',
      code: 'BUILDER_READY_REQUIRES_NO_OPEN_ARCHITECTURE_DECISIONS',
      message: 'builder_ready requires architecture_decisions_open=0',
      source: 'semantic',
      path: 'architecture_decisions_open'
    });
    pushWhen(diagnostics, record.constructability_decisions_open !== 0, {
      rule_id: 'R-MVK-002',
      code: 'BUILDER_READY_REQUIRES_NO_OPEN_CONSTRUCTABILITY_DECISIONS',
      message: 'builder_ready requires constructability_decisions_open=0',
      source: 'semantic',
      path: 'constructability_decisions_open'
    });
    pushWhen(diagnostics, record.constructability_status !== 'proven', {
      rule_id: 'R-MVK-002',
      code: 'BUILDER_READY_REQUIRES_PROVEN_CONSTRUCTABILITY',
      message: 'builder_ready requires constructability_status=proven',
      source: 'semantic',
      path: 'constructability_status'
    });
  }
  return diagnostics;
}

function validateBuilderResolution(record) {
  const diagnostics = [];
  requireFields(
    record,
    ['resolution_id', 'action_id', 'target_node', 'selected_element_id', 'decision_ref', 'ce_closure_ref', 'control_resolution', 'value_unit_resolution', 'position_resolution', 'decision', 'interaction_topology'],
    diagnostics,
    'builder_resolution_result',
    'R-MVK-001'
  );
  pushWhen(diagnostics, !coreElementIds.includes(record.selected_element_id), {
    rule_id: 'R-MVK-001',
    code: 'SELECTED_ELEMENT_ID_NOT_IN_CORE_REGISTRY',
    message: 'selected_element_id must be a core MVK element ID',
    source: 'semantic',
    path: 'selected_element_id'
  });
  if (record.decision === 'emit_action') {
    pushWhen(diagnostics, !hasText(record.decision_ref), {
      rule_id: 'R-MVK-002',
      code: 'BUILDER_READY_REQUIRES_DECISION_REF',
      message: 'emit_action requires decision_ref',
      source: 'semantic',
      path: 'decision_ref'
    });
    pushWhen(diagnostics, !hasText(record.ce_closure_ref), {
      rule_id: 'R-MVK-002',
      code: 'BUILDER_READY_REQUIRES_CE_CLOSURE',
      message: 'emit_action requires ce_closure_ref',
      source: 'semantic',
      path: 'ce_closure_ref'
    });
    pushWhen(diagnostics, !hasText(record.control_resolution?.locked_decision_ref), {
      rule_id: 'R-MVK-003',
      code: 'BUILDER_ACTION_REQUIRES_LOCKED_DECISION_REF',
      message: 'emit_action requires locked decision reference',
      source: 'semantic',
      path: 'control_resolution.locked_decision_ref'
    });
  }
  const proof = record.position_resolution?.relative_parent_proof;
  if (proof) {
    pushWhen(diagnostics, proof.proof_present !== true, {
      rule_id: 'R-MVK-005',
      code: 'RELATIVE_PARENT_PROOF_PRESENT_TRUE_REQUIRED',
      message: 'relative_parent_proof must be true when present',
      source: 'semantic',
      path: 'position_resolution.relative_parent_proof.proof_present'
    });
  }
  if (record.fallback_policy?.fallback_used) {
    pushWhen(diagnostics, !coreElementIds.includes(record.fallback_policy.fallback_element_id), {
      rule_id: 'R-MVK-001',
      code: 'BUILDER_FALLBACK_ELEMENT_NOT_LISTED',
      message: 'unlisted fallback is invalid',
      source: 'semantic',
      path: 'fallback_policy.fallback_element_id'
    });
    pushWhen(diagnostics, record.fallback_policy.fallback_element_id !== record.selected_element_id, {
      rule_id: 'R-MVK-001',
      code: 'BUILDER_FALLBACK_SUBSTITUTION_INVALID',
      message: 'fallback substitution is invalid',
      source: 'semantic',
      path: 'fallback_policy.fallback_element_id'
    });
  }
  validateInteractionTopology(record, diagnostics);
  return diagnostics;
}

function validateKernelPin(pin, diagnostics, label) {
  if (!isObject(pin)) {
    diagnostics.push(diagnostic({
      rule_id: 'R-MVK-008',
      code: 'KERNEL_PIN_REQUIRED',
      message: `${label}: kernel_pin must be an object`,
      source: 'semantic',
      path: `${label}.kernel_pin`
    }));
    return;
  }

  requireFields(
    pin,
    ['kernel_version', 'kernel_source_commit', 'registry_manifest_ref', 'registry_manifest_sha256', 'compatibility_profile'],
    diagnostics,
    `${label}.kernel_pin`,
    'R-MVK-008'
  );
  pushWhen(diagnostics, !hasText(pin.kernel_version), {
    rule_id: 'R-MVK-008',
    code: 'KERNEL_PIN_VERSION_REQUIRED',
    message: `${label}.kernel_pin: kernel_version must be a non-empty string`,
    source: 'semantic',
    path: `${label}.kernel_pin.kernel_version`
  });
  pushWhen(diagnostics, !/^[a-f0-9]{40}$/i.test(pin.kernel_source_commit || ''), {
    rule_id: 'R-MVK-008',
    code: 'KERNEL_PIN_COMMIT_SHA_INVALID',
    message: `${label}.kernel_pin: kernel_source_commit must be a 40-character hex string`,
    source: 'semantic',
    path: `${label}.kernel_pin.kernel_source_commit`
  });
  pushWhen(diagnostics, !hasText(pin.registry_manifest_ref), {
    rule_id: 'R-MVK-008',
    code: 'KERNEL_PIN_MANIFEST_REF_REQUIRED',
    message: `${label}.kernel_pin: registry_manifest_ref must be a non-empty string`,
    source: 'semantic',
    path: `${label}.kernel_pin.registry_manifest_ref`
  });
  pushWhen(diagnostics, !/^[a-f0-9]{64}$/i.test(pin.registry_manifest_sha256 || ''), {
    rule_id: 'R-MVK-008',
    code: 'KERNEL_PIN_MANIFEST_SHA256_INVALID',
    message: `${label}.kernel_pin: registry_manifest_sha256 must be a 64-character hex string`,
    source: 'semantic',
    path: `${label}.kernel_pin.registry_manifest_sha256`
  });

  if (!isObject(pin.compatibility_profile)) {
    diagnostics.push(diagnostic({
      rule_id: 'R-MVK-008',
      code: 'KERNEL_PIN_COMPATIBILITY_PROFILE_REQUIRED',
      message: `${label}.kernel_pin: compatibility_profile must be an object`,
      source: 'semantic',
      path: `${label}.kernel_pin.compatibility_profile`
    }));
    return;
  }

  requireFields(
    pin.compatibility_profile,
    ['profile_id', 'consumer_stage'],
    diagnostics,
    `${label}.kernel_pin.compatibility_profile`,
    'R-MVK-008'
  );
  pushWhen(diagnostics, !hasText(pin.compatibility_profile.profile_id), {
    rule_id: 'R-MVK-008',
    code: 'KERNEL_PIN_PROFILE_ID_REQUIRED',
    message: `${label}.kernel_pin.compatibility_profile: profile_id must be a non-empty string`,
    source: 'semantic',
    path: `${label}.kernel_pin.compatibility_profile.profile_id`
  });
  pushWhen(diagnostics, !hasText(pin.compatibility_profile.consumer_stage), {
    rule_id: 'R-MVK-008',
    code: 'KERNEL_PIN_CONSUMER_STAGE_REQUIRED',
    message: `${label}.kernel_pin.compatibility_profile: consumer_stage must be a non-empty string`,
    source: 'semantic',
    path: `${label}.kernel_pin.compatibility_profile.consumer_stage`
  });
}

function validateProjectGatePacket(record) {
  const diagnostics = [];
  requireFields(
    record,
    ['packet_id', 'kernel_pin', 'input_artifact_refs', 'validation_reports', 'lineage', 'gate_decision'],
    diagnostics,
    'project_gate_acceptance_packet',
    'R-MVK-008'
  );
  pushWhen(diagnostics, 'selected_element_id' in record || 'selected_position' in record || 'candidate_elements' in record, {
    rule_id: 'R-MVK-008',
    code: 'PROJECT_GATE_PACKET_MUST_NOT_CONTAIN_DESIGN_CHOICE_FIELDS',
    message: 'Project Gate packet must not contain design-choice fields',
    source: 'semantic',
    path: 'project_gate_acceptance_packet'
  });
  validateKernelPin(record.kernel_pin, diagnostics, 'project_gate_acceptance_packet');
  if (record.gate_decision === 'accept') {
    pushWhen(diagnostics, !record.kernel_pin, {
      rule_id: 'R-MVK-008',
      code: 'ACCEPT_REQUIRES_KERNEL_PIN',
      message: 'accept requires kernel_pin',
      source: 'semantic',
      path: 'kernel_pin'
    });
    pushWhen(diagnostics, !hasItems(record.validation_reports) || !record.validation_reports.some((report) => report.status === 'passed'), {
      rule_id: 'R-MVK-008',
      code: 'ACCEPT_REQUIRES_PASSED_VALIDATION_REPORT',
      message: 'accept requires at least one passed validation report',
      source: 'semantic',
      path: 'validation_reports'
    });
  }
  return diagnostics;
}

const semanticValidators = {
  element_decision_record: validateElementDecision,
  position_decision_record: validatePositionDecision,
  ce_decision_closure: validateCeClosure,
  builder_resolution_result: validateBuilderResolution,
  project_gate_acceptance_packet: validateProjectGatePacket
};

function formatDiagnostic(item) {
  return `${item.rule_id} ${item.code} [${item.source}]${item.path ? ` ${item.path}` : ''}: ${item.message}`;
}

function readFixture(fixturePath) {
  try {
    return {
      record: readJson(`kernel/fixtures/${fixturePath}`),
      diagnostics: []
    };
  } catch (error) {
    return {
      record: null,
      diagnostics: [diagnostic({
        rule_id: 'FIXTURE_CONFORMANCE',
        code: 'FIXTURE_JSON_READ_OR_PARSE_FAILED',
        message: `${fixturePath} failed to read or parse: ${error.message}`,
        source: 'fixture',
        path: `kernel/fixtures/${fixturePath}`
      })]
    };
  }
}

const output = ['MVK validator summary'];
let failed = false;

const registryDiagnostics = validateRegistries();
if (registryDiagnostics.length > 0) {
  failed = true;
  output.push('Registries: FAIL', ...registryDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
} else {
  output.push('Registries: PASS');
}

const { compiled, diagnostics: schemaSetupDiagnostics } = buildSchemaValidators();
if (schemaSetupDiagnostics.length > 0) {
  failed = true;
  output.push('Schema setup: FAIL', ...schemaSetupDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
} else {
  output.push(`Schema setup: PASS (${compiled.size}/${Object.keys(schemaMap).length} schemas compiled)`);
}

let schemaExecuted = 0;
let validSchemaPassed = 0;
let validPassed = 0;
let invalidFailed = 0;
let expectedDiagnosticsPassed = 0;
const invalidDiagnosticLines = [];
const expectedValid = fixturePlan.filter(({ shouldFail }) => !shouldFail).length;
const expectedInvalid = fixturePlan.filter(({ shouldFail }) => shouldFail).length;

for (const fixture of fixturePlan) {
  const fixtureRead = readFixture(fixture.path);
  const fixtureDiagnostics = fixtureRead.diagnostics;
  const record = fixtureRead.record;
  const schemaItems = record ? schemaDiagnostics(fixture.kind, record, compiled) : [];
  if (record) schemaExecuted += 1;
  const semanticValidator = semanticValidators[fixture.kind];
  const semanticItems = record && semanticValidator
    ? semanticValidator(record)
    : record
      ? [diagnostic({
          rule_id: 'SEMANTIC_VALIDATOR',
          code: 'SEMANTIC_VALIDATOR_MISSING',
          message: `No semantic validator registered for ${fixture.kind}`,
          source: 'semantic',
          path: fixture.kind
        })]
      : [];
  const allDiagnostics = [...fixtureDiagnostics, ...schemaItems, ...semanticItems];

  if (!fixture.shouldFail) {
    if (schemaItems.length === 0) validSchemaPassed += 1;
    if (allDiagnostics.length === 0) {
      validPassed += 1;
    } else {
      failed = true;
      output.push(`${fixture.path}: FAIL`, ...allDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
    }
    continue;
  }

  const observedCodes = new Set(allDiagnostics.map((item) => item.code));
  const missingCodes = fixture.expectedCodes.filter((code) => !observedCodes.has(code));
  if (allDiagnostics.length > 0 && missingCodes.length === 0) {
    invalidFailed += 1;
    expectedDiagnosticsPassed += 1;
    invalidDiagnosticLines.push(`  - ${fixture.path}: PASS [${fixture.expectedCodes.join(', ')}]`);
  } else {
    failed = true;
    output.push(`${fixture.path}: ${allDiagnostics.length === 0 ? 'unexpected PASS' : 'unexpected diagnostics'}`);
    if (missingCodes.length > 0) output.push(`  - Missing expected diagnostic codes: ${missingCodes.join(', ')}`);
    output.push(...allDiagnostics.map((item) => `  - ${formatDiagnostic(item)}`));
  }
}

const schemaCleanForValid = validSchemaPassed === expectedValid;
output.push(`Schema validation: ${schemaCleanForValid && schemaExecuted === fixturePlan.length ? 'PASS' : 'FAIL'} (executed ${schemaExecuted}/${fixturePlan.length}; valid fixtures schema-clean ${validSchemaPassed}/${expectedValid})`);
output.push(`Valid fixtures passed schema + semantic validation: ${validPassed}/${expectedValid}`);
output.push(`Invalid fixtures failed with expected diagnostics: ${invalidFailed}/${expectedInvalid}`);
output.push(`Expected diagnostic assertions: ${expectedDiagnosticsPassed === expectedInvalid ? 'PASS' : 'FAIL'} (${expectedDiagnosticsPassed}/${expectedInvalid})`);
output.push('Invalid fixture diagnostic assertions:');
output.push(...invalidDiagnosticLines);
output.push(`Result: ${failed ? 'FAIL' : 'PASS'}`);
console.log(output.join('\n'));
process.exit(failed ? 1 : 0);
