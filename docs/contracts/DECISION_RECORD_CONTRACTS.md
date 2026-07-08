# Decision Record Contracts — EV4 Decision Kernel

Status: Active KROAD-003 contract baseline  
Scope: Decision Record Schema v2 plus legacy MVK decision-record boundaries  
Owner or intended consumer: Architect, CE, Builder, Project Gate, Kernel validators

active_schema_path: `kernel/schemas/decision-record.v2.schema.json`  
validator_path: `kernel/validator/validate-decision-record-v2.mjs`  
migration_plan: `docs/contracts/DECISION_RECORD_V2_MIGRATION_PLAN.md`

## What This Document Is

This document defines the Kernel-local Decision Record v2 contract baseline created for KROAD-003.
It gives later Resolver, L2 Audit, Provisional Policy, Rule Versioning, Human Override, and Reopen Loop work one coherent record shape.

## What This Document Is Not

```text
- not a Resolver implementation
- not a P0 decision matrix
- not a full rule engine platform
- not a downstream enforcement proof
- not runtime validation
- not Builder execution proof
- not production readiness proof
```

## Confirmed Facts

```text
- Architect owns candidate generation, comparison, selection, and decision records.
- Kernel owns the shared decision-record contract shape and validation path.
- Official Elementor documentation proves documented platform/editor capability only.
- Schema-valid Decision Record v2 does not prove semantic correctness, runtime behavior, Builder execution, or production readiness.
```

## Decision Record v2 Required Fields

Decision Record v2 requires these lifecycle and evidence fields:

```yaml
record_type: decision_record_v2
schema_version: 2.0.0
decision_id: string
decision_family_id: string
resolver_status: auto_resolved | conditional | unresolvable
evidence_tier: none | official_docs | project_export | runtime_browser | downstream_validated
rule_id: string
rule_version: semver-like string
decision_type: resolver_derived | human_override
trigger_source: initial_decision | evidence_change | downstream_failure | rule_revision | manual_override
provisional_status:
  is_provisional: boolean
  reason: string
  missing_evidence: string[]
  blocks_final_release: boolean
reopen_count: integer >= 0
max_reopen_count: integer >= 0
previous_decision_ref: string | null
requires_reaudit: boolean
selected_option:
  option_id: string
  label: string
allowed_options: option[]
rejected_options: option_decision[]
forbidden_options: option_decision[]
evidence_refs: evidence_ref[]
forbidden_overclaims: string[]
downstream_owner: architect | ce | builder | responsive | project_gate | none
```

## Resolver Status Boundary

```text
auto_resolved:
  A future resolver rule explicitly resolves the decision and required evidence exists.
  KROAD-003 only records this state; it does not implement the resolver.

conditional:
  More than one option remains valid.
  Architect may choose only inside the allowed option set and must keep evidence/limitations visible.

unresolvable:
  Rule or evidence is insufficient.
  The decision must not be guessed; it must halt, remain insufficient, or require repair.
```

## Evidence Tier Boundary

```text
none:
  No usable evidence. Must be unresolvable and requires reaudit.

official_docs:
  Official Elementor documentation or official developer documentation supports documented platform/editor capability only.
  It does not prove target project availability or runtime behavior.

project_export:
  Saved source/project evidence exists. It is not runtime/browser proof.

runtime_browser:
  Rendered DOM/computed style/viewport/browser-observed evidence exists for the captured context only.

downstream_validated:
  A downstream EV4 consumer or Project Gate has consumed and validated the contract.
  Do not claim this tier without inspected downstream evidence.
```

## Human Override Boundary

`decision_type: human_override` requires an explicit `human_override` object and `trigger_source: manual_override`.
A human override must not be indistinguishable from a resolver-derived decision.

`decision_type: resolver_derived` must not include `human_override`.

## Legacy MVK Record Shapes

The existing MVK schemas remain legacy decision-record carriers:

```text
kernel/schemas/element-decision-record.schema.json
kernel/schemas/position-decision-record.schema.json
kernel/schemas/value-unit-decision-record.schema.json
```

These legacy schemas are not silently treated as Decision Record v2. They continue to validate only their existing MVK fixture paths through `kernel/validator/validate-mvk.mjs`.

## Validation Path

Decision Record v2 validation is intentionally separate:

```bash
npm run validate:decision-record-v2
npm run validate:mvk
```

`npm run validate:mvk` now includes the v2 validator so CI can exercise the v2 schema and fixture pair through the existing MVK validation workflow.

## Current Fixtures

```text
kernel/fixtures/valid/decision_record_v2_svg_conditional_valid.json
kernel/fixtures/invalid/decision_record_v2_missing_required_fields_invalid.json
```

The invalid fixture must fail with expected required-field diagnostics, not merely any failure.

## Next Allowed Step

Next allowed roadmap item after this contract is merged: `KROAD-004 — P0 Decision Matrices`.

## What Must Not Be Done Yet

```text
- do not build the Resolver
- do not implement KROAD-004 in this PR
- do not create a full rule engine platform
- do not create broad registry population
- do not claim downstream enforcement
- do not claim runtime proof
- do not claim production readiness
- do not silently accept old records as v2-compliant
```
