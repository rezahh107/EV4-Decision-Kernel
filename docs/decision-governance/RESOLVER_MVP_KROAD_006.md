# KROAD-006 Resolver MVP

**Status:** KROAD-006 implementation / Kernel-local  
**Scope:** limited deterministic Resolver MVP for high-risk P0 families  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/fixtures/valid/resolver_mvp/
kernel/fixtures/invalid/resolver_mvp/
kernel/fixtures/adversarial/resolver_mvp/
```

## What this is

This is the first small Resolver MVP for a high-risk P0 family.

It makes `layout_structure` resolver-backed for controlled, machine-readable fixture contexts. The selected family is:

```text
Div / Flexbox / Grid
```

The resolver can deterministically emit:

```text
auto_resolved
conditional
unresolvable
```

## What this is not

```text
- not a full decision engine
- not KROAD-007 L2 audit
- not downstream consumer enforcement
- not Project Gate intake
- not runtime/browser evidence
- not Builder execution proof
- not production readiness
- not semantic correctness proof outside covered cases
```

## Covered family

### `layout_structure`

The MVP supports the `layout_structure` family from:

```text
kernel/decision-governance/p0-decision-matrices.v0.json#layout_structure
```

Supported candidate options:

```text
div_block
flexbox
grid
```

The active rule file is:

```text
kernel/decision-governance/resolver-rules/layout-structure.v0.json
```

The executable evaluator is:

```text
kernel/resolver-mvp/resolve-high-risk-p0.mjs
```

## Resolver behavior

### `auto_resolved`

The resolver may emit `auto_resolved` only for controlled fixture contexts with `project_export` evidence.

Current deterministic auto-resolution cases:

```text
div_block:
  layout_intent = wrapper
  simple_wrapper_only = true
  two_axis_required = false

flexbox:
  layout_intent = single_axis
  axis = row | column
  child_topology = linear | wrapping
  two_axis_required = false

grid:
  layout_intent = two_axis OR two_axis_required = true
  child_topology = two_dimensional
  grid_availability_proven = true
```

### `conditional`

The resolver emits `conditional` when evidence or context is bounded but not enough to force exactly one option.

Important case:

```text
official_docs only -> conditional
```

Official documentation can support documented platform/editor capability only. It does not prove target-project availability, active Pro license, current user permission, constructability, Builder execution, runtime behavior, downstream acceptance, or production readiness.

### `unresolvable`

The resolver emits `unresolvable` for fail-closed cases, including:

```text
unknown decision_family_id
missing evidence_refs
under-tier evidence with no official-doc conditional path
missing structured context
unsupported layout context
grid requested without explicit grid availability evidence
```

## Fixtures

Valid deterministic behavior:

```text
kernel/fixtures/valid/resolver_mvp/layout_structure_auto_resolved_flexbox.json
kernel/fixtures/valid/resolver_mvp/layout_structure_conditional_official_docs_only.json
kernel/fixtures/valid/resolver_mvp/layout_structure_unresolvable_missing_project_export.json
```

Invalid/fail-closed behavior:

```text
kernel/fixtures/invalid/resolver_mvp/invalid_missing_evidence_refs.json
kernel/fixtures/invalid/resolver_mvp/invalid_unknown_family_auto_resolved.json
```

Adversarial overclaim behavior:

```text
kernel/fixtures/adversarial/resolver_mvp/adversarial_official_docs_auto_resolved.json
kernel/fixtures/adversarial/resolver_mvp/adversarial_grid_without_availability.json
```

## Validation

Run:

```bash
npm run validate:resolver-mvp
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes `validate:resolver-mvp`.

## Unsupported families

These KROAD-006 suggested families remain unsupported by the active Resolver MVP and must fail closed until a later scoped task adds rules and fixtures:

```text
media_choice
styling_mechanism
positioning_safety
```

Other P0 families also remain unsupported as resolver-backed MVP families.

## Boundaries preserved

```text
- no L2 audit
- no downstream enforcement
- no Project Gate intake
- no runtime/browser evidence implementation
- no Builder execution proof
- no production-readiness carrier
- no official-doc-only project-ready claim
- no free-text LLM judgment as resolver output
```

## Next allowed step

The next roadmap step should not mark later KROADs complete.

A later task may either broaden resolver fixture coverage (`KROAD-008`) or add L2 decision correctness audit (`KROAD-007`) only after inspecting `planning/NEXT_WORK.md`.
