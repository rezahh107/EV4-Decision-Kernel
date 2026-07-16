import crypto from 'node:crypto';
import { parse as parseYaml } from 'yaml';
import { canonicalSha256, sha256 } from './aigov-lifecycle.mjs';
import {
  AUTHORITATIVE_WORKFLOWS,
  GITHUB_ACTIONS_APP_ID,
  verifyWorkflowDescriptorPayloads,
} from './aigov-ci-descriptor.mjs';

export const PROTOCOL_VERSION = 'v1.10.2';
export const INSPECTOR_COMMIT = '9ed48bd995ee5b9270756254b04c1d48ccf21cbe';
export const SEQUENCE_CONTEXT = AUTHORITATIVE_WORKFLOWS.sequence.checkName;
export const SEQUENCE_WORKFLOW = Object.freeze({
  name: AUTHORITATIVE_WORKFLOWS.sequence.name,
  path: AUTHORITATIVE_WORKFLOWS.sequence.path,
});
export const SEQUENCE_APP_ID = GITHUB_ACTIONS_APP_ID;
export const SEQUENCE_ARTIFACT = 'aigov-rereview-sequence-producer';
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
  if (identity?.repository !== context.repository
    || identity?.repository_id !== context.repositoryId
    || identity?.pr_number !== context.prNumber
    || identity?.exact_head_sha !== context.headSha
    || identity?.scope_revision !== context.scopeRevision) diagnostics.push('AIGOV_SEQUENCE_PRODUCER_CONTEXT_MISMATCH');
  if (identity?.protocol_version !== PROTOCOL_VERSION
    || identity?.inspector_commit_sha !== INSPECTOR_COMMIT
    || identity?.check_context !== SEQUENCE_CONTEXT
    || identity?.app_id !== SEQUENCE_APP_ID
    || identity?.workflow?.path !== SEQUENCE_WORKFLOW.path
    || identity?.workflow?.commit_sha !== context.headSha) diagnostics.push('AIGOV_SEQUENCE_PRODUCER_IDENTITY_UNVERIFIED');
  if (identity?.required_check_configuration !== 'unverified'
    || identity?.repository_settings_enforced !== 'not_claimed') diagnostics.push('AIGOV_SEQUENCE_REPOSITORY_SETTINGS_OVERCLAIM');
  return [...new Set(diagnostics)];
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
  const triggers = workflow?.on || workflow?.[true] || {};
  if (workflow?.name !== SEQUENCE_WORKFLOW.name || !Object.hasOwn(triggers, 'pull_request')) diagnostics.push('AIGOV_SEQUENCE_CHECK_CONTEXT_UNVERIFIED');
  if (JSON.stringify(workflow?.permissions) !== JSON.stringify({ contents: 'read' })) diagnostics.push('AIGOV_SEQUENCE_PERMISSIONS_NOT_MINIMUM');
  const jobs = Object.values(workflow?.jobs || {}).filter((item) => item?.name === SEQUENCE_CONTEXT);
  if (jobs.length !== 1) diagnostics.push('AIGOV_SEQUENCE_JOB_CONTEXT_MISSING_OR_AMBIGUOUS');
  const job = jobs[0];
  if (job?.permissions && JSON.stringify(job.permissions) !== JSON.stringify({ contents: 'read' })) diagnostics.push('AIGOV_SEQUENCE_PERMISSIONS_NOT_MINIMUM');
  const steps = Array.isArray(job?.steps) ? job.steps : [];
  const externalUses = steps.map((step) => step?.uses).filter((uses) => typeof uses === 'string' && !uses.startsWith('./') && !uses.startsWith('docker://'));
  if (externalUses.some((uses) => !/@[0-9a-fA-F]{40}$/.test(uses))) diagnostics.push('AIGOV_SEQUENCE_MUTABLE_WORKFLOW_REFERENCE');
  const checkouts = steps.filter((step) => /^actions\/checkout@/.test(step?.uses || ''));
  if (checkouts.length !== 2 || checkouts.some((step) => step?.with?.['persist-credentials'] !== false)) diagnostics.push('AIGOV_SEQUENCE_CHECKOUT_IDENTITY_INVALID');
  const targetCheckout = checkouts.find((step) => !Object.hasOwn(step?.with || {}, 'repository'));
  const inspectorCheckout = checkouts.find((step) => step?.with?.repository === 'rezahh107/PR-Inspector');
  if (targetCheckout?.with?.ref !== '${{ github.event.pull_request.head.sha }}') diagnostics.push('AIGOV_SEQUENCE_TARGET_CHECKOUT_NOT_EXACT_HEAD');
  if (inspectorCheckout?.with?.ref !== INSPECTOR_COMMIT) diagnostics.push('AIGOV_SEQUENCE_INSPECTOR_PIN_MISMATCH');
  const commands = steps.map((step) => step?.run).filter((run) => typeof run === 'string' && run.includes(VALIDATOR_FRAGMENT));
  if (commands.length !== 1) diagnostics.push('AIGOV_SEQUENCE_VALIDATOR_COMMAND_MISSING');
  const validatorCommand = commands[0]?.split(/\r?\n/).map((line) => line.trim()).find((line) => line.includes(VALIDATOR_FRAGMENT)) || null;
  const expectedCommand = 'python _external/pr-inspector/scripts/validate_rereview_sequence.py artifacts/pr-inspector-rereview-sequence.pending.json';
  if (validatorCommand !== expectedCommand) diagnostics.push('AIGOV_SEQUENCE_VALIDATOR_COMMAND_NOT_EXACT');
  return { diagnostics, raw, validatorCommand, workflowCommitSha: headSha };
}

