# Decision Domain Taxonomy

**Status:** foundation / Kernel-local  
**Scope:** EV4 Decision Kernel only  
**Owner:** Kernel

## What this is

This document explains the machine-readable taxonomy in `kernel/decision-governance/decision-domain-taxonomy.v0.json`.

The foundation separates these domain classes:

```text
decision_family
evidence_domain
safety_gate
source_boundary_rule
capability_proof_rule
execution_risk_control
future_expansion
merge_candidate
```

Every domain has exactly one `primary_classification`. Multiple primary classifications are rejected because they make ownership and validation ambiguous.

## What this is not

This is not a full decision-matrix system, not a full Elementor feature registry, not a full control-level registry, and not a runtime collector.

## V4-only target scope

Elementor V4 is the only valid target design scope in this Kernel version. Elementor V3 may appear only as:

```text
legacy_risk
migration_boundary
unsupported_target
forbidden_fallback
compatibility_warning
```

Elementor V3 must not appear as a valid target option.

## P0 decision families

The P0 registry is intentionally limited to:

```text
v4_element_identity
layout_structure
media_choice
text_semantics
interaction_link_topology
positioning_safety
styling_mechanism
class_scope
value_binding
unit_decision
```

Each family defines purpose, allowed scope, owner role, downstream consumer, required evidence types, and forbidden overclaims.

## Why this comes before matrices

Media-choice and layout-structure matrices depend on stable boundary vocabulary. Without this foundation, a model can select an element but silently overclaim project availability, runtime proof, Builder execution, or V3 fallback support.

## Validation

Run:

```bash
node kernel/validator/validate-decision-governance-foundation.mjs
```

When wired through `validate:mvk`, this validator is also part of the Kernel-local validation path.
