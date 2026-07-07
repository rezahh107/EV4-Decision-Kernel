# ADR-001 — Kernel Ownership and Repository Boundary

Status: Accepted for Wave 0 planning  
Date: 2026-07-07  
Decision type: Governance boundary  
Scope: Kernel repository ownership, cross-repository boundary, and non-authoritative planning only  
Owner: EV4 Decision Kernel

## Context

This ADR is a Wave 0 boundary decision for `rezahh107/EV4-Decision-Kernel`.

This ADR is not a full Kernel implementation, schema release, registry population, migration plan, or reusable workflow authorization.

Confirmed facts:

```text
- README.md defines the Kernel as the shared governance, evidence, and decision-contract layer.
- AGENTS.md restricts current work to Wave 0 / MVK planning.
- Project Gate must verify lineage, schema validity, evidence completeness, registry version/hash, ownership, and stage authority.
- Project Gate must not make Elementor design decisions.
```

Proposed approach:

```text
Keep the Kernel as the owner of shared vocabulary, evidence model, registry envelope, hard gates, decision-record contracts, fixture strategy, and validation-pack shape.
Keep Project Gate as verifier only.
Keep EV4 role repositories responsible for their own domain decisions and execution evidence.
```

Open decisions:

```text
- Exact future schema layout under kernel/schemas/.
- Exact promotion rule for a Kernel artifact to become release-consumable.
- Exact mapping between Kernel contract IDs and local EV4 repository profiles.
```

## Decision

`EV4-Decision-Kernel` remains the planning and future source repository for shared Kernel contracts.

The Kernel owns shared role-neutral contract language and hard-gate definitions. It does not choose a section-specific Elementor design and does not execute Builder actions.

Project Gate consumes Kernel-defined evidence and pins later, but does not become the owner of Elementor domain decisions.

## Accepted Now

```text
- Kernel owns shared vocabulary, evidence model, registry envelope, hard gates, decision-record schemas, fixture strategy, and validation-pack shape.
- Architect owns candidate generation, comparison, selection, and decision records.
- CE owns constructability proof and Builder-ready authorization.
- Builder owns execution resolution only after approved, locked, evidence-bound decisions.
- Responsive owns runtime validation.
- Project Gate owns verification of lineage, hashes, evidence completeness, schema validity, ownership, and stage authority.
```

## Deferred

```text
- canonical schema implementation
- full registry population
- release artifact generation
- cross-repository migration
- reusable workflow centralization
- signed validation output
```

## Consequences

This keeps the repository small and prevents Project Gate from becoming an Elementor design engine.

Future consumers must treat Kernel outputs as pinned contract inputs, not as floating prose copied from `main`.

Local EV4 repositories can adapt paths and wrappers, but cannot fork Kernel rule meaning.

## Alternatives Considered

```text
1. Put the Kernel inside EV4-Shared-Contracts.
2. Let Project Gate own Kernel rules directly.
3. Keep all rules as local prompt prose in each EV4 repository.
```

## Rejected Options

```text
- Project Gate as Elementor domain owner: rejected because Gate would blur verification and design authority.
- Local rule forks: rejected because they would create inconsistent downstream behavior.
- Full platform implementation in Wave 0: rejected because ADRs and MVK scope are not locked yet.
```

## Acceptance Criteria

```text
- Kernel ownership is explicit.
- Project Gate remains verifier-only.
- Local profiles are config/adapters only, not rule forks.
- No schema, validator, registry, release, or workflow implementation is authorized by this ADR.
- Open decisions remain visible instead of being silently closed.
```

## What This ADR Does Not Authorize

```text
- implementing the full Kernel
- creating canonical schemas
- creating release automation
- creating reusable workflows
- migrating other EV4 repositories
- allowing Project Gate to choose Elementor design decisions
- allowing Builder to invent architecture
```