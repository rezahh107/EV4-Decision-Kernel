# Execution Risk Boundaries

**Status:** foundation / Kernel-local  
**Scope:** execution-risk taxonomy and gates only  
**Owner:** Kernel

## What this is

This document explains the P0 execution-risk boundaries encoded in `kernel/decision-governance/execution-risk-domain-registry.v0.json`, `source-tier-boundaries.v0.json`, and `capability-dependency-gate.v0.json`.

The foundation includes:

```text
version_and_release_gate
official_dependency_boundary
atomic_export_schema_boundary
capability_proof_boundary
forbidden_overclaim_boundary
custom_css_environment_gate_when_custom_css_selected
v4_only_target_gate
```

## Official docs boundary

Official Elementor Help and Developer docs may prove documented platform capability only.

They must not prove:

```text
installed version availability
project feature enabled state
Elementor Pro availability
Admin/user permission
constructability
Builder execution
frontend runtime behavior
production readiness
```

Those claims require target project evidence, editor capture, runtime capture, browser computed style evidence, downstream evidence, or later Project Gate evidence depending on the claim.

## Capability/dependency proof

The gate separates:

```text
documented_capability
installed_version_supported
feature_enabled
core_or_pro
admin_permission_required
license_required
addon_required
third_party_dependency
project_availability_evidence_required
```

A documented capability is not enough for Builder-ready. Builder-ready is blocked when capability proof is unproven or required dependency evidence is missing.

## Custom CSS environment gate

When `custom_css` is selected, the decision must declare the external style environment risk. This foundation does not evaluate Custom CSS behavior; it only blocks silent selection without an environment boundary.

## What this does not claim

This foundation does not claim downstream enforcement, runtime validation, Builder execution, Project Gate enforcement, or production readiness.
