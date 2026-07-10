#!/usr/bin/env node

import {existsSync, mkdtempSync, rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  MATRIX_CONFIG_PATH,
  REQUIRED_METHODS,
  ROOT,
  assertMethodSet,
  git,
  readJson,
} from './kroad-010-history/common.mjs';
import {
  createActivationSource,
  createBuilder,
  createFinalHistories,
} from './kroad-010-history/build.mjs';
import {
  printSummary,
  runMutationGuards,
  validateHistories,
} from './kroad-010-history/validate.mjs';

function main() {
  const config = readJson(ROOT, MATRIX_CONFIG_PATH);
  assertMethodSet(config.methods || []);

  const tempRoot = mkdtempSync(
    join(tmpdir(), 'ev4-kroad-010-history-matrix-'),
  );
  let repository;
  try {
    const builder = createActivationSource(createBuilder(tempRoot));
    repository = builder.repository;
    const heads = createFinalHistories(builder);
    const roles = {
      incompleteAnchor: builder.incompleteAnchor,
      staleAnchor: builder.staleAnchor,
      bootstrapAnchor: builder.bootstrapAnchor,
    };
    const matrixResults = validateHistories(
      repository,
      tempRoot,
      heads,
      roles,
    );
    const mutationResults = runMutationGuards(
      repository,
      matrixResults,
      roles,
      config,
    );
    printSummary(matrixResults, mutationResults);
  } finally {
    if (repository && existsSync(repository)) {
      try {
        git(repository, ['worktree', 'prune']);
      } catch {
        // Temporary cleanup remains best effort.
      }
    }
    rmSync(tempRoot, {recursive: true, force: true});
  }
}

main();
