# Wave 0 Decision Log — EV4 Decision Kernel

Status: Draft / Wave 0 governance log  
Scope: Decision trace for Wave 0 ADR and MVK planning artifacts  
Owner or intended consumer: EV4 Decision Kernel maintainers and reviewers

## What This Document Is

This document records the decisions captured during Wave 0 planning.

## What This Document Is Not

```text
- not an implementation log
- not a release note
- not a CI report
- not runtime validation evidence
- not a migration record
```

## Confirmed Facts

```text
- Current architecture decision: MODIFY_ARCHITECTURE.
- Wave 0 is governance and planning only.
- ADR-001 through ADR-005 are the controlling Wave 0 decisions.
```

## Proposed Approach

Use this log as the short index for what Wave 0 accepted and deferred.

## Decision Entries

```text
D-001: Keep Kernel ownership separate and role-neutral.
D-002: Use vendored/pinned snapshot before release automation.
D-003: Keep Project Gate verifier-only.
D-004: Define local profiles as config/adapters only, not rule forks.
D-005: Limit MVK to the narrow vertical slice and Critical hard gates.
```

## Open Decisions

```text
- exact future schema layout
- exact validator implementation language
- exact fixture file names
- exact Kernel pin hash algorithm
- exact Project Gate packet error codes
```

## Acceptance Criteria

```text
- Decision entries map to ADR files.
- Deferred items remain explicit.
- No implementation readiness is claimed.
- No release or workflow automation is implied.
```

## What Must Not Be Done Yet

```text
- do not treat this log as a release changelog
- do not claim schemas or validators exist
- do not claim CI passed
- do not claim runtime validation
- do not use this log to modify other EV4 repositories
```