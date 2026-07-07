# ADR-003 — Project Gate Boundary

Status: Accepted for Wave 0 planning  
Date: 2026-07-07  
Decision type: Role and verifier boundary  
Scope: Project Gate intake and rejection authority; planning only  
Owner: EV4 Decision Kernel with Project Gate as downstream verifier

## Context

This ADR defines what Project Gate may verify when Kernel contracts are later consumed.

This ADR is not a Project Gate implementation, Elementor design rulebook, CE reasoning engine, Builder execution engine, or migration plan.

Confirmed facts:

```text
- Project Gate verifies lineage, schema validity, evidence completeness, registry version/hash, ownership, and stage authority.
- Project Gate must not make Elementor design decisions.
- Architect, CE, Builder, and Responsive each own separate decision or validation stages.
```

Proposed approach:

```text
Project Gate accepts or rejects packets based on completeness, authority, pin/hash, declared schema validity, evidence references, and required stage outputs.
Project Gate does not decide whether SVG or Image is the better design choice, whether Flexbox or Grid is best, or whether a CE argument is persuasive beyond required closure fields.
```

Open decisions:

```text
- Exact Project Gate packet schema.
- Exact error codes for missing Kernel pin/hash.
- Exact stage-authority reference format.
- Exact relationship between Project Gate and future validation-pack output.
```

## Decision

Project Gate is a verifier-only consumer of Kernel contracts.

It may reject missing or malformed packets. It may not invent, override, or optimize Elementor design decisions.

## Accepted Now

Project Gate may verify:

```text
- lineage and source references
- Kernel pin and hash presence
- schema validity claims once schemas exist
- evidence completeness
- stage authority
- ownership boundaries
- validation report presence
- required contract references
```

Project Gate must not verify as a domain owner:

```text
- SVG vs Image design choice
- Flexbox vs Grid design choice
- CE constructability reasoning itself
- Builder UI-path selection itself
- Responsive runtime correctness without runtime evidence
```

## Deferred

```text
- Project Gate validator implementation
- Project Gate schema files
- CI integration
- cross-repository acceptance automation
- signed validation reports
```

## Consequences

Project Gate can fail closed on missing evidence without taking over domain work.

Architect, CE, Builder, and Responsive remain accountable for their own stage outputs.

This limits false authority and prevents a verifier from becoming a design engine.

## Alternatives Considered

```text
1. Let Project Gate make final design decisions.
2. Let Project Gate only check file presence.
3. Skip Project Gate and let Builder decide readiness.
```

## Rejected Options

```text
- Gate as design owner: rejected because it violates role boundaries.
- File-presence-only Gate: rejected because it allows shallow compliance.
- Builder readiness self-certification: rejected because Builder must not authorize its own upstream evidence.
```

## Acceptance Criteria

```text
- Project Gate boundary remains verifier-only.
- Missing CE Closure is later rejectable.
- Missing Kernel pin/hash is later rejectable.
- Missing evidence references are later rejectable.
- Domain decisions remain in owner stages.
```

## What This ADR Does Not Authorize

```text
- adding Project Gate code
- changing EV4-Project-Gate
- creating schemas or validators
- claiming Gate validation is enforced
- using Gate to choose section-specific Elementor architecture
```