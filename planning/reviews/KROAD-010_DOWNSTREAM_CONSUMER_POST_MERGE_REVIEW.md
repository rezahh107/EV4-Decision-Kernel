# KROAD-010 Downstream Consumer Contract — Post-Merge Review

**Status:** complete  
**Scope:** evidence-only post-merge verification record for KROAD-010 bootstrap, activation, governance adoption, and current-main closure evidence  
**Owner:** Kernel  
**Roadmap authority:** `planning/NEXT_WORK.md`

## Repository identity

```text
governance_base_main: 56a730fc3bbf6939bdb49dd81e25ae0421c376e2
pr_36_merge_commit: 56a730fc3bbf6939bdb49dd81e25ae0421c376e2
bootstrap_commit: aa0317a07c10acf4e398dc9e5869f4e6966569f9
activation_merge_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
reviewed_activation_head: f61fbf931e585b50403be2b015d34fee3a206a17
behavioral_coverage_synthetic_merge: ac0cb0f513486c65907c262188f2d4d0a38d2cab
pr_37_head: 5125cbf347789dbe037658f4ae540f461bf6812e
pr_37_merge_commit: 9e07cfe551c80d669d13489b05b035834290a32f
evaluated_main_commit: 9e07cfe551c80d669d13489b05b035834290a32f
completion_evidence_mode: current_main_post_activation_validation
completion_evidence_status: satisfied
```

PR #33 merged the lifecycle-neutral acceptance stack as the bootstrap anchor. PR #34 merged the activation layer. PR #37 merged the bounded `current_main_post_activation_validation` governance decision. The evidence-only closure operation evaluated the actual PR #37 merge commit on `main`.

## Confirmed implementation state

The activation:

- pins all seven ordinary Consumer Record fixtures to merged bootstrap commit `aa0317a07c10acf4e398dc9e5869f4e6966569f9`;
- activates `primary -> canonical-lock -> lineage` exactly once and in that order;
- preserves production ancestor and byte-equality checks;
- includes deterministic `merge_commit`, `squash`, and `rebase` history testing;
- keeps clean-worktree, drift, missing-stack, missing-artifact, and prototype-pollution regression coverage;
- implements only a Kernel-local consumer contract;
- does not prove live downstream enforcement, runtime behavior, Builder execution, Project Gate acceptance, ecosystem readiness, or production readiness.

## Ancestry evidence

```text
bootstrap -> activation:
  base: aa0317a07c10acf4e398dc9e5869f4e6966569f9
  head: 60836283d9a5ae98c3c3819c7ab33a6f40206289
  comparison_status: ahead
  merge_base: aa0317a07c10acf4e398dc9e5869f4e6966569f9
  result: PASS

activation -> evaluated main:
  base: 60836283d9a5ae98c3c3819c7ab33a6f40206289
  head: 9e07cfe551c80d669d13489b05b035834290a32f
  comparison_status: ahead
  merge_base: 60836283d9a5ae98c3c3819c7ab33a6f40206289
  result: PASS

evaluated main -> live main at closure:
  base: 9e07cfe551c80d669d13489b05b035834290a32f
  head: main
  comparison_status: identical
  ahead_by: 0
  behind_by: 0
  result: PASS
```

## Complete post-activation changed-path classification

Comparison range:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
...
9e07cfe551c80d669d13489b05b035834290a32f
```

| Path | Change | Semantic classification | Protected implementation surface |
|---|---|---|---|
| `docs/decision-governance/KROAD_010_DOWNSTREAM_CONSUMER_CONTRACT.md` | modified | KROAD-010 contract and closure-governance documentation | no |
| `planning/KERNEL_EXECUTION_PLAN.md` | modified | durable roadmap meaning and evidence-option documentation | no |
| `planning/NEXT_WORK.md` | modified | authoritative mutable roadmap status | no |
| `planning/decisions/KROAD-010_CURRENT_MAIN_POST_ACTIVATION_VALIDATION_DECISION.md` | added | explicit KROAD-010 closure-governance decision | no |
| `planning/reviews/KROAD-010_DOWNSTREAM_CONSUMER_POST_MERGE_REVIEW.md` | added | evidence review and closure record | no |

No post-activation change affected:

```text
.github/workflows/
package.json
package-lock.json
kernel/
tools/validate-kroad-010-*
tools/kroad-010-history/
```

Protected-surface result: `PASS`. No independently reviewed implementation change was required for this evidence-only closure.

## Direct current-main push evidence

### Validate MVK

```text
workflow: Validate MVK
run_id: 29147385930
run_number: 383
event: push
head_branch: main
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

Relevant successful steps:

```text
Checkout exact repository head with full history: success
Set up Node.js LTS: success
Install MVK validator dependencies: success
Validate KROAD-010 source syntax and JSON: success
Validate MVK fixtures and gates: success
Validate roadmap memory consistency: success
Verify KROAD-010 prototype integrity: success
Validate KROAD-010 merge/squash/rebase history matrix: success
Upload KROAD-010 history matrix evidence: success
```

The checkout log records:

```text
repository: rezahh107/EV4-Decision-Kernel
ref: 9e07cfe551c80d669d13489b05b035834290a32f
fetch-depth: 0
```

### Behavioral Coverage Audit

