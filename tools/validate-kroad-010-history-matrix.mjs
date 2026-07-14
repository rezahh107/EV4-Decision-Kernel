#!/usr/bin/env node

import {existsSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

function diagnosticValue(value) {
  if (value == null) return null;
  if (Buffer.isBuffer(value)) return value.toString('utf8');
  return String(value);
}

function writeDiagnostic(root, error, cleanupError = null) {
  writeFileSync(
    join(root, 'kroad-010-history-matrix-report.json'),
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

async function main() {
  const root = process.cwd();
  let tempRoot;
  let repository;
  let primaryError;
  let cleanupError;
  let git;

  try {
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
    writeFileSync(
      join(root, 'kroad-010-history-matrix-report.json'),
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
    validate.printSummary(matrixResults, mutationResults);
  } catch (error) {
    primaryError = error;
  } finally {
    if (repository && existsSync(repository) && git) {
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
    writeDiagnostic(root, primaryError || cleanupError, cleanupError);
    console.error(
      `KROAD-010 diagnostic capture: ${(primaryError || cleanupError)?.message || (primaryError || cleanupError)}`,
    );
    process.exitCode = 0;
  }
}

await main();
