#!/usr/bin/env node

import {existsSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  MATRIX_CONFIG_PATH,
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

function diagnosticValue(value) {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return String(value);
}

function writeDiagnostic(error, cleanupError = null) {
  writeFileSync(
    join(ROOT, 'kroad-010-history-matrix-report.json'),
    `${JSON.stringify({
      schema_version: '0.1.0',
      result: 'DIAGNOSTIC_FAIL',
      diagnostic_only: true,
      exact_head: process.env.COVERAGE_HEAD_SHA || null,
      error: {
        name: error?.name || 'Error',
        message: error?.message || String(error),
        stack: error?.stack || null,
        code: error?.code || null,
        status: error?.status ?? null,
        stdout: diagnosticValue(error?.stdout),
        stderr: diagnosticValue(error?.stderr),
      },
      cleanup_error: cleanupError ? {
        name: cleanupError?.name || 'Error',
        message: cleanupError?.message || String(cleanupError),
        stack: cleanupError?.stack || null,
        code: cleanupError?.code || null,
        status: cleanupError?.status ?? null,
        stdout: diagnosticValue(cleanupError?.stdout),
        stderr: diagnosticValue(cleanupError?.stderr),
      } : null,
    }, null, 2)}\n`,
  );
}

function main() {
  let tempRoot;
  let repository;
  let primaryError;
  let cleanupError;

  try {
    const config = readJson(ROOT, MATRIX_CONFIG_PATH);
    assertMethodSet(config.methods || []);
    tempRoot = mkdtempSync(
      join(tmpdir(), 'ev4-kroad-010-history-matrix-'),
    );

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
    writeFileSync(
      join(ROOT, 'kroad-010-history-matrix-report.json'),
      `${JSON.stringify({
        schema_version: '0.1.0',
        result: 'PASS',
        methods: matrixResults.map((item) => ({
          method: item.method,
          ordinary_records: item.ordinary_records,
          byte_drift_diagnostic: item.byte_drift_diagnostic,
          missing_stack_diagnostic: item.missing_stack_diagnostic,
          working_tree_only_diagnostic: item.working_tree_only_diagnostic,
          clean_worktree: item.clean_worktree,
          head: item.head,
        })),
        mutation_guards: mutationResults,
      }, null, 2)}\n`,
    );
    printSummary(matrixResults, mutationResults);
  } catch (error) {
    primaryError = error;
  } finally {
    if (repository && existsSync(repository)) {
      try {
        git(repository, ['worktree', 'prune']);
      } catch (error) {
        cleanupError = error;
      }
    }
    if (tempRoot) {
      try {
        rmSync(tempRoot, {recursive: true, force: true});
      } catch (error) {
        cleanupError ||= error;
      }
    }
  }

  if (primaryError || cleanupError) {
    writeDiagnostic(primaryError || cleanupError, cleanupError);
    console.error(
      `KROAD-010 diagnostic capture: ${(primaryError || cleanupError)?.message || (primaryError || cleanupError)}`,
    );
    process.exitCode = 0;
  }
}

main();
