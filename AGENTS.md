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

The active governance carrier is `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4`, `BATCH_B`, based on exact audited `main` SHA `86e25a9073df7e257ca7df799de85baf9b3fafb0`.

V4 contains one non-reusable and non-precedential Batch A reconciliation exception bound only to repository `rezahh107/EV4-Decision-Kernel`, PR #49, base `5ff5d7b20db11af36ab787eb8ac2d1127ea74644`, final head `c141923bf411f802f1673acf06dc92a77b415593` and squash commit `86e25a9073df7e257ca7df799de85baf9b3fafb0`. The exception passed only because both live Git commit objects have exact tree SHA `8a8c83aee95ab36ab59ba128c7710bafedaa2d20`. It does not claim or fabricate a historical independent Green review.

Agents must preserve the normal Batch B sequence:

```text
exact base -> declared scope -> exact-head CI -> independent external review on exact head and scope -> owner-only Merge -> method-aware deterministic Merge-result proof -> current-main validation
```

For a merge commit, delivery proof is reviewed-head ancestry. For Squash Merge, delivery proof is exact tree or reconstructed-tree equality. For rebase, delivery proof is deterministic result-tree equivalence or verified commit mapping. Merge-method handling cannot weaken exact-head CI, independent review, owner identity, scope binding or current-main validation.

A second independent review after Merge is not required. Post-Merge verification must prove that the already reviewed exact content reached `main`; it cannot replace or bypass the pre-Merge review.

Any head or `scope_revision` mutation invalidates earlier CI and review evidence. The implementation agent cannot act as the independent reviewer. A Batch B PR head cannot claim final repository adoption, Merge authority, Coverage promotion, product implementation or exact-main completion. `KREC-001` through `KREC-009` remain `registered_planned_task` only. `planning/NEXT_WORK.md` remains the only mutable current-status authority.

Exact-main evidence must derive repository, PR, author, Merge actor, CI, Git tree and current-main identity from fresh GitHub payloads. Caller-authored strings, booleans, local receipt files and target-repository lookalikes cannot unlock closure.

For active Batch B review, only the immutable `PR-Inspector v1.10.2` implementation at release commit `9ed48bd995ee5b9270756254b04c1d48ccf21cbe` is accepted. Ordinary exact-head CI, a package boolean, a stale `v1.10.1` bundle, or a target-authored receipt cannot prove the personal minimum-security profile. Only the official opaque verified capability, derived from the exact `Validate rereview sequence enforcement` workflow descriptor, GitHub Actions App identity, official review directory, active release lock and authoritative GitHub evidence, may support a technical Green. Repository settings enforcement remains unclaimed unless independently proven.

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
