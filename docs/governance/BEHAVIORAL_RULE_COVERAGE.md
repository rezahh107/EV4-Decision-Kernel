# Behavioral Rule Coverage — EV4 Decision Kernel

**Version:** 0.2.5-mvk-validation-repair  
**Status:** Kernel-local schema / semantic validator / expected diagnostic fixture coverage for Prompt 2.5

## Enforcement Status

| status | meaning |
|---|---|
| `prose_only` | Rule exists only in prose. |
| `schema_backed` | Rule has a schema field but no fixture-proven validator behavior. |
| `validator_backed` | Validator checks the rule, but fixture coverage is incomplete. |
| `fixture_tested` | Valid and invalid fixtures prove validator behavior locally, and invalid fixtures assert expected diagnostics. |
| `ci_enforced` | CI runs the relevant validator/tests automatically and the workflow result has been observed passing. |
| `downstream_contract_enforced` | Downstream consumer rejects missing or invalid carriers. |

No rule is marked `ci_enforced` until a PR workflow run confirms `npm run validate:mvk`. No rule is marked `downstream_contract_enforced` until a downstream EV4 consumer rejects invalid carriers.

## MVK Coverage Matrix

| rule_id | concept | risk | prose_source | schema_carrier | validator_rule | valid_fixture | invalid_fixture | CI_step | downstream_contract | status |
|---|---|---|---|---|---|---|---|---|---|---|
| `R-MVK-001` | Builder must not invent architecture or use an unlisted fallback. | Critical | `README.md` role boundary | `builder_resolution_result.fallback_policy`, `selected_element_id` | `validateBuilderResolution` rejects unlisted fallback and substitution with expected diagnostic codes | `builder_resolution_emit_action_valid.json` | `unlisted_builder_fallback_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-002` | CE closure is required before Builder-ready emission. | Critical | `README.md` role boundary | `ce_closure_ref`, `ce_decision_closure.builder_ready` | `validateBuilderResolution`, `validateCeClosure` emit R-MVK-002 diagnostics | `builder_resolution_emit_action_valid.json`, `ce_closure_builder_ready_valid.json` | `builder_ready_without_ce_closure_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-003` | Selected candidate must remain locked. | Critical | `README.md` role boundary | `selected_element_id`, `candidate_elements.fit_status`, `control_resolution.locked_decision_ref` | `validateElementDecision` requires selected element as selected candidate and `validateBuilderResolution` requires locked decision reference | `element_decision_svg_absolute_valid.json` | `element_decision_selected_candidate_mismatch_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-005` | Absolute positioning requires containing-block proof. | Critical | `README.md` role boundary | `position_decision_record.containing_block_required`, `position_decision_record.containing_block_proof` | `validatePositionDecision` emits R-MVK-005 diagnostics for missing absolute-position proof | `position_decision_absolute_with_containing_block_valid.json` | `absolute_without_containing_block_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-006` | Nested clickable topology is rejected, including interactive-self nesting and missing topology carriers. | Critical | `README.md` role boundary | `interaction_topology.clickable_ancestor`, `clickable_descendant`, `self_interactive`, `self_link_enabled` | `validateInteractionTopology` emits R-MVK-006 diagnostics | `builder_resolution_emit_action_valid.json` | `nested_clickable_topology_invalid.json`, `builder_button_inside_clickable_ancestor_invalid.json`, `builder_button_with_clickable_descendant_invalid.json`, `builder_missing_interaction_topology_invalid.json`, `builder_linked_image_inside_clickable_ancestor_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-007` | Exact UI path requires evidence. | High | `README.md` role boundary | `control_resolution.ui_evidence_status`, `exact_path_allowed` | not_implemented | `builder_resolution_emit_action_valid.json` | not_implemented | not_implemented | not_enforced | `schema_backed` |
| `R-MVK-008` | Project Gate rejects missing or malformed kernel pin/hash. | Critical | `README.md` role boundary | `project_gate_acceptance_packet.kernel_pin` | `validateKernelPin`, `validateProjectGatePacket` emit R-MVK-008 diagnostics | `project_gate_acceptance_packet_valid.json` | `project_gate_missing_kernel_pin_invalid.json`, `project_gate_malformed_kernel_pin_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |

## Deferred Out-of-Scope Rules

`R-MVK-004` approved class-name mutation and `R-MVK-009` production readiness remain outside this Prompt 2.5 MVK-local slice. They must not be marked enforced until explicit schema carriers, validators, fixtures, CI steps, and downstream consumers exist.

## Local Validation

```bash
npm install
npm run validate:mvk
```

Expected result:

```text
MVK validator summary
Registries: PASS
Schema setup: PASS (8/8 schemas compiled)
Schema validation: PASS (executed 16/16; valid fixtures schema-clean 5/5)
Valid fixtures passed schema + semantic validation: 5/5
Invalid fixtures failed with expected diagnostics: 11/11
Expected diagnostic assertions: PASS (11/11)
Result: PASS
```

`fixture_tested` means local validator and fixtures cover the rule and invalid fixtures assert expected diagnostic codes. It does not mean CI enforcement or downstream contract enforcement.
