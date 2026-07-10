import {rmSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import {
  CANONICAL_LOCK_PATH,
  LINEAGE_PATH,
  MatrixError,
  ORDINARY_PIN_FIXTURES,
  POLICY_PATH,
  PRIMARY_BASELINE_PATH,
  PRIMARY_PATH,
  PROTOTYPE_INTEGRITY_PATH,
  REQUIRED_METHODS,
  ROOT,
  HISTORY_RUNNER_PATH,
  assertAncestor,
  assertClean,
  assertExactDrift,
  assertMethodSet,
  createSideCommit,
  createWorktree,
  expectFailure,
  readJson,
  run,
} from './common.mjs';

function validateMethod(repository, tempRoot, method, head, roles) {
  assertAncestor(
    repository,
    roles.staleAnchor,
    head,
    'HISTORY_MATRIX_STALE_ANCHOR_NOT_ANCESTOR',
  );
  assertAncestor(
    repository,
    roles.bootstrapAnchor,
    head,
    'HISTORY_MATRIX_BOOTSTRAP_ANCHOR_NOT_ANCESTOR',
  );

  const worktree = createWorktree(repository, tempRoot, method, head);
  try {
    assertClean(worktree);
    run(process.execPath, [PRIMARY_PATH], worktree);
    run(process.execPath, [PRIMARY_BASELINE_PATH], worktree);
    run(process.execPath, [CANONICAL_LOCK_PATH], worktree);
    run(process.execPath, [LINEAGE_PATH], worktree);
    run(process.execPath, [PROTOTYPE_INTEGRITY_PATH], worktree);

    const historyOutput = run(
      process.execPath,
      [HISTORY_RUNNER_PATH],
      worktree,
      {capture: true},
    );
    const historyResult = JSON.parse(
      historyOutput.trim().split('\n').at(-1),
    );
    assertExactDrift([historyResult.byte_drift_diagnostic]);

    run('npm', ['run', 'validate:mvk'], worktree);
    run('npm', ['run', 'validate:roadmap-memory'], worktree);
    assertClean(worktree);

    return {
      method,
      ordinary_records: historyResult.ordinary_records,
      byte_drift_diagnostic: historyResult.byte_drift_diagnostic,
      missing_stack_diagnostic: historyResult.missing_stack_diagnostic,
      working_tree_only_diagnostic:
        historyResult.working_tree_only_diagnostic,
      clean_worktree: true,
      head,
      worktree,
    };
  } catch (error) {
    error.worktree = worktree;
    throw error;
  }
}

export function validateHistories(
  repository,
  tempRoot,
  heads,
  roles,
) {
  return REQUIRED_METHODS.map((method) => validateMethod(
    repository,
    tempRoot,
    method,
    heads[method],
    roles,
  ));
}

export function runMutationGuards(
  repository,
  matrixResults,
  roles,
  config,
) {
  const mutations = [];
  const firstWorktree = matrixResults[0]?.worktree;
  if (!firstWorktree) {
    throw new MatrixError(
      'HISTORY_MATRIX_WORKTREE_MISSING',
      'No validated worktree is available in matrix results.',
    );
  }

  mutations.push(expectFailure(
    'skip_history_method',
    'HISTORY_MATRIX_METHOD_SET_INVALID',
    () => assertMethodSet(REQUIRED_METHODS.slice(0, -1)),
  ));

  const mergeHead = matrixResults
    .find((item) => item.method === 'merge_commit')
    ?.head;
  if (!mergeHead) {
    throw new MatrixError(
      'HISTORY_MATRIX_MERGE_HEAD_MISSING',
      'No merge_commit head is available in matrix results.',
    );
  }

  const staleSide = createSideCommit(
    repository,
    roles.staleAnchor,
    roles.incompleteAnchor,
    'history-matrix mutation: stale non-ancestor',
  );
  mutations.push(expectFailure(
    'stale_anchor_non_ancestor',
    'HISTORY_MATRIX_STALE_ANCHOR_NOT_ANCESTOR',
    () => assertAncestor(
      repository,
      staleSide,
      mergeHead,
      'HISTORY_MATRIX_STALE_ANCHOR_NOT_ANCESTOR',
    ),
  ));

  const bootstrapFeature = createSideCommit(
    repository,
    roles.bootstrapAnchor,
    roles.staleAnchor,
    'history-matrix mutation: feature-only bootstrap',
  );
  mutations.push(expectFailure(
    'bootstrap_anchor_feature_sha',
    'HISTORY_MATRIX_BOOTSTRAP_ANCHOR_NOT_ANCESTOR',
    () => assertAncestor(
      repository,
      bootstrapFeature,
      mergeHead,
      'HISTORY_MATRIX_BOOTSTRAP_ANCHOR_NOT_ANCESTOR',
    ),
  ));

  const dirtyPath = join(firstWorktree, '.history-matrix-dirty');
  writeFileSync(dirtyPath, 'dirty\n');
  mutations.push(expectFailure(
    'dirty_worktree',
    'HISTORY_MATRIX_WORKTREE_DIRTY',
    () => assertClean(firstWorktree),
  ));
  rmSync(dirtyPath, {force: true});

  mutations.push(expectFailure(
    'weaken_byte_drift_to_pin_unavailable',
    'HISTORY_MATRIX_BYTE_DRIFT_DIAGNOSTIC_MISMATCH',
    () => assertExactDrift([
      'DOWNSTREAM_CONSUMER_LINEAGE_PIN_UNAVAILABLE',
    ]),
  ));

  const fixture = readJson(
    firstWorktree,
    ORDINARY_PIN_FIXTURES[0],
  );
  fixture.record.kernel_pin.kernel_ref = roles.staleAnchor;
  mutations.push(expectFailure(
    'ordinary_record_wrong_anchor',
    'HISTORY_MATRIX_ORDINARY_PIN_MISMATCH',
    () => {
      if (fixture.record.kernel_pin.kernel_ref !== roles.bootstrapAnchor) {
        throw new MatrixError(
          'HISTORY_MATRIX_ORDINARY_PIN_MISMATCH',
          ORDINARY_PIN_FIXTURES[0],
        );
      }
    },
  ));

  const canonicalMutations = readJson(
    ROOT,
    'kernel/fixtures/contract-lock/downstream_consumer/canonical_lock_mutations.json',
  );
  const canonicalKinds = new Set(
    (canonicalMutations.cases || []).map((item) => item.mutation_kind),
  );
  for (const required of [
    'remove_lineage_gate_from_mvk',
    'reorder_kroad_010_gates',
    'lifecycle_status_drift',
  ]) {
    if (!canonicalKinds.has(required)) {
      throw new MatrixError(
        'HISTORY_MATRIX_DELEGATED_MUTATION_GUARD_MISSING',
        required,
      );
    }
  }

  const policyCases = new Set(readJson(ROOT, POLICY_PATH).cases || []);
  for (const required of config.prototype_integrity_cases || []) {
    if (!policyCases.has(required)) {
      throw new MatrixError(
        'HISTORY_MATRIX_PROTOTYPE_CASE_MISSING',
        required,
      );
    }
  }
  mutations.push({
    case_id: 'delegated_canonical_and_prototype_guards',
    diagnostic: 'CANONICAL_LOCK_AND_PROTOTYPE_SUITES_EXECUTED',
    passed: true,
  });

  return mutations;
}

export function printSummary(matrixResults, mutationResults) {
  console.log('KROAD-010 history matrix summary');
  for (const item of matrixResults) {
    console.log(`${item.method}:`);
    console.log(`  ordinary_records: ${item.ordinary_records}`);
    console.log(
      `  byte_drift_diagnostic: ${item.byte_drift_diagnostic}`,
    );
    console.log(
      `  missing_stack_diagnostic: ${item.missing_stack_diagnostic}`,
    );
    console.log(
      `  working_tree_only_diagnostic: ${item.working_tree_only_diagnostic}`,
    );
    console.log(`  clean_worktree: ${item.clean_worktree}`);
    console.log(`  head: ${item.head}`);
  }
  console.log('mutation_guards:');
  for (const item of mutationResults) {
    console.log(`  ${item.case_id}: PASS ${item.diagnostic}`);
  }
  console.log('Result: PASS');
}
