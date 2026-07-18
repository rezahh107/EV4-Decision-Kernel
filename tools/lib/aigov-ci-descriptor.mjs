import { createHash } from 'node:crypto';
import { parseDocument } from 'yaml';
import { canonicalSha256 } from './aigov-lifecycle.mjs';

export const GITHUB_ACTIONS_APP_ID = 15368;
export const GITHUB_ACTIONS_APP_SLUG = 'github-actions';

export const AUTHORITATIVE_WORKFLOWS = Object.freeze({
  behavioral: Object.freeze({ name: 'Behavioral Coverage Audit', path: '.github/workflows/behavioral-coverage.yml', checkName: 'Behavioral coverage' }),
  sequence: Object.freeze({ name: 'Validate rereview sequence enforcement', path: '.github/workflows/validate-rereview-sequence.yml', checkName: 'Validate rereview sequence enforcement' }),
  mvk: Object.freeze({ name: 'Validate MVK', path: '.github/workflows/validate-mvk.yml', checkName: 'Validate MVK' }),
  main: Object.freeze({ name: 'Validate Main', path: '.github/workflows/validate-main.yml', checkName: 'Validate Main' }),
});

const RECOVERY_API_PERMISSIONS = Object.freeze({
  contents: 'read',
  actions: 'read',
  checks: 'read',
  'pull-requests': 'read',
});
const RECOVERY_TOKEN_EXPRESSION = '${{ github.token }}';
const EXTERNAL_COVERAGE_TRUST = Object.freeze({
  jobKey: 'external-coverage-trust',
  uses: 'rezahh107/PR-Inspector/.github/workflows/coverage-trust-gate.yml@7a21045366bb9ad1ca2f950b8341ebb867dd8a52',
  permissions: Object.freeze({ contents: 'read', 'pull-requests': 'read', 'id-token': 'write' }),
  authority: 'rezahh107/PR-Inspector@7a21045366bb9ad1ca2f950b8341ebb867dd8a52',
});
const MVK_RECOVERY_RUN = [
  'npm run validate:recovery-program',
  'npm run test:recovery-lifecycle',
  'npm run validate:recovery-ledger',
  'npm run test:recovery-ledger-lifecycle',
].join('\n');
const MVK_COVERAGE_RUN = [
  'set -euo pipefail',
  'git reset --hard "${COVERAGE_HEAD_SHA}"',
  'git clean -ffdx',
  'test "$(git rev-parse HEAD)" = "${COVERAGE_HEAD_SHA}"',
  'test -z "$(git status --porcelain=v1 --untracked-files=all)"',
  'npm ci',
  'npm run validate:coverage',
].join('\n');
const MAIN_RECOVERY_RUN = [
  'set -euo pipefail',
  'test "${COVERAGE_REPOSITORY}" = "rezahh107/EV4-Decision-Kernel"',
  'test "${COVERAGE_IDENTITY_MODE}" = "post_merge"',
  'test -z "${COVERAGE_PR_NUMBER:-}"',
  '[[ "${COVERAGE_BASE_SHA}" =~ ^[0-9a-f]{40}$ ]]',
  '[[ "${COVERAGE_HEAD_SHA}" =~ ^[0-9a-f]{40}$ ]]',
  'test "$(git rev-parse HEAD)" = "${COVERAGE_HEAD_SHA}"',
  'git merge-base --is-ancestor "${COVERAGE_BASE_SHA}" "${COVERAGE_HEAD_SHA}"',
  'npm run validate:aigov-v4-batch-a-reconciliation',
  'npm run validate:mvk',
].join('\n');

