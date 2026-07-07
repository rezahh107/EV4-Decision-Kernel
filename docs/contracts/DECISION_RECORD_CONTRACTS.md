# Decision Record Contracts — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Planned Element, Position, and Value/Unit Decision Records for MVK  
Owner or intended consumer: Architect, CE, Builder, Project Gate, Kernel validators

future_schema_path: `kernel/schemas/decision-records/*.schema.json`

## What This Document Is

This document plans the minimum decision-record contracts required for the MVK vertical slice.

## What This Document Is Not

```text
- not a final schema
- not yet CI-enforced
- not yet runtime-validated
- not a full control registry
- not an Elementor design recommendation
```

## Confirmed Facts

```text
- Architect owns candidate generation, comparison, selection, and decision records.
- Builder must execute only approved, locked, evidence-bound decisions.
- Builder must not invent architecture or substitute elements.
```

## Proposed Approach

Planned record families:

```yaml
element_decision_record:
  decision_id: EDR-001
  selected_element_id: Div Block | Flexbox | Grid | Heading | Paragraph | Button | Image | SVG
  allowed_alternatives: []
  rejected_alternatives: []
  evidence_refs: []
  locked: true

position_decision_record:
  decision_id: PDR-001
  target_element_ref: string
  position_mode: static | relative | absolute
  containing_block_ref: string
  containing_block_proof_ref: string
  evidence_refs: []
  locked: true

value_unit_decision_record:
  decision_id: VUDR-001
  target_control: string
  value: string
  unit: px | rem | em | percent | auto | none | unknown
  viewport: desktop | tablet | mobile
  provenance: explicit | inherited | overridden | reset | default | unknown
  evidence_refs: []
```

## Open Decisions

```text
- exact ID format
- exact allowed unit enum
- exact responsive provenance model
- exact relationship to future element registry IDs
```

## Acceptance Criteria

```text
- Records can represent selected elements, positioning proof, and value/unit provenance.
- Records can be locked for downstream execution.
- Missing containing-block proof can later fail validation.
- Unknown responsive provenance can be represented explicitly.
```

## What Must Not Be Done Yet

```text
- do not create schema files yet
- do not create a full control-level registry
- do not add full Elementor element coverage
- do not let Builder add unlisted fallbacks
- do not claim validation is enforced
```