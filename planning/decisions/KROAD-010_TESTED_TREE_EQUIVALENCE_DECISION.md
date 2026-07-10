# KROAD-010 Current-Main Post-Activation Validation Decision

**Status:** proposed governance adoption; authoritative only after merge  
**Decision owner:** Kernel governance  
**Applies to:** KROAD-010 closure evidence only  
**Evidence mode:** `current_main_post_activation_validation`  
**Roadmap authority:** `planning/NEXT_WORK.md`

> Filename note: this file retains its original path for review continuity. The former `equivalent_tested_tree` proposal is superseded by this decision and is not an active closure mode.

## Decision context

KROAD-010 activation merged as:

```text
activation_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
bootstrap_anchor: aa0317a07c10acf4e398dc9e5869f4e6966569f9
reviewed_activation_head: f61fbf931e585b50403be2b015d34fee3a206a17
behavioral_coverage_synthetic_merge: ac0cb0f513486c65907c262188f2d4d0a38d2cab
```

The original roadmap required direct successful Actions evidence for the exact historical activation commit. Retrieval was attempted but remained unavailable in the available environment. No historical success was invented, and unavailable access was never represented as successful CI.

The earlier `equivalent_tested_tree` proposal used root tree OID equality as a valid content-identity mechanism. It is superseded because root tree OID retrieval created an unnecessary operational dependency. This decision adopts a narrower and directly observable closure path: successful push-event validation on a current `main` commit after activation, with strict ancestry and protected-surface checks.

This is an explicit governance change, not a silent reinterpretation of historical evidence.

## Evidence mode

```text
evidence_mode: current_main_post_activation_validation
```

This mode is specific to KROAD-010. It becomes an available KROAD-010 closure mode only after this governance PR is independently reviewed and merged.

PR #37 performs governance adoption only:

```text
KROAD-010 completion in PR #37: no
KROAD-011 unblocked in PR #37: no
required follow-up: post-merge push-run evidence closure PR
```

## Mandatory validation criteria

All criteria are conjunctive. Any missing, failed, cancelled, inaccessible, mismatched, or ambiguous required evidence fails closed.

1. **Activation ancestry**  
   Activation commit `60836283d9a5ae98c3c3819c7ab33a6f40206289` must be an ancestor of the evaluated current `main` commit.

2. **Bootstrap ancestry**  
   Bootstrap anchor `aa0317a07c10acf4e398dc9e5869f4e6966569f9` must remain an ancestor of the activation commit.

3. **Post-activation path enumeration**  
   Every path changed between the activation commit and evaluated `main` commit must be enumerated and semantically classified.

4. **Protected implementation surface unchanged**  
   No post-activation change may affect the protected KROAD-010 implementation surface without a separate implementation review. The protected surface includes at least:

   ```text
   .github/workflows/
   package.json
   package-lock.json
   kernel/
   tools/validate-kroad-010-*
   tools/kroad-010-history/
   ```

   Documentation and planning changes may be allowed only when explicitly classified. A broad “documentation-only” assertion without path-level comparison is insufficient.

5. **Direct current-main push runs**  
   Both required workflows must have direct successful `push`-event runs whose run-record `head_sha` exactly equals the evaluated current `main` merge commit:

   ```text
   Validate MVK
   Behavioral Coverage Audit
   ```

6. **Complete workflow provenance**  
   For each qualifying workflow, the closure record must preserve:

   ```text
   workflow name
   run ID and run number
   event
   head_sha
   status
   conclusion
   created_at
   updated_at
   job IDs
   relevant step conclusions
   run URL
   ```

   A pull-request run, synthetic merge ref, later commit, local run, or tree/content similarity is not a substitute for the qualifying direct push run.

7. **Current-main history-matrix artifact**  
   The qualifying `Validate MVK` push run must produce `kroad-010-history-matrix`. Record:

   ```text
   artifact ID
   artifact name
   digest
   created_at
   expires_at
   expired state
   run association
   ```

