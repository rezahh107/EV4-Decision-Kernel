# AGENTS.md — EV4 Decision Kernel

**Status:** active working guide  
**Scope:** agents and LLM workflows modifying this repository  
**Language:** Persian for explanations; English for file paths, schema IDs, rule IDs, and technical identifiers.

---

## 1. Mission Boundary

This repository defines shared decision, evidence, behavioral coverage, and enforcement contracts for the EV4 Elementor V4 workflow.

Agents working here must not implement a full platform unless explicitly instructed by a scoped prompt.

Current safe operating mode:

```text
Kernel-local MVK implementation, validation hardening, source manifests, Decision Cards, bounded Resolver chains, Coverage Guarantee v1 policy, source-bound Element/Question reconciliation, deterministic coverage diagnostics, and the unified five-package Coverage Execution Program.
Release automation, reusable workflow centralization, general runtime collectors, target-project availability exporters, Builder execution platforms, broad cross-repository orchestration, and production-readiness proof remain out of scope unless a bounded work package explicitly requires them.
```

---

## 2. Role Boundary

Do not weaken these boundaries:

```text
Architect:
  owns candidate generation, comparison, selection, and decision records.
  Architect may consume Kernel source/cards and evidence workspace packages only as bounded evidence/context.
  Architect must not treat source/cards, official docs, or schema-valid project evidence as proof of correct design choice.

CE:
  owns constructability proof, dependency proof, and decision closure.
  CE may consume evidence packages only with required-evidence checks and limitations.
  CE must not treat evidence workspace fixtures as Builder execution, runtime validation, downstream acceptance, or production readiness.

Builder:
  owns execution resolution and safe action batches only.
  Builder must not invent architecture.

Responsive:
  owns runtime responsive validation.
  Runtime snapshot evidence supports only the captured context.

Project Gate:
  owns lineage, hash, pin, schema, provenance, and handoff acceptance.
  Project Gate integration is not implemented by this repository phase.

Kernel:
  owns shared vocabulary, schemas, evidence model, source manifests, doc coverage index, decision cards, source/card consumption-boundary contracts, evidence workspace contracts, behavioral coverage governance, hard gates, fixtures, and validation-pack shape.
  Kernel must not choose a section-specific design.
```

---

## 3. Critical Non-Negotiables

Agents must preserve these rules:

```text
Documented capability != enabled project capability.
Official docs != current user permission.
Official docs != active Elementor Pro license.
Schema valid != semantic valid.
Semantic valid != runtime valid.
provided_schema_valid != runtime_validated.
validated_fixture != real project/runtime proof.
collected_runtime_evidence != production_ready.
Workbook-derived rule != official Elementor capability.
Decision card guidance != correct design choice proof.
Doc coverage index != full Elementor documentation mirror.
CE constructability status != Builder execution.
Builder missing evidence -> ask/repair, not guess.
Project Gate verifies evidence and authority; it does not design.
Invalid fixtures must assert expected diagnostics, not just any failure.
Synthetic fixture dispatch tables are not fixture testing.
Advisory CI != ci_enforced.
CI success != production readiness.
Downstream contract enforcement requires inspected downstream rejection evidence.
Runtime monitor enforcement requires an actual runtime monitor.
Sequence CI enforcement requires sequence-aware replay/diff tests or equivalent.
OS harness enforcement requires OS/process/file/network-level enforcement.
```

---

## 4. Anti-Overengineering Rule

Do not create these until an explicit later wave asks for them:

```text
- full control registry
- complete Elementor capability registry
- rule engine platform
- release automation
- reusable workflow centralization
- scheduled official-doc monitoring
- migration/deprecation automation
- signed validation outputs
- Architect repo integration
- CE repo integration
- Builder repo integration
- Responsive repo integration
- Project Gate integration
- external exporter implementation
- browser/runtime collector implementation
- downstream runtime enforcement claims
- production readiness proof carriers
```

The active target is the existing Kernel-local MVK plus the bounded Coverage Execution Program. Keep coverage source-bound, deterministic, fixture-proven and honest when denominators remain unresolved.

---

## 4.1 Coverage Governance Precedence

Coverage-sensitive work uses this precedence without weakening higher-level platform or safety constraints:

```yaml
contract_class: repository_governance_policy
precedence:
  - approved_repository_governance
  - coverage_guarantee_contract
  - unified_coverage_execution_roadmap
  - work_packages
  - implementation_prompts
```