export const RECOVERY_AUTHORITATIVE_WORKFLOWS = Object.freeze({
  mvk: Object.freeze({
    policyId: 'recovery-workflow-source.mvk.v1',
    name: 'Validate MVK',
    path: '.github/workflows/validate-mvk.yml',
    workflowId: 309028718,
    event: 'pull_request',
    checkName: 'MVK and roadmap regressions',
    jobKey: 'regression-validation',
    requiredNeeds: Object.freeze(['external-coverage-trust', 'validate-mvk']),
    validatorStepName: 'Validate Recovery lifecycle',
    validatorCommand: 'npm run validate:recovery-ledger',
    validatorRun: MVK_RECOVERY_RUN,
    validatorIf: '${{ always() }}',
    validatorShell: null,
    validatorEnv: null,
    requiredEnv: Object.freeze({
      RECOVERY_GITHUB_TOKEN: RECOVERY_TOKEN_EXPRESSION,
      COVERAGE_REPOSITORY: '${{ needs.external-coverage-trust.outputs.verified_repository }}',
      COVERAGE_PR_NUMBER: '${{ needs.external-coverage-trust.outputs.verified_pr_number }}',
      COVERAGE_BASE_SHA: '${{ needs.external-coverage-trust.outputs.verified_base_sha }}',
      COVERAGE_HEAD_SHA: '${{ needs.external-coverage-trust.outputs.verified_head_sha }}',
    }),
    acceptedSources: Object.freeze([Object.freeze({
      blob_sha: 'ca39316889c594fc3e47783809375da38abeb36c',
      final_byte_sha256: '6a5aadf26ebd910e1f84e6ebc570ed492647627e8aec151a9c88409c2c810b4b',
    })]),
    externalTrust: EXTERNAL_COVERAGE_TRUST,
    coverageJob: Object.freeze({
      jobKey: 'validate-mvk',
      name: 'Validate MVK',
      requiredNeeds: Object.freeze(['external-coverage-trust']),
      validatorStepName: 'Validate exact-head Coverage boundary',
      validatorRun: MVK_COVERAGE_RUN,
      validatorIf: null,
      validatorShell: 'bash',
      validatorEnv: Object.freeze({
        COVERAGE_REPOSITORY: '${{ needs.external-coverage-trust.outputs.verified_repository }}',
        COVERAGE_PR_NUMBER: '${{ needs.external-coverage-trust.outputs.verified_pr_number }}',
        COVERAGE_BASE_SHA: '${{ needs.external-coverage-trust.outputs.verified_base_sha }}',
        COVERAGE_HEAD_SHA: '${{ needs.external-coverage-trust.outputs.verified_head_sha }}',
      }),
    }),
  }),
  main: Object.freeze({
    policyId: 'recovery-workflow-source.main.v1',
    name: 'Validate Main',
    path: '.github/workflows/validate-main.yml',
    workflowId: 312952795,
    event: 'push',
    checkName: 'Validate Main',
    jobKey: 'validate-main',
    requiredNeeds: Object.freeze([]),
    validatorStepName: 'Validate MVK, AIGOV, Coverage and Recovery activation',
    validatorCommand: 'npm run validate:mvk',
    validatorRun: MAIN_RECOVERY_RUN,
    validatorIf: null,
    validatorShell: null,
    validatorEnv: null,
    requiredEnv: Object.freeze({
      RECOVERY_GITHUB_TOKEN: RECOVERY_TOKEN_EXPRESSION,
      COVERAGE_REPOSITORY: '${{ github.repository }}',
      COVERAGE_IDENTITY_MODE: 'post_merge',
      COVERAGE_BASE_SHA: '${{ github.event.before }}',
      COVERAGE_HEAD_SHA: '${{ github.sha }}',
    }),
    acceptedSources: Object.freeze([Object.freeze({
      blob_sha: '9495d5b9d7f8622ede2777e5ee0c044f5a5f96b0',
      final_byte_sha256: 'da375dc9b4ff0d9a33464c04bc3b4b45e99634698e63035bd5cc081527a58845',
    })]),
    externalTrust: null,
    coverageJob: null,
  }),
});

const VERIFIED_RUNS = new WeakSet();
const VERIFIED_RECOVERY_WORKFLOW_SOURCES = new WeakSet();
const VERIFIED_AGGREGATES = new WeakSet();
const VERIFIED_MERGES = new WeakSet();
const VERIFIED_CURRENT_MAIN = new WeakSet();
const VERIFIED_ENFORCEMENT = new WeakSet();
const unique = (values) => [...new Set(values)];
const validSha = (value) => /^[0-9a-f]{40}$/.test(value || '');

function freezeEvidence(value, registry) {
  const frozen = Object.freeze(value);
  registry.add(frozen);
  return frozen;
}

