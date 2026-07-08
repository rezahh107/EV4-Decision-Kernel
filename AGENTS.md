# AGENTS.md — EV4 Decision Kernel

**Status:** active working guide  
**Scope:** agents and LLM workflows modifying this repository  
**Language:** Persian for explanations; English for file paths, schema IDs, rule IDs, and technical identifiers.

## 1. Mission Boundary

This repository defines shared decision, evidence, behavioral coverage, and enforcement contracts for the EV4 Elementor V4 workflow.

Current safe operating mode:

```text
Kernel-local MVK implementation, validation hardening, source manifests, Elementor V4 doc coverage index, decision cards, Architect/CE source-card consumption boundaries, external evidence workspace contracts, and Behavioral Rule Coverage v0.4.1 advisory audit governance.
Full registry expansion, release automation, reusable workflows, cross-repo integration, runtime collectors, target-project availability exporters, Builder execution proof, downstream enforcement, and production readiness remain out of scope until explicitly prompted.
```

## 2. Critical Non-Negotiables

```text
Documented capability != enabled project capability.
Official docs != current user permission.
Official docs != active Elementor Pro license.
Schema valid != semantic valid.
Semantic valid != runtime valid.
validated_fixture != real project/runtime proof.
Workbook-derived rule != official Elementor capability.
Decision card guidance != correct design choice proof.
Doc coverage index != full Elementor documentation mirror.
Advisory CI != ci_enforced.
CI success != production readiness.
Downstream contract enforcement requires inspected downstream rejection evidence.
```

## 3. Elementor V4 Doc Coverage Rule

Required official documentation areas must be represented in:

```text
kernel/official-sources/elementor-v4-source-manifest.v0.json
kernel/official-sources/elementor-v4-doc-coverage-index.v0.json
kernel/official-sources/evidence-labels.v0.json
```

Non-core documentation areas may be context sources with an explicit `no_decision_card_reason`. Do not create broad decision cards merely because a documentation page exists.

Important context sources include class priority, Class Manager, user roles/classes, responsive editing, reset-style reconciliation, Variables Manager, Nested Links, V3/V4 differences, and viewport control.

## 4. Safe Patch Types Now

Allowed now:

```text
- Kernel-local MVK schemas, fixtures, and validators
- official source manifests and evidence labels
- Elementor V4 doc coverage index and validator
- Element Decision Cards
- Architect/CE source-card consumption-boundary schemas, fixtures, validators, and docs
- external evidence workspace schemas, fixtures, validator, docs, and registry entries
```

Not allowed yet:

```text
- full Elementor documentation mirror
- full control-level registry
- Project Gate intake
- downstream runtime enforcement claims
- target-project availability proof claims
- Builder execution proof claims
- Responsive runtime global-proof claims
- external exporter implementation
- browser/runtime collector implementation
- production readiness proof carriers
```

## 5. Required Self-Check Before Finalizing a Patch

```text
1. Did this patch preserve EV4 role boundaries?
2. Did it avoid treating official docs as target-project evidence?
3. Did it avoid treating workbook content as official truth?
4. Did context-only sources have no-card reasons?
5. Did invalid fixtures assert expected diagnostic codes?
6. Did coverage status avoid downstream, runtime, Builder, or production claims without evidence?
7. Did source quality notes preserve ambiguity instead of hiding it?
```
