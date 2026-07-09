# Decision Resolver Contract

**Status:** KROAD-005 contract baseline + KROAD-006 limited Resolver MVP + KROAD-007 L2 relation + KROAD-008 fixture triplet enforcement  
**Scope:** resolver-rule contract semantics and the current limited MVP/L2/fixture-triplet boundary  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/schemas/resolver-rule.v0.schema.json
kernel/decision-governance/resolver-status-vocabulary.v0.json
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/decision-governance/resolver-fixture-triplet-policy.v0.json
kernel/validator/validate-resolver-contract.mjs
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/validator/validate-resolver-fixture-triplets.mjs
kernel/validator/validate-l2-decision-correctness.mjs
```

## What this is

This document defines how a `P0` decision matrix can become a resolver-backed contract, how KROAD-006 activates the first limited Resolver MVP, how KROAD-007 audits decision-record correctness against resolver output, and how KROAD-008 prevents an active resolver rule from being treated as complete without valid / invalid / adversarial fixture triplet coverage.

The contract gives resolver work a deterministic shape for:

```text
rule_id
rule_version
decision_family_id
input_context
required_evidence_tier
evidence_refs
option_set
allowed_options
forbidden_options
auto_resolution_conditions
conditional_conditions
unresolvable_conditions
limitations
diagnostics
fixture_requirements
fixture_triplet_coverage
```

## What this is not

This is not a full decision engine, not runtime validation, not Builder execution proof, not downstream enforcement, and not production readiness.

The KROAD-006 MVP, KROAD-007 L2 audit, and KROAD-008 fixture triplet enforcement are limited to fixture-scoped deterministic logic for `layout_structure`. They do not assign or prove real final target-project semantic correctness.

## Resolver statuses

The only machine-readable resolver statuses are:

```text
auto_resolved
conditional
unresolvable
```

`auto_resolved` means a resolver rule selects exactly one allowed option only after required rule conditions and evidence refs are satisfied.

`conditional` means more than one option remains valid or evidence is too weak to force one option; the decision must remain bounded and explicit.

`unresolvable` means the rule or evidence is insufficient. The pipeline must halt, ask for repair, or return insufficient evidence instead of guessing.

## Evidence tier and evidence refs

Resolver rules must declare `required_evidence_tier` and non-empty `evidence_refs`.

The supported evidence tiers align with `Decision Record v2`:

```text
none
official_docs
project_export
runtime_browser
downstream_validated
```

The validator treats those tiers as ordered evidence levels:

```text
none < official_docs < project_export < runtime_browser < downstream_validated
```

Official Elementor documentation can support documented platform/editor capability only. It cannot prove:

```text
target-project availability
active Elementor Pro license
current user permission
constructability
Builder execution
runtime/browser behavior
downstream acceptance
production readiness
```

Therefore, official-doc-only evidence may produce `conditional` output in the KROAD-006 MVP, but it must not produce `auto_resolved` project-specific output.

## Relation to P0 decision matrices

`kernel/decision-governance/p0-decision-matrices.v0.json` provides comparison guidance and option sets.

A matrix is not resolver output. A resolver rule must explicitly reference a matrix and define rule conditions, diagnostics, evidence requirements, fixture requirements, and fail-closed behavior.

KROAD-006 activates only this family:

```text
layout_structure -> Div / Flexbox / Grid
```

All other P0 families remain unsupported by the Resolver MVP until a later scoped task adds active rules and fixtures.

## Relation to Decision Record v2

`Decision Record v2` carries:

```text
resolver_status
evidence_tier
rule_id
rule_version
selected_option
allowed_options
forbidden_options
evidence_refs
decision_type
human_override
```

The resolver contract and MVP can justify those fields for covered fixture-scoped cases only. Human override remains explicit. A human or LLM free-text opinion is not resolver output.

## Relation to KROAD-007 L2 Decision Correctness Audit

KROAD-007 adds a deterministic L2 audit in:

```text
docs/decision-governance/L2_DECISION_CORRECTNESS_AUDIT_KROAD_007.md
kernel/validator/validate-l2-decision-correctness.mjs
```

L2 reruns the same Resolver MVP via `resolveDecision(resolver_input)` and compares the result with a recorded `decision_record_v2`.

L2 can catch schema-valid but resolver-wrong records, including resolver-status mismatch, selected option mismatch, forbidden option selection, under-tier or missing evidence refs, conditional justification gaps, hidden human overrides, rule version mismatch, and unsupported overclaims.

L2 remains limited to resolver-covered families. Currently that means:

```text
layout_structure
```

Unsupported families are reported as unsupported/provisional rather than audited as fully resolver-backed.

## Relation to KROAD-008 Resolver Fixture Triplets

KROAD-008 adds fixture triplet coverage enforcement in:

```text
docs/decision-governance/RESOLVER_FIXTURE_TRIPLET_POLICY_KROAD_008.md
kernel/decision-governance/resolver-fixture-triplet-policy.v0.json
kernel/validator/validate-resolver-fixture-triplets.mjs
```

Every active Resolver MVP rule must have machine-readable triplet coverage:

```text
valid
invalid
adversarial
```

A rule is not considered complete when any required triplet category is missing.

The current active rule has triplet coverage anchored to:

```text
valid:       kernel/fixtures/valid/resolver_mvp/layout_structure_auto_resolved_flexbox.json
invalid:     kernel/fixtures/invalid/resolver_mvp/invalid_missing_evidence_refs.json
adversarial: kernel/fixtures/adversarial/resolver_mvp/adversarial_grid_without_availability.json
```

The KROAD-008 validator reruns deterministic resolver logic and checks fixture metadata, category distinction, expected results, expected diagnostics, empty-stub rejection, evidence-boundary language, and case-name-dispatch prevention.

## Fail-closed behavior

Unknown decision family must produce:

```text
unresolvable
```

Missing required evidence must produce:

```text
unresolvable
```

Official-doc-only project-specific support must produce:

```text
conditional
```

Missing valid / invalid / adversarial fixture coverage must fail KROAD-008 fixture triplet validation rather than silently treating the rule as complete.

The resolver, triplet validator, and L2 audit must not invent an option for an unknown `decision_family_id`.

## KROAD-006 MVP artifacts

```text
docs/decision-governance/RESOLVER_MVP_KROAD_006.md
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/fixtures/valid/resolver_mvp/
kernel/fixtures/invalid/resolver_mvp/
kernel/fixtures/adversarial/resolver_mvp/
```

## KROAD-007 L2 artifacts

```text
docs/decision-governance/L2_DECISION_CORRECTNESS_AUDIT_KROAD_007.md
kernel/validator/validate-l2-decision-correctness.mjs
kernel/fixtures/valid/l2_decision_correctness/
kernel/fixtures/invalid/l2_decision_correctness/
kernel/fixtures/adversarial/l2_decision_correctness/
```

## KROAD-008 fixture triplet artifacts

```text
docs/decision-governance/RESOLVER_FIXTURE_TRIPLET_POLICY_KROAD_008.md
kernel/decision-governance/resolver-fixture-triplet-policy.v0.json
kernel/validator/validate-resolver-fixture-triplets.mjs
```

## Fixtures

KROAD-005 contract fixtures remain under:

```text
kernel/fixtures/valid/resolver_contract/
kernel/fixtures/invalid/resolver_contract/
```

KROAD-006 Resolver MVP fixtures live under:

```text
kernel/fixtures/valid/resolver_mvp/
kernel/fixtures/invalid/resolver_mvp/
kernel/fixtures/adversarial/resolver_mvp/
```

KROAD-007 L2 fixtures live under:

```text
kernel/fixtures/valid/l2_decision_correctness/
kernel/fixtures/invalid/l2_decision_correctness/
kernel/fixtures/adversarial/l2_decision_correctness/
```

## Validation

Run:

```bash
npm run validate:resolver-contract
npm run validate:resolver-mvp
npm run validate:resolver-fixture-triplets
npm run validate:l2-decision-correctness
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes `validate:resolver-contract`, `validate:resolver-mvp`, `validate:resolver-fixture-triplets`, and `validate:l2-decision-correctness`.

## Current limitations

```text
- only layout_structure is resolver-backed
- KROAD-007 L2 only audits resolver-covered families as resolver-backed
- KROAD-008 only enforces triplet coverage for active Resolver MVP rules
- no media_choice resolver
- no styling_mechanism resolver
- no positioning_safety resolver
- no KROAD-009 Vertical Slice
- no downstream enforcement
- no Project Gate intake
- no runtime/browser evidence layer
- no Builder execution proof
- no production-readiness claim
```

## Next allowed step

After KROAD-008 is merged, later work may continue with the next roadmap item recorded in `planning/NEXT_WORK.md`.

Do not infer KROAD-009+ completion from this contract, MVP, L2 audit, or fixture triplet policy.