export function verifySequenceProducerPayloads({
  repository,
  repositoryId,
  prNumber,
  headSha,
  scopeRevision,
  workflowMetadata,
  workflowRuns,
  allRepositoryRuns,
  jobs,
  checkRuns,
  artifacts,
  workflowFile,
  observedAt,
  replayDigests = new Set(),
}) {
  const diagnostics = [];
  const descriptor = verifyWorkflowDescriptorPayloads({
    repository,
    repositoryId,
    exactHeadSha: headSha,
    event: 'pull_request',
    expected: AUTHORITATIVE_WORKFLOWS.sequence,
    workflow: workflowMetadata,
    runs: workflowRuns,
    allRepositoryRuns,
    jobs,
    checkRuns,
  });
  diagnostics.push(...descriptor.diagnostics);
  const artifact = (artifacts || []).filter((item) => item?.name === SEQUENCE_ARTIFACT);
  if (artifact.length !== 1
    || !Number.isInteger(artifact[0]?.id)
    || artifact[0]?.expired !== false
    || !/^sha256:[0-9a-f]{64}$/.test(artifact[0]?.digest || '')) diagnostics.push('AIGOV_SEQUENCE_PRODUCER_ARTIFACT_MISSING_OR_AMBIGUOUS');
  const run = descriptor.evidence;
  if (artifact[0]?.workflow_run?.id !== run?.run_id || artifact[0]?.workflow_run?.head_sha !== headSha) diagnostics.push('AIGOV_SEQUENCE_PRODUCER_ARTIFACT_RUN_MISMATCH');
  const workflow = workflowDiagnostics(workflowFile, headSha);
  diagnostics.push(...workflow.diagnostics);
  if (diagnostics.length) return { diagnostics: [...new Set(diagnostics)], identity: null, descriptor: null };
  const identity = {
    schema_version: 'aigov-sequence-producer-identity.v2',
    identity_digest: '',
    repository,
    repository_id: repositoryId,
    pr_number: prNumber,
    exact_head_sha: headSha,
    scope_revision: scopeRevision,
    protocol_version: PROTOCOL_VERSION,
    inspector_commit_sha: INSPECTOR_COMMIT,
    check_context: SEQUENCE_CONTEXT,
    app_id: SEQUENCE_APP_ID,
    workflow: {
      workflow_id: run.workflow_id,
      name: run.workflow_name,
      path: run.workflow_path,
      commit_sha: headSha,
      git_blob_sha: workflowFile.sha,
      file_sha256: sha256(workflow.raw),
    },
    run: {
      run_id: run.run_id,
      run_attempt: run.run_attempt,
      event: run.event,
      status: run.status,
      conclusion: run.conclusion,
    },
    job: {
      job_id: run.job_id,
      name: run.check_name,
      conclusion: run.conclusion,
    },
    check: {
      check_name: run.check_name,
      check_head_sha: run.check_head_sha,
      check_app_id: run.check_app_id,
      check_app_slug: run.check_app_slug,
    },
    artifact: {
      artifact_id: artifact[0].id,
      name: artifact[0].name,
      digest: artifact[0].digest,
    },
    validator_command: workflow.validatorCommand,
    required_check_configuration: 'unverified',
    repository_settings_enforced: 'not_claimed',
    completed_at: run.completed_at,
    observed_at: new Date(observedAt || Date.now()).toISOString(),
    evidence_source: 'fresh_github_rest_api_exact_descriptor_and_immutable_workflow_bytes',
  };
  identity.identity_digest = sequenceProducerDigest(identity);
  if (replayDigests.has(identity.identity_digest)) return { diagnostics: ['AIGOV_SEQUENCE_PRODUCER_REPLAY'], identity: null, descriptor: null };
  return { diagnostics: [], identity, descriptor: run };
}

