import crypto from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import { canonicalSha256, sha256 } from './aigov-lifecycle.mjs';

export const SEQUENCE_CONTEXT = 'Validate rereview sequence enforcement';
export const SEQUENCE_WORKFLOW = { name: SEQUENCE_CONTEXT, path: '.github/workflows/validate-rereview-sequence.yml' };
export const SEQUENCE_APP_ID = 15368;
export const SEQUENCE_ARTIFACT = 'aigov-rereview-sequence-producer';
export const INSPECTOR_COMMIT = '7a21045366bb9ad1ca2f950b8341ebb867dd8a52';
export const VALIDATOR_FRAGMENT = 'scripts/validate_rereview_sequence.py';

function withoutDigest(identity) {
  const value = structuredClone(identity || {});
  delete value.identity_digest;
  delete value.observed_at;
  return value;
}

export function sequenceProducerDigest(identity) {
  return canonicalSha256(withoutDigest(identity));
}

export function validateSequenceProducerIdentity(identity, context) {
  const diagnostics = [];
  if (identity?.identity_digest !== sequenceProducerDigest(identity || {})) diagnostics.push('AIGOV_SEQUENCE_PRODUCER_DIGEST_MISMATCH');
  if (identity?.repository !== context.repository || identity?.repository_id !== context.repositoryId || identity?.pr_number !== context.prNumber || identity?.exact_head_sha !== context.headSha || identity?.scope_revision !== context.scopeRevision) diagnostics.push('AIGOV_SEQUENCE_PRODUCER_CONTEXT_MISMATCH');
  if (identity?.check_context !== SEQUENCE_CONTEXT || identity?.app_id !== SEQUENCE_APP_ID || identity?.workflow?.path !== SEQUENCE_WORKFLOW.path || identity?.workflow?.commit_sha !== context.headSha) diagnostics.push('AIGOV_SEQUENCE_PRODUCER_IDENTITY_UNVERIFIED');
  if (identity?.required_check_configuration !== 'not_verified_external_administrative_action' || identity?.repository_settings_enforced !== 'not_claimed') diagnostics.push('AIGOV_SEQUENCE_REPOSITORY_SETTINGS_OVERCLAIM');
  return diagnostics;
}

function gitBlobSha(raw) {
  return crypto.createHash('sha1').update(Buffer.from(`blob ${raw.length}\0`)).update(raw).digest('hex');
}

