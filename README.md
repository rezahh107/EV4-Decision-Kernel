# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation with source manifest, doc coverage index, decision-card layer, Architect/CE consumption boundaries, external evidence workspace contracts, decision-governance foundation, Behavioral Rule Coverage v0.4.1, and pending V4 AIGOV Batch B closure
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schema contracts, evidence vocabulary, hard gates, source manifests, Elementor V4 documentation coverage boundaries, decision-domain taxonomy, execution-risk boundaries, decision cards, consumption-boundary fixtures, evidence workspace contracts, behavioral coverage governance, and validator-pack shape for EV4. It does not choose section-specific Elementor designs and does not collect external evidence itself.

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

## Decision Governance Foundation

This repository also defines a Kernel-local taxonomy and execution-risk boundary foundation in:

```text
kernel/decision-governance/decision-domain-taxonomy.v0.json
kernel/decision-governance/p0-decision-family-registry.v0.json
kernel/decision-governance/source-tier-boundaries.v0.json
kernel/decision-governance/capability-dependency-gate.v0.json
kernel/decision-governance/atomic-export-boundary.v0.json
kernel/decision-governance/execution-risk-domain-registry.v0.json
kernel/validator/validate-decision-governance-foundation.mjs
```

This foundation distinguishes decision families, evidence domains, safety gates, source-boundary rules, capability-proof rules, and execution-risk controls. It is not a full matrix implementation, full Elementor feature registry, or full control-level registry.

## Decision Coverage Recovery Memory

The proposed recovery specification and bounded operationalization map are maintained in:

```text
docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md
planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md
```

They distinguish the long-term product objective from the deliberately small MVK vertical slice. Their authority remains proposed and non-executable pending external governance promotion. They activate no new decision family, Registry, Resolver Rule, producer integration, metric or readiness claim.

The separate `DCOV-COVERAGE-EXECUTION-PROGRAM` is registered in `planning/recovery/recovery-execution-program.v1.json`. `KREC-001` through `KREC-009` are `registered_planned_task` only: registration does not authorize implementation, activate product work, supersede KROAD items, promote Coverage, grant Coverage credit or establish readiness.

## AIGOV V4 Batch B

The active plan is `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4`, based on exact audited `main` SHA `86e25a9073df7e257ca7df799de85baf9b3fafb0`.

V4 corrects only the invalid strict-ancestry predicate for the exact GitHub Squash Merge of PR #49. Live Git object verification proved exact tree equality between final head `c141923bf411f802f1673acf06dc92a77b415593` and squash commit `86e25a9073df7e257ca7df799de85baf9b3fafb0`; both trees are `8a8c83aee95ab36ab59ba128c7710bafedaa2d20`. The exception is non-reusable and non-precedential, and no historical independent Green review is claimed.

Draft PR #50 contains `AIGOV-ADOPT-008`, method-aware exact-main verification, adversarial tests, exact Batch B scope disclosure and registration-only recovery-program validation. A PR head does not establish final repository adoption or Merge authority.

The Batch B sequence remains mandatory:

```text
exact final head -> exact-head CI Green -> independent PR-Inspector Green on exact head and scope -> owner-only Merge -> method-aware deterministic Merge-result proof -> current-main validation
```

No second independent review after Merge is required. Coverage promotion, product implementation, external repository modification, deployment and release remain out of scope.

## Role Boundary

```text
Architect: owns decision records and selected design choices. Source/card/evidence workspace consumption is candidate guidance, not final proof.
CE: owns constructability proof and decision closure. Evidence packages may support claims only within their inspected scope.
Builder: resolves and executes only locked decisions.
Responsive: validates runtime behavior.
Project Gate: verifies lineage, hash, evidence completeness, schema validity, and stage authority. It must not make Elementor design decisions.
Kernel: owns shared IDs, schemas, evidence vocabulary, source manifests, doc coverage index, decision-governance taxonomy, execution-risk boundaries, decision cards, consumption-boundary contracts, evidence workspace contracts, behavioral coverage governance, hard gates, fixtures, and validation-pack shape.
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
git diff --check
node --check tools/verify-aigov-exact-main.mjs
node --check tools/verify-aigov-v3-exact-main.mjs
node --check kernel/validator/validate-recovery-execution-program.mjs
node --check tools/validate-roadmap-memory.mjs
node --check tools/validate-roadmap-memory-v3.mjs
npm run validate:aigov
npm run test:aigov-fixtures
npm run test:aigov-sequence
npm run test:aigov-v3-exception
npm run validate:aigov-v4-batch-a-reconciliation
npm run validate:recovery-program
npm run validate:behavioral-coverage:aigov
npm run validate:roadmap-memory
npm run validate:coverage
npm run validate:mvk
```

The live V4 reconciliation command requires GitHub API access and accepts only exact Git tree equality for the PR #49 Squash Merge exception. Other validators check that Coverage, KROAD and registration-only boundaries remain unchanged.

## Not Included

```text
- full Elementor documentation mirror
- full Elementor feature registry
- full control-level registry
- external exporter implementation
- browser/runtime collector implementation
- new Project Gate implementation
- downstream EV4 consumer enforcement expansion
- runtime monitor enforcement
- KREC task implementation
- KROAD-012 product implementation
- Coverage promotion or percentage claims
- Builder execution proof
- production readiness proof
```

Schema-valid is not runtime-valid. Source-backed is not project-available. Decision-card-valid is not Builder-executed. Doc-coverage-valid is not production-ready. Decision-governance-valid is not constructability proof.
