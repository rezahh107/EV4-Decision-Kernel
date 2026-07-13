# DCOV-EXEC-001 — Coverage Guarantee Activation Evidence

## Status

```yaml
action_kind: repair_and_verify
original_action_kind: coverage_foundation_and_execution_unblock
repository: rezahh107/EV4-Decision-Kernel
pull_request: 43
base_sha: 487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8
exact_head_sha:
  value: derived_at_pr_runtime
  evidence_location: pr_body_and_ci
work_package_id: DCOV-EXEC-001
work_type: foundation_with_real_data
contract_state_before: not_measurable
contract_state_after: policy_active
merge_performed: false
approval_performed: false
auto_merge_enabled: false
deployment_performed: false
```
## Live precheck

- Live `main` matched the observed baseline at `487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8`.
- PR #41 is merged and is the live `main` ancestor.
- No open pull request overlapped the intended paths when implementation started.
- Existing active Resolver-backed Family: `layout_structure` only.
- Existing coverage percentage before this work: not measurable.
- Current active manual-authority-lock reference count: 0.
- Historical superseded reference count derived by the validator: 9.
- The historical count is evidence history, not an active dependency.

## Changed scope

```yaml
files_modified:
  - .github/PULL_REQUEST_TEMPLATE.md
  - .github/workflows/validate-mvk.yml
  - .gitignore
  - AGENTS.md
  - docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md
  - docs/decision-governance/COVERAGE_GUARANTEE_CONTRACT.md
  - kernel/decision-governance/coverage-evidence-subject-registry.v1.json
  - kernel/decision-governance/coverage-guarantee-contract.v1.json
  - kernel/schemas/coverage-evidence-subject-registry.v1.schema.json
  - kernel/schemas/coverage-runtime-proof-receipt.v1.schema.json
  - kernel/schemas/coverage-consumer-proof-receipt.v1.schema.json
  - kernel/schemas/coverage-credit-receipt.v1.schema.json
  - kernel/schemas/coverage-denominator-disposition.v1.schema.json
  - kernel/schemas/coverage-baseline.v1.schema.json
  - kernel/schemas/coverage-guarantee-contract.v1.schema.json
  - kernel/schemas/coverage-impact.v1.schema.json
  - kernel/schemas/decision-question-catalog.v1.schema.json
  - kernel/schemas/element-reconciliation-ledger.v1.schema.json
  - kernel/validator/validate-coverage-guarantee.mjs
  - package.json
  - planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md
  - planning/KERNEL_EXECUTION_PLAN.md
  - planning/NEXT_WORK.md
  - planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md
  - tools/kroad-010-history/build.mjs
  - tools/kroad-010-history/validate.mjs
  - tools/validate-roadmap-memory.mjs
files_created:
  - docs/decision-governance/COVERAGE_GUARANTEE_CONTRACT.md
  - kernel/decision-governance/coverage-guarantee-contract.v1.json
  - kernel/schemas/coverage-guarantee-contract.v1.schema.json
  - kernel/schemas/coverage-impact.v1.schema.json
  - kernel/schemas/coverage-baseline.v1.schema.json
  - kernel/schemas/element-reconciliation-ledger.v1.schema.json
  - kernel/schemas/decision-question-catalog.v1.schema.json
  - kernel/schemas/open-decision-debt.v1.schema.json
  - kernel/validator/validate-coverage-guarantee.mjs
  - planning/coverage/coverage-baseline.v1.json
  - planning/coverage/open-decision-debt.v1.json
  - planning/coverage/element-reconciliation-ledger.v1.json
  - planning/coverage/decision-question-catalog.v1.json
  - planning/coverage/impacts/dcov-exec-001.bootstrap.json
  - planning/reviews/DCOV-EXEC-001_COVERAGE_GUARANTEE_ACTIVATION.md
  - kernel/fixtures/coverage-guarantee/valid/canonical-policy-active.json
  - kernel/fixtures/coverage-guarantee/invalid/missing-ledger.json
  - kernel/fixtures/coverage-guarantee/invalid/empty-ledger.json
  - kernel/fixtures/coverage-guarantee/invalid/missing-catalog.json
  - kernel/fixtures/coverage-guarantee/invalid/empty-catalog.json
  - kernel/fixtures/coverage-guarantee/invalid/denominator-source-missing.json
  - kernel/fixtures/coverage-guarantee/invalid/denominator-version-missing.json
  - kernel/fixtures/coverage-guarantee/invalid/measurement-without-valid-baseline.json
  - kernel/fixtures/coverage-guarantee/invalid/element-incomplete-obligations.json
  - kernel/fixtures/coverage-guarantee/invalid/resolver-without-fixture-triplet.json
  - kernel/fixtures/coverage-guarantee/invalid/resolver-without-l2.json
  - kernel/fixtures/coverage-guarantee/invalid/coverage-impact-missing.json
  - kernel/fixtures/coverage-guarantee/invalid/bootstrap-exception-invalid.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-reduction-without-reasons.json
  - kernel/fixtures/coverage-guarantee/adversarial/fabricated-percentage.json
  - kernel/fixtures/coverage-guarantee/adversarial/threshold-below-required.json
  - kernel/fixtures/coverage-guarantee/adversarial/matrix-counted-as-resolver.json
  - kernel/fixtures/coverage-guarantee/adversarial/missing-runtime-or-consumer-proof.json
  - kernel/fixtures/coverage-guarantee/adversarial/not-applicable-without-reason.json
  - kernel/fixtures/coverage-guarantee/adversarial/false-readiness-claim.json
  - kernel/fixtures/coverage-guarantee/adversarial/artificial-micro-progress.json
  - kernel/fixtures/coverage-guarantee/adversarial/three-consecutive-zero-delta.json
  - kernel/fixtures/coverage-guarantee/valid/explicit-artifact-replacement.json
  - kernel/fixtures/coverage-guarantee/valid/typed-evidence-carrier.json
  - kernel/fixtures/coverage-guarantee/valid/denominator-source-bound-reclassification.json
  - kernel/fixtures/coverage-guarantee/invalid/root-append-empty-pointer.json
  - kernel/fixtures/coverage-guarantee/invalid/root-append-slash-pointer.json
  - kernel/fixtures/coverage-guarantee/invalid/root-delete-empty-pointer.json
  - kernel/fixtures/coverage-guarantee/invalid/root-delete-slash-pointer.json
  - kernel/fixtures/coverage-guarantee/invalid/root-set-empty-pointer.json
  - kernel/fixtures/coverage-guarantee/invalid/root-set-slash-pointer.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-excluded-duplicate-invalid-target.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-excluded-superseded-invalid-target.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-mismatched-before-after.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-not-applicable-without-change.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-partial-reason-coverage.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-record-removal-without-change.json
  - kernel/fixtures/coverage-guarantee/adversarial/element-free-form-credit.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-cross-record.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-cross-subject.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-empty.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-free-form.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-generic-consumer-and-credit-artifacts.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-layout-obligation-wrong-family-matrix.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-non-layout-question-layout-chain.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-nonexistent-path.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-planning-review-as-runtime-proof.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-stale-hash.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-wrong-artifact-type.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-wrong-symbol.json
  - kernel/fixtures/coverage-guarantee/adversarial/impact-historical-bootstrap-only.json
  - kernel/fixtures/coverage-guarantee/adversarial/impact-chronology-duplicate-gap-fork.json
  - kernel/fixtures/coverage-guarantee/adversarial/impact-incomplete-changed-paths.json
  - kernel/fixtures/coverage-guarantee/adversarial/impact-unrelated-repository.json
  - kernel/fixtures/coverage-guarantee/adversarial/impact-wrong-head.json
  - kernel/fixtures/coverage-guarantee/adversarial/impact-wrong-package.json
  - kernel/fixtures/coverage-guarantee/adversarial/progress-duplicate-obligation.json
  - kernel/fixtures/coverage-guarantee/adversarial/progress-fabricated-five-point-delta.json
  - kernel/fixtures/coverage-guarantee/adversarial/progress-invented-obligations-family.json
  - kernel/fixtures/coverage-guarantee/adversarial/progress-mismatched-baseline.json
  - kernel/fixtures/coverage-guarantee/adversarial/progress-partial-shared-obligation.json
  - kernel/fixtures/coverage-guarantee/adversarial/progress-unchanged-states.json
  - kernel/fixtures/coverage-guarantee/adversarial/question-chain-free-form-credit.json
  - kernel/fixtures/coverage-guarantee/adversarial/denominator-unrelated-evidence-complete-reduction.json
repair_files_created_for_reviewed_head_dc45fe87:
  - kernel/decision-governance/coverage-proof-producer-registry.v1.json
  - kernel/schemas/coverage-not-applicable-disposition.v1.schema.json
  - kernel/schemas/coverage-proof-capture.v1.schema.json
  - kernel/schemas/coverage-proof-producer-registry.v1.schema.json
  - planning/coverage/dispositions/not-applicable/README.md
  - kernel/fixtures/coverage-guarantee/adversarial/not-applicable-element-self-authorized.json
  - kernel/fixtures/coverage-guarantee/adversarial/not-applicable-question-self-authorized.json
  - kernel/fixtures/coverage-guarantee/adversarial/not-applicable-disposition-wrong-subject.json
  - kernel/fixtures/coverage-guarantee/adversarial/runtime-proof-unresolvable-lineage.json
  - kernel/fixtures/coverage-guarantee/adversarial/consumer-proof-rejected.json
  - kernel/fixtures/coverage-guarantee/adversarial/consumer-proof-wrong-head-unknown-producer.json
  - kernel/fixtures/coverage-guarantee/adversarial/coverage-credit-wrong-baseline.json
  - kernel/fixtures/coverage-guarantee/adversarial/coverage-credit-missing-source-evidence.json
  - kernel/fixtures/coverage-guarantee/adversarial/coverage-credit-extra-cross-question-evidence.json
  - kernel/fixtures/coverage-guarantee/adversarial/coverage-credit-producer-assertion.json
```

