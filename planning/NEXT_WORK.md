# EV4 Decision Kernel — Next Work

## Last Updated

KROAD-010 Downstream Consumer Contract — staged / blocked

## Status Authority

This file is the authoritative current-status dashboard for roadmap progress after each merged PR.

`planning/KERNEL_EXECUTION_PLAN.md` remains the durable detailed operating map for item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules. If an item's status label in the detailed plan is stale, use this file for current roadmap status and update the detailed plan in a later maintenance PR only when changing roadmap meaning, scope, dependency, acceptance criteria, or evidence requirements.

Known detailed-plan status labels: `KROAD-001`, `KROAD-003`, `KROAD-004`, `KROAD-005`, `KROAD-006`, `KROAD-007`, `KROAD-008`, `KROAD-009`, and `KROAD-010` may still show legacy `not_started` status in `planning/KERNEL_EXECUTION_PLAN.md`; those lines are non-authoritative. Current status source is `planning/NEXT_WORK.md`.

## Status Summary

Current completed milestones: KROAD-000, KROAD-001, KROAD-002, KROAD-003, KROAD-004, KROAD-005, KROAD-006, KROAD-007, KROAD-008, KROAD-009.
Current next task: KROAD-010 — Downstream Consumer Contract (blocked pending bootstrap merge, main-history pinning, exact-head CI, and post-merge-history validation).
KROAD-011 is unavailable until KROAD-010 is complete on verified `main` history.
Detailed plan: `planning/KERNEL_EXECUTION_PLAN.md`.
Do not continue from chat history; read this file first.

KROAD-001 is complete on `main` because PR #13 merged `planning/CROSS_REPO_ADOPTION_REPORT.md`.

## Next Task

- [ ] KROAD-010 — Downstream Consumer Contract
  - Status: **IN_PROGRESS / BLOCKED**.
  - Bootstrap dependency: PR #33 must first land the final byte-stable acceptance-semantic files on `main`.
  - Activation dependency: PR #31 must then pin ordinary Consumer Records to the verified bootstrap commit on `main`.
  - Required before completion: exact-head `Validate MVK`, Behavioral Coverage Audit, roadmap-memory validation, merge/squash/rebase history simulations, and final merged-`main` verification.
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
  - Update note: KROAD-004 added the machine-readable matrix registry `kernel/decision-governance/p0-decision-matrices.v0.json` and usage documentation `docs/decision-governance/P0_DECISION_MATRICES.md`. The registry covers the required P0 families, records candidate options, evidence requirements, evidence tiers, downstream consumers, constructability/runtime/accessibility concerns, provisional behavior, forbidden overclaims, V4-only boundaries, source/evidence refs, and explicitly states that matrix guidance is not resolver output. No Resolver, downstream enforcement, runtime proof, Builder execution proof, production readiness proof, full Elementor feature registry, or full control-level registry was implemented.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-004_P0_DECISION_MATRICES_SECOND_PASS_REVIEW.md`; it records the merged PR #19 state, reviewed files, CI evidence, boundaries, and non-blocking follow-up that a lightweight matrix schema/validator may be useful later but was not a blocker for KROAD-004.
- [x] KROAD-005 — Decision Resolver Contract
  - Update note: PR #21 completed KROAD-005 with resolver contract schemas, registry, documentation, fixtures, and validation. The contract preserves the three resolver statuses `auto_resolved`, `conditional`, and `unresolvable`, enforces evidence requirements, and fails closed for unknown families.
  - Review note: The second-pass review record is preserved in `planning/reviews/KROAD-005_DECISION_RESOLVER_CONTRACT_SECOND_PASS_REVIEW.md`.
- [x] KROAD-006 — Resolver MVP for high-risk P0 families
  - Update note: PR #23 completed a limited deterministic Resolver MVP for `layout_structure` only, including its active rule, registry entry, fixtures, documentation, and validation.
  - Review note: The second-pass review record is preserved in `planning/reviews/KROAD-006_RESOLVER_MVP_SECOND_PASS_REVIEW.md`.
- [x] KROAD-007 — L2 Decision Correctness Audit
  - Update note: PR #26 completed the L2 audit, which reruns the deterministic Resolver MVP and compares its result with Decision Record v2.
  - Review note: The second-pass review record is preserved in `planning/reviews/KROAD-007_L2_DECISION_CORRECTNESS_AUDIT_SECOND_PASS_REVIEW.md`.
- [x] KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
  - Update note: KROAD-008 added the resolver fixture triplet policy, validator, documentation, registry coverage, and MVK wiring.
- [x] KROAD-009 — Vertical Slice
  - Update note: PR #29 completed the Kernel-local `layout_structure` vertical slice connecting matrix, resolver rule, Resolver MVP, Decision Record v2, fixture policy, and L2 audit.
  - Review note: The post-merge review record is preserved in `planning/reviews/KROAD-009_LAYOUT_STRUCTURE_VERTICAL_SLICE_SECOND_PASS_REVIEW.md`.

## KROAD-010 Current Evidence

- The contract remains Kernel-local and targets only `rezahh107/EV4-Architect-Repo`.
- `insufficient_evidence` is strictly non-decision-bearing.
- Snapshot and lineage gates preserve pinned artifacts, provisional state, owner, evidence identity, normalized evidence limitations, L2 results, matrix fragments, and provenance.
- A canonical lock protects manifest/policy parity and requires primary, canonical-lock, and lineage gates exactly once and in order inside `validate:mvk`.
- The immutable snapshot contains acceptance-semantic files only; `package.json` and `package-lock.json` are orchestration files protected separately by the canonical lock.
- No final bootstrap anchor SHA is authoritative until PR #33 is merged and the resulting `main` commit is verified.
- Current open/draft PR artifacts are not completion evidence.

## Remaining Work

- [ ] KROAD-011 — Project Gate Intake — **UNAVAILABLE until KROAD-010 completes**
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

Before ticking any item as complete, verify concrete repository evidence exists, including a merged PR, required files, passing required validation, and any post-merge checks demanded by the item.

If evidence is missing or uncertain, do not tick the item; add a note explaining what is missing.

## Open Notes

- Decision Resolver must be three-state: `auto_resolved` / `conditional` / `unresolvable`.
- Decision Record Schema v2 is contract-backed by `kernel/schemas/decision-record.v2.schema.json`; legacy MVK decision-record schemas are not v2-compliant unless explicitly migrated.
- KROAD-006 Resolver MVP is limited to `layout_structure`; unsupported families must fail closed.
- KROAD-007 L2 audit must rerun the resolver, not act as a second free-text opinion.
- KROAD-009 is one Kernel-local end-to-end pattern only; it is not downstream enforcement or real target-project proof.
- KROAD-010 is staged and blocked. It does not authorize KROAD-011, live downstream enforcement, runtime proof, Builder proof, or production readiness.
- Human overrides must be explicitly marked.
- Critical P0 provisional decisions must not pass final release.
- Unknown decision families must fail closed with halt / insufficient evidence / no free decision.
- KROAD-004 matrices are guidance structures only. They do not resolve decisions and do not satisfy KROAD-007+.
