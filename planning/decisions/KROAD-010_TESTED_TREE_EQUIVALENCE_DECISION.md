# KROAD-010 Tested-Tree Evidence Equivalence Decision

**Status:** proposed / not yet authoritative  
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
