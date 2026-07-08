# Behavioral Rule Coverage — EV4 Decision Kernel

**Version:** 0.4.1-behavioral-audit-model with Prompt 5 evidence workspace rows and Elementor V4 doc coverage rows  
**Status:** active practical behavioral audit model for EV4 Decision Kernel

## Purpose

Behavioral Rule Coverage v0.4.1 records whether a Kernel behavioral rule is prompt-level guidance or has a repository-visible enforcement carrier. This document includes the pre-existing MVK, source/card, consumption-boundary, and evidence-workspace rows, then appends the Elementor V4 doc coverage rows.

This document is the source read by `tools/audit-behavioral-coverage.mjs`.

## Evidence States

```text
confirmed: inspected repository evidence proves the carrier exists and behaves as claimed.
insufficient_evidence: the carrier may exist, but it was not inspected or was ambiguous/stale.
not_applicable: the rule does not require that carrier in this repository phase.
not_implemented: the carrier is intentionally absent.
```

## Enforcement Status Ladder

```text
prose_only
schema_backed
validator_backed
fixture_tested
advisory_ci_observed
ci_enforced
sequence_ci_enforced
runtime_monitor_enforced
os_harness_enforced
downstream_contract_enforced
```

`advisory_ci_observed` never satisfies any Critical or High minimum by itself.

## Interpretation Rules

```text
- prompt_level_influence is not system_level_enforcement.
- field presence is not semantic enforcement.
- fixture existence is not CI enforcement.
- synthetic fixture coverage is not real E2E proof.
- CI success is not production readiness.
- downstream_contract_enforced requires inspected downstream rejection evidence.
- sequence_ci_enforced requires sequence-aware replay/diff tests or equivalent.
- runtime_monitor_enforced requires an actual runtime monitor.
- os_harness_enforced requires OS/process/file/network-level enforcement.
```

## Coverage Matrix Format

The matrix must use exactly these columns:

```text
rule_id
concept
risk
prose_source
schema_carrier
validator_rule
valid_fixture
invalid_fixture
CI_step
downstream_contract
session_scope
recovery_action
status
```

## MVK Coverage Matrix

