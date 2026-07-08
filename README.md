# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation with source manifest, decision-card layer, Architect/CE consumption boundaries, and Behavioral Rule Coverage v0.4.1 advisory audit model  
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schema contracts, evidence vocabulary, hard gates, source manifests, decision cards, consumption-boundary fixtures, behavioral coverage governance, and validator-pack shape for EV4. It does not choose section-specific Elementor designs.

```text
Documented Elementor capability != enabled project capability != constructability proven != Builder executed != Responsive validated != production ready
```

## Role Boundary

```text
Architect: owns decision records and selected design choices. Source/card consumption is candidate guidance, not final proof.
CE: owns constructability proof and decision closure. Source/card consumption must check required evidence and limitations.
Builder: resolves and executes only locked decisions.
Responsive: validates runtime behavior.
Project Gate: verifies lineage, hash, evidence completeness, schema validity, and stage authority. It must not make Elementor design decisions.
Kernel: owns shared IDs, schemas, evidence vocabulary, source manifests, decision cards, consumption-boundary contracts, behavioral coverage governance, hard gates, fixtures, and validation-pack shape.
```

## Prompt 4.5 Behavioral Coverage v0.4.1

The active behavioral audit model is `docs/governance/BEHAVIORAL_RULE_COVERAGE.md`.

Behavioral Rule Coverage v0.4.1 separates:

```text
prompt_level_influence:
  role framing, prose guidance, examples, templates, prompt instructions, review guidance

system_level_enforcement:
  schema validation, validator rules, fixtures, CI failure, sequence tests,
  runtime monitors, OS/harness enforcement, downstream rejection
```

The repository-local workflow `.github/workflows/behavioral-coverage.yml` is advisory. It checks matrix structure, enum validity, threshold reporting, and overclaim risks. It does not make every listed behavioral rule `ci_enforced`.

Key no-overclaim boundaries:

```text
advisory_ci_observed != ci_enforced
downstream_contract_enforced requires inspected downstream rejection evidence
sequence_ci_enforced requires sequence-aware replay/diff tests or equivalent
runtime_monitor_enforced requires an actual runtime monitor
```

## Prompt 4 Consumption Boundaries

The Kernel-local MVK package includes:

```text
- official Elementor source manifest
- evidence labels
- core element decision cards
- source/card JSON Schemas
- Architect source/card consumption schema
- CE source/card consumption schema
- valid and invalid consumption-boundary fixtures
- validator-backed source/card consumption checks
- Behavioral Rule Coverage v0.4.1 advisory audit tooling
```

Install locked dependencies and run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

`npm run validate:mvk` runs the repaired Prompt 2.5 validator, then the Prompt 3 source/card validator, then the Prompt 4 consumption-boundary validator. Expected Prompt 4 portion:

```text
Source/card consumption-boundary validator summary
Schema setup: PASS (2/2 schemas compiled)
Consumption registry load: PASS (8 cards; 16 sources)
Schema validation: PASS (executed 18/18; valid fixtures schema-clean 4/4)
Valid fixtures passed schema + semantic validation: 4/4
Invalid fixtures failed with expected diagnostics: 14/14
Expected diagnostic assertions: PASS (14/14)
Result: PASS
```

The repository-local workflow at `.github/workflows/validate-mvk.yml` installs locked MVK validator dependencies with `npm ci` and runs `npm run validate:mvk` on PRs and pushes to `main`. CI status must still be observed on the PR before claiming any rule is `ci_enforced`.

## Evidence Boundary

```text
Elementor docs = upstream source of truth.
Kernel = structured decision extraction, source refs, labels, limitations, schemas, fixtures, validator checks, consumption-boundary contracts, and behavioral coverage audit governance.
Workbook = educational/derived seed only, not official authority.
Official docs prove platform capability, not target project availability.
Decision cards guide Architect/CE reasoning, not final design correctness.
Constructability requires CE evidence, not official docs alone.
Builder execution requires future Builder evidence.
Runtime proof requires future Browser Runtime evidence.
Project availability requires future WordPress/EDIS project evidence.
```

## Not Included

```text
- Prompt 5 external evidence contracts
- project availability schemas
- runtime/browser evidence schemas
- GitHub Release automation
- reusable workflows
- docs monitoring automation
- migration framework
- full Elementor capability registry
- full control-level registry
- signed validation output system
- changes to other EV4 repositories
- downstream EV4 consumer enforcement
- runtime validation
- Builder execution proof
- production readiness proof
```

Schema-valid is not runtime-valid. Source-backed is not project-available. Decision-card-valid is not Builder-executed. Consumption-boundary-valid is not downstream-enforced. Advisory CI is not fail-closed rule enforcement.
