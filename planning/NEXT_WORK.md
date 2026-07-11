# EV4 Decision Kernel — Next Work

## Last Updated

KROAD-010 Downstream Consumer Contract — completed by exact current-main push evidence on PR #37 merge commit; KROAD-011 is next allowed and is not implemented by this closure

## Status Authority

This file is the authoritative current-status dashboard for roadmap progress after each merged PR.

`planning/KERNEL_EXECUTION_PLAN.md` remains the durable detailed operating map for item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules. If an item's status label in the detailed plan is stale, use this file for current roadmap status and update the detailed plan in a later maintenance PR only when changing roadmap meaning, scope, dependency, acceptance criteria, or evidence requirements.

Known detailed-plan status labels: `KROAD-001`, `KROAD-003`, `KROAD-004`, `KROAD-005`, `KROAD-006`, `KROAD-007`, `KROAD-008`, `KROAD-009`, and `KROAD-010` may still show legacy `not_started` or pre-closure status in `planning/KERNEL_EXECUTION_PLAN.md`; those lines are non-authoritative. Current status source is `planning/NEXT_WORK.md`.

Mutable KROAD-010 activation/completion state also lives here. The lifecycle-neutral manifest under `kernel/decision-governance/` must not be changed merely to report roadmap progress.

## Status Summary

Current completed milestones: KROAD-000, KROAD-001, KROAD-002, KROAD-003, KROAD-004, KROAD-005, KROAD-006, KROAD-007, KROAD-008, KROAD-009, KROAD-010.
Current next task: KROAD-011 — Project Gate Intake.
Verified bootstrap anchor on `main`: `aa0317a07c10acf4e398dc9e5869f4e6966569f9` from merged PR #33.
Verified activation merge on `main`: `60836283d9a5ae98c3c3819c7ab33a6f40206289` from merged PR #34.
Governance decision adopted by PR #37: `current_main_post_activation_validation`.
Evaluated `main` commit: `9e07cfe551c80d669d13489b05b035834290a32f`.
KROAD-010 completion evidence status: `satisfied`.
KROAD-011 status: `next_allowed`; it is not implemented by the KROAD-010 closure.
Detailed plan: `planning/KERNEL_EXECUTION_PLAN.md`.
Do not continue from chat history; read this file first.

KROAD-001 is complete on `main` because PR #13 merged `planning/CROSS_REPO_ADOPTION_REPORT.md`.

## Next Task

- [ ] KROAD-011 — Project Gate Intake
  - Status: **NEXT_ALLOWED / NOT_STARTED**.
  - Depends on: KROAD-010, now complete.
  - KROAD-010 closure does not implement Project Gate intake.
  - Before implementation, read the KROAD-011 scope, acceptance criteria, evidence requirements, and do-not rules in `planning/KERNEL_EXECUTION_PLAN.md`.
  - Preserve the boundary that Project Gate validates lineage, hash, pin, schema, provenance, and acceptance; it does not design.
  - Do not claim live Project Gate acceptance, downstream enforcement, runtime/browser proof, Builder execution, ecosystem readiness, or production readiness without their required evidence.

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
  - Update note: This PR completed KROAD-005 by adding `kernel/schemas/resolver-rule.v0.schema.json`, `kernel/decision-governance/resolver-status-vocabulary.v0.json`, `kernel/decision-governance/resolver-rule-registry.v0.json`, `docs/decision-governance/DECISION_RESOLVER_CONTRACT.md`, valid/invalid resolver-contract fixtures, and `kernel/validator/validate-resolver-contract.mjs`, wired into `npm run validate:mvk`. The artifacts define the three resolver statuses `auto_resolved`, `conditional`, and `unresolvable`; require evidence tiers and evidence refs; preserve official-doc-only limits; fail closed for unknown decision families; and explicitly do not implement the Resolver MVP, downstream enforcement, runtime proof, Builder execution proof, or production readiness.
  - Repair note: Same-PR repair hardening added ordered evidence-tier satisfaction checks, condition-level evidence-ref/tier checks for non-`unresolvable` outcomes, bucket-specific outcome checks for `auto_resolution_conditions`, `conditional_conditions`, and `unresolvable_conditions`, precise bucket diagnostic paths, and adversarial invalid fixtures for under-tier evidence and condition-bucket status mismatch. This remains KROAD-005 contract validation only; no active resolver rules or KROAD-006 Resolver MVP were added.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-005_DECISION_RESOLVER_CONTRACT_SECOND_PASS_REVIEW.md`; it records the merged PR #21 state, reviewed files, CI evidence, resolved review threads, boundaries, and non-blocking follow-up that KROAD-006 may later implement a small Resolver MVP for high-risk P0 families.
- [x] KROAD-006 — Resolver MVP for high-risk P0 families
  - Update note: This PR completed KROAD-006 by adding a limited deterministic Resolver MVP for `layout_structure` only. Evidence includes `kernel/decision-governance/resolver-rules/layout-structure.v0.json`, the active registry entry in `kernel/decision-governance/resolver-rule-registry.v0.json`, `kernel/resolver-mvp/resolve-high-risk-p0.mjs`, valid/invalid/adversarial Resolver MVP fixtures, `docs/decision-governance/RESOLVER_MVP_KROAD_006.md`, and `npm run validate:resolver-mvp` wired into `npm run validate:mvk`. The MVP can emit `auto_resolved`, `conditional`, and `unresolvable`, rejects insufficient evidence, treats official-doc-only support as conditional, and fails closed for unknown families. Review repairs added fail-closed handling for unsupported evidence tiers and malformed registry/rule inputs, direct expected-output matching for invalid/adversarial fixtures, readable 2-space JSON fixtures, and exact evidence-ref binding so non-`unresolvable` output requires condition-required evidence IDs to be declared in `context.required_evidence_refs` and present in `input.evidence_refs` at the required tier. At the time of that implementation, KROAD-007+ were incomplete.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-006_RESOLVER_MVP_SECOND_PASS_REVIEW.md`; it records the merged PR #23 state, reviewed files, CI evidence, unresolved/outdated review-thread disposition, boundaries, and the conclusion that KROAD-006 is complete on `main` and does not need another critic pass before moving to KROAD-007.
