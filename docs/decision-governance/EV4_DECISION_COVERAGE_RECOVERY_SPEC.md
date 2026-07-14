# EV4 Decision Kernel — Decision Coverage Recovery and Proposed Integration Specification


## 0. Document Control

| Field | Value |
|---|---|
| `status` | `proposed_recovery_specification_pending_evidence_validation` |
| `version` | `1.0.0-rc1` |
| `purpose` | Recover the broad EV4 decision-governance objective, distinguish it from the small MVK, and define bounded future work. |
| `repository` | `rezahh107/EV4-Decision-Kernel` |
| `repository_precheck` | `main` at `ccab57d9f0be0286dc68297404ef040a77e80b36` |
| `authority` | Proposed requirement source only; repository evidence remains implementation truth. |
| `promotion_target` | `approved_recovery_source_of_record` only after the promotion gate. |

This document consolidates and hardens the supplied recovery draft. It preserves its core product conclusions while separating historical intent, current facts, derived requirements, proposals and unresolved candidates.

### 0.1 Origin vocabulary

```yaml
origin:
  existing_repository_contract
  verified_current_repository_fact
  verified_current_official_fact
  recovered_historical_requirement
  recovered_from_multiple_sources
  derived_architectural_requirement
  newly_proposed_architecture
  unresolved_candidate
```

Origin is not implementation status or approval. `[ARCH-004]`

### 0.2 Evidence metadata

```yaml
repository_evidence:
  repository:
  branch:
  commit_sha:
  path:
  content_hash:
  verified_at:
  claim_scope:

official_source_evidence:
  url:
  retrieved_at:
  content_fingerprint: pending_fingerprint_capture
  claim_scope:
  affected_artifacts: []
  verification_status: verified_for_recovery_draft_pending_canonical_source_capture
```

Raw URLs and chat recovery notes are discovery evidence, not sufficient canonical proof. `[EVID-005] [EVID-006]`

### 0.3 Promotion gate and implementation authority

Promotion requires repository evidence capture, official-source fingerprints, contradiction review, governance approval, synchronized planning memory, exact-head validation, merged PR evidence and post-merge closure. Until then, `complete`, `canonical`, `active`, `approved metric` and `95% covered` are prohibited except as target-state criteria. `[ARCH-005]`

The canonical implementation-eligibility predicate for every recovery-spec-sourced implementation package is:

```yaml
parent_authority: approved_recovery_source_of_record
```

This authority value may be recorded only after every promotion-gate condition above is satisfied. Package status `merged` or `evidence_closed`, CI success, and repository-placement approval do not independently or collectively imply this authority transition. An evidence-closure record must explicitly prove the full promotion gate and record the authority change before any implementation package may become eligible.


## 1. Executive Decision

Kernel is the shared deterministic rule memory, evidence-contract authority, vocabulary authority, Resolver authority and validation source for EV4 consumers. It does not replace Architect, CE, Builder, Responsive or Project Gate role engines. `[PROD-001]`

The intended objective was broad reduction of model variance across recurring Elementor V4 forks. The MVK and its `layout_structure` vertical slice were valid starting choices; the roadmap defect was the absence of an explicit later coverage-expansion program. `[PROD-002] [PROD-003]`

KROAD-012 through KROAD-017 remain important evidence, runtime, lifecycle, sequence and freshness work. They do not substitute for Resolver expansion. KROAD-018 remains an assessment gate. `[COV-005]`


## 2. Product Definition and Non-Goals

### 2.1 Product

Equivalent normalized input, equivalent evidence and the same Rule version must yield the same Resolver status and selected option or bounded allowed set. `[ARCH-001]`

### 2.2 Role boundary

| Repository | Ownership |
|---|---|
| Kernel | vocabulary, evidence semantics, candidate constraints, Rules, diagnostics, schemas and validation |
| Architect | identify forks, provide context and create Decision Records within Kernel constraints |
| CE | prove constructability and close or reject decisions |
| Builder | execute locked evidence-backed decisions without hidden redesign |
| Responsive | validate runtime, viewport, state and direction behavior |
| Project Gate | validate schema, lineage, pin, hash, authority and handoff compliance |

### 2.3 Non-goals

This specification does not implement Rules, activate Families, populate inventories/catalogs/corpora, modify producers, modify consumers, or claim readiness. Kernel is not a complete Elementor documentation mirror or an unbounded UI-control mirror.


