# KROAD-007 L2 Decision Correctness Audit — Second-Pass Review Record

Status: completed stage  
Scope: KROAD-007 L2 Decision Correctness Audit  
Owner or intended consumer: EV4 Decision Kernel maintainers and future roadmap operators  
Recorded from live repository inspection: PR #26 merged on `main`

## What This Document Is

This document records the approved second-pass review result for PR #26 / KROAD-007 after merge to `main`.

It preserves the review-stage decision in repository memory so future work can continue from repository evidence instead of chat history.

## What This Document Is Not

```text
- not KROAD-008
- not new Resolver MVP family coverage
- not a full decision engine
- not downstream consumer contract
- not Project Gate intake
- not runtime/browser evidence implementation
- not Builder execution proof
- not production readiness proof
- not universal semantic-correctness proof
```

## Review Identity

```yaml
reviewed_pr: 26
reviewed_branch: kroad-007-l2-decision-correctness-audit
reviewed_head_sha: dd29b7b9822d84259a0b4face6549d05b4ed1c56
merge_commit_sha: 630af55076ab3508c95e80afc668135cdbfdcf30
merged_at_utc: 2026-07-09T15:26:59Z
status: completed_stage
final_conclusion: approved_second_pass_and_merged
selected_active_resolver_covered_family: layout_structure
```

## Files Reviewed

```text
AGENTS.md
planning/NEXT_WORK.md
planning/KERNEL_EXECUTION_PLAN.md
PR #26 metadata/status/checks/review threads/comments

kernel/validator/validate-l2-decision-correctness.mjs
docs/decision-governance/L2_DECISION_CORRECTNESS_AUDIT_KROAD_007.md
docs/decision-governance/DECISION_RESOLVER_CONTRACT.md
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/fixtures/valid/l2_decision_correctness/*
kernel/fixtures/invalid/l2_decision_correctness/*
kernel/fixtures/adversarial/l2_decision_correctness/*
package.json
planning/NEXT_WORK.md
```

## What Was Verified

### Deterministic L2 boundary

KROAD-007 implements a deterministic L2 Decision Correctness Audit for resolver-covered families.

It is not a second free-text LLM opinion. The active L2 validator reruns or deterministically evaluates Resolver MVP output and compares it against the recorded `decision_record_v2` fields.

The active resolver-backed L2 coverage remains limited to:

```text
layout_structure
```

Unsupported families are not treated as fully resolver-backed. They are surfaced as unsupported rather than accepted as semantically correct resolver-backed decisions.

### Resolver rerun path

The L2 validator imports and uses:

```text
kernel/resolver-mvp/resolve-high-risk-p0.mjs#resolveDecision
```

The fixture envelope contains:

```text
decision_record
resolver_input
audit_context
```

For resolver-covered families, L2 reruns `resolveDecision(resolver_input)` and compares the result with the decision record.

### Diagnostic behavior

The second-pass review verified that L2 detects or surfaces at least:

```text
- resolver-status mismatch
- selected-option mismatch
- selected option outside resolver allowed set
- allowed-options disagreement
- forbidden option selection
- missing exact required evidence refs
- under-tier evidence
- missing conditional justification
- conditional justification evidence-ref gaps
- missing or malformed conditional limitations_acknowledged
- hidden human override
- visible human override
- rule ID mismatch
- rule version mismatch
- requires_reaudit
- unsupported resolver family
- unsupported overclaims such as production_ready, Builder proof, runtime proof, downstream enforcement, Project Gate acceptance, all-P0 coverage, or universal semantic correctness
```

Representative machine-readable diagnostics include:

```text
L2_RESOLVER_STATUS_MISMATCH
L2_SELECTED_OPTION_RESOLVER_MISMATCH
L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET
L2_ALLOWED_OPTIONS_OUTSIDE_RESOLVER_OUTPUT
L2_FORBIDDEN_OPTION_SELECTED
L2_EVIDENCE_TIER_BELOW_RESOLVER_OUTPUT
L2_DECISION_MISSING_REQUIRED_EVIDENCE_REF
L2_DECISION_REQUIRED_EVIDENCE_REF_TIER_UNSATISFIED
L2_CONDITIONAL_JUSTIFICATION_REQUIRED
L2_CONDITIONAL_JUSTIFICATION_EVIDENCE_REFS_REQUIRED
L2_CONDITIONAL_LIMITATIONS_ACKNOWLEDGED_REQUIRED
L2_CONDITIONAL_JUSTIFICATION_EVIDENCE_REF_NOT_IN_RECORD
L2_CONDITIONAL_JUSTIFICATION_REQUIRED_REF_MISSING
L2_HUMAN_OVERRIDE_REQUIRED
L2_HUMAN_OVERRIDE_OBSERVED
L2_RULE_ID_MISMATCH
L2_RULE_VERSION_MISMATCH
L2_DECISION_REQUIRES_REAUDIT
L2_DECISION_FAMILY_NOT_RESOLVER_COVERED
L2_UNSUPPORTED_OVERCLAIM
```

