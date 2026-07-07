# Evidence Model Contract — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Shared evidence vocabulary for MVK contracts  
Owner or intended consumer: Architect, CE, Builder, Responsive, Project Gate, Kernel validators

future_schema_path: `kernel/schemas/evidence.schema.json`

## What This Document Is

This document plans a shared evidence model so downstream roles can distinguish claims, sources, proof, and unresolved assumptions.

## What This Document Is Not

```text
- not a final schema
- not yet CI-enforced
- not yet runtime-validated
- not constructability proof by itself
- not official Elementor documentation
```

## Confirmed Facts

```text
- Documented capability is not the same as enabled project capability.
- Schema validity is not semantic validity.
- Semantic validity is not runtime validity.
- Builder must not guess missing controls, values, units, classes, states, viewports, or UI paths.
```

## Proposed Approach

Proposed planning shape:

```yaml
evidence_ref:
  evidence_id: EV-MVK-001
  evidence_type: official_doc | repo_file | screenshot | user_statement | runtime_observation | inference
  source_ref: string
  captured_at: string
  subject: string
  supports_claim: string
  confidence: confirmed | proposed | inferred | unknown
  limitations: []
```

Minimum evidence statuses:

```text
confirmed
proposed
inferred
unknown
missing
contradicted
```

## Open Decisions

```text
- exact enum values
- exact source_ref syntax
- exact timestamp requirement
- whether line citations are required for repo evidence
```

## Acceptance Criteria

```text
- Evidence references can carry role, source, claim, and limitation.
- Missing evidence can be represented explicitly.
- Inference cannot masquerade as confirmation.
- Runtime validation evidence is separate from static or semantic evidence.
```

## What Must Not Be Done Yet

```text
- do not create `kernel/schemas/evidence.schema.json` yet
- do not claim this contract is enforced
- do not use UX wording as constructability proof
- do not treat screenshots as official documentation
- do not claim runtime behavior without runtime observation
```