Only an explicit owner instruction may:

- reduce the 90% minimum content floor, 95% owner target, or 100% critical P0/safety threshold;
- weaken the definition of Element or Question coverage;
- remove legitimate denominator members;
- remove independent exact-head PR inspection;
- grant Merge authority to an agent;
- substitute file, schema, validator, Commit, PR or KROAD counts for real content progress.

The maintainer may make other bounded technical decisions about paths, schemas, diagnostics, fixtures, validation and package composition without owner consultation.

## 4.2 Active AIGOV Enforcement Boundary

The active governance carrier is `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3`, `BATCH_B`, based on exact audited `main` SHA `86e25a9073df7e257ca7df799de85baf9b3fafb0`.

V3 contains one non-reusable and non-precedential Batch A reconciliation exception bound only to repository `rezahh107/EV4-Decision-Kernel`, PR #49, final head `c141923bf411f802f1673acf06dc92a77b415593` and Merge commit `86e25a9073df7e257ca7df799de85baf9b3fafb0`. It does not claim or fabricate a historical independent Green review.

Agents must preserve the normal Batch B sequence:

```text
exact base -> declared scope -> exact-head CI -> independent external review on exact head and scope -> owner-only Merge -> reviewed-head ancestry and current-main validation
```

A second independent review after Merge is not required. Post-Merge verification must prove that the already reviewed exact head reached `main`; it cannot replace or bypass the pre-Merge review.

Any head or `scope_revision` mutation invalidates earlier CI and review evidence. The implementation agent cannot act as the independent reviewer. A Batch B PR head cannot claim final repository adoption, Merge authority, Coverage promotion, product implementation or exact-main completion. `KREC-001` through `KREC-009` remain `registered_planned_task` only. `planning/NEXT_WORK.md` remains the only mutable current-status authority.

Exact-main evidence must derive repository, PR, author, Merge actor, CI and current-main identity from fresh GitHub payloads and Git ancestry. Caller-authored strings, booleans, local receipt files and target-repository lookalikes cannot unlock closure.

For PR Inspector `v1.10.1`, ordinary exact-head CI and a package boolean cannot prove the personal minimum-security profile. Only the official opaque `VerifiedSequenceEnforcement` capability, derived from the exact `Validate rereview sequence enforcement` context, App ID, immutable producer workflow and authoritative required-check settings evidence, may support Green. Repository settings enforcement remains unclaimed unless independently proven.

---

## 5. Documentation Standards

Every major document should include:

```text
- status
- scope
- owner or intended consumer
- what it is
- what it is not
- confirmed facts vs proposed methods vs open decisions
- next allowed step
- what must not be done yet
```

Use stable headings and short sections. Prefer small, enforceable contracts over impressive broad prose.

---

## 6. Behavioral Rule Coverage Standard

Behavioral Rule Coverage v0.4.1 is the active practical audit model.

Always distinguish:

```text
prompt_level_influence:
  role framing, prose guidance, examples, templates, prompt instructions, review guidance

system_level_enforcement:
  schema validation, validator rules, real fixtures, CI failure, sequence tests,
  runtime monitors, OS/harness enforcement, downstream rejection
```

A prompt instruction is not an enforcement carrier. A documentation audit workflow is not equivalent to rule-level CI enforcement unless the exact rule validator/test fails the build on violation.

`advisory_ci_observed` never satisfies any Critical or High minimum by itself.

A rule may be `fixture_tested` only when the local validator and real valid/invalid fixtures prove the intended behavior and invalid fixtures assert expected diagnostic codes.

A rule may be `ci_enforced` only after the exact relevant workflow run is observed failing on violation and passing for valid artifacts.

A rule may be `downstream_contract_enforced` only after an inspected downstream EV4 consumer rejects missing or invalid carriers.

---

## 7. Elementor V4 Doc Coverage Rule

Required official documentation areas must be represented in:

```text
kernel/official-sources/elementor-v4-source-manifest.v0.json
kernel/official-sources/elementor-v4-doc-coverage-index.v0.json
kernel/official-sources/evidence-labels.v0.json
```

Non-core documentation areas may be context sources with an explicit `no_decision_card_reason`. Do not create broad decision cards merely because a documentation page exists.

Important context sources include class priority, Class Manager, user roles/classes, responsive editing, reset-style reconciliation, Variables Manager, Nested Links, V3/V4 differences, and viewport control.

