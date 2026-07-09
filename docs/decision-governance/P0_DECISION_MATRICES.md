# P0 Decision Matrices

**Status:** KROAD-004 foundation / Kernel-local; KROAD-006 has a limited resolver-backed subset  
**Scope:** high-value Elementor V4 comparison matrices only  
**Owner:** Kernel  
**Machine-readable artifact:** `kernel/decision-governance/p0-decision-matrices.v0.json`

## What this is

This document explains how to use `p0-decision-matrices.v0.json`.

The matrix registry gives Architect, CE, Builder, and Responsive a shared comparison structure for the first P0 Elementor V4 decision families. It records candidate options, required evidence, evidence tier, likely downstream consumer, constructability concerns, runtime concerns, accessibility concerns, rejected-alternative requirements, provisional behavior, forbidden overclaims, V4-only boundary, and source/evidence references.

## What this is not

The matrix file itself is not the Resolver, not a final design decision, not a full Elementor feature registry, and not a control-level registry.

A matrix by itself does not produce:

```text
resolver_status
auto_resolved
selected_option
final_decision
decision_correctness_proven
builder_execution_proven
runtime_validated
production_ready
```

## Relation to KROAD-006 Resolver MVP

KROAD-006 adds a separate limited Resolver MVP for one high-risk family:

```text
layout_structure
```

The active resolver artifacts live outside the matrix file:

```text
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/resolver-mvp/resolve-high-risk-p0.mjs
docs/decision-governance/RESOLVER_MVP_KROAD_006.md
```

The matrix remains comparison guidance. The resolver must explicitly reference the matrix and must still satisfy rule/evidence/fixture validation.

## Required P0 families covered

`p0-decision-matrices.v0.json` covers the KROAD-004 required families:

| Matrix | Candidate options | Current resolver-backed status |
|---|---|---|
| `layout_structure` | `div_block`, `flexbox`, `grid` | limited KROAD-006 MVP |
| `media_choice` | `image`, `svg`, `background_image` | not resolver-backed yet |
| `text_semantics` | `heading`, `paragraph` | not resolver-backed yet |
| `interaction_link_topology` | `button`, `link`, `clickable_container` | not resolver-backed yet |
| `positioning_safety` | `normal_flow`, `relative`, `absolute` | not resolver-backed yet |
| `styling_mechanism` | `native_control`, `custom_css` | not resolver-backed yet |
| `class_scope` | `local_class`, `global_class` | not resolver-backed yet |
| `value_binding` | `variable`, `literal` | not resolver-backed yet |
| `unit_decision` | `px`, `rem`, `percent`, `auto`, `variable` | not resolver-backed yet |

## Evidence model

Each matrix currently requires at least `project_export` evidence for project-specific use. Official Elementor documentation may support documented platform/editor capability, but it does not prove target-project availability, active Pro license, current user permission, constructability, Builder execution, frontend runtime behavior, downstream acceptance, or production readiness.

Runtime-sensitive concerns remain provisional until a later runtime/browser evidence layer exists.

## How downstream roles should use it

Architect may use the matrices to compare options and record rejected alternatives, but must not treat a matrix as proof of a correct design choice.

CE may use the matrices to identify constructability questions and required evidence, but must not treat the matrix as Builder execution proof.

Builder may use the matrices only as locked-decision context once a valid decision record or resolver output exists. Builder must not infer a selected option directly from this matrix.

Responsive may use runtime concern fields to identify what later browser/runtime validation must check. The matrices do not validate runtime behavior.

## V4-only boundary

Elementor V4 is the only valid target design scope. Elementor V3 may appear only as legacy risk, migration boundary, unsupported target, forbidden fallback, or compatibility warning. V3 is never a valid target option in this registry.

## Source and evidence references

The matrices reuse existing Kernel vocabulary from:

```text
kernel/official-sources/elementor-v4-source-manifest.v0.json
kernel/official-sources/evidence-labels.v0.json
kernel/decision-governance/p0-decision-family-registry.v0.json
```

The matrix artifact is intentionally small and source-ref based. It does not copy official Elementor documentation and does not create a full documentation mirror.

## Validation

Run:

```bash
npm run validate:mvk
npm run validate:roadmap-memory
```

For the limited KROAD-006 Resolver MVP, also run:

```bash
npm run validate:resolver-mvp
```

## Must not be done yet

- Do not infer resolver output for families that have no active resolver rule.
- Do not claim downstream enforcement.
- Do not claim runtime proof.
- Do not claim Builder execution proof.
- Do not claim production readiness.
- Do not expand this into a full Elementor feature/control registry.
