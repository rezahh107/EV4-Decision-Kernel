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

Matrix-only Families receive no Resolver credit. A not-applicable link requires a dedicated disposition under `planning/coverage/dispositions/not-applicable/`. The validator derives acceptance only when the disposition's intrinsic subject, reason, validator rule, exact evidence head and independently resolved source statement all match, and that source predates and is reachable from the validated PR base. A producer-supplied `validator_accepted` flag has no authority.

Every obligation or Question-chain link that contributes credit must use typed repository evidence. The validator resolves the path and JSON Pointer or symbol, then verifies intrinsic role-specific identity: Question, Family, Matrix, active Rule, fixture target, audit target, proof subject, or credit subject as applicable. A carrier's self-declared `subject_record_id` and `coverage_subject_id` are never sufficient. JavaScript symbols require the exact binding in `coverage-evidence-subject-registry.v1.json`; symbol existence alone grants no credit.

Runtime and consumer proof require their dedicated receipts under `planning/coverage/proofs/`, but a dedicated path and schema are only syntax. The validator also resolves every immutable capture lineage item, recomputes hashes, checks exact-head ancestry and freshness, matches a producer registered unchanged at both the evidence head and validated PR base, binds capture time exactly to the enclosing receipt, and confines raw bytes to the role-specific capture directory. The producer registration and capture evidence must predate and be reachable from the PR base; producer or capture files introduced by the coverage-claiming PR cannot authorize that same PR. Runtime observations use the contract's finite vocabulary and must be `observed_pass`; consumer proof must be `accepted`, while `rejected` is blocking negative evidence. The producer registry is initially empty because this PR has no authoritative external capture or consumer source.

Coverage credit is an in-memory validator derivation projected into the dedicated receipt format. Producer-authored `coverage_granted: true` has no authority. The projection must match the current schema-and-hash-validated baseline identity and exactly every preceding link's evidence ID, immutable hash, subject and head; missing, extra, duplicate, stale or cross-Question evidence fails closed. This does not make the unresolved denominator measurement-active. Generic fixtures, planning files and review prose cannot satisfy proof or credit roles. These contracts do not assert that any real runtime proof, consumer acceptance or coverage credit currently exists.

## Contract states

1. `policy_active` — the contract, real non-empty data, baseline, debt, validator, negative fixtures and CI wiring exist.
2. `measurement_active` — denominator members are source-bound, hashes verify, candidates are dispositioned, denominators are validated and percentages are derived.
3. `threshold_enforced` — measurement is active, all three thresholds are computed, critical coverage is 100%, and release/readiness checks consume the result.

The expected state after `DCOV-EXEC-001` is `policy_active`. Unresolved denominator candidates are valid at this stage and force percentage values to remain `null`.

## Denominator integrity

Known scope includes non-duplicate `confirmed`, `candidate` and `unresolved` records. Denominator changes are derived from the verified base-to-head Ledger and Catalog transition. Every added, removed or reclassified ID requires a typed record-level reason whose evidence is either the affected record's exact verified source reference or a schema-valid disposition naming the exact record, reason, before/after memberships, target relationship, and source lineage. Unrelated Matrix or governance evidence cannot justify a reduction. Duplicate and supersession dispositions require valid targets. Deleting or disguising hard records to improve a percentage is invalid. When a denominator transition is invalid, its raw attempted values remain available only for diagnostics; effective coverage metrics preserve the verified base values, so a rejected transition cannot reduce a denominator or increase a numerator.

For every coverage-sensitive PR, exactly one newly added Coverage Impact Record must match the repository, PR number, merge base, current work package and the complete sensitive changed-path set. Its exact head is verified from Git and the CI event at runtime; a historical record cannot satisfy a later PR.

## Material progress

After `measurement_active`, a content-expansion package must satisfy at least one of: a coverage increase of at least five percentage points; completion of `max(2, ceil(0.05 * current_denominator))` items; or completion of one P0 Family across every applicable Element with measurable numerator growth.

During `policy_active`, a content package must complete a materially bounded set of obligation IDs and close at least one real Family or Element slice. Completed IDs, closed Families, percentage deltas and zero-delta status are derived from the verified base-to-head artifacts rather than trusted declarations. A zero-delta package is limited to a blocking defect and must name the next content-expansion package. Impact chronology uses a contiguous `sequence_number` plus `previous_impact_id`; gaps, duplicates, forks, predecessor mismatches, and filename/sequence disagreement fail closed. The three-consecutive rule uses only that canonical sequence, never filename order.

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
    ],
    "semantic_subject_binding_required": true,
    "js_symbol_subject_registry": "kernel/decision-governance/coverage-evidence-subject-registry.v1.json",
    "proof_receipt_schemas": {
      "runtime_proof": "kernel/schemas/coverage-runtime-proof-receipt.v1.schema.json",
      "consumer_proof": "kernel/schemas/coverage-consumer-proof-receipt.v1.schema.json",
      "coverage_credit": "kernel/schemas/coverage-credit-receipt.v1.schema.json"
    },
    "not_applicable_disposition": {
      "schema": "kernel/schemas/coverage-not-applicable-disposition.v1.schema.json",
      "directory": "planning/coverage/dispositions/not-applicable/",
      "acceptance": "validator_derived_from_exact_subject_reason_head_and_lineage",
      "producer_acceptance_flag_allowed": false,
      "source_must_preexist_validated_base": true
    },
    "proof_provenance": {
      "producer_registry": "kernel/decision-governance/coverage-proof-producer-registry.v1.json",
      "producer_registry_schema": "kernel/schemas/coverage-proof-producer-registry.v1.schema.json",
      "capture_schema": "kernel/schemas/coverage-proof-capture.v1.schema.json",
      "max_age_days": 30,
      "exact_head_required": true,
      "all_lineage_hashes_recomputed": true,
      "capture_time_binding": "exact_receipt_observation_time",
      "raw_capture_path_binding": "role_specific_dedicated_directory",
      "producer_and_capture_must_preexist_validated_base": true,
      "same_pr_producer_or_capture_credit_allowed": false,
      "runtime_allowed_observation_types": [
        "dom_structure",
        "computed_style",
        "responsive_layout",
        "interaction_state",
        "accessibility_tree"
      ],
      "runtime_credit_result": "observed_pass",
      "consumer_credit_result": "accepted"
    },
    "coverage_credit_derivation": {
      "authority": "validator_recomputed",
      "rule_id": "COV-QUESTION-CREDIT-V1",
      "rule_version": "1.0.0",
      "baseline_binding": "current_validated_baseline_id",
      "source_evidence_binding": "exact_all_preceding_link_ids_hashes_subjects_and_heads",
      "producer_coverage_granted_allowed": false
    },
    "generic_fixture_or_document_proof_allowed": false
  },
  "denominator_transition": {
    "mode": "verified_base_head_diff_with_typed_record_reasons",
    "semantic_reason_evidence_required": true,
    "disposition_schema": "kernel/schemas/coverage-denominator-disposition.v1.schema.json",
    "invalid_change_effective_coverage": "preserve_verified_base_metrics"
  },
  "coverage_impact_binding": {
    "current_pr": "one_new_runtime_head_bound_record_per_sensitive_pr",
    "history_ordering": {
      "sequence_field": "sequence_number",
      "predecessor_field": "previous_impact_id",
      "sequence_starts_at": 1,
      "gaps_allowed": false,
      "forks_allowed": false,
      "filename_order_controls_execution": false,
      "filename_sequence_disagreement_allowed": false
    }
  },
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
