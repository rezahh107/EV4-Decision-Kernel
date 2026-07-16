# AIGOV Exact-Main Closure Protocol

**Status:** active V4 verification protocol; not a Merge authorization
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4`
**Active Batch B review protocol:** `PR-Inspector v1.10.2`
**Active Inspector release commit:** `9ed48bd995ee5b9270756254b04c1d48ccf21cbe`

## Active machine binding

```yaml
plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4
review_protocol: PR-Inspector v1.10.2
inspector_release_commit: 9ed48bd995ee5b9270756254b04c1d48ccf21cbe
historical_batch_a_equivalence: exact_tree_equality
method_aware_delivery:
  merge: reviewed_head_ancestor_of_current_main
  squash: exact_result_tree_equality
  rebase: exact_result_tree_equality_or_verified_commit_mapping
```

This binding is the active Batch B boundary. Historical PR #49 evidence remains separate and does not become a `v1.10.2` review receipt. The compatibility label `merge_commit:` refers only to the `merge` delivery case above and does not define another Merge method or weaken its ancestry proof.

## General evidence rule

A PR head, CI result, target-authored record, caller-supplied actor, declared hash, commit message, path list, schema-valid lookalike, review artifact or Merge metadata alone does not establish completion. `tools/verify-aigov-v3-exact-main.mjs` constructs opaque verified evidence from live GitHub payloads and immutable repository bytes.

## Batch A one-time reconciliation

The only retrospective exception is:

```yaml
repository: rezahh107/EV4-Decision-Kernel
pr_number: 49
base_sha: 5ff5d7b20db11af36ab787eb8ac2d1127ea74644
head_sha: c141923bf411f802f1673acf06dc92a77b415593
squash_commit_sha: 86e25a9073df7e257ca7df799de85baf9b3fafb0
exception_plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4
reusable: false
precedential: false
historical_independent_green_receipt: not_claimed
```

The exact PR-head and squash-result trees both equal `8a8c83aee95ab36ab59ba128c7710bafedaa2d20`. This historical proof is separate from the active Batch B review protocol and must not be rewritten as a `v1.10.2` review receipt.

## Active PR Inspector binding

An official Batch B review can pass only when all of the following are verified at immutable commit `9ed48bd995ee5b9270756254b04c1d48ccf21cbe`:

- repository `rezahh107/PR-Inspector`, repository ID `1288323264`, default branch `main`;
- release commit belongs to official `main`;
- `CURRENT_VERSION` equals `v1.10.2`;
- `protocol-manifest.yaml` declares `v1.10.2` active and identifies the canonical contract/schema and release lock;
- every exact `load_order` path is covered by the release lock and its bytes match the locked SHA-256;
- the active trust policy binds the same repository, ID, version and GitHub REST evidence source;
- one deterministic official review directory exists for the exact PR #50 head and `scope_revision`;
- its final artifact bytes, manifest hashes, technical status and reviewer identity validate through official PR Inspector production logic.

A stale `v1.10.1` bundle, another Inspector repository or ID, a release commit not on official `main`, a malformed lock or a future unrelated candidate protocol file cannot satisfy this boundary.

## Authoritative exact-head CI

Display-name equality is not identity. Every authoritative CI item must bind:

```yaml
repository_id: exact
workflow_id: exact
workflow_path: exact
workflow_name: exact
event: exact
exact_head_sha: exact
run_id: exact
run_attempt: exact
status: completed
conclusion: success
job_id: exact
check_name: exact
check_head_sha: exact
check_app_id: 15368
check_app_slug: github-actions
```

The verifier rejects same-name collisions, wrong path/ID/App/event/repository/head, duplicate ambiguous candidates, skipped or cancelled candidates, missing jobs/checks, malformed responses and caller-supplied success booleans.

## Batch B pre-Merge rule

Before Merge, the exact final PR #50 head and exact `scope_revision` require:

1. authoritative exact-head CI Green;
2. one official independent `PR-Inspector v1.10.2` review with `GREEN_TECHNICALLY_READY`;
3. review completion after final exact-head CI and before Merge;
4. explicit owner Merge.

Any head or scope mutation invalidates prior CI, artifact and review evidence.

## Authoritative post-Merge path

`.github/workflows/finalize-aigov-batch-b.yml` starts only from a successfully completed `Validate Main` `workflow_run`. It verifies the source repository, workflow ID metadata, path, name, event, exact main head, status and conclusion, then executes the production `batch-b-final` verifier.

The verifier discovers the official review directory and provenance deterministically. It does not accept a PR-body value, target-authored receipt, mutable branch reference, caller success boolean or asserted Merge method.

Delivery proof is method-aware:

```yaml
merge:
  required_proof: reviewed_head_ancestor_of_current_main
squash:
  required_proof: exact_result_tree_equality
rebase:
  required_proof: exact_result_tree_equality_or_verified_commit_mapping
```

The Merge result must be contained in current `main`, current-main validation must be Green and `main` must not move during verification. The exact pre-Merge review is reused; a second post-Merge independent review is neither required nor accepted as a substitute.

## Repository-enforcement evidence

This repair does not modify Rulesets, branch protection or repository settings. Read-only evidence must prove exact required check contexts and App IDs, stale-check behavior, applicable Rulesets/branch protection, admin enforcement and bypass actors.

When that evidence is inaccessible, partial or stale, the result remains:

```yaml
required_check_configuration: unverified
repository_settings_enforced: not_claimed
merge_permitted: false
```

An unverified settings state cannot produce Green exact-main closure.

## Recovery and product boundaries

`DCOV-COVERAGE-EXECUTION-PROGRAM` and `KREC-001` through `KREC-009` are registration-only carriers. They do not supersede KROAD items, activate tasks, implement recovery work, grant Coverage credit or establish readiness.

Coverage remains `not_measurable_pending_external_promotion`; `coverage_promotion_effect`, `product_effect` and `external_repository_effect` remain `none`.

## Merge boundary

The implementation agent cannot issue `GREEN_MERGE_RECOMMENDED`, approve, Merge, mark ready or enable auto-merge. Merge authority remains owner-only and a fresh independent review is required after the final repair head and scope are fixed.
