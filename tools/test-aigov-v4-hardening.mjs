#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { analyzeWorkflowYaml } from '../kernel/validator/validate-aigov-governance.mjs';
import { recoveryProgramDiagnostics } from '../kernel/validator/validate-recovery-execution-program.mjs';
import { ownerPolicyReviewObservation } from './lib/pr-inspector-v1102.mjs';
import { ownerPolicyWorkflowDiagnosticAllowed } from './validate-aigov-v4-governance.mjs';

const results = [];
const record = (name, pass, diagnostics = []) => results.push({
  name,
  pass: Boolean(pass),
  diagnostics,
});
const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));

const policy = readJson('kernel/decision-governance/aigov-repository-policy.v1.json');
record(
  'mandatory independent review removed repository-wide',
  policy.authority.independent_review_required === false
    && policy.authority.independent_exact_head_review === 'optional_advisory',
);

const missing = ownerPolicyReviewObservation();
record(
  'missing review is explicitly not required',
  missing.required === false
    && missing.status === 'not_required_by_owner_policy'
    && missing.merge_authority === false,
);
const stale = ownerPolicyReviewObservation({
  reviewed_head_sha: '0'.repeat(40),
  reviewed_scope_revision: `sha256:${'1'.repeat(64)}`,
  review_status: 'GREEN_TECHNICALLY_READY',
  provenance: 'external',
}, {
  headSha: '2'.repeat(40),
  scopeRevision: `sha256:${'3'.repeat(64)}`,
});
record(
  'stale review remains advisory and grants no Merge authority',
  stale.status === 'stale_advisory' && stale.merge_authority === false,
);
record('owner policy cannot fabricate GREEN_TECHNICALLY_READY', missing.technical_status == null);

const coverageContract = readJson(
  'kernel/decision-governance/coverage-guarantee-contract.v1.json',
);
record(
  'optional PR review is distinct from external Coverage promotion evidence',
  coverageContract.merge_gate?.independent_pr_inspector_green === 'optional_advisory'
    && coverageContract.promotion_boundary?.required_predicates
      ?.includes('independent_review_passed'),
  {
    merge_gate: coverageContract.merge_gate,
    promotion_predicates: coverageContract.promotion_boundary?.required_predicates,
  },
);

const protocol = readFileSync(
  'docs/governance/AIGOV_EXACT_MAIN_CLOSURE_PROTOCOL.md',
  'utf8',
);
record(
  'protocol carries the exact optional pre-Merge review field',
  protocol.includes('independent_pre_merge_review_required: false')
    && protocol.includes('independent_review_policy: optional_advisory'),
);

const closureSource = readFileSync('tools/lib/aigov-v3-closure.mjs', 'utf8');
for (const code of [
  'AIGOV_BATCH_B_REVIEW_REQUIRED',
  'AIGOV_BATCH_B_REVIEW_STALE',
  'AIGOV_BATCH_B_REVIEW_PROVENANCE_UNVERIFIED',
  'AIGOV_BATCH_B_REVIEW_SEQUENCE_INVALID',
]) {
  record(`${code} removed from active closure`, !closureSource.includes(code));
}

const finalizer = readFileSync('.github/workflows/finalize-aigov-batch-b.yml', 'utf8');
record(
  'post-Merge finalizer uses owner-policy verifier without PR Inspector checkout',
  finalizer.includes('--mode batch-b-final')
    && !finalizer.includes('Checkout pinned PR Inspector'),
);
const sequenceWorkflow = readFileSync(
  '.github/workflows/validate-rereview-sequence.yml',
  'utf8',
);
record(
  'stable sequence check is now owner-policy validation',
  sequenceWorkflow.includes('Validate owner policy and remaining Merge gates')
    && !sequenceWorkflow.includes('validate_rereview_sequence.py'),
);

const pin = 'a'.repeat(40);
const baseWorkflow = `name: test
on: pull_request
permissions:
  contents: read
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@${pin}
      - run: echo safe
`;
const inactiveHistoricalWorkflow = `name: historical
on: pull_request
permissions:
  contents: read
jobs:
  historical:
    if: \${{ false }}
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@${pin}
      - run: npm run missing-historical-script
`;
const repositoryReader = (path) => (path === 'package.json' ? '{"scripts":{}}' : null);
const inactiveDiagnostics = analyzeWorkflowYaml(inactiveHistoricalWorkflow, {
  source: '.github/workflows/historical.yml',
  baseText: baseWorkflow,
  readRepositoryFile: repositoryReader,
});
const inactiveUnresolved = inactiveDiagnostics.filter(
  (item) => item.code === 'AIGOV_LOCAL_SCRIPT_UNRESOLVED',
);
record(
  'statically disabled historical job cannot create an active script blocker',
  inactiveUnresolved.length > 0
    && inactiveUnresolved.every((item) => ownerPolicyWorkflowDiagnosticAllowed(item, {
      source: '.github/workflows/historical.yml',
      currentText: inactiveHistoricalWorkflow,
      baseText: baseWorkflow,
    })),
  inactiveDiagnostics.map((item) => item.code),
);

