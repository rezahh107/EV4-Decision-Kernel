# KROAD-009 Layout Structure Vertical Slice — Second-Pass / Post-Merge Review Record

Status: completed stage  
Scope: KROAD-009 — Vertical Slice  
Active resolver-covered family: `layout_structure`  
Owner or intended consumer: EV4 Decision Kernel maintainers and future roadmap operators  
Recorded from live repository inspection: PR #29 merged on `main`

## What This Document Is

This document records the second-pass and post-merge review result for PR #29 / KROAD-009 after merge to `main`.

It preserves the completed-stage review result in repository memory so future work can continue from live repository evidence instead of chat history.

## What This Document Is Not

```text
- not KROAD-010 Downstream Consumer Contract
- not Project Gate intake
- not runtime/browser evidence
- not a re-audit policy implementation
- not a new Resolver MVP family
- not all-P0 resolver coverage
- not downstream enforcement
- not Builder execution proof
- not production-readiness proof
- not real target-project proof from synthetic fixtures
```

## Review Identity

```yaml
reviewed_pr: 29
reviewed_branch: kroad-009/layout-structure-vertical-slice
reviewed_head_sha: b6150599d71e92785f31f32da9692fe59fa21b88
merge_commit_sha: f2e1dfdff90a40a590cced1697b9d8225a075b91
merged_at_utc: 2026-07-10T09:15:46Z
status: completed_stage
final_conclusion: second_pass_green_and_merged
active_resolver_covered_family: layout_structure
```

Live GitHub metadata confirmed that PR #29 was closed through merge, and live `main` resolved to the same merge commit.

## Files Reviewed

```text
AGENTS.md
planning/NEXT_WORK.md
planning/KERNEL_EXECUTION_PLAN.md
PR #29 metadata/status/checks/review threads/comments

docs/decision-governance/KROAD_009_LAYOUT_STRUCTURE_VERTICAL_SLICE.md
kernel/decision-governance/kroad-009-layout-structure-vertical-slice.v0.json
kernel/validator/validate-kroad-009-vertical-slice.mjs
kernel/fixtures/valid/vertical_slice/layout_structure_flexbox_vertical_slice_valid.json
kernel/fixtures/invalid/vertical_slice/layout_structure_schema_valid_resolver_wrong_vertical_slice_invalid.json
kernel/fixtures/adversarial/vertical_slice/layout_structure_grid_without_availability_vertical_slice_adversarial.json
kernel/fixtures/invalid/vertical_slice/malformed_null_vertical_slice_invalid.json
package.json
planning/NEXT_WORK.md
```

## What Was Verified

### Complete Kernel-local vertical slice

KROAD-009 provides one complete Kernel-local vertical slice for:

```text
layout_structure
```

The slice connects:

```text
fixture-scoped source/evidence refs
  -> P0 matrix: p0.matrix.layout_structure.v0
  -> resolver rule: resolver.rule.layout_structure.mvp.v0@0.1.0
  -> resolver registry
  -> resolveDecision(...)
  -> Decision Record v2 schema
  -> KROAD-008 fixture triplet policy
  -> KROAD-007 L2 audit
  -> stable machine-readable diagnostics
```

The manifest also binds the documentation, validator, package scripts, validation commands, canonical graph files, and exact active-family scope.

### Valid path

The valid fixture is schema-valid, uses controlled `project_export`-tier fixture evidence, resolves deterministically to:

```text
resolver_status: auto_resolved
selected_option: flexbox
l2_audit_status: pass
```

### Schema-valid but resolver-wrong path

The invalid semantic fixture remains structurally schema-valid but records `grid` while the deterministic Resolver selects `flexbox`.

The expected L2 result is deterministic failure with stable diagnostics including:

```text
L2_SELECTED_OPTION_RESOLVER_MISMATCH
L2_HUMAN_OVERRIDE_REQUIRED
L2_SELECTED_OPTION_OUTSIDE_RESOLVER_ALLOWED_SET
L2_ALLOWED_OPTIONS_OUTSIDE_RESOLVER_OUTPUT
```

This preserves the required boundary:

```text
schema valid != resolver correct
```

### Adversarial near-valid path

The adversarial fixture provides a two-axis Grid-like context but does not prove Grid availability.

The expected result remains fail-closed:

```text
resolver_status: unresolvable
resolver_diagnostic: RESOLVER_MVP_GRID_REQUIRES_AVAILABILITY
requires_reaudit: true
l2_audit_status: pass
l2_diagnostic: L2_DECISION_REQUIRES_REAUDIT
```

The L2 pass means the Decision Record honestly preserves the Resolver's unresolvable result. It does not mean Grid was accepted or that runtime behavior was proved.

### Synthetic evidence boundary

All vertical-slice evidence remains fixture-scoped with:

```text
source_type: kernel_fixture
```

The reviewed artifacts explicitly state that synthetic fixture or matrix-guidance evidence is not:

```text
- real target-project evidence
- runtime validation
- downstream enforcement
- Builder execution proof
- Project Gate acceptance
- production readiness
```

### Scope boundary

The live active Resolver MVP family set remains exactly:

```text
layout_structure
```

No new Resolver MVP family was added. KROAD-010 and later roadmap items were not implemented by PR #29.

