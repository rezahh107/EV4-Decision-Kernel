# KROAD-012R Recovery Specification Integration — Bounded Repair Record

## Status

- `action_kind`: `repair`
- `review_status`: `implemented_pending_rereview`
- `reviewed_head_sha`: `197f2a9ae56f93d8f6a46402343d3d74420dbf0f`
- `authority`: documentation repair evidence only
- `merge_performed`: false
- `approval_performed`: false
- `deployment_performed`: false
- `base_sha`: `ccab57d9f0be0286dc68297404ef040a77e80b36`
- `final_head_evidence`: recorded in the PR conversation after the repaired commit is pushed; this committed file does not self-assert its own commit SHA.

## Invariant Extraction

| Finding | Surface symptom | Underlying invariant | Failure boundary | Affected components | Repair status |
|---|---|---|---|---|---|
| `PRF-001` | duplicate ARCH requirement identities expressed the same normative rules | one normative invariant must have one canonical Requirement ID; aliases cannot be independent requirements | future prompts and work packages could bind to divergent IDs | parent Requirement Index, inline references, Operationalization Map | `implemented_pending_rereview` |
| `PRF-002` | `DCOV-WP-002` could be read as eligible after merge/evidence closure without parent authority promotion | every recovery-spec-sourced implementation package must fail closed until `parent_authority=approved_recovery_source_of_record` is explicitly recorded after the full promotion gate | schema work could start while the parent remained proposed-only | parent promotion gate, Operationalization Map, Execution Plan, NEXT_WORK | `implemented_pending_rereview` |

Assumptions preserved:

- Existing KROAD-012 through KROAD-018 meanings are unchanged.
- `DCOV-WP-002` is not activated by this repair.
- Merge, CI success, package `evidence_closed`, and placement approval do not imply parent authority.
- The parent remains `proposed_recovery_specification_pending_evidence_validation` until its full promotion gate is satisfied.

## Bounded Repair

- Consolidated `ARCH-004/ARCH-008`, `ARCH-005/ARCH-009`, and `ARCH-006/ARCH-010` onto canonical IDs `ARCH-004`, `ARCH-005`, and `ARCH-006`.
- Removed redundant normative Requirement Index entries and updated all Operationalization references.
- Defined `parent_authority=approved_recovery_source_of_record` as the canonical implementation-eligibility prerequisite.
- Applied that prerequisite to every recovery-spec-sourced implementation package.
- Defined `evidence_closed` as package lifecycle evidence that cannot independently promote parent authority.
- Mirrored the same fail-closed predicate in the parent specification, Operationalization Map, Execution Plan, and NEXT_WORK.

## Exact Intended Changed Paths

The base-to-head PR scope remains:

```text
README.md
docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md
planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md
planning/KERNEL_EXECUTION_PLAN.md
planning/NEXT_WORK.md
planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md
```

This bounded repair materially edits only the parent specification and four planning/review files. It adds no workflow, staging artifact, schema, Registry data, Resolver Rule, producer, consumer or runtime code.

## Required Validation

- semantic one-to-one Requirement-ID check;
- every Operationalization reference resolves exactly once;
- every implementation package `DCOV-WP-002` and later includes `parent_authority=approved_recovery_source_of_record`;
- merge/evidence-closure-without-authority scenario remains blocked;
- `npm run validate:roadmap-memory`;
- `npm run validate:mvk`;
- exact base-to-head six-path assertion;
- fresh PR Inspector review on the exact repaired head.

## Mandatory Follow-Up

A fresh PR Inspector review is required on the exact repaired head before technical acceptance or merge.
