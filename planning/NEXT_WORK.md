# EV4 Decision Kernel — Next Work

## Last Updated

`DCOV-EXEC-001 — Coverage Guarantee Foundation and Execution Unblock` is the current Draft PR from live `main` `487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8`.

## Status Authority

This file is the authoritative current-status dashboard. `planning/KERNEL_EXECUTION_PLAN.md` preserves durable scope, dependencies, acceptance criteria, evidence and historical KROAD meaning. Mutable current/next state lives here; chat history is not authority.

PR #41 is merged. Coverage Guarantee v1 is being activated by `DCOV-EXEC-001`. The active execution path contains exactly five packages in `planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md`.

## Current State

- Contract state before this PR: `not_measurable`.
- Expected derived state after this PR: `policy_active`.
- Element Ledger: 15 known in-scope records; 7 confirmed denominator members; denominator `unresolved`.
- Decision Question Catalog: 29 known in-scope records; 24 confirmed denominator members; denominator `unresolved`.
- Element coverage percent: `null`.
- Question coverage percent: `null`.
- Critical P0/safety percent: `null`.
- Only active Resolver-backed Family: `layout_structure`; its real runtime/consumer proof remains incomplete.
- No readiness, release-readiness, runtime-completeness or production-readiness claim is active.

## Current PR

- [ ] DCOV-EXEC-001 — Coverage Guarantee Foundation and Execution Unblock
  - `work_type`: `foundation_with_real_data`
  - `branch`: `dcov/coverage-guarantee-activation`
  - `merge_permitted`: `false`
  - Adds the authoritative v1 contract, real Ledger/Catalog seeds, proposed baseline, open debt, bootstrap impact, deterministic validator, exact-code fixtures, existing-CI wiring and unified roadmap.
  - Removes the manual authority lock from active execution.
  - Stops at Draft PR with independent PR inspection pending.
  - Evidence record: `planning/reviews/DCOV-EXEC-001_COVERAGE_GUARANTEE_ACTIVATION.md`.

## Next Task

- [ ] DCOV-EXEC-002 — Evidence-Bound Element and Resolver Expansion
  - `next_work_type`: `content_expansion`
  - `activation_condition`: `DCOV-EXEC-001 merged with exact-head CI and owner-authorized Merge`
  - This is the only post-merge next executable package.
  - It must reconcile real Element records, expand explicit source-bound Questions, implement only producer proof boundaries required by selected content, and close one materially sized P0 or high-risk Matrix → Resolver → Evaluator → Fixture Triplet → L2 chain.
  - It must add bounded runtime or consumer proof only where that selected Family requires it.
  - It must increase completed obligations or a measurable numerator; a producer-boundary documentation-only PR is forbidden.

## Completed

- [x] KROAD-000 — Live Baseline Precheck
  - Update note: repository memory and execution-plan authority are established in `planning/NEXT_WORK.md` and `planning/KERNEL_EXECUTION_PLAN.md`.
- [x] KROAD-001 — Cross-Repository Adoption Report
  - Update note: PR #13 added `planning/CROSS_REPO_ADOPTION_REPORT.md`.
- [x] KROAD-002 — Taxonomy + Execution-Risk Boundaries
  - Update note: PR #11 added the taxonomy and risk-boundary foundation.
- [x] KROAD-003 — Decision Record Schema v2 + Migration Plan
  - Update note: PR #17 added Decision Record v2, fixtures, validation and migration evidence.
- [x] KROAD-004 — P0 Decision Matrices
  - Update note: the Matrix registry and `planning/reviews/KROAD-004_P0_DECISION_MATRICES_SECOND_PASS_REVIEW.md` preserve evidence.
- [x] KROAD-005 — Decision Resolver Contract
  - Update note: Resolver contract schemas, diagnostics and fixtures exist under `kernel/decision-governance` and `kernel/fixtures`.
- [x] KROAD-006 — Resolver MVP
  - Update note: `layout_structure` has the bounded deterministic Resolver MVP and review evidence.
- [x] KROAD-007 — L2 Decision Correctness Audit
  - Update note: deterministic L2 replay and `planning/reviews/KROAD-007_L2_DECISION_CORRECTNESS_AUDIT_SECOND_PASS_REVIEW.md` exist.
- [x] KROAD-008 — Resolver Fixture Triplets
  - Update note: active Resolver triplet policy and exact diagnostic assertions exist.
- [x] KROAD-009 — Layout Structure Vertical Slice
  - Update note: `kernel/decision-governance/kroad-009-layout-structure-vertical-slice.v0.json` and its review record preserve closure evidence.
- [x] KROAD-010 — Downstream Consumer Contract
  - Update note: current-main closure evidence is `planning/reviews/KROAD-010_CURRENT_MAIN_EVIDENCE_CLOSURE.md`.
- [x] KROAD-011 — Project Gate Intake
  - Update note: exact-main Project Gate evidence is `planning/reviews/KROAD-011_PROJECT_GATE_INTAKE_EVIDENCE_CLOSURE.md`.

## Historical Requirement Groups

KROAD-012 through KROAD-018 are preserved and not marked completed. Their former active execution status is `superseded_by_coverage_execution_program`.

| Historical item | Status | Unified package |
|---|---|---|
| KROAD-012 | `superseded_by_coverage_execution_program` | DCOV-EXEC-002 |
| KROAD-013 | `superseded_by_coverage_execution_program` | DCOV-EXEC-003 |
| KROAD-014 | `superseded_by_coverage_execution_program` | DCOV-EXEC-003 |
| KROAD-015 | `superseded_by_coverage_execution_program` | DCOV-EXEC-004 |
| KROAD-016 | `superseded_by_coverage_execution_program` | DCOV-EXEC-004 |
| KROAD-017 | `superseded_by_coverage_execution_program` | DCOV-EXEC-005 |
| KROAD-018 | `superseded_by_coverage_execution_program` | DCOV-EXEC-005 |

Mapping preserves obligations; it does not complete the historical item.

## Merge Gate

```yaml
merge_gate:
  exact_head_ci_green: required
  independent_pr_inspector_green: pending_external_review
  explicit_owner_merge_command: false
```

No Merge, approval or auto-merge is authorized by this file.
