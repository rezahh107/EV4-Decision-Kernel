# AGENTS.md — EV4 Decision Kernel

**Status:** active working guide  
**Scope:** agents and LLM workflows modifying this repository  
**Language:** Persian for explanations; English for file paths, schema IDs, rule IDs, and technical identifiers.

---

## 1. Mission Boundary

This repository defines shared decision, evidence, and enforcement contracts for the EV4 Elementor V4 workflow.

Agents working here must not implement a full platform unless explicitly instructed by a scoped prompt.

Current safe operating mode:

```text
Kernel-local MVK implementation and validation hardening.
Full registry expansion, release automation, reusable workflows, cross-repo integration, runtime evidence, source manifests, and Element Decision Cards remain out of scope until explicitly prompted.
```

---

## 2. Role Boundary

Do not weaken these boundaries:

```text
Architect:
  owns candidate generation, comparison, selection, and decision records.

CE:
  owns constructability proof, dependency proof, and decision closure.

Builder:
  owns execution resolution and safe action batches only.
  Builder must not invent architecture.

Responsive:
  owns runtime responsive validation.

Project Gate:
  owns lineage, hash, pin, schema, provenance, and handoff acceptance.
  Project Gate must not become an Elementor design-decision owner.

Kernel:
  owns shared vocabulary, schemas, evidence model, hard gates, fixtures, and validation-pack shape.
  Kernel must not choose a section-specific design.
```

---

## 3. Critical Non-Negotiables

Agents must preserve these rules:

```text
Documented capability != enabled project capability.
Schema valid != semantic valid.
Semantic valid != runtime valid.
Workbook-derived rule != official Elementor capability.
Builder missing evidence -> ask/repair, not guess.
Project Gate verifies evidence and authority; it does not design.
Critical behavioral gates must not remain prose-only.
Invalid fixtures must assert expected diagnostics, not just any failure.
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
- source manifest expansion
- Element Decision Cards
```

The current target is a small, enforceable MVK plus one vertical E2E slice. Keep validation local, deterministic, and fixture-proven.

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

For Critical and High behavioral rules, do not rely on prose alone.

Target chain:

```text
Concept
  -> canonical schema field
  -> minimum semantic children
  -> validator rule
  -> valid fixture
  -> invalid fixture
  -> CI enforcement
  -> downstream rejection
```

A Critical rule with status `prose_only` or `schema_backed` is an open enforcement gap.

A rule may be `fixture_tested` only when the local validator and valid/invalid fixtures prove the intended behavior and invalid fixtures assert the expected diagnostic codes.

A rule may be `ci_enforced` only after the relevant workflow run is observed passing on the PR or target branch.

---

## 7. Local Profile Rule

Future EV4 repo profiles may contain:

```text
- KERNEL_PIN.json
- profile.yaml
- adapter-map.yaml
- local CI wrapper
- compatibility notes
```

They must not contain:

```text
- forked rule logic
- weaker local evidence vocabulary
- local override that lets Builder invent architecture
- local override that lets Gate make domain decisions
```

---

## 8. UX Boundary

UX guidance belongs primarily to Builder-facing protocols, not to core Elementor capability logic.

Use UX rules for:

```text
- user-facing batch formatting
- correction flow
- screenshot request shape
- UI vocabulary sync
- active silence after confirmation
- escape hatch after repeated failure
- no hidden-state claims
```

Do not mix UX tone rules into Kernel domain validation.

---

## 9. Safe Patch Types Now

Allowed now:

```text
- Kernel-local MVK schemas, fixtures, and validators
- JSON Schema conformance validation for MVK fixtures
- structured diagnostic codes for validator failures
- behavioral coverage matrix alignment
- evidence model docs
- UX boundary docs
- kernel ownership and distribution decision docs
```

Not allowed yet:

```text
- broad registry population
- validators that claim complete coverage
- release packaging
- cross-repo CI coupling
- Project Gate domain validation logic
- source manifests
- Element Decision Cards
- downstream runtime enforcement claims
```

---

## 10. Required Self-Check Before Finalizing a Patch

Before opening or merging a patch, answer:

```text
1. Did this patch preserve EV4 role boundaries?
2. Did it reduce prose-only critical gates?
3. Did it avoid building the full platform too early?
4. Did it avoid adding local rule forks?
5. Did it make the next MVK step clearer?
6. Did it avoid claiming runtime validity without runtime evidence?
7. Did invalid fixtures assert expected diagnostic codes?
8. Did coverage status avoid downstream or CI claims without evidence?
```

If any answer is no, revise the patch before finalizing.
