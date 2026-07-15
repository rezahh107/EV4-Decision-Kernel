#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fetchExactHeadCiIdentity, validateCiIdentity } from './lib/aigov-ci-evidence.mjs';
import { canonicalSha256, sha256 } from './lib/aigov-lifecycle.mjs';
import { fetchSequenceProducerIdentity, validateSequenceProducerIdentity } from './lib/aigov-sequence-producer.mjs';

const ROOT = process.cwd();
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const PR_NUMBER = 49;

function parseArgs(argv) {
  const result = { head: null, evidenceManifest: null, output: 'artifacts/aigov-batch-a-finalized-evidence.json', ciOutput: 'artifacts/aigov-batch-a-ci-identity.json', validationArtifactId: null, validationArtifactDigest: null, validationArtifactName: null, finalizerRunId: null, artifactIdentityOutput: 'artifacts/aigov-validation-artifact-identity.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--head') result.head = argv[++index];
    else if (argv[index] === '--evidence-manifest') result.evidenceManifest = argv[++index];
    else if (argv[index] === '--output') result.output = argv[++index];
    else if (argv[index] === '--ci-output') result.ciOutput = argv[++index];
    else if (argv[index] === '--validation-artifact-id') result.validationArtifactId = Number(argv[++index]);
    else if (argv[index] === '--validation-artifact-digest') result.validationArtifactDigest = argv[++index];
    else if (argv[index] === '--validation-artifact-name') result.validationArtifactName = argv[++index];
    else if (argv[index] === '--finalizer-run-id') result.finalizerRunId = Number(argv[++index]);
    else if (argv[index] === '--artifact-identity-output') result.artifactIdentityOutput = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.head || '') || !result.evidenceManifest || !Number.isInteger(result.validationArtifactId) || !/^sha256:[0-9a-f]{64}$/.test(result.validationArtifactDigest || '') || !result.validationArtifactName || !Number.isInteger(result.finalizerRunId)) throw new Error('Exact head, manifest, finalizer run and assigned validation artifact identity are required.');
  return result;
}

