#!/usr/bin/env node

import {existsSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

function diagnosticValue(value) {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return String(value);
}

function diagnosticError(error) {
  return {
    name: error?.name || 'Error',
    message: error?.message || String(error),
    stack: error?.stack || null,
    code: error?.code || null,
    status: error?.status ?? null,
    stdout: diagnosticValue(error?.stdout),
    stderr: diagnosticValue(error?.stderr),
  };
}

function writeReport(root, report) {
  writeFileSync(
    join(root, 'kroad-010-history-matrix-report.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
}

export async function runWithDiagnostics({
  root,
  execute,
  cleanup = async () => {},
}) {
  let passPayload;
  let primaryError;
  let cleanupError;

  try {
    passPayload = await execute();
  } catch (error) {
    primaryError = error;
  }

  try {
    await cleanup();
  } catch (error) {
    cleanupError = error;
  }

  if (primaryError || cleanupError) {
    const error = primaryError || cleanupError;
    const report = {
      schema_version: '0.1.0',
      result: 'DIAGNOSTIC_FAIL',
      diagnostic_only: true,
      exact_head: process.env.COVERAGE_HEAD_SHA || null,
      error: diagnosticError(error),
      cleanup_error: cleanupError ? diagnosticError(cleanupError) : null,
    };
    writeReport(root, report);
    return {exitCode: 1, error, cleanupError, report};
  }

  const {
    schema_version: ignoredSchemaVersion,
    result: ignoredResult,
    ...boundedPayload
  } = passPayload || {};
  const report = {
    schema_version: '0.1.0',
    result: 'PASS',
    ...boundedPayload,
  };
  writeReport(root, report);
  return {exitCode: 0, error: null, cleanupError: null, report};
}

export async function runHistoryMatrix(root = process.cwd()) {
  let tempRoot;
  let repository;
  let git;
  let summary;

  const outcome = await runWithDiagnostics({
    root,
    execute: async () => {
      const common = await import('./kroad-010-history/common.mjs');
      const build = await import('./kroad-010-history/build.mjs');
      const validate = await import('./kroad-010-history/validate.mjs');
      git = common.git;

      const config = common.readJson(root, common.MATRIX_CONFIG_PATH);
      common.assertMethodSet(config.methods || []);
      tempRoot = mkdtempSync(
        join(tmpdir(), 'ev4-kroad-010-history-matrix-'),
      );

      const builder = build.createActivationSource(build.createBuilder(tempRoot));
      repository = builder.repository;
      const heads = build.createFinalHistories(builder);
      const roles = {
        incompleteAnchor: builder.incompleteAnchor,
        staleAnchor: builder.staleAnchor,
        bootstrapAnchor: builder.bootstrapAnchor,
      };
      const matrixResults = validate.validateHistories(
        repository,
        tempRoot,
        heads,
        roles,
      );
      const mutationResults = validate.runMutationGuards(
        repository,
        matrixResults,
        roles,
        config,
      );
      summary = {validate, matrixResults, mutationResults};

      return {
        methods: matrixResults.map((item) => ({
          method: item.method,
          ordinary_records: item.ordinary_records,
          byte_drift_diagnostic: item.byte_drift_diagnostic,
          missing_stack_diagnostic: item.missing_stack_diagnostic,
          working_tree_only_diagnostic:
            item.working_tree_only_diagnostic,
          clean_worktree: item.clean_worktree,
          head: item.head,
        })),
        mutation_guards: mutationResults,
      };
    },
    cleanup: async () => {
      let firstCleanupError;

      if (repository && existsSync(repository) && git) {
        try {
          git(repository, ['worktree', 'prune']);
        } catch (error) {
          firstCleanupError = error;
        }
      }
      if (tempRoot) {
        try {
          rmSync(tempRoot, {recursive: true, force: true});
        } catch (error) {
          firstCleanupError ||= error;
        }
      }

      if (firstCleanupError) throw firstCleanupError;
    },
  });

  if (outcome.exitCode === 0) {
    summary.validate.printSummary(
      summary.matrixResults,
      summary.mutationResults,
    );
  } else {
    console.error(
      `KROAD-010 diagnostic capture: ${outcome.error?.message || outcome.error}`,
    );
  }

  return {...outcome, summary};
}

const invokedPath = process.argv[1]
  ? pathToFileURL(process.argv[1]).href
  : null;
if (invokedPath === import.meta.url) {
  const outcome = await runHistoryMatrix();
  process.exitCode = outcome.exitCode;
}
