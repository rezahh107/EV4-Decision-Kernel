#!/usr/bin/env node
import { analyzeWorkflowYaml, classifyDependencyChange } from '../kernel/validator/validate-aigov-governance.mjs';

const pin = 'a'.repeat(40);
const workflow = (run, name = 'test', permissions = 'read') => `name: test\non: pull_request\npermissions:\n  contents: ${permissions}\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - name: ${name}\n        uses: actions/checkout@${pin}\n      - run: |\n          ${run.replaceAll('\n', '\n          ')}\n`;
const base = workflow('echo safe');
const cases = [];

function expectCode(name, text, code, options = {}) {
  const files = options.files || {};
  const diagnostics = analyzeWorkflowYaml(text, { source: `${name}.yml`, baseText: options.baseText ?? base, readRepositoryFile: options.files ? (relative) => files[relative] ?? null : null });
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

const localScriptWorkflow = (scriptPath, permissions = 'read') => workflow(`node ${scriptPath}`, 'invoke local script', permissions);
expectCode('local script GitHub API PATCH', localScriptWorkflow('scripts/settings.mjs'), 'AIGOV_REPOSITORY_SETTINGS_MUTATION_FORBIDDEN', {
  files: { 'package.json': '{"scripts":{}}', 'scripts/settings.mjs': "await fetch('https://api.github.com/repos/rezahh107/EV4-Decision-Kernel/branches/main/protection', { method: 'PATCH' });\n" },
});
expectCode('local script force push through child process', localScriptWorkflow('scripts/push.mjs'), 'AIGOV_FORCE_PUSH_FORBIDDEN', {
  files: { 'package.json': '{"scripts":{}}', 'scripts/push.mjs': "import { execSync } from 'node:child_process';\nexecSync('git push --force origin HEAD:main');\n" },
});

const localActionWorkflow = base.replace(`uses: actions/checkout@${pin}`, 'uses: ./actions/external-write');
expectCode('local action external repository write', localActionWorkflow, 'AIGOV_EXTERNAL_REPOSITORY_WRITE_FORBIDDEN', {
  files: {
    'package.json': '{"scripts":{}}',
    'actions/external-write/action.yml': "name: external write\nruns:\n  using: node20\n  main: index.mjs\n",
    'actions/external-write/index.mjs': "await fetch('https://api.github.com/repos/other/repository/issues', { method: 'POST' });\n",
  },
});

const noWorkflowPermissions = `name: test\non: pull_request\njobs:\n  test:\n    runs-on: ubuntu-latest\n    steps:\n      - uses: actions/checkout@${pin}\n      - run: echo safe\n`;
expectCode('removal of restrictive workflow permissions', noWorkflowPermissions, 'AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN');
expectCode('job inheritance after workflow permission removal', noWorkflowPermissions, 'AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN', { baseText: workflow('echo safe') });

expectCode('dynamically constructed mutation endpoint', localScriptWorkflow('scripts/dynamic.mjs'), 'AIGOV_REPOSITORY_SETTINGS_MUTATION_FORBIDDEN', {
  files: { 'package.json': '{"scripts":{}}', 'scripts/dynamic.mjs': "const endpoint = `/repos/${process.env.OWNER}/${process.env.REPO}/branches/${process.env.BRANCH}/protection`;\nawait fetch(`https://api.github.com${endpoint}`, { method: 'PATCH' });\n" },
});
expectCode('https request repository mutation', localScriptWorkflow('scripts/https.mjs'), 'AIGOV_EXTERNAL_REPOSITORY_WRITE_FORBIDDEN', {
  files: { 'package.json': '{"scripts":{}}', 'scripts/https.mjs': "import https from 'node:https';\nhttps.request({ path: '/repos/other/repo/issues', method: 'POST' });\n" },
});
expectCode('Octokit repository mutation', localScriptWorkflow('scripts/octokit.mjs'), 'AIGOV_EXTERNAL_REPOSITORY_WRITE_FORBIDDEN', {
  files: { 'package.json': '{"scripts":{}}', 'scripts/octokit.mjs': "await octokit.request('PATCH /repos/other/repo', { archived: true });\n" },
});
expectCode('gh api behind child process', localScriptWorkflow('scripts/gh.mjs'), 'AIGOV_REPOSITORY_SETTINGS_MUTATION_FORBIDDEN', {
  files: { 'package.json': '{"scripts":{}}', 'scripts/gh.mjs': "execSync('gh api --method PATCH /repos/rezahh107/EV4-Decision-Kernel/rulesets/1');\n" },
});
expectCode('unresolved dynamic execution', localScriptWorkflow('scripts/dynamic-exec.mjs'), 'AIGOV_DYNAMIC_EXECUTION_UNRESOLVED', {
  files: { 'package.json': '{"scripts":{}}', 'scripts/dynamic-exec.mjs': "execSync(process.env.COMMAND);\n" },
});

const harmless = analyzeWorkflowYaml(workflow('echo safe', 'Run secret scanner'), { source: 'harmless.yml', baseText: base });
cases.push({ name: 'harmless secret prose', expected: 'no secret diagnostic', pass: !harmless.some((item) => item.code === 'AIGOV_SECRET_ACCESS_FORBIDDEN'), diagnostics: harmless.map((item) => item.code) });
const dependencyOrder = classifyDependencyChange({ dependencies: { b: '1', a: '2' } }, { dependencies: { a: '2', b: '1' } });
cases.push({ name: 'canonical dependency key order', expected: 'semantic equality', pass: dependencyOrder.identical && !dependencyOrder.broad, diagnostics: dependencyOrder });

const report = { suite: 'aigov-forbidden-operations', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
