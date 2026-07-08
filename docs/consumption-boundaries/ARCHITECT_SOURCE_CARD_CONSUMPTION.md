# Architect Source/Card Consumption

Status: Kernel-local Prompt 4 contract  
Owner: Architect consumer boundary, defined by Kernel

## What Architect May Use Cards For

Architect may use a decision card as source-backed input for:

```text
- candidate generation
- candidate comparison
- rejection reasoning
- risk surfacing
- required evidence acknowledgement
- CE-required handoff markers
```

Architect must keep the card as a bounded input, not as final proof.

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
architect_decision_intent
candidate_role
use_when_applied
avoid_when_considered
decision_questions_answered
required_evidence_acknowledged
not_proven_by_official_docs_acknowledged
design_choice_status
unresolved_risks
limitations
```

## Allowed Design Choice Statuses

```text
candidate_only
selected_with_unresolved_evidence
selected_with_ce_required
rejected_due_to_card_constraint
rejected_due_to_insufficient_evidence
```

These statuses intentionally stop before production, runtime, Builder, downstream, or project-availability claims.

## Forbidden Claims

Architect consumption records must not say or imply:

```text
project_available
correct_design_choice_proven_by_card
builder_executed
runtime_validated
downstream_enforced
production_ready
```

Allowed limitation/proof-gap fields may mention these concepts only to acknowledge that they are not proven.

## Practical Example

A Button card can justify considering `v4.button` as a CTA candidate. It cannot prove the CTA is the correct section design, that the URL/action exists, that the target project enables it, or that Builder has executed it.

## Next Allowed Step

Future Architect integration may consume this schema, but that integration must be implemented in the Architect repository in a later prompt.
