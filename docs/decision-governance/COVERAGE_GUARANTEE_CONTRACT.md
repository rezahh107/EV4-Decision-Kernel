# EV4 Decision Kernel — Coverage Guarantee Contract v1

## Status and authority

- `status`: `policy_active_candidate_on_dcov_exec_001`
- `contract_version`: `1.0.0`
- `machine_readable_source`: `kernel/decision-governance/coverage-guarantee-contract.v1.json`
- `owner`: Kernel

The JSON contract is authoritative. This document is its human-readable view. Contract state is derived by `npm run validate:coverage`; it is never promoted by an approval field or a manual authority flag.

## Thresholds

- Minimum content floor: **90%**
- Owner acceptance target: **95%**
- Critical P0 and safety coverage: **100%**

An aggregate percentage cannot hide a critical gap. Percentages remain `null` while an in-scope denominator is unresolved.

## Coverage meanings

An Element is covered only when every applicable Decision Question, P0 Family, safety gate, runtime check and consumer proof is either `end_to_end_covered` or `not_applicable_with_validated_reason`. A Decision Card, Matrix, Resolver Rule, fixture, schema, documentation page or CI pass does not independently establish Element coverage.

A Decision Question earns credit only through this complete applicable chain:

`Catalog → Matrix → Resolver Rule → Deterministic Evaluator → Valid Fixture → Invalid Fixture → Adversarial Fixture → L2 Audit → Required Runtime or Consumer Proof → Coverage Credit`

Matrix-only Families receive no Resolver credit. A not-applicable link requires a machine-readable reason, supporting evidence and validator acceptance.

Every obligation or Question-chain link that contributes credit must use typed repository evidence. The validator resolves the path and JSON Pointer or symbol, verifies the artifact role, subject record, exact `coverage_subject_id` for that obligation or chain link, content hash, artifact version and pinned-commit or runtime-head binding, and grants no numerator credit to empty, free-form, stale, cross-record, cross-subject or wrong-type references.

## Contract states

1. `policy_active` — the contract, real non-empty data, baseline, debt, validator, negative fixtures and CI wiring exist.
2. `measurement_active` — denominator members are source-bound, hashes verify, candidates are dispositioned, denominators are validated and percentages are derived.
3. `threshold_enforced` — measurement is active, all three thresholds are computed, critical coverage is 100%, and release/readiness checks consume the result.

The expected state after `DCOV-EXEC-001` is `policy_active`. Unresolved denominator candidates are valid at this stage and force percentage values to remain `null`.

## Denominator integrity

Known scope includes non-duplicate `confirmed`, `candidate` and `unresolved` records. Denominator changes are derived from the verified base-to-head Ledger and Catalog transition. Every added, removed or reclassified ID requires a typed, source-backed record-level reason; duplicate and supersession dispositions require valid targets. Deleting or disguising hard records to improve a percentage is invalid.

For every coverage-sensitive PR, exactly one newly added Coverage Impact Record must match the repository, PR number, merge base, current work package and the complete sensitive changed-path set. Its exact head is verified from Git and the CI event at runtime; a historical record cannot satisfy a later PR.

## Material progress

After `measurement_active`, a content-expansion package must satisfy at least one of: a coverage increase of at least five percentage points; completion of `max(2, ceil(0.05 * current_denominator))` items; or completion of one P0 Family across every applicable Element with measurable numerator growth.

During `policy_active`, a content package must complete a materially bounded set of obligation IDs and close at least one real Family or Element slice. Completed IDs, closed Families, percentage deltas and zero-delta status are derived from the verified base-to-head artifacts rather than trusted declarations. A zero-delta package is limited to a blocking defect and must name the next content-expansion package. Three consecutive zero-delta coverage-sensitive packages fail validation.

## Merge eligibility

Merge requires all three independent conditions: green exact-head CI, green independent PR inspection, and an explicit owner merge command. This contract grants no agent Merge authority.

## Normative machine-view mirror

The validator compares this block with the authoritative JSON contract. Editing one without the other fails closed.

<!-- COVERAGE-GUARANTEE-NORMATIVE-VIEW:START -->
```json
{
  "contract_version": "1.0.0",
  "thresholds": {
    "minimum_content_floor": 90,
    "owner_acceptance_target": 95,
    "critical_p0_and_safety_coverage": 100
  },
  "state_names": [
    "policy_active",
    "measurement_active",
    "threshold_enforced"
  ],
  "element_coverage_definition": "all_applicable_obligations_end_to_end_or_validated_not_applicable",
  "question_coverage_chain": [
    "catalog",
    "matrix",
    "resolver_rule",
    "deterministic_evaluator",
    "valid_fixture",
    "invalid_fixture",
    "adversarial_fixture",
    "l2_audit",
    "required_runtime_or_consumer_proof",
    "coverage_credit"
  ],
  "evidence_binding": {
    "carrier_kind": "typed_repository_artifact",
    "head_binding_modes": [
      "git_runtime_head",
      "pinned_commit"
    ]
  },
  "denominator_transition": "verified_base_head_diff_with_typed_record_reasons",
  "coverage_impact_binding": "one_new_runtime_head_bound_record_per_sensitive_pr",
  "material_progress_rules": {
    "option_1": "coverage_delta_gte_5_percentage_points",
    "option_2": "max(2, ceil(0.05 * current_denominator))",
    "option_3": "complete_p0_family_with_measurable_numerator_growth",
    "policy_active": "complete_materially_bounded_obligations_and_close_one_real_family_slice",
    "zero_delta": "blocking_defect_only_with_next_content_expansion_package",
    "three_consecutive_zero_delta_fail": true,
    "derived_from_verified_base_head": true
  },
  "merge_gate_requirements": [
    "exact_head_ci_green",
    "independent_pr_inspector_green",
    "explicit_owner_merge_command"
  ]
}
```
<!-- COVERAGE-GUARANTEE-NORMATIVE-VIEW:END -->

## Boundaries

This contract measures and rejects unsupported claims. It does not select project-specific design, implement external producers or consumers, create a runtime platform, or assert production readiness.
