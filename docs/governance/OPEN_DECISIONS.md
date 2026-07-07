# Open Decisions — EV4 Decision Kernel

Status: Draft / Wave 0 governance register  
Scope: Open questions intentionally left unresolved after Wave 0 planning  
Owner or intended consumer: EV4 Decision Kernel maintainers and future implementation prompt authors

## What This Document Is

This document lists decisions that must remain open until a later scoped implementation wave.

## What This Document Is Not

```text
- not a backlog for broad implementation
- not authorization to implement the full Kernel
- not a release plan
- not a migration plan
- not a CI plan
```

## Confirmed Facts

```text
- Wave 0 does not create schemas, validators, fixtures, release automation, migrations, or reusable workflows.
- The MVK scope is deliberately small.
- Project Gate remains verifier-only.
```

## Proposed Approach

Use later prompts to close one narrow decision group at a time.

## Open Decisions

```text
OD-001: Exact schema directory layout under kernel/schemas/.
OD-002: Exact schema language and versioning convention.
OD-003: Exact validator language and command shape.
OD-004: Exact valid/invalid fixture filenames and payloads.
OD-005: Exact Kernel pin hash algorithm and hash coverage set.
OD-006: Exact Project Gate packet error code system.
OD-007: Exact Responsive Runtime Validation Record shape.
OD-008: Exact local profile file shape for profile.yaml and adapter-map.yaml.
OD-009: Exact definition of Builder-ready after CE Closure.
OD-010: Exact promotion rule from MVK planning to implemented Kernel contracts.
```

## Acceptance Criteria

```text
- Each open decision is small enough for a later focused patch.
- Open decisions do not silently authorize implementation.
- Deferred automation remains deferred.
- Decisions affecting other EV4 repositories require explicit later scope.
```

## What Must Not Be Done Yet

```text
- do not close open decisions by assumption
- do not add broad registries while closing one decision
- do not add workflow automation while defining schema shapes
- do not edit other EV4 repositories from this register
- do not claim Wave 0 implements the MVK
```