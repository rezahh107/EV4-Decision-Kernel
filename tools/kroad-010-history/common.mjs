import {execFileSync} from 'node:child_process';
import {
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

export const MODULE_PATH = fileURLToPath(import.meta.url);
export const ROOT = resolve(dirname(MODULE_PATH), '..', '..');
export const MATRIX_CONFIG_PATH =
  'kernel/fixtures/history-matrix/downstream_consumer/history-matrix.v0.json';
export const MANIFEST_PATH =
  'kernel/decision-governance/downstream-consumer-contract.v0.json';
export const POLICY_PATH =
  'kernel/decision-governance/downstream-consumer-lineage-binding.v0.json';
export const PRIMARY_PATH =
  'kernel/validator/validate-downstream-consumer-contract.mjs';
export const CANONICAL_LOCK_PATH =
  'kernel/validator/validate-downstream-consumer-canonical-lock.mjs';
export const LINEAGE_PATH =
  'kernel/validator/validate-downstream-consumer-lineage.mjs';
export const PRIMARY_BASELINE_PATH =
  'tools/validate-kroad-010-primary-baseline.mjs';
export const PROTOTYPE_INTEGRITY_PATH =
  'tools/validate-kroad-010-prototype-integrity.mjs';
export const HISTORY_RUNNER_PATH =
  'tools/kroad-010-history-case-runner.mjs';
export const HISTORY_ROLES_PATH =
  'kernel/fixtures/history-matrix/downstream_consumer/runtime-roles.json';
export const WORKTREE_ONLY_ENVELOPE_PATH =
  'kernel/fixtures/history-matrix/downstream_consumer/working-tree-only-decision-envelope.json';

export const REQUIRED_METHODS = Object.freeze([
  'merge_commit',
  'squash',
  'rebase',
]);
export const ORDINARY_PIN_FIXTURES = Object.freeze([
  'kernel/fixtures/valid/downstream_consumer/architect_layout_structure_kernel_consumed_valid.json',
  'kernel/fixtures/valid/downstream_consumer/architect_layout_structure_insufficient_evidence_valid.json',
  'kernel/fixtures/valid/downstream_consumer/architect_media_choice_insufficient_evidence_valid.json',
  'kernel/fixtures/invalid/downstream_consumer/architect_layout_structure_missing_kernel_refs_invalid.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_unsupported_family_resolver_backed_adversarial.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_synthetic_evidence_overclaim_adversarial.json',
  'kernel/fixtures/adversarial/downstream_consumer/architect_layout_structure_insufficient_with_fake_decision_adversarial.json',
]);
export const ANCESTOR_MISSING_CONTRACT_FIXTURE =
  'kernel/fixtures/adversarial/downstream_consumer/architect_ancestor_missing_contract_adversarial.json';
export const UNKNOWN_COMMIT_FIXTURE =
  'kernel/fixtures/adversarial/downstream_consumer/architect_unknown_kernel_commit_adversarial.json';

export class MatrixError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

export function run(command, args, cwd, {capture = false, env = {}} = {}) {
  return execFileSync(command, args, {
    cwd,
    encoding: 'utf8',
    stdio: capture ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    env: {...process.env, ...env},
  });
}

export function git(cwd, args, options = {}) {
  return run('git', args, cwd, options);
}

export function readJson(root, path) {
  return JSON.parse(readFileSync(join(root, path), 'utf8'));
}

export function writeJson(root, path, value) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, `${JSON.stringify(value, null, 2)}\n`);
}

export function copyPath(sourceRoot, targetRoot, path) {
  const source = join(sourceRoot, path);
  if (!existsSync(source)) {
    throw new MatrixError(
      'HISTORY_MATRIX_SOURCE_PATH_MISSING',
      `Required source path is missing: ${path}`,
    );
  }
  const target = join(targetRoot, path);
  mkdirSync(dirname(target), {recursive: true});
  cpSync(source, target, {recursive: true});
}

export function unique(items) {
  return [...new Set(items)];
}

export function configureRepository(repository) {
  git(repository, ['config', 'user.name', 'EV4 History Matrix']);
  git(repository, [
    'config',
    'user.email',
    'ev4-history-matrix@example.invalid',
  ]);
  const commonDir = git(
    repository,
    ['rev-parse', '--git-common-dir'],
    {capture: true},
  ).trim();
  const excludePath = resolve(repository, commonDir, 'info', 'exclude');
  mkdirSync(dirname(excludePath), {recursive: true});
  const existing = existsSync(excludePath)
    ? readFileSync(excludePath, 'utf8')
    : '';
  writeFileSync(excludePath, `${existing}\nnode_modules\n`);
}

