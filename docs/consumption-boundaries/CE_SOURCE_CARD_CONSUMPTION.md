# CE Source/Card Consumption

Status: Kernel-local Prompt 4 contract  
Owner: CE consumer boundary, defined by Kernel

## What CE May Use Cards For

CE may use a decision card to check:

```text
- constructability evidence needed by the card
- dependency evidence
- source support status and limitations
- unresolved risks
- whether closure is blocked, limited, or pending Builder resolution
```

CE must not treat official docs or decision cards as Builder execution, runtime validation, or target-project availability proof.

## Required Record Shape

The schema requires, at minimum:

```text
record_kind
schema_version
kernel_card_registry_ref
consumed_element_id
consumed_card_ref
official_source_refs_used
source_support_status_seen
constructability_assessment_status
constructability_evidence
dependency_evidence
required_evidence_checked
limitations
unresolved_risks
ce_closure_status
not_proven_by_official_docs_acknowledged
```

## Allowed Constructability Assessment Statuses

```text
not_assessed
insufficient_project_evidence
constructable_with_limitations
blocked_by_missing_evidence
blocked_by_card_constraint
constructable_pending_builder_resolution
```

## Closure Evidence Rule

```text
constructable_with_limitations -> requires constructability_evidence
constructable_pending_builder_resolution -> requires constructability_evidence
```

A CE record may mark `insufficient_project_evidence` without constructability evidence when the purpose is explicitly to block closure.

## Required Card Evidence Rule

If the consumed card lists `required_evidence`, CE must check or explicitly acknowledge each item in `required_evidence_checked`.

## Forbidden Claims

CE consumption records must not say or imply:

```text
builder_executed
runtime_validated
project_available_from_official_docs
downstream_enforced
production_ready
```

Allowed limitation/proof-gap fields may mention these concepts only to acknowledge that they are not proven.

## Next Allowed Step

Future CE integration may consume this schema, but actual CE repository enforcement is outside Prompt 4.
