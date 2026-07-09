# KROAD-006 Resolver MVP — Second-Pass Review Record

Status: completed stage  
Scope: KROAD-006 Resolver MVP for high-risk P0 families  
Owner or intended consumer: EV4 Decision Kernel maintainers and future roadmap operators  
Recorded from live repository inspection: PR #23 merged on `main`

## What This Document Is

This document records the approved second-pass review result for PR #23 / KROAD-006 after merge to `main`.

It preserves the review-stage decision in repository memory so future work can continue from repository evidence instead of chat history.

## What This Document Is Not

```text
- not KROAD-007 L2 audit
- not downstream consumer contract
- not Project Gate intake
- not runtime/browser evidence implementation
- not Builder execution proof
- not production readiness proof
- not all-P0 resolver expansion
- not semantic correctness proof outside covered fixture-scoped cases
```

## Review Identity

```yaml
reviewed_pr: 23
reviewed_branch: kroad-006-resolver-mvp-layout-structure
reviewed_head_sha: b4cc210db4ab4ebc3231a9075c2ebb9e03320254
merge_commit_sha: fa706e0cf66c36cc2005cc80bf6460d677c32bd8
merged_at_utc: 2026-07-09T13:10:03Z
status: completed_stage
final_conclusion: approved_for_human_review_or_merge_and_now_merged
selected_mvp_family: layout_structure
```

## Files Reviewed

```text
AGENTS.md
planning/NEXT_WORK.md
planning/KERNEL_EXECUTION_PLAN.md
PR #23 metadata/status/checks/review threads

kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/validator/validate-resolver-contract.mjs
kernel/fixtures/valid/resolver_mvp/*
kernel/fixtures/invalid/resolver_mvp/*
kernel/fixtures/adversarial/resolver_mvp/*
docs/decision-governance/RESOLVER_MVP_KROAD_006.md
docs/decision-governance/DECISION_RESOLVER_CONTRACT.md
docs/decision-governance/P0_DECISION_MATRICES.md
planning/NEXT_WORK.md
package.json
```

## What Was Verified

### MVP scope

KROAD-006 activates a limited deterministic Resolver MVP for one selected high-risk P0 family:

```text
layout_structure
```

The active option family is:

```text
div_block
flexbox
grid
```

The resolver is fixture-scoped and Kernel-local. It is not a full decision engine and does not claim real target-project semantic correctness.

### Resolver output behavior

The MVP can produce the bounded resolver statuses:

```text
auto_resolved
conditional
unresolvable
```

The selected family has valid, invalid, and adversarial fixture coverage. The resolver emits:

```text
auto_resolved
```

only when the controlled fixture context and exact required evidence refs support a deterministic single option.

It emits:

```text
conditional
```

when evidence or context is bounded but not enough to force one project-specific option.

It emits:

```text
unresolvable
```

for missing evidence, unsupported context, unsupported family, malformed active-rule inputs, invalid evidence tier, or adversarial evidence-ref mismatch.

### Evidence behavior

The review verified these evidence boundaries:

```text
- insufficient evidence is rejected;
- official-doc-only evidence remains conditional, not project-ready;
- unknown decision families fail closed;
- unsupported P0 families remain unsupported and fail closed;
- invalid required_evidence_tier handling fails closed;
- exact evidence-ref binding is enforced before any non-unresolvable output.
```

The evidence-ref binding path is:

```text
active condition required_evidence_refs
  -> input.context.required_evidence_refs
  -> input.evidence_refs
  -> required evidence tier
```

An unrelated evidence ref with a sufficient tier does not satisfy the active condition.

### Defensive malformed-input handling

The second-pass review verified that malformed registry and active-rule inputs produce deterministic diagnostics instead of runtime `TypeError` paths, including:

```text
registry.active_rules is not an array
active rule entry is not an object
active rule file parses to null or non-object value
invalid active Resolver MVP rule object
```

### Fixture expectation repair

