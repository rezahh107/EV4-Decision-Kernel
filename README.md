# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation with source manifest, doc coverage index, decision-card layer, Architect/CE consumption boundaries, external evidence workspace contracts, and Behavioral Rule Coverage v0.4.1 advisory audit model  
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schema contracts, evidence vocabulary, hard gates, source manifests, Elementor V4 documentation coverage boundaries, decision cards, consumption-boundary fixtures, evidence workspace contracts, behavioral coverage governance, and validator-pack shape for EV4. It does not choose section-specific Elementor designs and does not collect external evidence itself.

```text
Documented Elementor capability != enabled project capability != constructability proven != Builder executed != Responsive validated != production ready
```

## Elementor V4 Documentation Coverage

This repository tracks important official Elementor V4 documentation areas in:

```text
kernel/official-sources/elementor-v4-source-manifest.v0.json
kernel/official-sources/elementor-v4-doc-coverage-index.v0.json
kernel/official-sources/evidence-labels.v0.json
kernel/validator/validate-elementor-doc-coverage.mjs
```

The coverage index is not a full documentation mirror. It prevents important V4 context areas from being silently omitted. Non-core documentation areas may be context sources with explicit `no_decision_card_reason` instead of decision cards.

## Role Boundary

```text
Architect: owns decision records and selected design choices. Source/card/evidence workspace consumption is candidate guidance, not final proof.
CE: owns constructability proof and decision closure. Evidence packages may support claims only within their inspected scope.
Builder: resolves and executes only locked decisions.
Responsive: validates runtime behavior.
Project Gate: verifies lineage, hash, evidence completeness, schema validity, and stage authority. It must not make Elementor design decisions.
Kernel: owns shared IDs, schemas, evidence vocabulary, source manifests, doc coverage index, decision cards, consumption-boundary contracts, evidence workspace contracts, behavioral coverage governance, hard gates, fixtures, and validation-pack shape.
```

## Evidence Boundary

```text
Elementor docs = upstream source of truth for documented platform/editor capability.
Coverage index = representation and limitation tracking only.
Workbook = educational/helper seed only, not official authority.
Official docs prove platform capability, not target project availability.
Project availability requires future WordPress/EDIS project evidence.
Runtime proof requires future Browser Runtime evidence.
Builder execution requires future Builder evidence.
Downstream enforcement requires inspected downstream rejection evidence.
```

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

`npm run validate:mvk` runs the MVK validator, source/card validator, consumption-boundary validator, evidence-workspace validator, and Elementor V4 doc coverage validator.

## Not Included

```text
- full Elementor documentation mirror
- full control-level registry
- external exporter implementation
- browser/runtime collector implementation
- Project Gate intake
- downstream EV4 consumer enforcement
- runtime monitor enforcement
- Builder execution proof
- production readiness proof
```

Schema-valid is not runtime-valid. Source-backed is not project-available. Decision-card-valid is not Builder-executed. Doc-coverage-valid is not production-ready.
