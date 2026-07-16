# AIGOV Exact-Main Closure Protocol

**Status:** active V3 verification protocol; not a Merge authorization
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3`
**Previous plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`

## General evidence rule

A PR head, successful CI, target-authored record, caller-supplied actor, schema-valid lookalike, review artifact or Merge metadata alone does not establish completion. `tools/verify-aigov-v3-exact-main.mjs` derives live repository, PR, exact-head CI, Merge actor, current `main` and ancestry evidence. Caller-supplied booleans are not accepted as authority.

## Batch A one-time reconciliation

The only retrospective exception is:

```yaml
repository: rezahh107/EV4-Decision-Kernel
pr_number: 49
head_sha: c141923bf411f802f1673acf06dc92a77b415593
merge_commit_sha: 86e25a9073df7e257ca7df799de85baf9b3fafb0
exception_plan_id: GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3
reason: impossible_retrospective_review_cycle
reusable: false
precedential: false
```

The verifier must confirm:

- authoritative Merge of PR #49;
- exact final head and Merge commit identity;
- owner Merge;
- final head and Merge commit ancestry on current `main`;
- Green exact-head CI for the final PR #49 head;
- Green current-main validation covering AIGOV, roadmap memory, Coverage and MVK;
- preserved `KROAD-012` through `KROAD-018`;
- `KROAD-012R: historical_non_authoritative`;
- Coverage non-promotion and no product activation.

The exception does not require or permit fabrication of a pre-Merge Green receipt, a new retrospective PR-Inspector verdict, a separate reconciliation PR or a third implementation PR. Its pass result must state:

```yaml
batch_id: BATCH_A
status: pass
closure_mode: v3_one_time_evidence_reconciliation
historical_review_green_claimed: false
retrospective_review_required: false
exception_reusable: false
```

## Batch B exact-head and exact-main rule

Batch B has no exception. Before Merge, its exact final head and exact `scope_revision` require Green exact-head CI and an independent PR-Inspector Green verdict. Any head or scope mutation invalidates prior CI and review.

After the owner Merge, the verifier accepts that same pre-Merge review when:

- the review was completed after exact-head CI and before Merge;
- the review binds the exact final head, PR and scope;
- the owner performed the Merge;
- the reviewed head and Merge commit reached current `main` by ancestry;
- current-main validation is Green;
- Coverage remains non-promoted and product work remains inactive.

A second independent review after Merge is neither required nor accepted as a substitute for the pre-Merge review. A generated exact-main report may be retained as evidence, but absence of a separately published post-Merge external receipt cannot create a permanent closure deadlock.

## Recovery-program boundary

`DCOV-COVERAGE-EXECUTION-PROGRAM` and `KREC-001` through `KREC-009` are registration-only carriers. They do not supersede KROAD items, activate tasks, implement recovery work, grant Coverage credit or establish readiness.

## Merge boundary

The implementation agent cannot issue `GREEN_MERGE_RECOMMENDED`, approve, Merge or enable auto-merge. Merge authority remains owner-only.
