# EV4 Kernel Decision Receipt Safety Profile

**Status:** canonical for Wave 5 receipt-safety semantics only  
**Profile:** `ev4.kernel.consumer-decision-receipt-safety-profile@1.0.0`  
**Owner:** `rezahh107/EV4-Decision-Kernel`  
**Intended consumers:** EV4 Architect, CE, Builder, Responsive, Project Gate, and receipt/rendering maintainers

## What This Profile Is

This profile is the normative safety boundary for a human-readable Wave 5 Kernel decision receipt. It resolves the six-field versus seven-field ambiguity by distinguishing the base decision structure from the stricter closure required to authorize a visible success receipt.

The machine-readable authority is:

```text
kernel/decision-governance/consumer-decision-receipt-safety-profile.v1.json
kernel/schemas/consumer-decision-receipt-safety-profile.v1.schema.json
kernel/validator/validate-consumer-decision-receipt-safety-profile.mjs
```

## What This Profile Is Not

This profile does not complete Wave 5, implement consumer adoption, implement Project Gate intake, prove downstream or runtime enforcement, prove Builder or fallback execution, or authorize production/release readiness. It does not redefine `kernel/schemas/decision-record.v2.schema.json`.

## Presentation Boundary

Wave 5 is a presentation-layer extension:

```text
machine-readable decision trace
        ↓ exact authoritative acceptance
short human-readable receipt
```

Receipt text never replaces, repairs, or mutates machine-readable trace data. Friendly wording, a green marker, or a raw `status: accepted` object is not authoritative validation evidence.

## Success Trace Closure

A success receipt requires one complete, accepted closure for every applicable trace:

```yaml
required_receipt_success_trace_fields:
  - decision_family
  - decision_card_ref
  - selected_option
  - rejected_options
  - evidence_refs
  - evidence_state
  - consumer_stage
```

The six fields in the base architecture remain the compact Kernel decision structure. The seventh field, `consumer_stage`, is mandatory when authorizing receipt success because it closes the presentation trace to the exact EV4 consumer stage.

`consumer_stage` may come from an authoritative machine-readable enclosing carrier only when the carrier retains its exact source and is deterministically bound to the exact decision trace. It must not be inferred from prose or receipt text. Missing or ambiguous stage binding must produce `warning` or `blocked`, never `success`; this profile chooses `blocked`.

## Evidence and Acceptance

Success requires:

```yaml
evidence_state: validated
authoritative_validation:
  authority_type: kernel_validator | project_gate
  result: accepted
  authority_id: required
  artifact_ref: required
  exact_trace_binding: required
```

These states cannot authorize success:

```text
provided
expected_unverified
unverified
proposed
derived
insufficient_evidence
```

Field presence is insufficient. The applicable schema, deterministic validator, or Gate must have accepted the exact trace. A free object containing only `status: accepted` is not proof.

## Multiple Lineage Entries

Prefer one receipt per trace. Aggregate success is allowed only when every applicable trace is referenced, complete, `validated`, and exactly bound to authoritative acceptance.

```text
all(trace_is_safe(entry) for entry in lineage)  → may authorize success
any(trace_is_safe(entry) for entry in lineage)  → must not authorize success
```

## Execution and Runtime Wording

A receipt must not claim Builder execution or fallback execution without separately inspected execution evidence bound to that claim. Runtime mismatch remains a warning or decision-reopen condition; it does not grant Responsive authority to redesign or rewrite the source decision.

## Forbidden Status Upgrades

Receipt presence must not upgrade:

```text
ci_enforced
sequence_ci_enforced
downstream_contract_enforced
runtime_monitor_enforced
os_harness_enforced
resolved
production_ready
release_ready
```

## Role Boundaries

- Architect owns selected design choices and decision records.
- CE owns constructability proof and decision closure.
- Builder executes locked decisions and must not invent architecture.
- Responsive validates runtime behavior and may warn or trigger reopen without redesign authority.
- Project Gate validates lineage and acceptance without becoming a design authority.
- Kernel owns shared receipt-safety semantics without choosing a section-specific design.

## Technical Detail Visibility

Show technical identifiers by default only when they are actionable. Otherwise retain them in optional technical details so the user-facing receipt remains short without losing traceability.

## Validation

```bash
npm run validate:consumer-receipt-profile
npm run validate:mvk
```

The dedicated validator schema-validates the profile, checks normative invariants, and proves positive and negative fixtures with stable `EV4.RECEIPT.*` diagnostic IDs.

## Next Allowed Step

Consumer repositories may adopt this profile in separately scoped work. Adoption and downstream rejection evidence must be inspected before any stronger enforcement claim.

## Must Not Be Done Yet

```text
- do not claim Wave 5 complete
- do not mark KROAD-010 complete
- do not claim consumer adoption or downstream rejection
- do not claim runtime monitoring
- do not claim Builder/fallback execution without execution evidence
- do not claim production or release readiness
```
