# MVK Scope — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Minimum Viable Kernel scope definition only  
Owner or intended consumer: EV4 Decision Kernel maintainers and future EV4 stage validators

## What This Document Is

This is a planning document for the smallest useful Kernel.

## What This Document Is Not

```text
- not a final schema
- not yet CI-enforced
- not yet runtime-validated
- not a full Elementor registry
- not a release artifact
```

## Confirmed Facts

```text
- Current decision: MODIFY_ARCHITECTURE.
- Adopted direction: central Kernel, local profile without rule fork, MVK-first.
- Deferred direction: broad registries, release automation, migrations, reusable workflow centralization, docs monitoring, signed outputs.
```

## Proposed Approach

The initial MVK includes only:

```text
1. Evidence model
2. Kernel pin contract
3. Core element IDs: Div Block, Flexbox, Grid, Heading, Paragraph, Button, Image, SVG
4. Core hard gates: nested clickable topology, absolute containing block proof, responsive provenance
5. Element Decision Record
6. Position Decision Record
7. Value/Unit Decision Record
8. CE Closure
9. Builder Resolution
10. Project Gate Acceptance Packet
11. Valid/invalid fixture strategy
12. One local validator plan
```

Future schema paths are planned only:

```yaml
future_schema_paths:
  evidence_model: kernel/schemas/evidence.schema.json
  kernel_pin: kernel/schemas/kernel-pin.schema.json
  element_decision_record: kernel/schemas/decision-records/element-decision-record.schema.json
  position_decision_record: kernel/schemas/decision-records/position-decision-record.schema.json
  value_unit_decision_record: kernel/schemas/decision-records/value-unit-decision-record.schema.json
  ce_closure: kernel/schemas/ce-closure.schema.json
  builder_resolution: kernel/schemas/builder-resolution.schema.json
  project_gate_acceptance_packet: kernel/schemas/project-gate-acceptance-packet.schema.json
```

## Open Decisions

```text
- exact schema syntax
- exact validator language
- exact fixture naming convention
- exact local wrapper command
- exact Kernel pin hash algorithm
```

## Acceptance Criteria

```text
- MVK scope remains small.
- Only the approved core element IDs are in scope.
- Only the approved hard gates are in scope.
- Contract documents stay planning-only.
- No implementation readiness is claimed.
```

## What Must Not Be Done Yet

```text
- do not add full Dynamic Tags registry
- do not add full Components registry
- do not add full Variables registry
- do not add full Control-Level Registry
- do not create release automation
- do not create migration automation
- do not claim CI enforcement or runtime validation
```