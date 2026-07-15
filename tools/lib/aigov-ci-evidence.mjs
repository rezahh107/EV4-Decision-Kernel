import { canonicalSha256 } from './aigov-lifecycle.mjs';

export const GITHUB_ACTIONS_PRODUCER = { app_id: 15368, slug: 'github-actions', name: 'GitHub Actions', owner: 'github' };
export const REQUIRED_WORKFLOW = { name: 'Validate MVK', path: '.github/workflows/validate-mvk.yml' };
export const REQUIRED_JOBS = ['External Coverage Trust Gate / Verify authoritative Coverage trust identity', 'MVK and roadmap regressions', 'Validate MVK'];
export const REQUIRED_ARTIFACT = 'aigov-batch-a-scope-disclosure';

function iso(value) {
  const time = Date.parse(value || '');
  return Number.isFinite(time) ? new Date(time).toISOString() : null;
}

function digestProjection(identity) {
  if (!identity || typeof identity !== 'object' || Array.isArray(identity)) return {};
  const copy = structuredClone(identity);
  delete copy.identity_digest;
  delete copy.observed_at;
  return copy;
}

export function ciIdentityDigest(identity) {
  return canonicalSha256(digestProjection(identity));
}

export function verifyCiPayloads({ repository, repositoryId, prNumber, headSha, workflowRun, jobs, checkRuns, artifacts, observedAt }) {
  const diagnostics = [];
  const fail = (condition, code) => { if (condition) diagnostics.push(code); };
  fail(workflowRun?.repository?.id !== repositoryId || workflowRun?.repository?.full_name !== repository, 'AIGOV_CI_REPOSITORY_MISMATCH');
  fail(workflowRun?.head_repository?.id !== repositoryId || workflowRun?.head_repository?.full_name !== repository, 'AIGOV_CI_HEAD_REPOSITORY_MISMATCH');
  fail(workflowRun?.name !== REQUIRED_WORKFLOW.name || workflowRun?.path !== REQUIRED_WORKFLOW.path || !Number.isInteger(workflowRun?.workflow_id), 'AIGOV_CI_WORKFLOW_IDENTITY_MISSING');
  fail(workflowRun?.event !== 'pull_request' || workflowRun?.head_sha !== headSha, 'AIGOV_CI_TESTED_SHA_MISMATCH');
  fail(/refs\/pull\/\d+\/merge|\/merge$/.test(workflowRun?.head_branch || '') || workflowRun?.head_sha !== headSha, 'AIGOV_CI_SYNTHETIC_MERGE_REF');
  fail(workflowRun?.status !== 'completed' || workflowRun?.conclusion !== 'success', 'AIGOV_CI_NOT_SUCCESSFUL');
  const pr = (workflowRun?.pull_requests || []).find((item) => item?.number === prNumber);
  fail(!pr || pr?.head?.sha !== headSha || pr?.base?.ref !== 'main', 'AIGOV_CI_PR_IDENTITY_MISMATCH');
  fail(!Number.isInteger(workflowRun?.id) || !workflowRun?.html_url || !workflowRun?.jobs_url || !workflowRun?.artifacts_url, 'AIGOV_CI_RUN_IDENTITY_MISSING');

  const checkById = new Map((checkRuns || []).map((item) => [item.id, item]));
  const normalizedJobs = [];
  for (const requiredName of REQUIRED_JOBS) {
    const job = (jobs || []).find((item) => item.name === requiredName);
    if (!job) { diagnostics.push(`AIGOV_CI_JOB_IDENTITY_MISSING:${requiredName}`); continue; }
    const check = checkById.get(job.id);
    fail(job.head_sha !== headSha || job.status !== 'completed' || job.conclusion !== 'success' || !Number.isInteger(job.id) || !job.check_run_url, `AIGOV_CI_JOB_UNVERIFIED:${requiredName}`);
    fail(!check || check.head_sha !== headSha || check.status !== 'completed' || check.conclusion !== 'success' || check.details_url !== job.html_url, `AIGOV_CI_CHECK_UNVERIFIED:${requiredName}`);
    const producer = check?.app;
    fail(producer?.id !== GITHUB_ACTIONS_PRODUCER.app_id || producer?.slug !== GITHUB_ACTIONS_PRODUCER.slug || producer?.name !== GITHUB_ACTIONS_PRODUCER.name || producer?.owner?.login !== GITHUB_ACTIONS_PRODUCER.owner, `AIGOV_CI_CHECK_PRODUCER_MISMATCH:${requiredName}`);
    normalizedJobs.push({
      job_id: job.id,
      name: job.name,
      check_run_url: job.check_run_url,
      html_url: job.html_url,
      started_at: iso(job.started_at),
      completed_at: iso(job.completed_at),
      conclusion: job.conclusion,
      check_external_id: check?.external_id || null,
    });
  }

  const artifact = (artifacts || []).find((item) => item.name === REQUIRED_ARTIFACT);
  fail(!artifact || !Number.isInteger(artifact.id) || artifact.expired !== false || !/^sha256:[0-9a-f]{64}$/.test(artifact.digest || ''), 'AIGOV_CI_ARTIFACT_IDENTITY_MISSING');
  fail(artifact?.workflow_run?.id !== workflowRun?.id || artifact?.workflow_run?.head_sha !== headSha || artifact?.workflow_run?.head_repository_id !== repositoryId, 'AIGOV_CI_ARTIFACT_RUN_MISMATCH');
  const completionTimes = normalizedJobs.map((item) => Date.parse(item.completed_at || '')).filter(Number.isFinite);
  const completedAt = completionTimes.length === REQUIRED_JOBS.length ? new Date(Math.max(...completionTimes)).toISOString() : null;
  fail(!completedAt || Date.parse(completedAt) > Date.parse(workflowRun?.updated_at || ''), 'AIGOV_CI_COMPLETION_TIME_UNVERIFIED');
  if (diagnostics.length) return { diagnostics: [...new Set(diagnostics)], identity: null };

  const identity = {
    schema_version: 'aigov-ci-identity.v1',
    identity_digest: '',
    repository,
    repository_id: repositoryId,
    pr_number: prNumber,
    tested_sha: headSha,
    tested_ref_type: 'pull_request_head',
    synthetic_merge: false,
    workflow: { workflow_id: workflowRun.workflow_id, name: workflowRun.name, path: workflowRun.path },
    run: {
      run_id: workflowRun.id,
      run_attempt: workflowRun.run_attempt,
      event: workflowRun.event,
      head_branch: workflowRun.head_branch,
      html_url: workflowRun.html_url,
      api_url: workflowRun.url,
      conclusion: workflowRun.conclusion,
      created_at: iso(workflowRun.created_at),
      updated_at: iso(workflowRun.updated_at),
    },
    jobs: normalizedJobs.sort((a, b) => a.job_id - b.job_id),
    check_producer: GITHUB_ACTIONS_PRODUCER,
    artifacts: [{
      artifact_id: artifact.id,
      name: artifact.name,
      api_url: artifact.url,
      archive_download_url: artifact.archive_download_url,
      digest: artifact.digest,
      created_at: iso(artifact.created_at),
      expires_at: iso(artifact.expires_at),
    }],
    completed_at: completedAt,
    evidence_source: 'github_rest_api_https',
    observed_at: iso(observedAt) || new Date().toISOString(),
  };
  identity.identity_digest = ciIdentityDigest(identity);
  return { diagnostics: [], identity };
}

