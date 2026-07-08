# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation with schema diagnostic repair  
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schema contracts, evidence vocabulary, hard gates, fixtures, and validator-pack shape for EV4. It does not choose section-specific Elementor designs.

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
Kernel: owns shared IDs, schemas, evidence vocabulary, hard gates, fixtures, and validation-pack shape.
```

## Prompt 2.5 MVK Validation Repair

The Kernel-local MVK package now executes JSON Schema Draft 2020-12 conformance validation and semantic validation for the mapped fixture plan. Invalid fixtures must fail with expected diagnostic codes, not merely fail for any reason.

Install dependencies and run:

```bash
npm install
npm run validate:mvk
```

Expected local result:

```text
MVK validator summary
Registries: PASS
Schema setup: PASS (8/8 schemas compiled)
Schema validation: PASS (executed 16/16; valid fixtures schema-clean 5/5)
Valid fixtures passed schema + semantic validation: 5/5
Invalid fixtures failed with expected diagnostics: 11/11
Expected diagnostic assertions: PASS (11/11)
Result: PASS
```

The repository-local workflow at `.github/workflows/validate-mvk.yml` installs the pinned MVK validator dependencies and runs `npm run validate:mvk` on PRs and pushes to `main`.

## Not Included

```text
- GitHub Release automation
- reusable workflows
- docs monitoring automation
- migration framework
- full Elementor capability registry
- full control-level registry
- signed validation output system
- Element Decision Cards
- source manifest expansion
- changes to other EV4 repositories
- downstream EV4 consumer enforcement
```

Schema-valid is not runtime-valid. CI must be checked on the PR before claiming `ci_enforced` status, and downstream enforcement must not be claimed until an actual downstream consumer rejects invalid carriers.
