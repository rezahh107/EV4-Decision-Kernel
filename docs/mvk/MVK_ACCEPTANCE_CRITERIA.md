# MVK Acceptance Criteria — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Acceptance criteria for future MVK implementation readiness  
Owner or intended consumer: EV4 Decision Kernel maintainers and future reviewers

## What This Document Is

This document lists the checks a later MVK implementation must satisfy before it can be treated as useful.

## What This Document Is Not

```text
- not proof that the MVK is implemented
- not a CI result
- not runtime validation
- not a release checklist
- not a migration guide
```

## Confirmed Facts

```text
- Wave 0 creates planning artifacts only.
- The MVK must fail closed on missing CE Closure, missing Kernel pin/hash, missing containing-block proof, nested clickable topology, and unlisted Builder fallback.
- Project Gate must remain verifier-only.
```

## Proposed Approach

A future MVK implementation should be accepted only when it has:

```text
- planning docs aligned with ADR-001 through ADR-005
- schema carriers for the MVK records
- semantic validator rules for Critical gates
- valid and invalid fixtures for the vertical slice
- local validation command
- documented downstream rejection behavior
```

Minimum planned validation outcomes:

```text
PASS: valid/mvk-section-complete.json
FAIL: invalid/missing-ce-closure.json
FAIL: invalid/missing-kernel-pin.json
FAIL: invalid/absolute-without-relative-parent.json
FAIL: invalid/nested-clickable-card-button.json
FAIL: invalid/builder-unlisted-fallback.json
```

## Open Decisions

```text
- exact validator command
- exact expected output format
- exact CI wrapper name
- exact Project Gate packet error codes
```

## Acceptance Criteria

For a later implementation, all must be true:

```text
- No full platform is introduced.
- No full registry is introduced.
- No release automation is introduced.
- No reusable workflow is introduced.
- Local profile remains config/adapters only.
- Project Gate remains verifier-only.
- MVK validates static and semantic gates for the vertical slice.
- Documentation does not claim runtime validation.
```

## What Must Not Be Done Yet

```text
- do not mark MVK complete from planning docs alone
- do not claim CI enforcement from planned CI steps
- do not claim runtime behavior from static validation
- do not treat contract examples as final schemas
- do not merge or migrate other EV4 repositories from this document
```