Viewport Control is not treated as complete breakpoint semantics. If breakpoint-specific source evidence is missing, use an explicit insufficient-evidence gap.

---

## 8. Evidence Workspace Rule

Prompt 5 may add only Kernel-local evidence contracts:

```text
- evidence status vocabulary
- evidence workspace envelope
- project environment profile schema
- WordPress context evidence schema
- Elementor project availability evidence schema
- runtime snapshot evidence schema
- responsive runtime evidence schema
- valid and invalid fixtures
- deterministic validator diagnostics
```

Prompt 5 and this PR #9 repair must not implement exporters, collectors, downstream adapters, Project Gate intake, or production readiness proof.

---

## 9. Safe Patch Types Now

Allowed now:

```text
- Kernel-local MVK schemas, fixtures, and validators
- JSON Schema conformance validation for MVK fixtures
- structured diagnostic codes for validator failures
- Behavioral Rule Coverage v0.4.1 matrix and advisory audit tooling
- evidence model docs
- source manifests and evidence labels
- Elementor V4 doc coverage index and validator
- Element Decision Cards
- Architect/CE source-card consumption-boundary schemas, fixtures, validators, and docs
- external evidence workspace schemas, fixtures, validator, docs, and registry entries
- UX boundary docs
- kernel ownership and distribution decision docs
```

Not allowed yet:

```text
- broad registry population
- validators that claim complete coverage
- full Elementor documentation mirror
- full control-level registry
- release packaging
- cross-repo CI coupling
- Project Gate domain validation logic or intake
- downstream runtime enforcement claims
- target-project availability proof claims
- Builder execution proof claims
- Responsive runtime global-proof claims
- external exporter implementation
- browser/runtime collector implementation
- production readiness proof carriers
```

---

## 10. Required Self-Check Before Finalizing a Patch

Before opening or merging a patch, answer:

```text
1. Did this patch preserve EV4 role boundaries?
2. Did it reduce or clearly report prose-only / below-threshold Critical and High gates?
3. Did it avoid building the full platform too early?
4. Did it avoid adding local rule forks?
5. Did it make the next MVK step clearer?
6. Did it avoid claiming runtime validity without runtime evidence?
7. Did invalid fixtures assert expected diagnostic codes?
8. Did coverage status avoid downstream or CI claims without evidence?
9. Did it avoid treating advisory CI as ci_enforced?
10. Did it avoid treating cross_turn Critical rules as satisfied by single-artifact CI?
11. Did evidence workspace fixtures avoid real-world evidence claims?
12. Did doc coverage fixtures avoid synthetic fixture-case dispatch?
13. Did source quality notes preserve ambiguity instead of hiding it?
```

If any answer is no, revise the patch before finalizing.
---

## 11. Repository Memory / Next Work

- Before proposing or implementing the next task, read `planning/NEXT_WORK.md`.
- For detailed task meaning and acceptance criteria, read `planning/KERNEL_EXECUTION_PLAN.md`.
- Do not rely on chat history as the source of truth when these files exist.
- Current roadmap status must live in `planning/NEXT_WORK.md`.
- Do not duplicate mutable current roadmap status in detailed planning or report documents.
- `planning/KERNEL_EXECUTION_PLAN.md` should describe item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules.
- If a PR completes a KROAD item, search changed planning/report files for stale pre-merge or stale status wording.
- Stale phrases include `not_started`, `pending PR`, `not complete on main until this PR is merged`, `expected post-merge state`, and `becomes complete only after this PR merges`.
- After merge, clean up stale pre-merge wording or mark it clearly as historical.
- If a PR changes files under `kernel/`, `docs/`, `planning/`, schemas, validators, decision cards, governance documents, or roadmap-relevant source files, update `planning/NEXT_WORK.md` in the same PR.
- If a PR changes the meaning, order, scope, dependency, or acceptance criteria of any KROAD item, update `planning/KERNEL_EXECUTION_PLAN.md` in the same PR.
- Before ticking any item as complete, verify concrete repository evidence exists.
- If evidence is missing or uncertain, do not tick the item; add a note explaining what is missing.
- Add a short note such as: `Update note: This PR completed KROAD-XXX by adding <short evidence>.`
- If unsure whether a PR requires a roadmap update, update `planning/NEXT_WORK.md` with a short note instead of leaving it stale.
