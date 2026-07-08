# Element Decision Cards

Status: Kernel-local Prompt 3 decision artifacts  
Scope: MVK core elements only

## Purpose

Element Decision Cards convert source-backed Elementor V4 element knowledge into model-usable decision guidance. They are not full Elementor documentation and are not Builder execution instructions.

## Covered IDs

```text
v4.div_block
v4.flexbox
v4.grid
v4.heading
v4.paragraph
v4.button
v4.image
v4.svg
```

## Decision Boundary

Cards help the Architect distinguish:

```text
Div Block vs Flexbox vs Grid
Heading vs Paragraph
Button vs non-interactive content
Image vs SVG
editable text vs flattened media
decorative media vs meaningful media
source-backed capability vs project availability
```

## Files

```text
kernel/decision-cards/elements.core.v0.json
kernel/schemas/element-decision-card.schema.json
kernel/fixtures/valid/element_decision_cards_core_valid.json
```

## Not Proven

```text
project_availability_proven
responsive_runtime_proven
builder_execution_proven
production_ready
```

Those claims require future project, runtime, Builder, and release evidence.
