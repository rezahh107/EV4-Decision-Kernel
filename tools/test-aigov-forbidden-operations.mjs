#!/usr/bin/env node
import { analyzeWorkflowYaml, classifyDependencyChange } from '../kernel/validator/validate-aigov-governance.mjs';

const pin = 'a'.repeat(40);
const workflow = (run, name = 'test', permissions = 'read') => `name: test\non: pull_request\npermissions:\n  contents: ${permissions}\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - name: ${name}\n        uses: actions/checkout@${pin}\n      - run: |\n          ${run.replaceAll('\n', '\n          ')}\n`;
const base = workflow('echo safe');
const cases = [];

function expectCode(name, text, code, options = {}) {
  const diagnostics = analyzeWorkflowYaml(text, { source: `${name}.yml`, baseText: options.baseText ?? base });
  cases.push({ name, expected: code, pass: diagnostics.some((item) => item.code === code), diagnostics: diagnostics.map((item) => item.code) });
}

expectCode('auto merge', workflow('gh pr merge 49 --auto'), 'AIGOV_MERGE_COMMAND_FORBIDDEN');
expectCode('force push', workflow('git push --force origin HEAD:main'), 'AIGOV_FORCE_PUSH_FORBIDDEN');
expectCode('settings mutation', workflow('gh api --method PATCH /repos/rezahh107/EV4-Decision-Kernel/branches/main/protection'), 'AIGOV_REPOSITORY_SETTINGS_MUTATION_FORBIDDEN');
expectCode('external repository write', workflow('gh api --method POST /repos/other/repository/issues'), 'AIGOV_EXTERNAL_REPOSITORY_WRITE_FORBIDDEN');
expectCode('workflow secret access', workflow('echo "${{ secrets.DEPLOY_TOKEN }}"'), 'AIGOV_SECRET_ACCESS_FORBIDDEN');
expectCode('permission expansion', workflow('echo safe', 'test', 'write'), 'AIGOV_WORKFLOW_PERMISSION_EXPANSION');
expectCode('destructive deletion', workflow('rm -rf ./important'), 'AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN');
expectCode('broad dependency command', workflow('npm update'), 'AIGOV_BROAD_DEPENDENCY_UPGRADE_FORBIDDEN');
expectCode('mutable action reference', base.replace(`actions/checkout@${pin}`, 'actions/checkout@main'), 'AIGOV_ACTION_NOT_IMMUTABLY_PINNED', { baseText: base });

const harmless = analyzeWorkflowYaml(workflow('echo safe', 'Run secret scanner'), { source: 'harmless.yml', baseText: base });
cases.push({ name: 'harmless secret prose', expected: 'no secret diagnostic', pass: !harmless.some((item) => item.code === 'AIGOV_SECRET_ACCESS_FORBIDDEN'), diagnostics: harmless.map((item) => item.code) });
const dependencyOrder = classifyDependencyChange({ dependencies: { b: '1', a: '2' } }, { dependencies: { a: '2', b: '1' } });
cases.push({ name: 'canonical dependency key order', expected: 'semantic equality', pass: dependencyOrder.identical && !dependencyOrder.broad, diagnostics: dependencyOrder });

const report = { suite: 'aigov-forbidden-operations', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
