# Element Decision Cards

Status: Kernel-local decision artifacts with Elementor V4 doc coverage context  
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

## Context Sources Without Cards

Not every official Elementor V4 documentation area becomes a decision card. The doc coverage index records context-only sources and requires a `no_decision_card_reason`.

Examples:

```text
class priority -> class governance context
Class Manager -> class order and cleanup context
user roles/classes -> permission boundary
responsive editing -> inheritance context, not runtime proof
Nested Links -> topology constraint source
V3/V4 differences -> compatibility context
Variables Manager -> design-system governance context
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
nested clickable topology vs safe CTA topology
```

## Repairs in This Coverage Pass

```text
- Button now references the official Nested Links source.
- Div Block, Flexbox, Grid, and Image cards include nested-link/topology awareness where relevant.
- Grid remains partially supported because the inspected official source is Grid Container documentation.
- Context-only docs remain in the doc coverage index, not as broad new cards.
```

## Not Proven

```text
project_availability_proven
responsive_runtime_proven
builder_execution_proven
production_ready
```

Those claims require future project, runtime, Builder, and release evidence.
