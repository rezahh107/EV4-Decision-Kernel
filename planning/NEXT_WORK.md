# EV4 Decision Kernel — Next Work

## Last Updated

KROAD-003 second-pass review record

## Status Authority

This file is the authoritative current-status dashboard for roadmap progress after each merged PR.

`planning/KERNEL_EXECUTION_PLAN.md` remains the durable detailed operating map for item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules. If an item's status label in the detailed plan is stale, use this file for current roadmap status and update the detailed plan in a later maintenance PR only when changing roadmap meaning, scope, dependency, acceptance criteria, or evidence requirements.

Known detailed-plan status labels: `KROAD-001` and `KROAD-003` may still show legacy `not_started` status in `planning/KERNEL_EXECUTION_PLAN.md`; those lines are non-authoritative. Current status source for `KROAD-001` and `KROAD-003` is `planning/NEXT_WORK.md`.

## Status Summary

Current completed milestones: KROAD-000, KROAD-001, KROAD-002, KROAD-003.
Current next task: KROAD-004 — P0 Decision Matrices.
Detailed plan: `planning/KERNEL_EXECUTION_PLAN.md`.
Do not continue from chat history; read this file first.

KROAD-001 is complete on `main` because PR #13 merged `planning/CROSS_REPO_ADOPTION_REPORT.md`.

## Next Task

- [ ] KROAD-004 — P0 Decision Matrices

## Completed

- [x] KROAD-000 — Live Baseline Precheck
  - Update note: Baseline repository memory exists in `planning/NEXT_WORK.md`, the durable plan exists in `planning/KERNEL_EXECUTION_PLAN.md`, and current roadmap status is maintained here as the status dashboard.
- [x] KROAD-001 — Cross-Repository Adoption Report
  - Update note: PR #13 added `planning/CROSS_REPO_ADOPTION_REPORT.md` with the read-only adoption report, inspected repository/path references, explicit classification for all six related repositories, Four Truths Framework, do-not-import guards, limitations, and roadmap-impact notes.
- [x] KROAD-002 — Taxonomy + Execution-Risk Boundaries
  - Update note: PR #11 completed the decision governance taxonomy and execution-risk boundary foundation.
- [x] KROAD-003 — Decision Record Schema v2 + Migration Plan
  - Update note: PR #17 completed KROAD-003 by adding `kernel/schemas/decision-record.v2.schema.json`, valid/invalid v2 fixtures, `kernel/validator/validate-decision-record-v2.mjs`, the v2 contract documentation, the migration plan, and lifecycle field documentation without implementing the Resolver or later KROAD items.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-003_DECISION_RECORD_V2_SECOND_PASS_REVIEW.md`; it records the merged PR #17 state, reviewed files, CI evidence, boundaries, and non-blocking follow-up.

## Remaining Work

- [ ] KROAD-004 — P0 Decision Matrices
- [ ] KROAD-005 — Decision Resolver Contract
- [ ] KROAD-006 — Resolver MVP for high-risk P0 families
- [ ] KROAD-007 — L2 Decision Correctness Audit
- [ ] KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
- [ ] KROAD-009 — Vertical Slice
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

If unsure whether the change is roadmap-relevant, update this file with a short note.

Before ticking any item as complete, verify concrete repository evidence exists, such as:
- a merged PR;
- a file;
- a schema field;
- a validator;
- a fixture;
- a documentation section.

If evidence is missing or uncertain, do not tick the item; add a note explaining what is missing.

## Open Notes

- Decision Resolver must be three-state: `auto_resolved` / `conditional` / `unresolvable`.
- Decision Record Schema v2 is contract-backed by `kernel/schemas/decision-record.v2.schema.json`; legacy MVK decision-record schemas are not v2-compliant unless explicitly migrated.
- L2 Audit must rerun the resolver, not act as a second free-text opinion.
- Human overrides must be explicitly marked.
- Critical P0 provisional decisions must not pass final release.
- Unknown decision families must fail closed with halt / insufficient evidence / no free decision.
