# KROAD-003 Decision Record v2 — Second-Pass Review Record

Status: completed stage  
Scope: KROAD-003 Decision Record Schema v2 + Migration Plan  
Owner or intended consumer: EV4 Decision Kernel maintainers and future roadmap operators  
Recorded from live repository inspection: PR #17 merged on `main`

## What This Document Is

This document records the approved second-pass review result for PR #17 / KROAD-003 after the same-PR repair pass.

It preserves the review-stage decision in repository memory so future work can continue from the repository instead of chat history.

## What This Document Is Not

```text
- not a Resolver implementation
- not KROAD-004
- not a P0 decision matrix
- not downstream enforcement evidence
- not runtime/browser proof
- not Builder execution proof
- not production readiness proof
```

## Review Identity

```yaml
reviewed_pr: 17
reviewed_branch: kroad-003-decision-record-v2
reviewed_head_sha: 1c6c53e4f7f11631a5d64d01026edb8e186ca0b7
merge_commit_sha: eeee1a305c2edc9128560084a53d22c19adfb55b
merged_at_utc: 2026-07-09T08:01:59Z
status: completed_stage
final_conclusion: approved_for_human_review_or_merge_and_now_merged
```

## Files Reviewed

```text
docs/contracts/DECISION_RECORD_CONTRACTS.md
docs/contracts/DECISION_RECORD_V2_MIGRATION_PLAN.md
docs/decision-governance/DECISION_RECORD_V2_LIFECYCLE.md
kernel/fixtures/invalid/decision_record_v2_conditional_selected_none_invalid.json
kernel/fixtures/invalid/decision_record_v2_downstream_validated_missing_ref_invalid.json
kernel/fixtures/invalid/decision_record_v2_initial_previous_ref_invalid.json
kernel/fixtures/invalid/decision_record_v2_manual_override_trigger_mismatch_invalid.json
kernel/fixtures/invalid/decision_record_v2_missing_required_fields_invalid.json
kernel/fixtures/invalid/decision_record_v2_reopened_missing_previous_ref_invalid.json
kernel/fixtures/valid/decision_record_v2_downstream_validated_ref_shape_valid.json
kernel/fixtures/valid/decision_record_v2_svg_conditional_valid.json
kernel/schemas/decision-record.v2.schema.json
kernel/validator/validate-decision-record-v2.mjs
package.json
planning/NEXT_WORK.md
```

## What Was Verified

### Schema v2 fields

`kernel/schemas/decision-record.v2.schema.json` exists and defines Decision Record v2 as a Kernel-local contract for future Resolver, L2 Audit, Provisional Policy, Rule Versioning, Human Override, and Reopen Loop work.

