# ADR-002 — Distribution Model

Status: Accepted for Wave 0 planning  
Date: 2026-07-07  
Decision type: Distribution and consumption boundary  
Scope: How future EV4 repositories should consume Kernel artifacts; planning only  
Owner: EV4 Decision Kernel

## Context

This ADR is a scoped distribution decision for future Kernel consumption.

This ADR is not a release pipeline, GitHub Actions workflow, package manager integration, reusable workflow, or migration mechanism.

Confirmed facts:

```text
- Current architecture decision adopts vendored/pinned snapshot before releases.
- Current architecture decision adopts local CI wrapper before reusable workflow.
- Release automation, reusable workflow centralization, migrations, docs monitoring, and signed outputs are deferred.
```

Proposed approach:

```text
Wave 1 consumers should use an explicit vendored Kernel snapshot plus KERNEL_PIN.json.
The pin must carry a source commit or release reference and content hash.
No EV4 repository should consume floating main as an executable contract source.
```

Open decisions:

```text
- Exact hash algorithm.
- Exact pin file schema.
- Exact release artifact layout after MVK proves useful.
- Exact CI wrapper command shape.
```

## Decision

The initial distribution model is:

```text
1. Wave 0: planning documents only.
2. Wave 1: vendored/pinned snapshot with local repository wrapper.
3. Later: GitHub Release artifact if the MVK becomes stable.
4. Later: reusable workflow only after local wrappers prove the enforcement path.
```

Floating consumption from `main` is rejected.

## Accepted Now

```text
- Future consumers must declare a Kernel pin before claiming Kernel-backed validation.
- The pin must include enough information to reject mismatched or missing Kernel content.
- Local repositories may wrap validation locally.
- Local wrappers must not redefine Kernel rules.
```

## Deferred

```text
- GitHub Release automation
- reusable workflow centralization
- signed validation outputs
- automated docs monitoring
- migration automation
- package publication
```

## Consequences

The first real implementation can be tested locally without centralizing CI too early.

Consumers will need a small `KERNEL_PIN.json` and a local wrapper, but the wrapper remains an adapter, not a rule fork.

Hash mismatch becomes a future Project Gate rejection condition.

## Alternatives Considered

```text
1. Consume `main` directly from every EV4 repository.
2. Start with GitHub Releases immediately.
3. Start with a reusable workflow immediately.
4. Copy contract prose manually into every repository.
```

## Rejected Options

```text
- Floating main: rejected because validation behavior would change without local review.
- Immediate reusable workflow: rejected because MVK enforcement is not proven yet.
- Manual prose copy: rejected because it creates drift and weak enforcement.
```

## Acceptance Criteria

```text
- Distribution remains pin-first.
- Local profiles and wrappers cannot fork Kernel rule logic.
- Project Gate can later reject missing pin/hash.
- No release automation is created by this ADR.
- No reusable workflow is created by this ADR.
```

## What This ADR Does Not Authorize

```text
- creating GitHub Releases
- creating `.github/workflows/*`
- creating reusable workflows
- changing other EV4 repositories
- claiming CI enforcement
- claiming runtime validation
- treating planned YAML shapes as final schemas
```