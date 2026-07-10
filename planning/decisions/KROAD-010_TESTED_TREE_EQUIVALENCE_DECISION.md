# KROAD-010 Tested-Tree Evidence Equivalence Decision

**Status:** proposed / application evaluated fail-closed / not yet authoritative  
**Decision owner:** Kernel governance  
**Applies to:** KROAD-010 closure evidence only  
**Proposed evidence mode:** `equivalent_tested_tree`  
**Roadmap authority:** `planning/NEXT_WORK.md`

## Decision context

KROAD-010 currently requires direct successful GitHub Actions evidence for the historical activation merge commit:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
```

The direct historical Actions listing has been attempted but remains unavailable in the connected execution environment. Missing API access is not successful CI evidence and must not be represented as such.

This decision proposes a bounded fallback evidence mode. It does not silently reinterpret the existing requirement. Until this decision is independently reviewed and merged, `planning/NEXT_WORK.md` remains authoritative and KROAD-010 remains `needs_audit`.

## Proposed evidence mode

```text
evidence_mode: equivalent_tested_tree
```

This mode may be considered only when direct exact-commit Actions retrieval has been attempted and the result is explicitly classified as one of:

```text
successfully_retrieved
absent
unavailable
```

`unavailable` means the evidence could not be retrieved through the available capability. It does not mean the run succeeded, failed, or never existed.

## Required objects

The evaluation must preserve these identities independently:

```text
historical_target_commit:
  60836283d9a5ae98c3c3819c7ab33a6f40206289

reviewed_activation_head:
  f61fbf931e585b50403be2b015d34fee3a206a17

behavioral_coverage_synthetic_merge:
  ac0cb0f513486c65907c262188f2d4d0a38d2cab

bootstrap_anchor:
  aa0317a07c10acf4e398dc9e5869f4e6966569f9