## Coverage foundation result

```yaml
ledger:
  exists: true
  version: 1.0.0
  confirmed_elements: 7
  candidate_elements: 1
  unresolved_elements: 7
  known_scope_count: 15
  denominator_state: unresolved
  denominator: 7
  denominator_source: derived_from_confirmed_ledger_members
question_catalog:
  exists: true
  version: 1.0.0
  confirmed_questions: 24
  candidate_questions: 0
  unresolved_questions: 5
  known_scope_count: 29
  denominator_state: unresolved
  denominator: 24
  denominator_source: derived_from_confirmed_catalog_members
coverage:
  element_numerator: 0
  element_denominator: 7
  element_percent: null
  question_numerator: 0
  question_denominator: 24
  question_percent: null
  critical_p0_and_safety_numerator: 0
  critical_p0_and_safety_denominator: 37
  critical_p0_and_safety_percent: null
```

The confirmed denominators count source-validated active members. Known scope additionally preserves candidates and unresolved records. Percentages remain `null` until every in-scope denominator candidate is dispositioned and the denominator state validates.

## Validation evidence

```yaml
syntax:
  command: node --check kernel/validator/validate-coverage-guarantee.mjs
  local_result: passed
validator:
  command: npm run validate:coverage
  local_result: passed
  self_tests_passed: 74
  valid_fixtures_passed: 4
  negative_fixtures_passed: 18
  adversarial_fixtures_passed: 52
  stable_diagnostic_assertions: passed
mvk:
  command: npm run validate:mvk
  local_result: passed
roadmap_memory:
  command: npm run validate:roadmap-memory
  local_result: passed
history_matrix:
  command: npm run validate:kroad-010-history-matrix
  local_result: passed
  methods_passed:
    - merge_commit
    - squash
    - rebase
diff_integrity:
  command: git diff --check
  local_result: passed
ci:
  wired: true
  exact_head_runs: derived_at_pr_runtime
```

