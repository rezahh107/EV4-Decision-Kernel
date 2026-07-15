# EV4 Decision Kernel — Next Work

## Last Updated

The owner approved frozen plan `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2` against exact audited `main` commit `5ff5d7b20db11af36ab787eb8ac2d1127ea74644`. `BATCH_A` packages `AIGOV-ADOPT-000` reconciliation and `AIGOV-ADOPT-001` through `AIGOV-ADOPT-007` enforcement work into one active implementation. The repository remains `blocked_open_enforcement_gaps`; implementation on a PR head is not adoption, Merge readiness or exact-main completion.

## Status Authority

This file is the authoritative current-status dashboard. `planning/KERNEL_EXECUTION_PLAN.md` preserves durable product scope, dependencies, acceptance criteria, evidence and historical KROAD meaning. Mutable current/next state lives here; chat history, PR prose, CI success and target-authored closure records are not governance approval.

The AIGOV adoption sequence is a higher-priority governance repair. It does not change the product meaning of `KROAD-012` through `KROAD-018`; those items remain preserved, and `KROAD-012` remains the next product task after governance adoption closure.

## Current State

- Repository adoption status: `blocked_open_enforcement_gaps`.
- Active standard: `AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT@1.1.0`.
- Frozen adoption plan: `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`.
- Active batch: `BATCH_A`.
- Current governance increment set: `AIGOV-ADOPT-000` through `AIGOV-ADOPT-007`.
- AIGOV-ADOPT-000: `merged_pending_batch_a_reconciliation`.
- AIGOV-ADOPT-001 through AIGOV-ADOPT-007: `in_batch_a_implementation`.
- AIGOV-ADOPT-008: `blocked_pending_batch_a_exact_main`.
- Product implementation while adoption is open: `blocked_by_higher_priority_governance_repair`.
- Coverage proposal state: `not_measurable_pending_external_promotion`.
- External project-owner governance approval carrier for Coverage: `missing`.
- `DCOV-EXEC-001` implementation eligibility: `blocked_pending_external_governance_approval`.
- Element Ledger: 15 known in-scope records; 7 confirmed denominator members; denominator `unresolved`.
- Decision Question Catalog: 29 known in-scope records; 24 confirmed denominator members; denominator `unresolved`.
- Element coverage percent: `null`.
- Question coverage percent: `null`.
- Critical P0/safety percent: `null`.
- Only active Resolver-backed Family: `layout_structure`; its real runtime/consumer proof remains incomplete.
- No coverage credit, trusted ingestion, readiness, release-readiness, runtime-completeness or production-readiness claim is active.

## Current PR

- [ ] `DCOV-EXEC-001` — Coverage Guarantee proposal and validation foundation
  - `work_type`: `proposal_with_real_seed_data`
  - `merge_permitted`: `false`
  - `implementation_eligibility`: `blocked_pending_external_governance_approval`
  - The proposal cannot approve its own recovery source, activate Coverage policy or supersede KROAD-012 through KROAD-018.
  - Merge metadata, CI success, repository placement and self-authored evidence closure cannot satisfy the missing authority carrier.

## Next Task

- [ ] AIGOV-ADOPT-001 — AIGOV Enforcement Activation (`BATCH_A`)
  - `status`: `in_batch_a_implementation`
  - `change_class`: `L3`
  - `branch`: `governance/aigov-v2-batch-a-enforcement`
  - `plan_id`: `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`
  - `covers`: `AIGOV-ADOPT-000` reconciliation and `AIGOV-ADOPT-001` through `AIGOV-ADOPT-007`
  - Reconcile the merged `AIGOV-ADOPT-000` authority carrier and activate the bounded machine policy, schemas, fixtures, exact-head sequence checks and independent-review compatibility profile.
  - Do not claim `AIGOV-ADOPT-008`, exact-main adoption closure, product implementation, Coverage promotion or Merge authority.

## Next Product Task

- [ ] KROAD-012 — External Evidence Producer Boundary
  - `status`: `next_product_task_blocked_by_governance_adoption`
  - `activation_condition`: `AIGOV-ADOPT-008 merged and exact-main adoption closure verified`
  - Define the proof limits of external evidence producers without implementing broad producer platforms.
  - Do not replace this item with a target-authored Coverage execution package unless the complete external governance promotion gate is independently satisfied.

## Approved Governance Adoption Sequence

| Increment | Current status | Dependency |
|---|---|---|
| AIGOV-ADOPT-000 | `merged_pending_batch_a_reconciliation` | PR #48 merged at audited Batch A base |
| AIGOV-ADOPT-001 | `in_batch_a_implementation` | owner-approved V2 Batch A |
| AIGOV-ADOPT-002 | `in_batch_a_implementation` | same atomic Batch A scope |
| AIGOV-ADOPT-003 | `in_batch_a_implementation` | same atomic Batch A scope |
| AIGOV-ADOPT-004 | `in_batch_a_implementation` | same atomic Batch A scope |
| AIGOV-ADOPT-005 | `in_batch_a_implementation` | same atomic Batch A scope |
| AIGOV-ADOPT-006 | `in_batch_a_implementation` | same atomic Batch A scope |
| AIGOV-ADOPT-007 | `in_batch_a_implementation` | same atomic Batch A scope |
| AIGOV-ADOPT-008 | `blocked_pending_batch_a_exact_main` | owner Merge of Batch A and Green exact-main receipt |

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

## Deferred Requirement Groups

KROAD-013 through KROAD-018 retain their original scope and dependencies. They are not completed and are not superseded by the unapproved Coverage proposal or the governance adoption sequence.

| Item | Status | Dependency |
|---|---|---|
| KROAD-013 | `not_started` | KROAD-012 |
| KROAD-014 | `not_started` | KROAD-012 and KROAD-013 |
| KROAD-015 | `not_started` | KROAD-014 |
| KROAD-016 | `not_started` | KROAD-015 |
| KROAD-017 | `not_started` | KROAD-016 |
| KROAD-018 | `not_started` | KROAD-017 |

## Merge Gate

```yaml
merge_gate:
  exact_head_ci_green: required
  independent_pr_inspector_green: required_for_final_BATCH_A_head
  external_project_owner_governance_approval_for_coverage: missing
  explicit_owner_merge_command: false
```

No Merge, approval or auto-merge is authorized by this file.