export function isVerifiedAuthoritativeRun(value) { return Boolean(value && VERIFIED_RUNS.has(value)); }
export function isVerifiedRecoveryWorkflowSource(value) { return Boolean(value && VERIFIED_RECOVERY_WORKFLOW_SOURCES.has(value)); }
export function isVerifiedCiAggregate(value) { return Boolean(value && VERIFIED_AGGREGATES.has(value)); }
export function isVerifiedMergeResult(value) { return Boolean(value && VERIFIED_MERGES.has(value)); }
export function isVerifiedCurrentMain(value) { return Boolean(value && VERIFIED_CURRENT_MAIN.has(value)); }
export function isVerifiedRepositoryEnforcement(value) { return Boolean(value && VERIFIED_ENFORCEMENT.has(value)); }

const same = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const normalizedRun = (value) => String(value ?? '').replaceAll('\r\n', '\n').trimEnd();
const normalizedNeeds = (value) => value == null ? [] : (Array.isArray(value) ? [...value] : [value]);
const workflowPolicies = new Set(Object.values(RECOVERY_AUTHORITATIVE_WORKFLOWS));

export function workflowSourceIdentity(raw) {
  const bytes = Buffer.isBuffer(raw) ? raw : Buffer.from(raw);
  const prefix = Buffer.from(`blob ${bytes.length}\0`);
  return Object.freeze({
    blob_sha: createHash('sha1').update(prefix).update(bytes).digest('hex'),
    final_byte_sha256: createHash('sha256').update(bytes).digest('hex'),
    size: bytes.length,
  });
}

function parseWorkflow(raw, diagnostics) {
  const document = parseDocument(raw.toString('utf8'), {
    prettyErrors: false,
    strict: true,
    uniqueKeys: true,
  });
  if (document.errors.length) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_YAML_INVALID');
    return null;
  }
  return document.toJS({ mapAsMap: false });
}

function exactStep(job, policy, diagnostics) {
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  const matching = steps.filter((step) => step?.name === policy.validatorStepName);
  if (matching.length !== 1) diagnostics.push('AIGOV_RECOVERY_WORKFLOW_VALIDATOR_STEP_MISMATCH');
  const step = matching[0];
  const observedIf = step && Object.hasOwn(step, 'if') ? step.if : null;
  const observedShell = step && Object.hasOwn(step, 'shell') ? step.shell : null;
  const observedEnv = step && Object.hasOwn(step, 'env') ? step.env : null;
  if (!step
    || step['continue-on-error'] === true
    || normalizedRun(step.run) !== policy.validatorRun
    || observedIf !== policy.validatorIf
    || observedShell !== policy.validatorShell
    || !same(observedEnv, policy.validatorEnv)
    || Object.hasOwn(step, 'working-directory')) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_VALIDATOR_COMMAND_MISMATCH');
  }
  const commandCount = steps
    .flatMap((candidate) => normalizedRun(candidate?.run).split('\n'))
    .filter((line) => line.trim() === policy.validatorCommand).length;
  if (commandCount !== 1) diagnostics.push('AIGOV_RECOVERY_WORKFLOW_VALIDATOR_COMMAND_COUNT_MISMATCH');
}

function staticallyDisabled(job) {
  const value = String(job?.if ?? '').replaceAll(/\s+/g, '').toLowerCase();
  return job?.if === false || value === 'false' || value === '${{false}}';
}

