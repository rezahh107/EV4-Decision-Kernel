import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {
  ANCESTOR_MISSING_CONTRACT_FIXTURE,
  CANONICAL_LOCK_PATH,
  HISTORY_ROLES_PATH,
  HISTORY_RUNNER_PATH,
  LINEAGE_PATH,
  MANIFEST_PATH,
  MATRIX_CONFIG_PATH,
  MatrixError,
  ORDINARY_PIN_FIXTURES,
  POLICY_PATH,
  PRIMARY_BASELINE_PATH,
  PRIMARY_PATH,
  PROTOTYPE_INTEGRITY_PATH,
  ROOT,
  UNKNOWN_COMMIT_FIXTURE,
  WORKTREE_ONLY_ENVELOPE_PATH,
  commitAll,
  configureRepository,
  copyPath,
  git,
  readJson,
  sourceIncompleteAnchor,
  unique,
  writeJson,
} from './common.mjs';

function bootstrapCopyPaths() {
  const manifest = readJson(ROOT, MANIFEST_PATH);
  const policy = readJson(ROOT, POLICY_PATH);
  const primaryFixtures = [
    ...(manifest.fixtures?.valid || []),
    ...(manifest.fixtures?.invalid || []),
    ...(manifest.fixtures?.adversarial || []),
  ];
  return unique([
    'docs/decision-governance/KROAD_010_DOWNSTREAM_CONSUMER_CONTRACT.md',
    MANIFEST_PATH,
    POLICY_PATH,
    'kernel/schemas/downstream-consumer-contract.v0.schema.json',
    PRIMARY_PATH,
    CANONICAL_LOCK_PATH,
    LINEAGE_PATH,
    'kernel/fixtures/contract-lock/downstream_consumer/canonical_lock_mutations.json',
    'kernel/fixtures/contract-lock/downstream_consumer/primary-validator-baseline.v0.json',
    PRIMARY_BASELINE_PATH,
    PROTOTYPE_INTEGRITY_PATH,
    ...primaryFixtures,
    ...(policy.cases || []),
  ]);
}

function currentCoverageValidationPaths() {
  return [
    '.github/PULL_REQUEST_TEMPLATE.md',
    '.github/workflows/validate-mvk.yml',
    'AGENTS.md',
    'docs/decision-governance/COVERAGE_GUARANTEE_CONTRACT.md',
    'docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md',
    'kernel/decision-cards/elements.core.v0.json',
    'kernel/decision-governance/coverage-evidence-subject-registry.v1.json',
    'kernel/decision-governance/coverage-guarantee-contract.v1.json',
    'kernel/decision-governance/p0-decision-matrices.v0.json',
    'kernel/fixtures/coverage-guarantee',
    'kernel/official-sources/elementor-v4-source-manifest.v0.json',
    'kernel/registries/elements.core.v0.json',
    'kernel/schemas/coverage-baseline.v1.schema.json',
    'kernel/schemas/coverage-consumer-proof-receipt.v1.schema.json',
    'kernel/schemas/coverage-credit-receipt.v1.schema.json',
    'kernel/schemas/coverage-denominator-disposition.v1.schema.json',
    'kernel/schemas/coverage-evidence-subject-registry.v1.schema.json',
    'kernel/schemas/coverage-guarantee-contract.v1.schema.json',
    'kernel/schemas/coverage-impact.v1.schema.json',
    'kernel/schemas/coverage-runtime-proof-receipt.v1.schema.json',
    'kernel/schemas/decision-question-catalog.v1.schema.json',
    'kernel/schemas/element-reconciliation-ledger.v1.schema.json',
    'kernel/schemas/open-decision-debt.v1.schema.json',
    'kernel/validator/validate-coverage-guarantee.mjs',
    'planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md',
    'planning/KERNEL_EXECUTION_PLAN.md',
    'planning/coverage',
    'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md',
    'tools/validate-roadmap-memory.mjs',
  ];
}

