# Official Source Manifest

Status: Kernel-local official source extraction and Elementor V4 doc coverage repair  
Scope: Elementor V4 source references for MVK decision cards and required context-source coverage

## Boundary

Elementor documentation remains the upstream source of truth. The Kernel stores structured source references, short claim summaries, verification scope, limitations, decision-card mappings, and doc coverage mappings. It does not mirror full Elementor documentation.

## Evidence Rules

```text
official_elementor_help / official_elementor_developer_docs -> may support documented platform or editor capability
workbook_derived -> educational taxonomy only, never official Elementor proof
official docs -> do not prove target project availability
runtime proof -> requires future Browser Runtime evidence
project availability -> requires future WordPress/EDIS project evidence
Builder execution -> requires future Builder evidence
```

## Files

```text
kernel/official-sources/elementor-v4-source-manifest.v0.json
kernel/official-sources/elementor-v4-doc-coverage-index.v0.json
kernel/official-sources/evidence-labels.v0.json
kernel/schemas/official-source-manifest.schema.json
kernel/schemas/elementor-v4-doc-coverage-index.schema.json
kernel/validator/validate-elementor-doc-coverage.mjs
```

## Coverage Repair

The source manifest now includes required V4 context sources for Atomic/V4 features, class priority, Class Manager, user roles/classes, responsive editing, reset-style reconciliation, Variables Manager, Nested Links, V3/V4 differences, viewport control, logical properties, and attributes.

The coverage index defines whether each documentation area is represented as a core decision card, context source, evidence boundary, documented limitation, or insufficient-evidence gap.

## Prompt Limitation

This pass verifies and structures source references and coverage boundaries. It does not create docs monitoring, release automation, downstream adapters, runtime evidence, project evidence, or production readiness proof.
