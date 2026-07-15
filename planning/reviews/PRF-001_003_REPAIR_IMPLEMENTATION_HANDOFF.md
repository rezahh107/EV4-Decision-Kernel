# PRF-001 through PRF-003 Repair Implementation Handoff

## Classification

- `record_kind`: `implementation_handoff`
- `authority_status`: `non_authoritative`
- `action_kind`: `repair_and_verify`
- `protocol_version`: `v1.10.1`
- `reviewed_head_sha`: `555afc6dfa0524ba7c8f876f95a241638a4db9f1`
- `reviewed_base_sha`: `487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8`
- `review_package_sha256`: `8b139a6fbe33de209b2f07c0ecc188ea0e9b3f57aec4fec6255c0a6feffad18c`
- `active_external_issuer_sha`: `7a21045366bb9ad1ca2f950b8341ebb867dd8a52`
- `resulting_head_sha`: `derive_from_git_commit_containing_this_record`
- `merge_performed`: `false`
- `approval_performed`: `false`
- `deployment_performed`: `false`

This record documents implementation work only. It is not project-owner governance approval, security/domain-specialist approval, source-of-record promotion, implementation eligibility, merge authorization, trusted ingestion, or Coverage proof credit.

## PRF-001 — External authority boundary

Implemented fail-closed behavior:

- candidate Coverage artifacts remain `proposal_pending_external_governance_approval`;
- target repository content, CI success, merge metadata and self-authored closure cannot approve the proposal;
- Coverage state remains `not_measurable_pending_external_promotion` while approval is absent;
- KROAD-012 remains the only next-allowed roadmap item;
- KROAD-012 through KROAD-018 are not superseded by target-authored proposal content;
- negative authority tests reject merge status, CI success, target declaration and self-authored closure as promotion authority.

## PRF-002 — Active issuer and exact topology

Implemented:

- target workflow pinned to immutable active issuer `7a21045366bb9ad1ca2f950b8341ebb867dd8a52`;
- protected validation contains exactly the approved immutable checkout and one fail-propagating bash validation step;
- the validation step uses only the four externally verified Coverage identity outputs;
- externally bound checkout, clean-worktree and exact-HEAD assertions, `npm ci` and `npm run validate:coverage` execute in the protected boundary;
- unrelated MVK, roadmap and history regressions execute in a dependent separate job;
- shallow exact-head checkouts hydrate only authoritative target history after repository/origin/head verification, without changing the worktree.

## PRF-003 — Enforcement-surface impact coverage

Implemented:

- `.github/workflows/validate-mvk.yml` is coverage-sensitive;
- `package.json` is coverage-sensitive;
- the full `kernel/validator/validate-coverage-guarantee` prefix is coverage-sensitive;
- single-path missing-impact fixtures cover workflow, package, PRF-010 validator and legacy validator changes;
- an exact-path mismatch adversarial fixture covers incomplete enforcement-surface records;
- the current Coverage Impact Record is bound to the recomputed sensitive diff.

## Final review-gap repair

The final bounded pass additionally:

- replaced the contradictory active Coverage execution section with an explicitly proposed, non-executable package mapping;
- made the promotion validator inspect the exact proposal section rather than accepting an unrelated `proposed` substring elsewhere in the document;
- made the enforcement mutation matrix execute the real `impactRequirementDiagnostics()` path through an isolated legacy-validator self-test instead of synthesizing expected diagnostic codes;
- retained `planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md` as a historical, non-authoritative history-matrix fixture;
- removed every temporary repair carrier before the resulting source commit.

The source-changing repair commit was validated before push. This handoff-only follow-up creates the exact head on which normal GitHub Actions and fresh independent review must run.

## Preserved boundaries

- Coverage thresholds remain 90/95/100.
- No denominator member was removed.
- Element and Question percentages remain `null` while denominators are unresolved.
- `proof_credit_authorized` remains `false`.
- Trusted ingestion remains unauthorized.
- Existing PRF-001 through PRF-012 semantics are not declared finally closed by this record.

## Required next evidence

- fresh exact-head active-issuer CI on the commit containing this record;
- immutable workflow, job and artifact evidence;
- current-head independent PR Inspector re-review;
- external project-owner governance confirmation where required;
- current-head security/domain-specialist review;
- verified sequence-CI or repository-hosted minimum-security enforcement evidence.
