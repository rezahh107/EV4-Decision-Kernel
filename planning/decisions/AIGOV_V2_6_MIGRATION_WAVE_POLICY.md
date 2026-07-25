# AIGOV v2.6 Migration Wave Policy

## Wave Model

| Wave | Tasks | Required internal order |
|---|---|---|
| Foundation | `AIGOV26-001`, `AIGOV26-002` | `001 → 002` |
| Issuance and enforcement | `AIGOV26-003` through `AIGOV26-006` | `003 → 004 → 005 → 006` |
| Activation | `AIGOV26-007`, `AIGOV26-008` | `007 → 008` |

```yaml
preparation:
  same_wave_parallelism: allowed_when_safe
implementation:
  internal_topological_order_required: true
authoritative_completion:
  dependency_gated: true
  owner_merge_required: true
  exact_head_validation_required: true
  current_main_validation_required: true
```

## Required Controls

Each implementation package must use exact current-main base, bounded scope, focused validation during implementation, full exact-head validation at its final Head, stale-CI invalidation after Head changes, owner-only Merge, and successful current-main validation. Reproducible defects are blocking and must be repaired.

## Explicitly Not Universal Gates

The program does not require one PR per task, a full suite after every micro-commit, independent review as a universal blocking gate, fresh re-review after every commit, PR Inspector disposition as a universal Merge gate, or resolution of non-reproducible advisory comments.

## Transition Gate

`KREC-001` formal completion is satisfied by PR #52, exact-head `Validate MVK` run `29741545637`, owner Merge commit `4fe332847e6867fc6aa4639a94a88b8177d31970`, and current-main `Validate Main` run `29742820512`.

Only `AIGOV26-001` is dependency-ready. `AIGOV26-002` through `AIGOV26-008` remain dependency-blocked. This transition PR does not implement `AIGOV26-001`.