export function createBuilder(tempRoot) {
  const repository = join(tempRoot, 'builder');
  git(ROOT, ['clone', '--no-hardlinks', ROOT, repository]);
  configureRepository(repository);

  const incompleteAnchor = sourceIncompleteAnchor();
  try {
    git(repository, ['cat-file', '-e', `${incompleteAnchor}^{commit}`]);
  } catch {
    git(repository, ['fetch', ROOT, incompleteAnchor]);
  }
  git(repository, ['checkout', '-B', 'matrix-main', incompleteAnchor]);

  for (const path of bootstrapCopyPaths()) {
    copyPath(ROOT, repository, path);
  }

  const staleManifest = readJson(repository, MANIFEST_PATH);
  staleManifest.scope =
    `${staleManifest.scope} [history-matrix stale complete anchor]`;
  writeJson(repository, MANIFEST_PATH, staleManifest);
  const staleAnchor = commitAll(
    repository,
    'history-matrix: stale complete acceptance anchor',
  );

  copyPath(ROOT, repository, MANIFEST_PATH);
  const bootstrapAnchor = commitAll(
    repository,
    'history-matrix: lifecycle-neutral bootstrap anchor',
  );

  return {repository, incompleteAnchor, staleAnchor, bootstrapAnchor};
}

function repinFixture(repository, path, commit) {
  const fixture = readJson(repository, path);
  if (!fixture?.record?.kernel_pin) {
    throw new MatrixError(
      'HISTORY_MATRIX_FIXTURE_PIN_MISSING',
      `${path} lacks record.kernel_pin.`,
    );
  }
  fixture.record.kernel_pin.kernel_ref = commit;
  writeJson(repository, path, fixture);
}

function historyRunnerSource() {
  return `#!/usr/bin/env node

import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  createCompiledValidators,
  validateConsumerRecord,
} from '../kernel/validator/validate-downstream-consumer-contract.mjs';
import {
  validateBinding,
} from '../kernel/validator/validate-downstream-consumer-lineage.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const roles = JSON.parse(readFileSync(join(ROOT, '${HISTORY_ROLES_PATH}'), 'utf8'));
const policy = JSON.parse(readFileSync(join(ROOT, '${POLICY_PATH}'), 'utf8'));
const validPath =
  'kernel/fixtures/valid/downstream_consumer/architect_layout_structure_kernel_consumed_valid.json';
const validFixture = JSON.parse(readFileSync(join(ROOT, validPath), 'utf8'));
const clone = (value) => JSON.parse(JSON.stringify(value));
const codes = (items) => [...new Set(items.map((item) => item.code))];

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function assertAncestor(commit, code) {
  try {
    execFileSync(
      'git',
      ['merge-base', '--is-ancestor', commit, 'HEAD'],
      {cwd: ROOT, stdio: 'ignore'},
    );
  } catch {
    fail(code, commit);
  }
}

assertAncestor(
  roles.stale_anchor,
  'HISTORY_MATRIX_STALE_ANCHOR_NOT_ANCESTOR',
);
assertAncestor(
  roles.bootstrap_anchor,
  'HISTORY_MATRIX_BOOTSTRAP_ANCHOR_NOT_ANCESTOR',
);

for (const path of roles.ordinary_pin_fixtures) {
  const fixture = JSON.parse(readFileSync(join(ROOT, path), 'utf8'));
  if (fixture.record.kernel_pin.kernel_ref !== roles.bootstrap_anchor) {
    fail('HISTORY_MATRIX_ORDINARY_PIN_MISMATCH', path);
  }
}

const driftRecord = clone(validFixture.record);
driftRecord.kernel_pin.kernel_ref = roles.stale_anchor;
const driftCodes = codes(validateBinding(driftRecord, policy));
if (!driftCodes.includes(roles.expected_byte_drift_diagnostic)
  || driftCodes.includes('DOWNSTREAM_CONSUMER_LINEAGE_PIN_UNAVAILABLE')) {
  fail(
    'HISTORY_MATRIX_BYTE_DRIFT_DIAGNOSTIC_MISMATCH',
    JSON.stringify(driftCodes),
  );
}

const missingRecord = clone(validFixture.record);
missingRecord.kernel_pin.kernel_ref = roles.incomplete_anchor;
const missingCodes = codes(validateBinding(missingRecord, policy));
if (!missingCodes.includes(
  'DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING',
)) {
  fail(
    'HISTORY_MATRIX_MISSING_STACK_DIAGNOSTIC_MISMATCH',
    JSON.stringify(missingCodes),
  );
}

const workingRecord = clone(validFixture.record);
workingRecord.kernel_pin.kernel_ref = roles.bootstrap_anchor;
workingRecord.kernel_artifact_refs.decision_record_ref =
  '${WORKTREE_ONLY_ENVELOPE_PATH}#decision_record';
workingRecord.kernel_artifact_refs.l2_audit_result_ref =
  '${WORKTREE_ONLY_ENVELOPE_PATH}#expected_result.l2_audit_status';
const workingCodes = codes(validateConsumerRecord(
  workingRecord,
  createCompiledValidators(),
));
if (!workingCodes.includes('DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING')) {
  fail(
    'HISTORY_MATRIX_WORKTREE_ONLY_DIAGNOSTIC_MISMATCH',
    JSON.stringify(workingCodes),
  );
}

console.log(JSON.stringify({
  ordinary_records: 'pass',
  byte_drift_diagnostic: roles.expected_byte_drift_diagnostic,
  missing_stack_diagnostic:
    'DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING',
  working_tree_only_diagnostic:
    'DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING',
}));
`;
}

