# Cross-Repository Adoption Report — KROAD-001

## Status

- **KROAD:** `KROAD-001 — Cross-Repository Adoption Report`
- **Status:** read-only adoption report
- **Repository state:** not complete on `main` until this PR is merged
- **Scope:** planning evidence only; no code import, no automation, no external repository modification

## Scope

This report inspected selected repository documents and contracts only. It did not audit full repository trees, run CI, execute tests, inspect every fixture, or validate current release artifacts.

| Repository | Inspected paths / document types | Not inspected |
|---|---|---|
| `rezahh107/EDAS-v4` | `README.md`, `SSOT.md`, `PLANS.md`, `pyproject.toml`, `schemas/truth-report.schema.json` | Full source tree, all fixtures, full test suite, CI runs, PR history |
| `rezahh107/elementor-v4-knowledge-base` | `README.md`, `QUALITY_POLICY.md`, `CONTRIBUTING.md`, `manifests/stages.yaml` | Full docs corpus, all manifests, ledger history, CI runs, all generated artifacts |
| `rezahh107/EV4-Workbook-Jinja` | `README.md`, `AGENTS.md`, `llm/model-contract.yaml`, `llm/TASK_TEMPLATE_FA.md` | Full content units, full schemas, browser tests, generated `dist/`, returned ZIP workflow |
| `rezahh107/EDIS-Browser-Runtime-Evidence-Collector` | `README.md`, `docs/schema-reference.md`, `docs/determinism.md` | Extension source internals, full schemas, full test suite, release artifacts, CI runs, browser E2E evidence |
| `rezahh107/EDIS-WordPress-Evidence-Exporter` | `README.md`, `docs/export-workflow.md`, `docs/quality-gates.md` | Full PHP source, full contracts, runtime test evidence, CI runs, WordPress/Elementor live matrix |
| `rezahh107/Elementor-Design-Audit-System` | `README.md`, `pyproject.toml`, `schemas/audit_report.schema.json` | Rule implementation, source parser internals, fixtures, tests, CI runs, generated reports |

## KROAD-001 Source of Truth

`KROAD-001` is a read-only roadmap step. Its purpose is to discover which knowledge, contracts, schemas, evidence boundaries, validation patterns, and diagnostics patterns from related repositories should be adopted, adapted, referenced, or excluded.

Expected output:

- a committed adoption report such as `planning/CROSS_REPO_ADOPTION_REPORT.md`;
- explicit classification for every inspected repository;
- source or path references for findings;
- separation of source truth, runtime truth, project truth, and documentation truth;
- identification of what must not be imported;
- recommendation about whether roadmap order should change.

Do-not rules:

- do not modify external repositories;
- do not copy large systems into Kernel;
- do not turn Kernel into a documentation mirror;
- do not import V3 as a design target;
- do not claim runtime proof from source evidence.

## Classification Vocabulary

- `adopt_now`: Small principle, contract, vocabulary, or boundary immediately useful for the Kernel roadmap. It does not mean code import, platform import, or implementation in this PR.
- `adapt_later`: Useful pattern for a future KROAD item, but not implemented now.
- `reference_only`: Useful for comparison or inspiration only; no direct contract transfer.
- `do_not_import`: Explicitly forbidden, unsafe, out of scope, or likely to create false authority in Kernel.

## Executive Summary

The inspected repositories contain useful evidence-boundary, source-precedence, schema, diagnostics, fixture, and producer-boundary patterns. Kernel should adopt only small governance principles now, keep implementation patterns for later KROAD items, and avoid importing platforms, collectors, exporters, scoring engines, or V3 design semantics.

Current roadmap order should remain unchanged. After this report is merged and repository memory is updated, the next recommended roadmap step is `KROAD-003 — Decision Record Schema v2 + Migration Plan`.

## Repository Findings

### `rezahh107/EDAS-v4`

**Inspected scope:** `README.md`, `SSOT.md`, `PLANS.md`, `pyproject.toml`, `schemas/truth-report.schema.json`.

**adopt_now**

- Normalized-evidence boundary: rules should consume normalized evidence, not raw Elementor dictionaries.
- Unsupported or unresolved values must produce explicit unresolved / insufficient-data states, not guessed pass/fail results.
- Deterministic report identity and diagnostics should inform Kernel vocabulary, without copying EDAS schemas directly.

**adapt_later**

- `TruthReport` shape, including coverage, findings, formula projections, diagnostics, and deterministic hash concepts, for `KROAD-003`, `KROAD-007`, and `KROAD-018`.
- Atomic V4 / Legacy V3 / Hybrid / Unknown classification as evidence-context vocabulary only, for source-boundary discussions.
- Fixture-blocked capability policy for `KROAD-008`.

