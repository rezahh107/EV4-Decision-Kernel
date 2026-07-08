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
Kernel-local MVK implementation, validation hardening, source manifests, decision cards, Architect/CE source-card consumption boundaries, external evidence workspace contracts, and Behavioral Rule Coverage v0.4.1 advisory audit governance.
Full registry expansion, release automation, reusable workflows, cross-repo integration, runtime collectors, target-project availability exporters, Builder execution proof, downstream enforcement, and production readiness remain out of scope until explicitly prompted.
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
  Project Gate integration is not implemented by Prompt 5.

Kernel:
  owns shared vocabulary, schemas, evidence model, source manifests, decision cards, source/card consumption-boundary contracts, evidence workspace contracts, behavioral coverage governance, hard gates, fixtures, and validation-pack shape.
  Kernel must not choose a section-specific design.
```

---

## 3. Critical Non-Negotiables

Agents must preserve these rules:

```text
Documented capability != enabled project capability.
Schema valid != semantic valid.
Semantic valid != runtime valid.
provided_schema_valid != runtime_validated.
validated_fixture != real project/runtime proof.
collected_runtime_evidence != production_ready.
Workbook-derived rule != official Elementor capability.
Decision card guidance != correct design choice proof.
CE constructability status != Builder execution.
Builder missing evidence -> ask/repair, not guess.
Project Gate verifies evidence and authority; it does not design.
Invalid fixtures must assert expected diagnostics, not just any failure.
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

The current target is a small, enforceable Kernel-local MVK plus source/card consumption boundaries, external evidence contracts, and an honest v0.4.1 behavioral audit model. Keep validation local, deterministic, and fixture-proven.

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
  schema validation, validator rules, fixtures, CI failure, sequence tests,
  runtime monitors, OS/harness enforcement, downstream rejection
```

A prompt instruction is not an enforcement carrier. A documentation audit workflow is not equivalent to rule-level CI enforcement unless the exact rule validator/test fails the build on violation.

`advisory_ci_observed` never satisfies any Critical or High minimum by itself.

A rule may be `fixture_tested` only when the local validator and valid/invalid fixtures prove the intended behavior and invalid fixtures assert expected diagnostic codes.

A rule may be `ci_enforced` only after the exact relevant workflow run is observed failing on violation and passing for valid artifacts.

A rule may be `downstream_contract_enforced` only after an inspected downstream EV4 consumer rejects missing or invalid carriers.

---

## 7. Evidence Workspace Rule

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

Prompt 5 must not implement exporters, collectors, downstream adapters, Project Gate intake, or production readiness proof.

---

## 8. Safe Patch Types Now

Allowed now:

```text
- Kernel-local MVK schemas, fixtures, and validators
- JSON Schema conformance validation for MVK fixtures
- structured diagnostic codes for validator failures
- Behavioral Rule Coverage v0.4.1 matrix and advisory audit tooling
- evidence model docs
- source manifests and evidence labels
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
- release packaging
- cross-repo CI coupling
- Project Gate domain validation logic or intake
- downstream runtime enforcement claims
- target-project availability proof claims
- Builder execution proof claims
- Responsive runtime global-proof claims
- external exporter implementation
- browser/runtime collector implementation
```

---

## 9. Required Self-Check Before Finalizing a Patch

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
```

If any answer is no, revise the patch before finalizing.
