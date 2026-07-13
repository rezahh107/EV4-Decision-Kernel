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
  - kernel/decision-governance/coverage-guarantee-contract.v1.json
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
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-nonexistent-path.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-stale-hash.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-wrong-artifact-type.json
  - kernel/fixtures/coverage-guarantee/adversarial/evidence-wrong-symbol.json
  - kernel/fixtures/coverage-guarantee/adversarial/impact-historical-bootstrap-only.json
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
  self_tests_passed: 57
  valid_fixtures_passed: 3
  negative_fixtures_passed: 18
  adversarial_fixtures_passed: 36
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

The validator derives hashes, denominator state, numerators, percentages and contract-state eligibility. It rejects fabricated percentages, invalid denominator reductions, Matrix-only credit, incomplete Resolver/L2/proof chains, unsupported readiness, missing impact records, artificial micro-progress and three consecutive zero-delta packages.

## PR Inspector repair record

```yaml
review_identity:
  pull_request: 43
  reviewed_head_sha: 76ec0ba0ecf6492bf3f80fc733de404292af2970
  base_sha: 487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8
  protocol_version: v1.9.0
  canonical_review_package_sha256: 2ca193b98555f0d57039aea65066c155de0e189355430740e9857e1dadd3817c
  inspector_commit: 65e6b1b46c3e8da7c782c666cd3562947f2b7923
  review_status: RED_DO_NOT_MERGE
repair_status:
  PRF-001: implemented_pending_rereview
  PRF-002: implemented_pending_rereview
  PRF-003: implemented_pending_rereview
  PRF-004: implemented_pending_rereview
  PRF-005: implemented_pending_rereview
fresh_independent_review: pending_external_rereview
```

No finding is declared closed. The statuses above mean only that a bounded repair and local verification exist on a new, not-yet-independently-reviewed head.

### PRF-001 — evidence-bound coverage credit

- `surface_symptom`: free-form, empty or invented `evidence_refs` could coexist with covered/complete states.
- `underlying_invariant`: every credit-bearing obligation and Question-chain link must have typed evidence bound to the same record and exact obligation/link, a permitted artifact role, a repository path, version, content hash, head, and resolving JSON Pointer or symbol.
- `failure_boundary`: the numerator derivation and semantic validation boundary, before any measurement or threshold state is eligible.
- `affected_components`: contract JSON/Markdown, contract/Ledger/Catalog/Baseline schemas, evidence resolver, Element and Question coverage derivation, adversarial fixtures.
- `assumptions`: Git objects and checked-out repository files are the resolvable evidence boundary; legacy strings may describe incomplete states but never create credit.
- `repair`: typed carriers are resolved from either a pinned commit or the runtime head; role/path, record, obligation/link, hash, version, pointer/symbol and head mismatches emit stable diagnostics and prevent numerator growth.
- `focused_evidence`: empty, free-form, nonexistent-path, wrong-artifact-type, wrong-symbol, stale-hash, cross-record, cross-subject, full-Element and full-Question bypass fixtures all retain a zero numerator.

### PRF-002 — verified denominator transition

- `surface_symptom`: record deletion or reclassification could shrink the denominator without an audited transition.
- `underlying_invariant`: Ledger/Catalog record IDs, memberships and derived counts must be diffed from the verified base to head; every changed record needs exactly one typed, source-bound reason and valid target where applicable.
- `failure_boundary`: baseline validation before denominator state, percentage derivation, or state eligibility.
- `affected_components`: baseline schema, base/head bundle loader, transition derivation, duplicate/supersession validation, baseline diagnostics and adversarial fixtures.
- `assumptions`: CI supplies the PR base SHA and exact head; local validation derives the merge base when CI bindings are absent.
- `repair`: added/removed/changed IDs, before/after memberships, denominators, percentages and ordered supersession chain are recomputed; omitted/partial reasons, invalid exclusion targets and mismatched declared values fail closed.
- `focused_evidence`: record removal, all exclusion dispositions, invalid duplicate/supersession targets, partial reason coverage and mismatched before/after fixtures assert exact diagnostics.

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
- Coverage Impact history remains append-only across the verified base/head boundary; the bootstrap record is still the single record new in PR #43.
- CI now binds repository, PR, base and head values to both direct coverage validation and full MVK validation.
- The KROAD-010 merge/squash/rebase builder rewrites only its synthetic impact base to its generated bootstrap anchor and passes the same exact-head checks; production validation is not weakened.
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