export function analyzeRecoveryWorkflowSource(raw, expected) {
  const diagnostics = [];
  if (!workflowPolicies.has(expected) || !Buffer.isBuffer(raw)) {
    return ['AIGOV_RECOVERY_WORKFLOW_POLICY_CONTEXT_MALFORMED'];
  }
  const workflow = parseWorkflow(raw, diagnostics);
  if (!workflow) return unique(diagnostics);
  if (workflow.name !== expected.name) diagnostics.push('AIGOV_RECOVERY_WORKFLOW_NAME_MISMATCH');
  const trigger = workflow.on;
  if (expected.event === 'pull_request') {
    if (!trigger || typeof trigger !== 'object' || !Object.hasOwn(trigger, 'pull_request')) {
      diagnostics.push('AIGOV_RECOVERY_WORKFLOW_EVENT_MISMATCH');
    }
  } else if (!trigger?.push || !same(trigger.push.branches, ['main'])) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_EVENT_MISMATCH');
  }

  const jobs = workflow.jobs && typeof workflow.jobs === 'object' ? workflow.jobs : {};
  const job = jobs[expected.jobKey];
  const matchingNames = Object.values(jobs).filter((candidate) => candidate?.name === expected.checkName);
  if (!job || matchingNames.length !== 1 || matchingNames[0] !== job) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_JOB_IDENTITY_MISMATCH');
  }
  if (job) {
    if (job.name !== expected.checkName
      || job['runs-on'] !== 'ubuntu-latest'
      || staticallyDisabled(job)
      || Object.hasOwn(job, 'continue-on-error')
      || Object.hasOwn(job, 'defaults')
      || Object.hasOwn(job, 'container')
      || Object.hasOwn(job, 'services')) {
      diagnostics.push('AIGOV_RECOVERY_WORKFLOW_JOB_IDENTITY_MISMATCH');
    }
    if (!same(normalizedNeeds(job.needs), expected.requiredNeeds)) {
      diagnostics.push('AIGOV_RECOVERY_WORKFLOW_JOB_DEPENDENCY_MISMATCH');
    }
    if (!same(job.permissions, RECOVERY_API_PERMISSIONS)) {
      diagnostics.push('AIGOV_RECOVERY_WORKFLOW_API_PERMISSIONS_MISMATCH');
    }
    if (!same(job.env, expected.requiredEnv)
      || job.env?.RECOVERY_GITHUB_TOKEN !== RECOVERY_TOKEN_EXPRESSION) {
      diagnostics.push('AIGOV_RECOVERY_WORKFLOW_TOKEN_WIRING_MISSING');
    }
    exactStep(job, expected, diagnostics);
  }

  if (expected.externalTrust) {
    const trust = jobs[expected.externalTrust.jobKey];
    if (!trust
      || trust.uses !== expected.externalTrust.uses
      || !same(trust.permissions, expected.externalTrust.permissions)) {
      diagnostics.push('AIGOV_RECOVERY_WORKFLOW_EXTERNAL_TRUST_MISMATCH');
    }
    const coverage = jobs[expected.coverageJob.jobKey];
    if (!coverage
      || coverage.name !== expected.coverageJob.name
      || !same(normalizedNeeds(coverage.needs), expected.coverageJob.requiredNeeds)
      || !same(coverage.permissions, { contents: 'read' })) {
      diagnostics.push('AIGOV_RECOVERY_WORKFLOW_EXTERNAL_TRUST_MISMATCH');
    } else {
      exactStep(coverage, {
        ...expected.coverageJob,
        validatorCommand: 'npm run validate:coverage',
      }, diagnostics);
    }
  }
  return unique(diagnostics);
}

function decodeContentPayload(payload) {
  const encoded = typeof payload?.content === 'string' ? payload.content.replaceAll(/\s+/g, '') : '';
  if (!encoded || !/^[A-Za-z0-9+/]*={0,2}$/.test(encoded)) return null;
  const raw = Buffer.from(encoded, 'base64');
  if (raw.toString('base64') !== encoded) return null;
  return raw;
}

export function verifyRecoveryWorkflowSourcePayload({
  repository,
  repositoryId,
  commitSha,
  expected,
  contentPayload,
  sourceApiUrl,
}) {
  const diagnostics = [];
  const identity = decodeContentPayload(contentPayload);
  const expectedApiUrl = `https://api.github.com/repos/${repository}/contents/${expected?.path?.split('/').map(encodeURIComponent).join('/')}?ref=${encodeURIComponent(commitSha || '')}`;
  if (repository !== 'rezahh107/EV4-Decision-Kernel'
    || repositoryId !== 1292378784
    || !validSha(commitSha)
    || !workflowPolicies.has(expected)
    || sourceApiUrl !== expectedApiUrl) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_SOURCE_CONTEXT_MISMATCH');
  }
  if (!identity
    || contentPayload?.type !== 'file'
    || contentPayload?.encoding !== 'base64'
    || contentPayload?.path !== expected?.path
    || contentPayload?.name !== expected?.path?.split('/').at(-1)
    || contentPayload?.size !== identity?.length) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_SOURCE_PAYLOAD_MALFORMED');
  }
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  const sourceIdentity = workflowSourceIdentity(identity);
  if (contentPayload.sha !== sourceIdentity.blob_sha) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_BLOB_SHA_MISMATCH');
  }
  if (!expected.acceptedSources.some((item) => same(item, {
    blob_sha: sourceIdentity.blob_sha,
    final_byte_sha256: sourceIdentity.final_byte_sha256,
  }))) {
    diagnostics.push('AIGOV_RECOVERY_WORKFLOW_SOURCE_DIGEST_MISMATCH');
  }
  diagnostics.push(...analyzeRecoveryWorkflowSource(identity, expected));
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  return {
    diagnostics: [],
    evidence: freezeEvidence({
      schema_version: 'recovery-workflow-source-evidence.v1',
      repository,
      repository_id: repositoryId,
      workflow_id: expected.workflowId,
      workflow_name: expected.name,
      workflow_path: expected.path,
      workflow_source_commit_sha: commitSha,
      workflow_blob_sha: sourceIdentity.blob_sha,
      workflow_final_byte_sha256: sourceIdentity.final_byte_sha256,
      workflow_source_reference: sourceApiUrl,
      workflow_policy_id: expected.policyId,
      external_trust_authority: expected.externalTrust?.authority || null,
    }, VERIFIED_RECOVERY_WORKFLOW_SOURCES),
  };
}

