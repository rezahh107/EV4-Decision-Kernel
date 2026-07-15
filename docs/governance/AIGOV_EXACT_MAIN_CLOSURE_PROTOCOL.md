# AIGOV Exact-Main Closure Protocol

**Status:** active verification protocol; not a closure receipt
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`

## Rule

Neither a PR head, successful CI, target-authored record, caller-supplied actor, schema-valid lookalike, independent review, nor Merge metadata alone establishes completion. Completion is derived only by `tools/verify-aigov-exact-main.mjs` on the current default-branch checkout after an owner Merge.

The verifier accepts no `--merge-actor`, `--expected-sha`, local receipt boolean, or caller-authored GitHub payload. It fetches the target repository, PR #49, current `main`, PR author, `merged_by`, base, reviewed head and merge commit from the public GitHub REST API. The checkout remote, local HEAD, API current-main identity and reviewed-head ancestry must agree.

The review input is an immutable external source tuple: exact `rezahh107/PR-Inspector` commit plus a receipt path under the exact target head and `scope_revision`. The verifier enumerates the review directory from GitHub rather than trusting receipt declarations. It validates the complete active `v1.10.1` package and projection schemas, reconstructs the canonical projection and every derived artifact byte, verifies prompt routing and the deterministic manifest, recomputes canonical-package/file/projection/manifest/final-byte hashes, verifies Git blob SHAs, and rejects BOM, encoding, newline, path, byte or target-authored lookalike drift. The active compatibility source is `PR-Inspector@v1.10.1`, repository ID `1288323264`.

The verifier separately fetches the completed GitHub Actions run, jobs, check runs and uploaded artifact for the exact PR head. The accepted identity is a `pull_request` head execution, not a synthetic merge ref; every required job must be successful and produced by the GitHub Actions App identity. The independent review must be later than that authoritative CI completion time and bind the CI identity digest.

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

`aigov-lifecycle-ledger.v1` is the sequence carrier. The workflow publishes local command-log files and an executed manifest while the run is in progress. Only after the run completes may `aigov:capture-ci-evidence` fetch the authoritative run/job/check/artifact identity and `aigov:lifecycle-ledger` materialize the first five events through `exact_head_validated` using the actual CI completion time and digest. The exact-main verifier appends only verified `independent_review_green`, API-derived `owner_merge` and authoritative `exact_main_verified` events. Duplicate IDs, replayed CI/review evidence, missing predecessors, time/order violations, foreign repository/PR/head/scope identities and unverified external evidence fail closed.

## Current limitation

Repository ruleset and branch-protection enforcement are not claimed. The exact-main command cannot succeed until the fresh independent review bundle is published immutably by PR Inspector and the owner has merged the exact reviewed head.
