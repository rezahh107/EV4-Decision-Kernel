# Decision Resolver Contract

**Status:** KROAD-005 contract baseline / Kernel-local  
**Scope:** resolver-rule contract semantics only  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/schemas/resolver-rule.v0.schema.json
kernel/decision-governance/resolver-status-vocabulary.v0.json
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/validator/validate-resolver-contract.mjs
```

## What this is

This document defines how a `P0` decision matrix can become an executable or semi-executable resolver-rule contract.

The contract gives future resolver work a deterministic shape for:

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

This is not `KROAD-006`, not a Resolver MVP, not runtime validation, not Builder execution proof, not downstream enforcement, and not production readiness.

The contract does not assign a real final target-project decision. It defines the shape, vocabulary, diagnostics, examples, and fail-closed boundaries that later resolver logic must use.

## Resolver statuses

The only machine-readable resolver statuses are:

```text
auto_resolved
conditional
unresolvable
```

`auto_resolved` means a future resolver rule may select exactly one allowed option only after the required rule conditions and evidence refs are satisfied.

`conditional` means more than one option remains valid, and a bounded downstream or Architect choice may be needed inside the allowed set.

`unresolvable` means the rule or evidence is insufficient. The pipeline must halt, ask for repair, or return insufficient evidence instead of guessing.

The status vocabulary lives in:

```text
kernel/decision-governance/resolver-status-vocabulary.v0.json
```

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

A rule-level `required_evidence_tier` is satisfied only when at least one `evidence_refs` entry is at or above that tier.

For non-`unresolvable` conditions, each `required_evidence_refs` item must match an `evidence_refs.evidence_id`, and the matched refs must satisfy that condition's `required_evidence_tier`.

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

Therefore, official-doc-only evidence may keep a rule `conditional` or `unresolvable`, but it must not be treated as project-ready.

## Condition bucket contract

The three condition buckets are not interchangeable:

```text
auto_resolution_conditions -> auto_resolved
conditional_conditions -> conditional
unresolvable_conditions -> unresolvable
```

A condition whose `outcome_status` contradicts its bucket is invalid. The validator emits `RESOLVER_RULE_CONDITION_BUCKET_STATUS_MISMATCH` on the exact bucket path.

## Relation to P0 decision matrices

`kernel/decision-governance/p0-decision-matrices.v0.json` provides comparison guidance and option sets.

A matrix is not resolver output. A resolver rule must explicitly reference a matrix and define rule conditions, diagnostics, evidence requirements, and fail-closed behavior.

The registry baseline records this boundary:

```text
matrix_guidance_is_not_resolver_result: true
resolver_mvp_implemented: false
active_rules: []
```

## Relation to Decision Record v2

`Decision Record v2` already carries:

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

KROAD-005 defines the rule contract that can later justify those fields. It does not replace `Decision Record v2`; it explains how future resolver-derived records should be backed by a rule.

Human override remains explicit in `Decision Record v2`. A human or LLM free-text opinion is not resolver output.

## Fail-closed behavior

Unknown decision family must produce:

```text
unresolvable
```

Missing required evidence must produce:

```text
unresolvable
```

A resolver rule must not invent an option for an unknown `decision_family_id`.

The validator checks this through the P0 matrix registry and emits diagnostics such as:

```text
RESOLVER_RULE_UNKNOWN_DECISION_FAMILY
RESOLVER_RULE_EVIDENCE_REFS_REQUIRED
RESOLVER_RULE_EVIDENCE_TIER_UNSATISFIED
RESOLVER_RULE_CONDITION_EVIDENCE_TIER_UNSATISFIED
RESOLVER_RULE_CONDITION_BUCKET_STATUS_MISMATCH
RESOLVER_RULE_OFFICIAL_DOCS_NOT_PROJECT_READY
RESOLVER_RULE_MATRIX_GUIDANCE_NOT_RESOLVER_OUTPUT
RESOLVER_RULE_FREE_TEXT_OPINION_FORBIDDEN
```

## Fixtures

Valid and invalid example artifacts live under:

```text
kernel/fixtures/valid/resolver_contract/
kernel/fixtures/invalid/resolver_contract/
```

The current valid fixture is an example contract for `layout_structure`. It is intentionally a contract fixture, not a real target-project decision.

Invalid fixtures assert that:

```text
missing evidence refs fail
unknown family fails closed
official-doc-only evidence cannot become project-ready
under-tier evidence cannot satisfy a higher declared evidence tier
condition bucket outcome_status must match its bucket
matrix guidance and free-text opinion are not resolver output
```

## Validation

Run:

```bash
npm run validate:resolver-contract
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes `validate:resolver-contract` after this KROAD.

## Next allowed step

After this baseline is merged, the next roadmap item is:

```text
KROAD-006 — Resolver MVP for high-risk P0 families
```

KROAD-006 may implement a small scoped resolver. KROAD-005 must remain contract/schema/documentation/fixture baseline only.
