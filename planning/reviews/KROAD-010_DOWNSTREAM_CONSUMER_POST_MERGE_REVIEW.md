# KROAD-010 Downstream Consumer Contract — Post-Merge Review

**Status:** needs_audit  
**Scope:** post-merge verification record for KROAD-010 bootstrap and activation  
**Owner:** Kernel  
**Roadmap authority:** `planning/NEXT_WORK.md`

## Verified repository state

PR #33 merged the lifecycle-neutral acceptance stack to `main` as:

```text
aa0317a07c10acf4e398dc9e5869f4e6966569f9
```

PR #34 merged the activation layer to `main` as:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
```

The reviewed PR #34 head was:

```text
f61fbf931e585b50403be2b015d34fee3a206a17
```

Git comparison confirms that the merge commit is one commit ahead of the reviewed head, the reviewed head is its merge base, and there are no file differences between the reviewed head and the resulting merge commit.

## Confirmed pre-merge evidence

On exact PR #34 head `f61fbf931e585b50403be2b015d34fee3a206a17`:

```text
Validate MVK — run 372 — success
Behavioral Coverage Audit — run 340 — success
```

The Validate MVK job confirmed:

```text
source syntax and JSON — success
MVK fixtures and gates — success
roadmap memory — success
prototype integrity — success
merge/squash/rebase history matrix — success
history matrix artifact upload — success
```

History matrix artifact:

```text
artifact_id: 8235134860
digest: sha256:0f3b2370957958aab14cc826355b5c45158edf4bf8847c123338e5bd5e9cd607
```

## Confirmed implementation state

The merged activation:

- pins all seven ordinary Consumer Record fixtures to merged bootstrap commit `aa0317a07c10acf4e398dc9e5869f4e6966569f9`;
- activates `primary -> canonical-lock -> lineage` exactly once and in that order;
- preserves production ancestor and byte-equality checks;
- includes deterministic merge-commit, squash, and rebase history testing;
- keeps prototype-pollution regression coverage;
- does not claim live downstream enforcement, runtime proof, Builder execution proof, Project Gate acceptance, or production readiness.

## Remaining evidence gap

A direct GitHub Actions result associated with merged `main` commit `60836283d9a5ae98c3c3819c7ab33a6f40206289` was not available through the connected inspection path. The combined commit-status result contained no visible status entries.

Therefore this record does not claim direct final-`main` CI confirmation.

## Decision

```text
KROAD-010: needs_audit
KROAD-011: blocked
```

KROAD-010 must remain unchecked until a direct validation run on the current `main` commit is observed and recorded. Tree equality with the green PR head is strong supporting evidence, but it is not substituted for the explicit final-`main` validation gate required by the roadmap.

## Exact next action

Verify or rerun the `Validate MVK` and `Behavioral Coverage Audit` workflows on current `main` commit:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
```

After both workflows succeed, update `planning/NEXT_WORK.md` to mark KROAD-010 complete and make KROAD-011 the next allowed task.