export function commitAll(repository, message) {
  git(repository, ['add', '-A']);
  git(repository, ['commit', '-m', message], {
    env: {
      GIT_AUTHOR_NAME: 'EV4 History Matrix',
      GIT_AUTHOR_EMAIL: 'ev4-history-matrix@example.invalid',
      GIT_COMMITTER_NAME: 'EV4 History Matrix',
      GIT_COMMITTER_EMAIL: 'ev4-history-matrix@example.invalid',
    },
  });
  return git(repository, ['rev-parse', 'HEAD'], {capture: true}).trim();
}

export function sourceMainSha() {
  for (const ref of ['origin/main', 'main']) {
    try {
      return git(ROOT, ['rev-parse', ref], {capture: true}).trim();
    } catch {
      // Try the next local ref.
    }
  }
  throw new MatrixError(
    'HISTORY_MATRIX_MAIN_REF_UNAVAILABLE',
    'Unable to resolve current main history.',
  );
}

export function sourceIncompleteAnchor() {
  const main = sourceMainSha();

  try {
    git(ROOT, ['cat-file', '-e', `${main}:${MANIFEST_PATH}`]);
  } catch {
    throw new MatrixError(
      'HISTORY_MATRIX_MAIN_BOOTSTRAP_MISSING',
      `Current main ${main} does not contain ${MANIFEST_PATH}.`,
    );
  }

  const firstParentCommits = git(
    ROOT,
    ['rev-list', '--first-parent', main],
    {capture: true},
  )
    .trim()
    .split('\n')
    .filter(Boolean);

  for (const commit of firstParentCommits) {
    try {
      git(ROOT, ['cat-file', '-e', `${commit}:${MANIFEST_PATH}`]);
    } catch {
      return commit;
    }
  }

  throw new MatrixError(
    'HISTORY_MATRIX_INCOMPLETE_ANCHOR_UNAVAILABLE',
    `No first-parent commit before ${MANIFEST_PATH} was found from ${main}.`,
  );
}

export function assertMethodSet(methods) {
  const actual = [...new Set(methods)].sort();
  const expected = [...REQUIRED_METHODS].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new MatrixError(
      'HISTORY_MATRIX_METHOD_SET_INVALID',
      `Expected ${expected}; received ${actual}.`,
    );
  }
}

export function assertAncestor(repository, ancestor, head, code) {
  try {
    git(repository, ['merge-base', '--is-ancestor', ancestor, head]);
  } catch {
    throw new MatrixError(code, `${ancestor} is not an ancestor of ${head}.`);
  }
}

export function assertClean(worktree) {
  const status = git(
    worktree,
    ['status', '--porcelain', '--untracked-files=all'],
    {capture: true},
  );
  if (status !== '') {
    throw new MatrixError('HISTORY_MATRIX_WORKTREE_DIRTY', status.trim());
  }
}

export function assertExactDrift(codes) {
  if (!codes.includes('DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT')
    || codes.includes('DOWNSTREAM_CONSUMER_LINEAGE_PIN_UNAVAILABLE')) {
    throw new MatrixError(
      'HISTORY_MATRIX_BYTE_DRIFT_DIAGNOSTIC_MISMATCH',
      JSON.stringify(codes),
    );
  }
}

export function expectFailure(caseId, expectedCode, callback) {
  try {
    callback();
  } catch (error) {
    if (error?.code === expectedCode) {
      return {case_id: caseId, diagnostic: expectedCode, passed: true};
    }
    throw error;
  }
  throw new MatrixError('HISTORY_MATRIX_MUTATION_NOT_DETECTED', caseId);
}

export function createSideCommit(repository, treeCommit, parent, message) {
  const tree = git(
    repository,
    ['rev-parse', `${treeCommit}^{tree}`],
    {capture: true},
  ).trim();
  return git(repository, ['commit-tree', tree, '-p', parent, '-m', message], {
    capture: true,
    env: {
      GIT_AUTHOR_NAME: 'EV4 History Matrix',
      GIT_AUTHOR_EMAIL: 'ev4-history-matrix@example.invalid',
      GIT_COMMITTER_NAME: 'EV4 History Matrix',
      GIT_COMMITTER_EMAIL: 'ev4-history-matrix@example.invalid',
    },
  }).trim();
}

export function createWorktree(repository, tempRoot, method, head) {
  const path = join(tempRoot, `worktree-${method}`);
  git(repository, ['worktree', 'add', '--detach', path, head]);
  if (existsSync(join(ROOT, 'node_modules'))) {
    symlinkSync(join(ROOT, 'node_modules'), join(path, 'node_modules'), 'dir');
  }
  return path;
}
