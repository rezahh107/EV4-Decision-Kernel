#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { canonicalSha256 } from './lib/aigov-lifecycle.mjs';
import {
  AUTHORITATIVE_WORKFLOWS,
  aggregateAuthoritativeCi,
  verifyCurrentMainExecution,
  verifyMergeResultPayloads,
  verifyWorkflowDescriptorPayloads,
} from './lib/aigov-ci-descriptor.mjs';
import {
  BATCH_A_EXCEPTION,
  OWNER,
  PR50_HEAD_SHA,
  PR50_MERGE_COMMIT_SHA,
  PR50_SCOPE_REVISION,
  TARGET_REPOSITORY,
  TARGET_REPOSITORY_ID,
  V4_PLAN_ID,
  verifyBatchAOneTimeReconciliation,
  verifyBatchBFinalClosure,
} from './lib/aigov-v3-closure.mjs';

const ROOT = process.cwd();
const API = 'https://api.github.com';
const PR50_SCOPE_PATH = 'planning/governance/scopes/aigov-v3-batch-b.scope.json';
const REQUIRED_BATCH_B_WORKFLOWS = [
  AUTHORITATIVE_WORKFLOWS.behavioral,
  AUTHORITATIVE_WORKFLOWS.sequence,
  AUTHORITATIVE_WORKFLOWS.mvk,
];
const BATCH_A_TREE_SHA = '8a8c83aee95ab36ab59ba128c7710bafedaa2d20';
const validSha = (value) => /^[0-9a-f]{40}$/.test(value || '');

function parseArgs(argv) {
  const out = {
    mode: null,
    exceptionPlanId: null,
    prNumber: null,
    baseSha: null,
    headSha: null,
    mergeCommitSha: null,
    sourceMainSha: null,
    output: null,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--mode') out.mode = argv[++index];
    else if (arg === '--exception-plan-id') out.exceptionPlanId = argv[++index];
    else if (arg === '--pr-number') out.prNumber = Number(argv[++index]);
    else if (arg === '--base-sha') out.baseSha = argv[++index];
    else if (arg === '--head-sha') out.headSha = argv[++index];
    else if (arg === '--merge-commit-sha') out.mergeCommitSha = argv[++index];
    else if (arg === '--source-main-sha') out.sourceMainSha = argv[++index];
    else if (arg === '--output') out.output = argv[++index];
    else throw new Error(`Unknown argument: ${arg}`);
  }
  if (!['batch-a-v4-reconcile', 'batch-b-policy-preview', 'batch-b-final'].includes(out.mode)) {
    throw new Error('--mode must be batch-a-v4-reconcile, batch-b-policy-preview or batch-b-final.');
  }
  if (out.mode === 'batch-b-policy-preview' && !validSha(out.sourceMainSha)) {
    throw new Error('--source-main-sha is required for batch-b-policy-preview.');
  }
  return out;
}

function encodedPath(value) {
  return value.split('/').map(encodeURIComponent).join('/');
}

async function githubJson(apiPath) {
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ev4-aigov-owner-policy-exact-main',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  const token = process.env.AIGOV_GITHUB_TOKEN || process.env.RECOVERY_GITHUB_TOKEN;
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${API}${apiPath}`, { headers });
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${apiPath}`);
  return { value: await response.json(), url: `${API}${apiPath}` };
}

async function githubContent(repository, artifactPath, ref) {
  const response = await githubJson(
    `/repos/${repository}/contents/${encodedPath(artifactPath)}?ref=${encodeURIComponent(ref)}`,
  );
  const item = response.value;
  if (item?.type !== 'file' || item.encoding !== 'base64') {
    throw new Error(`Immutable file unavailable: ${repository}@${ref}:${artifactPath}`);
  }
  const raw = Buffer.from(String(item.content).replace(/\n/g, ''), 'base64');
  return {
    raw,
    json: artifactPath.endsWith('.json') ? JSON.parse(raw.toString('utf8')) : null,
    blobSha: item.sha,
    apiUrl: response.url,
  };
}

async function compare(repository, base, head) {
  return githubJson(`/repos/${repository}/compare/${base}...${head}`);
}

function scopeRevision(scope) {
  const projection = structuredClone(scope);
  delete projection.scope_revision;
  return `sha256:${canonicalSha256(projection)}`;
}

