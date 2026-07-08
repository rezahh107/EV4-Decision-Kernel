# EV4 Decision Kernel — Next Work

## Last Updated
PR #12 — Add repository-local planning dashboard and repository-memory rules

## Status Summary
Current completed milestone: KROAD-002.
Next task: KROAD-001 — Cross-Repository Adoption Report.
Detailed plan: `planning/KERNEL_EXECUTION_PLAN.md`.
Do not continue from chat history; read this file first.

## Next Task
- [ ] KROAD-001 — Cross-Repository Adoption Report

Inspect these repositories:
- rezahh107/EDAS-v4
- rezahh107/elementor-v4-knowledge-base
- rezahh107/EV4-Workbook-Jinja
- rezahh107/EDIS-Browser-Runtime-Evidence-Collector
- rezahh107/EDIS-WordPress-Evidence-Exporter
- rezahh107/Elementor-Design-Audit-System

## Completed
- [x] KROAD-000 — Live Baseline Precheck
- [x] KROAD-002 — Taxonomy + Execution-Risk Boundaries
  - Update note: PR #11 completed the decision governance taxonomy and execution-risk boundary foundation.

## Remaining Work (including next task)
- [ ] KROAD-001 — Cross-Repository Adoption Report
- [ ] KROAD-003 — Decision Record Schema v2 + Migration Plan
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
- Decision Record Schema v2 must include `resolver_status`, `evidence_tier`, `rule_version`, `decision_type`, `trigger_source`, `provisional_status`, `reopen_count`, and `previous_decision_ref`.
- L2 Audit must rerun the resolver, not act as a second free-text opinion.
- Human overrides must be explicitly marked.
- Critical P0 provisional decisions must not pass final release.
- Unknown decision families must fail closed with halt / insufficient evidence / no free decision.