**reference_only**

- CLI/GUI service-boundary pattern and quality-gate organization.
- Formula/registry packaging pattern.

**do_not_import**

- Do not make V3 a valid Kernel design target.
- Do not copy EDAS code, full schemas, GUI, CLI, or registry implementation into Kernel.
- Do not claim runtime/browser proof from EDAS-v4; inspected material reports runtime browser evidence as intentionally not implemented.

**Kernel implications**

Useful for decision-record vocabulary, resolver no-guess behavior, fixture-blocked status, and future release-gate concepts. It should not shift Kernel from V4 decision governance into an EDAS-style evidence compiler.

### `rezahh107/elementor-v4-knowledge-base`

**Inspected scope:** `README.md`, `QUALITY_POLICY.md`, `CONTRIBUTING.md`, `manifests/stages.yaml`.

**adopt_now**

- Source/Evidence/Claim/Synthesis separation as a small evidence-governance principle.
- Evidence status vocabulary such as `documented`, `observed`, `validated`, `derived`, `proposed`, `unverified`, and `insufficient_evidence`.
- Gap IDs and explicit non-authoritative statuses for incomplete documentation evidence.

**adapt_later**

- Source freshness, content fingerprint, coverage manifest, and official-doc backlog patterns for `KROAD-017`.
- Generated artifact drift checks as a future release/readiness idea, not this PR.

**reference_only**

- Append-only ledger and staged content workflow.
- Queue gating and generated index structure.

**do_not_import**

- Do not treat KB documents as runtime truth, project truth, active license proof, or production readiness.
- Do not mirror the full Elementor documentation corpus inside Kernel.
- Do not treat `storage_status: committed` or committed markdown as complete product truth.

**Kernel implications**

Useful for official-source governance and freshness planning. It should support Kernel source labels and evidence refs, not replace downstream project/runtime evidence.

### `rezahh107/EV4-Workbook-Jinja`

**Inspected scope:** `README.md`, `AGENTS.md`, `llm/model-contract.yaml`, `llm/TASK_TEMPLATE_FA.md`.

**adopt_now**

- `always_read` and source-precedence discipline for future task prompts and repo-local memory.
- `allowed_paths` / protected-path discipline for scoped changes.
- Explicit `insufficient_evidence` and `BLOCKED_ENVIRONMENT` reporting instead of guessed capability or validation claims.

**adapt_later**

- Task template structure for future KROAD implementation prompts.
- Return-report fields as a possible evidence-ledger pattern for future validation documentation.

**reference_only**

- Manual LLM handoff workflow as an operational example.

**do_not_import**

- Do not import the full ZIP return contract into Kernel GitHub PR workflow.
- Do not treat Workbook content as Elementor truth or Kernel authority.
- Do not use generated `dist/`, `release/`, or `handoff/` paths as source truth.

**Kernel implications**

Useful for process discipline, especially source precedence and scoped edit rules. It should not make Kernel depend on complete-repository ZIP handoff mechanics.

### `rezahh107/EDIS-Browser-Runtime-Evidence-Collector`

**Inspected scope:** `README.md`, `docs/schema-reference.md`, `docs/determinism.md`.

**adopt_now**

- Runtime/source boundary principle: browser evidence may record rendered observations and preliminary source binding, but does not own final correlation, breakpoint resolution, registry resolution, formula evaluation, UX analysis, or production readiness.
- Computed-style limitation principle: observed computed values are runtime facts; CSSOM origin or final source meaning must not be inferred without the right evidence.

**adapt_later**

- Runtime package layout, coverage artifacts, diagnostics artifact, validation artifact, and checksum package pattern for `KROAD-013`.
- Privacy defaults as future runtime-evidence guardrails for `KROAD-013`.
- Binding states such as exact/probable/ambiguous/unmatched as future source-runtime vocabulary.
- Canonicalization and deterministic package validation ideas for `KROAD-018`.

**reference_only**

- Browser extension implementation details, release-profile mechanics, performance remediation notes, and store/publication workflow.

**do_not_import**

- Do not import the browser collector implementation.
- Do not claim runtime proof, downstream enforcement, or production readiness without actual integrated runtime evidence.
- Do not treat synthetic browser fixtures as real WordPress/Elementor compatibility proof.

**Kernel implications**

Useful runtime-boundary pattern among the inspected files. It should shape future contracts but must not create runtime claims before `KROAD-013` has real integration evidence.

### `rezahh107/EDIS-WordPress-Evidence-Exporter`

**Inspected scope:** `README.md`, `docs/export-workflow.md`, `docs/quality-gates.md`.

**adopt_now**