export function verifyWorkflowDescriptorPayloads({
  repository,
  repositoryId,
  exactHeadSha,
  event,
  expected,
  workflow,
  runs,
  jobs,
  checkRuns,
  allRepositoryRuns = runs,
  expectedRunId = null,
  jobsRunId = null,
}) {
  const diagnostics = [];
  const add = (condition, code) => { if (condition) diagnostics.push(code); };
  add(!repository || !Number.isInteger(repositoryId) || !validSha(exactHeadSha) || !expected, 'AIGOV_CI_CONTEXT_MALFORMED');
  add(!workflow || !Number.isInteger(workflow.id) || workflow.path !== expected?.path || workflow.name !== expected?.name, 'AIGOV_CI_WORKFLOW_DESCRIPTOR_MISMATCH');
  add(!Array.isArray(runs) || !Array.isArray(allRepositoryRuns), 'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  const collisions = allRepositoryRuns.filter((run) => run
    && run.repository?.id === repositoryId
    && run.repository?.full_name === repository
    && run.name === expected.name
    && run.event === event
    && run.head_sha === exactHeadSha
    && (run.workflow_id !== workflow.id || run.path !== expected.path));
  add(collisions.length > 0, 'AIGOV_CI_SAME_NAME_WORKFLOW_COLLISION');
  const malformed = runs.some((run) => !run
    || !Number.isInteger(run.id)
    || !Number.isInteger(run.run_attempt)
    || !run.repository
    || !Number.isInteger(run.repository.id)
    || typeof run.repository.full_name !== 'string'
    || typeof run.path !== 'string'
    || typeof run.name !== 'string'
    || typeof run.event !== 'string'
    || typeof run.head_sha !== 'string');
  add(malformed, 'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED');
  const candidates = runs.filter((run) => run
    && run.repository?.id === repositoryId
    && run.repository?.full_name === repository
    && run.workflow_id === workflow.id
    && run.path === expected.path
    && run.name === expected.name
    && run.event === event
    && run.head_sha === exactHeadSha
    && (expectedRunId == null || run.id === expectedRunId));
  add(candidates.length === 0, 'AIGOV_CI_AUTHORITATIVE_RUN_MISSING');
  add(candidates.length > 1, 'AIGOV_CI_AMBIGUOUS_DUPLICATE_RUNS');
  const run = candidates[0];
  add(Boolean(run) && (run.status !== 'completed' || run.conclusion !== 'success'), 'AIGOV_CI_AUTHORITATIVE_RUN_NOT_SUCCESSFUL');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  add(!Array.isArray(jobs) || !Array.isArray(checkRuns), 'AIGOV_CI_JOB_CHECK_PAYLOAD_MALFORMED');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  if (jobsRunId != null) {
    add(!Number.isInteger(jobsRunId) || jobsRunId !== run.id, 'AIGOV_CI_JOB_SOURCE_RUN_MISMATCH');
  } else if (jobs.length > 0) {
    const declaredRunIds = [...new Set(jobs.map((job) => job?.run_id).filter(Number.isInteger))];
    if (declaredRunIds.length > 0) add(declaredRunIds.length !== 1 || declaredRunIds[0] !== run.id, 'AIGOV_CI_JOB_SOURCE_RUN_MISMATCH');
  }
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  const matchingJobs = jobs.filter((job) => job?.name === expected.checkName);
  add(matchingJobs.length !== 1, matchingJobs.length ? 'AIGOV_CI_AMBIGUOUS_JOB' : 'AIGOV_CI_JOB_MISSING');
  const job = matchingJobs[0];
  add(!job
    || !Number.isInteger(job.id)
    || job.head_sha !== exactHeadSha
    || job.status !== 'completed'
    || job.conclusion !== 'success', 'AIGOV_CI_JOB_DESCRIPTOR_MISMATCH');
  const matchingChecks = checkRuns.filter((check) => check?.id === job?.id);
  add(matchingChecks.length !== 1, matchingChecks.length ? 'AIGOV_CI_AMBIGUOUS_CHECK' : 'AIGOV_CI_CHECK_MISSING');
  const check = matchingChecks[0];
  add(!check
    || check.name !== expected.checkName
    || check.head_sha !== exactHeadSha
    || check.status !== 'completed'
    || check.conclusion !== 'success', 'AIGOV_CI_CHECK_DESCRIPTOR_MISMATCH');
  add(check?.app?.id !== GITHUB_ACTIONS_APP_ID
    || check?.app?.slug !== GITHUB_ACTIONS_APP_SLUG
    || check?.app?.owner?.login !== 'github', 'AIGOV_CI_CHECK_APP_MISMATCH');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  const completedAt = job.completed_at || check.completed_at || run.updated_at || null;
  add(!completedAt || !Number.isFinite(Date.parse(completedAt)), 'AIGOV_CI_COMPLETION_TIME_INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  const descriptor = {
    schema_version: 'aigov-authoritative-check-descriptor.v1',
    repository,
    repository_id: repositoryId,
    workflow_id: workflow.id,
    workflow_path: expected.path,
    workflow_name: expected.name,
    event,
    exact_head_sha: exactHeadSha,
    run_id: run.id,
    run_attempt: run.run_attempt,
    status: run.status,
    conclusion: run.conclusion,
    job_id: job.id,
    check_name: check.name,
    check_head_sha: check.head_sha,
    check_app_id: check.app.id,
    check_app_slug: check.app.slug,
    completed_at: new Date(Date.parse(completedAt)).toISOString(),
  };
  descriptor.descriptor_digest = canonicalSha256(descriptor);
  return { diagnostics: [], evidence: freezeEvidence(descriptor, VERIFIED_RUNS) };
}

