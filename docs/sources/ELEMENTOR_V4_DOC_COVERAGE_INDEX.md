# Elementor V4 Doc Coverage Index

**Status:** Kernel-local documentation coverage contract  
**Scope:** required Elementor V4 official documentation areas, context-source handling, no-card reasons, evidence labels, and not-proven boundaries

## Purpose

`kernel/official-sources/elementor-v4-doc-coverage-index.v0.json` records important Elementor V4 documentation areas that must not silently disappear from the Kernel source model.

The index is not a full Elementor documentation mirror. It is a coverage guard for the current MVK phase.

## Boundary

```text
official Elementor documentation -> documented capability or editor behavior only
coverage index -> representation and limitation tracking only
fixture validation -> local validator behavior only
```

The index does not prove target WordPress project availability, current user permission, Elementor Pro license, correct design choice, constructability, Builder execution, responsive runtime validation, downstream acceptance, or production readiness.

## Required Coverage Groups

```text
core editor context:
  editor_v4_activation
  v4_features_atomic_elements

core MVK element cards:
  div_block, flexbox, grid, heading, paragraph, button, image, svg
  represented in kernel/decision-cards/elements.core.v0.json

class and style governance:
  classes_local_global
  class_priority_cascade
  class_manager
  user_roles_classes
  element_states

responsive and reset boundaries:
  responsive_editing_inheritance
  reset_style_reconciliation
  viewport_control
  breakpoints_insufficient_evidence

design-system and dynamic context:
  variables
  variables_manager
  components_dependencies
  dynamic_tags_boundaries
  interactions_limitations

link and compatibility boundaries:
  nested_links
  v3_v4_differences

property-level and UI-path context:
  logical_properties
  attributes
  ui_path_boundaries
```

## Context Sources and No-Card Reasons

Non-core documentation areas may be represented as `context_source`, `evidence_boundary`, `documented_limitation`, or `insufficient_evidence_gap` instead of a decision card. Each such area requires `no_decision_card_reason` so future agents do not mistake missing cards for accidental omissions.

Examples:

```text
classes_local_global -> class governance context, not element selection
class priority -> cascade-order context, not target mutation approval
states -> style-state context, not runtime state validation
responsive editing -> inheritance context, not browser/runtime proof
variables -> design-system value context, not target variable inventory
logical properties -> property-level context, not a full control registry
attributes -> property-level context, not runtime DOM proof
nested links -> topology constraint source, not a new element card
V3/V4 differences -> compatibility context, not target compatibility proof
```

## Validator

```bash
node kernel/validator/validate-elementor-doc-coverage.mjs
```

The validator checks required doc areas, source refs, evidence label refs, no-card reasons, Components overclaim risk, exact source binding for sensitive areas, responsive inheritance boundaries, reset reconciliation, Nested Links coverage, V3/V4 difference coverage, and forbidden proof claims outside allowed limitation/not-proven fields.
