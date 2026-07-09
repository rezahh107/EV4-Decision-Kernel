# KROAD-007 L2 Decision Correctness Audit

**Status:** KROAD-007 implementation / Kernel-local  
**Scope:** deterministic second-level audit for resolver-covered decision families  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/validator/l2-decision-correctness-audit.mjs
kernel/fixtures/valid/l2_decision_audit/
kernel/fixtures/invalid/l2_decision_audit/
kernel/fixtures/adversarial/l2_decision_audit/
kernel/decision-governance/resolver-rule-registry.v0.json
```

## What this is

KROAD-007 adds a deterministic L2 audit that checks whether a recorded `Decision Record v2` selected decision is consistent with the active resolver and evidence.

The audit reads a fixture envelope containing:

```text
resolver_input
decision_record
asserted_claims optional
```

Then it reruns:

```text
kernel/resolver-mvp/resolve-high-risk-p0.mjs#resolveDecision
```

and compares the resolver output to the decision record.

## L1 vs Resolver vs L2

```text
L1 / schema validation:
  Checks the decision record shape and local field consistency.
  It can prove required fields, enums, and local constraints.
  It does not prove the selected option is correct for the resolver context.

Resolver:
  Evaluates structured decision context and evidence refs.
  For KROAD-006 it covers only layout_structure.
  It emits auto_resolved, conditional, or unresolvable.

L2 audit:
  Reruns the resolver and checks selected decision correctness.
  It catches schema-valid but resolver-wrong records.
  It remains deterministic and does not ask another model for a free-text opinion.
```

## Covered family

Active KROAD-007 coverage is limited to resolver-covered families:

```text
layout_structure
```

Unsupported families return:

```text
L2_UNSUPPORTED_DECISION_FAMILY
```

They are not audited as fully resolver-backed families.

## Checks

The L2 audit detects:

```text
L2_RESOLVER_STATUS_MISMATCH
L2_RULE_ID_MISMATCH
L2_RULE_VERSION_MISMATCH
L2_DECISION_REQUIRES_REAUDIT
L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET
L2_SELECTED_OPTION_MISMATCH
L2_FORBIDDEN_OPTION_SELECTED
L2_EVIDENCE_TIER_TOO_LOW
L2_REQUIRED_EVIDENCE_REF_MISSING_FROM_RECORD
L2_REQUIRED_EVIDENCE_REF_UNDER_TIER
L2_CONDITIONAL_DECISION_MUST_BE_PROVISIONAL
L2_CONDITIONAL_JUSTIFICATION_REQUIRED
L2_CONDITIONAL_JUSTIFICATION_EVIDENCE_REF_REQUIRED
L2_HUMAN_OVERRIDE_NOT_MARKED
L2_UNSUPPORTED_OVERCLAIM_ASSERTED
L2_UNSUPPORTED_DECISION_FAMILY
```

## Conditional decisions

When resolver output is `conditional`, L2 requires:

```text
provisional_status.is_provisional = true
specific non-placeholder justification
justification citing at least one resolver-required evidence_id
```

This prevents an official-doc-only conditional result from being silently converted into a final project-specific decision.

## Human override visibility

L2 does not forbid all human overrides.

It counts visible overrides through:

```text
decision_type = human_override
human_override object present
```

If a decision differs from resolver output but is not marked as `human_override`, L2 emits:

```text
L2_HUMAN_OVERRIDE_NOT_MARKED
```

## Rule version and re-audit

L2 compares:

```text
decision_record.rule_id
 decision_record.rule_version
```

against the active resolver output. A stale rule version emits:

```text
L2_RULE_VERSION_MISMATCH
```

A record with:

```text
requires_reaudit = true
```

emits:

```text
L2_DECISION_REQUIRES_REAUDIT
```

and cannot be treated as L2-accepted.

## Fixtures

Valid fixtures:

```text
kernel/fixtures/valid/l2_decision_audit/layout_structure_auto_resolved_flexbox_consistent.json
kernel/fixtures/valid/l2_decision_audit/layout_structure_conditional_official_docs_bounded_choice.json
```

Invalid fixtures:

```text
kernel/fixtures/invalid/l2_decision_audit/invalid_schema_valid_resolver_wrong_selected_option.json
kernel/fixtures/invalid/l2_decision_audit/invalid_forbidden_option_selected.json
kernel/fixtures/invalid/l2_decision_audit/invalid_missing_or_under_tier_evidence.json
kernel/fixtures/invalid/l2_decision_audit/invalid_conditional_missing_justification.json
kernel/fixtures/invalid/l2_decision_audit/invalid_rule_version_mismatch_requires_reaudit.json
```

Adversarial fixtures:

```text
kernel/fixtures/adversarial/l2_decision_audit/adversarial_official_docs_project_ready_overclaim.json
kernel/fixtures/adversarial/l2_decision_audit/adversarial_unsupported_family_not_covered.json
```

## Validation

Run:

```bash
npm run validate:l2-decision-audit
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes `validate:l2-decision-audit`.

## Current limitations

```text
- only layout_structure is resolver-backed for active L2 coverage
- unsupported families are reported as unsupported, not accepted
- no KROAD-008 fixture-triplet policy expansion
- no downstream consumer enforcement
- no Project Gate intake
- no runtime/browser evidence implementation
- no Builder execution proof
- no production-readiness claim
- no free-text LLM judgment as audit output
```

## Next allowed step

The next roadmap step after KROAD-007 is:

```text
KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
```

KROAD-008 and later items remain incomplete until explicitly implemented by later scoped work.
