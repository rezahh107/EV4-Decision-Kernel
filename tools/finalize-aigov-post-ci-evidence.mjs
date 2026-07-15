#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fetchExactHeadCiIdentity, validateCiIdentity } from './lib/aigov-ci-evidence.mjs';
import { fetchSequenceProducerIdentity, validateSequenceProducerIdentity } from './lib/aigov-sequence-producer.mjs';
import { canonicalSha256, sha256 } from './lib/aigov-lifecycle.mjs';

const ROOT = process.cwd();
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const PR_NUMBER = 49;
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';
const FINALIZER_WORKFLOW = { name: 'Finalize AIGOV post-CI evidence', path: '.github/workflows/finalize-aigov-evidence.yml' };

function args(argv) {
  const out = { head: null, finalizerRunId: null, finalizerJobName: 'Finalize AIGOV post-CI evidence', outputDir: 'artifacts/aigov-post-ci' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--head') out.head = argv[++index];
    else if (argv[index] === '--finalizer-run-id') out.finalizerRunId = Number(argv[++index]);
    else if (argv[index] === '--output-dir') out.outputDir = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^[0-9a-f]{40}$/.test(out.head || '') || !Number.isInteger(out.finalizerRunId)) throw new Error('Exact head and numeric finalizer run ID are required.');
  return out;
}

async function githubJson(apiPath) {
  const url = `https://api.github.com${apiPath}`;
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ev4-aigov-post-ci-finalizer', 'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error' });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return { value: await response.json(), observedAt: new Date().toISOString(), url };
}

function validateSchema(schemaPath, value) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(readFileSync(path.join(ROOT, schemaPath), 'utf8')));
  if (!validate(value)) throw new Error(`AIGOV_POST_CI_SCHEMA_INVALID:${schemaPath}:${JSON.stringify(validate.errors)}`);
}

async function main() {
  const input = args(process.argv.slice(2));
  const observedHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (observedHead !== input.head) throw new Error('AIGOV_POST_CI_HEAD_MISMATCH');
  const scope = JSON.parse(readFileSync(path.join(ROOT, SCOPE_PATH), 'utf8'));
  const [ci, finalizer, finalizerJobs, sequence] = await Promise.all([
    fetchExactHeadCiIdentity({ githubJson, repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: input.head }),
    githubJson(`/repos/${REPOSITORY}/actions/runs/${input.finalizerRunId}`),
    githubJson(`/repos/${REPOSITORY}/actions/runs/${input.finalizerRunId}/jobs?filter=latest&per_page=100`),
    fetchSequenceProducerIdentity({ githubJson, repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: input.head, scopeRevision: scope.scope_revision }),
  ]);
  const ciDiagnostics = validateCiIdentity(ci.identity, { repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: input.head });
  if (ciDiagnostics.length) throw new Error(`AIGOV_POST_CI_TRIGGER_UNVERIFIED:${ciDiagnostics.join(',')}`);
  if (finalizer.value?.repository?.id !== REPOSITORY_ID || finalizer.value?.name !== FINALIZER_WORKFLOW.name || finalizer.value?.path !== FINALIZER_WORKFLOW.path || finalizer.value?.event !== 'pull_request' || finalizer.value?.head_sha !== input.head) throw new Error('AIGOV_POST_CI_FINALIZER_RUN_UNVERIFIED');
  const job = (finalizerJobs.value?.jobs || []).find((item) => item.name === input.finalizerJobName);
  if (!job || !Number.isInteger(job.id) || job.head_sha !== input.head || !['queued', 'in_progress', 'completed'].includes(job.status)) throw new Error('AIGOV_POST_CI_FINALIZER_JOB_UNVERIFIED');
  const sequenceDiagnostics = validateSequenceProducerIdentity(sequence.identity, { repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: input.head, scopeRevision: scope.scope_revision });
  if (sequenceDiagnostics.length) throw new Error(`AIGOV_POST_CI_SEQUENCE_IDENTITY_INVALID:${sequenceDiagnostics.join(',')}`);
  const capturedCi = JSON.parse(readFileSync(path.join(ROOT, input.outputDir, 'aigov-batch-a-ci-identity.json'), 'utf8'));
  const finalizedEvidence = JSON.parse(readFileSync(path.join(ROOT, input.outputDir, 'aigov-batch-a-finalized-evidence.json'), 'utf8'));
  const sequenceItem = finalizedEvidence.evidence_items?.find((item) => item.evidence_id === 'designated-sequence-producer-identity');
  if (capturedCi.identity_digest !== ci.identity.identity_digest || sequenceItem?.sha256 !== sequence.identity.identity_digest) throw new Error('AIGOV_POST_CI_CAPTURED_IDENTITY_MISMATCH');
  validateSchema('kernel/schemas/aigov-sequence-producer-identity.v1.schema.json', sequence.identity);
  const outputDir = path.resolve(ROOT, input.outputDir);
  mkdirSync(outputDir, { recursive: true });
  writeFileSync(path.join(outputDir, 'aigov-sequence-producer-identity.json'), `${JSON.stringify(sequence.identity, null, 2)}\n`);
  const provenance = {
    schema_version: 'aigov-post-ci-provenance.v1',
    repository: REPOSITORY,
    repository_id: REPOSITORY_ID,
    pr_number: PR_NUMBER,
    exact_head_sha: input.head,
    scope_revision: scope.scope_revision,
    trigger: { workflow_id: ci.workflowRun.workflow_id, run_id: ci.workflowRun.id, name: ci.workflowRun.name, path: ci.workflowRun.path, api_url: ci.workflowRun.url, html_url: ci.workflowRun.html_url, conclusion: ci.workflowRun.conclusion, ci_identity_digest: ci.identity.identity_digest, completed_at: ci.identity.completed_at },
    finalizer: { workflow_id: finalizer.value.workflow_id, run_id: finalizer.value.id, job_id: job.id, name: finalizer.value.name, path: finalizer.value.path, api_url: finalizer.value.url, html_url: finalizer.value.html_url },
    sequence_producer_identity_digest: sequence.identity.identity_digest,
    evidence_source: 'fresh_github_rest_api_https',
    observed_at: new Date().toISOString(),
  };
  provenance.provenance_digest = canonicalSha256(provenance);
  writeFileSync(path.join(outputDir, 'aigov-post-ci-provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', output_dir: input.outputDir, finalizer_job_id: job.id, sequence_identity_digest: sequence.identity.identity_digest, provenance_sha256: sha256(`${JSON.stringify(provenance, null, 2)}\n`) }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
