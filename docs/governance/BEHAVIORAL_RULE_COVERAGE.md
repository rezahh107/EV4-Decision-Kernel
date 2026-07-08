# Behavioral Rule Coverage — EV4 Decision Kernel

**Version:** 0.4.1-behavioral-audit-model  
**Status:** active practical behavioral audit model for EV4 Decision Kernel

## Purpose

Behavioral Rule Coverage v0.4.1 records whether a Kernel behavioral rule is only prompt-level guidance or whether it has a repository-visible enforcement carrier. The model protects the Kernel from treating good prose, templates, examples, or advisory audits as deterministic enforcement.

This document is the source read by `tools/audit-behavioral-coverage.mjs`.

## Non-Goals

This model does not:

```text
- start Prompt 5;
- create external evidence contracts;
- create project availability schemas;
- create runtime/browser evidence schemas;
- patch Architect, CE, Builder, Responsive, or Project Gate repositories;
- claim downstream rejection without inspected downstream consumer evidence;
- claim runtime monitoring without an actual runtime monitor;
- claim sequence enforcement without sequence-aware replay/diff tests or equivalent;
- track Low-risk style, tone, or formatting preferences as behavioral gates;
- create validators for every sentence.
```

## Source Precedence

When sources disagree, use this precedence:

```text
1. repository validator behavior and executed CI evidence
2. JSON Schemas and fixture contracts in this repository
3. this coverage matrix
4. governance docs and acceptance criteria
5. README and AGENTS operating prose
6. prompt examples, review guidance, and templates
```

Prompt instructions and prose may define intent. They do not prove enforcement.

## Evidence States

```text
confirmed: inspected repository evidence proves the carrier exists and behaves as claimed.
insufficient_evidence: the carrier may exist, but it was not inspected or was ambiguous/stale.
not_applicable: the rule does not require that carrier in this repository phase.
not_implemented: the carrier is intentionally absent.
```

Use the weakest honest evidence state when in doubt.

## Behavioral Gate

A behavioral gate is a rule that changes whether an artifact, handoff, or decision is accepted, rejected, repaired, rolled back, or flagged.

A behavioral gate is not merely advice. It needs a trigger, predicate, and enforcement path.

## Enforcement Carrier

An enforcement carrier is repository-visible machinery that can reject or constrain invalid behavior. Examples:

```text
- schema validation
- semantic validator rule
- expected valid fixture
- expected invalid fixture
- CI job that fails on violation
- sequence-aware replay/diff test
- runtime monitor
- OS/process/file/network harness
- downstream consumer rejection
```

A prompt instruction is not an enforcement carrier.

## Enforcement-Free Behavioral Gate

An enforcement-free behavioral gate is a real rule with only prose, examples, templates, or advisory review guidance. It may influence an LLM but does not deterministically reject invalid repository artifacts.

Critical and High enforcement-free behavioral gates are open governance gaps.

## Semantic Illusion

A semantic illusion occurs when a repository artifact appears to enforce behavior but only names or describes that behavior.

Common illusions:

```text
- a schema field exists but the value is not semantically checked;
- a fixture exists but is not wired into a failing validator path;
- a workflow passes but does not run the rule-level validator/test;
- an advisory audit is treated as fail-closed enforcement;
- a downstream contract is named but no downstream consumer rejects invalid input.
```

## Rule Shape

Each behavioral rule should be expressible as:

```text
trigger: when this artifact, handoff, or state is present
predicate: what must be true
system_level_enforcement: what rejects, repairs, rolls back, or flags violation
```

If any part is missing, the coverage matrix must use the weakest honest status.

## Session Scope

```text
per_artifact: the rule can be evaluated from one artifact or validation packet.
cross_turn: the rule depends on prior turns, sequence replay, history, diffs, or multi-step state.
```

A cross-turn Critical rule is not satisfied by single-artifact CI alone.

## Recovery Action

```text
block: reject or fail the artifact/check.
repair_request: ask the producer to repair missing/invalid evidence.
rollback: revert or undo an unsafe state transition.
flag_for_review: surface the issue without deterministic rejection.
```

## Risk Levels

```text
Critical: violation can corrupt role boundaries, handoff validity, evidence truth, or release readiness.
High: violation can mislead execution or weaken an important validation boundary.
Medium: violation creates maintainability or review risk but is not a core handoff blocker.
Low: violation is informational or stylistic and should not become a behavioral gate by default.
```

## Enforcement Status Ladder

