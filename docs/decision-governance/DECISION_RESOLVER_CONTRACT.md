# Decision Resolver Contract

**Status:** KROAD-005 contract baseline + KROAD-006 limited Resolver MVP relation  
**Scope:** resolver-rule contract semantics and the current limited MVP boundary  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/schemas/resolver-rule.v0.schema.json
kernel/decision-governance/resolver-status-vocabulary.v0.json
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/validator/validate-resolver-contract.mjs
kernel/resolver-mvp/resolve-high-risk-p0.mjs
```

## What this is

This document defines how a `P0` decision matrix can become a resolver-backed contract and how KROAD-006 activates the first limited Resolver MVP.

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
```

## What this is not

This is not a full decision engine, not `KROAD-007`, not runtime validation, not Builder execution proof, not downstream enforcement, and not production readiness.

The KROAD-006 MVP is limited to fixture-scoped deterministic logic for `layout_structure`. It does not assign real final target-project decisions.

## Resolver statuses

The only machine-readable resolver statuses are:

```text
auto_resolved
conditional
unresolvable
```

`auto_resolved` means a resolver rule selects exactly one allowed option after required rule conditions and evidence refs are satisfied.

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

A matrix is not resolver output. A resolver rule must explicitly reference a matrix and define rule conditions, diagnostics, evidence requirements, and fail-closed behavior.

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

The resolver must not invent an option for an unknown `decision_family_id`.

## KROAD-006 MVP artifacts

```text
docs/decision-governance/RESOLVER_MVP_KROAD_006.md
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/fixtures/valid/resolver_mvp/
kernel/fixtures/invalid/resolver_mvp/
kernel/fixtures/adversarial/resolver_mvp/
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

The KROAD-006 fixture set proves:

```text
auto_resolved for supported project_export single-axis layout
conditional for official-doc-only support
unresolvable for missing evidence
fail-closed for unknown decision families
rejection of official-doc-only auto-resolution overclaim
rejection of grid auto-resolution without explicit grid availability
```

## Validation

Run:

```bash
npm run validate:resolver-contract
npm run validate:resolver-mvp
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes both `validate:resolver-contract` and `validate:resolver-mvp`.

## Current limitations

```text
- only layout_structure is resolver-backed
- no media_choice resolver
- no styling_mechanism resolver
- no positioning_safety resolver
- no L2 audit
- no downstream enforcement
- no Project Gate intake
- no runtime/browser evidence layer
- no Builder execution proof
- no production-readiness claim
```

## Next allowed step

After KROAD-006, later work may continue with the next roadmap item recorded in `planning/NEXT_WORK.md`.

Do not infer KROAD-007+ completion from this MVP.