### Conditional justification repair

The approved final PR state includes the second-pass repair for conditional justification.

Conditional decisions require:

```text
summary
evidence_refs
limitations_acknowledged
```

`limitations_acknowledged` must be a non-empty array of non-empty strings. Missing, empty, or malformed `limitations_acknowledged` emits:

```text
L2_CONDITIONAL_LIMITATIONS_ACKNOWLEDGED_REQUIRED
```

### Direct-run portability repair

The approved final PR state repaired the direct-run portability issue in the L2 validator.

The direct-run guard uses:

```text
fileURLToPath(import.meta.url) === process.argv[1]
```

instead of comparing `import.meta.url` against a manually constructed `file://` string.

### Covered-family cache cleanup

The approved final PR state also caches resolver-covered families at module scope:

```text
DEFAULT_COVERED_FAMILIES = loadCoveredFamilies()
```

This avoids repeated registry reads during fixture-loop validation without changing L2 semantics.

### Registry status alignment

The machine-readable resolver registry now records KROAD-007 L2 status explicitly:

```yaml
resolver_mvp_scope:
  l2_audit_implemented: true

l2_audit_scope:
  implemented: true
  reruns_resolver: true
  free_text_llm_judgment_allowed: false
  covered_decision_families:
    - layout_structure
  kroad_008_or_later_implemented: false
```

The next allowed step remains:

```text
KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
```

### Fixture coverage

Valid, invalid, and adversarial fixture coverage exists under:

```text
kernel/fixtures/valid/l2_decision_correctness/
kernel/fixtures/invalid/l2_decision_correctness/
kernel/fixtures/adversarial/l2_decision_correctness/
```

The final approved fixture set includes coverage for resolver-consistent pass cases, schema-valid but resolver-wrong decisions, selected/allowed/forbidden option violations, evidence-tier and exact-evidence-ref violations, conditional-justification failures, visible and hidden human override behavior, rule version mismatch, explicit re-audit surfacing, unsupported-family handling, and unsupported overclaim rejection.

### Validation wiring

`package.json` wires:

```text
npm run validate:l2-decision-correctness
```

and includes it in:

```text
npm run validate:mvk
```

`npm run validate:roadmap-memory` remains available and is run by the `Validate MVK` workflow job.

## CI / Workflow Results

The observed GitHub Actions runs for PR #26 head `dd29b7b9822d84259a0b4face6549d05b4ed1c56` were:

```yaml
Validate MVK:
  status: completed
  conclusion: success
  run_number: 255

Behavioral Coverage Audit:
  status: completed
  conclusion: success
  run_number: 223
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

GitHub review threads were inspected after PR #26 merge.

Observed disposition:

```yaml
total_review_threads_observed: 2
formally_resolved: 0
unresolved_total: 2
outdated_unresolved: 2
active_unresolved: 0
```

The unresolved threads were bot review comments from `gemini-code-assist`. Both substantive comments were reflected in the final merged code: module-level caching for `loadCoveredFamilies()` and cross-platform direct-run detection using `fileURLToPath(import.meta.url)`. The threads were not formally marked resolved in GitHub.

Do not claim these threads were formally resolved unless a later repository operation marks them resolved and verifies that state.

## Process Note

During the earlier KROAD-007 implementation work, a known process exception occurred: an empty branch-probe file was accidentally written to `main` and then removed. That direct-write exception is historical and must remain visible in process memory.

During this KROAD-007 review-record task, no direct write to `main` was intentionally performed. This review record task used a separate documentation branch and PR workflow.

## Boundary Statement

The second-pass review and PR #26 merge do not claim any of the following:

```text
- no KROAD-008 implemented
- no new Resolver MVP family implemented
- no full decision engine implemented
- no downstream consumer contract implemented
- no Project Gate intake implemented
- no runtime/browser evidence layer implemented
- no Builder execution proof claimed
- no production readiness claimed
- no universal semantic correctness claimed
```

KROAD-007 is a deterministic L2 audit for resolver-covered fixture-scoped cases only. It covers `layout_structure` as the active resolver-backed family and does not expand all P0 coverage.

## Non-Blocking Follow-Up

Next roadmap item:

```text
KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
```

KROAD-008 must not be inferred from KROAD-007. It requires its own scoped implementation, review, validation, and repository evidence.

## Final Conclusion

KROAD-007 review stage was safe enough and does not require another critic pass.

KROAD-007 is complete on `main` through PR #26.

Future work may proceed to `KROAD-008 — Resolver Fixtures: valid / invalid / adversarial`, subject to human maintainer control.

## What Must Not Be Done Yet

```text
- do not implement KROAD-008 in this review record task
- do not add more resolver fixtures in this review record task
- do not add L2 logic in this review record task
- do not add new Resolver MVP families in this review record task
- do not broaden this into all P0 families
- do not treat fixture-scoped L2 success as real target-project proof
- do not claim downstream enforcement
- do not claim Project Gate intake
- do not claim runtime/browser proof
- do not claim Builder execution proof
- do not claim production readiness
```