```text
workflow: Behavioral Coverage Audit
run_id: 29147385903
run_number: 351
event: push
head_branch: main
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

Relevant successful steps:

```text
Check out repository: success
Verify immutable action pins: success
Set up Node.js LTS: success
Run advisory coverage audit: success
Upload coverage reports: success
```

Both qualifying runs are direct `push` runs on `main` and preserve the exact required run-record `head_sha`. No PR run, synthetic merge, later commit, local test, ancestry-only claim, or content-similarity substitute was used.

## Current-main history-matrix artifact

```text
artifact_id: 8247156838
artifact_name: kroad-010-history-matrix
digest: sha256:ff9c73838b014298c0838d2d8c894bf8a17aa7ea1affbb4f41d5ff68287b08ea
created_at: 2026-07-11T09:14:09Z
updated_at: 2026-07-11T09:14:09Z
expires_at: 2026-07-25T09:14:09Z
expired: false
run_id: 29147385930
run_head_branch: main
run_head_sha: 9e07cfe551c80d669d13489b05b035834290a32f
```

The downloaded report records:

```text
result: PASS
merge_commit:
  ordinary_records: pass
  clean_worktree: true
  byte_drift_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT
  missing_stack_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING
  working_tree_only_diagnostic: DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING
squash:
  ordinary_records: pass
  clean_worktree: true
  byte_drift_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT
  missing_stack_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING
  working_tree_only_diagnostic: DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING
rebase:
  ordinary_records: pass
  clean_worktree: true
  byte_drift_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT
  missing_stack_diagnostic: DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING
  working_tree_only_diagnostic: DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING
```

Mutation guards also passed for missing history methods, stale/non-ancestor anchors, invalid bootstrap anchors, dirty worktrees, weakened drift diagnostics, wrong ordinary-record anchors, and delegated canonical-lock/prototype guard execution.

History-sensitive validation result: `PASS`.

## PR #34 supporting workflow evidence

Workflow run metadata and the commit object checked out by a job remain separate provenance fields.

### Validate MVK — exact PR-head supporting evidence

```text
workflow: Validate MVK
run_id: 29111998786
run_number: 372
event: pull_request
run_metadata_head_sha: f61fbf931e585b50403be2b015d34fee3a206a17
checked_out_ref_type: explicit_pr_head
checked_out_sha: f61fbf931e585b50403be2b015d34fee3a206a17
job_id: 86426315610
status: completed
conclusion: success
```

Historical artifact:

```text
artifact_id: 8235134860
artifact_name: kroad-010-history-matrix
digest: sha256:0f3b2370957958aab14cc826355b5c45158edf4bf8847c123338e5bd5e9cd607
created_at: 2026-07-10T17:44:07Z
expires_at: 2026-07-24T17:44:07Z
artifact_head_sha: f61fbf931e585b50403be2b015d34fee3a206a17
```

This remains exact PR-head supporting evidence only.

### Behavioral Coverage Audit — synthetic-merge supporting evidence

```text
workflow: Behavioral Coverage Audit
run_id: 29111998776
run_number: 340
event: pull_request
run_metadata_head_sha: f61fbf931e585b50403be2b015d34fee3a206a17
checked_out_ref_type: pull_request_synthetic_merge
checked_out_ref: refs/pull/34/merge
checked_out_sha: ac0cb0f513486c65907c262188f2d4d0a38d2cab
job_id: 86426315565
status: completed
conclusion: success
```

This remains synthetic-merge supporting evidence only. Neither PR #34 run is relabelled as direct current-main push evidence.

## Historical exact-activation retrieval disposition

The original closure rule targeted direct workflow records for activation commit:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
```

Direct historical Actions retrieval remained unavailable in the earlier environment. No historical success or failure was invented. PR #37 explicitly superseded the former exact-activation operational rule with `current_main_post_activation_validation`; it did not silently reinterpret the historical evidence.

## Criterion-by-criterion result

| Criterion | Result | Evidence |
|---|---|---|
| Activation ancestry | `PASS` | activation is merge base and ancestor of evaluated main |
| Bootstrap ancestry | `PASS` | bootstrap is merge base and ancestor of activation |
| Complete post-activation path enumeration | `PASS` | all five changed paths listed and classified |
| Protected implementation surface | `PASS` | no protected path changed post-activation |
| Direct current-main push runs | `PASS` | runs `29147385930` and `29147385903` |
| Complete workflow provenance | `PASS` | run, job, step, timestamp, URL, branch, and SHA recorded |
| Current-main history-matrix artifact | `PASS` | artifact `8247156838` on qualifying Validate MVK run |
| Accurate PR #34 supporting provenance | `PASS` | exact PR-head and synthetic-merge identities preserved |
| History-sensitive behavior | `PASS` | merge/squash/rebase report result `PASS`; clean worktrees and diagnostics recorded |
| Fail-closed handling | `PASS` | closure occurred only after all mandatory evidence became available and matched |
| Bounded claim surface | `PASS` | limitations below remain explicit |

All mandatory criteria are conjunctively satisfied.

## Closure decision

```text
governance_state: adopted
KROAD-010: complete
completion_evidence_mode: current_main_post_activation_validation
completion_evidence_status: satisfied
evaluated_main_commit: 9e07cfe551c80d669d13489b05b035834290a32f
KROAD-011: next_allowed
KROAD-011_implemented_by_this_operation: no
```

## Preserved limitations

```text
active consumer contract: Kernel-local only
live downstream-repository enforcement: not proved
runtime/browser proof: not proved
Builder execution: not proved
Project Gate acceptance: not proved
ecosystem readiness: not proved
production readiness: not proved
```

KROAD-011 is only the next allowed roadmap item. This evidence-only closure does not implement KROAD-011 and does not modify Kernel schemas, validators, fixtures, Resolver behavior, package wiring, workflows, runtime code, or downstream repositories.