- Saved-source producer boundary: WordPress exporter may prove saved source evidence, registries, provenance, and source snapshots only.
- Source drift and immutable snapshot principles as evidence-boundary vocabulary.
- Explicit `insufficient_evidence` compatibility status when cross-product routing is not proven.

**adapt_later**

- Semantic/instance hash distinction, package manifest ideas, per-step artifact hashes, and deterministic validation evidence for `KROAD-012`, `KROAD-011`, and `KROAD-018`.
- Quality-gate principle that a workflow definition is not executed verification evidence.

**reference_only**

- Deterministic ZIP mechanics, private storage internals, lock/lease mechanics, WordPress lifecycle hardening, and plugin-check lanes.

**do_not_import**

- Do not import the WordPress plugin, storage subsystem, REST worker, Cron recovery, or package builder into Kernel.
- Do not treat WordPress saved source export as runtime DOM, computed style, breakpoint behavior, final correlation, or production readiness.
- Do not claim Project Gate or Browser compatibility from source-export documentation alone.

**Kernel implications**

Useful for external evidence producer contracts and saved-source boundaries. It should inform `KROAD-012` without moving producer implementation into Kernel.

### `rezahh107/Elementor-Design-Audit-System`

**Inspected scope:** `README.md`, `pyproject.toml`, `schemas/audit_report.schema.json`.

**adopt_now**

- No direct implementation adoption. Kernel should only retain the small principle that audit outputs need explicit diagnostics separate from narrative recommendations.

**adapt_later**

- Diagnostics/violation vocabulary, severity fields, and element-tree reporting ideas for `KROAD-007`.
- Schema compatibility rule: additive fields may be allowed within a major version, while removed or renamed fields need version change, for `KROAD-003` migration planning.

**reference_only**

- Report schema shape with scores, metrics, violations, summary, and diagnostics.
- Element-tree report pattern as a future audit-report projection reference.

**do_not_import**

- Do not import scoring, UX scoring, suggested fixes, fix confidence, responsive fix suggestions, or audit grades as Kernel decision authority.
- Do not use this audit system as the source of truth for Kernel decisions.
- Do not copy its parser/rules/UI package into Kernel.

**Kernel implications**

Useful only as a reporting-shape reference and diagnostics vocabulary input. It must not become a resolver, decision authority, or correctness oracle.

## Cross-Repository Adoption Matrix

| Asset / pattern | Source repository | Classification | Target KROAD | Reason | Overclaim guard |
|---|---|---|---|---|---|
| Normalized evidence only for rules | `EDAS-v4` | `adopt_now` | `KROAD-003`, `KROAD-005` | Keeps resolver inputs bounded and traceable. | Do not copy EDAS implementation or make V3 a design target. |
| Unresolved values cannot pass silently | `EDAS-v4` | `adopt_now` | `KROAD-005`, `KROAD-006`, `KROAD-008` | Supports fail-closed resolver behavior and invalid/adversarial fixtures. | Do not claim semantic correctness outside covered rules. |
| Fixture-blocked capability policy | `EDAS-v4` | `adapt_later` | `KROAD-008` | Helps define valid/invalid/adversarial fixture requirements. | Synthetic dispatch tables do not count as fixture testing. |
| Source/Evidence/Claim/Synthesis separation | `elementor-v4-knowledge-base` | `adopt_now` | `KROAD-003`, `KROAD-004`, `KROAD-017` | Helps keep documentation truth separate from project/runtime truth. | Official docs are not project availability or runtime proof. |
| Source freshness and content fingerprints | `elementor-v4-knowledge-base` | `adapt_later` | `KROAD-017` | Useful for official docs freshness monitor. | Do not turn Kernel into a docs mirror. |
| Always-read and source precedence rules | `EV4-Workbook-Jinja` | `adopt_now` | `KROAD-003`, `KROAD-010`, `KROAD-016` | Strengthens downstream task discipline and sequence consistency. | Workbook rules are not Elementor truth. |
| Allowed paths and scoped edits | `EV4-Workbook-Jinja` | `adopt_now` | `KROAD-010`, `KROAD-016` | Helps prevent downstream contract bypass and silent mutation. | Do not import full ZIP workflow. |
| Runtime/source boundary | `EDIS-Browser-Runtime-Evidence-Collector` | `adopt_now` | `KROAD-013` | Separates rendered runtime facts from source/project evidence. | Do not claim runtime proof before integration. |
| Runtime package layout and privacy defaults | `EDIS-Browser-Runtime-Evidence-Collector` | `adapt_later` | `KROAD-013`, `KROAD-018` | Useful future runtime-evidence contract shape. | No collector implementation or monitor is imported now. |
| Saved source producer boundary | `EDIS-WordPress-Evidence-Exporter` | `adopt_now` | `KROAD-012` | Defines what WordPress source evidence can and cannot prove. | Source export is not runtime truth. |
| Semantic/instance hashes and package manifests | `EDIS-WordPress-Evidence-Exporter` | `adapt_later` | `KROAD-011`, `KROAD-012`, `KROAD-018` | Useful future package integrity and intake evidence. | Do not import storage, REST, Cron, or ZIP implementation. |
| Workflow definition is not executed evidence | `EDIS-WordPress-Evidence-Exporter` | `adapt_later` | `KROAD-018` | Supports release-gate evidence discipline. | CI definition is not CI pass evidence. |
| Diagnostics/violation report vocabulary | `Elementor-Design-Audit-System` | `adapt_later` | `KROAD-007` | Useful for L2 audit reporting. | Scores/fixes/confidence are not decision authority. |
| Element-tree report projection | `Elementor-Design-Audit-System` | `reference_only` | `KROAD-007`, `KROAD-009` | May help display audit context. | Do not use as resolver correctness proof. |
| Downstream consumer source-precedence discipline | `EV4-Workbook-Jinja`, Kernel rules | `adapt_later` | `KROAD-010` | Helps Architect/CE know when Kernel references are mandatory. | Do not claim downstream enforcement until downstream rejection evidence exists. |
| Cross-turn mutation guard idea | `EV4-Workbook-Jinja`, Kernel rules | `adapt_later` | `KROAD-016` | Helps prevent downstream stages from silently rewriting upstream decisions. | Sequence enforcement requires replay/diff tests or equivalent. |

