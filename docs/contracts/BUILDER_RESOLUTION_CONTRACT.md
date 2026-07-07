# Builder Resolution Contract — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Planned Builder execution-resolution carrier after CE Closure  
Owner or intended consumer: Builder, CE, Project Gate, Kernel validators

future_schema_path: `kernel/schemas/builder-resolution.schema.json`

## What This Document Is

This document plans how Builder should later resolve approved decisions into exact controls, values, units, classes, states, viewports, and UI paths.

## What This Document Is Not

```text
- not a final schema
- not yet CI-enforced
- not yet runtime-validated
- not a Builder UX response template
- not constructability proof
```

## Confirmed Facts

```text
- Builder executes only approved, locked, evidence-bound decisions.
- Builder must not invent architecture, substitute elements, or guess missing controls/units.
- Builder UX guidance may support evidence request wording and correction flow, but it is not proof of constructability.
```

## Proposed Approach

Proposed planning shape:

```yaml
builder_resolution:
  resolution_id: BR-001
  ce_closure_ref: CE-CLOSE-001
  decision_refs: []
  resolved_controls:
    - target_element_ref: string
      control_name: string
      value: string
      unit: string
      viewport: desktop | tablet | mobile
      state: default | hover | focus | active
      class_name: string
      ui_path_evidence_ref: string
  fallback_used: false
  fallback_ref: null
  unresolved_items: []
```

Allowed cross-reference to `docs/ux/BUILDER_UX_RESPONSE_BOUNDARY.md` is limited to:

```text
- evidence request wording
- correction flow
- targeted screenshot request
- no hidden-state claim
- UI vocabulary sync
- active silence
- escape hatch
```

## Open Decisions

```text
- exact resolved_controls shape
- exact fallback whitelist representation
- exact UI path evidence minimum
- exact class-name approval representation
```

## Acceptance Criteria

```text
- Builder Resolution references CE Closure.
- Builder Resolution references locked upstream decisions.
- Missing UI path evidence can be represented.
- Unlisted fallback can later fail validation.
- UX boundary is not used as constructability proof.
```

## What Must Not Be Done Yet

```text
- do not create Builder schema yet
- do not create Builder validator yet
- do not mix UX response templates into Kernel domain contracts
- do not let Builder invent architecture
- do not claim execution occurred
```