# EV4 Decision Kernel — Next Work

## Last Updated

KROAD-010 Downstream Consumer Contract — Phase A architecture and history-matrix hardening in progress

## Status Authority

This file is the authoritative current-status dashboard for roadmap progress after each merged PR.

`planning/KERNEL_EXECUTION_PLAN.md` remains the durable detailed operating map for item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules. If an item's status label in the detailed plan is stale, use this file for current roadmap status and update the detailed plan in a later maintenance PR only when changing roadmap meaning, scope, dependency, acceptance criteria, or evidence requirements.

Known detailed-plan status labels: `KROAD-001`, `KROAD-003`, `KROAD-004`, `KROAD-005`, `KROAD-006`, `KROAD-007`, `KROAD-008`, and `KROAD-009` may still show legacy `not_started` status in `planning/KERNEL_EXECUTION_PLAN.md`; those lines are non-authoritative. Current status source for `KROAD-001`, `KROAD-003`, `KROAD-004`, `KROAD-005`, `KROAD-006`, `KROAD-007`, `KROAD-008`, and `KROAD-009` is `planning/NEXT_WORK.md`.

Mutable staged/completed/blocked state must remain here and must not be embedded in byte-pinned KROAD-010 acceptance-semantic artifacts.

## Status Summary

Current completed milestones: KROAD-000, KROAD-001, KROAD-002, KROAD-003, KROAD-004, KROAD-005, KROAD-006, KROAD-007, KROAD-008, KROAD-009.

Current next task: KROAD-010 — Downstream Consumer Contract.

Current status: **IN_PROGRESS / BLOCKED** pending independent review and merge authorization for PR #33, actual `main` bootstrap anchoring, PR #31 repinning, exact-head green CI, and final-main verification.

KROAD-011 is unavailable until KROAD-010 is complete on verified `main` history.

Detailed plan: `planning/KERNEL_EXECUTION_PLAN.md`.

Do not continue from chat history; read this file first.

KROAD-001 is complete on `main` because PR #13 merged `planning/CROSS_REPO_ADOPTION_REPORT.md`.

## Next Task

- [ ] KROAD-010 — Downstream Consumer Contract
  - Status: **IN_PROGRESS / BLOCKED**.
  - Bootstrap dependency: PR #33 must land lifecycle-neutral, byte-stable acceptance-semantic files on `main` only after direct bootstrap execution and independent technical/security review pass.
  - Security dependency: the shared lineage patcher must reject `__proto__`, `prototype`, and `constructor` in both `record_patch` and `envelope_patch`, with observed prototype-integrity evidence.
  - Maintainability dependency: the primary validator must preserve its captured fixture order, statuses, and diagnostic requirements after refactoring.
  - History dependency: PR #31 must execute a committed, clean three-method Git-history matrix for merge commit, squash, and rebase. Runtime roles `incomplete_anchor`, `stale_anchor`, and `bootstrap_anchor` must be created by the harness; no transient feature SHA may remain in canonical regression data.
  - Activation dependency: after PR #33 is merged, PR #31 must sync with `main` and pin every ordinary Consumer Record to the verified resulting bootstrap commit.
  - Required before completion: exact-head `Validate MVK`, Behavioral Coverage Audit, roadmap-memory validation, all three history simulations, exact drift diagnostic, and final merged-`main` verification.
  - KROAD-011 must not start while this item is blocked.

## Completed

- [x] KROAD-000 — Live Baseline Precheck
  - Update note: Baseline repository memory exists in `planning/NEXT_WORK.md`, the durable plan exists in `planning/KERNEL_EXECUTION_PLAN.md`, and current roadmap status is maintained here as the status dashboard.
- [x] KROAD-001 — Cross-Repository Adoption Report
  - Update note: PR #13 added `planning/CROSS_REPO_ADOPTION_REPORT.md` with the read-only adoption report, inspected repository/path references, explicit classification for all six related repositories, Four Truths Framework, do-not-import guards, limitations, and roadmap-impact notes.
- [x] KROAD-002 — Taxonomy + Execution-Risk Boundaries
  - Update note: PR #11 completed the decision governance taxonomy and execution-risk boundary foundation.
- [x] KROAD-003 — Decision Record Schema v2 + Migration Plan
  - Update note: PR #17 completed KROAD-003 by adding `kernel/schemas/decision-record.v2.schema.json`, valid/invalid v2 fixtures, `kernel/validator/validate-decision-record-v2.mjs`, the v2 contract documentation, and the migration plan and lifecycle field documentation without implementing the Resolver or later KROAD items.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-003_DECISION_RECORD_V2_SECOND_PASS_REVIEW.md`; it records the merged PR #17 state, reviewed files, CI evidence, boundaries, and non-blocking follow-up.