The validator derives hashes, denominator state, numerators, percentages and contract-state eligibility. It rejects fabricated percentages, semantically unrelated same-role evidence, generic runtime/consumer/credit artifacts, invalid denominator reductions, Matrix-only credit, incomplete Resolver/L2/proof chains, unsupported readiness, missing impact records, artificial micro-progress and canonically ordered three-consecutive zero-delta packages.

## PR Inspector repair record

```yaml
review_identity:
  pull_request: 43
  reviewed_head_sha: dc45fe87eda245057010ea35acaf6627614b110d
  previous_reviewed_head_sha: 29210f52b0cfa84d31721247001d938e1505ec7c
  base_sha: 487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8
  review_validity_at_repair_start: CURRENT
  protocol_version: v1.9.0
  canonical_review_package_sha256: 01a09efb6e02910a88e27d998e1f36d441086d1016b19d333a64c090397d492c
  inspector_commit: 65e6b1b46c3e8da7c782c666cd3562947f2b7923
  review_status: RED_DO_NOT_MERGE
repair_status:
  PRF-007: implemented_pending_rereview
  PRF-008: implemented_pending_rereview
  PRF-009: implemented_pending_rereview
prior_findings_confirmed_repaired_by_reviewed_head:
  - PRF-001
  - PRF-002
  - PRF-006
fresh_independent_review: required_on_resulting_head
```

