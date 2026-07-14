#!/usr/bin/env node

import assert from 'node:assert/strict';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {spawnSync} from 'node:child_process';

const ROOT = process.cwd();
const runnerUrl = pathToFileURL(
  join(ROOT, 'tools/validate-kroad-010-history-matrix.mjs'),
).href;

const childSource = `
import {runWithDiagnostics} from ${JSON.stringify(runnerUrl)};

const root = process.env.EV4_TEST_REPORT_ROOT;
const testCase = process.env.EV4_TEST_CASE;
const codedError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

let execute;
let cleanup = async () => {};

switch (testCase) {
  case 'module-load-failure':
    execute = async () => import('file:///ev4/nonexistent-history-module.mjs');
    break;
  case 'history-construction-failure':
    execute = async () => {
      throw codedError(
        'HISTORY_MATRIX_TEST_CONSTRUCTION_FAILURE',
        'injected history construction failure',
      );
    };
    break;
  case 'mutation-guard-failure':
    execute = async () => {
      throw codedError(
        'HISTORY_MATRIX_TEST_MUTATION_GUARD_FAILURE',
        'injected mutation guard failure',
      );
    };
    break;
  case 'cleanup-failure':
    execute = async () => ({methods: [], mutation_guards: []});
    cleanup = async () => {
      throw codedError(
        'HISTORY_MATRIX_TEST_CLEANUP_FAILURE',
        'injected cleanup failure',
      );
    };
    break;
  case 'valid':
    execute = async () => ({
      methods: [{method: 'merge_commit', clean_worktree: true}],
      mutation_guards: [{case_id: 'valid', passed: true}],
    });
    break;
  default:
    throw new Error(`unknown test case: ${testCase}`);
}

const outcome = await runWithDiagnostics({root, execute, cleanup});
process.exitCode = outcome.exitCode;
`;

function runCase(testCase, expectedStatus, expectedResult, expectedCode = null) {
  const reportRoot = mkdtempSync(
    join(tmpdir(), `ev4-kroad-010-${testCase}-`),
  );
  try {
    const child = spawnSync(
      process.execPath,
      ['--input-type=module', '--eval', childSource],
      {
        cwd: ROOT,
        encoding: 'utf8',
        env: {
          ...process.env,
          EV4_TEST_CASE: testCase,
          EV4_TEST_REPORT_ROOT: reportRoot,
        },
      },
    );

    assert.equal(
      child.status,
      expectedStatus,
      `${testCase}: unexpected exit status\nstdout:\n${child.stdout}\nstderr:\n${child.stderr}`,
    );

    const report = JSON.parse(readFileSync(
      join(reportRoot, 'kroad-010-history-matrix-report.json'),
      'utf8',
    ));
    assert.equal(report.result, expectedResult, `${testCase}: result`);
    if (expectedCode) {
      const actualCode = testCase === 'cleanup-failure'
        ? report.cleanup_error?.code
        : report.error?.code;
      assert.equal(actualCode, expectedCode, `${testCase}: diagnostic code`);
    }
  } finally {
    rmSync(reportRoot, {recursive: true, force: true});
  }
}

runCase('module-load-failure', 1, 'DIAGNOSTIC_FAIL', 'ERR_MODULE_NOT_FOUND');
runCase(
  'history-construction-failure',
  1,
  'DIAGNOSTIC_FAIL',
  'HISTORY_MATRIX_TEST_CONSTRUCTION_FAILURE',
);
runCase(
  'mutation-guard-failure',
  1,
  'DIAGNOSTIC_FAIL',
  'HISTORY_MATRIX_TEST_MUTATION_GUARD_FAILURE',
);
runCase(
  'cleanup-failure',
  1,
  'DIAGNOSTIC_FAIL',
  'HISTORY_MATRIX_TEST_CLEANUP_FAILURE',
);
runCase('valid', 0, 'PASS');

console.log(
  'KROAD-010 fail-closed diagnostic tests: PASS '
  + '(module-load, construction, mutation-guard, cleanup, valid)',
);
