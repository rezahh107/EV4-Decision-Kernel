# Official Source Manifest

Status: Kernel-local Prompt 3 source extraction  
Scope: Elementor V4 source references for MVK decision cards

## Boundary

Elementor documentation remains the upstream source of truth. The Kernel stores structured source references, short claim summaries, verification scope, limitations, and decision-card mappings. It does not mirror full Elementor documentation.

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
kernel/official-sources/evidence-labels.v0.json
kernel/schemas/official-source-manifest.schema.json
```

## Prompt 3 Limitation

This pass verifies and structures source references. It does not create docs monitoring, release automation, downstream adapters, runtime evidence, project evidence, or production readiness proof.
