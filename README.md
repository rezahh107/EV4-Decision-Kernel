# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation with source manifest, decision-card layer, and Architect/CE consumption boundaries  
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schema contracts, evidence vocabulary, hard gates, source manifests, decision cards, consumption-boundary fixtures, and validator-pack shape for EV4. It does not choose section-specific Elementor designs.

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
Kernel: owns shared IDs, schemas, evidence vocabulary, source manifests, decision cards, consumption-boundary contracts, hard gates, fixtures, and validation-pack shape.
```

## Prompt 4 Consumption Boundaries

The Kernel-local MVK package now includes:

```text
- official Elementor source manifest
- evidence labels
- core element decision cards
- source/card JSON Schemas
- Architect source/card consumption schema
- CE source/card consumption schema
- valid and invalid consumption-boundary fixtures
- validator-backed source/card consumption checks
```

Install locked dependencies and run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
```

`npm run validate:mvk` runs the repaired Prompt 2.5 validator, then the Prompt 3 source/card validator, then the Prompt 4 consumption-boundary validator. Expected Prompt 4 portion:

```text
Source/card consumption-boundary validator summary
Schema setup: PASS (2/2 schemas compiled)
Consumption registry load: PASS (8 cards; 16 sources)
Schema validation: PASS (executed 12/12; valid fixtures schema-clean 4/4)
Valid fixtures passed schema + semantic validation: 4/4
Invalid fixtures failed with expected diagnostics: 8/8
Expected diagnostic assertions: PASS (8/8)
Result: PASS
```

The repository-local workflow at `.github/workflows/validate-mvk.yml` installs locked MVK validator dependencies with `npm ci` and runs `npm run validate:mvk` on PRs and pushes to `main`. CI status must still be observed on the PR before claiming `ci_enforced`.

## Evidence Boundary

```text
Elementor docs = upstream source of truth.
Kernel = structured decision extraction, source refs, labels, limitations, schemas, fixtures, validator checks, and consumption-boundary contracts.
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

Schema-valid is not runtime-valid. Source-backed is not project-available. Decision-card-valid is not Builder-executed. Consumption-boundary-valid is not downstream-enforced.
