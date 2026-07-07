# Project Gate Acceptance Packet — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Planned Project Gate verifier packet for MVK handoff  
Owner or intended consumer: Project Gate, Kernel validators, EV4 stage owners

future_schema_path: `kernel/schemas/project-gate-acceptance-packet.schema.json`

## What This Document Is

This document plans the minimum packet Project Gate should later verify after Architect, CE, Builder, and Responsive records exist.

## What This Document Is Not

```text
- not a final schema
- not yet CI-enforced
- not yet runtime-validated
- not Project Gate implementation
- not an Elementor design-decision owner
```

## Confirmed Facts

```text
- Project Gate verifies lineage, schema validity, evidence completeness, registry version/hash, ownership, and stage authority.
- Project Gate must not make Elementor design decisions.
- Missing Kernel pin/hash and missing CE Closure are future rejection cases.
```

## Proposed Approach

Proposed planning shape:

```yaml
project_gate_acceptance_packet:
  packet_id: PGA-MVK-001
  kernel_pin_ref: string
  kernel_snapshot_hash: string
  architect_record_refs: []
  ce_closure_ref: string
  builder_resolution_ref: string
  responsive_validation_ref: string
  evidence_refs: []
  stage_authority:
    architect: present
    ce: present
    builder: present
    responsive: present
  validation_summary:
    static_validation: planned
    semantic_validation: planned
    runtime_validation: not_claimed
```

Minimum future rejection cases:

```text
- missing kernel_pin_ref
- missing kernel_snapshot_hash
- missing ce_closure_ref
- missing builder_resolution_ref
- stage owner mismatch
- runtime_validation claimed without runtime evidence
```

## Open Decisions

```text
- exact packet schema
- exact stage-authority encoding
- exact error code system
- exact relationship to Project Gate repository validation output
```

## Acceptance Criteria

```text
- Packet can carry pin/hash, stage records, and evidence references.
- Gate can reject incompleteness without making domain choices.
- Runtime validation remains separate from static and semantic validation.
- Project Gate remains verifier-only.
```

## What Must Not Be Done Yet

```text
- do not implement Project Gate validation here
- do not edit EV4-Project-Gate
- do not create schema files yet
- do not claim CI or runtime validation
- do not let Gate decide SVG vs Image or Flexbox vs Grid
```