```

## Mandatory equivalence criteria

All criteria are conjunctive. No criterion may be waived, inferred from prose, or replaced by a weaker proxy.

1. **Historical target identity**  
   The exact historical target remains `60836283d9a5ae98c3c3819c7ab33a6f40206289`.

2. **Direct retrieval disposition**  
   The exact-commit Actions retrieval attempt and its result are recorded as `successfully_retrieved`, `absent`, or `unavailable`. Missing API access is not success evidence.

3. **Validate MVK tested-tree identity**  
   The Git root tree OID of the historical target commit is obtained from a repository-authoritative Git object source and is byte-for-byte identical to the Git root tree OID of the commit object actually checked out by the successful `Validate MVK` run.

4. **Behavioral Coverage tested-tree identity**  
   The Git root tree OID of the historical target commit is obtained from a repository-authoritative Git object source and is byte-for-byte identical to the Git root tree OID of the synthetic merge object actually checked out by the successful `Behavioral Coverage Audit` run.

5. **Separate provenance fields**  
   Each workflow record separately preserves:

   ```text
   workflow name
   run ID and run number
   event
   run metadata head_sha
   checked-out SHA
   checked-out ref type
   checked-out ref, when applicable
   job ID
   status
   conclusion
   relevant step conclusions
   ```

   Workflow metadata `head_sha` must not be substituted for the checked-out commit object.

6. **Workflow and package-wiring byte identity**  
   The relevant workflow definitions and KROAD-010 package wiring in each tested object must have identical repository blob OIDs to the corresponding files in the historical target tree. At minimum, the comparison covers:

   ```text
   .github/workflows/validate-mvk.yml
   .github/workflows/behavioral-coverage.yml
   package.json
   package-lock.json
   ```

7. **Validate MVK artifact identity**  
   The exact-head `Validate MVK` history-matrix artifact is recorded with run association, artifact ID, artifact name, digest, creation time, expiration time, and availability/expiration state.

8. **History-sensitive behavior remains separate**  
   The deterministic history matrix must successfully cover `merge_commit`, `squash`, and `rebase` behavior with the required diagnostics and clean-worktree assertions. Ordinary tree equality does not replace history-sensitive testing.

9. **Bootstrap ancestry**  
   Repository-authoritative ancestry evidence must show that the activation merge is descended from bootstrap anchor `aa0317a07c10acf4e398dc9e5869f4e6966569f9`.

10. **Post-activation change classification**  
    Every path changed from the activation merge to the evaluated current `main` must be classified by path and semantics. No executable Kernel, schema, validator, fixture, package-wiring, or workflow change may be hidden behind a documentation-only claim.

11. **Fail-closed uncertainty handling**  
    Any missing, inaccessible, unequal, malformed, or ambiguous required object causes the equivalence evaluation to fail. A zero-file compare is supporting evidence only and does not replace required root tree OIDs.

12. **Bounded claim surface**  
    Successful equivalence proves only the bounded KROAD-010 validation requirement for the Kernel-local consumer contract. It does not prove:

    ```text
    live downstream-repository enforcement
    runtime/browser behavior
    Builder execution
    Project Gate acceptance
    ecosystem readiness
    production readiness
    ```

## Why tree identity is necessary but not sufficient

A Git root tree OID commits to the complete checked-out file hierarchy, including file names, modes, blob identities, and nested trees. Equality of root tree OIDs therefore establishes executable-content identity for the compared snapshots.

Commit identity remains distinct because commits also encode parent relationships, authorship/committer metadata, timestamps, and messages. Event provenance remains distinct because a `pull_request` run, a synthetic merge run, and a `push` run have different execution provenance even when their tested trees are identical. History-sensitive behavior remains distinct because ancestry, merge topology, squash behavior, and rebase behavior are not proved by snapshot equality.

Therefore a valid closure record must preserve all three layers separately:

```text
snapshot identity: Git root tree OID
commit and event provenance: commit SHA, event, checked-out object, run/job identity
history behavior: deterministic merge/squash/rebase matrix evidence
```

## Adoption rule

This proposal becomes an active KROAD-010 evidence option only after independent review and merge of the governance change. Applying it requires a separate recorded evaluation against every mandatory criterion.

If the application passes, `planning/NEXT_WORK.md` may record:

```text
KROAD-010: complete
KROAD-011: next_allowed
completion_evidence_mode: equivalent_tested_tree
```

If any criterion fails or remains unavailable, the required result is:

```text
KROAD-010: needs_audit
KROAD-011: blocked
completion_evidence_mode: not_satisfied
```

This document does not itself close KROAD-010.

---

## Application evaluation — 2026-07-10

### Evaluated repository state

```text
current_main_head: 56a730fc3bbf6939bdb49dd81e25ae0421c376e2
pr_36_merge_commit: 56a730fc3bbf6939bdb49dd81e25ae0421c376e2
historical_target_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
reviewed_activation_head: f61fbf931e585b50403be2b015d34fee3a206a17
behavioral_coverage_synthetic_merge: ac0cb0f513486c65907c262188f2d4d0a38d2cab
bootstrap_anchor: aa0317a07c10acf4e398dc9e5869f4e6966569f9
direct_historical_actions_retrieval: unavailable
```

The synthetic merge commit remains retrievable as a GitHub commit object and through repository comparison. Its root tree OID is not exposed by the available connector capability.

### Workflow provenance used

#### Validate MVK

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

All reported job steps succeeded, including exact-head checkout, source/JSON validation, MVK fixtures and gates, roadmap-memory validation, prototype integrity, merge/squash/rebase history matrix, and artifact upload.

#### Behavioral Coverage Audit

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

All reported job steps succeeded. This remains synthetic-merge integration evidence, not exact PR-head evidence.

### Workflow and package-wiring blob comparison

The repository blob OIDs are identical across the historical target, reviewed activation head, and synthetic merge object:

```text
.github/workflows/validate-mvk.yml
  blob_oid: 839d31bde67de02244fa45b1660534f3d11a4ab8

.github/workflows/behavioral-coverage.yml
  blob_oid: bbbfdf43fefcbba223549f8a1d11e77b4ae3beb9

