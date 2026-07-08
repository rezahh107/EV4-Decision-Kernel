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

## Context Sources and No-Card Reasons

Non-core documentation areas may be represented as `context_source`, `evidence_boundary`, or `documented_limitation` instead of a decision card. Each such area requires `no_decision_card_reason` so future agents do not mistake missing cards for accidental omissions.

Examples:

```text
class priority -> context source for class governance, not a core element card
user roles/classes -> permission boundary, not element selection
responsive editing -> inheritance context, not runtime proof
nested links -> topology constraint source, not a new element card
V3/V4 differences -> compatibility context, not target compatibility proof
```

## Validator

```bash
node kernel/validator/validate-elementor-doc-coverage.mjs
```

The validator checks required doc areas, source refs, evidence label refs, no-card reasons, Components overclaim risk, class-priority coverage, responsive inheritance boundaries, reset reconciliation, Nested Links coverage, V3/V4 difference coverage, and forbidden proof claims outside allowed limitation/not-proven fields.