No finding is declared closed. `implemented_pending_rereview` means only that bounded implementation and direct local evidence exist; the resulting head requires a fresh independent PR Inspector decision.

### PRF-007 — verifier-derived not-applicable dispositions

- `status`: `implemented_pending_rereview`.
- `underlying_invariant`: neither `validator_accepted` nor a typed carrier can authorize non-applicability. The validator must derive acceptance from a dedicated disposition whose intrinsic record/link subject, reason code, rule/version, exact evidence head and resolved source statement all match.
- `repair`: removed `validator_accepted` from the Ledger and Catalog schemas; restricted `not_applicable_evidence` to `planning/coverage/dispositions/not-applicable/`; added the v1 disposition schema; and made Element/Question numerator functions call the same semantic disposition resolver used by diagnostics. Coverage credit itself cannot be marked not applicable.
- `focused_evidence`: the Element and Question self-authorization fixtures use correctly hashed unrelated JSON/Markdown plus `validator_accepted: true` and fail. The dedicated wrong-subject disposition is schema-valid but fails intrinsic subject and lineage checks. All assert Element/Question numerators `0`, denominators `7`/`24`, and unresolved denominator states.
- `stable_diagnostics`: `COV_NOT_APPLICABLE_PRODUCER_ASSERTION_FORBIDDEN`, `COV_NOT_APPLICABLE_ARTIFACT_FORBIDDEN`, `COV_NOT_APPLICABLE_DISPOSITION_INVALID`, `COV_NOT_APPLICABLE_DISPOSITION_SUBJECT_MISMATCH`, `COV_NOT_APPLICABLE_LINEAGE_SUBJECT_MISMATCH`, `COV_NOT_APPLICABLE_REASON_INVALID`.

### PRF-008 — authoritative proof provenance

- `status`: `implemented_pending_rereview`.
- `underlying_invariant`: a dedicated schema-valid receipt is syntax, not proof. Every receipt must bind to an immutable reachable evidence head, a producer registered at that head, an authorized environment/consumer, a finite successful result, a fresh observation time, and capture lineage whose receipt and raw bytes resolve and hash correctly.
- `repair`: added a fail-closed producer registry (initially empty because no authoritative producer evidence exists), capture schema, finite runtime vocabulary, exact-head/freshness checks, producer scope checks, exact receipt-to-capture time binding, role-specific raw-capture directories, recursive capture/raw lineage hash verification, and blocking handling for consumer `rejected` and runtime non-pass results.
- `focused_evidence`: forged runtime lineage, consumer rejection, and wrong-head/unknown-producer fixtures use schema-valid dedicated receipts but fail exact provenance/result diagnostics without changing numerators or denominators.
- `stable_diagnostics`: `COV_PROOF_PRODUCER_UNKNOWN`, `COV_PROOF_HEAD_UNRESOLVED`, `COV_PROOF_LINEAGE_UNRESOLVED`, `COV_CONSUMER_PROOF_REJECTED`, `COV_RUNTIME_PROOF_OBSERVATION_INVALID`, `COV_PROOF_CAPTURE_TIME_MISMATCH`, `COV_PROOF_RAW_CAPTURE_PATH_FORBIDDEN`, plus the dedicated capture/hash/head/freshness diagnostics.

### PRF-009 — validator-generated coverage credit

