# Evidence Workspace

**Status:** Kernel-local Prompt 5 evidence workspace layer  
**Scope:** workspace envelope and package attachment rules for future external evidence

## What It Is

An evidence workspace is a Kernel-local envelope that can attach future evidence packages to a decision context while preserving unresolved gaps and not-proven boundaries.

Required envelope fields:

```text
record_kind
schema_version
workspace_id
kernel_pin
evidence_scope
evidence_packages
evidence_status_summary
unresolved_evidence_gaps
not_proven_by_workspace
created_at
producer
```

## Package References

The workspace can reference these package kinds:

```text
project_environment_profile
wordpress_context_evidence
elementor_project_availability_evidence
runtime_snapshot_evidence
responsive_runtime_evidence
```

The validator rejects unknown package references and status overclaims. A workspace package status cannot be stronger than the referenced package status.

## Fixture Boundary

Prompt 5 fixtures are deterministic samples. They are not real project exports, real browser captures, Builder execution evidence, downstream rejection evidence, or production readiness evidence.

## Next Allowed Step

After this PR is merged and CI is green, the next prompt may design a controlled producer or adapter that emits one of these package contracts. It must still avoid downstream enforcement claims until an inspected downstream repository rejects invalid packages.
