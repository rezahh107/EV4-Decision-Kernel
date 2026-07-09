# KROAD-005 Decision Resolver Contract — Second-Pass Review Record

Status: completed stage  
Scope: KROAD-005 Decision Resolver Contract  
Owner or intended consumer: EV4 Decision Kernel maintainers and future roadmap operators  
Recorded from live repository inspection: PR #21 merged on `main`

## What This Document Is

This document records the approved second-pass review result for PR #21 / KROAD-005 after merge to `main`.

It preserves the review-stage decision in repository memory so future work can continue from repository evidence instead of chat history.

## What This Document Is Not

```text
- not a Resolver MVP implementation
- not KROAD-006
- not broad resolver logic for all P0 families
- not hidden LLM-opinion resolver behavior
- not downstream enforcement evidence
- not runtime/browser proof
- not Builder execution proof
- not production readiness proof
```

## Review Identity

```yaml
reviewed_pr: 21
reviewed_branch: kroad-005-decision-resolver-contract
reviewed_head_sha: 85da7d9fba4f032427bd1bbca02f5083b9ad8ec0
merge_commit_sha: 3c10fc4e11e38aeb2939af2993801454245fe198
merged_at_utc: 2026-07-09T11:32:52Z
status: completed_stage
final_conclusion: approved_for_human_review_or_merge_and_now_merged
```

## Files Reviewed

```text
AGENTS.md
planning/NEXT_WORK.md
planning/KERNEL_EXECUTION_PLAN.md
PR #21 metadata/status/checks/review threads

docs/decision-governance/DECISION_RESOLVER_CONTRACT.md
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/decision-governance/resolver-status-vocabulary.v0.json
kernel/fixtures/invalid/resolver_contract/invalid_auto_condition_unresolvable_status.json
kernel/fixtures/invalid/resolver_contract/invalid_conditional_condition_auto_status.json
kernel/fixtures/invalid/resolver_contract/invalid_downstream_validated_with_runtime_only.json
kernel/fixtures/invalid/resolver_contract/invalid_matrix_guidance_as_output.json
kernel/fixtures/invalid/resolver_contract/invalid_missing_evidence_refs.json
kernel/fixtures/invalid/resolver_contract/invalid_official_docs_project_ready_auto_condition.json
kernel/fixtures/invalid/resolver_contract/invalid_project_export_with_official_docs_only.json
kernel/fixtures/invalid/resolver_contract/invalid_runtime_browser_with_project_export_only.json
kernel/fixtures/invalid/resolver_contract/invalid_unknown_family_auto_resolved.json
kernel/fixtures/invalid/resolver_contract/invalid_unresolvable_condition_conditional_status.json
kernel/fixtures/valid/resolver_contract/valid_layout_structure_rule_contract.json
kernel/schemas/resolver-rule.v0.schema.json
kernel/validator/validate-resolver-contract.mjs
package.json
planning/NEXT_WORK.md
```

## What Was Verified

### Resolver status vocabulary

The resolver status vocabulary is machine-readable and represents exactly these statuses:

```text
auto_resolved
conditional
unresolvable
```

The vocabulary also defines the ordered evidence tiers used by the resolver contract:

```text
none
official_docs
project_export
runtime_browser
downstream_validated
```

### Resolver rule contract shape

The KROAD-005 artifacts define a resolver-rule contract baseline with:

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

Resolver rules require evidence references. A resolver rule without evidence refs is invalid contract evidence, not a reliable executable rule.

### Evidence-tier behavior

Evidence tier is part of resolver logic. The validator-plan behavior records ordered evidence-tier satisfaction:

```text
none < official_docs < project_export < runtime_browser < downstream_validated
```

A rule-level `required_evidence_tier` must be satisfied by at least one `evidence_refs` entry at or above that tier.

For non-`unresolvable` conditions, condition-level `required_evidence_refs` must map to declared `evidence_refs.evidence_id` entries, and the matched evidence must satisfy the condition's required tier.

### Fail-closed and insufficient-evidence behavior