- `status`: `implemented_pending_rereview`.
- `underlying_invariant`: the committed credit file is only a projection. Credit authority is an in-memory validator derivation from the current schema-and-hash-validated baseline identity and the exact ID, subject, content hash and immutable head of every preceding verified link. This identity check does not validate the unresolved denominator or activate measurement.
- `repair`: removed the producer-authored `coverage_granted: true` contract; added `COV-QUESTION-CREDIT-V1`; made `questionCovered` validate all nine preceding links before recomputing the credit projection; and compares baseline plus the exact source-evidence set, rejecting duplicates, missing/extra items, cross-Question copies and stale heads.
- `focused_evidence`: schema-valid wrong-baseline, missing-source, extra/cross-Question projections and an explicit producer-grant attempt all fail exact diagnostics; Question numerator remains `0`, effective denominators remain `7`/`24`, and state promotion remains ineligible.
- `stable_diagnostics`: `COV_CREDIT_PRODUCER_ASSERTION_FORBIDDEN`, `COV_CREDIT_BASELINE_MISMATCH`, `COV_CREDIT_SOURCE_EVIDENCE_MISSING`, `COV_CREDIT_SOURCE_EVIDENCE_EXTRA`, `COV_CREDIT_SOURCE_EVIDENCE_CROSS_SUBJECT`, `COV_CREDIT_SOURCE_EVIDENCE_DUPLICATE`, `COV_CREDIT_SOURCE_EVIDENCE_STALE`.

## Preserved repairs confirmed on the reviewed head

### PRF-001 — artifact-to-subject semantic binding

- `surface_symptom`: a valid same-role layout artifact could be relabeled as evidence for a media/text Question or another obligation.
- `underlying_invariant`: carrier metadata is necessary but never sufficient; the resolved JSON value or registered JS symbol must intrinsically match the expected Question, Family, Matrix, active Rule, fixture kind and target, L2 target, proof subject, or credit subject.
- `failure_boundary`: the numerator derivation and semantic validation boundary, before any measurement or threshold state is eligible.
- `affected_components`: authoritative contract and Markdown view; role-path rules; role-specific semantic resolver; JS subject registry and schema; runtime, consumer and credit receipt schemas; Element/Question derivation; adversarial fixtures.
- `assumptions`: family-wide artifacts may be shared only inside their registered Family and active Rule; registry bindings grant no coverage credit by themselves.
- `repair`: Matrix and P0 evidence compare intrinsic `decision_family_id`/`matrix_id`; Resolver evidence compares active Family/Rule/Matrix; fixture evidence compares case kind, intrinsic Family and the active Rule registry path; evaluator/L2 symbols require exact registry bindings whose Questions belong to the same Family; proof and credit roles accept only their dedicated schema-valid receipts and exact receipt subjects.
- `focused_evidence`: `evidence-layout-obligation-wrong-family-matrix.json`, `evidence-non-layout-question-layout-chain.json`, `evidence-planning-review-as-runtime-proof.json`, and `evidence-generic-consumer-and-credit-artifacts.json` assert exact semantic diagnostics while `elementNumerator` and `questionNumerator` remain zero.
- `stable_diagnostics`: `COV_EVIDENCE_P0_FAMILY_SUBJECT_MISMATCH`, `COV_EVIDENCE_RESOLVER_SUBJECT_MISMATCH`, `COV_EVIDENCE_EVALUATOR_SUBJECT_MISMATCH`, `COV_EVIDENCE_FIXTURE_SUBJECT_MISMATCH`, `COV_EVIDENCE_L2_SUBJECT_MISMATCH`, `COV_EVIDENCE_PROOF_ARTIFACT_FORBIDDEN`, `COV_EVIDENCE_PROOF_RECEIPT_INVALID`, `COV_EVIDENCE_CREDIT_ARTIFACT_FORBIDDEN`, `COV_EVIDENCE_CREDIT_RECEIPT_INVALID`.

### PRF-002 — denominator reason evidence binding

