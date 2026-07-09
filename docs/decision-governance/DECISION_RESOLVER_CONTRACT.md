# Decision Resolver Contract

**Status:** KROAD-005 contract baseline + KROAD-006 limited Resolver MVP + KROAD-007 L2 audit relation  
**Scope:** resolver-rule contract semantics, limited MVP boundary, and L2 audit boundary  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/schemas/resolver-rule.v0.schema.json
kernel/decision-governance/resolver-status-vocabulary.v0.json
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/validator/validate-resolver-contract.mjs
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/validator/l2-decision-correctness-audit.mjs
```

## What this is

This document defines how a `P0` decision matrix can become a resolver-backed contract, how KROAD-006 activates the first limited Resolver MVP, and how KROAD-007 audits recorded decisions against resolver output.

The resolver contract gives resolver work a deterministic shape for:

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

This is not a full decision engine, not runtime validation, not Builder execution proof, not downstream enforcement, and not production readiness.

The KROAD-006 MVP is limited to fixture-scoped deterministic logic for `layout_structure`. It does not assign real final target-project decisions.

KROAD-007 L2 audit is also limited to resolver-covered families and does not audit unsupported families as if they are resolver-backed.

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

The validators treat those tiers as ordered evidence levels:

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
requires_reaudit
```

The resolver contract and MVP can justify those fields for covered fixture-scoped cases only. Human override remains explicit. A human or LLM free-text opinion is not resolver output.

KROAD-007 L2 audit reruns the resolver and compares this record against the deterministic resolver output.

## L2 audit relation

KROAD-007 introduces:

```text
kernel/validator/l2-decision-correctness-audit.mjs
```

The L2 audit checks:

```text
resolver-status mismatch
selected option outside resolver allowed set
forbidden option selected
evidence tier too low
missing required evidence refs
invalid conditional justification
human override not marked
rule version mismatch
requires_reaudit=true
unsupported overclaims
unsupported family not covered
```

The audit does not ask a second model for an opinion. It reruns the existing resolver path:

```text
kernel/resolver-mvp/resolve-high-risk-p0.mjs#resolveDecision
```

## Fail-closed behavior

Unknown decision family must produce:

```text
unresolvable
```

at the resolver layer.

KROAD-007 reports unsupported families as:

```text
unsupported
L2_UNSUPPORTED_DECISION_FAMILY
```

rather than pretending the family is resolver-backed.

Missing required evidence must produce:

```text
unresolvable
```

Official-doc-only project-specific support must produce:

```text
conditional
```

The resolver must not invent an option for an unknown `decision_family_id`.

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

KROAD-007 L2 audit fixtures live under:

```text
kernel/fixtures/valid/l2_decision_audit/
kernel/fixtures/invalid/l2_decision_audit/
kernel/fixtures/adversarial/l2_decision_audit/
```

## Validation

Run:

```bash
npm run validate:resolver-contract
npm run validate:resolver-mvp
npm run validate:l2-decision-audit
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes `validate:resolver-contract`, `validate:resolver-mvp`, and `validate:l2-decision-audit`.

## Current limitations

```text
- only layout_structure is resolver-backed
- no media_choice resolver
- no styling_mechanism resolver
- no positioning_safety resolver
- no KROAD-008 fixture-triplet policy expansion
- no downstream enforcement
- no Project Gate intake
- no runtime/browser evidence layer
- no Builder execution proof
- no production-readiness claim
```

## Next allowed step

After KROAD-007, later work may continue with the next roadmap item recorded in `planning/NEXT_WORK.md`.

Do not infer KROAD-008+ completion from the L2 audit.