| rule_id | concept | risk | prose_source | schema_carrier | validator_rule | valid_fixture | invalid_fixture | CI_step | downstream_contract | session_scope | recovery_action | status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `R-MVK-001` | Builder must not invent architecture or use an unlisted fallback. | Critical | README.md role boundary | builder_resolution_result.fallback_policy, selected_element_id | validateBuilderResolution rejects unlisted fallback and substitution with expected diagnostic codes | builder_resolution_emit_action_valid.json | unlisted_builder_fallback_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-002` | CE closure is required before Builder-ready emission. | Critical | README.md role boundary | ce_closure_ref, ce_decision_closure.builder_ready | validateBuilderResolution, validateCeClosure emit R-MVK-002 diagnostics | builder_resolution_emit_action_valid.json, ce_closure_builder_ready_valid.json | builder_ready_without_ce_closure_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-003` | Selected candidate must remain locked. | Critical | README.md role boundary | selected_element_id, candidate_elements.fit_status, control_resolution.locked_decision_ref | validateElementDecision and validateBuilderResolution check selected candidate and locked decision reference | element_decision_svg_absolute_valid.json | element_decision_selected_candidate_mismatch_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-005` | Absolute positioning requires containing-block proof. | Critical | README.md role boundary | position_decision_record.containing_block_required, position_decision_record.containing_block_proof | validatePositionDecision emits R-MVK-005 diagnostics | position_decision_absolute_with_containing_block_valid.json | absolute_without_containing_block_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-006` | Nested clickable topology is rejected. | Critical | README.md role boundary | interaction_topology clickable fields | validateInteractionTopology emits R-MVK-006 diagnostics | builder_resolution_emit_action_valid.json | nested_clickable_topology_invalid.json, builder_button_inside_clickable_ancestor_invalid.json, builder_button_with_clickable_descendant_invalid.json, builder_missing_interaction_topology_invalid.json, builder_linked_image_inside_clickable_ancestor_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-007` | Exact UI path requires evidence. | High | README.md role boundary | control_resolution.ui_evidence_status, exact_path_allowed | not_implemented | builder_resolution_emit_action_valid.json | not_implemented | not_implemented | None | per_artifact | repair_request | `schema_backed` |
| `R-MVK-008` | Project Gate rejects missing or malformed kernel pin/hash. | Critical | README.md role boundary | project_gate_acceptance_packet.kernel_pin | validateKernelPin, validateProjectGatePacket emit R-MVK-008 diagnostics | project_gate_acceptance_packet_valid.json | project_gate_missing_kernel_pin_invalid.json, project_gate_malformed_kernel_pin_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-SRC-001` | Official Elementor capability claims require official source refs. | Critical | docs/sources/OFFICIAL_SOURCE_MANIFEST.md | official-source-manifest.sources claims, element-decision-card.official_source_refs | validate-source-cards.mjs checks card refs against the source manifest | official_source_manifest_valid.json, element_decision_cards_core_valid.json | official_source_missing_url_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-SRC-002` | Workbook-derived educational models must not be promoted to official Elementor rules. | Critical | docs/sources/OFFICIAL_SOURCE_MANIFEST.md | official-source-manifest source_class and claims claim_type | validate-source-cards.mjs rejects workbook-derived official platform capability proof | official_source_manifest_valid.json | official_source_workbook_claims_official_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CARD-001` | Every MVK core element must have a decision card with minimum semantic children. | Critical | docs/decision-cards/ELEMENT_DECISION_CARDS.md | element-decision-card.cards, minimum_semantic_children | validate-source-cards.mjs requires exactly one card for every core element and semantic child depth | element_decision_cards_core_valid.json | decision_card_unknown_element_id_invalid.json, decision_card_shallow_semantic_children_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CARD-002` | Decision cards must not claim project availability or runtime proof from official docs alone. | Critical | docs/decision-cards/ELEMENT_DECISION_CARDS.md | element-decision-card.not_proven_by_official_docs, forbidden proof claim scanner | validate-source-cards.mjs rejects project availability, runtime proof, Builder execution, and production readiness claims in non-allowed paths | element_decision_card_svg_valid.json | decision_card_claims_project_availability_invalid.json, decision_card_missing_evidence_invalid.json, decision_card_forbidden_token_in_summary_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-001` | Architect and CE consumed card refs must resolve to a real matching Kernel decision card and official source refs. | Critical | docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md | architect-source-card-consumption and ce-source-card-consumption consumed refs | validate-consumption-boundaries.mjs checks card existence, card ref matching, source ref presence, and support-status matching | architect_consumes_svg_card_valid.json, ce_closes_div_block_constructability_with_limitations_valid.json | architect_consumes_unknown_card_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-002` | Architect records cannot claim project availability from official docs. | Critical | docs/consumption-boundaries/ARCHITECT_SOURCE_CARD_CONSUMPTION.md | architect-source-card-consumption not_proven acknowledgements and forbidden proof claims | validate-consumption-boundaries.mjs rejects project availability proof claims outside limitation fields | architect_consumes_svg_card_valid.json | architect_claims_project_availability_from_official_docs_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-003` | Architect records cannot claim that a decision card proves the correct design choice. | Critical | docs/consumption-boundaries/ARCHITECT_SOURCE_CARD_CONSUMPTION.md | architect-source-card-consumption design_choice_status and forbidden proof claims | validate-consumption-boundaries.mjs rejects correct-design-choice proof claims outside limitation fields | architect_consumes_button_card_with_nested_link_risk_valid.json | architect_marks_design_choice_proven_by_card_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-004` | CE and Architect consumption records cannot claim Builder execution from source/cards. | Critical | docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md | not_proven acknowledgements and forbidden proof claims | validate-consumption-boundaries.mjs rejects Builder execution proof claims outside limitation fields | ce_closes_div_block_constructability_with_limitations_valid.json | ce_claims_builder_execution_from_decision_card_invalid.json, ce_claims_builder_executing_variant_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-005` | CE and Architect consumption records cannot claim runtime responsive validation from official docs. | Critical | docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md | not_proven acknowledgements and forbidden proof claims | validate-consumption-boundaries.mjs rejects runtime validation proof claims outside limitation fields | ce_marks_grid_as_insufficient_project_evidence_valid.json | ce_claims_runtime_validation_from_official_docs_invalid.json, ce_claims_runtime_validation_proven_variant_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-006` | Kernel-local consumption records cannot claim downstream enforcement or production readiness. | Critical | docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md | forbidden proof claims scanner | validate-consumption-boundaries.mjs rejects downstream enforcement and production readiness claims outside limitation fields | architect_consumes_svg_card_valid.json, ce_marks_grid_as_insufficient_project_evidence_valid.json | architect_claims_downstream_enforcement_invalid.json, architect_claims_production_readiness_variant_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-007` | CE constructable statuses require constructability evidence. | Critical | docs/consumption-boundaries/CE_SOURCE_CARD_CONSUMPTION.md | ce-source-card-consumption.constructability_assessment_status, constructability_evidence | validate-consumption-boundaries.mjs rejects closure-like CE statuses without evidence | ce_closes_div_block_constructability_with_limitations_valid.json | ce_closure_missing_constructability_evidence_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-CONSUME-008` | CE must check or acknowledge every required_evidence item listed by the consumed card. | Critical | docs/consumption-boundaries/CE_SOURCE_CARD_CONSUMPTION.md | ce-source-card-consumption.required_evidence_checked | validate-consumption-boundaries.mjs compares CE checked evidence against consumed card required_evidence | ce_closes_div_block_constructability_with_limitations_valid.json, ce_marks_grid_as_insufficient_project_evidence_valid.json | ce_ignores_card_required_evidence_invalid.json, ce_checked_required_evidence_missing_ref_invalid.json, ce_acknowledged_required_evidence_missing_reason_invalid.json, ce_not_applicable_required_evidence_missing_reason_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-EVIDENCE-001` | External evidence workspace and project profiles must preserve full kernel pin shape. | Critical | docs/evidence/EVIDENCE_WORKSPACE.md | evidence-workspace-envelope.kernel_pin, project-environment-profile.kernel_pin | validate-evidence-workspace.mjs validateKernelPin checks required pin shape including compatibility_profile.profile_id and compatibility_profile.consumer_stage | evidence_workspace_minimal_not_provided_valid.json, project_environment_profile_with_unknowns_valid.json | project_environment_profile_missing_kernel_pin_invalid.json, evidence_workspace_missing_compatibility_profile_invalid.json, project_environment_profile_missing_compatibility_profile_fields_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-EVIDENCE-002` | External evidence schemas must preserve explicit not-proven boundaries. | Critical | docs/evidence/EXTERNAL_EVIDENCE_CONTRACTS.md | not_proven_by_workspace, not_proven_by_profile, not_proven_by_evidence | validate-evidence-workspace.mjs validateBoundary requires prohibited claim boundaries | evidence_workspace_minimal_not_provided_valid.json, runtime_snapshot_collected_with_limitations_valid.json | evidence_workspace_missing_not_proven_boundary_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-EVIDENCE-003` | Evidence status values and package or summary status promotion must remain bounded. | Critical | docs/evidence/EVIDENCE_STATUS_MODEL.md | evidence_status_summary, evidence_packages.evidence_status, collection_status.status | validate-evidence-workspace.mjs validates status vocabulary and rejects package or summary status overclaim | evidence_workspace_minimal_not_provided_valid.json, wordpress_context_evidence_declared_not_available_valid.json | evidence_package_status_overclaim_invalid.json, evidence_workspace_summary_status_overclaim_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-EVIDENCE-004` | Evidence artifacts must reject production, runtime, downstream, Builder, cross-repo, and Project Gate overclaims including prose variants. | Critical | docs/evidence/EXTERNAL_EVIDENCE_CONTRACTS.md | assertions fields and forbidden proof claim scanner | validate-evidence-workspace.mjs scanForbidden rejects canonical tokens and common prose aliases outside limitation fields | runtime_snapshot_collected_with_limitations_valid.json, responsive_runtime_evidence_with_overflow_observation_valid.json | evidence_workspace_claims_production_ready_invalid.json, evidence_workspace_forbidden_prose_variants_invalid.json, wordpress_context_claims_builder_execution_invalid.json, elementor_availability_claims_runtime_validation_invalid.json, runtime_snapshot_claims_downstream_enforcement_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-EVIDENCE-005` | Evidence workspace package refs and package carrier shape must resolve before package status can be summarized. | Critical | docs/evidence/EVIDENCE_WORKSPACE.md | evidence_workspace_envelope.evidence_packages.package_ref and evidence_packages array shape | validate-evidence-workspace.mjs checks package refs against known fixture package IDs and guards malformed package arrays | evidence_workspace_minimal_not_provided_valid.json | evidence_workspace_unknown_package_ref_invalid.json, evidence_workspace_malformed_packages_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-EVIDENCE-006` | Responsive runtime evidence requires an explicit viewport set. | High | docs/evidence/EVIDENCE_WORKSPACE.md | responsive-runtime-evidence.viewport_set | validate-evidence-workspace.mjs emits VIEWPORT_SET_REQUIRED and schema required diagnostics | responsive_runtime_evidence_with_overflow_observation_valid.json | responsive_runtime_missing_viewport_set_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-001` | Required official Elementor V4 documentation areas must not be silently missing. | Critical | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | elementor-v4-doc-coverage-index.required_doc_areas | validate-elementor-doc-coverage.mjs checks required doc areas and source/label refs | elementor_doc_coverage_index_valid.json | required_doc_area_missing_invalid.json, unknown_evidence_label_ref_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-002` | Context-only official docs must have no-card reasons. | High | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | no_decision_card_reason | validate-elementor-doc-coverage.mjs rejects missing no-card reason | elementor_doc_coverage_index_valid.json | context_source_missing_no_card_reason_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-003` | Components must not claim project availability from official docs. | Critical | docs/sources/ELEMENTOR_V4_SOURCE_QUALITY_NOTES.md | source manifest Components claim_type | validate-elementor-doc-coverage.mjs rejects Components project_availability claim type | elementor_doc_coverage_index_valid.json | components_claims_project_availability_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-004` | Class priority must not be inferred from generic Classes docs. | High | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | class_priority_cascade doc area and source ref | validate-elementor-doc-coverage.mjs requires src.elementor.v4.class_priority | elementor_doc_coverage_index_valid.json | class_priority_source_missing_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-005` | Responsive inheritance docs must not be treated as runtime validation. | Critical | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | responsive not-proven boundaries | validate-elementor-doc-coverage.mjs rejects runtime proof claims outside limitation fields | elementor_doc_coverage_index_valid.json | responsive_inheritance_claims_runtime_validation_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-006` | Reset-style behavior must preserve reconciliation notes. | High | docs/sources/ELEMENTOR_V4_SOURCE_QUALITY_NOTES.md | reset_style_reconciliation source quality notes | validate-elementor-doc-coverage.mjs requires quality notes for conflicting sources | elementor_doc_coverage_index_valid.json | source_quality_note_required_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | repair_request | `fixture_tested` |
| `R-MVK-DOC-007` | Nested Links topology must reference the official source. | Critical | docs/decision-cards/ELEMENT_DECISION_CARDS.md | button official_source_refs and nested_links doc area | validate-elementor-doc-coverage.mjs requires Nested Links source and Button card ref | elementor_doc_coverage_index_valid.json | nested_links_source_missing_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-008` | Source quality notes must be preserved for ambiguous or conflicting official docs. | High | docs/sources/ELEMENTOR_V4_SOURCE_QUALITY_NOTES.md | source_quality_notes | validate-elementor-doc-coverage.mjs requires notes for conflicting/stale/quality-note status | elementor_doc_coverage_index_valid.json | source_quality_note_required_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | repair_request | `fixture_tested` |
| `R-MVK-DOC-009` | Official doc coverage artifacts must not claim Builder execution, downstream enforcement, runtime proof, or production readiness. | Critical | README.md evidence boundary | forbidden proof claim scanner | validate-elementor-doc-coverage.mjs scans forbidden proof claims outside not-proven/limitation fields | elementor_doc_coverage_index_valid.json | forbidden_production_ready_claim_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-010` | V3/V4 differences must be represented as compatibility context only. | High | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | v3_v4_differences doc area | validate-elementor-doc-coverage.mjs requires src.elementor.v4.v3_v4_differences | elementor_doc_coverage_index_valid.json | v3_v4_difference_source_missing_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | repair_request | `fixture_tested` |

## Deferred Out-of-Scope Rules

`R-MVK-004` approved class-name mutation and `R-MVK-009` production readiness remain outside this patch. They must not be marked enforced until explicit schema carriers, validators, fixtures, CI steps, and downstream consumers exist.

The Elementor V4 doc coverage rows are Kernel-local and fixture-tested only. They do not claim external exporter implementation, runtime monitor enforcement, Project Gate integration, downstream rejection, Builder execution, or production readiness.

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

Expected behavior:

```text
advisory: passes if this document and matrix are structurally valid.
strict: may fail while Critical/High rules remain below v0.4.1 thresholds.
```

`fixture_tested` means local validator and real fixtures cover the rule and invalid fixtures assert exact expected diagnostic codes. It does not mean CI enforcement, runtime validation, Builder execution, downstream contract enforcement, or production readiness.