```text
prose_only: rule exists only in prose, examples, templates, or role framing.
schema_backed: schema carrier exists, but no semantic validator proof is present.
validator_backed: validator rule exists, but fixture coverage is incomplete.
fixture_tested: valid and invalid fixtures prove local validator behavior, including expected diagnostics.
advisory_ci_observed: advisory CI ran and observed the audit or related validator without making the rule fail-closed.
ci_enforced: CI runs the exact rule validator/test and fails the build on violation.
sequence_ci_enforced: CI runs sequence-aware replay/diff tests or equivalent and fails on violation.
runtime_monitor_enforced: an actual runtime monitor detects and rejects/reports the violation during execution.
os_harness_enforced: OS/process/file/network-level harness enforcement exists.
downstream_contract_enforced: an inspected downstream consumer rejects missing or invalid carriers.
```

`advisory_ci_observed` never satisfies any Critical or High minimum by itself.

## Minimum Thresholds

```text
Critical + per_artifact:
  minimum: ci_enforced
  target: downstream_contract_enforced

Critical + cross_turn:
  minimum: sequence_ci_enforced OR runtime_monitor_enforced
  target: downstream_contract_enforced when a downstream boundary exists

Critical + execution-only observability:
  minimum: runtime_monitor_enforced

High:
  minimum: validator_backed
  preferred: fixture_tested or ci_enforced
```

Rows below threshold are allowed in advisory mode but must be reported as open enforcement gaps.

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

Use explicit `None`, `not_implemented`, `not_applicable`, or `insufficient_evidence` instead of empty cells.

## Practical Audit Method

For each row:

```text
1. Identify the behavioral concept and risk.
2. Separate prompt_level_influence from system_level_enforcement.
3. Check whether schema carrier exists.
4. Check whether validator logic exists.
5. Check whether valid and invalid fixtures exist.
6. Check whether the exact validator/test is run by CI.
7. Check whether sequence, runtime, OS/harness, or downstream enforcement is actually present when claimed.
8. Assign the weakest honest status.
9. Report threshold gaps without upgrading claims.
```

## Interpretation Rules

```text
- prompt_level_influence is not system_level_enforcement.
- field presence is not semantic enforcement.
- fixture existence is not CI enforcement.
- synthetic fixture coverage is not real E2E proof.
- CI success is not production readiness.
- advisory_ci_observed is not ci_enforced.
- downstream_contract_enforced requires inspected downstream rejection evidence.
- sequence_ci_enforced requires sequence-aware replay/diff tests or equivalent.
- runtime_monitor_enforced requires an actual runtime monitor.
- os_harness_enforced requires OS/process/file/network-level enforcement.
```

## Anti-Overengineering Guard

Do not convert every instruction into a validator. Prioritize rules that protect EV4 role boundaries, evidence truth, handoff validity, no-overclaim behavior, and release readiness.

Low-risk style, tone, and formatting preferences should remain prose unless they become safety, evidence, or handoff blockers.

## Patch Strategy

Use small patches that upgrade one of these layers at a time:

```text
1. matrix clarity and audit parser safety;
2. schema carriers for high-risk records;
3. semantic validators with deterministic diagnostics;
4. valid and invalid fixtures with expected diagnostic assertions;
5. CI fail-closed wiring for exact rule validators;
6. sequence/runtime/downstream enforcement only when those repositories or harnesses exist.
```

Do not jump from prose to downstream enforcement claims.

## Required Audit Output Template

The audit report must include:

```text
source
mode
outcome
parse_status
rules parsed
risk counts
status counts
threshold violations
overclaim risk checks
structural errors
open enforcement gaps
rules
```

Any missing, stale, or ambiguous evidence must be reported as `insufficient_evidence`.

## Minimal Daily-Use Prompt

```text
Audit Behavioral Rule Coverage for EV4-Decision-Kernel. Separate prompt-level influence from system-level enforcement. Do not upgrade Critical or High rules unless repository evidence proves the required carrier. Advisory mode may pass with gaps; strict mode must report threshold failures honestly.
```

## Maintenance Rule

Update this document whenever a new behavioral rule is added, a validator/fixture/CI carrier changes, or a rule status is upgraded. Status upgrades require inspected evidence, not intent.

## MVK Coverage Matrix

