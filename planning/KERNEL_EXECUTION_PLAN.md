# EV4 Decision Kernel — Execution Plan

## Purpose and authority

This file is the durable operating map for `rezahh107/EV4-Decision-Kernel`. `planning/NEXT_WORK.md` remains the current-status authority. The complete pre-activation KROAD definitions are preserved byte-for-byte in `planning/KERNEL_EXECUTION_PLAN_KROAD_BASELINE.md`; this file records the active overlays and their relationship to that preserved roadmap.

# Coverage Guarantee Proposal Overlay — Non-Executable

- **Status:** proposed
- **Authority:** blocked pending an external project-owner governance carrier satisfying every trusted-base promotion predicate, including `independent_review_passed`.
- **Current executable Coverage package:** none.
- **Next allowed item:** KROAD-012.
- **Roadmap effect:** none.

Merge metadata, CI success, advisory pre-Merge review, repository placement, PR text, and target-authored closure cannot promote Coverage or create proof credit.

## Proposed Unified Coverage Execution Program — Non-Executable

- **Status:** proposed.
- **Authority:** none until every external Coverage-promotion predicate is independently satisfied.
- **Coverage credit:** none.
- **Percentage or readiness effect:** none.
- **KROAD supersession effect:** none.

The historical `DCOV-EXEC-001` through `DCOV-EXEC-005` decomposition remains proposal context only. It does not replace, reorder, or supersede KROAD-012 through KROAD-018.

## Recovery Execution Program Overlay — Active

- **Program ID:** `DCOV-COVERAGE-EXECUTION-PROGRAM`
- **Status:** `active`
- **Current-status authority:** `planning/NEXT_WORK.md`
- **Durable operating-map authority:** this section.
- **Activation semantics:** all nine KREC tasks are authorized simultaneously, while execution and completion remain dependency-aware.
- **Substantive implementation in the activation PR:** none.
- **Coverage promotion effect:** `none`.
- **Coverage credit or percentage effect:** `none`.
- **Readiness or production-readiness effect:** `none`.
- **Product effect:** `none`.
- **External-repository effect:** `none`.
- **KROAD supersession effect:** `none`.

Authorization does not erase sequencing. A task may start only when every dependency is `complete`; it may become `implemented` or `complete` only after its own substantive artifacts and validation evidence exist. This activation PR changes authorization and lifecycle state only.

### Recovery task graph

| Task | Title | Depends on | Authorization | Execution availability |
|---|---|---|---|---|
| `KREC-001` | Recovery Ledger | none | `active`, `implementation_authorized: true` | `immediately_executable` |
| `KREC-002` | Current Source Verification | `KREC-001` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-001` |
| `KREC-003` | Element Reconciliation | `KREC-001`, `KREC-002` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-001, KREC-002` |
| `KREC-004` | Decision Demand Corpus | `KREC-001` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-001` |
| `KREC-005` | Canonical Registry Foundation | `KREC-002`, `KREC-003`, `KREC-004` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-002, KREC-003, KREC-004` |
| `KREC-006` | Decision Question Catalog | `KREC-003`, `KREC-004`, `KREC-005` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-003, KREC-004, KREC-005` |
| `KREC-007` | P0 Resolver Expansion | `KREC-005`, `KREC-006` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-005, KREC-006` |
| `KREC-008` | Consumer Enforcement Expansion | `KREC-002`, `KREC-007` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-002, KREC-007` |
| `KREC-009` | Coverage Baseline | `KREC-003`, `KREC-006`, `KREC-007`, `KREC-008` | `active`, `implementation_authorized: true` | `dependency_blocked: KREC-003, KREC-006, KREC-007, KREC-008` |

### Recovery lifecycle evidence contract

`planning/recovery/recovery-ledger.v1.json` is the canonical machine-readable lifecycle and evidence ledger for this program. It consumes task identity, titles, dependencies, carrier status and authorization from `planning/recovery/recovery-execution-program.v1.json`; it does not replace that carrier or create a competing task universe.

The ledger distinguishes `not_started`, `in_progress`, `checks_pending` and `complete`. Branch creation, prompt delivery, an open PR and exact-head CI are candidate evidence only. A `complete` entry requires exact reviewed-head CI, owner Merge identity, method-aware resulting-main identity and successful current-main validation. Only `complete` dependencies affect execution eligibility. Accepted completion evidence is immutable in later revisions.

### Preserved roadmap boundaries

- `KROAD-000` through `KROAD-011` remain completed as recorded in the preserved baseline.
- `KROAD-012` remains not superseded and available as the preserved next product task.
- `KROAD-013` through `KROAD-018` remain `not_started`.
- `KROAD-012R` remains `historical_non_authoritative`.
- The active Recovery Program is distinct from the non-executable Coverage proposal. Recovery authorization cannot satisfy `independent_review_passed` or any other external Coverage-promotion predicate.

## Preserved detailed roadmap

All task purpose, dependency, output, acceptance, evidence, and anti-overclaim definitions remain authoritative in `planning/KERNEL_EXECUTION_PLAN_KROAD_BASELINE.md`. Future changes must update this operating map and the preserved detailed roadmap coherently; no task may be marked complete from this overlay alone.