## 3. Recovered Historical Intent

Recovered materials consistently describe a comparison-driven system. Each element/candidate needed `choose_when`, `avoid_when`, `compare_against`, decision questions, evidence, limitations, accessibility and runtime notes. Historical intent supports broad coverage of recurring decisions, not a promise that every proposed identifier or path was approved. `[PROD-003] [DEC-001]`

Recovered P0 surfaces include:

- Div Block / Flexbox / Grid;
- Image / SVG / Background Image;
- Heading / Paragraph;
- Button / Link / Clickable Container;
- Normal Flow / Relative / Absolute;
- Native Control / Custom CSS;
- Local Class / Global Class / Local Property;
- Variable / Literal / Dynamic Data;
- px / rem / % / auto / variable;
- project availability, capability proof and evidence boundaries.


## 4. Verified Current State

### 4.1 Repository facts

At the prechecked `main` commit, Kernel contains Decision Record v2, Resolver contracts, nine P0 matrices, eight MVK element IDs, fixture-triplet conventions, L2 replay and one active Resolver-backed family: `layout_structure`. Matrix presence is not Resolver coverage. `[EVID-004]`

Current repository claims in this draft are pending canonical hash capture and therefore cannot promote the document by themselves.

### 4.2 Current external-product facts

First-party Elementor pages were consulted during recovery drafting, but their canonical fingerprints remain pending. All current-product statements therefore use `verified_for_recovery_draft_pending_canonical_source_capture` and prove platform documentation only. `[EVID-001] [EVID-006]`

### 4.3 Not currently claimable

- complete current Atomic Element list;
- project availability from official docs;
- broad Resolver coverage;
- full consumer enforcement;
- practical coverage percentage;
- ecosystem, release or production readiness.


## 5. Correction and Contradiction Ledger

| Earlier claim | Correction | Classification |
|---|---|---|
| MVK scope equals final product scope | MVK was a deliberate vertical slice | verified current repository fact + recovered intent |
| Matrix coverage equals Resolver coverage | only executable registered Rules count | existing repository contract |
| Official docs prove project availability | docs prove documented capability only | existing repository contract |
| a historical element list is canonical | candidates require current reconciliation | unresolved candidate |
| one umbrella recovery item is sufficient | recovery must be bounded into dependent packages | newly proposed architecture |
| Decision Record v3 is automatically required | v2 extension profile is preferred absent a proven break | derived requirement |
| 95% weights can be frozen now | metric remains proposed until corpus calibration | newly proposed architecture |


## 6. Provenance and Requirement Classification

| Construct | Origin | Status |
|---|---|---|
| Decision Record v2 and Resolver statuses | `existing_repository_contract` | implemented within current scope |
| `layout_structure` Resolver slice | `verified_current_repository_fact` | active Kernel-local family only |
| broad variance-reduction objective | `recovered_from_multiple_sources` | product objective |
| dependency graph | `derived_architectural_requirement` | proposed contract |
| Rule composition policy | `derived_architectural_requirement` | proposed contract |
| Atomic Element Reconciliation Inventory | `newly_proposed_architecture` | candidate artifact |
| Recovered Decision Question Catalog Draft | `recovered_from_multiple_sources` | candidate artifact |
| Practical Decision Demand Corpus | `derived_architectural_requirement` | candidate denominator |
| PDDC formula/weights | `newly_proposed_architecture` | proposed and uncalibrated |
| KROAD-012R/A–H labels | `newly_proposed_architecture` | planning candidates only |
| new top-level Kernel paths | `unresolved_candidate` | placement undecided |
| Decision Record v2 extension profile | `newly_proposed_architecture` | recommendation only |


## 7. Decision Resolution Dependency Graph

```text
Project Environment
→ Element Identity
→ Capability Availability
→ Structural Responsibility
→ Layout Structure
→ Interaction / Semantic Role
→ Styling Mechanism
→ Control Compatibility
→ Property Compatibility
→ Value Strategy
→ Unit Strategy
→ State / Responsive / Direction
→ Saved-Source Validation
→ Runtime Validation
→ Downstream Closure
```

Initial resolution is acyclic. Candidate selection cannot precede identity and availability. Unit resolution cannot precede Control/Property/Value compatibility. Runtime conclusions cannot be inferred from static evidence. Reopen returns only to the earliest invalidated node. `[ARCH-002] [ARCH-003] [LIFE-001]`

