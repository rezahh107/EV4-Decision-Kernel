# EV4 Decision Coverage — Unified Execution Map

## Status

- `status`: `approved_parent_execution_program`
- `contract`: `kernel/decision-governance/coverage-guarantee-contract.v1.json`
- `parent_authority`: `approved_recovery_source_of_record`
- `promotion_status`: `approved`
- `current_work_package`: `DCOV-EXEC-001 evidence_closed`
- `only_next_executable_after_merge`: `DCOV-EXEC-002`
- `next_work_type`: `content_expansion`
- `package_count`: `5`

PR #41 merged the recovery context at `487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8`. PR #43 merged DCOV-EXEC-001 with final head `2710931b51941295f9ae6a1ed849fc0fbf3a7004`, merge commit `3e4adb453adc547fefaad19670698add67cad79f`, current verified `main` `44db96ac911ce8796c3dd3ed1c07d9fbbdb81333`, and merge timestamp `2026-07-14T13:22:00Z`. The one-time external project-owner approval has been supplied, the parent promotion gate is satisfied, and DCOV-EXEC-002 is the next executable package. Child packages do not require repeated project-owner approval, but each still requires dependency checks, implementation evidence, CI, exact-head validation, review and normal merge gates.

## Machine-readable dependency map

```yaml
program_id: DCOV-COVERAGE-EXECUTION-PROGRAM
contract_version: 1.0.0
packages:
  - work_package_id: DCOV-EXEC-001
    work_type: foundation_with_real_data
    depends_on:
      - PR-41-merged
    obligation_ids:
      - OB-EXEC-001-CONTRACT
      - OB-EXEC-001-LEDGER
      - OB-EXEC-001-CATALOG
      - OB-EXEC-001-BASELINE-DEBT
      - OB-EXEC-001-VALIDATOR-FIXTURES
      - OB-EXEC-001-CI
      - OB-EXEC-001-ROADMAP
    state_after: evidence_closed
  - work_package_id: DCOV-EXEC-002
    work_type: content_expansion
    depends_on:
      - DCOV-EXEC-001-merged
    obligation_ids:
      - OB-EXEC-002-PRODUCER-BOUNDARY
      - OB-EXEC-002-RECONCILE-ELEMENTS
      - OB-EXEC-002-EXPAND-CATALOG
      - OB-EXEC-002-CLOSE-SELECTED-P0-FAMILY
      - OB-EXEC-002-LAYOUT-BOUNDED-PROOF
  - work_package_id: DCOV-EXEC-003
    work_type: content_expansion
    depends_on:
      - DCOV-EXEC-002-merged
    obligation_ids:
      - OB-EXEC-003-BOUNDED-RUNTIME-EVIDENCE
      - OB-EXEC-003-ADDITIONAL-RESOLVER-CHAINS
      - OB-EXEC-003-PROVISIONAL-REAUDIT
      - OB-EXEC-003-SOURCE-RUNTIME-DISTINCTION
  - work_package_id: DCOV-EXEC-004
    work_type: content_expansion
    depends_on:
      - DCOV-EXEC-003-merged
    obligation_ids:
      - OB-EXEC-004-ADDITIONAL-FAMILIES
      - OB-EXEC-004-REOPEN-VERSION-LIFECYCLE
      - OB-EXEC-004-SEQUENCE-REPLAY
      - OB-EXEC-004-UNAUTHORIZED-UPGRADE-REJECTION
  - work_package_id: DCOV-EXEC-005
    work_type: content_expansion_and_assessment
    depends_on:
      - DCOV-EXEC-004-merged
    obligation_ids:
      - OB-EXEC-005-SOURCE-FRESHNESS
      - OB-EXEC-005-CLOSE-REMAINING-CRITICAL
      - OB-EXEC-005-VALIDATE-DENOMINATORS
      - OB-EXEC-005-COMPUTE-THRESHOLDS
      - OB-EXEC-005-CRITICAL-100
      - OB-EXEC-005-FINAL-ASSESSMENT
```

## DCOV-EXEC-001 — Coverage Guarantee Foundation and Execution Unblock

This Draft PR proposes a candidate v1 contract and human view, source-bound non-empty Ledger and Catalog, proposed baseline, open debt, bootstrap impact, deterministic validator, exact-code fixtures, existing-CI wiring and unified roadmap memory.

Acceptance:

- the full external project-owner governance promotion carrier is verified;
- Ledger and Catalog are non-empty and source-bound;
- denominator candidates are preserved;
- percentages are `null` while denominator state is unresolved;
- valid, invalid and adversarial fixtures pass with intended diagnostics;
- exact-head CI is green before independent inspection;
- state remains `not_measurable_pending_external_promotion` while approval is absent.

Non-goals: Resolver-family expansion, runtime platform, external producer implementation, measurement activation, readiness and Merge.

## DCOV-EXEC-002 — Evidence-Bound Element and Resolver Expansion

This package is the next executable Recovery-program package. KROAD-012 is preserved and aligned with its producer-boundary obligations rather than deleted or silently superseded.

Required content result:

