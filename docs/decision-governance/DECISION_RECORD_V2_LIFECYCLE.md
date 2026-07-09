# Decision Record v2 Lifecycle Fields

Status: Active KROAD-003 lifecycle documentation  
Scope: Explanation of Decision Record v2 lifecycle fields and evidence boundaries  
Owner or intended consumer: future Resolver, L2 Audit, Provisional Policy, Reopen Loop, downstream contract, and Project Gate intake work

## What This Document Is

This document explains how the Decision Record v2 fields should be read by later roadmap items.
It makes lifecycle state explicit before the Resolver, L2 Audit, Provisional Policy, and Reopen Loop are implemented.

## What This Document Is Not

```text
- not a Resolver
- not an L2 audit implementation
- not Project Gate intake
- not downstream enforcement
- not runtime/browser evidence collection
- not production readiness proof
```

## Resolver Status

```text
auto_resolved:
  A future resolver rule has enough evidence to select one option.
  KROAD-003 only records this value; it does not compute it.

conditional:
  Multiple options remain valid.
  Architect selection is allowed only inside `allowed_options` and must keep evidence references and rejected/forbidden options visible.

unresolvable:
  Rule coverage or evidence is insufficient.
  `selected_option.option_id` must be `none`, `requires_reaudit` must be true, and downstream work must not guess.
```

## Evidence Tier

```text
none:
  No usable evidence exists. This must remain unresolvable.

official_docs:
  Official Elementor documentation proves documented platform/editor capability only.
  It does not prove active user permission, active Pro license, project availability, runtime DOM, computed style, Builder execution, or production readiness.

project_export:
  Saved project/source evidence exists. It is not browser/runtime proof.

runtime_browser:
  Browser-observed evidence exists for the captured context only.

downstream_validated:
  A downstream consumer or Project Gate has inspected and validated the contract.
  This must not be claimed without downstream evidence.
```

## Decision Type and Human Override

```text
resolver_derived:
  The decision follows the recorded resolver/rule contract.
  The record must not include `human_override`.

human_override:
  The decision was manually overridden.
  The record must include `human_override` and `trigger_source: manual_override`.
  The override must include actor, reason, and accepted limitations.
```

This prevents a manual choice from looking like a normal resolver-derived result.

## Provisional Status

`provisional_status` records whether the decision is still blocked by missing evidence.

```yaml
is_provisional: true
reason: why the decision cannot be treated as final
missing_evidence: evidence tiers or artifacts still required
blocks_final_release: whether the provisional state must stop a future final gate
```

A project-specific decision supported only by `official_docs` should normally stay provisional until stronger project or runtime evidence exists.

## Rule Versioning

`rule_id` and `rule_version` make later re-audit possible.
If the rule changes, future work can compare the recorded `rule_version` with the active rule and set `requires_reaudit`.

KROAD-003 does not create resolver rules. It only makes the fields available.

## Reopen Lineage

```text
reopen_count:
  How many times the decision has been reopened.

max_reopen_count:
  Maximum allowed reopen attempts before escalation.

previous_decision_ref:
  Reference to the prior decision version when reopen_count > 0.

requires_reaudit:
  Whether the decision must be rechecked before it can be treated as stable.
```

Old decisions must remain auditable. Future reopen work should create a new decision record rather than overwrite the old one.

## Option Sets

```text
selected_option:
  The chosen option. For unresolvable decisions, option_id must be `none`.

allowed_options:
  Options still allowed by the current rule/evidence boundary.

rejected_options:
  Options considered but rejected with reasons.

forbidden_options:
  Options that must not be selected under the current boundary.
```

The v2 validator checks that a non-unresolvable `selected_option` appears inside `allowed_options`.

## Forbidden Overclaims

`forbidden_overclaims` records claims that must not be made from the current evidence.

Examples:

```text
official_docs_do_not_prove_project_availability
official_docs_do_not_prove_runtime_behavior
schema_valid_does_not_prove_semantic_correctness
decision_record_v2_does_not_prove_builder_execution
decision_record_v2_does_not_prove_production_readiness
```

## Downstream Owner

`downstream_owner` names the expected next consumer or `none`.
It does not prove downstream enforcement. Downstream enforcement requires a later inspected downstream schema/validator/fixture or Project Gate rejection path.

## Next Allowed Step

Next allowed roadmap item: `KROAD-004 — P0 Decision Matrices`.
