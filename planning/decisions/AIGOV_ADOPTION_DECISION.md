# AIGOV Adoption Decision

## Classification

```yaml
record_kind: governance_adoption_decision
record_status: approved_frozen_plan
plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2
plan_version: 2
standard_id: AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT
standard_version: 1.1.0
target_repository: rezahh107/EV4-Decision-Kernel
audit_base_branch: main
audit_base_sha: 5ff5d7b20db11af36ab787eb8ac2d1127ea74644
owner_approval_source: explicit_owner_authorization_without_timestamp
repository_adoption_status: blocked_open_enforcement_gaps
active_batch: BATCH_A
current_increment_set: AIGOV-ADOPT-000_through_AIGOV-ADOPT-007
merge_authority: owner_only
maximum_implementation_prs: 2
maximum_active_prs: 1
```

## Decision

The owner superseded only the serial execution shape of V1 and approved the frozen two-batch governance adoption plan identified above. The semantic obligations remain the same. Implementation is limited to these ordered batches:

1. `BATCH_A` — reconcile `AIGOV-ADOPT-000` after PR #48 and implement `AIGOV-ADOPT-001` through `AIGOV-ADOPT-007` as one exact-head-reviewed enforcement unit;
2. `BATCH_B` — implement `AIGOV-ADOPT-008` exact-main closure and register the distinct, non-active recovery execution program.

`BATCH_B` starts only after the owner merges `BATCH_A`, its exact-main receipt is Green and no Batch A implementation PR remains active. One implementation PR is active at a time. Neither Batch may self-review, self-merge or infer completion from Merge alone.

## Authorization Boundary

This decision authorizes, inside the exact increment scope:

- branch creation;
- repository file changes;
- commits and push;
- focused draft PR creation;
- validation and bounded repair;
- fresh independent AI review where required.

This decision does not authorize:

- Merge or auto-merge;
- deployment, publication or release;
- destructive or irreversible operations;
- secret, permission or repository-ruleset changes;
- external repository modification;
- material expansion of the frozen plan;
- implementation of `KROAD-012`, `KROAD-012R`, any `KREC-*` task or any DCOV content-expansion package.

The user performs Merge only as an administrative action after the required technical gates are satisfied. No human technical approval is introduced by this decision.

## Roadmap Preservation

- `planning/NEXT_WORK.md` remains the only mutable current-status dashboard.
- `planning/KERNEL_EXECUTION_PLAN.md` retains durable product-roadmap meaning and acceptance criteria.
- `KROAD-012` remains the next product task, temporarily blocked by the higher-priority governance adoption sequence.
- `KROAD-013` through `KROAD-018`, `KROAD-012R` history and all `DCOV-EXEC-*` mappings remain preserved.
- The Coverage proposal remains non-executable and cannot approve itself.

## Change Control

Any material change to the Batch objectives, dependency graph, security profile, external-repository boundary, destructive boundary, two-PR limit or Merge authority requires a new plan version and explicit owner approval.