- `surface_symptom`: an unrelated Matrix or governance file could justify a record-level denominator reduction when the carrier self-declared the affected record.
- `underlying_invariant`: every reason must resolve either to the affected record's exact verified source reference or to a schema-valid disposition matching `record_id`, `reason_code`, before/after memberships, target relationship, and source lineage.
- `failure_boundary`: baseline validation before denominator state, percentage derivation, or state eligibility.
- `affected_components`: baseline reason validation, record source matching, denominator disposition schema, reduction eligibility and valid/adversarial fixtures.
- `assumptions`: a direct record source match is exact on path, version, hash, commit and JSON Pointer; a disposition must carry the stronger semantic reason fields.
- `repair`: every source carrier is compared with the affected record's verified before/head source references; dedicated dispositions are schema-validated and field-compared; semantically invalid reasons force `COV_DENOMINATOR_REDUCTION_UNJUSTIFIED` even when generic carrier checks pass. Any invalid denominator transition is quarantined from effective coverage derivation, which preserves the verified base metrics.
- `focused_evidence`: `denominator-unrelated-evidence-complete-reduction.json` proves a structurally valid unrelated Matrix cannot reduce the effective denominator (`7` remains `7`); `denominator-source-bound-reclassification.json` proves the exact record-source path remains valid and may derive `6`.
- `stable_diagnostics`: `COV_DENOMINATOR_EVIDENCE_SUBJECT_MISMATCH`, `COV_DENOMINATOR_EVIDENCE_REASON_MISMATCH`, `COV_DENOMINATOR_EVIDENCE_LINEAGE_MISMATCH`, `COV_DENOMINATOR_REDUCTION_UNJUSTIFIED`, `COV_DENOMINATOR_CHANGE_QUARANTINED`.

### PRF-006 — canonical Coverage Impact chronology

- `surface_symptom`: the last-three zero-delta rule used lexicographic filename order, allowing a newly named file to sort before older impacts.
- `underlying_invariant`: impact execution order is a contiguous immutable sequence with one predecessor; filename order never determines chronology.
- `failure_boundary`: Coverage Impact history validation before latest-state or three-consecutive-zero-delta evaluation.
- `affected_components`: impact contract/schema, bootstrap record, impact loader/source-path map, material-progress ordering and adversarial fixtures.
- `assumptions`: append-only Git history makes merged sequence fields immutable; a new impact must extend exactly one predecessor.
- `repair`: every impact requires `sequence_number` and `previous_impact_id`; duplicate numbers, gaps, forks, predecessor mismatch and filename/sequence disagreement fail; latest-impact and last-three logic sort only by canonical sequence.
- `focused_evidence`: `three-consecutive-zero-delta.json` deliberately maps chronological records to lexically reordered filenames and still emits `COV_THREE_CONSECUTIVE_ZERO_DELTA`; `impact-chronology-duplicate-gap-fork.json` asserts all structural chronology guards.
- `stable_diagnostics`: `COV_IMPACT_SEQUENCE_DUPLICATE`, `COV_IMPACT_SEQUENCE_GAP`, `COV_IMPACT_HISTORY_FORK`, `COV_IMPACT_PREDECESSOR_MISMATCH`, `COV_IMPACT_FILENAME_SEQUENCE_MISMATCH`, `COV_THREE_CONSECUTIVE_ZERO_DELTA`.

### Prior findings confirmed repaired by the current review

### PRF-003 — current-PR Coverage Impact binding

- `surface_symptom`: any historical impact record could satisfy a later coverage-sensitive change.
- `underlying_invariant`: exactly one impact record newly introduced relative to the verified base must match repository, PR, base, current work package and the exact sensitive path diff; the exact head is derived from Git/CI rather than self-referential committed data.
- `failure_boundary`: repository integration validation after the base bundle and sensitive diff are loaded.
- `affected_components`: impact schema/record, current-impact selection, Git/CI runtime context, workflow environment bindings, history replay and adversarial fixtures.
- `assumptions`: the committed `derived_at_pr_runtime` sentinel is required to avoid a self-referential commit; GitHub Actions provides `COVERAGE_HEAD_SHA` and the validator compares it with checked-out `HEAD`.
- `repair`: historical records are excluded by base/head identity, exactly one new record is required, and stale repository/PR/base/head/package/path bindings fail with specific diagnostics.
- `focused_evidence`: historical-only, wrong-head, wrong-package, incomplete-sensitive-path and unrelated-repository cases are rejected.

### PRF-004 — derived material progress

- `surface_symptom`: invented IDs, family names and numeric deltas could satisfy material-progress rules.
- `underlying_invariant`: completed obligations, closed P0 families, numerator/percentage deltas and zero-delta state must be functions of verified base/head artifacts.
- `failure_boundary`: impact validation before policy-active material progress or measurement-active delta credit.
- `affected_components`: obligation/family indexing, base/head progress derivation, impact diagnostics, zero-delta history and adversarial fixtures.
- `assumptions`: a completion is countable only when an existing base obligation transitions from incomplete to covered at head and its evidence is valid.
- `repair`: unknown, duplicate or unchanged IDs, family mismatches, fabricated deltas, baseline mismatches and false zero-delta declarations fail closed.
- `focused_evidence`: fake obligations/family, duplicate IDs, unchanged states, fabricated five-point delta and mismatched baseline cases assert their intended diagnostics.
- `shared-ID guard`: an obligation ID repeated across Elements is complete only when every applicable occurrence is evidence-bound complete; a single covered occurrence cannot manufacture progress.

