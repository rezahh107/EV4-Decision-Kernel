# EV4 PCVP v1.0.0 Active Bundle

This release-candidate bundle packages one normative specification, one compact English model policy, repository profiles, structural schemas, behavioral fixtures, and adoption guidance.

## Runtime loading rule

Do **not** load the whole bundle into every model context. Use:

```text
EV4_PCVP_MODEL_POLICY_v1.0.0.md
+ exactly one active repository profile
+ only the schema or fixture needed for the current operation
```

Use the full specification for design, audit, maintenance, and dispute resolution.

## Authority order

```text
Normative SPEC
→ compiled MODEL_POLICY
→ active repository PROFILE
→ SCHEMA structural constraints
→ FIXTURE examples
```

A profile may narrow the policy but may not redefine canonical ownership, verification meaning, authorization semantics, or official-claim boundaries.

## Current status

```yaml
bundle_status: release_candidate
adoption_status: not_yet_adopted
model_policy_enforcement: best_effort
schema_scope: structural_only
```
