# KROAD-010 Current-Main Evidence Closure

**Status:** completed  
**Scope:** evidence-only closure of the Kernel-local KROAD-010 consumer-contract gate  
**Owner:** Kernel  
**Evaluated commit:** `9e07cfe551c80d669d13489b05b035834290a32f`  
**Evidence mode:** `current_main_post_activation_validation`  
**Roadmap authority:** `planning/NEXT_WORK.md`

## What this record proves

This record applies the governance decision adopted by PR #37 to its actual merge commit. All mandatory criteria passed, so KROAD-010 is closed and KROAD-011 becomes the next allowed roadmap item.

This closure proves only the Kernel-local consumer-contract gate. It does not prove live downstream-repository enforcement, runtime or browser validity, Builder execution, Project Gate acceptance, ecosystem readiness, or production readiness.

## Commit identities and ancestry

```text
bootstrap_anchor: aa0317a07c10acf4e398dc9e5869f4e6966569f9
activation_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
evaluated_main_commit: 9e07cfe551c80d669d13489b05b035834290a32f
main_head_at_evaluation: 9e07cfe551c80d669d13489b05b035834290a32f
```

GitHub commit retrieval confirmed that all three objects exist. GitHub compare API evidence established:

```text
GET /repos/rezahh107/EV4-Decision-Kernel/compare/
  aa0317a07c10acf4e398dc9e5869f4e6966569f9...
  60836283d9a5ae98c3c3819c7ab33a6f40206289

status: ahead
ahead_by: 23
behind_by: 0
merge_base_commit: aa0317a07c10acf4e398dc9e5869f4e6966569f9
result: bootstrap anchor is an ancestor of activation
```

```text
GET /repos/rezahh107/EV4-Decision-Kernel/compare/
  60836283d9a5ae98c3c3819c7ab33a6f40206289...
  9e07cfe551c80d669d13489b05b035834290a32f

status: ahead
ahead_by: 14
behind_by: 0
merge_base_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
result: activation is an ancestor of the evaluated commit
```

```text
GET /repos/rezahh107/EV4-Decision-Kernel/compare/
  9e07cfe551c80d669d13489b05b035834290a32f...main

status: identical
ahead_by: 0
behind_by: 0
merge_base_commit: 9e07cfe551c80d669d13489b05b035834290a32f
result: evaluated commit is the exact main head at evaluation time
```

Independent Git transport confirmation:

```bash
git ls-remote https://github.com/rezahh107/EV4-Decision-Kernel.git refs/heads/main
```

returned:

```text
9e07cfe551c80d669d13489b05b035834290a32f refs/heads/main
```

## Post-activation path inventory

The GitHub compare API for activation through evaluated main returned exactly five paths. Each path was classified individually:

| Path | Change | Purpose | Semantic impact | Protected surface |
|---|---:|---|---|---:|
| `docs/decision-governance/KROAD_010_DOWNSTREAM_CONSUMER_CONTRACT.md` | modified | Aligns the contract documentation with the explicit two-step closure governance. | Documentation only; no validator, package wiring, fixture, schema, workflow, or runtime behavior changes. | No |
| `planning/KERNEL_EXECUTION_PLAN.md` | modified | Records the adopted `current_main_post_activation_validation` criteria and evidence sequence. | Durable roadmap meaning/documentation only; no executable implementation change. | No |
| `planning/NEXT_WORK.md` | modified | Records the mutable governance-adoption and pending-closure state after PR #37. | Roadmap-status metadata only; no executable implementation change. | No |
| `planning/decisions/KROAD-010_CURRENT_MAIN_POST_ACTIVATION_VALIDATION_DECISION.md` | added | Adopts the bounded closure rule. | Governance decision only; no implementation behavior change. | No |
| `planning/reviews/KROAD-010_DOWNSTREAM_CONSUMER_POST_MERGE_REVIEW.md` | added | Preserves the earlier post-merge audit and PR #34 supporting provenance. | Evidence/history documentation only; no implementation behavior change. | No |

Explicit protected-surface result:

```text
.github/workflows/: unchanged
package.json: unchanged
package-lock.json: unchanged
kernel/: unchanged
tools/validate-kroad-010-*: unchanged
tools/kroad-010-history/: unchanged
unreviewed protected-surface change: none
```

## Exact direct push workflow evidence

Run discovery used the GitHub Actions REST endpoint with both exact filters:

```text
GET /repos/rezahh107/EV4-Decision-Kernel/actions/runs
  ?head_sha=9e07cfe551c80d669d13489b05b035834290a32f
  &event=push
  &per_page=100
```