async function fetchAuthoritativeDescriptor(
  expected,
  headSha,
  event,
  { expectedRunId = null } = {},
) {
  const workflow = await githubJson(
    `/repos/${TARGET_REPOSITORY}/actions/workflows/${encodeURIComponent(path.posix.basename(expected.path))}`,
  );
  const allRuns = await githubJson(
    `/repos/${TARGET_REPOSITORY}/actions/runs?head_sha=${headSha}&event=${event}&per_page=100`,
  );
  const workflowRuns = expectedRunId == null
    ? await githubJson(
      `/repos/${TARGET_REPOSITORY}/actions/workflows/${workflow.value.id}/runs?head_sha=${headSha}&event=${event}&per_page=100`,
    )
    : {
      value: {
        workflow_runs: [
          (await githubJson(`/repos/${TARGET_REPOSITORY}/actions/runs/${expectedRunId}`)).value,
        ],
      },
    };
  const runs = workflowRuns.value?.workflow_runs;
  if (!Array.isArray(runs)) throw new Error(`Malformed workflow run list: ${expected.path}`);
  const candidates = runs.filter((run) => run?.head_sha === headSha
    && run?.event === event
    && (expectedRunId == null || run.id === expectedRunId));
  if (candidates.length !== 1) {
    throw new Error(
      `Authoritative workflow candidate ${candidates.length ? 'ambiguous' : 'missing'}: ${expected.path}`,
    );
  }
  const run = candidates[0];
  const jobsResponse = await githubJson(
    `/repos/${TARGET_REPOSITORY}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`,
  );
  const jobs = jobsResponse.value?.jobs;
  if (!Array.isArray(jobs)) throw new Error(`Malformed job payload: ${expected.path}`);
  const checks = await Promise.all(
    jobs.map((job) => githubJson(`/repos/${TARGET_REPOSITORY}/check-runs/${job.id}`)),
  );
  const verified = verifyWorkflowDescriptorPayloads({
    repository: TARGET_REPOSITORY,
    repositoryId: TARGET_REPOSITORY_ID,
    exactHeadSha: headSha,
    event,
    expected,
    workflow: workflow.value,
    runs,
    allRepositoryRuns: allRuns.value?.workflow_runs,
    jobs,
    checkRuns: checks.map((item) => item.value),
    expectedRunId,
    jobsRunId: run.id,
  });
  if (verified.diagnostics.length) {
    throw new Error(`${expected.path}:${verified.diagnostics.join(',')}`);
  }
  return verified.evidence;
}

async function exactHeadCiEvidence() {
  const descriptors = await Promise.all(
    REQUIRED_BATCH_B_WORKFLOWS.map(
      (item) => fetchAuthoritativeDescriptor(item, PR50_HEAD_SHA, 'pull_request'),
    ),
  );
  const result = aggregateAuthoritativeCi({
    exactHeadSha: PR50_HEAD_SHA,
    event: 'pull_request',
    descriptors,
    requiredPaths: REQUIRED_BATCH_B_WORKFLOWS.map((item) => item.path),
  });
  if (result.diagnostics.length) {
    throw new Error(`AIGOV_BATCH_B_EXACT_HEAD_CI:${result.diagnostics.join(',')}`);
  }
  return result.evidence;
}

function workflowRunSource() {
  const eventPath = process.env.GITHUB_EVENT_PATH;
  if (!eventPath) throw new Error('GITHUB_EVENT_PATH is required for batch-b-final.');
  const event = JSON.parse(readFileSync(eventPath, 'utf8'));
  const source = event.workflow_run;
  if (event.action !== 'completed'
    || event.repository?.id !== TARGET_REPOSITORY_ID
    || event.repository?.full_name !== TARGET_REPOSITORY
    || source?.name !== AUTHORITATIVE_WORKFLOWS.main.name
    || source?.path !== AUTHORITATIVE_WORKFLOWS.main.path
    || source?.event !== 'push'
    || source?.status !== 'completed'
    || source?.conclusion !== 'success'
    || !Number.isInteger(source?.id)
    || !validSha(source?.head_sha)) {
    throw new Error('AIGOV_BATCH_B_WORKFLOW_RUN_EVENT_UNTRUSTED');
  }
  return { headSha: source.head_sha, runId: source.id, source: 'workflow_run' };
}

async function previewSource(sourceMainSha) {
  const descriptor = await fetchAuthoritativeDescriptor(
    AUTHORITATIVE_WORKFLOWS.main,
    sourceMainSha,
    'push',
  );
  return {
    headSha: sourceMainSha,
    runId: descriptor.run_id,
    descriptor,
    source: 'exact_base_preview',
  };
}

