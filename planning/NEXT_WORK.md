# EV4 Decision Kernel — Next Work

## Last Updated

The owner approved frozen plan `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3` against exact audited `main` commit `86e25a9073df7e257ca7df799de85baf9b3fafb0`. Live V3 reconciliation proved exact-head CI, owner Merge and current-main validation, but failed the mandatory final-head ancestry predicate because PR #49 was squash-merged. Batch B remains a blocked Draft implementation and is not eligible for independent-review handoff or Merge.

## Status Authority

This file is the authoritative current-status dashboard. `planning/KERNEL_EXECUTION_PLAN.md` preserves durable product meaning and historical KROAD definitions. Current status source: `planning/NEXT_WORK.md`. Historical or detailed-plan statuses are non-authoritative when they conflict with this dashboard.

## Current State

```yaml
repository_adoption_status: blocked_v3_batch_a_ancestry_mismatch
active_standard: AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT@1.1.0
frozen_plan: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3
previous_plan: GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2
batch_a:
  status: reconciliation_failed
  diagnostic: AIGOV_V3_BATCH_A_ANCESTRY_UNVERIFIED
  pr_number: 49
  final_head_sha: c141923bf411f802f1673acf06dc92a77b415593
  merge_commit_sha: 86e25a9073df7e257ca7df799de85baf9b3fafb0
  compare_status: diverged
  merge_base_sha: 5ff5d7b20db11af36ab787eb8ac2d1127ea74644
  exact_head_ci: green
  current_main_validation: green
  owner_merge: verified
  historical_independent_green_receipt: not_claimed
batch_b:
  increment: AIGOV-ADOPT-008
  implementation_state: draft_implemented_but_blocked
  status: blocked_pending_new_owner_authorization
registered:
  KREC-001_through_009: registered_planned_task
preserved:
  KROAD-012: blocked_pending_governance_reauthorization
  KROAD-013_through_018: not_started
  KROAD-012R: historical_non_authoritative
coverage:
  status: not_measurable_pending_external_promotion
  percentages: null
coverage_promotion_effect: none
product_effect: none
external_repository_effect: none
```

- The failed predicate cannot be replaced by tree-equivalence or squash-equivalence under frozen V3 without a new plan version and explicit owner authorization.
- Coverage promotion effect: `none`.
- Product effect: `none`.
- The external project-owner governance approval carrier for Coverage remains missing.
- No coverage credit, trusted ingestion, readiness, release-readiness, runtime-completeness or production-readiness claim is active.

## Current PR

- [ ] PR #50 — V3 Batch B Draft implementation
  - `branch`: `governance/aigov-v3-batch-b-closure`
  - `status`: `blocked_pending_new_owner_authorization`
  - `scope_revision`: `sha256:3990ed3aab277c754a3016c893bf0815b557acb4fd0ee2d54bde68ff6808386b`
  - `merge_permitted`: `false`
  - `independent_review_handoff_permitted`: `false`
  - The branch contains V3 verifier, negative tests and registration-only recovery-program carriers, but Batch A reconciliation did not satisfy frozen V3 ancestry.

- [ ] `DCOV-EXEC-001` — Coverage Guarantee proposal and validation foundation
  - `work_type`: `proposal_with_real_seed_data`
  - `implementation_eligibility`: `blocked_pending_external_governance_approval`
  - The proposal remains non-executable and cannot approve itself.

## Next Task

- [ ] AIGOV-ADOPT-008 — Final AIGOV exact-main closure (`BATCH_B`)
  - `status`: `blocked_pending_new_owner_authorization`
  - `change_class`: `L3`
  - `plan_id`: `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3`
  - Required owner decision: approve a new plan version that explicitly defines valid squash-Merge equivalence evidence, or abandon/rework the Batch A closure approach.
  - No Merge, independent-review handoff, Coverage promotion, KREC implementation or product implementation is authorized.

## Registered Recovery Program

```yaml
program_id: DCOV-COVERAGE-EXECUTION-PROGRAM
integration_model: distinct_recovery_execution_program
program_status: registered_non_active
kroad_012r_status: historical_non_authoritative
kroad_supersession_effect: none
coverage_promotion_effect: none
task_activation_effect: none
product_effect: none
```

| Task | Title | Status |
|---|---|---|
| KREC-001 | Recovery Ledger | `registered_planned_task` |
| KREC-002 | Current Source Verification | `registered_planned_task` |
| KREC-003 | Element Reconciliation | `registered_planned_task` |
| KREC-004 | Decision Demand Corpus | `registered_planned_task` |
| KREC-005 | Canonical Registry Foundation | `registered_planned_task` |
| KREC-006 | Decision Question Catalog | `registered_planned_task` |
| KREC-007 | P0 Resolver Expansion | `registered_planned_task` |
| KREC-008 | Consumer Enforcement Expansion | `registered_planned_task` |
| KREC-009 | Coverage Baseline | `registered_planned_task` |

Registration does not mean active, authorized for implementation, implemented, complete, Coverage credit or readiness.

## Next Product Task

- [ ] KROAD-012 — External Evidence Producer Boundary
  - `status`: `blocked_pending_governance_reauthorization`
  - `KROAD-013` through `KROAD-018` remain `not_started`.
  - The recovery program does not supersede or implement any KROAD item.

## Completed

- [x] KROAD-000 — Live Baseline Precheck
  - Update note: repository memory and execution-plan authority were established.
- [x] KROAD-001 — Cross-Repository Adoption Report
  - Update note: evidence is retained in `planning/CROSS_REPO_ADOPTION_REPORT.md`.
- [x] KROAD-002 — Taxonomy + Execution-Risk Boundaries
  - Update note: taxonomy and risk-boundary carriers exist.
- [x] KROAD-003 — Decision Record Schema v2 + Migration Plan
  - Update note: Decision Record v2 schemas, fixtures and validation exist.
- [x] KROAD-004 — P0 Decision Matrices
  - Update note: Matrix registry and review evidence exist.
- [x] KROAD-005 — Decision Resolver Contract
  - Update note: Resolver contract schemas, diagnostics and fixtures exist.
- [x] KROAD-006 — Resolver MVP
  - Update note: bounded `layout_structure` Resolver MVP evidence exists.
- [x] KROAD-007 — L2 Decision Correctness Audit
  - Update note: deterministic L2 replay and review evidence exist.
- [x] KROAD-008 — Resolver Fixture Triplets
  - Update note: active Resolver triplet policy and exact diagnostics exist.
- [x] KROAD-009 — Layout Structure Vertical Slice
  - Update note: vertical-slice and review carriers exist.
- [x] KROAD-010 — Downstream Consumer Contract
  - Update note: `planning/reviews/KROAD-010_CURRENT_MAIN_EVIDENCE_CLOSURE.md`.
- [x] KROAD-011 — Project Gate Intake
  - Update note: `planning/reviews/KROAD-011_PROJECT_GATE_INTAKE_EVIDENCE_CLOSURE.md`.

## Merge Gate

```yaml
merge_gate:
  batch_a_v3_reconciliation: failed
  blocker: AIGOV_V3_BATCH_A_ANCESTRY_UNVERIFIED
  exact_head_ci_green: not_sufficient
  independent_pr_inspector_green: not_requested_while_blocked
  explicit_owner_merge_command: false
  merge_permitted: false
  coverage_promotion: forbidden
```

No Merge, approval or auto-merge is authorized by this file.
