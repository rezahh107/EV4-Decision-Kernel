# EV4 Decision Kernel — Next Work

## Last Updated

`DCOV-EXEC-001` remains a non-executable proposal on PR #43. The reviewed authority base is `487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8`; live `main` advanced independently after that review and must be reconciled before fresh exact-head validation.

## Status Authority

This file is the authoritative current-status dashboard. `planning/KERNEL_EXECUTION_PLAN.md` preserves durable scope, dependencies, acceptance criteria, evidence and historical KROAD meaning. Mutable current/next state lives here; chat history, PR prose, CI success and target-authored closure records are not governance approval.

## Current State

- Coverage proposal state: `not_measurable_pending_external_promotion`.
- External project-owner governance approval carrier: `missing`.
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
  - `branch`: `dcov/coverage-guarantee-activation`
  - `merge_permitted`: `false`
  - `implementation_eligibility`: `blocked_pending_external_governance_approval`
  - Adds candidate contract, Ledger/Catalog seeds, proposed baseline, open debt, impact classification, validators and fixtures.
  - This PR cannot approve its own recovery source, activate Coverage policy or supersede KROAD-012 through KROAD-018.
  - Merge metadata, CI success, repository placement and self-authored evidence closure cannot satisfy the missing authority carrier.
  - Stops at Draft PR pending conflict resolution, fresh exact-head active-issuer validation and fresh independent PR Inspector review.

## Next Task

- [ ] KROAD-012 — External Evidence Producer Boundary
  - `status`: `next_allowed`
  - `activation_condition`: `KROAD-011 complete and no conflicting higher-priority governance repair`
  - Define the proof limits of external evidence producers without implementing broad producer platforms.
  - Do not replace this item with a target-authored Coverage execution package unless the complete external governance promotion gate is independently satisfied.

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

KROAD-013 through KROAD-018 retain their original scope and dependencies. They are not completed and are not superseded by the unapproved Coverage proposal.

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
  exact_head_ci_green: pending_repaired_head
  independent_pr_inspector_green: pending_fresh_rereview
  external_project_owner_governance_approval: missing
  explicit_owner_merge_command: false
```

No Merge, approval or auto-merge is authorized by this file.
