# Claim Boundaries — EV4 Decision Kernel

Status: Draft / Wave 0 governance boundary  
Scope: Claims that EV4 stages may and may not make when using Kernel planning artifacts  
Owner or intended consumer: Architect, CE, Builder, Responsive, Project Gate, Kernel maintainers

## What This Document Is

This document defines safe claim boundaries for Wave 0 and later MVK work.

## What This Document Is Not

```text
- not a runtime validation result
- not a CI result
- not a schema implementation
- not a Builder UX template
- not a release certification
```

## Confirmed Facts

```text
- Architect owns candidate generation, comparison, selection, and decision records.
- CE owns constructability proof and Builder-ready authorization.
- Builder executes only approved, locked, evidence-bound decisions.
- Responsive validates actual runtime behavior.
- Project Gate verifies evidence and authority; it does not design.
- Kernel owns shared contracts and hard gates; it does not choose section-specific design.
```

## Proposed Approach

Allowed claim examples:

```text
Architect may claim: selected architecture recorded.
CE may claim: constructability proven, if evidence and closure exist.
Builder may claim: control/value/unit/class/path resolved, if upstream records and evidence exist.
Responsive may claim: runtime behavior validated, if actual runtime evidence exists.
Project Gate may claim: packet accepted or rejected by verifier checks, if those checks exist and ran.
Kernel may claim: contract shape planned, if only planning docs exist.
```

Forbidden claim examples:

```text
Planning doc exists -> MVK implemented.
Schema-valid -> semantic-valid.
Semantic-valid -> runtime-valid.
Builder instruction emitted -> Builder executed.
Project Gate accepted packet -> Elementor design was correct.
UX template used -> constructability proven.
```

## Open Decisions

```text
- exact field used to carry claim status
- exact validation report wording
- exact distinction between static, semantic, and runtime validation outputs
```

## Acceptance Criteria

```text
- No stage can claim another stage's authority.
- Planning artifacts cannot be reported as implementation readiness.
- Runtime claims require runtime evidence.
- Project Gate remains verifier-only.
```

## What Must Not Be Done Yet

```text
- do not claim CI enforcement from this document
- do not claim runtime validation from static planning
- do not let Builder claim CE closure
- do not let Project Gate make Elementor design decisions
- do not use UX boundary text as proof of constructability
```