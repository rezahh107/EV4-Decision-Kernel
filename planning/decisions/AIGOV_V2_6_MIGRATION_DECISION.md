# AIGOV v2.6 Migration Decision

## Decision

The owner directs an explicit versioned transition from the unexecuted AIGOV v2.5 Recovery tasks to `AIGOV v2.6.0`.

- `KREC-001` is preserved and remains formally incomplete because authoritative `Validate Main` push-run evidence for `4fe332847e6867fc6aa4639a94a88b8177d31970` could not be queried through the available Actions surface.
- `KREC-002` through `KREC-009` are superseded before execution.
- Their original titles, dependencies, and historical v2.5 definitions remain intact.
- Their effective execution eligibility is revoked by the transition overlay.
- `AIGOV-2.6-REPOSITORY-MIGRATION-PROGRAM` is registered but not started.
- Bundle activation status is not repository adoption.

## KREC-001 Evidence Boundary

```yaml
blocker_id: KREC-001-CURRENT-MAIN-EVIDENCE-ACCESS
status: evidence_query_unavailable
absence_claimed: false
required_query:
  workflow: Validate Main
  event: push
  head_sha: 4fe332847e6867fc6aa4639a94a88b8177d31970
effect:
  KREC_001_formal_completion: pending
  AIGOV26_execution_activation: blocked
```

Live GitHub confirms PR #52 merged with reviewed Head `117a6f072c6c0a6a3487a4520e8f6f0623618769` into `4fe332847e6867fc6aa4639a94a88b8177d31970` by `rezahh107` using a merge commit. The unavailable current-main Actions query is not converted into an absence claim.

## Non-claims

```yaml
AIGOV_v2.6_repository_adopted: false
AIGOV26_implementation_started: false
coverage_credit: false
readiness_claim: false
policy_adoption_claim: false
product_effect: none
deployment_effect: none
external_repository_effect: none
```