## What Must Not Be Imported

- Full platforms, collectors, exporters, GUIs, CLIs, storage engines, release automation, or reusable workflows.
- V3 as a Kernel design target.
- Full Elementor documentation mirror or KB content as final truth.
- Browser runtime proof before actual runtime integration.
- WordPress saved source export as frontend DOM, computed style, runtime behavior, final correlation, or production readiness.
- Audit scoring, UX scoring, grades, suggested fixes, confidence values, or responsive fix suggestions as Kernel decision authority.
- Full ZIP return contracts or generated output folders as Kernel source truth.
- Any CI/check/validation success claim unless the exact command or workflow has actually run and passed.

## Risks and Guardrails

- **False authority risk:** Documentation, report schemas, or score outputs may look authoritative. Guardrail: every adopted pattern must state what it can and cannot prove.
- **V3 leakage risk:** EDAS-v4 supports legacy compatibility. Guardrail: Kernel remains V4 decision-governance only; V3 is legacy risk or compatibility context only.
- **Source/runtime confusion:** WordPress saved source and Browser runtime facts are different evidence domains. Guardrail: decision records must carry explicit evidence tier and evidence refs.
- **Overengineering risk:** External repositories contain mature systems. Guardrail: import only small vocabulary and boundary principles unless a later KROAD explicitly scopes implementation.
- **Fixture overclaim risk:** Valid fixtures, invalid fixtures, and adversarial fixtures must prove intended diagnostics. Guardrail: fixture naming or synthetic dispatch does not count as proof.
- **CI overclaim risk:** A workflow definition is not executed evidence. Guardrail: release/readiness claims require observed run evidence or local command output.

## Roadmap Impact

Current roadmap order should remain unchanged. This report supports the existing sequence: adoption report first, then `KROAD-003 — Decision Record Schema v2 + Migration Plan`.

After this report is merged, the next recommended task is:

```text
KROAD-003 — Decision Record Schema v2 + Migration Plan
```

No KROAD meaning, dependency, scope, acceptance criteria, or evidence requirement changes are proposed by this report. `planning/KERNEL_EXECUTION_PLAN.md` does not need to change.

## Completion Rule

`KROAD-001` is not complete on `main` until this report is committed and the PR containing it is merged.

This PR may update `planning/NEXT_WORK.md` to represent the expected post-merge state. The PR body must clearly state that completion takes effect only after merge.

After merge, `KROAD-001` may be marked complete because the repository will contain:

- a committed adoption report;
- inspected repository/path references;
- explicit classifications for every listed repository;
- a recommendation that roadmap order remains unchanged;
- explicit limitations and do-not-import guards.

## Limitations / Not Verified

- CI/check status was not verified.
- Full repository trees were not fully audited.
- Full tests and fixtures were not run.
- No external repository was modified.
- No adoption recommendation means implementation by itself.
- No runtime proof is claimed.
- No downstream enforcement is claimed.
- No Project Gate integration is claimed.
- No V3 design target is introduced.
- No production readiness is claimed.
