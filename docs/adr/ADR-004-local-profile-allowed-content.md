# ADR-004 — Local Profile Allowed Content

Status: Accepted for Wave 0 planning  
Date: 2026-07-07  
Decision type: Local adapter boundary  
Scope: Future `decision-kernel-profile/` contents in EV4 repositories; planning only  
Owner: EV4 Decision Kernel

## Context

This ADR defines what a future local profile may contain.

This ADR is not a local profile implementation, migration instruction, validator, reusable workflow, or permission to edit other EV4 repositories.

Confirmed facts:

```text
- Current architecture adopts local profile without rule fork.
- Future local profiles may contain KERNEL_PIN.json, profile.yaml, adapter-map.yaml, local CI wrapper, and README.md.
- Local profiles must not weaken Kernel hard gates or evidence vocabulary.
```

Proposed approach:

```text
A local profile is an adapter from Kernel contracts to a repository's local paths and role activation map.
It may configure consumption.
It may not redefine the meaning of Kernel rules.
```

Open decisions:

```text
- Exact profile.yaml shape.
- Exact adapter-map.yaml shape.
- Exact naming of local wrapper commands.
- Exact compatibility field values.
```

## Decision

Local profiles are allowed only as configuration and adapter layers.

They must not become local Kernel forks.

## Accepted Now

Allowed future local profile contents:

```text
- KERNEL_PIN.json
- profile.yaml
- adapter-map.yaml
- local-ci-wrapper.*
- README.md
- role activation map
- local path mapping
- compatibility note
- local wrapper invocation
```

Forbidden local profile contents:

```text
- forked rule logic
- weakened hard gates
- changed evidence vocabulary meaning
- local override that lets Builder invent architecture
- local override that lets Project Gate make domain decisions
- silent acceptance of missing CE Closure
```

## Deferred

```text
- creating local profiles in other EV4 repositories
- implementing profile schema
- implementing adapter validation
- implementing local wrappers
- implementing cross-repo migration
```

## Consequences

Each EV4 repository can integrate the Kernel without losing local file layout flexibility.

The Kernel remains the shared source of rule meaning, while local repositories provide only paths, adapters, and wrapper commands.

## Alternatives Considered

```text
1. No local profile; every repository must use identical layout.
2. Full local profile override; each repository may redefine Kernel behavior.
3. Store all local profile details centrally in Kernel.
```

## Rejected Options

```text
- Identical layout requirement: rejected because EV4 repositories have different local structures.
- Full local overrides: rejected because they would fork rules.
- Centralized local details: rejected because Kernel should not own repository-specific execution layout.
```

## Acceptance Criteria

```text
- Local profiles are config/adapters only.
- Kernel rule logic remains shared.
- Missing CE Closure cannot be locally bypassed.
- Builder architecture invention cannot be locally allowed.
- Project Gate domain ownership cannot be locally enabled.
```

## What This ADR Does Not Authorize

```text
- editing other EV4 repositories
- creating decision-kernel-profile/ now
- adding CI wrappers now
- adding schema files now
- allowing local rule forks
- relaxing Critical hard gates
```