```yaml
decision_dependency_graph:
  origin: derived_architectural_requirement
  initial_resolution_acyclic: true
  nodes:
    element_identity:
      requires: [project_environment]
      runs_before: [capability_availability, candidate_selection]
      may_block: [all_candidate_dependent_nodes]
      may_reopen: [project_environment]
      consumes_outputs_from: [project_environment]
      produces_inputs_for: [capability_availability, structural_responsibility]
    control_compatibility:
      requires: [styling_mechanism, capability_availability]
      runs_before: [property_compatibility, value_strategy, unit_strategy]
      may_block: [property_compatibility, value_strategy, unit_strategy]
    unit_strategy:
      requires: [property_compatibility, value_strategy]
      runs_before: [state_responsive_direction]
      may_block: [downstream_closure]
    runtime_validation:
      requires: [saved_source_validation]
      runs_before: [downstream_closure]
      may_reopen: [earliest_invalidated_decision_node]
```

This outline is proposed, not executable approval.


## 8. Rule Composition and Conflict Resolution

```text
Safety gate > hard constraint > compatibility constraint > evidence sufficiency > soft preference
```

Candidates combine by intersection. Weaker Rules cannot restore options rejected by stronger constraints. Soft preference ranks only surviving candidates. Ties, stale Rules, cross-family contradictions and unresolved evidence conflicts return `conditional` or `unresolvable`. Human escalation is mandatory when no candidate survives, authoritative evidence conflicts without precedence, or an override crosses a safety gate. `[RULE-001] [RULE-002] [RULE-003] [COMP-001] [COMP-002]`

```yaml
composition_policy:
  origin: derived_architectural_requirement
  precedence_order: [safety_gate, hard_constraint, compatibility_constraint, evidence_sufficiency, soft_preference]
  candidate_combination: intersection
  hard_failure_behavior: unresolvable
  tie_behavior: conditional_or_unresolvable
  conflicting_evidence_behavior: claim_scoped_precedence_or_halt
  cross_family_conflict_behavior: reopen_earliest_invalidated_dependency_or_halt
  stale_rule_handling: requires_reaudit
  rule_override: explicit_governed_override_only
```


## 9. Proposed Decision-Surface Taxonomy

### 9.1 Decision Families

Layout structure, media choice, text semantics, interaction topology, positioning, styling mechanism, class scope, value strategy, unit strategy, responsive/state/direction, data binding, forms/repeated content and V3/V4 migration boundaries.

### 9.2 Evidence domains

Official docs, project environment, project export/saved source, runtime browser and downstream validation. `[EVID-001] [EVID-002] [EVID-003]`

### 9.3 Safety and source-boundary gates

Nested interactive topology, accessibility, SVG/security, permission/dependency, unknown capability, stale Rule/source, unsupported generation and evidence promotion boundaries.

### 9.4 Compatibility and lifecycle rules

Element-capability, Control-Property, Property-Value, Property-Unit, state/responsive/direction, provisional, reopen and Rule revision compatibility.


## 10. Atomic Element Reconciliation

The target artifact is an **Atomic Element Reconciliation Inventory**, not a complete inventory claim. Records distinguish `atomic`, `compound`, `child_atom`, `layout_mode`, `classic_widget`, `capability` and `unresolved_candidate`. `[ELEM-001] [ELEM-003]`

Current candidates include MVK IDs (Div Block, Flexbox, Grid, Heading, Paragraph, Button, Image, SVG), project-observed Tabs/Divider/Form atoms and historically mentioned Accordion/Loop Grid/HTML/Icon. No unresolved candidate is active. Grid identity and all non-MVK additions require current evidence and source fingerprints. `[ELEM-002]`

Promotion requires schema approval, source fingerprints, unresolved-inactive checks, referential validation and merged governance evidence.


## 11. Capability / Control / Property / Unit Model

- Capability availability is separate from official documentation. `[CAP-001]`
- Element-capability cells carry evidence and confidence. `[CAP-002]`
- Control compatibility precedes Property, Value and Unit resolution. `[CTRL-001]`
- Scope is demand-bounded, not a full UI mirror. `[CTRL-002]`
- State values distinguish explicit, inherited, overridden, reset, default and unknown.
- Responsive records include breakpoint, inheritance/reset and direction semantics.
- Project environment records version, flags, Pro/license, permissions, plugins, theme, breakpoints, direction and V3/V4 composition.


