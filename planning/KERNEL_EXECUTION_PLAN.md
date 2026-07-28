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

## Recovery Execution Program Overlay — Transitioned

- **Program ID:** `DCOV-COVERAGE-EXECUTION-PROGRAM`
- **Historical carrier status:** `active`
- **Current-status authority:** `planning/NEXT_WORK.md`
- **Durable operating-map authority:** this section.
- **Effective KREC execution authority:** `planning/recovery/recovery-execution-program.v1.json#/transition` (`program_transition`).
- **KREC-001:** formally `complete` with preserved PR #52 completion evidence.
- **KREC-002 through KREC-009:** `superseded_before_execution`; historical definitions preserved.
- **Substantive AIGOV26 implementation in the transition repair:** none.
- **Coverage promotion effect:** `none`.
- **Coverage credit or percentage effect:** `none`.
- **Readiness or production-readiness effect:** `none`.
- **Product effect:** `none`.
- **Deployment effect:** `none`.
- **External-repository effect:** `none`.
- **KROAD supersession effect:** `none`.

The original Recovery activation is retained as historical evidence, but it no longer grants current execution authority to KREC-002 through KREC-009. For those superseded tasks, the legacy compatibility projection is `implementation_authorized: false` and the effective ledger eligibility is `superseded`. Supersession has precedence over dependency completion; a complete dependency can never turn a superseded task into `dependency_ready`.

### Recovery task graph and effective disposition

| Task | Title | Historical depends on | Historical carrier | Effective execution |
|---|---|---|---|---|
| `KREC-001` | Recovery Ledger | none | `active`, `implementation_authorized: true` | `complete`; no re-execution implied |
| `KREC-002` | Current Source Verification | `KREC-001` | `active`, `implementation_authorized: false` | `superseded` |
| `KREC-003` | Element Reconciliation | `KREC-001`, `KREC-002` | `active`, `implementation_authorized: false` | `superseded` |
| `KREC-004` | Decision Demand Corpus | `KREC-001` | `active`, `implementation_authorized: false` | `superseded` |
| `KREC-005` | Canonical Registry Foundation | `KREC-002`, `KREC-003`, `KREC-004` | `active`, `implementation_authorized: false` | `superseded` |
| `KREC-006` | Decision Question Catalog | `KREC-003`, `KREC-004`, `KREC-005` | `active`, `implementation_authorized: false` | `superseded` |
| `KREC-007` | P0 Resolver Expansion | `KREC-005`, `KREC-006` | `active`, `implementation_authorized: false` | `superseded` |
| `KREC-008` | Consumer Enforcement Expansion | `KREC-002`, `KREC-007` | `active`, `implementation_authorized: false` | `superseded` |
| `KREC-009` | Coverage Baseline | `KREC-003`, `KREC-006`, `KREC-007`, `KREC-008` | `active`, `implementation_authorized: false` | `superseded` |

### Recovery lifecycle evidence contract

`planning/recovery/recovery-ledger.v1.json` remains the canonical lifecycle and evidence ledger. It consumes task identity, titles, dependencies and historical carrier status from `planning/recovery/recovery-execution-program.v1.json`; it does not create a competing execution authority. During the AIGOV v2.6 transition, its `transition_disposition` values and legacy fields are projections of the Program transition authority.

Historical candidate and completion evidence remain immutable. KREC-001 completion evidence remains bound to PR #52 and its exact historical CI/current-main receipts. KREC-002 through KREC-009 retain no implementation, completion, Coverage or readiness credit.

### AIGOV v2.6 successor boundary

`AIGOV26-001` is the only successor task initially `dependency_ready`. `AIGOV26-002` through `AIGOV26-008` remain `dependency_blocked`. Repository adoption remains `planned_not_adopted`, and this transition does not activate or implement AIGOV v2.6.

### Preserved roadmap boundaries

- `KROAD-000` through `KROAD-011` remain completed as recorded in the preserved baseline.
- `KROAD-012` remains not superseded and available as the preserved next product task.
- `KROAD-013` through `KROAD-018` remain `not_started`.
- `KROAD-012R` remains `historical_non_authoritative`.
- Recovery/AIGOV transition authority cannot satisfy `independent_review_passed` or any other external Coverage-promotion predicate.

## Preserved detailed roadmap

All task purpose, dependency, output, acceptance, evidence, and anti-overclaim definitions remain authoritative in `planning/KERNEL_EXECUTION_PLAN_KROAD_BASELINE.md`. Future changes must update this operating map and the preserved detailed roadmap coherently; no task may be marked complete from this overlay alone.