The contract allows the resolver to return:

```text
unresolvable
```

instead of guessing when rule or evidence is insufficient.

Unknown decision families fail closed as `unresolvable` and must not produce invented resolver output.

Official-doc-only evidence is not treated as project-ready. Official Elementor docs support documented platform/editor capability only; they do not prove target project availability, active Pro license, current user permission, constructability, Builder execution, runtime behavior, downstream acceptance, or production readiness.

### Output boundary

Human or LLM free-text opinion is not treated as resolver output.

The contract distinguishes P0 matrix guidance from resolver contract output. `P0` decision matrices provide comparison guidance and option sets, but a matrix is not resolver output and does not itself assign final decisions.

The contract does not assign final target-project decisions without evidence.

### Fixture and validator-plan evidence

Valid and invalid fixture evidence is present under:

```text
kernel/fixtures/valid/resolver_contract/
kernel/fixtures/invalid/resolver_contract/
```

Invalid fixtures cover at least:

```text
missing evidence refs fail
unknown family fails closed
official-doc-only evidence cannot become project-ready
under-tier evidence cannot satisfy a higher declared evidence tier
condition bucket outcome_status must match its bucket
matrix guidance and free-text opinion are not resolver output
```

The resolver-contract validator is wired into `validate:mvk` through `package.json`.

### Documentation alignment

`docs/decision-governance/DECISION_RESOLVER_CONTRACT.md` explains:

```text
- the relationship between resolver contracts and P0 decision matrices;
- the relationship between resolver contracts and Decision Record v2;
- the allowed resolver statuses;
- evidence tiers and evidence refs;
- condition bucket behavior;
- fail-closed behavior;
- fixture locations;
- validation commands;
- next allowed step.
```

### PR review-thread disposition

The second-pass state resolved the review threads related to:

```text
- precise condition-bucket diagnostic paths;
- schema setup vs P0 matrix index failure reporting;
- evidence refs satisfying declared evidence tier;
- condition outcome status matching its bucket.
```

## CI / Workflow Results

The observed GitHub Actions runs for PR #21 head `85da7d9fba4f032427bd1bbca02f5083b9ad8ec0` were:

```yaml
Validate MVK:
  status: completed
  conclusion: success
  run_number: 211

Behavioral Coverage Audit:
  status: completed
  conclusion: success
  run_number: 179
```

The observed `Validate MVK` job steps included:

```yaml
Validate MVK fixtures and gates:
  conclusion: success

Validate roadmap memory consistency:
  conclusion: success
```

## Boundary Statement

The second-pass review and PR #21 merge do not claim any of the following:

```text
- no Resolver MVP implemented
- no KROAD-006 implemented
- no broad resolver logic for all P0 families implemented
- no hidden LLM-opinion resolver behavior introduced
- no evidence-free resolver rule accepted
- no forced answer when evidence is insufficient
- no downstream enforcement claimed
- no runtime proof claimed
- no Builder execution proof claimed
- no production readiness claimed
```

KROAD-005 is a contract baseline only. It defines the schema, vocabulary, documentation, fixtures, diagnostics, and validator boundary needed before KROAD-006.

## Non-Blocking Follow-Up

Later `KROAD-006` may implement a small Resolver MVP for high-risk P0 families.

That future work must remain scoped and evidence-backed. KROAD-005 only defines the contract and does not resolve real target-project decisions.

## Final Conclusion

KROAD-005 review stage was safe enough and does not require another critic pass.

KROAD-005 is complete on `main` through PR #21.

Next allowed roadmap item: `KROAD-006 — Resolver MVP for High-Risk P0 Families`.

## What Must Not Be Done Yet

```text
- do not implement KROAD-006 in this review record task
- do not implement Resolver MVP in this review record task
- do not add active resolver rules from this review record task
- do not broaden this into all P0 families
- do not treat official documentation as project/runtime/Builder/downstream proof
- do not claim downstream enforcement
- do not claim runtime proof
- do not claim Builder execution proof
- do not claim production readiness
```
