# AIGOV Exact-Main Closure Protocol

**Status:** active owner-policy V4 verification protocol
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4`
**Merge authority:** owner-only
**Independent review:** optional advisory, non-blocking

## Active sequence

```text
exact base
-> declared scope
-> exact-head CI Green
-> owner-only Merge
-> method-aware deterministic Merge-result proof
-> current-main validation Green
```

The following remain mandatory:

```yaml
exact_head_ci: required
scope_binding: required
owner_only_merge: required
method_aware_merge_result_proof: required
current_main_validation: required
coverage_overclaim_protection: required
readiness_overclaim_protection: required
kroad_preservation: required
secret_and_permission_safety: required
```

## Independent review policy

```yaml
independent_pre_merge_review_required: false
independent_review_policy: optional_advisory
missing_independent_review_is_blocking: false
stale_independent_review_is_blocking: false
review_sequence_is_blocking: false
review_provenance_is_blocking: false
```

When no review exists, exact-main evidence must report:

```yaml
independent_review:
  required: false
  status: not_required_by_owner_policy
  provenance: not_applicable
  completed_before_merge: not_applicable
```

A real advisory review may be reported as `performed_advisory` or `stale_advisory`. It cannot issue Merge authority, replace exact-head CI, replace owner Merge or fabricate `GREEN_TECHNICALLY_READY`.

## PR #49 historical reconciliation

The one retrospective exception remains limited to:

```yaml
pr_number: 49
base_sha: 5ff5d7b20db11af36ab787eb8ac2d1127ea74644
head_sha: c141923bf411f802f1673acf06dc92a77b415593
squash_commit_sha: 86e25a9073df7e257ca7df799de85baf9b3fafb0
tree_sha: 8a8c83aee95ab36ab59ba128c7710bafedaa2d20
reusable: false
precedential: false
historical_independent_green_receipt: not_claimed
```

## PR #50 exact-main identity

```yaml
repository_id: 1292378784
pr_number: 50
reviewed_head_sha: e5c0c342d6417c8e85be54e7cb4caf372a116a35
reviewed_scope_revision: sha256:dc8627e6df4c305fb374d6510395611313d672d77708066f41af4ba722c7b82c
merge_commit_sha: 435add8ee3f3274f781b6e391f11e3262e380c4e
merge_actor: rezahh107
```

`tools/verify-aigov-v3-exact-main.mjs` derives repository, PR, CI, Merge, Git tree and current-main identities from GitHub payloads. Caller booleans, PR-body claims and target-authored lookalikes cannot unlock closure.

## Method-aware delivery

```yaml
merge:
  required_proof: reviewed_head_ancestor_of_current_main
squash:
  required_proof: exact_result_tree_equality
rebase:
  required_proof: exact_result_tree_equality_or_verified_commit_mapping
```

## Post-Merge workflow

`.github/workflows/finalize-aigov-batch-b.yml` starts from successful `Validate Main`, verifies the exact workflow source and runs production mode `batch-b-final`.

The finalizer does not require PR Inspector files. Review absence or staleness is advisory only. It still fails closed on exact-head CI, owner Merge, Merge-result, current-main validation, Coverage overclaim, readiness overclaim or KROAD mutation.

## Recovery boundary

AIGOV closure does not itself grant Coverage credit or readiness. The separately owner-authorized Recovery Program may be active while:

```yaml
coverage_promotion_effect: none
product_effect: none
kroad_supersession_effect: none
coverage_credit: false
readiness_claim: false
```
