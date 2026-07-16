# AIGOV Exact-Main Closure Protocol

**Status:** active V4 verification protocol; not a Merge authorization  
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4`  
**Previous plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3`

## General evidence rule

A PR head, CI result, target-authored record, caller-supplied actor, declared hash, commit message, path list, schema-valid lookalike, review artifact or Merge metadata alone does not establish completion. `tools/verify-aigov-v3-exact-main.mjs` derives live repository, PR, Git object, exact-head CI, Merge actor, current `main` and current-main validation evidence.

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
```

V4 corrects:

```yaml
previous_invalid_predicate: strict_pr_head_commit_ancestry
replacement_predicate: deterministic_merge_result_equivalence
reason: github_squash_merge_does_not_preserve_pr_commit_ancestry
```

The verifier must confirm exact repository/PR/base/head/squash identities, owner Merge, Green exact-head CI, the squash commit equal to or ancestral to current `main`, Green current-main validation, preserved KROAD memory, Coverage non-promotion and no product activation.

For PR #49, only exact Git tree equality is accepted:

```yaml
equivalence_mode: exact_tree_equality
pr_head_tree_sha: 8a8c83aee95ab36ab59ba128c7710bafedaa2d20
squash_commit_tree_sha: 8a8c83aee95ab36ab59ba128c7710bafedaa2d20
result: pass
```

If direct tree equality differs or is unavailable, a future bounded verifier may use binary-safe patch reconstruction from the exact base, but only exact reconstructed-tree equality may pass. Equal file counts, equal paths, similar diffs, commit messages, whitespace-insensitive comparison and partial comparison are insufficient.

The pass result states:

```yaml
batch_id: BATCH_A
status: pass
closure_mode: v4_one_time_squash_equivalence
merge_mode: squash
content_equivalence: verified
historical_independent_green_receipt: not_claimed
exception_reusable: false
exception_precedential: false
```

## Batch B exact-head and exact-main rule

Batch B has no exception. Before Merge, its exact final head and exact `scope_revision` require Green exact-head CI and an independent PR-Inspector Green verdict. Any head or scope mutation invalidates prior CI and review.

After owner Merge, the verifier reuses that same pre-Merge review only when owner identity, exact review binding and current-main validation remain verified. Delivery proof is method-aware:

```yaml
merge_commit:
  proof: reviewed_head_is_ancestor_of_current_main
squash:
  proof: exact_tree_or_reconstructed_tree_equivalence
rebase:
  proof: deterministic_result_tree_equivalence_or_verified_commit_mapping
```

Merge-method detection cannot weaken CI, independent review, owner-only Merge, exact scope or current-main validation. A second independent review after Merge is neither required nor accepted as a substitute for the pre-Merge review.

## Recovery-program boundary

`DCOV-COVERAGE-EXECUTION-PROGRAM` and `KREC-001` through `KREC-009` are registration-only carriers. They do not supersede KROAD items, activate tasks, implement recovery work, grant Coverage credit or establish readiness.

## Merge boundary

The implementation agent cannot issue `GREEN_MERGE_RECOMMENDED`, approve, Merge or enable auto-merge. Merge authority remains owner-only.
