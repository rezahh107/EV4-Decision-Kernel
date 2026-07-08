# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation with source manifest, decision-card layer, Architect/CE consumption boundaries, external evidence workspace contracts, and Behavioral Rule Coverage v0.4.1 advisory audit model  
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schema contracts, evidence vocabulary, hard gates, source manifests, decision cards, consumption-boundary fixtures, evidence workspace contracts, behavioral coverage governance, and validator-pack shape for EV4. It does not choose section-specific Elementor designs and does not collect external evidence itself.

```text
Documented Elementor capability != enabled project capability != constructability proven != Builder executed != Responsive validated != production ready
```

## Role Boundary

```text
Architect: owns decision records and selected design choices. Source/card/evidence workspace consumption is candidate guidance, not final proof.
CE: owns constructability proof and decision closure. Evidence packages may support claims only within their inspected scope.
Builder: resolves and executes only locked decisions.
Responsive: validates runtime behavior.
Project Gate: verifies lineage, hash, evidence completeness, schema validity, and stage authority. It must not make Elementor design decisions.
Kernel: owns shared IDs, schemas, evidence vocabulary, source manifests, decision cards, consumption-boundary contracts, evidence workspace contracts, behavioral coverage governance, hard gates, fixtures, and validation-pack shape.
```

## Prompt 5 External Evidence Contracts

Prompt 5 adds Kernel-local scaffolding for future external evidence packages:

```text
kernel/registries/evidence-status-model.v0.json
kernel/schemas/evidence-workspace-envelope.schema.json
kernel/schemas/project-environment-profile.schema.json
kernel/schemas/wordpress-context-evidence.schema.json
kernel/schemas/elementor-project-availability-evidence.schema.json
kernel/schemas/runtime-snapshot-evidence.schema.json
kernel/schemas/responsive-runtime-evidence.schema.json
kernel/validator/validate-evidence-workspace.mjs
```

The evidence workspace layer represents package status, unresolved gaps, references, kernel pins, and explicit not-proven boundaries. It does not implement external exporters, browser collectors, Project Gate intake, or downstream consumer rejection.

## Evidence Status Boundary

```text
provided_schema_valid != runtime_validated
validated_fixture != real target-project proof
collected_runtime_evidence != production_ready
official docs != project availability evidence
fixture evidence != Builder execution
Kernel-local validation != downstream contract enforcement
```

## Behavioral Coverage v0.4.1

The active behavioral audit model is `docs/governance/BEHAVIORAL_RULE_COVERAGE.md`.

```text
prompt_level_influence:
  role framing, prose guidance, examples, templates, prompt instructions, review guidance

system_level_enforcement:
  schema validation, validator rules, fixtures, CI failure, sequence tests,
  runtime monitors, OS/harness enforcement, downstream rejection
```

The repository-local workflow `.github/workflows/behavioral-coverage.yml` is advisory. It checks matrix structure, enum validity, threshold reporting, and overclaim risks. It does not make every listed behavioral rule `ci_enforced`.

## Local Validation

Install locked dependencies and run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

`npm run validate:mvk` runs the MVK validator, source/card validator, consumption-boundary validator, and evidence-workspace validator.

Expected Prompt 5 portion:

```text
Evidence workspace validator summary
Schema setup: PASS (6/6 schemas compiled)
Evidence package registry load: PASS (5 package refs)
Schema validation: PASS (executed 15/15; valid fixtures schema-clean 6/6)
Valid fixtures passed schema + semantic validation: 6/6
Invalid fixtures failed with expected diagnostics: 9/9
Expected diagnostic assertions: PASS (9/9)
Result: PASS
```

## Evidence Boundary

```text
Elementor docs = upstream source of truth for documented platform capability.
Kernel = structured decision extraction, source refs, labels, limitations, schemas, fixtures, validator checks, consumption-boundary contracts, evidence workspace contracts, and behavioral coverage audit governance.
Workbook = educational/derived seed only, not official authority.
Official docs prove platform capability, not target project availability.
Project availability requires future WordPress/EDIS project evidence.
Runtime proof requires future Browser Runtime evidence.
Builder execution requires future Builder evidence.
Downstream enforcement requires inspected downstream rejection evidence.
```

## Not Included

```text
- external exporter implementation
- browser/runtime collector implementation
- EDAS-v4 changes
- Elementor-Design-Audit-System changes
- Project Gate intake
- changes to Architect, CE, Builder, Responsive, or Project Gate repositories
- GitHub Release automation
- reusable workflows
- docs monitoring automation
- full Elementor capability registry
- full control-level registry
- signed validation output system
- downstream EV4 consumer enforcement
- runtime monitor enforcement
- Builder execution proof
- production readiness proof
```

Schema-valid is not runtime-valid. Source-backed is not project-available. Decision-card-valid is not Builder-executed. Consumption-boundary-valid is not downstream-enforced. Evidence-workspace-valid is not production-ready.
