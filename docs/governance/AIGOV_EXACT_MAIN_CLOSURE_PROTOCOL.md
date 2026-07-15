# AIGOV Exact-Main Closure Protocol

**Status:** active verification protocol; not a closure receipt
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`

## Rule

Neither a PR head, successful CI, target-authored record, caller-supplied actor, schema-valid lookalike, independent review, nor Merge metadata alone establishes completion. Completion is derived only by `tools/verify-aigov-exact-main.mjs` on the current default-branch checkout after an owner Merge.

The verifier accepts no `--merge-actor`, `--expected-sha`, local receipt boolean, or caller-authored GitHub payload. It fetches the target repository, PR #49, current `main`, PR author, `merged_by`, base, reviewed head and merge commit from the public GitHub REST API. The checkout remote, local HEAD, API current-main identity and reviewed-head ancestry must agree.

The review input is an immutable external source tuple: exact `rezahh107/PR-Inspector` commit plus a receipt path under the exact target head and `scope_revision`. The verifier fetches the receipt, active protocol metadata, trust policy, review package, decision projection and artifact manifest from that commit; validates schemas before semantic fields; recomputes file hashes; verifies Git blob SHAs; and rejects target-repository or local receipt lookalikes. The active compatibility source is `PR-Inspector@v1.10.1`, repository ID `1288323264`.

## Batch A

Batch A remains incomplete until the verifier confirms ancestry, exact current `main`, preserved SSOT identity, Green local gates invoked with the exact fetched review receipt, API-derived owner Merge evidence, a complete lifecycle ledger, preserved KROAD memory, historical `KROAD-012R`, and non-promoted Coverage state. The workflow artifact name is:

```text
aigov-batch-a-exact-main-<sha>.json
```

## Batch B

Final adoption remains pending until the valid Batch A receipt, Batch B exact-head validation, independent exact-head review, owner Merge, and final exact-main matrix are all present. The final artifact name is:

```text
aigov-final-exact-main-<sha>.json
```

Generated workflow artifacts are evidence outputs; no post-merge repository commit or third implementation PR is authorized merely to store them.

## Lifecycle and replay boundary

`aigov-lifecycle-ledger.v1` is the sequence carrier. Exact-head CI materializes the first five events through `exact_head_validated`; the exact-main verifier appends only API-verified `independent_review_green`, `owner_merge` and `exact_main_verified` events. Duplicate IDs, replayed evidence hashes, missing predecessors, out-of-order events, foreign repository/PR/head/scope identities and unverified external evidence fail closed.

## Current limitation

Repository ruleset and branch-protection enforcement are not claimed. The exact-main command cannot succeed until the fresh independent review bundle is published immutably by PR Inspector and the owner has merged the exact reviewed head.