export function createActivationSource(builder) {
  const {repository, incompleteAnchor, staleAnchor, bootstrapAnchor} = builder;
  git(repository, ['checkout', '-B', 'activation-source', staleAnchor]);

  for (const path of [
    'package.json',
    'planning/NEXT_WORK.md',
    MATRIX_CONFIG_PATH,
    'tools/validate-kroad-010-history-matrix.mjs',
    'tools/kroad-010-history/common.mjs',
    'tools/kroad-010-history/build.mjs',
    'tools/kroad-010-history/validate.mjs',
    ...currentCoverageValidationPaths(),
  ]) {
    copyPath(ROOT, repository, path);
  }

  for (const path of ORDINARY_PIN_FIXTURES) {
    repinFixture(repository, path, bootstrapAnchor);
  }

  const coverageImpactPath =
    'planning/coverage/impacts/dcov-exec-001.bootstrap.json';
  const coverageImpact = readJson(repository, coverageImpactPath);
  coverageImpact.base_sha = bootstrapAnchor;
  writeJson(repository, coverageImpactPath, coverageImpact);

  repinFixture(
    repository,
    ANCESTOR_MISSING_CONTRACT_FIXTURE,
    incompleteAnchor,
  );

  const unknownFixture = readJson(repository, UNKNOWN_COMMIT_FIXTURE);
  if (unknownFixture?.record?.kernel_pin?.kernel_ref
    !== 'ffffffffffffffffffffffffffffffffffffffff') {
    throw new MatrixError(
      'HISTORY_MATRIX_UNKNOWN_PIN_REGRESSED',
      UNKNOWN_COMMIT_FIXTURE,
    );
  }

  writeJson(repository, WORKTREE_ONLY_ENVELOPE_PATH, {
    fixture_type: 'kroad_010_history_matrix_worktree_only_envelope',
    schema_version: '0.1.0',
    decision_record: {record_type: 'decision_record_v2'},
    expected_result: {l2_audit_status: 'pass'},
  });
  writeJson(repository, HISTORY_ROLES_PATH, {
    fixture_type: 'kroad_010_history_matrix_runtime_roles',
    schema_version: '0.1.0',
    incomplete_anchor: incompleteAnchor,
    stale_anchor: staleAnchor,
    bootstrap_anchor: bootstrapAnchor,
    ordinary_pin_fixtures: ORDINARY_PIN_FIXTURES,
    expected_byte_drift_diagnostic:
      'DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT',
  });
  const runnerAbsolute = join(repository, HISTORY_RUNNER_PATH);
  mkdirSync(dirname(runnerAbsolute), {recursive: true});
  writeFileSync(runnerAbsolute, historyRunnerSource());

  const activationSource = commitAll(
    repository,
    'history-matrix: activation changes',
  );
  return {...builder, activationSource};
}

export function createFinalHistories(builder) {
  const {
    repository,
    staleAnchor,
    bootstrapAnchor,
    activationSource,
  } = builder;
  const results = {};

  git(repository, ['checkout', '-B', 'matrix-merge', bootstrapAnchor]);
  git(repository, [
    'merge',
    '--no-ff',
    'activation-source',
    '-m',
    'history-matrix: merge activation',
  ]);
  results.merge_commit = git(
    repository,
    ['rev-parse', 'HEAD'],
    {capture: true},
  ).trim();

  git(repository, ['checkout', '-B', 'matrix-squash', bootstrapAnchor]);
  git(repository, ['merge', '--squash', 'activation-source']);
  results.squash = commitAll(
    repository,
    'history-matrix: squash activation',
  );

  git(repository, ['checkout', '-B', 'matrix-rebase', activationSource]);
  git(repository, [
    'rebase',
    '--onto',
    bootstrapAnchor,
    staleAnchor,
    'matrix-rebase',
  ]);
  results.rebase = git(
    repository,
    ['rev-parse', 'HEAD'],
    {capture: true},
  ).trim();

  git(repository, ['checkout', '--detach', builder.incompleteAnchor]);
  return results;
}