### PRF-005 — root mutation safety

- `surface_symptom`: `set`, `delete` or `append` at an empty/root pointer could mutate a property named `undefined` and test the wrong state.
- `underlying_invariant`: ordinary mutations may address only non-root JSON Pointers; whole-artifact replacement is a separate explicit operation.
- `failure_boundary`: fixture mutation application, before the mutated bundle reaches schema or semantic validation.
- `affected_components`: pointer parsing, mutation application, fixture runner and exact-code fixtures.
- `assumptions`: root replacement is useful only when explicit and clone-safe.
- `repair`: both `""` and `"/"` are rejected for set/delete/append with `COV_FIXTURE_ROOT_POINTER_FORBIDDEN`; `replace_artifact` is the only supported root operation.
- `focused_evidence`: six invalid root-pointer fixtures and one valid explicit replacement fixture pass exact diagnostic assertions.

### Adjacent impact and fail-closed audit

- Contract and Markdown remain v1 and retain thresholds 90/95/100 and the full Element/Question coverage definitions.
- The denominator candidates, numerator zeroes, unresolved percentages and `policy_active` state are unchanged; no readiness, runtime, consumer or production proof was manufactured.
- Dedicated receipt, disposition, capture and producer-registry schemas define verification boundaries without creating any proof receipt, producer authorization or proof claim.
- Coverage Impact history remains append-only across the verified base/head boundary; the bootstrap record is still the single record new in PR #43 and is canonical sequence member 1.
- CI now binds repository, PR, base and head values to both direct coverage validation and full MVK validation.
- The KROAD-010 merge/squash/rebase builder copies the semantic subject registry and receipt/disposition schemas, rewrites only its synthetic impact base to its generated bootstrap anchor, and passes the same exact-head checks; production validation is not weakened.
- Rollback behavior is fail-closed: missing base artifacts are treated as initial bootstrap only when the actual base lacks the coverage bundle, while later sensitive changes require a newly added impact.

The first exact-head CI run exposed that the KROAD-010 synthetic-history builder copied the updated `package.json` but not the new Coverage Guarantee validation dependencies. The focused repair copies that dependency set into each synthetic activation source. The complete merge-commit, squash, rebase and mutation-guard matrix then passed without changing coverage rules, thresholds or diagnostics.

## Roadmap result

```yaml
roadmap:
  legacy_kroad_status: superseded_by_coverage_execution_program
  legacy_items_preserved:
    - KROAD-012
    - KROAD-013
    - KROAD-014
    - KROAD-015
    - KROAD-016
    - KROAD-017
    - KROAD-018
  dcov_exec_001_completed_by_pr: implemented_on_pr_head_pending_external_inspection
  next_executable_package: DCOV-EXEC-002
  next_work_type: content_expansion
  competing_next_task_count: 0
package_progress:
  baseline_before: null
  baseline_after: coverage-baseline.v1.0.0
  element_coverage_delta: null
  question_coverage_delta: null
  estimated_program_share_completed: unresolved
  estimation_basis: denominator_unresolved_use_obligation_criticality_dependency_complexity_and_proof_requirements
```

## Known gaps

- Element and Question denominators remain unresolved.
- Coverage percentages are not yet available.
- `layout_structure` remains fixture-scoped and lacks its applicable real runtime or consumer proof.
- Non-layout P0 Families lack full Resolver → Evaluator → Fixture Triplet → L2 chains.
- Independent PR inspection and exact-head GitHub Actions evidence are external PR-runtime requirements.

## Merge gate

```yaml
merge_gate:
  exact_head_ci_green: derived_at_pr_runtime
  independent_pr_inspector_green: pending_external_rereview
  explicit_owner_merge_command: false
merge_performed: false
approval_performed: false
auto_merge_enabled: false
deployment_performed: false
```
