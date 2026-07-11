# KROAD-010 Downstream Consumer Contract — Post-Merge Review

**Status:** needs_audit  
**Scope:** evidence-only post-merge verification record for KROAD-010 bootstrap, activation, and closure governance  
**Owner:** Kernel  
**Roadmap authority:** `planning/NEXT_WORK.md`

## Repository identity

```text
governance_base_main: 56a730fc3bbf6939bdb49dd81e25ae0421c376e2
pr_36_merge_commit: 56a730fc3bbf6939bdb49dd81e25ae0421c376e2
activation_merge_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
bootstrap_commit: aa0317a07c10acf4e398dc9e5869f4e6966569f9
reviewed_activation_head: f61fbf931e585b50403be2b015d34fee3a206a17
behavioral_coverage_synthetic_merge: ac0cb0f513486c65907c262188f2d4d0a38d2cab
evaluated_main_commit: merge commit produced when PR #37 lands
exact_sha: to be recorded by the evidence-closure PR
```

PR #33 merged the lifecycle-neutral acceptance stack as the bootstrap anchor. PR #34 merged the activation layer. Repository comparison confirms the activation merge descends from the bootstrap anchor.

## Confirmed implementation state

The activation:

- pins all seven ordinary Consumer Record fixtures to merged bootstrap commit `aa0317a07c10acf4e398dc9e5869f4e6966569f9`;
- activates `primary -> canonical-lock -> lineage` exactly once and in that order;
- preserves production ancestor and byte-equality checks;
- includes deterministic `merge_commit`, `squash`, and `rebase` history testing;
- keeps clean-worktree, drift, missing-stack, missing-artifact, and prototype-pollution regression coverage;
- implements only a Kernel-local consumer contract;
- does not prove live downstream enforcement, runtime behavior, Builder execution, Project Gate acceptance, ecosystem readiness, or production readiness.

## PR #34 supporting workflow evidence

Workflow run metadata and the commit object checked out by a job remain separate provenance fields.

### Validate MVK — exact PR-head evidence

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

Relevant successful steps:

```text
exact repository-head checkout
source syntax and JSON validation
MVK fixtures and gates
roadmap-memory validation
prototype integrity
merge/squash/rebase history matrix
history-matrix artifact upload
```

Artifact:

```text
artifact_id: 8235134860
artifact_name: kroad-010-history-matrix
digest: sha256:0f3b2370957958aab14cc826355b5c45158edf4bf8847c123338e5bd5e9cd607
created_at: 2026-07-10T17:44:07Z
expires_at: 2026-07-24T17:44:07Z
artifact_head_sha: f61fbf931e585b50403be2b015d34fee3a206a17
```

This is exact PR-head evidence. It is not direct current-main push evidence.

### Behavioral Coverage Audit — synthetic-merge evidence

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

Relevant successful steps:

```text
synthetic merge checkout
immutable action-pin verification
advisory behavioral-coverage audit
coverage-report upload
```

This is successful synthetic-merge integration evidence. It is not exact PR-head or direct current-main push evidence.

## Historical exact-commit retrieval disposition

The original closure rule targeted direct workflow records for activation commit:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
```

The available commit-workflow connector filtered to pull-request-triggered runs, while the required records would have been push-event runs. Direct historical Actions retrieval was also unavailable from the execution environment.

```text
historical_exact_commit_retrieval: unavailable
historical_run_absence_proved: no
historical_success_invented: no
historical_failure_claimed: no
```

The unavailable result was evidence-honest but did not satisfy closure.

## Superseded root-tree proposal

PR #37 initially proposed `equivalent_tested_tree` with mandatory root tree OID equality. Root tree identity is a valid Git content-identity method, but retrieving the required root tree OIDs was operationally inaccessible through the available capability.

The proposal is superseded rather than represented as incorrect:

```text
former_mode: equivalent_tested_tree
former_root_tree_requirement: valid_but_operationally_inaccessible
former_mode_active: no
replacement_mode: current_main_post_activation_validation
replacement_method: explicit_governance_change
silent_substitution: no
```

Root tree OID retrieval is no longer the next operational action or a mandatory KROAD-010 closure condition.

## Adopted closure governance

PR #37 adopts the KROAD-010-specific governance mode:

```text
evidence_mode: current_main_post_activation_validation
effective_condition: decision_present_on_main
```

The mode is effective when `planning/decisions/KROAD-010_CURRENT_MAIN_POST_ACTIVATION_VALIDATION_DECISION.md` is present on `main`. Its adoption does not complete KROAD-010.

A follow-up evidence-only closure PR must evaluate the merge commit produced when PR #37 lands and require all of the following:

1. activation commit `60836283d9a5ae98c3c3819c7ab33a6f40206289` is an ancestor of the evaluated `main` commit;
2. bootstrap anchor `aa0317a07c10acf4e398dc9e5869f4e6966569f9` remains an ancestor of activation;
3. every post-activation changed path is enumerated and semantically classified;
4. no unreviewed change affects the protected KROAD-010 surface:

   ```text
   .github/workflows/
   package.json
   package-lock.json
   kernel/
   tools/validate-kroad-010-*
   tools/kroad-010-history/
   ```

5. direct successful `push` runs exist for both required workflows with exact run-record `head_sha` equal to the evaluated current-main merge commit;
6. run IDs, run numbers, events, head SHAs, statuses, conclusions, timestamps, URLs, job IDs, and relevant step conclusions are recorded;
7. the qualifying `Validate MVK` run produces and records the `kroad-010-history-matrix` artifact ID, name, digest, timestamps, expiration state, and run association;
8. PR #34 evidence retains its actual exact-head and synthetic-merge provenance;
9. merge/squash/rebase history evidence remains mandatory and separate;
10. any missing, failed, cancelled, inaccessible, or mismatched run or artifact fails closed.

## Current decision

```text
governance_state_after_merge: adopted
KROAD-010: needs_audit
KROAD-011: blocked
completion_evidence_mode: current_main_post_activation_validation
completion_evidence_status: pending_post_merge_push_evidence
KROAD-010_completion_by_PR_37: no
KROAD-011_unblocked_by_PR_37: no
required_follow_up: post_merge_push_run_evidence_closure
evaluated_main_commit: merge commit produced when PR #37 lands
exact_sha: to be recorded by the evidence-closure PR
```

KROAD-011 remains blocked until the separate evidence-only closure PR completes KROAD-010. Governance merge is not itself a remaining KROAD-010 evidence gate.

## Required follow-up after PR #37 merge

A separate evidence-only closure PR must:

```text
identify the actual PR #37 merge commit now on main
verify bootstrap -> activation -> evaluated-main ancestry
enumerate and classify every post-activation path
verify the protected implementation surface
retrieve Validate MVK push run with exact matching head_sha
retrieve Behavioral Coverage Audit push run with exact matching head_sha
record all required run/job/step/timestamp/URL fields
record current-main history-matrix artifact evidence
mark KROAD-010 complete only if all criteria pass
make KROAD-011 next_allowed without implementing it
```

## Preserved limitations

```text
active consumer contract: Kernel-local only
live downstream-repository rejection evidence: not claimed
runtime/browser proof: not claimed
Builder execution proof: not claimed
Project Gate acceptance: not claimed
ecosystem readiness: not claimed
production readiness: not claimed
```