| rule_id | concept | risk | prose_source | schema_carrier | validator_rule | valid_fixture | invalid_fixture | CI_step | downstream_contract | session_scope | recovery_action | status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `R-MVK-001` | Builder must not invent architecture or use an unlisted fallback. | Critical | `README.md` role boundary | `builder_resolution_result.fallback_policy`, `selected_element_id` | `validateBuilderResolution` rejects unlisted fallback and substitution with expected diagnostic codes | `builder_resolution_emit_action_valid.json` | `unlisted_builder_fallback_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-002` | CE closure is required before Builder-ready emission. | Critical | `README.md` role boundary | `ce_closure_ref`, `ce_decision_closure.builder_ready` | `validateBuilderResolution`, `validateCeClosure` emit R-MVK-002 diagnostics | `builder_resolution_emit_action_valid.json`, `ce_closure_builder_ready_valid.json` | `builder_ready_without_ce_closure_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-003` | Selected candidate must remain locked. | Critical | `README.md` role boundary | `selected_element_id`, `candidate_elements.fit_status`, `control_resolution.locked_decision_ref` | `validateElementDecision` requires selected element as selected candidate and `validateBuilderResolution` requires locked decision reference | `element_decision_svg_absolute_valid.json` | `element_decision_selected_candidate_mismatch_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-005` | Absolute positioning requires containing-block proof. | Critical | `README.md` role boundary | `position_decision_record.containing_block_required`, `position_decision_record.containing_block_proof` | `validatePositionDecision` emits R-MVK-005 diagnostics for missing absolute-position proof | `position_decision_absolute_with_containing_block_valid.json` | `absolute_without_containing_block_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-006` | Nested clickable topology is rejected, including interactive-self nesting and missing topology carriers. | Critical | `README.md` role boundary | `interaction_topology.clickable_ancestor`, `clickable_descendant`, `self_interactive`, `self_link_enabled` | `validateInteractionTopology` emits R-MVK-006 diagnostics | `builder_resolution_emit_action_valid.json` | `nested_clickable_topology_invalid.json`, `builder_button_inside_clickable_ancestor_invalid.json`, `builder_button_with_clickable_descendant_invalid.json`, `builder_missing_interaction_topology_invalid.json`, `builder_linked_image_inside_clickable_ancestor_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-007` | Exact UI path requires evidence. | High | `README.md` role boundary | `control_resolution.ui_evidence_status`, `exact_path_allowed` | `not_implemented` | `builder_resolution_emit_action_valid.json` | `not_implemented` | `not_implemented` | `None` | `per_artifact` | `repair_request` | `schema_backed` |
| `R-MVK-008` | Project Gate rejects missing or malformed kernel pin/hash. | Critical | `README.md` role boundary | `project_gate_acceptance_packet.kernel_pin` | `validateKernelPin`, `validateProjectGatePacket` emit R-MVK-008 diagnostics | `project_gate_acceptance_packet_valid.json` | `project_gate_missing_kernel_pin_invalid.json`, `project_gate_malformed_kernel_pin_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-SRC-001` | Official Elementor capability claims require official source refs. | Critical | `docs/sources/OFFICIAL_SOURCE_MANIFEST.md` | `official-source-manifest.sources[].claims`, `element-decision-card.official_source_refs` | `validate-source-cards.mjs` checks card refs against the source manifest | `official_source_manifest_valid.json`, `element_decision_cards_core_valid.json` | `official_source_missing_url_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-SRC-002` | Workbook-derived educational models must not be promoted to official Elementor rules. | Critical | `docs/sources/OFFICIAL_SOURCE_MANIFEST.md` | `official-source-manifest.sources[].source_class`, `claims[].claim_type` | `validate-source-cards.mjs` rejects workbook-derived official platform capability proof | `official_source_manifest_valid.json` | `official_source_workbook_claims_official_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CARD-001` | Every MVK core element must have a decision card with minimum semantic children. | Critical | `docs/decision-cards/ELEMENT_DECISION_CARDS.md` | `element-decision-card.cards[]`, `minimum_semantic_children` | `validate-source-cards.mjs` requires exactly one card for every core element and semantic child depth | `element_decision_cards_core_valid.json` | `decision_card_unknown_element_id_invalid.json`, `decision_card_shallow_semantic_children_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CARD-002` | Decision cards must not claim project availability or runtime proof from official docs alone. | Critical | `docs/decision-cards/ELEMENT_DECISION_CARDS.md` | `element-decision-card.not_proven_by_official_docs`, forbidden proof claim scanner | `validate-source-cards.mjs` rejects project availability, runtime proof, Builder execution, and production readiness claims in non-allowed paths | `element_decision_card_svg_valid.json` | `decision_card_claims_project_availability_invalid.json`, `decision_card_missing_evidence_invalid.json`, `decision_card_forbidden_token_in_summary_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-001` | Architect and CE consumed card refs must resolve to a real matching Kernel decision card and official source refs. | Critical | `docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md` | `architect-source-card-consumption.consumed_element_id`, `ce-source-card-consumption.consumed_element_id`, `official_source_refs_used` | `validate-consumption-boundaries.mjs` checks card existence, card ref matching, source ref presence, card-source alignment, and support-status matching | `architect_consumes_svg_card_valid.json`, `ce_closes_div_block_constructability_with_limitations_valid.json` | `architect_consumes_unknown_card_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-002` | Architect records cannot claim project availability from official docs. | Critical | `docs/consumption-boundaries/ARCHITECT_SOURCE_CARD_CONSUMPTION.md` | `architect-source-card-consumption.not_proven_by_official_docs_acknowledged`, `forbidden_proof_claims` | `validate-consumption-boundaries.mjs` rejects project availability proof claims outside limitation/proof-gap fields | `architect_consumes_svg_card_valid.json` | `architect_claims_project_availability_from_official_docs_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-003` | Architect records cannot claim that a decision card proves the correct design choice. | Critical | `docs/consumption-boundaries/ARCHITECT_SOURCE_CARD_CONSUMPTION.md` | `architect-source-card-consumption.design_choice_status`, `forbidden_proof_claims` | `validate-consumption-boundaries.mjs` rejects correct-design-choice proof claims outside limitation/proof-gap fields | `architect_consumes_button_card_with_nested_link_risk_valid.json` | `architect_marks_design_choice_proven_by_card_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-004` | CE and Architect consumption records cannot claim Builder execution from source/cards. | Critical | `docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md` | `not_proven_by_official_docs_acknowledged`, `forbidden_proof_claims` | `validate-consumption-boundaries.mjs` rejects Builder execution proof claims outside limitation/proof-gap fields | `ce_closes_div_block_constructability_with_limitations_valid.json` | `ce_claims_builder_execution_from_decision_card_invalid.json`, `ce_claims_builder_executing_variant_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-005` | CE and Architect consumption records cannot claim runtime responsive validation from official docs. | Critical | `docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md` | `not_proven_by_official_docs_acknowledged`, `forbidden_proof_claims` | `validate-consumption-boundaries.mjs` rejects runtime validation proof claims outside limitation/proof-gap fields | `ce_marks_grid_as_insufficient_project_evidence_valid.json` | `ce_claims_runtime_validation_from_official_docs_invalid.json`, `ce_claims_runtime_validation_proven_variant_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-006` | Kernel-local consumption records cannot claim downstream enforcement or production readiness. | Critical | `docs/consumption-boundaries/SOURCE_CARD_CONSUMPTION_BOUNDARIES.md` | `forbidden_proof_claims`, forbidden proof scanner | `validate-consumption-boundaries.mjs` rejects downstream enforcement and production readiness claims outside limitation/proof-gap fields | `architect_consumes_svg_card_valid.json`, `ce_marks_grid_as_insufficient_project_evidence_valid.json` | `architect_claims_downstream_enforcement_invalid.json`, `architect_claims_production_readiness_variant_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-007` | CE constructable_with_limitations or constructable_pending_builder_resolution requires constructability evidence. | Critical | `docs/consumption-boundaries/CE_SOURCE_CARD_CONSUMPTION.md` | `ce-source-card-consumption.constructability_assessment_status`, `constructability_evidence` | `validate-consumption-boundaries.mjs` rejects closure-like CE constructability statuses without evidence | `ce_closes_div_block_constructability_with_limitations_valid.json` | `ce_closure_missing_constructability_evidence_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |
| `R-MVK-CONSUME-008` | CE must check or acknowledge every required_evidence item listed by the consumed card. | Critical | `docs/consumption-boundaries/CE_SOURCE_CARD_CONSUMPTION.md` | `ce-source-card-consumption.required_evidence_checked` | `validate-consumption-boundaries.mjs` compares CE checked evidence against consumed card required_evidence and schema-enforces `evidence_ref`/`reason` conditionals | `ce_closes_div_block_constructability_with_limitations_valid.json`, `ce_marks_grid_as_insufficient_project_evidence_valid.json` | `ce_ignores_card_required_evidence_invalid.json`, `ce_checked_required_evidence_missing_ref_invalid.json`, `ce_acknowledged_required_evidence_missing_reason_invalid.json`, `ce_not_applicable_required_evidence_missing_reason_invalid.json` | `Validate MVK` / `npm run validate:mvk` | `None` | `per_artifact` | `block` | `fixture_tested` |

## Deferred Out-of-Scope Rules

`R-MVK-004` approved class-name mutation and `R-MVK-009` production readiness remain outside this Prompt 4.5 / v0.4.1 audit-model patch. They must not be marked enforced until explicit schema carriers, validators, fixtures, CI steps, and downstream consumers exist.

`R-MVK-CONSUME-006` is Kernel-local fixture-tested for downstream-enforcement overclaiming. Production-readiness overclaiming is fixture-tested with a dedicated invalid consumption fixture; downstream rejection itself remains out of scope.

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

`fixture_tested` means local validator and fixtures cover the rule and invalid fixtures assert exact expected diagnostic codes and reject unexpected extra diagnostics. It does not mean CI enforcement or downstream contract enforcement.