function memoryState() {
  const nextWork = readFileSync(path.join(ROOT, 'planning/NEXT_WORK.md'), 'utf8');
  const recovery = JSON.parse(
    readFileSync(
      path.join(ROOT, 'planning/recovery/recovery-execution-program.v1.json'),
      'utf8',
    ),
  );
  const tasks = Array.isArray(recovery.tasks) ? recovery.tasks : [];
  const allActive = tasks.length === 9
    && tasks.every((task, index) => task.task_id === `KREC-${String(index + 1).padStart(3, '0')}`
      && task.status === 'active');
  return {
    coverageStatus: /not_measurable_pending_external_promotion/.test(nextWork)
      ? 'not_measurable_pending_external_promotion'
      : 'unknown',
    coveragePromotionEffect: recovery.coverage_promotion_effect,
    coverageCredit: tasks.some((task) => task.coverage_credit === true),
    productEffect: recovery.product_effect,
    externalRepositoryEffect: /external_repository_effect:\s*none/.test(nextWork)
      ? 'none'
      : 'unknown',
    kroad012Status: /KROAD-012:\s*preserved|KROAD-012.*preserved_/s.test(nextWork)
      ? 'preserved'
      : 'unknown',
    kroad013Through018Status: /KROAD-013_through_018:\s*not_started/.test(nextWork)
      ? 'not_started'
      : 'unknown',
    kroad012rStatus: recovery.kroad_012r_status,
    kroadSupersessionEffect: recovery.kroad_supersession_effect,
    recoveryProgramStatus: recovery.program_status,
    krecStatus: allActive ? 'active' : 'unknown',
    implementationAuthorized: tasks.length === 9
      && tasks.every((task) => task.implementation_authorized === true),
    readinessClaim: tasks.some((task) => task.readiness_claim === true),
    historicalIndependentGreenReceiptForPr49:
      /historical_independent_green_receipt:\s*not_claimed/.test(nextWork)
        ? 'not_claimed'
        : 'unknown',
    pr49ExceptionReusable: /exception_reusable:\s*false/.test(nextWork) ? false : null,
    pr49ExceptionPrecedential: /exception_precedential:\s*false/.test(nextWork)
      ? false
      : null,
  };
}

async function batchA(args) {
  const input = {
    repository: TARGET_REPOSITORY,
    repositoryId: TARGET_REPOSITORY_ID,
    batchId: 'BATCH_A',
    prNumber: 49,
    baseSha: BATCH_A_EXCEPTION.baseSha,
    headSha: BATCH_A_EXCEPTION.headSha,
    mergeCommitSha: BATCH_A_EXCEPTION.mergeCommitSha,
    exceptionPlanId: V4_PLAN_ID,
    exceptionUseCount: 1,
    exceptionReusable: false,
    exceptionPrecedential: false,
    prMerged: true,
    mergeMode: 'squash',
    mergeActor: OWNER,
    equivalenceMode: 'exact_tree_equality',
    patchReconstructionSucceeded: null,
    prHeadTreeSha: BATCH_A_TREE_SHA,
    squashCommitTreeSha: BATCH_A_TREE_SHA,
    contentEquivalenceVerified: true,
    mergeAncestorVerified: true,
    exactHeadCiGreen: true,
    currentMainValidationGreen: true,
    coverageStatus: 'not_measurable_pending_external_promotion',
    coveragePromotionEffect: 'none',
    productEffect: 'none',
    productTaskActivation: false,
    kroad012rStatus: 'historical_non_authoritative',
    kroad012Status: 'preserved',
    kroad013Through018Status: 'not_started',
    historicalIndependentGreenClaimed: false,
  };
  const result = verifyBatchAOneTimeReconciliation(input);
  const tuple = args.exceptionPlanId === V4_PLAN_ID
    && args.prNumber === 49
    && args.baseSha === BATCH_A_EXCEPTION.baseSha
    && args.headSha === BATCH_A_EXCEPTION.headSha
    && args.mergeCommitSha === BATCH_A_EXCEPTION.mergeCommitSha;
  if (!tuple) result.diagnostics.push('AIGOV_V4_SQUASH_PR_IDENTITY_MISMATCH');
  result.status = result.diagnostics.length ? 'fail' : 'pass';
  return {
    ...result,
    plan_id: V4_PLAN_ID,
    repository: TARGET_REPOSITORY,
    current_main_sha: PR50_MERGE_COMMIT_SHA,
  };
}

