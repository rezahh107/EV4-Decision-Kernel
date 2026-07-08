# Behavioral Rule Coverage — EV4 Decision Kernel

**Version:** 0.3.0-source-cards  
**Status:** Kernel-local schema / semantic validator / expected diagnostic fixture coverage for Prompt 3

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
| `R-MVK-SRC-001` | Official Elementor capability claims require official source refs. | Critical | `docs/sources/OFFICIAL_SOURCE_MANIFEST.md` | `official-source-manifest.sources[].claims`, `element-decision-card.official_source_refs` | `validateSourceAndCardIntegrity` checks card refs against the source manifest | `official_source_manifest_valid.json`, `element_decision_cards_core_valid.json` | `official_source_missing_url_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-SRC-002` | Workbook-derived educational models must not be promoted to official Elementor rules. | Critical | `docs/sources/OFFICIAL_SOURCE_MANIFEST.md` | `official-source-manifest.sources[].source_class`, `claims[].claim_type` | `validateOfficialSourceManifest` rejects workbook-derived official platform capability proof | `official_source_manifest_valid.json` | `official_source_workbook_claims_official_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-CARD-001` | Every MVK core element must have a decision card with minimum semantic children. | Critical | `docs/decision-cards/ELEMENT_DECISION_CARDS.md` | `element-decision-card.cards[]`, `minimum_semantic_children` | `validateDecisionCards` requires exactly one card for every core element and semantic child depth | `element_decision_cards_core_valid.json` | `decision_card_unknown_element_id_invalid.json`, `decision_card_shallow_semantic_children_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |
| `R-MVK-CARD-002` | Decision cards must not claim project availability or runtime proof from official docs alone. | Critical | `docs/decision-cards/ELEMENT_DECISION_CARDS.md` | `element-decision-card.not_proven_by_official_docs`, forbidden proof claim scanner | `validateDecisionCards` rejects project availability, runtime proof, Builder execution, and production readiness claims outside limitations | `element_decision_card_svg_valid.json` | `decision_card_claims_project_availability_invalid.json`, `decision_card_missing_evidence_invalid.json` | `Validate MVK` / `npm run validate:mvk` | not_enforced | `fixture_tested` |

## Deferred Out-of-Scope Rules

`R-MVK-004` approved class-name mutation and `R-MVK-009` production readiness remain outside this Prompt 3 MVK-local slice. They must not be marked enforced until explicit schema carriers, validators, fixtures, CI steps, and downstream consumers exist.

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
```

Expected MVK result:

```text
MVK validator summary
Registries: PASS
Schema setup: PASS (10/10 schemas compiled)
Source/card integrity: PASS
Schema validation: PASS (executed 25/25; valid fixtures schema-clean 8/8)
Valid fixtures passed schema + semantic validation: 8/8
Invalid fixtures failed with expected diagnostics: 17/17
Expected diagnostic assertions: PASS (17/17)
Result: PASS
```

`fixture_tested` means local validator and fixtures cover the rule and invalid fixtures assert expected diagnostic codes. It does not mean CI enforcement or downstream contract enforcement.
