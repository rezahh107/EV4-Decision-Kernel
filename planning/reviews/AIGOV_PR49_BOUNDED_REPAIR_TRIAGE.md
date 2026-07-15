# AIGOV PR #49 Bounded Repair Triage

## Identity

```yaml
record_kind: bounded_repair_triage
plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2
batch_id: BATCH_A
pr_number: 49
reviewed_head_sha: c8741eebe096fb3a29bf60f7df4c81d62ec9971f
review_status: red_do_not_merge
repair_status: implemented_pending_rereview
```

## Accepted findings

- External review and Merge provenance: accepted. The exact-main verifier no longer accepts caller-supplied actor/current-main claims or local receipt lookalikes. GitHub and immutable PR Inspector evidence are derived and revalidated.
- Security profile alignment: accepted. Every `security_profile.forbidden_changes` identifier now maps to an implemented detector or an implemented detector plus explicit external settings evidence; unsupported carriers fail validation.
- Dependency comparison: accepted. Dependency objects are canonicalized before semantic comparison, and the regression suite proves key order does not create a change.
- Secret detection: accepted. Workflow YAML is structurally parsed and only actual secret/token expressions are rejected; harmless prose such as a step named `Run secret scanner` is allowed.
- Real sequence and replay control: accepted. A schema-backed exact-identity lifecycle ledger rejects duplicates, replays, missing predecessors, ordering violations, stale/foreign events and unverified review/Merge tails.
- Live evidence budget: accepted. The committed manifest is an explicit pending template; exact-head execution materializes a separate hashed manifest, enforces the L3 budget and keeps external gates pending.
- Official PR Inspector artifact directory: accepted. The verifier now enumerates all active-protocol artifacts, applies the complete package and projection schemas, reconstructs the official Green projection and derived bytes, validates conditional prompt routing and rejects forged or self-consistent-but-noncanonical manifests.
- Exact-head CI identity: accepted. Local file hashes and commit time no longer mint `exact_head_validated`; the lifecycle event requires a verified GitHub Actions run/job/check/artifact digest and the actual completion timestamp, and review must occur later.
- Transitive workflow security: accepted. Workflow `run:` commands, npm scripts, static local modules and local action entry points are recursively inspected; GitHub mutations through shell, child process, `fetch`, `https.request` and Octokit are rejected, while missing permission boundaries are unknown/fail-closed.

## Rejected suggestions

- `isAncestor` argument type check: rejected as a claimed crash fix. `execFileSync` is already inside `try/catch`, so synchronous argument errors return `false` and fail closed. The new verifier also obtains the compared SHAs from schema/API-validated fields.
- Deduplicate `declaredPaths`: rejected. `aigov-scope-manifest.v1.schema.json` already enforces `uniqueItems: true`; accepting and silently normalizing duplicates would weaken the declared-scope contract.

## Preserved boundaries

- `planning/NEXT_WORK.md` remains current-status authority.
- Coverage remains `not_measurable_pending_external_promotion`.
- `KROAD-012` through `KROAD-018` remain preserved.
- `KROAD-012R` remains `historical_non_authoritative`.
- No Merge, approval, auto-merge, settings mutation, external-repository write, product implementation or Batch B activation is authorized.