8. **Accurate PR #34 supporting provenance**  
   Existing PR #34 evidence remains supporting evidence and must retain its actual tested objects:

   ```text
   Validate MVK:
     event: pull_request
     run_id: 29111998786
     run_number: 372
     checked_out_sha: f61fbf931e585b50403be2b015d34fee3a206a17
     checked_out_ref_type: explicit_pr_head

   Behavioral Coverage Audit:
     event: pull_request
     run_id: 29111998776
     run_number: 340
     checked_out_sha: ac0cb0f513486c65907c262188f2d4d0a38d2cab
     checked_out_ref: refs/pull/34/merge
     checked_out_ref_type: pull_request_synthetic_merge
   ```

   Neither run may be relabelled as direct final-main push evidence.

9. **History-sensitive behavior remains separate**  
   The deterministic history matrix must continue to cover `merge_commit`, `squash`, and `rebase` behavior with clean-worktree checks and required diagnostics. Current-main push success does not replace history-sensitive validation.

10. **Fail-closed run handling**  
    Missing, failed, cancelled, inaccessible, or mismatched workflow or artifact evidence blocks closure. The evaluated `head_sha` must match exactly; ancestry or content similarity alone is insufficient.

11. **Bounded claim surface**  
    Successful validation proves only KROAD-010’s Kernel-local consumer-contract gate. It does not prove:

    ```text
    live downstream-repository enforcement
    runtime/browser proof
    Builder execution
    Project Gate acceptance
    ecosystem readiness
    production readiness
    ```

## Why direct current-main push validation is sufficient for this bounded gate

The activation and bootstrap ancestry checks preserve the historical lineage. Path enumeration and the protected-surface rule establish whether the KROAD-010 implementation or its execution wiring changed after activation. Direct push runs then validate the exact evaluated `main` commit in its real post-merge event context.

These are separate evidence dimensions:

```text
lineage: bootstrap -> activation -> evaluated main
content-change control: path enumeration + protected-surface classification
execution provenance: direct push run with exact head_sha
history behavior: merge/squash/rebase matrix and artifact
```

Root tree OID equality remains a legitimate Git content-identity method, but it is not mandatory under this governance mode. Its removal does not retroactively convert unavailable historical evidence into success.

## Two-step closure sequence

### Step 1 — PR #37 governance adoption

PR #37 must:

- adopt this mode;
- update `planning/NEXT_WORK.md` and `planning/KERNEL_EXECUTION_PLAN.md` coherently;
- preserve `KROAD-010: needs_audit`;
- preserve `KROAD-011: blocked`;
- remain Draft pending fresh independent review;
- not close KROAD-010.

### Step 2 — separate evidence-only closure PR

Only after PR #37 is reviewed and manually merged may a separate PR:

1. identify the PR #37 merge commit now on `main`;
2. verify activation and bootstrap ancestry;
3. enumerate and classify every post-activation path;
4. confirm the protected implementation surface has no unreviewed changes;
5. retrieve both direct `push` runs with exact matching `head_sha`;
6. record run, job, step, timestamp, URL, and artifact evidence;
7. mark `KROAD-010` complete only if every criterion passes;
8. make `KROAD-011` the next allowed task without implementing it.

## Required roadmap state while PR #37 is open

```text
KROAD-010: needs_audit
KROAD-011: blocked
completion_evidence_mode: pending_governance_merge
remaining_gate:
  - merge the independently reviewed governance rule
  - observe both required push-event workflows on the resulting main merge commit
  - record complete run, job, step, URL, timestamp, and artifact evidence in a follow-up closure PR
```

## Historical note

```text
exact_historical_activation_actions_retrieval: unavailable
historical_success_invented: no
former_root_tree_oid_proposal: valid_but_operationally_inaccessible
former_proposal_status: superseded
replacement_adopted_explicitly: current_main_post_activation_validation
silent_evidence_substitution: no
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

This decision does not implement KROAD-011 and does not itself complete KROAD-010.