export async function fetchSequenceProducerIdentity({
  githubJson,
  repository,
  repositoryId,
  prNumber,
  headSha,
  scopeRevision,
  replayDigests = new Set(),
}) {
  const workflowResult = await githubJson(`/repos/${repository}/actions/workflows/${encodeURIComponent(SEQUENCE_WORKFLOW.path)}`);
  const allRunsResult = await githubJson(`/repos/${repository}/actions/runs?head_sha=${headSha}&event=pull_request&per_page=100`);
  const workflowRunsResult = await githubJson(`/repos/${repository}/actions/workflows/${workflowResult.value.id}/runs?head_sha=${headSha}&event=pull_request&per_page=100`);
  const workflowRuns = workflowRunsResult.value?.workflow_runs || [];
  const exact = workflowRuns.filter((item) => item.head_sha === headSha && item.event === 'pull_request');
  if (exact.length !== 1) throw new Error(`AIGOV_SEQUENCE_PRODUCER_IDENTITY_UNAVAILABLE:${exact.length ? 'ambiguous designated runs' : 'missing designated run'}`);
  const run = exact[0];
  const [jobResult, artifactResult, workflowFileResult] = await Promise.all([
    githubJson(`/repos/${repository}/actions/runs/${run.id}/jobs?filter=latest&per_page=100`),
    githubJson(`/repos/${repository}/actions/runs/${run.id}/artifacts?per_page=100`),
    githubJson(`/repos/${repository}/contents/${SEQUENCE_WORKFLOW.path}?ref=${headSha}`),
  ]);
  const jobs = jobResult.value?.jobs || [];
  const checks = await Promise.all(jobs.map((job) => githubJson(`/repos/${repository}/check-runs/${job.id}`)));
  const result = verifySequenceProducerPayloads({
    repository,
    repositoryId,
    prNumber,
    headSha,
    scopeRevision,
    workflowMetadata: workflowResult.value,
    workflowRuns,
    allRepositoryRuns: allRunsResult.value?.workflow_runs || [],
    jobs,
    checkRuns: checks.map((item) => item.value),
    artifacts: artifactResult.value?.artifacts || [],
    workflowFile: workflowFileResult.value,
    observedAt: allRunsResult.observedAt,
    replayDigests,
  });
  if (result.diagnostics.length) throw new Error(`AIGOV_SEQUENCE_PRODUCER_IDENTITY_UNAVAILABLE:${result.diagnostics.join(',')}`);
  return result;
}
