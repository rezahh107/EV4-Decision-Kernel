# EV4 Decision Kernel — Next Work

## Last Updated

KROAD-010 Downstream Consumer Contract — security and bootstrap hardening in progress

## Status Authority

This file is the authoritative current-status dashboard for roadmap progress after each merged PR.

`planning/KERNEL_EXECUTION_PLAN.md` remains the durable detailed operating map for item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules. If an item's status label in the detailed plan is stale, use this file for current roadmap status and update the detailed plan in a later maintenance PR only when changing roadmap meaning, scope, dependency, acceptance criteria, or evidence requirements.

Mutable staged/completed/blocked state must remain here and must not be embedded in byte-pinned KROAD-010 acceptance-semantic artifacts.

## Status Summary

Current completed milestones: KROAD-000, KROAD-001, KROAD-002, KROAD-003, KROAD-004, KROAD-005, KROAD-006, KROAD-007, KROAD-008, KROAD-009.
Current next task: KROAD-010 — Downstream Consumer Contract (blocked pending bootstrap review/merge, main-history pinning, exact-head CI, history simulation, and final-main validation).
KROAD-011 is unavailable until KROAD-010 is complete on verified `main` history.
Detailed plan: `planning/KERNEL_EXECUTION_PLAN.md`.
Do not continue from chat history; read this file first.

## Next Task

- [ ] KROAD-010 — Downstream Consumer Contract
  - Status: **IN_PROGRESS / BLOCKED**.
  - Bootstrap dependency: PR #33 must land lifecycle-neutral, byte-stable acceptance-semantic files on `main` only after its direct bootstrap execution check and independent review pass.
  - Security dependency: the shared lineage patcher must reject `__proto__`, `prototype`, and `constructor` in both `record_patch` and `envelope_patch`, with prototype-integrity fixtures and observed CI evidence.
  - Activation dependency: PR #31 must then sync with `main` and pin ordinary Consumer Records to the verified bootstrap commit.
  - Required before completion: exact-head `Validate MVK`, Behavioral Coverage Audit, roadmap-memory validation, merge/squash/rebase history simulations, and final merged-`main` verification.
  - KROAD-011 must not start while this item is blocked.

## Completed

- [x] KROAD-000 — Live Baseline Precheck
  - Update note: Baseline repository memory exists in `planning/NEXT_WORK.md`, the durable plan exists in `planning/KERNEL_EXECUTION_PLAN.md`, and current roadmap status is maintained here as the status dashboard.
- [x] KROAD-001 — Cross-Repository Adoption Report
- [x] KROAD-002 — Taxonomy + Execution-Risk Boundaries
- [x] KROAD-003 — Decision Record Schema v2 + Migration Plan
- [x] KROAD-004 — P0 Decision Matrices
- [x] KROAD-005 — Decision Resolver Contract
- [x] KROAD-006 — Resolver MVP for high-risk P0 families
- [x] KROAD-007 — L2 Decision Correctness Audit
- [x] KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
- [x] KROAD-009 — Vertical Slice

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

Before ticking any item as complete, verify concrete merged repository and validation evidence exists. Draft/open PR artifacts, green advisory CI, or a planned main-history pin are not completion evidence.

## Open Notes

- Decision Resolver must be three-state: `auto_resolved` / `conditional` / `unresolvable`.
- KROAD-006 Resolver MVP remains limited to `layout_structure`; unsupported families fail closed.
- KROAD-009 provides one Kernel-local end-to-end `layout_structure` pattern only; it is not downstream enforcement or real target-project proof.
- KROAD-010 selects `EV4-Architect-Repo` as the only initial consumer and defines a Kernel-local contract only.
- KROAD-010 mutable lifecycle state belongs here; its pinned manifest remains lifecycle-neutral.
- KROAD-010 package wiring is orchestration state guarded by the canonical lock and is not part of immutable record semantics.
- KROAD-010 fixture patch data is untrusted and must not mutate JavaScript prototypes.
- Human overrides must be explicitly marked.
- Critical P0 provisional decisions must not pass final release.
- Unknown decision families must fail closed with halt / insufficient evidence / no free decision.