## 12. Recovered Decision Question Catalog Draft

Each record includes `question_id`, Family, trigger context, candidates, dependency inputs, hard constraints, soft preferences, required evidence/tier, auto/conditional/unresolvable conditions, rejected-alternative requirements and accessibility/responsive/constructability/runtime concerns. `[DEC-001] [DEC-002]`

Recovered examples include Div/Flexbox/Grid; Image/SVG/Background; Heading/Paragraph; Button/Link/Clickable Container; Normal Flow/Relative/Absolute; Native Control/Custom CSS; Local/Global/Local Property; Variable/Literal/Dynamic; and px/rem/%/auto/variable.

Catalog records are guidance/contract data until executable Rule registration. `[DEC-003]`


## 13. Resolver Architecture

```text
normalized context → dependency checks → candidate generation → safety gates
→ hard/compatibility constraints → evidence sufficiency → soft ranking
→ auto_resolved | conditional | unresolvable → Decision Record → L2 replay
```

Unknown Families, malformed Rules, insufficient evidence and empty candidate intersections fail closed. Human override remains explicit and cannot override a safety gate without governed authority.


## 14. Decision Record Compatibility Assessment

**Result:** `introduce_v2_extension_profile`.

Existing v2 covers Resolver status, evidence tier, Rule identity/version, option sets, provisional/reopen lineage, override and downstream ownership. Normalized-input hashes and generated rationale can be derived views. Claim-scoped evidence buckets, dependency-node references and composition traces can be optional extensions. No proven semantic break requires v3. `[RECORD-001] [RECORD-002]`

A future v3 requires exact breaking reason, migration map, compatibility window, consumer impact, fixture migration, schema negotiation, Project Gate behavior and rollback policy. `[RECORD-003]`


## 15. Evidence Authority and Producer Boundaries

| Evidence | May prove | Must not prove |
|---|---|---|
| official docs | documented platform/editor capability | target project availability or runtime |
| project UI observation | observed environment state | global product availability |
| WordPress/saved-source producer | saved project/export facts | browser runtime |
| Browser producer | observed DOM/computed/runtime facts | saved-source authorship |
| downstream validation | scoped consumer acceptance/rejection | upstream facts outside inspected scope |

No producer creates or promotes tiers. KROAD-012 preserves producer boundaries; KROAD-013 owns runtime/browser evidence. `[EVID-001] [EVID-002] [EVID-003]`


## 16. Validation, Fixtures and L2

Every active Rule requires valid, invalid and adversarial fixtures. `[FIX-001]` L2 reruns the same deterministic Resolver and compares status, candidates, evidence, Rule version, provisional/reopen semantics, override visibility and forbidden overclaims. `[AUDIT-001]` Stable diagnostics include ID, severity, path, expected, observed and remediation boundary.


## 17. Consumer Enforcement

Consumer profiles pin Kernel versions and define stage-owned inputs/outputs, blocked Families, required evidence and reopen routes. Consumers cannot copy competing canonical contracts or reinterpret unsupported Families. Project Gate validates lineage and authority but does not invent missing facts. `[CONS-001]`


## 18. Decision Lifecycle

States include unresolved, conditional/provisional, auto-resolved, locked, reopened, superseded and closed. Evidence upgrades, runtime conflicts, downstream failures, Rule revisions and explicit overrides may trigger controlled reopen. History remains immutable; the new revision references the previous decision and earliest invalidated dependency. `[LIFE-001]`


## 19. Proposed 95% Coverage Model and Calibration

Primary concept: **Practical Decision Demand Coverage (PDDC)**. It measures end-to-end covered demand classes, not file count or Matrix count. A demand class is covered only when question, active Rule, fixture triplet, L2 and required consumer/Gate enforcement are all satisfied.

Weights and formulas are `proposed_unapproved_pending_calibration`; P0=5/P1=3/P2=1 is illustrative only. Calibration covers project archetype diversity, rare catastrophic decisions, frequency bias, synthetic limits, telemetry/privacy governance, deduplication, criticality review, confidence intervals/sampling uncertainty, metric versioning and anti-gaming. `[COV-001] [COV-002] [COV-003] [COV-004]`

