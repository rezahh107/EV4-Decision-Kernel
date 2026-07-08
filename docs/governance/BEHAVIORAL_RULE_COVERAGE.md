# Behavioral Rule Coverage — EV4 Decision Kernel

**Version:** 0.4.1-behavioral-audit-model with Elementor V4 doc coverage rows  
**Status:** active practical behavioral audit model for EV4 Decision Kernel

## Purpose

Behavioral Rule Coverage v0.4.1 records whether a Kernel behavioral rule is prompt-level guidance or has a repository-visible enforcement carrier. This pass adds Elementor V4 official-document coverage rows without claiming full documentation mirroring, runtime monitoring, downstream rejection, Builder execution, or production readiness.

This document is the source read by `tools/audit-behavioral-coverage.mjs`.

## Evidence States

```text
confirmed: inspected repository evidence proves the carrier exists and behaves as claimed.
insufficient_evidence: the carrier may exist, but it was not inspected or was ambiguous/stale.
not_applicable: the rule does not require that carrier in this repository phase.
not_implemented: the carrier is intentionally absent.
```

## Enforcement Status Ladder

```text
prose_only
schema_backed
validator_backed
fixture_tested
advisory_ci_observed
ci_enforced
sequence_ci_enforced
runtime_monitor_enforced
os_harness_enforced
downstream_contract_enforced
```

`advisory_ci_observed` never satisfies any Critical or High minimum by itself.

## Interpretation Rules

```text
- prompt_level_influence is not system_level_enforcement.
- field presence is not semantic enforcement.
- fixture existence is not CI enforcement.
- synthetic fixture coverage is not real E2E proof.
- CI success is not production readiness.
- downstream_contract_enforced requires inspected downstream rejection evidence.
- runtime_monitor_enforced requires an actual runtime monitor.
```

## Coverage Matrix Format

The matrix must use exactly these columns:

```text
rule_id
concept
risk
prose_source
schema_carrier
validator_rule
valid_fixture
invalid_fixture
CI_step
downstream_contract
session_scope
recovery_action
status
```

## MVK Coverage Matrix

| rule_id | concept | risk | prose_source | schema_carrier | validator_rule | valid_fixture | invalid_fixture | CI_step | downstream_contract | session_scope | recovery_action | status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `R-MVK-DOC-001` | Required official Elementor V4 documentation areas must not be silently missing. | Critical | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | elementor-v4-doc-coverage-index.required_doc_areas | validate-elementor-doc-coverage.mjs checks required doc areas and source/label refs | elementor_doc_coverage_index_valid.json | required_doc_area_missing_invalid.json, unknown_evidence_label_ref_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-002` | Context-only official docs must have no-card reasons. | High | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | no_decision_card_reason | validate-elementor-doc-coverage.mjs rejects missing no-card reason | elementor_doc_coverage_index_valid.json | context_source_missing_no_card_reason_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-003` | Components must not claim project availability from official docs. | Critical | docs/sources/ELEMENTOR_V4_SOURCE_QUALITY_NOTES.md | components dependency boundary labels | validate-elementor-doc-coverage.mjs rejects Components project_availability claim type | elementor_doc_coverage_index_valid.json | components_claims_project_availability_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-004` | Class priority must not be inferred from generic Classes docs. | High | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | class_priority_cascade doc area | validate-elementor-doc-coverage.mjs requires src.elementor.v4.class_priority | elementor_doc_coverage_index_valid.json | class_priority_source_missing_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-005` | Responsive inheritance docs must not be treated as runtime validation. | Critical | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | responsive not-proven boundaries | validate-elementor-doc-coverage.mjs rejects runtime proof claims outside limitation fields | elementor_doc_coverage_index_valid.json | responsive_inheritance_claims_runtime_validation_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-006` | Reset-style behavior must preserve reconciliation notes. | High | docs/sources/ELEMENTOR_V4_SOURCE_QUALITY_NOTES.md | reset_style_reconciliation source quality notes | validate-elementor-doc-coverage.mjs requires quality notes for conflicting sources | elementor_doc_coverage_index_valid.json | source_quality_note_required_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | repair_request | `fixture_tested` |
| `R-MVK-DOC-007` | Nested Links topology must reference the official source. | Critical | docs/decision-cards/ELEMENT_DECISION_CARDS.md | button official_source_refs and nested_links doc area | validate-elementor-doc-coverage.mjs requires Nested Links source and Button card ref | elementor_doc_coverage_index_valid.json | nested_links_source_missing_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-008` | Source quality notes must be preserved for ambiguous or conflicting official docs. | High | docs/sources/ELEMENTOR_V4_SOURCE_QUALITY_NOTES.md | source_quality_notes | validate-elementor-doc-coverage.mjs requires notes for conflicting/stale/quality-note status | elementor_doc_coverage_index_valid.json | source_quality_note_required_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | repair_request | `fixture_tested` |
| `R-MVK-DOC-009` | Official doc coverage artifacts must not claim Builder execution, downstream enforcement, runtime proof, or production readiness. | Critical | README.md evidence boundary | forbidden proof claim scanner | validate-elementor-doc-coverage.mjs scans forbidden proof claims outside not-proven/limitation fields | elementor_doc_coverage_index_valid.json | forbidden_production_ready_claim_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | block | `fixture_tested` |
| `R-MVK-DOC-010` | V3/V4 differences must be represented as compatibility context only. | High | docs/sources/ELEMENTOR_V4_DOC_COVERAGE_INDEX.md | v3_v4_differences doc area | validate-elementor-doc-coverage.mjs requires src.elementor.v4.v3_v4_differences | elementor_doc_coverage_index_valid.json | v3_v4_difference_source_missing_invalid.json | Validate MVK / npm run validate:mvk | None | per_artifact | repair_request | `fixture_tested` |

## Deferred Out-of-Scope Rules

Full Elementor documentation mirroring, full control-level registry, runtime monitor enforcement, downstream rejection, Builder execution proof, Project Gate intake, and production readiness remain outside this patch.

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

Expected behavior:

```text
advisory: passes if this document and matrix are structurally valid.
strict: may fail while Critical/High rules remain below v0.4.1 thresholds.
```

`fixture_tested` means local validator and fixtures cover the rule and invalid fixtures assert exact expected diagnostic codes. It does not mean CI enforcement or downstream contract enforcement.