function workflowDiagnostics(workflowFile, headSha) {
  const diagnostics = [];
  let raw;
  try { raw = Buffer.from(String(workflowFile?.content || '').replace(/\n/g, ''), 'base64'); } catch { raw = null; }
  if (!raw?.length || workflowFile?.type !== 'file' || workflowFile?.path !== SEQUENCE_WORKFLOW.path) diagnostics.push('AIGOV_SEQUENCE_WORKFLOW_PATH_UNVERIFIED');
  if (raw && workflowFile?.sha !== gitBlobSha(raw)) diagnostics.push('AIGOV_SEQUENCE_WORKFLOW_BLOB_MISMATCH');
  let workflow;
  try { workflow = parseYaml(raw?.toString('utf8') || ''); } catch { diagnostics.push('AIGOV_SEQUENCE_WORKFLOW_YAML_INVALID'); }
  if (workflow?.name !== SEQUENCE_WORKFLOW.name || !Object.hasOwn(workflow?.on || {}, 'pull_request')) diagnostics.push('AIGOV_SEQUENCE_CHECK_CONTEXT_UNVERIFIED');
  const rootPermissions = workflow?.permissions;
  if (!rootPermissions || JSON.stringify(rootPermissions) !== JSON.stringify({ contents: 'read' })) diagnostics.push('AIGOV_SEQUENCE_PERMISSIONS_NOT_MINIMUM');
  const jobs = Object.values(workflow?.jobs || {});
  const job = jobs.find((item) => item?.name === SEQUENCE_CONTEXT);
  if (!job) diagnostics.push('AIGOV_SEQUENCE_JOB_CONTEXT_MISSING');
  if (job?.permissions && JSON.stringify(job.permissions) !== JSON.stringify({ contents: 'read' })) diagnostics.push('AIGOV_SEQUENCE_PERMISSIONS_NOT_MINIMUM');
  const steps = job?.steps || [];
  const externalUses = steps.map((step) => step?.uses).filter((uses) => typeof uses === 'string' && !uses.startsWith('./') && !uses.startsWith('docker://'));
  if (externalUses.some((uses) => !/@[0-9a-fA-F]{40}$/.test(uses))) diagnostics.push('AIGOV_SEQUENCE_MUTABLE_WORKFLOW_REFERENCE');
  const checkouts = steps.filter((step) => /^actions\/checkout@/.test(step?.uses || ''));
  if (!checkouts.length || checkouts.some((step) => step?.with?.['persist-credentials'] !== false)) diagnostics.push('AIGOV_SEQUENCE_CHECKOUT_CREDENTIALS_PERSISTED');
  const commands = steps.map((step) => step?.run).filter((run) => typeof run === 'string' && run.includes(VALIDATOR_FRAGMENT));
  if (commands.length !== 1) diagnostics.push('AIGOV_SEQUENCE_VALIDATOR_COMMAND_MISSING');
  const validatorCommand = commands[0]?.split(/\r?\n/).map((line) => line.trim()).find((line) => line.includes(VALIDATOR_FRAGMENT)) || null;
  if (!validatorCommand || /\$\(|\$\{\{/.test(validatorCommand)) diagnostics.push('AIGOV_SEQUENCE_DYNAMIC_VALIDATOR_COMMAND');
  return { diagnostics, raw, validatorCommand, workflowCommitSha: headSha };
}

export function verifySequenceProducerPayloads({ repository, repositoryId, prNumber, headSha, scopeRevision, workflowRun, jobs, checkRuns, artifacts, workflowFile, observedAt, replayDigests = new Set() }) {
  const diagnostics = [];
  const add = (condition, code) => { if (condition) diagnostics.push(code); };
  add(workflowRun?.repository?.id !== repositoryId || workflowRun?.repository?.full_name !== repository, 'AIGOV_SEQUENCE_REPOSITORY_MISMATCH');
  add(workflowRun?.name !== SEQUENCE_WORKFLOW.name || workflowRun?.path !== SEQUENCE_WORKFLOW.path || !Number.isInteger(workflowRun?.workflow_id), 'AIGOV_SEQUENCE_WORKFLOW_IDENTITY_MISSING');
  add(workflowRun?.event !== 'pull_request' || workflowRun?.head_sha !== headSha || workflowRun?.status !== 'completed' || workflowRun?.conclusion !== 'success', 'AIGOV_SEQUENCE_EXACT_HEAD_RUN_UNVERIFIED');
  const pr = (workflowRun?.pull_requests || []).find((item) => item?.number === prNumber && item?.head?.sha === headSha);
  add(!pr, 'AIGOV_SEQUENCE_PR_IDENTITY_MISMATCH');
  const job = (jobs || []).find((item) => item?.name === SEQUENCE_CONTEXT);
  add(!job || job?.head_sha !== headSha || job?.status !== 'completed' || job?.conclusion !== 'success' || !Number.isInteger(job?.id), 'AIGOV_SEQUENCE_JOB_IDENTITY_MISSING');
  const check = (checkRuns || []).find((item) => item?.id === job?.id);
  add(!check || check?.name !== SEQUENCE_CONTEXT || check?.head_sha !== headSha || check?.status !== 'completed' || check?.conclusion !== 'success', 'AIGOV_SEQUENCE_CHECK_UNVERIFIED');
  add(check?.app?.id !== SEQUENCE_APP_ID || check?.app?.slug !== 'github-actions' || check?.app?.owner?.login !== 'github', 'AIGOV_SEQUENCE_CHECK_APP_MISMATCH');
  const artifact = (artifacts || []).find((item) => item?.name === SEQUENCE_ARTIFACT);
  add(!artifact || !Number.isInteger(artifact?.id) || artifact?.expired !== false || !/^sha256:[0-9a-f]{64}$/.test(artifact?.digest || ''), 'AIGOV_SEQUENCE_PRODUCER_ARTIFACT_MISSING');
  add(artifact?.workflow_run?.id !== workflowRun?.id || artifact?.workflow_run?.head_sha !== headSha, 'AIGOV_SEQUENCE_PRODUCER_ARTIFACT_RUN_MISMATCH');
  const workflow = workflowDiagnostics(workflowFile, headSha);
  diagnostics.push(...workflow.diagnostics);
  const completedAt = job?.completed_at && new Date(job.completed_at).toISOString();
  if (diagnostics.length) return { diagnostics: [...new Set(diagnostics)], identity: null };
  const identity = {
    schema_version: 'aigov-sequence-producer-identity.v1',
    identity_digest: '',
    repository,
    repository_id: repositoryId,
    pr_number: prNumber,
    exact_head_sha: headSha,
    scope_revision: scopeRevision,
    protocol_version: 'v1.10.1',
    inspector_commit_sha: INSPECTOR_COMMIT,
    check_context: SEQUENCE_CONTEXT,
    app_id: SEQUENCE_APP_ID,
    workflow: { workflow_id: workflowRun.workflow_id, name: workflowRun.name, path: workflowRun.path, commit_sha: workflow.workflowCommitSha, git_blob_sha: workflowFile.sha, file_sha256: sha256(workflow.raw) },
    run: { run_id: workflowRun.id, run_attempt: workflowRun.run_attempt, event: workflowRun.event, html_url: workflowRun.html_url, api_url: workflowRun.url, conclusion: workflowRun.conclusion },
    job: { job_id: job.id, name: job.name, check_run_url: job.check_run_url, html_url: job.html_url, conclusion: job.conclusion },
    artifact: { artifact_id: artifact.id, name: artifact.name, api_url: artifact.url, digest: artifact.digest },
    validator_command: workflow.validatorCommand,
    required_check_configuration: 'not_verified_external_administrative_action',
    repository_settings_enforced: 'not_claimed',
    completed_at: completedAt,
    observed_at: new Date(observedAt || Date.now()).toISOString(),
    evidence_source: 'fresh_github_rest_api_and_immutable_workflow_bytes',
  };
  identity.identity_digest = sequenceProducerDigest(identity);
  if (replayDigests.has(identity.identity_digest)) return { diagnostics: ['AIGOV_SEQUENCE_PRODUCER_REPLAY'], identity: null };
  return { diagnostics: [], identity };
}

export async function fetchSequenceProducerIdentity({ githubJson, repository, repositoryId, prNumber, headSha, scopeRevision, replayDigests = new Set() }) {
  const runs = await githubJson(`/repos/${repository}/actions/runs?head_sha=${headSha}&event=pull_request&status=completed&per_page=100`);
  const candidates = (runs.value?.workflow_runs || []).filter((run) => run.name === SEQUENCE_WORKFLOW.name && run.path === SEQUENCE_WORKFLOW.path && run.head_sha === headSha).sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at));
  const errors = [];
  for (const workflowRun of candidates) {
    const [jobResult, artifactResult, workflowFileResult] = await Promise.all([
      githubJson(`/repos/${repository}/actions/runs/${workflowRun.id}/jobs?filter=latest&per_page=100`),
      githubJson(`/repos/${repository}/actions/runs/${workflowRun.id}/artifacts?per_page=100`),
      githubJson(`/repos/${repository}/contents/${SEQUENCE_WORKFLOW.path}?ref=${headSha}`),
    ]);
    const jobs = jobResult.value?.jobs || [];
    const checks = await Promise.all(jobs.map((job) => githubJson(`/repos/${repository}/check-runs/${job.id}`)));
    const result = verifySequenceProducerPayloads({ repository, repositoryId, prNumber, headSha, scopeRevision, workflowRun, jobs, checkRuns: checks.map((item) => item.value), artifacts: artifactResult.value?.artifacts || [], workflowFile: workflowFileResult.value, observedAt: runs.observedAt, replayDigests });
    if (!result.diagnostics.length) return result;
    errors.push(...result.diagnostics.map((item) => `${workflowRun.id}:${item}`));
  }
  throw new Error(`AIGOV_SEQUENCE_PRODUCER_IDENTITY_UNAVAILABLE:${errors.join(',') || 'no successful designated run'}`);
}
