# AIGOV Adoption Audit

## Identity

```yaml
record_kind: governance_adoption_audit
record_status: current_v4_repair_audit
plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4
plan_version: 4
previous_plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3
target_repository: rezahh107/EV4-Decision-Kernel
default_branch: main
audit_base_sha: 86e25a9073df7e257ca7df799de85baf9b3fafb0
repository_adoption_status: pending_batch_b_exact_main_completion
active_review_protocol: v1.10.2
active_inspector_release_commit: 9ed48bd995ee5b9270756254b04c1d48ccf21cbe
```

## Confirmed baseline

- PR #49 is merged with base `5ff5d7b20db11af36ab787eb8ac2d1127ea74644`, final head `c141923bf411f802f1673acf06dc92a77b415593` and squash commit `86e25a9073df7e257ca7df799de85baf9b3fafb0`.
- Its exact head and squash commit trees both equal `8a8c83aee95ab36ab59ba128c7710bafedaa2d20`.
- No historical independent Green receipt is claimed or fabricated.
- Coverage remains `not_measurable_pending_external_promotion`; percentages remain `null`.
- `KROAD-012` through `KROAD-018` remain preserved; `KROAD-012R` remains `historical_non_authoritative`.
- `KREC-001` through `KREC-009` remain registration-only.

## Batch A disposition

```yaml
BATCH_A: exact_main_reconciled_under_v4_squash_equivalence
AIGOV-ADOPT-000_through_007: merged_and_post_merge_reconciled
closure_mode: v4_one_time_squash_equivalence
merge_mode: squash
content_equivalence: verified
historical_independent_green_receipt: not_claimed
exception_reusable: false
exception_precedential: false
```

The Batch A evidence and its historical protocol remain separate from the active Batch B review protocol.

## PRF-050 repair audit

### PRF-050-001

The active Batch B boundary now uses a correctly named `pr-inspector-v1102` implementation. It binds review identity to:

```yaml
protocol_version: v1.10.2
inspector_repository: rezahh107/PR-Inspector
inspector_repository_id: 1288323264
inspector_release_commit: 9ed48bd995ee5b9270756254b04c1d48ccf21cbe
```

The boundary validates the immutable checkout, active `CURRENT_VERSION`, manifest, exact release-lock coverage and hashes, trust policy, official repository identity, release-commit ancestry on official `main`, exact head/scope review identity and deterministic official review-directory provenance. Stale `v1.10.1` review input is rejected.

### PRF-050-002

`.github/workflows/finalize-aigov-batch-b.yml` is the production post-Merge route. It is triggered only by completion of exact-main `Validate Main`, verifies the source workflow name/path/event/status/conclusion/head and executes:

```text
node tools/verify-aigov-v3-exact-main.mjs --mode batch-b-final
```

The verifier obtains target repository/PR identity, exact final PR head, exact scope, official pre-Merge review, Merge actor/method/result, current `main`, current-main CI and repository-enforcement evidence from GitHub. It does not accept PR-body values, target-authored receipts, mutable refs, caller success booleans or an asserted Merge method. A second post-Merge independent review is not required or accepted as a substitute.

### PRF-050-003

Authoritative CI is now an exact descriptor containing repository ID, workflow ID/path/name, event, exact head, run ID/attempt/status/conclusion, job ID, check name/head and GitHub Actions App ID/slug. Adversarial coverage rejects same-name collisions, wrong workflow path/ID/App/event/repository/head, ambiguity, skipped/cancelled runs, missing job/check and malformed payloads.

### PRF-050-004

No repository settings, Ruleset or branch-protection change was made. The verifier attempts read-only collection, but missing or incomplete proof remains fail closed:

```yaml
required_check_configuration: unverified
repository_settings_enforced: not_claimed
merge_permitted: false
```

A Green exact-main closure requires exact required contexts and App IDs, strict stale-check handling, admin/bypass evidence and no unresolved settings diagnostic.

## Batch B boundary

```yaml
batch_b_status: repair_implemented_pending_new_scope_exact_head_ci_and_fresh_independent_review
independent_review_protocol: v1.10.2
independent_review_handoff: permitted_only_after_final_exact_head_ci_green
merge_authority: owner_only
merge_permitted: false
coverage_effect: none
product_effect: none
external_repository_effect: none
```

This audit is target-authored implementation evidence, not an independent PR-Inspector verdict. Every commit invalidates earlier CI, artifact and review evidence.
