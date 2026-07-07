# Contract Index — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Index of planned MVK contract documents only  
Owner or intended consumer: EV4 Decision Kernel maintainers and downstream EV4 stage owners

## What This Document Is

This is the index for Wave 0 contract planning documents.

## What This Document Is Not

```text
- not a final schema index
- not yet CI-enforced
- not yet runtime-validated
- not a release manifest
- not a full registry
```

## Confirmed Facts

```text
- Contract documents in docs/contracts/ are planning documents only.
- Proposed YAML shapes are examples, not final schemas.
- Actual schema files are not created in Wave 0.
```

## Proposed Approach

Planned contracts:

```text
EVIDENCE_MODEL_CONTRACT.md
KERNEL_PIN_CONTRACT.md
DECISION_RECORD_CONTRACTS.md
CE_CLOSURE_CONTRACT.md
BUILDER_RESOLUTION_CONTRACT.md
PROJECT_GATE_ACCEPTANCE_PACKET.md
```

Planned future schema paths:

```yaml
future_schema_paths:
  evidence_model: kernel/schemas/evidence.schema.json
  kernel_pin: kernel/schemas/kernel-pin.schema.json
  decision_records: kernel/schemas/decision-records/*.schema.json
  ce_closure: kernel/schemas/ce-closure.schema.json
  builder_resolution: kernel/schemas/builder-resolution.schema.json
  project_gate_acceptance_packet: kernel/schemas/project-gate-acceptance-packet.schema.json
```

## Open Decisions

```text
- exact schema naming convention
- exact schema versioning convention
- exact validator output format
- exact validation-pack directory layout
```

## Acceptance Criteria

```text
- Every listed contract clearly says it is planning-only.
- Every listed contract has a future schema path.
- No contract claims CI enforcement or runtime validation.
- The index stays small and MVK-scoped.
```

## What Must Not Be Done Yet

```text
- do not create actual schema files
- do not create a full contract registry
- do not create release artifacts
- do not create migration automation
- do not claim downstream enforcement
```