async function githubJson(apiPath) {
  const url = `https://api.github.com${apiPath}`;
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ev4-aigov-ci-evidence-capture', 'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error' });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return { value: await response.json(), observedAt: new Date().toISOString(), url };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = JSON.parse(readFileSync(path.join(ROOT, 'planning/governance/scopes/aigov-v2-batch-a.scope.json'), 'utf8'));
  const evidence = JSON.parse(readFileSync(path.resolve(ROOT, args.evidenceManifest), 'utf8'));
  if (evidence.head_sha !== args.head || evidence.scope_revision !== scope.scope_revision || evidence.manifest_state !== 'executed_exact_head') throw new Error('AIGOV_EXECUTED_EVIDENCE_IDENTITY_MISMATCH');
  const [{ identity }, sequenceResult] = await Promise.all([
    fetchExactHeadCiIdentity({ githubJson, repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: args.head }),
    fetchSequenceProducerIdentity({ githubJson, repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: args.head, scopeRevision: scope.scope_revision }),
  ]);
  const context = { repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: args.head };
  const identityDiagnostics = validateCiIdentity(identity, context);
  if (identityDiagnostics.length) throw new Error(`AIGOV_CI_IDENTITY_INVALID:${identityDiagnostics.join(',')}`);
  const sequenceDiagnostics = validateSequenceProducerIdentity(sequenceResult.identity, { ...context, scopeRevision: scope.scope_revision });
  if (sequenceDiagnostics.length) throw new Error(`AIGOV_SEQUENCE_PRODUCER_IDENTITY_INVALID:${sequenceDiagnostics.join(',')}`);
  const [artifactResult, finalizerResult, finalizerJobsResult] = await Promise.all([
    githubJson(`/repos/${REPOSITORY}/actions/artifacts/${args.validationArtifactId}`),
    githubJson(`/repos/${REPOSITORY}/actions/runs/${args.finalizerRunId}`),
    githubJson(`/repos/${REPOSITORY}/actions/runs/${args.finalizerRunId}/jobs?filter=latest&per_page=100`),
  ]);
  const artifact = artifactResult.value;
  const finalizer = finalizerResult.value;
  const finalizerJob = (finalizerJobsResult.value?.jobs || []).find((item) => item.name === 'Finalize AIGOV post-CI evidence');
  if (artifact?.id !== args.validationArtifactId || artifact?.name !== args.validationArtifactName || artifact?.digest !== args.validationArtifactDigest || artifact?.expired !== false || artifact?.workflow_run?.id !== args.finalizerRunId || artifact?.workflow_run?.head_sha !== args.head || artifact?.workflow_run?.head_repository_id !== REPOSITORY_ID) throw new Error('AIGOV_VALIDATION_ARTIFACT_IDENTITY_UNVERIFIED');
  if (finalizer?.repository?.id !== REPOSITORY_ID || finalizer?.name !== 'Finalize AIGOV post-CI evidence' || finalizer?.path !== '.github/workflows/finalize-aigov-evidence.yml' || finalizer?.event !== 'pull_request' || finalizer?.head_sha !== args.head || !finalizerJob || finalizerJob?.head_sha !== args.head) throw new Error('AIGOV_VALIDATION_ARTIFACT_PRODUCER_UNVERIFIED');
  const actionRef = (filename) => ({
    workflow_id: finalizer.workflow_id,
    run_id: finalizer.id,
    job_id: finalizerJob.id,
    check_run_url: finalizerJob.check_run_url,
    artifact_id: artifact.id,
    artifact_name: artifact.name,
    filename,
    hash_scope: 'final_file_bytes',
  });
  evidence.manifest_state = 'executed_exact_head_ci_verified';
  for (const item of evidence.evidence_items.filter((candidate) => ['validation', 'scope_disclosure'].includes(candidate.kind) && candidate.status === 'passed')) {
    const source = `artifacts/aigov-command-logs/${item.evidence_id}.log`;
    const filename = `aigov-command-logs/${item.evidence_id}.log`;
    const finalFileHash = sha256(readFileSync(path.resolve(ROOT, source)));
    if (item.sha256 !== finalFileHash) throw new Error(`AIGOV_VALIDATION_LOG_HASH_MISMATCH:${item.evidence_id}`);
    item.evidence_source = 'github_actions';
    item.github_actions = actionRef(filename);
    item.authoritative_reference = `${finalizer.html_url}#artifact:${artifact.id}:${artifact.name}:${filename}`;
  }
  const ciItem = evidence.evidence_items.find((item) => item.evidence_id === 'exact-head-ci-identity');
  if (!ciItem) throw new Error('AIGOV_EXACT_HEAD_CI_ITEM_MISSING');
  ciItem.status = 'passed';
  ciItem.sha256 = identity.identity_digest;
  ciItem.evidence_source = 'github_actions';
  ciItem.authoritative_reference = identity.run.html_url;
  const regressionJob = identity.jobs.find((item) => item.name === 'MVK and roadmap regressions');
  ciItem.github_actions = { workflow_id: identity.workflow.workflow_id, run_id: identity.run.run_id, job_id: regressionJob.job_id, check_run_url: regressionJob.check_run_url, artifact_id: null, artifact_name: null, filename: null, hash_scope: 'canonical_json_identity' };
  const sequenceItem = evidence.evidence_items.find((item) => item.evidence_id === 'designated-sequence-producer-identity');
  if (!sequenceItem) throw new Error('AIGOV_SEQUENCE_PRODUCER_ITEM_MISSING');
  sequenceItem.status = 'passed';
  sequenceItem.sha256 = sequenceResult.identity.identity_digest;
  sequenceItem.evidence_source = 'github_actions';
  sequenceItem.authoritative_reference = sequenceResult.identity.run.html_url;
  sequenceItem.github_actions = { workflow_id: sequenceResult.identity.workflow.workflow_id, run_id: sequenceResult.identity.run.run_id, job_id: sequenceResult.identity.job.job_id, check_run_url: sequenceResult.identity.job.check_run_url, artifact_id: sequenceResult.identity.artifact.artifact_id, artifact_name: sequenceResult.identity.artifact.name, filename: null, hash_scope: 'canonical_json_identity' };
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const ciValidator = ajv.compile(JSON.parse(readFileSync(path.join(ROOT, 'kernel/schemas/aigov-ci-identity.v1.schema.json'), 'utf8')));
  const evidenceValidator = ajv.compile(JSON.parse(readFileSync(path.join(ROOT, 'kernel/schemas/aigov-evidence-manifest.v1.schema.json'), 'utf8')));
  if (!ciValidator(identity)) throw new Error(`AIGOV_CI_IDENTITY_SCHEMA_INVALID:${JSON.stringify(ciValidator.errors)}`);
  if (!evidenceValidator(evidence)) throw new Error(`AIGOV_EVIDENCE_SCHEMA_INVALID:${JSON.stringify(evidenceValidator.errors)}`);
  writeFileSync(path.resolve(ROOT, args.ciOutput), `${JSON.stringify(identity, null, 2)}\n`);
  writeFileSync(path.resolve(ROOT, args.output), `${JSON.stringify(evidence, null, 2)}\n`);
  const validationArtifactIdentity = {
    schema_version: 'aigov-validation-artifact-identity.v1',
    identity_digest: '',
    repository: REPOSITORY,
    repository_id: REPOSITORY_ID,
    pr_number: PR_NUMBER,
    exact_head_sha: args.head,
    scope_revision: scope.scope_revision,
    workflow_id: finalizer.workflow_id,
    workflow_name: finalizer.name,
    workflow_path: finalizer.path,
    run_id: finalizer.id,
    run_api_url: finalizer.url,
    run_html_url: finalizer.html_url,
    job_id: finalizerJob.id,
    job_check_run_url: finalizerJob.check_run_url,
    artifact_id: artifact.id,
    artifact_name: artifact.name,
    artifact_digest: artifact.digest,
    api_url: artifact.url,
    evidence_source: 'fresh_github_rest_api_https',
    observed_at: finalizerResult.observedAt,
    files: evidence.evidence_items.filter((item) => item.github_actions?.artifact_id === artifact.id).map((item) => ({ evidence_id: item.evidence_id, filename: item.github_actions.filename, final_file_byte_sha256: item.sha256 })),
  };
  validationArtifactIdentity.identity_digest = canonicalSha256({ ...validationArtifactIdentity, identity_digest: undefined });
  writeFileSync(path.resolve(ROOT, args.artifactIdentityOutput), `${JSON.stringify(validationArtifactIdentity, null, 2)}\n`);
  writeFileSync(path.join(path.dirname(path.resolve(ROOT, args.output)), 'aigov-sequence-producer-identity.json'), `${JSON.stringify(sequenceResult.identity, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', head_sha: args.head, scope_revision: scope.scope_revision, ci_identity_digest: identity.identity_digest, workflow_id: identity.workflow.workflow_id, run_id: identity.run.run_id, jobs: identity.jobs, artifacts: identity.artifacts, validation_artifact: validationArtifactIdentity, ci_output: args.ciOutput, evidence_output: args.output }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