export function verifyRecoveryWorkflowDescriptorPayloads({
  source,
  repository,
  repositoryId,
  exactHeadSha,
  event,
  expected,
  runs,
  jobs,
  checkRuns,
  allRepositoryRuns = runs,
  expectedRunId = null,
  jobsRunId = null,
}) {
  if (!isVerifiedRecoveryWorkflowSource(source)
    || !workflowPolicies.has(expected)
    || source.repository !== repository
    || source.repository_id !== repositoryId
    || source.workflow_id !== expected?.workflowId
    || source.workflow_name !== expected?.name
    || source.workflow_path !== expected?.path
    || source.workflow_source_commit_sha !== exactHeadSha
    || event !== expected?.event) {
    return {
      diagnostics: ['AIGOV_RECOVERY_WORKFLOW_SOURCE_CAPABILITY_REQUIRED'],
      evidence: null,
    };
  }
  const verified = verifyWorkflowDescriptorPayloads({
    repository,
    repositoryId,
    exactHeadSha,
    event,
    expected,
    workflow: {
      id: source.workflow_id,
      name: source.workflow_name,
      path: source.workflow_path,
    },
    runs,
    jobs,
    checkRuns,
    allRepositoryRuns,
    expectedRunId,
    jobsRunId,
  });
  if (verified.diagnostics.length || !isVerifiedAuthoritativeRun(verified.evidence)) return verified;
  const descriptor = {
    ...verified.evidence,
    workflow_source_commit_sha: source.workflow_source_commit_sha,
    workflow_blob_sha: source.workflow_blob_sha,
    workflow_final_byte_sha256: source.workflow_final_byte_sha256,
    workflow_source_reference: source.workflow_source_reference,
    workflow_policy_id: source.workflow_policy_id,
    external_trust_authority: source.external_trust_authority,
  };
  delete descriptor.descriptor_digest;
  descriptor.descriptor_digest = canonicalSha256(descriptor);
  return { diagnostics: [], evidence: freezeEvidence(descriptor, VERIFIED_RUNS) };
}