Hard readiness gates remain separate from the weighted score. KROAD-018 assesses the evidence; it cannot generate coverage. `[COV-005]`


## 20. Repository Placement Decision

Existing conventions use `kernel/decision-governance/`, `kernel/registries/`, `kernel/schemas/`, `kernel/official-sources/`, `kernel/fixtures/` and validators. Candidate `kernel/elementor-v4/`, `kernel/evidence/` and `kernel/coverage/` paths remain unresolved.

Recommendation: extend existing conventions unless `DCOV-WP-002` proves a new package boundary is necessary. Implementation prompts use only approved paths and update manifests/validators consistently. `[ARCH-006]`


## 21. Candidate Artifact Set

| Artifact | Origin | Promotion criterion |
|---|---|---|
| Atomic Element Reconciliation Inventory | newly proposed | approved schema, fingerprints, inactive unresolved records, referential validation |
| Capability/Control/Property/Unit contracts | recovered + derived | approved placement, demand-bounded scope, validators and fixtures |
| Recovered Decision Question Catalog Draft | recovered | governed denominator, complete in-scope representation, valid candidate refs |
| Resolver Rules | existing pattern + future expansion | registered executable Rule, deterministic evaluator, triplets and L2 |
| Decision Record v2 extension profile | newly proposed | compatibility review, schema/fixture/consumer agreement |
| Practical Demand Corpus | derived | provenance, privacy, diversity, dedup and calibration review |
| Coverage Dashboard | newly proposed | reproducible versioned computation and hard-gate reporting |

Candidate paths in the supplied draft are not approved by this document.


## 22. Corrected Bounded Roadmap

| Candidate | Purpose | Bounded outcome | Non-goals |
|---|---|---|---|
| KROAD-012R | specification and scope restoration | docs, DAG, composition, roadmap memory | schemas/data/Resolver/runtime |
| KROAD-012A | evidence and element reconciliation | schema then evidence-data PRs | question/Resolver work |
| KROAD-012B | demand corpus | contract and governed sample | final weights/readiness |
| KROAD-012C | question catalog | schema, validator and recovered draft | evaluator/active Rules |
| KROAD-012D | compatibility foundation | bounded registries/validators | full UI mirror |
| KROAD-012E | P0 Resolver expansion | one Family or inseparable set per PR | broad all-family PR |
| KROAD-012F | fixtures and L2 | triplets and replay | consumer changes |
| KROAD-012G | consumer enforcement | one consumer repo per PR when possible | role redesign |
| KROAD-012H | coverage baseline | reproducible calibrated report | readiness creation |

All labels are candidates with `origin: newly_proposed_architecture`. Existing KROAD-012 through KROAD-018 meanings remain unchanged. `[ROAD-001] [ROAD-002] [ROAD-003]`


## 23. Operationalization Contract

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

Every package traces to IDs, stays bounded, reads live state, separates stages, requires committed evidence and updates memory after merge. Dependency state—not chat memory—selects the next package. `[OPS-001] [OPS-002] [OPS-003] [OPS-004] [OPS-005] [OPS-006] [OPS-007] [OPS-008] [OPS-009]`


## 24. Acceptance Criteria

- parent path exists and local links resolve;
- Requirement definitions are semantically one-to-one; aliases are non-normative and every Operationalization reference resolves exactly once to one canonical definition;
- every recovery-spec-sourced implementation package requires `parent_authority: approved_recovery_source_of_record` and cannot be unlocked by Merge, CI or package evidence closure alone;
- origins distinguish repository facts, historical intent, derived requirements, proposals and unresolved candidates;
- no unresolved Element is active;
- no Matrix-only Family is Resolver-covered;
- no metric is approved or 95% readiness claimed;
- v2 compatibility disposition is explicit and no v3 schema is created;
- KROAD-012 through KROAD-018 retain their meanings;
- changed-path scope remains documentation/planning only;
- repository-native validations pass on the exact final head, subject to documented environment limits;
- fresh PR Inspector review is completed before merge.


## 25. Risks and Failure Modes

Premature authority, inventory overclaim, raw-URL evidence, Family/Matrix confusion, unbounded Registry work, Unit-before-Property resolution, arbitrary tie-breaking, stale Rules, consumer reinterpretation, frequency-biased metrics and roadmap-memory divergence are blocking failure modes.


## 26. Open Questions

