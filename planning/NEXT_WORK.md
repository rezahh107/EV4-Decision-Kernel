# EV4 Decision Kernel — Next Work

## Last Updated

KROAD-010 Downstream Consumer Contract

## Status Authority

This file is the authoritative current-status dashboard for roadmap progress after each merged PR.

`planning/KERNEL_EXECUTION_PLAN.md` remains the durable detailed operating map for item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules. If an item's status label in the detailed plan is stale, use this file for current roadmap status and update the detailed plan in a later maintenance PR only when changing roadmap meaning, scope, dependency, acceptance criteria, or evidence requirements.

Known detailed-plan status labels: `KROAD-001`, `KROAD-003`, `KROAD-004`, `KROAD-005`, `KROAD-006`, `KROAD-007`, `KROAD-008`, `KROAD-009`, and `KROAD-010` may still show legacy `not_started` status in `planning/KERNEL_EXECUTION_PLAN.md`; those lines are non-authoritative. Current status source for `KROAD-001`, `KROAD-003`, `KROAD-004`, `KROAD-005`, `KROAD-006`, `KROAD-007`, `KROAD-008`, `KROAD-009`, and `KROAD-010` is `planning/NEXT_WORK.md`.

## Status Summary

Current completed milestones: KROAD-000, KROAD-001, KROAD-002, KROAD-003, KROAD-004, KROAD-005, KROAD-006, KROAD-007, KROAD-008, KROAD-009, KROAD-010.
Current next task: KROAD-011 — Project Gate Intake.
Detailed plan: `planning/KERNEL_EXECUTION_PLAN.md`.
Do not continue from chat history; read this file first.

KROAD-001 is complete on `main` because PR #13 merged `planning/CROSS_REPO_ADOPTION_REPORT.md`.

## Next Task