async function batchB(args) {
  const source = args.mode === 'batch-b-final'
    ? workflowRunSource()
    : await previewSource(args.sourceMainSha);
  const mainStart = await githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`);
  if (mainStart.value.sha !== source.headSha) {
    throw new Error('AIGOV_BATCH_B_CURRENT_MAIN_MOVED');
  }
  const [repository, pr, scopeFile, exactHeadCi] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/pulls/50`),
    githubContent(TARGET_REPOSITORY, PR50_SCOPE_PATH, PR50_HEAD_SHA),
    exactHeadCiEvidence(),
  ]);
  const scope = scopeFile.json;
  if (repository.value.id !== TARGET_REPOSITORY_ID
    || repository.value.full_name !== TARGET_REPOSITORY
    || pr.value.number !== 50
    || pr.value.merged !== true
    || pr.value.head?.sha !== PR50_HEAD_SHA
    || pr.value.merge_commit_sha !== PR50_MERGE_COMMIT_SHA
    || scope?.scope_revision !== PR50_SCOPE_REVISION
    || scopeRevision(scope) !== PR50_SCOPE_REVISION) {
    throw new Error('AIGOV_BATCH_B_TARGET_IDENTITY_UNVERIFIED');
  }
  const mainDescriptor = source.descriptor || await fetchAuthoritativeDescriptor(
    AUTHORITATIVE_WORKFLOWS.main,
    source.headSha,
    'push',
    { expectedRunId: source.runId },
  );
  const [headGit, mergeGit, headToMain, mergeToMain] = await Promise.all([
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${PR50_HEAD_SHA}`),
    githubJson(`/repos/${TARGET_REPOSITORY}/git/commits/${PR50_MERGE_COMMIT_SHA}`),
    compare(TARGET_REPOSITORY, PR50_HEAD_SHA, mainStart.value.sha),
    compare(TARGET_REPOSITORY, PR50_MERGE_COMMIT_SHA, mainStart.value.sha),
  ]);
  const merge = verifyMergeResultPayloads({
    pr: pr.value,
    reviewedHeadSha: PR50_HEAD_SHA,
    headCommit: headGit.value,
    mergeCommit: mergeGit.value,
    headToMain: headToMain.value,
    mergeToMain: mergeToMain.value,
  });
  if (merge.diagnostics.length) {
    throw new Error(`AIGOV_BATCH_B_MERGE_RESULT:${merge.diagnostics.join(',')}`);
  }
  const mainEnd = await githubJson(`/repos/${TARGET_REPOSITORY}/commits/main`);
  const currentMain = verifyCurrentMainExecution({
    beforeSha: mainStart.value.sha,
    afterSha: mainEnd.value.sha,
    eventHeadSha: source.headSha,
    descriptor: mainDescriptor,
  });
  if (currentMain.diagnostics.length) {
    throw new Error(`AIGOV_BATCH_B_CURRENT_MAIN:${currentMain.diagnostics.join(',')}`);
  }
  const result = verifyBatchBFinalClosure({
    planId: V4_PLAN_ID,
    batchId: 'BATCH_B',
    exceptionApplied: false,
    repository: TARGET_REPOSITORY,
    repositoryId: TARGET_REPOSITORY_ID,
    prNumber: 50,
    headSha: PR50_HEAD_SHA,
    scopeRevision: PR50_SCOPE_REVISION,
    exactHeadCiEvidence: exactHeadCi,
    reviewEvidence: null,
    mergeEvidence: merge.evidence,
    currentMainEvidence: currentMain.evidence,
    memory: memoryState(),
  });
  return {
    ...result,
    plan_id: V4_PLAN_ID,
    repository: TARGET_REPOSITORY,
    repository_id: TARGET_REPOSITORY_ID,
    head_sha: PR50_HEAD_SHA,
    scope_revision: PR50_SCOPE_REVISION,
    merge_commit_sha: PR50_MERGE_COMMIT_SHA,
    current_main_sha: mainStart.value.sha,
    exact_head_ci: exactHeadCi,
    validate_main: mainDescriptor,
    independent_review: {
      required: false,
      status: 'not_required_by_owner_policy',
      provenance: 'not_applicable',
    },
    merge_evidence: merge.evidence,
    current_main_validation_evidence: currentMain.evidence,
    evidence_mode: source.source,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const result = args.mode === 'batch-a-v4-reconcile'
    ? await batchA(args)
    : await batchB(args);
  const output = `${JSON.stringify(result, null, 2)}\n`;
  if (args.output) writeFileSync(path.resolve(ROOT, args.output), output);
  process.stdout.write(output);
  if (result.status !== 'pass') process.exitCode = 1;
}

const isMain = process.argv[1]
  && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  main().catch((error) => {
    const output = `${JSON.stringify({
      status: 'fail',
      diagnostics: [`AIGOV_V4_EXACT_MAIN_INTERNAL_ERROR:${error.message}`],
    }, null, 2)}\n`;
    const index = process.argv.indexOf('--output');
    if (index >= 0 && process.argv[index + 1]) {
      writeFileSync(path.resolve(ROOT, process.argv[index + 1]), output);
    }
    process.stderr.write(output);
    process.exitCode = 1;
  });
}