const activeHistoricalWorkflow = inactiveHistoricalWorkflow.replace(
  'if: ${{ false }}',
  'if: ${{ true }}',
);
const activeDiagnostics = analyzeWorkflowYaml(activeHistoricalWorkflow, {
  source: '.github/workflows/historical.yml',
  baseText: baseWorkflow,
  readRepositoryFile: repositoryReader,
});
const activeUnresolved = activeDiagnostics.find(
  (item) => item.code === 'AIGOV_LOCAL_SCRIPT_UNRESOLVED',
);
record(
  'active unresolved historical script remains blocking',
  activeUnresolved
    && !ownerPolicyWorkflowDiagnosticAllowed(activeUnresolved, {
      source: '.github/workflows/historical.yml',
      currentText: activeHistoricalWorkflow,
      baseText: baseWorkflow,
    }),
  activeDiagnostics.map((item) => item.code),
);

const currentReadOnlyWorkflow = `${baseWorkflow.trimEnd()}
  coverage-diagnostics:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@${pin}
      - run: echo diagnostics
`;
const readOnlyDiagnostics = analyzeWorkflowYaml(currentReadOnlyWorkflow, {
  source: '.github/workflows/validate-mvk.yml',
  baseText: baseWorkflow,
  readRepositoryFile: repositoryReader,
});
const readOnlyBoundary = readOnlyDiagnostics.find(
  (item) => item.code === 'AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN'
    && item.message.includes('jobs.coverage-diagnostics'),
);
record(
  'new explicit read-only diagnostic job inherits a proven non-expanding base boundary',
  readOnlyBoundary
    && ownerPolicyWorkflowDiagnosticAllowed(readOnlyBoundary, {
      source: '.github/workflows/validate-mvk.yml',
      currentText: currentReadOnlyWorkflow,
      baseText: baseWorkflow,
    }),
  readOnlyDiagnostics.map((item) => item.code),
);

const currentWriteWorkflow = currentReadOnlyWorkflow.replace(
  'coverage-diagnostics:\n    runs-on: ubuntu-latest\n    permissions:\n      contents: read',
  'coverage-diagnostics:\n    runs-on: ubuntu-latest\n    permissions:\n      contents: write',
);
record(
  'permission expansion cannot use the read-only exception',
  !ownerPolicyWorkflowDiagnosticAllowed({
    code: 'AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN',
    message: 'No base permission boundary exists for jobs.coverage-diagnostics.',
  }, {
    source: '.github/workflows/validate-mvk.yml',
    currentText: currentWriteWorkflow,
    baseText: baseWorkflow,
  }),
);

for (const [source, jobKey] of [
  ['.github/workflows/validate-mvk.yml', 'regression-validation'],
  ['.github/workflows/validate-main.yml', 'validate-main'],
]) {
  const workflow = readFileSync(source, 'utf8');
  const tokenDiagnostic = {
    code: 'AIGOV_SECRET_ACCESS_FORBIDDEN',
    message: `Workflow accesses a credential at jobs.${jobKey}.env.RECOVERY_GITHUB_TOKEN.`,
  };
  record(
    `${source} permits only the structurally verified built-in Recovery job token`,
    ownerPolicyWorkflowDiagnosticAllowed(tokenDiagnostic, {
      source,
      currentText: workflow,
      baseText: workflow,
    })
      && !ownerPolicyWorkflowDiagnosticAllowed(tokenDiagnostic, {
        source,
        currentText: workflow.replace('${{ github.token }}', '${{ secrets.RECOVERY_PAT }}'),
        baseText: workflow,
      }),
  );
}

const recovery = readJson('planning/recovery/recovery-execution-program.v1.json');
const recoveryDiagnostics = recoveryProgramDiagnostics(recovery);
record('full Recovery activation passes', recoveryDiagnostics.length === 0, recoveryDiagnostics);
{
  const candidate = structuredClone(recovery);
  candidate.kroad_supersession_effect = 'superseded';
  const observed = recoveryProgramDiagnostics(candidate);
  record(
    'KROAD mutation still blocks',
    observed.includes('RECOVERY_KROAD_SUPERSESSION_FORBIDDEN'),
    observed,
  );
}
{
  const candidate = structuredClone(recovery);
  candidate.tasks[0].coverage_credit = true;
  const observed = recoveryProgramDiagnostics(candidate);
  record(
    'Coverage overclaim still blocks',
    observed.includes('RECOVERY_COVERAGE_CREDIT_FORBIDDEN'),
    observed,
  );
}
{
  const candidate = structuredClone(recovery);
  candidate.tasks[1].status = 'complete';
  const observed = recoveryProgramDiagnostics(candidate);
  record(
    'premature task completion still blocks',
    observed.includes('RECOVERY_COMPLETE_TASK_DEPENDENCY_INCOMPLETE'),
    observed,
  );
}

const report = {
  suite: 'aigov-v4-owner-policy-hardening',
  status: results.every((item) => item.pass) ? 'pass' : 'fail',
  cases: results,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