export function aggregateAuthoritativeCi({ exactHeadSha, event, descriptors, requiredPaths }) {
  const diagnostics = [];
  if (!validSha(exactHeadSha) || !Array.isArray(descriptors) || descriptors.some((item) => !isVerifiedAuthoritativeRun(item))) diagnostics.push('AIGOV_CI_UNVERIFIED_DESCRIPTOR');
  const paths = descriptors?.map((item) => item.workflow_path) || [];
  if (new Set(paths).size !== paths.length) diagnostics.push('AIGOV_CI_DUPLICATE_WORKFLOW_DESCRIPTOR');
  const expectedPaths = [...(requiredPaths || [])].sort();
  if (JSON.stringify([...paths].sort()) !== JSON.stringify(expectedPaths)) diagnostics.push('AIGOV_CI_REQUIRED_WORKFLOW_SET_MISMATCH');
  if (descriptors?.some((item) => item.exact_head_sha !== exactHeadSha || item.event !== event)) diagnostics.push('AIGOV_CI_AGGREGATE_CONTEXT_MISMATCH');
  const completed = descriptors?.map((item) => Date.parse(item.completed_at)) || [];
  if (completed.some((item) => !Number.isFinite(item))) diagnostics.push('AIGOV_CI_COMPLETION_TIME_INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  const value = {
    schema_version: 'aigov-authoritative-ci-aggregate.v1',
    exact_head_sha: exactHeadSha,
    event,
    descriptors: Object.freeze([...descriptors]),
    completed_at: new Date(Math.max(...completed)).toISOString(),
  };
  return { diagnostics: [], evidence: freezeEvidence(value, VERIFIED_AGGREGATES) };
}

