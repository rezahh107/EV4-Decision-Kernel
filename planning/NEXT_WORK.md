# EV4 Decision Kernel — Next Work

## Last Updated

Post-merge governance activation for PR #43 is recorded. PR #43 merged into `main` on `2026-07-14T13:22:00Z` with final head `2710931b51941295f9ae6a1ed849fc0fbf3a7004`, merge commit `3e4adb453adc547fefaad19670698add67cad79f`, and current verified `main` `44db96ac911ce8796c3dd3ed1c07d9fbbdb81333`.

## Status Authority

This file is the authoritative current-status dashboard. `planning/KERNEL_EXECUTION_PLAN.md` preserves durable scope, dependencies, acceptance criteria, evidence and historical KROAD meaning. Mutable current/next state lives here; chat history, PR prose, CI success and target-authored closure records are not governance approval. Current status source: `planning/NEXT_WORK.md`; any stale detailed-plan status for KROAD-012 through KROAD-018 is non-authoritative unless restated here.

## Current State

- Parent authority: `approved_recovery_source_of_record`.
- Promotion status: `approved`.
- One-time external project-owner approval carrier: `supplied`.
- Promotion evidence record: `planning/reviews/DCOV_EXEC_001_POST_MERGE_AUTHORITY_PROMOTION.md`.
- `DCOV-EXEC-001` status: `evidence_closed`.
- `DCOV-EXEC-001` implementation state: `merged_and_post_merge_closed`.
- `DCOV-EXEC-002` status: `next_allowed`.
- `DCOV-EXEC-002` work type: `content_expansion`.
- KROAD-012 status: `parallel_or_dependency_aligned`.
- Child DCOV packages repeated owner approval required: `false`.
- Element Ledger: 15 known in-scope records; 7 confirmed denominator members; denominator `unresolved`.
- Decision Question Catalog: 29 known in-scope records; 24 confirmed denominator members; denominator `unresolved`.
- Element coverage percent: `null`.
- Question coverage percent: `null`.
- Critical P0/safety percent: `null`.
- Only active Resolver-backed Family: `layout_structure`; its real runtime/consumer proof remains incomplete.
- No coverage credit, trusted ingestion, readiness, release-readiness, runtime-completeness or production-readiness claim is active.

## Current PR

- [x] `DCOV-EXEC-001` — Coverage Guarantee proposal and validation foundation
  - `work_type`: `proposal_with_real_seed_data`
  - `branch`: `dcov/coverage-guarantee-activation`
  - `pull_request`: `43`
  - `status`: `evidence_closed`
  - `implementation_state`: `merged_and_post_merge_closed`
  - `final_head_sha`: `2710931b51941295f9ae6a1ed849fc0fbf3a7004`
  - `merge_commit_sha`: `3e4adb453adc547fefaad19670698add67cad79f`
  - `merge_timestamp`: `2026-07-14T13:22:00Z`
  - Adds candidate contract, Ledger/Catalog seeds, proposed baseline, open debt, impact classification, validators and fixtures.
  - The separate project-owner governance approval supplied for this activation satisfies the one-time parent promotion gate.

## Next Task

- [ ] `DCOV-EXEC-002` — Evidence-Bound Element and Resolver Expansion
  - `status`: `next_allowed`
  - `work_type`: `content_expansion`
  - `activation_condition`: `DCOV-EXEC-001 evidence_closed and parent_authority approved_recovery_source_of_record`
  - Child packages do not require repeated project-owner governance approval.
  - Each child package still requires its own dependency checks, implementation evidence, CI, exact-head validation, independent review and normal merge gates.
  - KROAD-012 is preserved as `parallel_or_dependency_aligned` with the producer-boundary obligations of this package; it is not deleted, silently superseded, or completed by this activation.

## Dependency-Gated DCOV Packages

| Item | Status | Dependency |
|---|---|---|
| DCOV-EXEC-003 | `dependency_gated` | DCOV-EXEC-002 merged |
| DCOV-EXEC-004 | `dependency_gated` | DCOV-EXEC-003 merged |
| DCOV-EXEC-005 | `dependency_gated` | DCOV-EXEC-004 merged |

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

KROAD-012 through KROAD-018 retain their original scope and dependencies. KROAD-012 is now aligned with DCOV-EXEC-002 producer-boundary obligations; KROAD-013 through KROAD-018 remain dependency-gated and are not completed by the parent authority promotion.

| Item | Status | Dependency |
|---|---|---|
| KROAD-012 | `parallel_or_dependency_aligned` | DCOV-EXEC-002 producer-boundary obligations |
| KROAD-013 | `dependency_gated` | KROAD-012 / DCOV-EXEC-003 |
| KROAD-014 | `dependency_gated` | KROAD-012, KROAD-013 / DCOV-EXEC-003 |
| KROAD-015 | `dependency_gated` | KROAD-014 / DCOV-EXEC-004 |
| KROAD-016 | `dependency_gated` | KROAD-015 / DCOV-EXEC-004 |
| KROAD-017 | `dependency_gated` | KROAD-016 / DCOV-EXEC-005 |
| KROAD-018 | `dependency_gated` | KROAD-017 / DCOV-EXEC-005 |

## Merge Gate

```yaml
merge_gate:
  exact_head_ci_green: required_per_child_package
  independent_pr_inspector_green: required_per_child_package
  external_project_owner_governance_approval: satisfied_one_time_parent_promotion
  repeated_owner_approval_required_for_child_packages: false
  explicit_owner_merge_command: required_when_repository_policy_requires
```

This file grants no agent Merge authority. DCOV-EXEC-002 is the next executable package after this activation PR merges; it must not begin inside the activation task.
