# AIGOV Exact-Main Closure Protocol

**Status:** active verification protocol; not a closure receipt
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`

## Rule

Neither a PR head, successful CI, target-authored record, caller-supplied actor, schema-valid lookalike, independent review, nor Merge metadata alone establishes completion. Completion is derived only by `tools/verify-aigov-exact-main.mjs` on the current default-branch checkout after an owner Merge.

The verifier accepts no `--merge-actor`, `--expected-sha`, local receipt boolean, or caller-authored GitHub payload. It fetches the target repository, PR #49, current `main`, PR author, `merged_by`, base, reviewed head and merge commit from the public GitHub REST API. The checkout remote, local HEAD, API current-main identity and reviewed-head ancestry must agree.

The review input is an immutable external source tuple: exact `rezahh107/PR-Inspector` commit plus a receipt path under the exact target head and `scope_revision`. The verifier enumerates the review directory from GitHub rather than trusting receipt declarations. It passes the complete directory to the official pinned `v1.10.1` final-byte verification boundary; target code does not reconstruct `project_decision`, canonical projection, owner output, handoff, prompt or manifest. The official boundary validates schemas and semantics, canonical projection equality, prompt routing, deterministic rendered bytes, manifest and final-byte hashes, while the target verifier separately verifies Git blob SHAs and immutable source identity. The active compatibility source is `PR-Inspector@v1.10.1`, repository ID `1288323264`, commit `7a21045366bb9ad1ca2f950b8341ebb867dd8a52`.

The verifier separately fetches the completed GitHub Actions run, jobs, check runs and uploaded artifact for the exact PR head. The accepted identity is a `pull_request` head execution, not a synthetic merge ref; every required job must be successful and produced by the GitHub Actions App identity. It also verifies the designated `Validate rereview sequence enforcement` run, job, App ID, immutable workflow bytes, producer artifact and official validator command. The independent review must be later than both authoritative completion times and bind the exact identities.

Neither run upgrades the official security profile. Green and `merge_now` additionally require the official opaque sequence capability, which cannot exist until authoritative GitHub settings evidence proves the exact context plus App ID is a required check. This PR adds the producer but does not claim or change repository settings.

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

`aigov-lifecycle-ledger.v1` is the sequence carrier. The two source workflows publish their ordinary outputs and complete independently. A separate read-only `pull_request` verifier waits for, re-fetches and validates both completed exact-head source runs; uploads its validation logs first; verifies the assigned artifact ID and digest through GitHub; then materializes the finalized CI identity, evidence manifest, ledger through `exact_head_validated`, scope disclosure and designated producer identity. It uploads one final payload and a detached index containing the assigned workflow/run/job/artifact identity plus every final-file-byte SHA-256. This avoids both the same-run artifact-ID cycle and the default-branch activation limitation of a newly introduced `workflow_run` workflow. A local post-run file is never described as a GitHub Actions artifact. The exact-main verifier appends only verified `independent_review_green`, API-derived `owner_merge` and authoritative `exact_main_verified` events. Duplicate IDs, replayed CI/review/producer evidence, missing predecessors, time/order violations, foreign repository/PR/head/scope identities and unverified external evidence fail closed.

## Current limitation

Repository ruleset and branch-protection enforcement are not claimed. Required-check configuration for `Validate rereview sequence enforcement` is a separate owner administrative action and is not authorized in Batch A repair. The exact-main command cannot convert the pending Yellow security profile to Green and cannot succeed until an official opaque capability exists, a fresh independent Green bundle is published immutably by PR Inspector, and the owner later merges the exact reviewed head.
