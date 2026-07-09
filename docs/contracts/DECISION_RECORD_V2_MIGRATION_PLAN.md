# Decision Record v2 Migration Plan — EV4 Decision Kernel

Status: Active KROAD-003 migration baseline  
Scope: Legacy MVK decision-record shape inventory, v2 missing-field analysis, validator treatment, and drift prevention  
Owner or intended consumer: EV4 Decision Kernel maintainers and future Resolver/L2/Project Gate integration work

## What This Document Is

This document explains how Decision Record v2 coexists with the existing legacy MVK decision-record schemas and fixtures.
It prevents older records from being silently treated as v2-compliant.

## What This Document Is Not

```text
- not an automated migrator
- not a Resolver implementation
- not a broad registry migration
- not downstream enforcement
- not runtime or production proof
```

## Existing Legacy Decision-Record Files

The following repository files use the old MVK decision-record shape or describe it:

```text
kernel/schemas/element-decision-record.schema.json
kernel/schemas/position-decision-record.schema.json
kernel/schemas/value-unit-decision-record.schema.json
kernel/fixtures/valid/element_decision_svg_absolute_valid.json
kernel/fixtures/valid/position_decision_absolute_with_containing_block_valid.json
kernel/fixtures/invalid/element_decision_selected_candidate_mismatch_invalid.json
kernel/fixtures/invalid/absolute_without_containing_block_invalid.json
docs/contracts/DECISION_RECORD_CONTRACTS.md
docs/mvk/MVK_SCOPE.md
docs/mvk/MVK_VALIDATION_REPAIR_NOTES.md
kernel/validator/validate-mvk.mjs
```

## Missing v2 Fields in Legacy Records

The legacy schemas and fixtures do not carry the full KROAD-003 lifecycle contract. Missing or non-standardized fields include:

```text
resolver_status
evidence_tier
rule_id
rule_version
decision_type
trigger_source
provisional_status
reopen_count
max_reopen_count
previous_decision_ref
requires_reaudit
selected_option
allowed_options
rejected_options
forbidden_options
forbidden_overclaims
downstream_owner
```

Some legacy records already contain partial analogs such as `selected_element_id`, `candidate_elements`, `rejected_alternatives`, `evidence_refs`, and `decision_status`. These are not equivalent to v2 fields and must not be auto-promoted.

## Migration Decision

Legacy MVK decision records are marked legacy for now. They are not migrated immediately.

Reason:

```text
- KROAD-003 creates the shared v2 contract baseline only.
- Existing MVK fixtures prove earlier hard gates and should remain stable.
- Immediate conversion could hide compatibility drift by making old fixture shapes appear v2-compliant without explicit lifecycle evidence.
```

## Validator Treatment

```text
legacy path:
  validator: kernel/validator/validate-mvk.mjs
  schemas:
    - kernel/schemas/element-decision-record.schema.json
    - kernel/schemas/position-decision-record.schema.json
    - kernel/schemas/value-unit-decision-record.schema.json
  treatment:
    - validate as legacy MVK records only
    - do not claim v2 compliance

v2 path:
  validator: kernel/validator/validate-decision-record-v2.mjs
  schema:
    - kernel/schemas/decision-record.v2.schema.json
  fixtures:
    - kernel/fixtures/valid/decision_record_v2_svg_conditional_valid.json
    - kernel/fixtures/invalid/decision_record_v2_missing_required_fields_invalid.json
  treatment:
    - validate schema and minimal semantic guardrails
    - assert expected diagnostics for invalid v2 fixture
```

`npm run validate:mvk` includes the v2 validator so the existing MVK validation workflow also exercises the new contract.

## Silent Compatibility Drift Prevention

Decision Record v2 prevents silent drift by requiring:

```text
record_type: decision_record_v2
schema_version: 2.0.0
additionalProperties: false
all required lifecycle fields
explicit decision_type
explicit human_override object for manual override
explicit evidence_tier
explicit forbidden_overclaims
explicit previous_decision_ref handling
separate v2 validator path
```

A legacy record without these fields fails v2 validation. It may still pass the legacy MVK validator for its original scope, but that is not v2 compliance.

## Future Migration Path

Future roadmap items may add controlled migration only after KROAD-004+ clarifies P0 matrices and resolver contracts.

Allowed future migration behavior:

```text
1. Read a legacy record.
2. Create a new Decision Record v2 artifact with a new `decision_id` or an explicit legacy source ref.
3. Fill missing lifecycle fields explicitly.
4. Mark unknown evidence as `none` or `official_docs` only when supported.
5. Keep provisional status and missing evidence visible.
6. Preserve previous/legacy reference in `previous_decision_ref` or a future source-lineage field.
7. Validate with `validate-decision-record-v2.mjs`.
```

Forbidden migration behavior:

```text
- do not mutate old records in place and call them v2
- do not infer `auto_resolved` from old `locked` status
- do not infer runtime proof from official docs or source fixtures
- do not infer Builder execution from CE closure or schema-valid records
- do not hide human override inside `resolver_derived`
```

## Next Allowed Step

After this migration baseline is merged, the next roadmap item is `KROAD-004 — P0 Decision Matrices`.