- [ ] KROAD-011 — Project Gate Intake

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
  - Update note: This PR completed KROAD-006 by adding a limited deterministic Resolver MVP for `layout_structure` only. Evidence includes `kernel/decision-governance/resolver-rules/layout-structure.v0.json`, the active registry entry in `kernel/decision-governance/resolver-rule-registry.v0.json`, `kernel/resolver-mvp/resolve-high-risk-p0.mjs`, valid/invalid/adversarial Resolver MVP fixtures, `docs/decision-governance/RESOLVER_MVP_KROAD_006.md`, and `npm run validate:resolver-mvp` wired into `npm run validate:mvk`. The MVP can emit `auto_resolved`, `conditional`, and `unresolvable`, rejects insufficient evidence, treats official-doc-only support as conditional, and fails closed for unknown families. Review repairs added fail-closed handling for unsupported evidence tiers and malformed registry/rule inputs, direct expected-output matching for invalid/adversarial fixtures, readable 2-space JSON fixtures, and exact evidence-ref binding so non-`unresolvable` output requires condition-required evidence IDs to be declared in `context.required_evidence_refs` and present in `input.evidence_refs` at the required tier. KROAD-007+ remain incomplete.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-006_RESOLVER_MVP_SECOND_PASS_REVIEW.md`; it records the merged PR #23 state, reviewed files, CI evidence, unresolved/outdated review-thread disposition, boundaries, and the conclusion that KROAD-006 is complete on `main` and does not need another critic pass before moving to KROAD-007.
- [x] KROAD-007 — L2 Decision Correctness Audit
  - Update note: This PR completed KROAD-007 by adding `kernel/validator/validate-l2-decision-correctness.mjs`, `docs/decision-governance/L2_DECISION_CORRECTNESS_AUDIT_KROAD_007.md`, valid/invalid/adversarial L2 fixtures under `kernel/fixtures/*/l2_decision_correctness/`, and `npm run validate:l2-decision-correctness` wired into `npm run validate:mvk`. The L2 audit reruns the deterministic Resolver MVP through `resolveDecision(resolver_input)`, compares resolver output with `decision_record_v2`, detects resolver-status/selected-option/allowed-option/forbidden-option/evidence/rule-version/reaudit/human-override/overclaim issues, and keeps active resolver-backed coverage limited to `layout_structure`. KROAD-008+ remain incomplete.
  - Review note: The second-pass review/audit result is preserved in `planning/reviews/KROAD-007_L2_DECISION_CORRECTNESS_AUDIT_SECOND_PASS_REVIEW.md`; it records the merged PR #26 state, reviewed files, CI evidence, unresolved/outdated review-thread disposition, direct-run portability repair, conditional `limitations_acknowledged` enforcement repair, registry status alignment, boundaries, and the conclusion that KROAD-007 is complete on `main` and does not need another critic pass before moving to KROAD-008.
- [x] KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
  - Update note: This PR completed KROAD-008 by adding `kernel/decision-governance/resolver-fixture-triplet-policy.v0.json`, `kernel/validator/validate-resolver-fixture-triplets.mjs`, `docs/decision-governance/RESOLVER_FIXTURE_TRIPLET_POLICY_KROAD_008.md`, registry triplet coverage for `resolver.rule.layout_structure.mvp.v0@0.1.0`, and `npm run validate:resolver-fixture-triplets` wired into `npm run validate:mvk`. The validator requires valid/invalid/adversarial coverage for every active Resolver MVP rule, reruns deterministic resolver output rather than trusting case names, rejects empty fixture stubs, checks expected diagnostics, requires adversarial distinction metadata, keeps evidence refs synthetic-only, and does not implement KROAD-009+, downstream enforcement, Project Gate intake, runtime/browser evidence, Builder proof, or production readiness.
- [x] KROAD-009 — Vertical Slice
  - Update note: KROAD-009 completed the `layout_structure` vertical slice by adding the machine-readable manifest, valid/schema-valid-but-resolver-wrong/adversarial case triplet, `kernel/validator/validate-kroad-009-vertical-slice.mjs`, and `docs/decision-governance/KROAD_009_LAYOUT_STRUCTURE_VERTICAL_SLICE.md`. The validator connects the existing P0 matrix, active resolver rule and registry entry, Resolver MVP, Decision Record v2 schema, KROAD-008 triplet policy, and KROAD-007 L2 audit; proves a deterministic valid pass, rejects a schema-valid resolver-wrong record with stable L2 diagnostics, keeps a near-valid Grid case unresolvable without availability evidence, and preserves synthetic-only evidence boundaries. At the time of that PR, KROAD-010+ remained incomplete.
  - Review note: The second-pass/post-merge review record is preserved in `planning/reviews/KROAD-009_LAYOUT_STRUCTURE_VERTICAL_SLICE_SECOND_PASS_REVIEW.md`; it records merged PR #29 identity, final-head CI evidence, repair and regression verification, formal review-thread disposition, scope boundaries, and the historical conclusion that KROAD-009 was complete on `main` while KROAD-010 had not started.
- [x] KROAD-010 — Downstream Consumer Contract
  - Update note: KROAD-010 adds one Kernel-local downstream consumer contract for `rezahh107/EV4-Architect-Repo`: schema, manifest, snapshot/pin validator, supplemental lineage validator, documentation, original valid/invalid/adversarial fixtures, and focused lineage mutation fixtures. Resolver-backed `layout_structure` consumption requires immutable Kernel refs and exact Decision Record lineage; unsupported families become explicit `insufficient_evidence`; no downstream enforcement or production proof is claimed.
  - Repair note: PR #31 hardening made `insufficient_evidence` strictly non-decision-bearing, bound Kernel pins to actual commit snapshots through Git object and path resolution, added bypass, unknown-SHA, ancestor-missing-contract, and working-tree-drift fixtures, and changed `Validate MVK` to check out the exact PR head with full history.
  - Lineage repair note: The second PR Inspector pass identified incomplete Consumer-to-Decision-Record binding. A supplemental deterministic gate now preserves provisional state, downstream owner, evidence identity/tier/source/ref, rerun L2 status, same-envelope L2 results, exact matrix fragments, and required provenance.
  - Third-review coverage note: Dedicated mutation fixtures directly exercise provisional downgrade, wrong owner, evidence drift, unrelated-envelope L2, rerun-L2 status mismatch, same-envelope wrong L2 fragment, wrong matrix fragment, and missing provenance. Coverage claims are limited to these enumerated diagnostics and the valid provisional L2-pass path.
  - Fourth-review anchor note: The final acceptance stack is stored in non-self-referential anchor commit `fa30a07ed6316c1c82adeb8639ab8442b93b6a11`. Normal KROAD-010 records pin that ancestor; the lineage validator hard-codes and the policy enumerates the package, lockfile, both KROAD-010 gates, contract/schema, Decision Record schema, registry/rule, Resolver MVP, and L2 validator. Missing files or byte drift fail closed.

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
- KROAD-010 selects `EV4-Architect-Repo` as the only initial consumer target and defines a Kernel-local contract only; live downstream enforcement still requires inspected downstream rejection evidence.
- KROAD-010 requires Decision Record v2, active resolver rule, and L2 result refs for resolver-covered `layout_structure`; `insufficient_evidence` is strictly non-decision-bearing and pinned refs must resolve from the declared Kernel commit snapshot.
- KROAD-010 consumer records must preserve the pinned Decision Record's provisional state, stage owner, evidence lineage, L2 envelope, matrix fragment, required provenance, and executable acceptance stack without silent upgrades or checkout-dependent drift.
- Human overrides must be explicitly marked.
- Critical P0 provisional decisions must not pass final release.
- Unknown decision families must fail closed with halt / insufficient evidence / no free decision.
- KROAD-004 matrices are guidance structures only. They do not resolve decisions and do not satisfy KROAD-007+.