Invalid and adversarial fixtures use the actual correct expected resolver outputs, not attacker overclaims.

Representative expected fail-closed fixture outcomes include:

```text
invalid_missing_evidence_refs -> unresolvable
invalid_unknown_family_auto_resolved -> unresolvable
invalid_unsupported_required_evidence_tier -> unresolvable
adversarial_official_docs_auto_resolved -> conditional
adversarial_grid_without_availability -> unresolvable
adversarial_unrelated_project_export_ref -> unresolvable
adversarial_missing_context_required_evidence_refs -> unresolvable
adversarial_absent_context_required_evidence_ref -> unresolvable
```

### Validation wiring

`package.json` wires:

```text
npm run validate:resolver-mvp
```

and includes it in:

```text
npm run validate:mvk
```

`npm run validate:roadmap-memory` is also present as a dedicated roadmap-memory validator.

### Roadmap memory

`planning/NEXT_WORK.md` records KROAD-006 as complete on `main` and points to the next roadmap item:

```text
KROAD-007 — L2 Decision Correctness Audit
```

`planning/KERNEL_EXECUTION_PLAN.md` still describes KROAD item meaning, scope, dependencies, acceptance criteria, evidence requirements, and do-not rules. Its KROAD-006 status label may remain stale by repository convention; `planning/NEXT_WORK.md` is the current status authority.

## CI / Workflow Results

The observed GitHub Actions runs for PR #23 head `b4cc210db4ab4ebc3231a9075c2ebb9e03320254` were:

```yaml
Validate MVK:
  status: completed
  conclusion: success
  run_number: 240

Behavioral Coverage Audit:
  status: completed
  conclusion: success
  run_number: 208
```

The observed `Validate MVK` job steps included:

```yaml
Validate MVK fixtures and gates:
  conclusion: success

Validate roadmap memory consistency:
  conclusion: success
```

No local shell command was executed while recording this document. The validation result above is GitHub Actions evidence only.

## PR Review-Thread Disposition

GitHub review threads were inspected after PR #23 merge.

Observed disposition:

```yaml
total_review_threads_observed: 6
formally_resolved: 0
unresolved_total: 6
outdated_unresolved: 2
active_unresolved: 4
```

The unresolved threads were bot review comments from `gemini-code-assist`. The implementation appears to have addressed the substantive issues in code and fixtures, but the threads were not formally marked resolved in GitHub. They remain for human maintainer disposition.

Do not claim these threads were resolved unless a later repository operation marks them resolved and verifies that state.

## Boundary Statement

The second-pass review and PR #23 merge do not claim any of the following:

```text
- no KROAD-007 L2 audit implemented
- no downstream consumer contract implemented
- no Project Gate intake implemented
- no runtime/browser evidence layer implemented
- no Builder execution proof claimed
- no production readiness claimed
- no all-P0 resolver expansion implemented
- no semantic correctness claimed outside covered fixture-scoped cases
```

KROAD-006 is a limited Resolver MVP only. It covers `layout_structure` and preserves fail-closed behavior for unsupported families.

## Non-Blocking Follow-Up

Next roadmap item:

```text
KROAD-007 — L2 Decision Correctness Audit
```

KROAD-007 must rerun the resolver or equivalent deterministic logic; it must not become a second free-text LLM opinion.

## Final Conclusion

KROAD-006 review stage was safe enough and does not require another critic pass.

KROAD-006 is complete on `main` through PR #23.

Future work may proceed to `KROAD-007 — L2 Decision Correctness Audit`, subject to human maintainer control.

## What Must Not Be Done Yet

```text
- do not implement KROAD-007 in this review record task
- do not add L2 audit logic in this review record task
- do not add more Resolver MVP families in this review record task
- do not broaden this into all P0 families
- do not treat official documentation as project/runtime/Builder/downstream proof
- do not claim downstream enforcement
- do not claim runtime/browser proof
- do not claim Builder execution proof
- do not claim production readiness
```
