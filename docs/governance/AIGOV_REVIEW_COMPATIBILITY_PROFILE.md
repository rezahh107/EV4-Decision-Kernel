# AIGOV Independent Review Compatibility Profile

**Status:** active Batch A protocol  
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`  
**Owner:** repository owner for Merge administration; external AI reviewer for technical verdict

## Boundary

An implementation agent is not an independent reviewer. A repository file, PR body, CI result, owner approval, or target-authored statement cannot substitute for an external review receipt.

## Required Input

The reviewer receives the exact repository, PR number, base SHA, head SHA, `scope_revision`, scope manifest, changed paths, validation results, known limitations, and forbidden claims. Any head or scope revision change invalidates the review.

## Receipt Contract

The external result must conform to `kernel/schemas/aigov-review-receipt.v1.schema.json` and use one verdict:

```text
GREEN_MERGE_RECOMMENDED
YELLOW_REPAIR_OR_VERIFICATION_REQUIRED
RED_DO_NOT_MERGE
BLOCKED_INSUFFICIENT_EVIDENCE
```

The reviewer and implementer identities must differ. A Green verdict is technical evidence only; it does not grant Merge authority. Merge remains `owner_only`.

## Staleness

The receipt is stale when `head_sha` or `scope_revision` differs from the current PR. Stale receipts fail closed and must not be carried forward to a repaired head.

## Forbidden Claims

- PR Merge is not exact-main completion.
- Human approval is not technical Green.
- Coaching or review prose is not completion evidence.
- Coverage remains `not_measurable_pending_external_promotion`.
- `KROAD-012R` remains `historical_non_authoritative`.
- `KROAD-012` through `KROAD-018` retain their original meanings.