- [x] KROAD-004 — P0 Decision Matrices
  - Update note: KROAD-004 added the machine-readable matrix registry `kernel/decision-governance/p0-decision-matrices.v0.json` and usage documentation `docs/decision-governance/P0_DECISION_MATRICES.md`. The registry covers required P0 families, evidence requirements, downstream consumers, provisional behavior, forbidden overclaims, V4-only boundaries, and explicitly states that matrix guidance is not resolver output.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-004_P0_DECISION_MATRICES_SECOND_PASS_REVIEW.md`; it records the merged PR #19 state and boundaries.
- [x] KROAD-005 — Decision Resolver Contract
  - Update note: KROAD-005 added `kernel/schemas/resolver-rule.v0.schema.json`, resolver status vocabulary and registry, contract documentation, fixtures, and `kernel/validator/validate-resolver-contract.mjs`, wired into `npm run validate:mvk`.
  - Repair note: Same-PR hardening added evidence-tier satisfaction, condition-level evidence refs, bucket-specific outcome checks, precise diagnostics, and adversarial fixtures.
  - Review note: The second-pass review is preserved in `planning/reviews/KROAD-005_DECISION_RESOLVER_CONTRACT_SECOND_PASS_REVIEW.md`.
- [x] KROAD-006 — Resolver MVP for high-risk P0 families
  - Update note: PR #23 completed a limited deterministic Resolver MVP for `layout_structure` only through the active rule, registry entry, resolver implementation, fixture families, documentation, and `npm run validate:resolver-mvp` wiring. Unsupported families remain fail-closed.
  - Review note: The second-pass review is preserved in `planning/reviews/KROAD-006_RESOLVER_MVP_SECOND_PASS_REVIEW.md`.
- [x] KROAD-007 — L2 Decision Correctness Audit
  - Update note: PR #26 completed KROAD-007 through the L2 validator, documentation, valid/invalid/adversarial fixtures, and `npm run validate:l2-decision-correctness` wiring. The audit reruns the Resolver and does not act as a second free-text decision maker.
  - Review note: The second-pass review is preserved in `planning/reviews/KROAD-007_L2_DECISION_CORRECTNESS_AUDIT_SECOND_PASS_REVIEW.md`.
- [x] KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
  - Update note: KROAD-008 added the resolver fixture-triplet policy, validator, documentation, active-rule triplet coverage, and `npm run validate:resolver-fixture-triplets` wiring. It requires real valid/invalid/adversarial behavior and expected diagnostics.
- [x] KROAD-009 — Vertical Slice
  - Update note: PR #29 completed the `layout_structure` vertical slice through its machine-readable manifest, valid/resolver-wrong/adversarial cases, validator, and documentation connecting matrix, rule, Resolver MVP, Decision Record v2, fixture policy, and L2 audit.
  - Review note: The second-pass/post-merge review is preserved in `planning/reviews/KROAD-009_LAYOUT_STRUCTURE_VERTICAL_SLICE_SECOND_PASS_REVIEW.md`.

## Remaining Work

- [ ] KROAD-010 — Downstream Consumer Contract
- [ ] KROAD-011 — Project Gate Intake
- [ ] KROAD-012 — External Evidence Producer Boundary
- [ ] KROAD-013 — Runtime / Browser Evidence Layer
- [ ] KROAD-014 — Provisional Re-Audit Policy
- [ ] KROAD-015 — Decision Reopen / Feedback Loop
- [ ] KROAD-016 — Cross-Turn / Sequence Enforcement
- [ ] KROAD-017 — Official Docs Freshness Monitor
- [ ] KROAD-018 — Final Kernel Release Gate

## Update Rule

Every PR that completes or materially changes a roadmap item must update this file.

If a PR changes files under `kernel/`, `docs/`, `planning/`, schemas, validators, decision cards, governance documents, or roadmap-relevant source files, update this file in the same PR.

Before ticking any item as complete, verify concrete merged repository and validation evidence exists. Draft/open PR artifacts, green advisory CI, synthetic history success, or a planned main-history pin are not completion evidence.

## Open Notes

- Decision Resolver must be three-state: `auto_resolved` / `conditional` / `unresolvable`.
- Decision Record Schema v2 is contract-backed by `kernel/schemas/decision-record.v2.schema.json`.
- KROAD-006 Resolver MVP remains limited to `layout_structure`; unsupported families fail closed.
- KROAD-007 L2 audit reruns the Resolver and remains limited to resolver-covered families.
- KROAD-008 fixture-triplet coverage remains limited to active Resolver MVP rules.
- KROAD-009 provides one Kernel-local end-to-end `layout_structure` pattern only; it is not downstream enforcement or real target-project proof.
- KROAD-010 selects `EV4-Architect-Repo` as the only initial consumer and defines a Kernel-local contract only.
- KROAD-010 mutable lifecycle state belongs here; its pinned manifest remains lifecycle-neutral.
- KROAD-010 package wiring is orchestration state guarded by the canonical lock and is not part of immutable record semantics.
- KROAD-010 fixture patch data is untrusted and must not mutate JavaScript prototypes.
- KROAD-010 history-matrix SHAs are test-only runtime roles and must never become canonical production pins.
- Human overrides must be explicitly marked.
- Critical P0 provisional decisions must not pass final release.
- Unknown decision families must fail closed with halt / insufficient evidence / no free decision.