The schema requires the KROAD-003 field set, including:

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
evidence_refs
forbidden_overclaims
downstream_owner
```

The second-pass repair tightened these consistency rules:

```text
manual_override trigger_source requires decision_type human_override and human_override details.
resolver_derived decisions must not include human_override.
resolver_status unresolvable requires selected_option.option_id none and requires_reaudit true.
resolver_status auto_resolved or conditional must not select option_id none.
evidence_tier none forces resolver_status unresolvable and requires_reaudit true.
reopen_count 0 requires previous_decision_ref null.
reopen_count >= 1 requires a non-empty previous_decision_ref string.
```

### Valid and invalid fixtures

`kernel/validator/validate-decision-record-v2.mjs` registers these valid fixtures:

```text
kernel/fixtures/valid/decision_record_v2_svg_conditional_valid.json
kernel/fixtures/valid/decision_record_v2_downstream_validated_ref_shape_valid.json
```

It registers these invalid fixtures with expected diagnostics:

```text
kernel/fixtures/invalid/decision_record_v2_missing_required_fields_invalid.json
kernel/fixtures/invalid/decision_record_v2_manual_override_trigger_mismatch_invalid.json
kernel/fixtures/invalid/decision_record_v2_downstream_validated_missing_ref_invalid.json
kernel/fixtures/invalid/decision_record_v2_conditional_selected_none_invalid.json
kernel/fixtures/invalid/decision_record_v2_initial_previous_ref_invalid.json
kernel/fixtures/invalid/decision_record_v2_reopened_missing_previous_ref_invalid.json
```

The missing-required-fields invalid fixture was cleaned so it does not create unrelated official-docs boundary noise.

### Validator path

The validation path exists:

```text
kernel/validator/validate-decision-record-v2.mjs
```

The validator compiles the v2 JSON Schema, validates fixture schema conformance, runs targeted semantic checks, and asserts expected invalid diagnostic codes.

The second-pass repair added semantic checks for:

```text
selected_option.option_id none only under unresolvable
reopen_count / previous_decision_ref consistency
downstream_validated requiring a downstream_validation evidence ref
```

### package.json validation wiring

`package.json` contains:

```text
validate:decision-record-v2
validate:mvk
validate:roadmap-memory
```

`validate:mvk` includes `node kernel/validator/validate-decision-record-v2.mjs`, so the normal MVK validation path exercises Decision Record v2 fixtures.

### Migration plan

`docs/contracts/DECISION_RECORD_V2_MIGRATION_PLAN.md` exists and records:

```text
which legacy files use old decision-record shapes;
which v2 fields are missing from legacy shapes;
that old records are marked legacy instead of silently migrated;
how validators treat legacy vs v2 records;
how silent compatibility drift is prevented.
```

### Lifecycle docs

`docs/decision-governance/DECISION_RECORD_V2_LIFECYCLE.md` exists and documents:

```text
resolver status;
evidence tier;
decision_type and explicit human override;
provisional status;
rule versioning;
reopen lineage;
option sets;
forbidden overclaims;
downstream owner boundary.
```

### NEXT_WORK.md roadmap update

`planning/NEXT_WORK.md` marks KROAD-003 complete and keeps KROAD-004 as the next task.

The KROAD-003 update note records that the schema, fixtures, validator, contract docs, migration plan, and lifecycle docs were added without implementing the Resolver or later KROAD items.

### CI / workflow results

The observed GitHub Actions runs for PR #17 head `1c6c53e4f7f11631a5d64d01026edb8e186ca0b7` were:

```yaml
Validate MVK:
  status: completed
  conclusion: success
  run_number: 188

Behavioral Coverage Audit:
  status: completed
  conclusion: success
  run_number: 156
```

The `Validate MVK` workflow includes dependency install, `npm run validate:mvk`, and `npm run validate:roadmap-memory`.

## Boundary Statement

The second-pass review and PR #17 merge do not claim any of the following:

```text
- no Resolver implemented
- no KROAD-004 implemented
- no P0 matrices implemented
- no downstream enforcement claimed
- no Project Gate intake claimed
- no runtime proof claimed
- no Builder execution proof claimed
- no production readiness claimed
```

The downstream-valid fixture is only schema/validator shape coverage. It is not real downstream enforcement evidence.

## Non-Blocking Follow-Up

Future KROADs may add a fixture for this pair:

```yaml
evidence_tier: none
resolver_status: unresolvable
```

This was not a blocker for KROAD-003 because the schema already represents both fields, forces `evidence_tier: none` toward `resolver_status: unresolvable`, and KROAD-003's required baseline was satisfied by the existing v2 schema, migration plan, lifecycle docs, validation path, and valid/invalid fixture coverage.

## Final Conclusion

KROAD-003 review stage was safe enough and does not require another critic pass.

KROAD-003 is complete on `main` through PR #17.

Next allowed roadmap item: `KROAD-004 — P0 Decision Matrices`.

## What Must Not Be Done Yet

```text
- do not implement Resolver in this review record task
- do not implement KROAD-004 in this review record task
- do not expand registries
- do not create downstream adapters
- do not add Project Gate intake
- do not claim runtime, Builder, downstream, or production proof
```