package.json
  blob_oid: c9f05ad31b623ae7727f408de5ff3b552456c79c

package-lock.json
  blob_oid: 2ff0905552ee0b0563a5fdd0fbcc9e1e1a256543
```

This satisfies the bounded file-level byte-identity criterion, but it does not establish complete root tree identity.

### History-matrix artifact

```text
run_id: 29111998786
artifact_id: 8235134860
artifact_name: kroad-010-history-matrix
digest: sha256:0f3b2370957958aab14cc826355b5c45158edf4bf8847c123338e5bd5e9cd607
created_at: 2026-07-10T17:44:07Z
expires_at: 2026-07-24T17:44:07Z
expired: false
artifact_head_sha: f61fbf931e585b50403be2b015d34fee3a206a17
```

### Ancestry and comparisons

Repository comparison established:

```text
bootstrap aa0317a... -> activation 60836283...
  status: ahead
  merge_base: aa0317a07c10acf4e398dc9e5869f4e6966569f9
  result: bootstrap ancestry confirmed

reviewed head f61fbf... -> activation 60836283...
  status: ahead by 1
  files: []

synthetic merge ac0cb0... <-> activation 60836283...
  status: diverged by one commit on each side
  merge_base: f61fbf931e585b50403be2b015d34fee3a206a17
  files: []
```

The zero-file comparisons are supporting evidence only. They are not substituted for the required root tree OIDs.

### Post-activation change classification

The activation commit is nine commits behind evaluated current `main`. The only changed paths are:

```text
docs/decision-governance/KROAD_010_DOWNSTREAM_CONSUMER_CONTRACT.md
  classification: documentation

planning/NEXT_WORK.md
  classification: roadmap/status documentation

planning/reviews/KROAD-010_DOWNSTREAM_CONSUMER_POST_MERGE_REVIEW.md
  classification: evidence/review documentation
```

No executable Kernel, schema, validator, fixture, package-wiring, or workflow path changed after the activation merge.

### Root tree OID retrieval result

The following required values remain unavailable:

```text
tree_oid(60836283d9a5ae98c3c3819c7ab33a6f40206289)
tree_oid(f61fbf931e585b50403be2b015d34fee3a206a17)
tree_oid(ac0cb0f513486c65907c262188f2d4d0a38d2cab)
```

Observed capability limits:

- the connected `fetch_commit` response exposes commit identity and diff but not the root tree OID;
- a verified local clone and authenticated `gh` client are unavailable;
- direct external GitHub API access is unavailable from the execution container;
- GitHub Git Database `create_tree` correctly rejected commit SHAs as invalid `base_tree` values with HTTP 422, so no tree OID was inferred or manufactured.

### Criterion results

```text
1  historical target identity: PASS
2  direct retrieval disposition recorded: PASS (unavailable)
3  Validate MVK root tree equality: UNAVAILABLE / BLOCKING
4  Behavioral Coverage root tree equality: UNAVAILABLE / BLOCKING
5  separate workflow provenance: PASS
6  workflow and package-wiring blob identity: PASS
7  Validate MVK artifact identity: PASS
8  merge/squash/rebase history evidence: PASS
9  bootstrap ancestry: PASS
10 post-activation change classification: PASS
11 fail-closed uncertainty handling: PASS / INVOKED
12 bounded claim surface: PASS
```

### Equivalence decision

```text
equivalence_result: not_satisfied
blocking_criteria:
  - criterion_3_validate_mvk_root_tree_oid
  - criterion_4_behavioral_coverage_root_tree_oid
KROAD-010: needs_audit
KROAD-011: blocked
completion_evidence_mode: not_satisfied
```

The bounded equivalence rule is not weakened. Direct historical Actions evidence remains a valid closure path under the current roadmap requirement. The proposed equivalence path can become usable only when the three repository-authoritative root tree OIDs are retrieved and proved identical.

No downstream enforcement, runtime/browser proof, Builder execution, Project Gate acceptance, ecosystem readiness, or production readiness is claimed.
