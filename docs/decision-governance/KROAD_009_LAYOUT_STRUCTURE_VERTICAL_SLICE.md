# KROAD-009 Layout Structure Vertical Slice

**Status:** KROAD-009 implementation / Kernel-local  
**Scope:** one end-to-end vertical slice for the existing `layout_structure` Resolver MVP family  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/decision-governance/kroad-009-layout-structure-vertical-slice.v0.json
kernel/validator/validate-kroad-009-vertical-slice.mjs
kernel/fixtures/valid/vertical_slice/layout_structure_flexbox_vertical_slice_valid.json
kernel/fixtures/invalid/vertical_slice/layout_structure_schema_valid_resolver_wrong_vertical_slice_invalid.json
kernel/fixtures/adversarial/vertical_slice/layout_structure_grid_without_availability_vertical_slice_adversarial.json
```

## What this is

KROAD-009 proves one complete Kernel-local path for the already resolver-covered `layout_structure` family:

```text
fixture-scoped source/evidence refs
  -> P0 matrix: p0.matrix.layout_structure.v0
  -> active resolver rule: resolver.rule.layout_structure.mvp.v0@0.1.0
  -> resolver registry entry
  -> resolveDecision(resolver_input)
  -> Decision Record v2 schema validation
  -> KROAD-008 valid / invalid / adversarial triplet enforcement
  -> auditDecisionRecord(...)
  -> stable machine-readable diagnostics
```

It does not add a new decision family or a second resolver implementation. The vertical-slice validator reads and evaluates the existing artifacts directly.

## What this is not

```text
- not KROAD-010 Downstream Consumer Contract
- not Project Gate intake
- not runtime/browser evidence
- not a re-audit policy
- not all-P0 resolver coverage
- not Builder execution proof
- not downstream enforcement
- not target-project correctness proof
- not production readiness
```

## Connected artifact graph

The machine-readable manifest binds the slice to:

```text
matrix:
  kernel/decision-governance/p0-decision-matrices.v0.json#layout_structure

resolver rule:
  kernel/decision-governance/resolver-rules/layout-structure.v0.json

resolver registry:
  kernel/decision-governance/resolver-rule-registry.v0.json

resolver evaluator:
  kernel/resolver-mvp/resolve-high-risk-p0.mjs#resolveDecision

Decision Record v2 schema:
  kernel/schemas/decision-record.v2.schema.json

fixture triplet policy:
  kernel/decision-governance/resolver-fixture-triplet-policy.v0.json

L2 audit:
  kernel/validator/validate-l2-decision-correctness.mjs#auditDecisionRecord
```

The validator confirms that matrix ID, decision family, rule ID/version, registry path, option set, triplet anchors, schema reference, and validator references remain aligned.

## Valid path

The valid case provides controlled `project_export`-tier fixture evidence for a single-axis row layout.

Expected deterministic result:

```text
schema:          valid
resolver_status: auto_resolved
selected_option: flexbox
L2 audit:        pass
```

This is fixture-scoped evidence only. It does not prove that a real Elementor project supports, renders, or successfully executes the decision.

## Schema-valid but resolver-wrong path

The invalid case deliberately creates a Decision Record v2 that is structurally schema-valid but records `grid` while the deterministic resolver selects `flexbox`.

Expected L2 rejection includes:

```text
L2_SELECTED_OPTION_RESOLVER_MISMATCH
L2_HUMAN_OVERRIDE_REQUIRED
L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET
L2_ALLOWED_OPTIONS_OUTSIDE_RESOLVER_OUTPUT
```

This demonstrates the central KROAD-009 requirement:

```text
schema valid != resolver correct
```

## Adversarial near-valid path

The adversarial case provides:

```text
- structured two-axis topology;
- exact condition-required project_export fixture evidence;
- grid-like intent;
- grid_availability_proven=false.
```

Expected deterministic result:

```text
resolver_status: unresolvable
resolver diagnostic: RESOLVER_MVP_GRID_REQUIRES_AVAILABILITY
Decision Record v2: provisional + requires_reaudit
L2 audit: pass with L2_DECISION_REQUIRES_REAUDIT warning
```

The record passes L2 because it honestly preserves the resolver's fail-closed result. The case does not auto-resolve Grid.

## Fixture triplet continuity

KROAD-009 retains the KROAD-008 triplet anchors for the active rule:

```text
valid:
  kernel/fixtures/valid/resolver_mvp/layout_structure_auto_resolved_flexbox.json

invalid:
  kernel/fixtures/invalid/resolver_mvp/invalid_missing_evidence_refs.json

adversarial:
  kernel/fixtures/adversarial/resolver_mvp/adversarial_grid_without_availability.json
```

`validate:mvk` continues to run `validate:resolver-fixture-triplets` before the KROAD-009 validator. The vertical-slice validator also verifies that the manifest anchors are present in the live triplet policy.

## Synthetic evidence boundary

Every vertical-slice evidence ref uses:

```text
source_type: kernel_fixture
```

Each ref carries explicit limitations stating that it is controlled fixture or matrix-guidance evidence, not real target-project evidence, and not runtime validation.

The validator rejects cases or manifests that claim:

```text
real target-project proof
runtime validation
downstream enforcement
Builder execution proof
Project Gate acceptance
production readiness
```

## Validation

Run:

```bash
npm run validate:kroad-009-vertical-slice
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` retains the existing Decision Record v2, resolver-contract, Resolver MVP, fixture-triplet, and L2 validators, then runs the KROAD-009 vertical-slice validator.

## Confirmed boundaries

```text
active resolver family: layout_structure only
new Resolver MVP families: none
KROAD-010+: not implemented
runtime/browser evidence: not implemented
downstream enforcement: not implemented
Builder execution proof: not claimed
production readiness: not claimed
```

## Next allowed step

The next roadmap item is `KROAD-010 — Downstream Consumer Contract`. It is not implemented by this vertical slice.
