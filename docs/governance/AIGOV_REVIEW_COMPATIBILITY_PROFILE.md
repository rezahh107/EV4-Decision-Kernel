# AIGOV Independent Review Compatibility Profile

**Status:** active Batch A protocol
**Plan:** `GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2`
**Owner:** repository owner for Merge administration; external AI reviewer for technical verdict

## Boundary

An implementation agent is not an independent reviewer. A repository file, PR body, CI result, owner approval, or target-authored statement cannot substitute for an external review receipt.

## Required Input

The reviewer receives the exact repository, PR number, base SHA, head SHA, `scope_revision`, scope manifest, changed paths, validation results, known limitations, and forbidden claims. Any head or scope revision change invalidates the review.

## Receipt Contract

The external result must conform to `kernel/schemas/aigov-review-receipt.v1.schema.json` before any semantic field is read. The active receipt schema is `aigov-review-receipt.v2` and binds repository ID/name, PR #49, exact base/head, `scope_revision`, review time, derived reviewer identity, PR-author implementer identity, exact inspector repository/commit/protocol, authoritative exact-head CI digest, canonical review-package hash, review-package file-byte hash, projection hash, manifest hash and all canonical artifact declarations.

The authoritative technical result is the validated PR Inspector review package status:

```text
GREEN_TECHNICALLY_READY
YELLOW_CHANGES_OR_VERIFICATION_REQUIRED
RED_DO_NOT_MERGE
```

Different identity strings, `independent: true`, a provider label, PR prose or a local JSON file do not prove independence. Provenance is established only when the verifier retrieves and enumerates the official review directory at the exact external `rezahh107/PR-Inspector` commit, verifies repository ID `1288323264`, active protocol `v1.10.1`, full schemas, canonical projection equality, deterministic derived bytes and manifest, Git blob SHAs and all recomputed hashes, and derives the reviewer identity from that verified source. The review timestamp must follow the verified exact-head GitHub Actions completion time. A Green result is technical evidence only; it does not grant Merge authority. Merge remains `owner_only`.

## Staleness

The receipt is stale when `head_sha` or `scope_revision` differs from the current PR. Stale receipts fail closed and must not be carried forward to a repaired head.

The immutable receipt path must be:

```text
reviews/EV4-Decision-Kernel/pr-49/<exact-head>/<scope-revision-hex>/aigov-review-receipt.json
```

## Forbidden Claims

- PR Merge is not exact-main completion.
- Human approval is not technical Green.
- Coaching or review prose is not completion evidence.
- Coverage remains `not_measurable_pending_external_promotion`.
- `KROAD-012R` remains `historical_non_authoritative`.
- `KROAD-012` through `KROAD-018` retain their original meanings.
