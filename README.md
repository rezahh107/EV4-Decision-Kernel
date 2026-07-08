# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation with source manifest and decision-card layer  
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schema contracts, evidence vocabulary, hard gates, source manifests, decision cards, fixtures, and validator-pack shape for EV4. It does not choose section-specific Elementor designs.

```text
Documented Elementor capability != enabled project capability != constructability proven != Builder executed != Responsive validated != production ready
```

## Role Boundary

```text
Architect: owns decision records and selected design choices.
CE: owns constructability proof and decision closure.
Builder: resolves and executes only locked decisions.
Responsive: validates runtime behavior.
Project Gate: verifies lineage, hash, evidence completeness, schema validity, and stage authority. It must not make Elementor design decisions.
Kernel: owns shared IDs, schemas, evidence vocabulary, source manifests, decision cards, hard gates, fixtures, and validation-pack shape.
```

## Prompt 3 Source Manifest and Decision Cards

The Kernel-local MVK package now includes:

```text
- official Elementor source manifest
- evidence labels
- core element decision cards
- source/card JSON Schemas
- valid and invalid source/card fixtures
- validator-backed source/card integrity checks
```

Install locked dependencies and run:

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
```

`npm run validate:mvk` runs the repaired Prompt 2.5 validator first, then the Prompt 3 source/card validator. Expected source/card portion:

```text
Source/card validator summary
Schema setup: PASS (2/2 schemas compiled)
Source/card integrity: PASS
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
Kernel = structured decision extraction, source refs, labels, limitations, schemas, fixtures, and validator checks.
Workbook = educational/derived seed only, not official authority.
Official docs prove platform capability, not target project availability.
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

Schema-valid is not runtime-valid. Source-backed is not project-available. Decision-card-valid is not Builder-executed.
