# AGENTS.md — EV4 Decision Kernel

**Status:** active working guide  
**Scope:** agents and LLM workflows modifying this repository  
**Language:** Persian for explanations; English for file paths, schema IDs, rule IDs, and technical identifiers.

## 1. Mission boundary

This repository owns shared decision, evidence, behavioral coverage, recovery lifecycle and enforcement contracts for EV4. It must not claim product implementation, Coverage credit, readiness or external-repository effects without their separate evidence.

## 2. Critical non-negotiables

```text
Documented capability != enabled project capability.
Schema valid != semantic valid.
Semantic valid != runtime valid.
CI success != production readiness.
Registration != activation.
Activation != implementation.
Implementation != completion.
Coverage credit requires separate approved Coverage evidence.
Readiness requires separate approved readiness evidence.
Project Gate verifies evidence and authority; it does not design.
KROAD-012R remains historical_non_authoritative.
The Recovery Program does not supersede KROAD-012 through KROAD-018.
```

## 3. Owner-only merge policy

```yaml
merge_authority: owner_only
auto_merge: forbidden
independent_pre_merge_review_required: false
independent_review_policy: optional_advisory
missing_independent_review_is_blocking: false
stale_independent_review_is_blocking: false
review_sequence_is_blocking: false
review_provenance_is_blocking: false
historical_review_fabrication: forbidden
```

The mandatory repository sequence is:

```text
exact base
-> declared scope
-> exact-head CI Green
-> owner-only Merge
-> method-aware deterministic Merge-result proof
-> current-main validation Green
```

An advisory review may be recorded, but it cannot grant Merge authority, replace CI, replace owner Merge, fabricate `GREEN_TECHNICALLY_READY`, or block closure merely because it is absent or stale.

## 4. Active AIGOV closure

The active plan is `GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V4`.

PR #49 remains a one-time, non-reusable, non-precedential exact-tree Squash reconciliation. PR #50 is merged from head `e5c0c342d6417c8e85be54e7cb4caf372a116a35` at merge commit `435add8ee3f3274f781b6e391f11e3262e380c4e`.

Batch B closure must preserve:

```yaml
exact_head_ci: required
scope_binding: required
owner_merge: required
method_aware_merge_result_proof: required
current_main_validation: required
coverage_promotion_effect: none
product_effect: none
kroad_supersession_effect: none
```

## 5. Recovery Program boundary

`DCOV-COVERAGE-EXECUTION-PROGRAM` is active. `KREC-001` through `KREC-009` are simultaneously authorized with:

```yaml
status: active
implementation_authorized: true
coverage_credit: false
readiness_claim: false
```

Authorization may be simultaneous. Execution and completion remain dependency-aware. A task may not become `implemented` or `complete` until every `depends_on` task is `complete`.

No substantive KREC deliverable is implemented by the activation change itself.

## 6. Security and scope

Never modify secrets, permissions, Rulesets, branch protection, teams, bypass actors or external repositories without a separate explicit owner decision. Do not force-push, rewrite history, enable auto-merge, perform broad dependency upgrades or silently delete deferred work.

`planning/NEXT_WORK.md` is the mutable current-status authority. `planning/KERNEL_EXECUTION_PLAN.md` preserves durable product meaning.
