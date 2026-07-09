# KROAD-007 L2 Decision Correctness Audit

**Status:** KROAD-007 implementation / Kernel-local  
**Scope:** deterministic L2 audit for resolver-covered decision families  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/validator/validate-l2-decision-correctness.mjs
kernel/fixtures/valid/l2_decision_correctness/
kernel/fixtures/invalid/l2_decision_correctness/
kernel/fixtures/adversarial/l2_decision_correctness/
```

## What this is

KROAD-007 adds a second-level decision-correctness audit.

It checks whether a recorded `decision_record_v2` is consistent with the Resolver MVP output and evidence. It is stricter than schema validation because a schema-valid decision may still be semantically wrong against the resolver.

The active covered family is currently:

```text
layout_structure
```

## What this is not

```text
- not a second free-text LLM opinion
- not a full decision engine
- not KROAD-008
- not downstream consumer contract
- not Project Gate intake
- not runtime/browser evidence
- not Builder execution proof
- not production readiness
- not all-P0 resolver expansion
- not universal semantic-correctness proof
```

## L1 vs Resolver vs L2

```text
L1 schema validation:
  checks whether the decision record is structurally valid.

Resolver MVP:
  deterministically evaluates a supported decision family and emits resolver output.

L2 Decision Correctness Audit:
  reruns the resolver and checks whether the recorded decision agrees with resolver output, evidence refs, rule version, allowed/forbidden options, and overclaim boundaries.
```

## Deterministic resolver rerun

The L2 validator reads a fixture envelope containing:

```text
decision_record
resolver_input
audit_context
```

It reruns:

```text
resolveDecision(resolver_input)
```

from:

```text
kernel/resolver-mvp/resolve-high-risk-p0.mjs
```

Then it compares the rerun resolver output with the recorded decision fields.

## Checks performed

The L2 audit emits machine-readable diagnostics for at least:

```text
resolver-result mismatch
selected option outside resolver allowed set
allowed option set disagreement
forbidden option selected
evidence tier below resolver output
missing exact resolver-required evidence refs
conditional justification missing or not evidence-backed
human override missing when a resolver mismatch is asserted
visible human override observation
rule ID/version mismatch
decision requiring re-audit
unsupported resolver family
unsupported overclaims such as production_ready or Builder proof
```

## Human override behavior

A human override is allowed only when it is explicit in `decision_record_v2`.

Visible override produces a warning diagnostic:

```text
L2_HUMAN_OVERRIDE_OBSERVED
```

A hidden selected-option mismatch produces an error diagnostic:

```text
L2_HUMAN_OVERRIDE_REQUIRED
```

A human override does not permit forbidden options, production-readiness claims, runtime proof claims, or Builder execution proof claims.

## Conditional decision behavior

Conditional decisions require an `audit_context.conditional_justification` with:

```text
summary
evidence_refs
limitations_acknowledged
```

The justification evidence refs must appear in the decision record and must include the resolver-required context refs for the active condition.

## Unsupported-family behavior

Only resolver-covered families are audited as resolver-backed.

Currently:

```text
layout_structure -> resolver-covered
all other P0 families -> unsupported by active L2 resolver-backed audit
```

Unsupported families return:

```text
unsupported
L2_DECISION_FAMILY_NOT_RESOLVER_COVERED
```

This is not a pass as a resolver-backed decision and not a claim of semantic correctness.

## Fixtures

Valid expected behavior:

```text
kernel/fixtures/valid/l2_decision_correctness/layout_structure_auto_resolved_flexbox_pass.json
kernel/fixtures/valid/l2_decision_correctness/layout_structure_conditional_official_docs_pass.json
kernel/fixtures/valid/l2_decision_correctness/layout_structure_human_override_visible_pass.json
kernel/fixtures/valid/l2_decision_correctness/unsupported_family_not_fully_audited.json
```

Invalid expected behavior:

```text
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_resolver_result_mismatch_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_selected_outside_allowed_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_forbidden_option_selected_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_evidence_tier_too_low_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_missing_required_evidence_ref_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_conditional_missing_justification_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_human_override_not_marked_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_rule_version_mismatch_invalid.json
kernel/fixtures/invalid/l2_decision_correctness/layout_structure_requires_reaudit_final_invalid.json
```

Adversarial expected behavior:

```text
kernel/fixtures/adversarial/l2_decision_correctness/layout_structure_production_ready_overclaim_invalid.json
```

## Validation

Run:

```bash
npm run validate:l2-decision-correctness
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes `validate:l2-decision-correctness`.

## Boundaries preserved

```text
- no KROAD-008 implemented
- no downstream enforcement
- no Project Gate intake
- no runtime/browser evidence implementation
- no Builder execution proof
- no production-readiness carrier
- no all-P0 resolver expansion
- no free-text LLM judgment as L2 output
```

## Next allowed step

After this PR is merged, the next roadmap step is:

```text
KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
```

KROAD-008 is not implemented by this document or validator.