export function validateCiIdentity(identity, context) {
  const diagnostics = [];
  if (identity?.identity_digest !== ciIdentityDigest(identity || {})) diagnostics.push('AIGOV_CI_IDENTITY_DIGEST_MISMATCH');
  if (identity?.repository !== context.repository || identity?.repository_id !== context.repositoryId || identity?.pr_number !== context.prNumber || identity?.tested_sha !== context.headSha) diagnostics.push('AIGOV_CI_IDENTITY_CONTEXT_MISMATCH');
  if (identity?.tested_ref_type !== 'pull_request_head' || identity?.synthetic_merge !== false || identity?.run?.event !== 'pull_request') diagnostics.push('AIGOV_CI_SYNTHETIC_MERGE_REF');
  if (identity?.run?.conclusion !== 'success' || !identity?.completed_at || identity?.evidence_source !== 'github_rest_api_https') diagnostics.push('AIGOV_CI_IDENTITY_UNVERIFIED');
  if (identity?.check_producer?.app_id !== GITHUB_ACTIONS_PRODUCER.app_id || identity?.check_producer?.slug !== GITHUB_ACTIONS_PRODUCER.slug) diagnostics.push('AIGOV_CI_CHECK_PRODUCER_MISMATCH');
  return diagnostics;
}

export async function fetchExactHeadCiIdentity({ githubJson, repository, repositoryId, prNumber, headSha }) {
  const runsResult = await githubJson(`/repos/${repository}/actions/runs?head_sha=${headSha}&event=pull_request&status=completed&per_page=100`);
  const candidates = (runsResult.value?.workflow_runs || []).filter((run) => run.name === REQUIRED_WORKFLOW.name && run.path === REQUIRED_WORKFLOW.path && run.head_sha === headSha && run.conclusion === 'success');
  candidates.sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  const errors = [];
  for (const workflowRun of candidates) {
    try {
      const [jobsResult, artifactsResult] = await Promise.all([
        githubJson(`/repos/${repository}/actions/runs/${workflowRun.id}/jobs?filter=latest&per_page=100`),
        githubJson(`/repos/${repository}/actions/runs/${workflowRun.id}/artifacts?per_page=100`),
      ]);
      const jobs = jobsResult.value?.jobs || [];
      const checkResults = await Promise.all(jobs.map((job) => githubJson(`/repos/${repository}/check-runs/${job.id}`)));
      const verified = verifyCiPayloads({ repository, repositoryId, prNumber, headSha, workflowRun, jobs, checkRuns: checkResults.map((item) => item.value), artifacts: artifactsResult.value?.artifacts || [], observedAt: runsResult.observedAt });
      if (!verified.diagnostics.length) return { ...verified, workflowRun, jobs, checkRuns: checkResults.map((item) => item.value), artifacts: artifactsResult.value?.artifacts || [] };
      errors.push(...verified.diagnostics.map((item) => `${workflowRun.id}:${item}`));
    } catch (error) {
      errors.push(`${workflowRun.id}:${error.message}`);
    }
  }
  throw new Error(`AIGOV_CI_AUTHORITATIVE_IDENTITY_UNAVAILABLE:${errors.join(',') || 'no exact-head successful run'}`);
}