- current first-party Atomic Element inventory and fingerprints;
- Grid identity and compound/child boundaries;
- approved repository placement;
- corpus privacy and sampling governance;
- final metric weights and uncertainty method;
- exact v2 extension fields;
- required consumer carrier tiers by Family.


## 27. Traceability Matrix

| Objective | Requirements | Future package |
|---|---|---|
| restore MVK/product distinction | PROD-002, PROD-003, ROAD-001 | DCOV-WP-001 |
| reconcile element/source identities | EVID-005, EVID-006, ELEM-001–003 | DCOV-WP-002/003 |
| recover comparison demand | DEC-001–003, RULE-001–003 | DCOV-WP-004 |
| calibrate 95% model | COV-001–005 | DCOV-WP-005 |
| expand Resolver safely | ARCH-002–003, COMP-001–002, FIX-001, AUDIT-001 | later family-bounded packages |
| expand consumers | CONS-001, LIFE-001 | later consumer packages |

## 28. Requirement Index

Only headings below define requirement IDs; inline references do not create duplicate definitions.

### PROD-001

- **Normative statement:** Kernel owns shared vocabulary, evidence contracts, Resolver semantics and validation; consumer repositories retain role-specific engines.
- **Origin:** `recovered_from_multiple_sources`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### PROD-002

- **Normative statement:** The MVK is a deliberate vertical slice and is not full product coverage.
- **Origin:** `verified_current_repository_fact`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### PROD-003

- **Normative statement:** The product objective is broad reduction of model variance across recurring Elementor V4 decision demand.
- **Origin:** `recovered_from_multiple_sources`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ARCH-001

- **Normative statement:** Initial resolution must be deterministic for equivalent normalized input, evidence and Rule version.
- **Origin:** `recovered_from_multiple_sources`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ARCH-002

- **Normative statement:** Initial decision resolution follows the documented acyclic dependency graph.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ARCH-003

- **Normative statement:** Unit strategy must not resolve before Control, Property and Value compatibility.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ARCH-004

- **Normative statement:** Every major proposed construct carries an origin classification.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ARCH-005

- **Normative statement:** The specification remains proposed until its promotion gate is satisfied.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ARCH-006

- **Normative statement:** Implementation prompts may create only repository paths approved through a placement decision.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ARCH-007

- **Normative statement:** Runtime-dependent conclusions must not be derived from static or saved-source evidence.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.


### EVID-007

- **Normative statement:** Official-source claims without captured fingerprints remain recovery-draft evidence only.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### EVID-008

- **Normative statement:** Historical notes and raw URLs cannot promote current canonical claims.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### EVID-001

- **Normative statement:** Official documentation proves documented platform capability only.
- **Origin:** `existing_repository_contract`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### EVID-002

- **Normative statement:** Project UI observation remains project-scoped.
- **Origin:** `existing_repository_contract`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### EVID-003

- **Normative statement:** Saved-source and runtime evidence remain distinct producer domains.
- **Origin:** `existing_repository_contract`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### EVID-004

- **Normative statement:** Matrix guidance is not Resolver output.
- **Origin:** `existing_repository_contract`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### EVID-005

- **Normative statement:** Current repository claims require reproducible repository evidence metadata.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### EVID-006

- **Normative statement:** Current official-product claims require retrieval metadata and content fingerprints or a pending-fingerprint downgrade.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ELEM-001

- **Normative statement:** Element identities are reconciled by kind and evidence before activation.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ELEM-002

- **Normative statement:** Unresolved candidates remain inactive and fail closed.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ELEM-003

- **Normative statement:** Atomic, compound, child atom, layout mode, classic widget and capability identities must not be conflated.
- **Origin:** `recovered_from_multiple_sources`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### CAP-001

- **Normative statement:** Capability availability is proven separately from documented platform capability.
- **Origin:** `existing_repository_contract`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### CAP-002

- **Normative statement:** Element-capability relationships require referential and evidence validation.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### CTRL-001

- **Normative statement:** Control compatibility precedes Property, Value and Unit resolution.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### CTRL-002

- **Normative statement:** Control/Property/Unit contracts are bounded by demonstrated decision demand rather than an unbounded UI mirror.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### DEC-001

