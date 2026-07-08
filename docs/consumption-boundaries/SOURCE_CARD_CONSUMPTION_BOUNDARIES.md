# Source/Card Consumption Boundaries

Status: Kernel-local Prompt 4 consumption-boundary contract  
Scope: Architect and CE consumption of Kernel source/card artifacts only

## Purpose

This boundary defines how future Architect and CE records may consume Kernel-owned official source refs and decision cards without overclaiming what those artifacts prove.

```text
Documented Elementor capability
!= enabled in target project
!= allowed for current user
!= correct design choice
!= constructability proven
!= exact UI path proven
!= Builder executed
!= Responsive validated
!= production ready
```

## Enforcement Level

```text
prompt_level_influence:
  prose guidance, examples, templates, role instructions

system_level_enforcement:
  JSON Schema validation, semantic validator checks, fixtures, expected diagnostics, and CI when observed
```

Prompt 4 adds Kernel-local system-level enforcement for Architect and CE consumption records. It does not add downstream rejection in Architect, CE, Builder, Responsive, or Project Gate repositories.

## Files

```text
kernel/schemas/architect-source-card-consumption.schema.json
kernel/schemas/ce-source-card-consumption.schema.json
kernel/validator/validate-consumption-boundaries.mjs
kernel/fixtures/valid/architect_consumes_svg_card_valid.json
kernel/fixtures/valid/architect_consumes_button_card_with_nested_link_risk_valid.json
kernel/fixtures/valid/ce_closes_div_block_constructability_with_limitations_valid.json
kernel/fixtures/valid/ce_marks_grid_as_insufficient_project_evidence_valid.json
kernel/fixtures/invalid/architect_consumes_unknown_card_invalid.json
kernel/fixtures/invalid/architect_claims_project_availability_from_official_docs_invalid.json
kernel/fixtures/invalid/architect_marks_design_choice_proven_by_card_invalid.json
kernel/fixtures/invalid/architect_claims_downstream_enforcement_invalid.json
kernel/fixtures/invalid/ce_claims_builder_execution_from_decision_card_invalid.json
kernel/fixtures/invalid/ce_claims_runtime_validation_from_official_docs_invalid.json
kernel/fixtures/invalid/ce_closure_missing_constructability_evidence_invalid.json
kernel/fixtures/invalid/ce_ignores_card_required_evidence_invalid.json
```

## Validator Checks

```text
- consumed_element_id must exist in kernel/decision-cards/elements.core.v0.json.
- consumed_card_ref must match the consumed element card ref.
- official_source_refs_used must exist in kernel/official-sources/elementor-v4-source-manifest.v0.json.
- Architect records must not claim project availability from official docs.
- Architect records must not claim a decision card proves the correct design choice.
- CE records must not claim Builder execution.
- CE records must not claim runtime responsive validation.
- CE constructable_with_limitations / constructable_pending_builder_resolution require constructability_evidence.
- CE must check or acknowledge each required_evidence item listed by the consumed card.
- Downstream enforcement, production readiness, runtime validation, Builder execution, project availability, and correct-design-choice proof claims are rejected outside explicit limitation/proof-gap fields.
```

## Not Included

```text
- Architect repo patch
- CE repo patch
- Builder repo patch
- Responsive repo patch
- Project Gate integration
- target WordPress project evidence
- Builder execution proof
- responsive runtime proof
- production readiness proof
- downstream contract enforcement
```
