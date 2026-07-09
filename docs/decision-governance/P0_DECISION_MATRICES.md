# P0 Decision Matrices

**Status:** KROAD-004 foundation / Kernel-local  
**Scope:** high-value Elementor V4 comparison matrices only  
**Owner:** Kernel  
**Machine-readable artifact:** `kernel/decision-governance/p0-decision-matrices.v0.json`

## What this is

This document explains how to use `p0-decision-matrices.v0.json`.

The matrix registry gives Architect, CE, Builder, and Responsive a shared comparison structure for the first P0 Elementor V4 decision families. It records candidate options, required evidence, evidence tier, likely downstream consumer, constructability concerns, runtime concerns, accessibility concerns, rejected-alternative requirements, provisional behavior, forbidden overclaims, V4-only boundary, and source/evidence references.

## What this is not

This is not a Resolver, not `KROAD-005`, not a final design decision, not a full Elementor feature registry, and not a control-level registry.

A matrix does not produce:

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

## Required P0 families covered

`p0-decision-matrices.v0.json` covers the KROAD-004 required families:

| Matrix | Candidate options | Primary owner/consumers |
|---|---|---|
| `layout_structure` | `div_block`, `flexbox`, `grid` | Kernel → Architect / CE / Builder / Responsive |
| `media_choice` | `image`, `svg`, `background_image` | Kernel → Architect / CE / Builder / Responsive |
| `text_semantics` | `heading`, `paragraph` | Kernel → Architect / CE / Builder / Responsive |
| `interaction_link_topology` | `button`, `link`, `clickable_container` | Kernel → Architect / CE / Builder / Responsive |
| `positioning_safety` | `normal_flow`, `relative`, `absolute` | Kernel → Architect / CE / Builder / Responsive |
| `styling_mechanism` | `native_control`, `custom_css` | Kernel → Architect / CE / Builder / Responsive |
| `class_scope` | `local_class`, `global_class` | Kernel → Architect / CE / Builder |
| `value_binding` | `variable`, `literal` | Kernel → Architect / CE / Builder |
| `unit_decision` | `px`, `rem`, `percent`, `auto`, `variable` | Kernel → Architect / CE / Builder / Responsive |

## Evidence model

Each matrix currently requires at least `project_export` evidence for project-specific use. Official Elementor documentation may support documented platform/editor capability, but it does not prove target-project availability, active Pro license, current user permission, constructability, Builder execution, frontend runtime behavior, downstream acceptance, or production readiness.

Runtime-sensitive concerns remain provisional until a later runtime/browser evidence layer exists.

## How downstream roles should use it

Architect may use the matrices to compare options and record rejected alternatives, but must not treat a matrix as proof of a correct design choice.

CE may use the matrices to identify constructability questions and required evidence, but must not treat the matrix as Builder execution proof.

Builder may use the matrices only as a locked-decision context once a valid decision record or later resolver output exists. Builder must not infer a selected option directly from this matrix.

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

No new schema or validator is added in KROAD-004. Existing repository validation should still be run for regression:

```bash
npm run validate:mvk
npm run validate:roadmap-memory
```

Because this KROAD adds a machine-readable guidance artifact without a new validator path, schema/fixture enforcement remains a follow-up candidate only if a later roadmap item explicitly asks for a matrix contract or resolver contract.

## Next allowed step

The next roadmap item remains `KROAD-005 — Decision Resolver Contract` after KROAD-004 is merged and validated. KROAD-005 must define how a matrix becomes an executable or semi-executable resolver contract; it must not be treated as implemented by this file.

## Must not be done yet

- Do not build the Resolver.
- Do not emit resolver results from these matrices.
- Do not claim downstream enforcement.
- Do not claim runtime proof.
- Do not claim Builder execution proof.
- Do not claim production readiness.
- Do not expand this into a full Elementor feature/control registry.