- implement only the external-producer proof boundaries required by selected real content;
- prove producer identity, observation scope, version/hash/lineage and the prohibition on tier promotion or inference;
- reconcile a materially bounded set of real Element records;
- expand explicit source-bound Decision Questions;
- select one materially sized P0 or high-risk Family;
- complete its Matrix → Resolver → Evaluator → Fixture Triplet → L2 chain;
- add bounded runtime or consumer proof only when that Family requires it;
- increase completed obligation count or a measurable numerator.

It must not be a producer-boundary documentation-only PR.

## DCOV-EXEC-003 — Runtime-Evidence Families and Provisional Re-Audit

Add only runtime/browser evidence contracts required by selected real Families, complete more Resolver chains, implement provisional/re-audit behavior for those Families, and prove source/runtime distinction with exact-code fixtures. Do not build a general monitoring platform.

## DCOV-EXEC-004 — Reopen Lifecycle and Cross-Stage Integrity

Complete additional real Families, add bounded reopen/version behavior, implement sequence-aware replay/diff or equivalent enforcement, and reject unauthorized claim upgrades or option changes. Static documentation is not sequence enforcement.

## DCOV-EXEC-005 — Freshness, Remaining Coverage, and Release Assessment

Implement only freshness needed by active Rules, close remaining critical obligations, validate the denominator, derive coverage, enforce 90%/95%/critical-100% criteria and perform final assessment. The assessment cannot manufacture missing coverage.

## Historical KROAD mapping

The IDs and original acceptance intent remain discoverable in `planning/KERNEL_EXECUTION_PLAN.md`. Mapping does not complete them.

| Historical item | Historical execution status | Unified package | Preserved obligation groups |
|---|---|---|---|
| KROAD-012 | `not_started` | DCOV-EXEC-002 | producer identity; declared input/version/hash; observation-only claims; lineage; no tier promotion; invalid/adversarial rejection; bounded consumer/runtime proof |
| KROAD-013 | `not_started` | DCOV-EXEC-003 | browser/runtime evidence schema; viewport/state/direction evidence; saved-source/runtime distinction; runtime limitations |
| KROAD-014 | `not_started` | DCOV-EXEC-003 | provisional triggers; re-audit conditions; evidence upgrade/downgrade; fail-closed status transitions |
| KROAD-015 | `not_started` | DCOV-EXEC-004 | reopen causes; immutable history; version lineage; earliest invalidated dependency |
| KROAD-016 | `not_started` | DCOV-EXEC-004 | cross-turn ordering; replay/diff enforcement; unauthorized option/claim upgrade rejection |
| KROAD-017 | `not_started` | DCOV-EXEC-005 | source freshness; stale-source diagnostics; Rule/source coupling; bounded monitoring |
| KROAD-018 | `not_started` | DCOV-EXEC-005 | validated denominator; computed thresholds; critical hard gate; final assessment only |

## Package progress

```yaml
package_progress:
  work_package_id: DCOV-EXEC-001
  baseline_before: null
  baseline_after: coverage-baseline.v1.0.0
  element_coverage_delta: null
  question_coverage_delta: null
  completed_obligation_ids:
    - OB-EXEC-001-CONTRACT
    - OB-EXEC-001-LEDGER
    - OB-EXEC-001-CATALOG
    - OB-EXEC-001-BASELINE-DEBT
    - OB-EXEC-001-VALIDATOR-FIXTURES
    - OB-EXEC-001-CI
    - OB-EXEC-001-ROADMAP
  remaining_obligation_ids:
    - OB-EXEC-002-PRODUCER-BOUNDARY
    - OB-EXEC-002-RECONCILE-ELEMENTS
    - OB-EXEC-002-EXPAND-CATALOG
    - OB-EXEC-002-CLOSE-SELECTED-P0-FAMILY
    - OB-EXEC-002-LAYOUT-BOUNDED-PROOF
    - OB-EXEC-003-BOUNDED-RUNTIME-EVIDENCE
    - OB-EXEC-003-ADDITIONAL-RESOLVER-CHAINS
    - OB-EXEC-003-PROVISIONAL-REAUDIT
    - OB-EXEC-003-SOURCE-RUNTIME-DISTINCTION
    - OB-EXEC-004-ADDITIONAL-FAMILIES
    - OB-EXEC-004-REOPEN-VERSION-LIFECYCLE
    - OB-EXEC-004-SEQUENCE-REPLAY
    - OB-EXEC-004-UNAUTHORIZED-UPGRADE-REJECTION
    - OB-EXEC-005-SOURCE-FRESHNESS
    - OB-EXEC-005-CLOSE-REMAINING-CRITICAL
    - OB-EXEC-005-VALIDATE-DENOMINATORS
    - OB-EXEC-005-COMPUTE-THRESHOLDS
    - OB-EXEC-005-CRITICAL-100
    - OB-EXEC-005-FINAL-ASSESSMENT
  estimated_program_share_completed: unresolved
  estimation_basis: denominator_unresolved_use_obligation_criticality_dependency_complexity_and_proof_requirements
```

No 20% figure is inferred from files, schemas, validators, commits, PRs or mapped KROAD items.
