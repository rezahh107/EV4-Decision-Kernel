# AIGOV Review Compatibility Profile

**Status:** historical compatibility and optional advisory guidance
**Active owner policy:** mandatory independent review removed repository-wide

## Current rule

Independent AI review is optional advisory evidence. Missing, stale, unavailable or differently sequenced review evidence does not block CI, owner Merge, exact-main closure, Recovery activation or implementation.

```yaml
independent_review_required: false
independent_review_policy: optional_advisory
review_merge_authority: false
historical_review_fabrication: forbidden
```

## Advisory handling

A voluntarily supplied review may still be checked for repository, head, scope and provenance so its limitations are reported accurately. It must never be converted into owner Merge authority or represented as `GREEN_TECHNICALLY_READY` unless a real review produced that status.

## Historical note

Older AIGOV records and fixtures may describe a mandatory external-review sequence. Those records document the policy that existed at the time; they are not active authority after `planning/decisions/AIGOV_INDEPENDENT_REVIEW_POLICY_CHANGE.md`.

## Controls that remain active

- exact-head CI;
- declared scope and exact scope disclosure;
- owner-only Merge;
- method-aware Merge-result proof;
- current-main validation;
- Coverage/readiness overclaim protection;
- KROAD preservation;
- secret, permission and workflow safety.
