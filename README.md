# EV4 Decision Kernel

**Status:** AIGOV V4 Batch B closed; Recovery Program active  
**Owner:** `rezahh107/EV4-Decision-Kernel`

## Purpose

`EV4 Decision Kernel` owns shared IDs, schemas, evidence vocabulary, source manifests, decision-governance contracts, behavioral coverage rules, recovery lifecycle validation and hard gates for EV4.

```text
Documented capability != enabled project capability != constructability proven != Builder executed != Responsive validated != production ready
```

## AIGOV status

The active plan is `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4`.

PR #50 was merged from exact head `e5c0c342d6417c8e85be54e7cb4caf372a116a35` at `435add8ee3f3274f781b6e391f11e3262e380c4e`. Mandatory independent pre-Merge review has been removed by explicit repository-owner policy. Advisory review remains optional and non-blocking.

The mandatory sequence is:

```text
exact base -> declared scope -> exact-head CI Green -> owner-only Merge
-> method-aware Merge-result proof -> current-main validation Green
```

## Recovery Program

`DCOV-COVERAGE-EXECUTION-PROGRAM` is active. `KREC-001` through `KREC-009` are authorized but not implemented.

- `KREC-001` is immediately executable.
- `KREC-002` through `KREC-009` remain dependency-blocked until their declared predecessors are complete.
- Coverage promotion, Coverage credit, readiness, product effects and KROAD supersession remain `none` or `false`.

See:

```text
planning/NEXT_WORK.md
planning/recovery/recovery-execution-program.v1.json
planning/reviews/RECOVERY_PROGRAM_ACTIVATION.md
planning/decisions/AIGOV_INDEPENDENT_REVIEW_POLICY_CHANGE.md
```