The response returned exactly the two required qualifying runs.

### Validate MVK

```text
workflow_name: Validate MVK
run_id: 29147385930
run_number: 383
event: push
head_sha: 9e07cfe551c80d669d13489b05b035834290a32f
status: completed
conclusion: success
created_at: 2026-07-11T09:13:41Z
updated_at: 2026-07-11T09:14:12Z
run_url: https://github.com/rezahh107/EV4-Decision-Kernel/actions/runs/29147385930
job_id: 86531145374
job_name: validate-mvk
job_status: completed
job_conclusion: success
```

Relevant steps retrieved from the run-jobs API:

| Step | Conclusion |
|---|---|
| Checkout exact repository head with full history | success |
| Validate KROAD-010 source syntax and JSON | success |
| Validate MVK fixtures and gates | success |
| Validate roadmap memory consistency | success |
| Verify KROAD-010 prototype integrity | success |
| Validate KROAD-010 merge/squash/rebase history matrix | success |
| Upload KROAD-010 history matrix evidence | success |

### Behavioral Coverage Audit

```text
workflow_name: Behavioral Coverage Audit
run_id: 29147385903
run_number: 351
event: push
head_sha: 9e07cfe551c80d669d13489b05b035834290a32f
status: completed
conclusion: success
created_at: 2026-07-11T09:13:41Z
updated_at: 2026-07-11T09:13:50Z
run_url: https://github.com/rezahh107/EV4-Decision-Kernel/actions/runs/29147385903
job_id: 86531145290
job_name: Behavioral coverage
job_status: completed
job_conclusion: success
```

Relevant steps retrieved from the run-jobs API:

| Step | Conclusion |
|---|---|
| Check out repository | success |
| Verify immutable action pins | success |
| Run advisory coverage audit | success |
| Upload coverage reports | success |

## History-matrix artifact evidence

The run-artifacts API for qualifying `Validate MVK` run `29147385930` returned:

```text
artifact_id: 8247156838
artifact_name: kroad-010-history-matrix
digest: sha256:ff9c73838b014298c0838d2d8c894bf8a17aa7ea1affbb4f41d5ff68287b08ea
created_at: 2026-07-11T09:14:09Z
expires_at: 2026-07-25T09:14:09Z
expired: false
workflow_run_id: 29147385930
workflow_run_head_sha: 9e07cfe551c80d669d13489b05b035834290a32f
workflow_run_head_branch: main
```

The artifact was downloaded through the GitHub connector and inspected as a ZIP. It contained exactly one file:

```text
kroad-010-history-matrix-report.json
```

The report declared `schema_version: 0.1.0` and `result: PASS`. Its method records separately confirmed all of the following for `merge_commit`, `squash`, and `rebase`:

```text
ordinary_records: pass
clean_worktree: true
byte_drift_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT
missing_stack_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING
working_tree_only_diagnostic: DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING
```

All seven mutation guards reported `passed: true`, including method-set integrity, stale-anchor rejection, bootstrap-anchor ancestry, dirty-worktree rejection, byte-drift diagnostic integrity, ordinary-record anchor integrity, and delegated canonical-lock/prototype guards. The artifact therefore contains the expected history-matrix output rather than only the expected artifact name.

## Preserved PR #34 supporting provenance

These historical runs remain supporting evidence only and are not relabelled as direct current-main push evidence.

```text
Validate MVK:
  event: pull_request
  run_id: 29111998786
  run_number: 372
  tested_sha: f61fbf931e585b50403be2b015d34fee3a206a17
  provenance: explicit_pr_head

Behavioral Coverage Audit:
  event: pull_request
  run_id: 29111998776
  run_number: 340
  tested_sha: ac0cb0f513486c65907c262188f2d4d0a38d2cab
  provenance: refs/pull/34/merge synthetic merge
```

## Final decision

All mandatory criteria are conjunctively satisfied:

```text
commit_lineage: PASS
post_activation_path_inventory: PASS
protected_surface_review: PASS
validate_mvk_direct_push_run: PASS
behavioral_coverage_direct_push_run: PASS
history_matrix_artifact_metadata: PASS
history_matrix_artifact_inspection: PASS
historical_provenance_accuracy: PASS
bounded_claims: PASS
final_decision: KROAD-010_CLOSED
```

KROAD-010 is completed. KROAD-011 is the next allowed roadmap item but has not been implemented by this evidence-only closure.
