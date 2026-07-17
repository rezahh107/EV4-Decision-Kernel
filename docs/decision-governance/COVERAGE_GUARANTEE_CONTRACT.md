# EV4 Decision Kernel — Coverage Guarantee Contract v1

## Authority and boundaries

`kernel/decision-governance/coverage-guarantee-contract.v1.json` is authoritative. Coverage remains `not_measurable_pending_external_promotion`; percentages remain `null`. This policy creates no runtime proof, consumer proof, Coverage credit, readiness, production-readiness, product effect, external-repository effect, or KROAD supersession.

Independent pre-Merge PR review is `optional_advisory` and has no Merge authority. Exact-head CI and an explicit owner Merge command remain required. This repository policy does not alter the separate external Coverage-promotion predicate `independent_review_passed`; CI, Merge, advisory review, or target-repository prose cannot satisfy that predicate.

A zero-delta Coverage Impact is permitted only for a bounded blocking defect or non-Coverage maintenance that preserves Coverage state, closes no obligation or Family, grants no credit, and names the next content-expansion package. Every sensitive PR must carry exactly one schema-valid Impact bound to the repository, PR, base, structured work-package identity, exact sensitive changed paths, and runtime-derived head.

PR validation uses `pull_request` identity and requires the externally verified PR number. `Validate Main` uses explicit `post_merge` identity and intentionally supplies no PR number; it selects exactly one Impact carrier by repository, exact pre-push base SHA, structured current work-package ID, and exact sensitive changed-path set. Zero matches fail with `COV_IMPACT_POST_MERGE_NOT_FOUND`; multiple matches fail with `COV_IMPACT_POST_MERGE_AMBIGUOUS`.

The trusted-base Coverage adapter recognizes only the exact pre-owner-policy wrapper generation and the exact owner-policy wrapper generation. The owner-policy generation executes the pinned pre-owner-policy wrapper against PRF-010 and legacy sources read from the exact trusted base, never by recursively importing itself. Unknown or mutated wrapper shapes fail closed with `COV_TRUSTED_BASE_WRAPPER_GENERATION_UNSUPPORTED`.

## Normative machine-view mirror

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
    "zero_delta": "blocking_defect_or_non_coverage_maintenance_with_preserved_state_and_no_credit",
    "three_consecutive_zero_delta_fail": true,
    "derived_from_verified_base_head": true
  },
  "merge_gate": {
    "exact_head_ci_green": "required",
    "independent_pr_inspector_green": "optional_advisory",
    "explicit_owner_merge_command": "required"
  }
}
```
<!-- COVERAGE-GUARANTEE-NORMATIVE-VIEW:END -->
