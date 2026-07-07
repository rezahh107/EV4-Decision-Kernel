# EV4 Decision Kernel

**Status:** working-reference / Kernel-local MVK foundation  
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
Kernel: owns shared IDs, schemas, evidence vocabulary, hard gates, fixtures, and validator-pack shape.
```

## Prompt 2 MVK Foundation

This patch adds Kernel-local MVK registries, schemas, rule definitions, valid/invalid fixtures, and a dependency-free local validator under `kernel/`.

Run:

```bash
npm run validate:mvk
```

Expected local result:

```text
MVK validator summary
Registries: PASS
Valid fixtures passed: 4/4
Invalid fixtures failed as expected: 9/9
Result: PASS
```

The PR also adds a repository-local workflow at `.github/workflows/validate-mvk.yml` to run the same command on PRs and pushes to `main`.

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
```

Schema-valid is not runtime-valid. CI must be checked on the PR before claiming `ci_enforced` status.
