# EV4 Decision Coverage Operationalization Map

**Status:** proposed operational map pending parent-spec approval and merge
**Parent specification:** `docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md`
**Authority boundary:** schedules bounded proposed work only; it activates no Registry, Decision Family, Resolver Rule, metric or readiness claim.

## Status Model

`not_started`, `ready_for_planning`, `planning_in_progress`, `plan_approved`, `implementation_in_progress`, `pr_open`, `merged`, `evidence_closed`, `blocked`, `superseded`.

`evidence_closed` is package-lifecycle evidence only. It does not imply parent-spec authority. Every implementation package sourced from this specification additionally requires `parent_authority: approved_recovery_source_of_record`, which is recorded only after the full parent promotion gate—including explicit governance approval—has been satisfied.

## Decision Dependency Summary

```text
Project Environment → Element Identity → Capability Availability → Structural Responsibility
→ Layout Structure → Interaction/Semantic Role → Styling Mechanism → Control Compatibility
→ Property Compatibility → Value Strategy → Unit Strategy → State/Responsive/Direction
→ Saved-Source Validation → Runtime Validation → Downstream Closure
```

## Work-Package Inventory

### DCOV-WP-001 — Recovery Specification Integration

```yaml
status: pr_open
source_requirement_ids: [ARCH-004, ARCH-005, ARCH-006, EVID-006, EVID-007, EVID-008, RULE-001, COMP-001, RECORD-001, RECORD-002, COV-001, ROAD-001, ROAD-002, OPS-001, OPS-002, OPS-009]
decision_dependencies: []
target_repository: rezahh107/EV4-Decision-Kernel
implementation_scope: [parent specification, correction ledger, dependency DAG, composition contract, roadmap memory, operational map]
explicit_non_goals: [Resolver implementation, Registry schemas/data, demand corpus, producer/runtime implementation]
expected_pr_boundary: one six-path documentation/planning PR
stop_conditions: [newer approved equivalent exists, roadmap contradiction, coherence requires runtime or Resolver code]
post_merge_followup: record exact merge evidence and reassess DCOV-WP-002 eligibility
```

### DCOV-WP-002 — Reconciliation and Source-Ledger Schema Foundation

```yaml
status: blocked
source_requirement_ids: [ARCH-005, ARCH-006, ARCH-007, EVID-006, EVID-007, ELEM-001, ELEM-002, ELEM-003, CAP-001, CAP-002, CTRL-001, CTRL-002, ROAD-002, OPS-001, OPS-002]
decision_dependencies: [parent_authority=approved_recovery_source_of_record, repository placement approved]
target_repository: rezahh107/EV4-Decision-Kernel
implementation_scope: [reconciliation schema, source-ledger schema, validators, valid/invalid schema fixtures]
explicit_non_goals: [element data, question data, Resolver Rules, complete inventory claim]
expected_pr_boundary: one schema-and-validator PR
stop_conditions: [placement unresolved, schema requires invented current identities]
post_merge_followup: update roadmap memory and evaluate DCOV-WP-003
```

### DCOV-WP-003 — Verified Element Reconciliation Data

```yaml
status: blocked
source_requirement_ids: [EVID-006, EVID-007, EVID-008, ELEM-001, ELEM-002, ELEM-003, CAP-001]
decision_dependencies: [parent_authority=approved_recovery_source_of_record, DCOV-WP-002 evidence_closed]
implementation_scope: [source fingerprints, evidence-backed reconciliation records, unresolved inactive records]
explicit_non_goals: [Decision Question Catalog, Resolver activation]
expected_pr_boundary: one evidence-data PR
```

### DCOV-WP-004 — Recovered Decision Question Catalog Draft

```yaml
status: blocked
source_requirement_ids: [DEC-001, DEC-002, DEC-003, RULE-001, RULE-002, RULE-003, COMP-001, COMP-002, EVID-004, OPS-001]
decision_dependencies: [parent_authority=approved_recovery_source_of_record, DCOV-WP-002 evidence_closed, approved candidate identifiers]
implementation_scope: [catalog schema, validator, recovered draft, fixtures]
explicit_non_goals: [evaluator, active Resolver Rules, complete-catalog claim]
expected_pr_boundary: one catalog-contract/draft PR
```

### DCOV-WP-005 — Practical Decision Demand Corpus Contract

```yaml
status: blocked
source_requirement_ids: [PROD-003, COV-001, COV-002, COV-003, COV-004, COV-005, ROAD-003, OPS-001]
decision_dependencies: [parent_authority=approved_recovery_source_of_record, privacy and telemetry governance approved]
implementation_scope: [corpus contract, sampling/dedup policy, governed initial corpus, calibration report]
explicit_non_goals: [final weights, 95 percent claim, ungoverned private telemetry]
expected_pr_boundary: contract PR and separately reviewed data PR when warranted
```

## Dependency Order

```text
DCOV-WP-001
→ parent authority promotion gate
→ DCOV-WP-002
→ DCOV-WP-003 and DCOV-WP-004
parent authority promotion gate + privacy/telemetry governance → DCOV-WP-005
DCOV-WP-003 + DCOV-WP-004 + DCOV-WP-005
→ compatibility foundation → family-bounded Resolver work → fixture/L2
→ consumer enforcement → calibrated baseline → KROAD-018 assessment
```

## Current Eligibility

- `DCOV-WP-001`: current documentation PR; implementation coverage created: none.
- `DCOV-WP-002`: blocked until `parent_authority=approved_recovery_source_of_record` is explicitly recorded after the full promotion gate and repository placement is approved. Merge, CI success or `evidence_closed` alone cannot unlock it.
- Existing KROAD-012 retains its approved purpose. Research may proceed in parallel only when it does not commit unapproved identifiers or paths.
- All data, Resolver, L2, consumer and coverage packages remain blocked by their dependencies.

## Prompt-Generation Contract

Every future operational prompt must include:

```yaml
work_package_id:
source_spec_sections: []
source_requirement_ids: []
decision_dependencies: []
target_repository:
target_files_or_artifact_types: []
prerequisites: []
implementation_scope: []
explicit_non_goals: []
evidence_requirements: []
acceptance_criteria: []
required_tests: []
required_repository_memory_updates: []
expected_pr_boundary:
stop_conditions: []
post_merge_followup:
```

Rules: read live state; resolve requirement IDs exactly once in the parent index; never expand scope silently; keep planning/implementation/validation/merge distinct; require committed evidence; update planning memory after merge; select next work from dependency state rather than conversation memory.

## Implementation Evidence Fields

```yaml
implementation_evidence:
  branch:
  commit_sha:
  pull_request:
  merged_commit_sha:
  changed_paths: []
  validation_commands: []
  validation_results: []
  review_record:
  evidence_closure_record:
  verified_at:
```

No package reaches `evidence_closed` from prose or CI success alone. No recovery-spec-sourced implementation package becomes eligible from `evidence_closed` alone; it must also satisfy `parent_authority=approved_recovery_source_of_record`.