export function verifyMergeResultPayloads({ pr, reviewedHeadSha, headCommit, mergeCommit, headToMain, mergeToMain }) {
  const diagnostics = [];
  const add = (condition, code) => { if (condition) diagnostics.push(code); };
  add(!pr || pr.number !== 50 || pr.merged !== true || pr.head?.sha !== reviewedHeadSha || !validSha(pr.merge_commit_sha), 'AIGOV_BATCH_B_MERGE_IDENTITY_UNVERIFIED');
  add(!headCommit || headCommit.sha !== reviewedHeadSha || !validSha(headCommit.tree?.sha), 'AIGOV_BATCH_B_REVIEWED_HEAD_TREE_UNVERIFIED');
  add(!mergeCommit || mergeCommit.sha !== pr?.merge_commit_sha || !validSha(mergeCommit.tree?.sha) || !Array.isArray(mergeCommit.parents), 'AIGOV_BATCH_B_MERGE_COMMIT_UNVERIFIED');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  const parents = mergeCommit.parents.map((item) => item.sha);
  const exactTree = headCommit.tree.sha === mergeCommit.tree.sha;
  let mergeMethod = 'unknown';
  let methodProof = false;
  if (parents.includes(reviewedHeadSha)) {
    mergeMethod = 'merge';
    methodProof = ['ahead', 'identical'].includes(headToMain?.status);
  } else if (parents.length === 1 && exactTree && parents[0] === pr.base?.sha) {
    mergeMethod = 'squash';
    methodProof = true;
  } else if (parents.length === 1 && exactTree) {
    mergeMethod = 'rebase';
    methodProof = true;
  }
  add(!methodProof || mergeMethod === 'unknown', 'AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
  add(!['ahead', 'identical'].includes(mergeToMain?.status), 'AIGOV_BATCH_B_CURRENT_MAIN_MISSING_MERGE_RESULT');
  add(!pr.merged_at || !Number.isFinite(Date.parse(pr.merged_at)), 'AIGOV_BATCH_B_MERGE_TIME_INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  return {
    diagnostics: [],
    evidence: freezeEvidence({
      schema_version: 'aigov-merge-result-evidence.v1',
      merge_method: mergeMethod,
      reviewed_head_sha: reviewedHeadSha,
      reviewed_head_tree_sha: headCommit.tree.sha,
      merge_commit_sha: mergeCommit.sha,
      merge_result_tree_sha: mergeCommit.tree.sha,
      merge_actor: pr.merged_by?.login || null,
      merged_at: new Date(Date.parse(pr.merged_at)).toISOString(),
      current_main_contains_merge_result: true,
      method_aware_verified: true,
    }, VERIFIED_MERGES),
  };
}

export function verifyCurrentMainExecution({ beforeSha, afterSha, eventHeadSha, descriptor }) {
  const diagnostics = [];
  if (!validSha(beforeSha) || beforeSha !== afterSha || beforeSha !== eventHeadSha) diagnostics.push('AIGOV_BATCH_B_CURRENT_MAIN_MOVED');
  if (!isVerifiedAuthoritativeRun(descriptor)
    || descriptor.workflow_path !== AUTHORITATIVE_WORKFLOWS.main.path
    || descriptor.event !== 'push'
    || descriptor.exact_head_sha !== beforeSha
    || descriptor.check_name !== AUTHORITATIVE_WORKFLOWS.main.checkName) diagnostics.push('AIGOV_BATCH_B_CURRENT_MAIN_VALIDATION_UNVERIFIED');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  return {
    diagnostics: [],
    evidence: freezeEvidence({ schema_version: 'aigov-current-main-evidence.v1', current_main_sha: beforeSha, validation: descriptor, green: true }, VERIFIED_CURRENT_MAIN),
  };
}

function rulesetEvidence(payload) {
  const checks = [];
  const bypass = [];
  let strict = false;
  for (const ruleset of Array.isArray(payload) ? payload : []) {
    if (ruleset?.enforcement !== 'active') continue;
    bypass.push(...(ruleset.bypass_actors || []));
    for (const rule of ruleset.rules || []) {
      if (rule?.type !== 'required_status_checks') continue;
      strict ||= rule.parameters?.strict_required_status_checks_policy === true;
      for (const item of rule.parameters?.required_status_checks || []) checks.push({ context: item.context, app_id: item.integration_id ?? item.app_id ?? null });
    }
  }
  return { checks, bypass, strict };
}

export function verifyRepositoryEnforcementPayloads({ branchProtection, rulesets, requiredChecks }) {
  const diagnostics = [];
  const branchAvailable = Boolean(branchProtection && branchProtection.__unavailable !== true);
  const rulesetAvailable = Array.isArray(rulesets);
  if (!branchAvailable && !rulesetAvailable) diagnostics.push('AIGOV_BATCH_B_REQUIRED_CHECK_CONFIGURATION_UNVERIFIED');
  const bpChecks = branchAvailable ? (branchProtection.required_status_checks?.checks || []) : [];
  const bpStrict = branchAvailable && branchProtection.required_status_checks?.strict === true;
  const bpAdminEnforced = branchAvailable && branchProtection.enforce_admins?.enabled === true;
  const rs = rulesetEvidence(rulesets);
  const checks = [...bpChecks.map((item) => ({ context: item.context, app_id: item.app_id ?? null })), ...rs.checks];
  for (const required of requiredChecks || []) {
    if (!checks.some((item) => item.context === required.context && item.app_id === required.appId)) diagnostics.push(`AIGOV_BATCH_B_REQUIRED_CHECK_MISSING:${required.context}`);
  }
  if (!(bpStrict || rs.strict)) diagnostics.push('AIGOV_BATCH_B_STALE_CHECK_POLICY_UNVERIFIED');
  if (branchAvailable && !bpAdminEnforced) diagnostics.push('AIGOV_BATCH_B_ADMIN_BYPASS_UNVERIFIED');
  if (rs.bypass.length) diagnostics.push('AIGOV_BATCH_B_BYPASS_ACTORS_PRESENT');
  const status = diagnostics.length ? 'unverified' : 'verified';
  return {
    diagnostics: unique(diagnostics),
    evidence: freezeEvidence({
      schema_version: 'aigov-repository-enforcement-evidence.v1',
      status,
      required_check_configuration: status,
      repository_settings_enforced: status === 'verified' ? 'verified' : 'not_claimed',
      checks,
      strict_stale_check_policy: bpStrict || rs.strict,
      admin_enforcement: bpAdminEnforced,
      bypass_actors: rs.bypass,
    }, VERIFIED_ENFORCEMENT),
  };
}