- [x] KROAD-007 — L2 Decision Correctness Audit
  - Update note: This PR completed KROAD-007 by adding `kernel/validator/validate-l2-decision-correctness.mjs`, `docs/decision-governance/L2_DECISION_CORRECTNESS_AUDIT_KROAD_007.md`, valid/invalid/adversarial L2 fixtures under `kernel/fixtures/*/l2_decision_correctness/`, and `npm run validate:l2-decision-correctness` wired into `npm run validate:mvk`. The L2 audit reruns the deterministic Resolver MVP through `resolveDecision(resolver_input)`, compares resolver output with `decision_record_v2`, detects resolver-status/selected-option/allowed-option/forbidden-option/evidence/rule-version/reaudit/human-override/overclaim issues, and keeps active resolver-backed coverage limited to `layout_structure`. At the time of that implementation, KROAD-008+ were incomplete.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-007_L2_DECISION_CORRECTNESS_AUDIT_SECOND_PASS_REVIEW.md`; it records the merged PR #26 state, reviewed files, CI evidence, unresolved/outdated review-thread disposition, direct-run portability repair, conditional `limitations_acknowledged` enforcement repair, registry status alignment, boundaries, and the conclusion that KROAD-007 is complete on `main` and does not need another critic pass before moving to KROAD-008.
- [x] KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
  - Update note: This PR completed KROAD-008 by adding `kernel/decision-governance/resolver-fixture-triplet-policy.v0.json`, `kernel/validator/validate-resolver-fixture-triplets.mjs`, `docs/decision-governance/RESOLVER_FIXTURE_TRIPLET_POLICY_KROAD_008.md`, registry triplet coverage for `resolver.rule.layout_structure.mvp.v0@0.1.0`, and `npm run validate:resolver-fixture-triplets` wired into `npm run validate:mvk`. The validator requires valid/invalid/adversarial coverage for every active Resolver MVP rule, reruns deterministic resolver output rather than trusting case names, rejects empty fixture stubs, checks expected diagnostics, requires adversarial distinction metadata, keeps evidence refs synthetic-only, and did not implement KROAD-009+ at that time, downstream enforcement, Project Gate intake, runtime/browser evidence, Builder proof, or production readiness.
- [x] KROAD-009 — Vertical Slice
  - Update note: This PR completed KROAD-009 for `layout_structure` by adding the machine-readable vertical-slice manifest, valid/schema-valid-but-resolver-wrong/adversarial case triplet, `kernel/validator/validate-kroad-009-vertical-slice.mjs`, and `docs/decision-governance/KROAD_009_LAYOUT_STRUCTURE_VERTICAL_SLICE.md`. The validator connects the existing P0 matrix, active resolver rule and registry entry, Resolver MVP, Decision Record v2 schema, KROAD-008 triplet policy, and KROAD-007 L2 audit; proves a deterministic valid pass, rejects a schema-valid resolver-wrong record with stable L2 diagnostics, keeps a near-valid Grid case unresolvable without availability evidence, and preserves synthetic-only evidence boundaries. At the time of that implementation, KROAD-010+ were incomplete.
  - Review note: The second-pass/post-merge review record is preserved in `planning/reviews/KROAD-009_LAYOUT_STRUCTURE_VERTICAL_SLICE_SECOND_PASS_REVIEW.md`; it records merged PR #29 identity, final-head CI evidence, repair and regression verification, formal review-thread disposition, scope boundaries, and the historical conclusion at that time that KROAD-009 was complete on `main` while KROAD-010 had not started.
- [x] KROAD-010 — Downstream Consumer Contract
  - Status: **COMPLETE**.
  - `completion_evidence_mode`: `current_main_post_activation_validation`.
  - `completion_evidence_status`: `satisfied`.
  - `evaluated_main_commit`: `9e07cfe551c80d669d13489b05b035834290a32f`.
  - Ancestry evidence confirms `bootstrap -> activation -> evaluated main`.
  - Every post-activation changed path was enumerated and semantically classified; no protected implementation path changed.
  - Direct successful `push` evidence:
    - `Validate MVK` run `29147385930`, run number `383`, job `86531145374`.
    - `Behavioral Coverage Audit` run `29147385903`, run number `351`, job `86531145290`.
  - Both runs record `head_branch: main`, exact `head_sha: 9e07cfe551c80d669d13489b05b035834290a32f`, `status: completed`, and `conclusion: success`.
  - Current-main history artifact: `kroad-010-history-matrix`, artifact ID `8247156838`, digest `sha256:ff9c73838b014298c0838d2d8c894bf8a17aa7ea1affbb4f41d5ff68287b08ea`, associated with qualifying `Validate MVK` run `29147385930`.
  - The artifact report passed deterministic `merge_commit`, `squash`, and `rebase` methods with clean worktrees and required diagnostics.
  - PR #34 exact-head and synthetic-merge runs remain supporting evidence only and were not relabelled as current-main push evidence.
  - Review record: `planning/reviews/KROAD-010_DOWNSTREAM_CONSUMER_POST_MERGE_REVIEW.md`.
  - Update note: This evidence-only closure completed KROAD-010 without changing schemas, validators, fixtures, Resolver behavior, package wiring, workflows, runtime code, downstream repositories, or KROAD-011 implementation.
  - KROAD-011 is next allowed, not implemented.

## Remaining Work

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
- KROAD-005 resolver-contract artifacts are not Resolver MVP logic and do not assign real final decisions.
- KROAD-006 Resolver MVP is limited to `layout_structure`; unsupported families must fail closed.
- KROAD-007 L2 Decision Correctness Audit is limited to resolver-covered families and must rerun the resolver, not act as a second free-text opinion.
- KROAD-008 fixture triplet coverage is limited to active Resolver MVP rules. The only active family remains `layout_structure`.
- KROAD-009 provides one Kernel-local end-to-end `layout_structure` pattern only; it is not downstream enforcement or real target-project proof.
- KROAD-010 is complete under `current_main_post_activation_validation` for evaluated commit `9e07cfe551c80d669d13489b05b035834290a32f`.
- KROAD-010 proves only the Kernel-local consumer-contract gate; live downstream-repository enforcement remains unproved.
- Runtime/browser proof, Builder execution, Project Gate acceptance, ecosystem readiness, and production readiness remain unproved.
- KROAD-010 ordinary production fixtures pin merged bootstrap commit `aa0317a07c10acf4e398dc9e5869f4e6966569f9`.
- KROAD-010 history-dependent regressions use disposable runtime commits and never persist synthetic SHAs as production pins.
- Human overrides must be explicitly marked.
- Critical P0 provisional decisions must not pass final release.
- Unknown decision families must fail closed with halt / insufficient evidence / no free decision.
- KROAD-004 matrices are guidance structures only. They do not resolve decisions and do not satisfy KROAD-007+.