## Repair Verification

### Malformed/null fixture fail-closed repair

The final merged validator checks parsed fixture shape before property access.

A fixture that parses to a non-object, including a file containing only:

```json
null
```

returns the stable machine-readable diagnostic:

```text
KROAD_009_CASE_SHAPE_INVALID
```

and produces no case summary instead of allowing a raw `TypeError` to escape.

### Malformed/null regression coverage

The merged state includes:

```text
kernel/fixtures/invalid/vertical_slice/malformed_null_vertical_slice_invalid.json
```

The validator contains a dedicated malformed-null regression that verifies:

```text
- no exception escapes
- KROAD_009_CASE_SHAPE_INVALID is emitted
- summary remains null
- diagnostics remain machine-readable
```

The validator also contains malformed case-metadata regressions for null, primitive, empty-object, missing-path, and non-string-path entries. These must fail before fixture reading with:

```text
KROAD_009_CASE_METADATA_INVALID
```

### Expected schema-invalid support

The optional expected schema-invalid support was applied in the merged validator.

When:

```text
expected_result.schema_valid === false
```

schema invalidity is treated as expected rather than automatically producing `KROAD_009_DECISION_RECORD_SCHEMA_INVALID`.

This does not weaken the current KROAD-009 resolver-wrong semantic fixture. That fixture remains:

```text
expected_result.schema_valid: true
```

and must still be rejected by L2 through `L2_SELECTED_OPTION_RESOLVER_MISMATCH`.

### Graph and scope hardening

The final merged validator also verifies:

```text
- manifest graph references
- referenced artifact existence
- exact active/covered family scope
- required validator set
- package.json script wiring
- validation command ordering
- synthetic evidence source type
- KROAD-010+ false boundary fields
```

Table-driven negative regressions require specific KROAD-009 diagnostics when these graph, scope, command, or package facts are mutated.

## CI / Validation Evidence

The observed GitHub Actions runs for final PR #29 head:

```text
b6150599d71e92785f31f32da9692fe59fa21b88
```

were:

```yaml
Validate MVK:
  status: completed
  conclusion: success
  run_number: 266
  run_id: 29080132597

Behavioral Coverage Audit:
  status: completed
  conclusion: success
  run_number: 234
  run_id: 29080132612
```

The observed `Validate MVK` job steps included:

```yaml
Install MVK validator dependencies:
  conclusion: success

Validate MVK fixtures and gates:
  conclusion: success

Validate roadmap memory consistency:
  conclusion: success
```

The commands represented by the merged package/workflow path include:

```bash
npm run validate:kroad-009-vertical-slice
npm run validate:mvk
npm run validate:roadmap-memory
```

No local shell command was executed while creating this review-memory document. The completed KROAD-009 validation statements above are GitHub Actions evidence for the final PR #29 head.

## PR Review-Thread Disposition

GitHub review threads were inspected after PR #29 merge.

Observed disposition:

```yaml
total_review_threads_observed: 3
formally_resolved: 3
unresolved_total: 0
outdated_resolved: 2
active_resolved: 1
```

The resolved threads covered:

```text
- non-object/null fixture fail-closed handling
- expected schema-invalid case support
- enforcement of broader KROAD-010+ boundary fields
```

The first two threads were outdated after code changes but remained formally marked resolved. The third thread remained attached to current diff lines and was also formally resolved.

## Boundary Statement

The KROAD-009 implementation, its second-pass review, and this post-merge record do not claim any of the following:

```text
- no KROAD-010 Downstream Consumer Contract
- no Project Gate intake
- no runtime/browser evidence layer
- no re-audit policy implementation
- no new Resolver MVP family
- no all-P0 resolver coverage
- no downstream enforcement
- no Builder execution proof
- no production-readiness claim
- no real target-project proof from synthetic fixtures
```

KROAD-009 remains one Kernel-local, fixture-scoped, resolver-backed vertical-slice pattern for `layout_structure` only.

## Roadmap Memory

KROAD-009 is complete on `main` through merged PR #29.

The next roadmap task remains:

```text
KROAD-010 — Downstream Consumer Contract
```

This review-memory task does not start or implement KROAD-010.

`planning/KERNEL_EXECUTION_PLAN.md` was not changed because this task does not change roadmap meaning, scope, dependency, acceptance criteria, or evidence requirements. Its KROAD-009 status label may remain a legacy non-authoritative value; current roadmap status is governed by `planning/NEXT_WORK.md`.

## Final Conclusion

KROAD-009 is complete on `main` and its final merged state contains the requested vertical-slice path, fail-closed repairs, regression coverage, graph/scope hardening, and successful head-associated CI evidence.

No additional KROAD-009 implementation or critic pass is required before the repository owner decides whether to begin a separately scoped KROAD-010 task.

## What Must Not Be Done Yet

```text
- do not implement KROAD-010 in this review-memory task
- do not add a downstream consumer contract
- do not add Project Gate intake
- do not add runtime/browser collectors or evidence claims
- do not add a re-audit policy
- do not add new Resolver MVP families
- do not broaden to all P0 families
- do not treat synthetic fixtures as real target-project proof
- do not claim downstream enforcement
- do not claim Builder execution proof
- do not claim production readiness
```
