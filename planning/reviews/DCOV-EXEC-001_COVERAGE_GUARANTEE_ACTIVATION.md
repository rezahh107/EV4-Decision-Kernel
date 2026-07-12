# DCOV-EXEC-001 — Coverage Guarantee Activation Evidence

## Status

```yaml
action_kind: coverage_foundation_and_execution_unblock
repository: rezahh107/EV4-Decision-Kernel
pull_request: derived_at_pr_runtime
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
  - package.json
  - planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md
  - planning/KERNEL_EXECUTION_PLAN.md
  - planning/NEXT_WORK.md
  - planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md
  - tools/kroad-010-history/build.mjs
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
validator:
  command: npm run validate:coverage
  local_result: passed
  self_tests_passed: 22
  valid_fixtures_passed: 1
  negative_fixtures_passed: 12
  adversarial_fixtures_passed: 9
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
ci:
  wired: true
  exact_head_runs: derived_at_pr_runtime
```

The validator derives hashes, denominator state, numerators, percentages and contract-state eligibility. It rejects fabricated percentages, invalid denominator reductions, Matrix-only credit, incomplete Resolver/L2/proof chains, unsupported readiness, missing impact records, artificial micro-progress and three consecutive zero-delta packages.

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
  independent_pr_inspector_green: pending_external_review
  explicit_owner_merge_command: false
merge_performed: false
approval_performed: false
auto_merge_enabled: false
deployment_performed: false
```