- **Normative statement:** Decision questions define candidates, dependencies, evidence requirements and conditional/unresolvable behavior.
- **Origin:** `recovered_historical_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### DEC-002

- **Normative statement:** Material rejected alternatives require machine-checkable reasons.
- **Origin:** `recovered_historical_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### DEC-003

- **Normative statement:** A recovered question record is not an active Resolver Rule.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### RULE-001

- **Normative statement:** Rule precedence is Safety gate > hard constraint > compatibility constraint > evidence sufficiency > soft preference.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### RULE-002

- **Normative statement:** Candidate sets combine by intersection; lower-order Rules cannot restore higher-order rejected options.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### RULE-003

- **Normative statement:** Ties and unresolved conflicts produce conditional or unresolvable, never arbitrary selection.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### COMP-001

- **Normative statement:** Cross-family conflicts reopen the earliest invalidated dependency or halt.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### COMP-002

- **Normative statement:** Conflicting authoritative evidence without approved precedence requires human escalation.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### RECORD-001

- **Normative statement:** Decision Record v2 is retained unless a proven semantic break requires v3.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### RECORD-002

- **Normative statement:** New fields prefer additive optional extensions or derived views over breaking changes.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### RECORD-003

- **Normative statement:** Any future v3 proposal requires migration, compatibility, negotiation and rollback plans.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### FIX-001

- **Normative statement:** Every active Resolver Rule requires valid, invalid and adversarial fixtures.
- **Origin:** `existing_repository_contract`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### AUDIT-001

- **Normative statement:** L2 reruns the deterministic Resolver and compares computed and recorded semantics.
- **Origin:** `existing_repository_contract`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### CONS-001

- **Normative statement:** Consumer repositories preserve role boundaries and reject unsupported reinterpretation.
- **Origin:** `recovered_from_multiple_sources`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### LIFE-001

- **Normative statement:** Reaudit and reopen preserve immutable history and return only to the earliest invalidated dependency.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### COV-001

- **Normative statement:** Practical Decision Demand Coverage remains proposed until a governed denominator is calibrated.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### COV-002

- **Normative statement:** Calibration addresses project diversity, catastrophic rare decisions and frequency bias.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### COV-003

- **Normative statement:** Calibration addresses synthetic limits, telemetry governance and deduplication.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### COV-004

- **Normative statement:** Coverage reports include uncertainty, metric version and anti-gaming checks.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### COV-005

- **Normative statement:** KROAD-018 assesses readiness and cannot create missing coverage.
- **Origin:** `derived_architectural_requirement`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ROAD-001

- **Normative statement:** The recovery program is split into bounded packages, not one umbrella implementation item.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ROAD-002

- **Normative statement:** The first implementation after this documentation package is limited to reconciliation/source-ledger schemas, validators and schema fixtures.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### ROAD-003

- **Normative statement:** Resolver, L2, consumer and coverage packages remain blocked until prerequisites close.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-001

- **Normative statement:** Every work package traces to parent requirement IDs.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-002

- **Normative statement:** One prompt produces one bounded architectural outcome or focused PR.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-003

- **Normative statement:** Operational prompts do not silently expand scope.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-004

- **Normative statement:** Planning, implementation, validation and merge stages remain distinct.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-005

- **Normative statement:** Recovery, schema, data, Resolver, consumer and runtime work remain separate unless technically inseparable.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-006

- **Normative statement:** Every prompt reads live repository state.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-007

- **Normative statement:** Completion requires committed evidence and passing validation.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-008

- **Normative statement:** The next package is selected from dependency state, not conversational memory.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.

### OPS-009

- **Normative statement:** Every merged package updates roadmap memory and coverage status.
- **Origin:** `newly_proposed_architecture`
- **Confidence:** high for repository contracts; proposed where architecture/calibration is not approved.
- **Implementation status:** artifact-derived; this document does not assert implementation.
- **Target:** parent specification and referencing work package.


## 29. Final Recommended Decision

Integrate this proposed parent specification and its Operationalization Map as durable recovery memory. Do not start broad Resolver implementation from this PR. `DCOV-WP-002` remains blocked until the parent is explicitly promoted to `approved_recovery_source_of_record` through the full promotion gate and repository placement is approved; only then may the bounded reconciliation/source-ledger schema package become eligible. Existing KROAD-012 research may proceed only where it does not assume unapproved identifiers or paths.

No 95% readiness, broad Resolver coverage, consumer completeness, release readiness or production readiness is claimed.
