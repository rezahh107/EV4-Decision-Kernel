# AIGOV Exact-Main Closure Protocol

**Status:** active verification protocol; not a closure receipt
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`

## Rule

Neither a PR head, successful CI, target-authored record, independent review, nor Merge metadata alone establishes completion. Completion is derived only by `tools/verify-aigov-exact-main.mjs` on the current default-branch checkout after an owner Merge.

## Batch A

Batch A remains incomplete until the verifier confirms ancestry, exact current `main`, preserved SSOT identity, Green local gates, owner-only Merge metadata supplied as external evidence, preserved KROAD memory, historical `KROAD-012R`, and non-promoted Coverage state. The workflow artifact name is:

```text
aigov-batch-a-exact-main-<sha>.json
```

## Batch B

Final adoption remains pending until the valid Batch A receipt, Batch B exact-head validation, independent exact-head review, owner Merge, and final exact-main matrix are all present. The final artifact name is:

```text
aigov-final-exact-main-<sha>.json
```

Generated workflow artifacts are evidence outputs; no post-merge repository commit or third implementation PR is authorized merely to store them.
