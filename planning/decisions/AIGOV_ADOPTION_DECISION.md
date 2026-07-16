# AIGOV Adoption Decision

## Classification

```yaml
record_kind: governance_adoption_decision
record_status: approved_active_plan
plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4
plan_version: 4
previous_plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3
standard_id: AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT
standard_version: 1.1.0
target_repository: rezahh107/EV4-Decision-Kernel
audit_base_branch: main
audit_base_sha: 86e25a9073df7e257ca7df799de85baf9b3fafb0
owner_approval_source: explicit_owner_authorization
repository_adoption_status: pending_batch_b_exact_main_completion
active_batch: BATCH_B
current_increment_set: AIGOV-ADOPT-008
active_review_protocol: v1.10.2
active_inspector_release_commit: 9ed48bd995ee5b9270756254b04c1d48ccf21cbe
merge_authority: owner_only
maximum_new_implementation_prs: 0
maximum_active_implementation_prs: 1
```

## V4 correction

V3 correctly detected that PR #49 final head `c141923bf411f802f1673acf06dc92a77b415593` is not a commit ancestor of its GitHub Squash Merge result. That predicate was invalid for this Merge method. V4 replaces only that predicate with deterministic Merge-result equivalence; it does not weaken identity, CI, owner Merge, current-main validation, Coverage, KROAD or review boundaries.

```yaml
correction:
  previous_invalid_predicate: strict_pr_head_commit_ancestry
  replacement_predicate: deterministic_merge_result_equivalence
  reason: github_squash_merge_does_not_preserve_pr_commit_ancestry
exception_scope:
  repository: rezahh107/EV4-Decision-Kernel
  pr_number: 49
  base_sha: 5ff5d7b20db11af36ab787eb8ac2d1127ea74644
  final_head_sha: c141923bf411f802f1673acf06dc92a77b415593
  squash_commit_sha: 86e25a9073df7e257ca7df799de85baf9b3fafb0
  equivalence_mode: exact_tree_equality
  pr_head_tree_sha: 8a8c83aee95ab36ab59ba128c7710bafedaa2d20
  squash_commit_tree_sha: 8a8c83aee95ab36ab59ba128c7710bafedaa2d20
  reusable: false
  precedential: false
  historical_independent_green_receipt: not_claimed
```

Historical PR #49 evidence remains bound to its historical protocol and is not rewritten as Batch B provenance.

## PRF-050 repair decision

The active Batch B review boundary is exactly `PR-Inspector v1.10.2` at release commit `9ed48bd995ee5b9270756254b04c1d48ccf21cbe` in official repository `rezahh107/PR-Inspector` with numeric repository ID `1288323264`.

Batch B must reject stale `v1.10.1` review bundles. It must verify `CURRENT_VERSION`, `protocol-manifest.yaml`, the active release lock, the trust policy, the release commit ancestry on official `main`, and one deterministic official review directory bound to exact PR #50 head and `scope_revision`.

Authoritative CI is identified by repository ID, workflow ID/path/name, event, exact head, run ID/attempt/status/conclusion, job ID, check name/head and GitHub Actions App ID/slug. Display-name equality and caller-supplied success booleans are non-authoritative.

The production `batch-b-final` verifier runs only after exact-main `Validate Main`. It derives Merge method from GitHub objects and applies method-aware proof. It reuses the exact pre-Merge independent review and does not request a second post-Merge review.

Repository settings were not modified. Missing read-only proof of required checks, App binding, strict stale-check policy or bypass configuration remains a fail-closed unresolved gate:

```yaml
required_check_configuration: unverified
repository_settings_enforced: not_claimed
merge_permitted: false
```

## Batch disposition

1. `BATCH_A` — `AIGOV-ADOPT-000` through `AIGOV-ADOPT-007` are `merged_and_post_merge_reconciled` under the exact V4 one-time squash-equivalence tuple.
2. `BATCH_B` — PR #50 implements `AIGOV-ADOPT-008`, active v1.10.2 review binding, exact CI/check identity, method-aware exact-main verification and registration-only recovery-program carriers.

Required sequence:

```text
exact final Batch B head
→ exact-head CI Green
→ independent PR-Inspector v1.10.2 Green on exact head and scope_revision
→ owner Merge
→ deterministic Merge-result proof for the actual Merge method
→ current-main validation Green
→ read-only repository-enforcement proof
→ final adoption closure
```

Method-aware proof:

```yaml
merge_commit: reviewed_head_is_ancestor_of_current_main
squash: exact_result_tree_equality
rebase: exact_result_tree_equality_or_verified_commit_mapping
```

## Unchanged boundaries

- owner-only Merge;
- exact-head CI and exact scope binding;
- independent exact final-head PR-Inspector v1.10.2 review for Batch B;
- Coverage remains `not_measurable_pending_external_promotion`;
- `KROAD-012` through `KROAD-018` remain preserved;
- `KROAD-012R` remains `historical_non_authoritative`;
- `KREC-001` through `KREC-009` remain `registered_planned_task` only;
- no product implementation, external repository change, deployment or release.

## Change control

Any reuse of the PR #49 exception, another repository or PR, another implementation PR, Coverage promotion, product implementation, external repository change, secret/permission/ruleset change, destructive operation or Merge requires separate owner authorization.
