#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { validateCiIdentity } from './lib/aigov-ci-evidence.mjs';
import { validateSequenceProducerIdentity } from './lib/aigov-sequence-producer.mjs';
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
  const outputDir = path.resolve(ROOT, input.outputDir);
  const capturedCi = JSON.parse(readFileSync(path.join(outputDir, 'aigov-batch-a-ci-identity.json'), 'utf8'));
  const finalizedEvidence = JSON.parse(readFileSync(path.join(outputDir, 'aigov-batch-a-finalized-evidence.json'), 'utf8'));
  const sequence = JSON.parse(readFileSync(path.join(outputDir, 'aigov-sequence-producer-identity.json'), 'utf8'));
  const finalizer = JSON.parse(readFileSync(path.join(outputDir, 'aigov-validation-artifact-identity.json'), 'utf8'));
  validateSchema('kernel/schemas/aigov-ci-identity.v1.schema.json', capturedCi);
  validateSchema('kernel/schemas/aigov-sequence-producer-identity.v1.schema.json', sequence);
  const context = { repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: input.head };
  const ciDiagnostics = validateCiIdentity(capturedCi, context);
  if (ciDiagnostics.length) throw new Error(`AIGOV_POST_CI_TRIGGER_UNVERIFIED:${ciDiagnostics.join(',')}`);
  const expectedFinalizerDigest = canonicalSha256({ ...finalizer, identity_digest: undefined });
  if (finalizer?.identity_digest !== expectedFinalizerDigest || finalizer?.repository !== REPOSITORY || finalizer?.repository_id !== REPOSITORY_ID || finalizer?.pr_number !== PR_NUMBER || finalizer?.exact_head_sha !== input.head || finalizer?.scope_revision !== scope.scope_revision || finalizer?.workflow_name !== FINALIZER_WORKFLOW.name || finalizer?.workflow_path !== FINALIZER_WORKFLOW.path || finalizer?.run_id !== input.finalizerRunId || !Number.isInteger(finalizer?.workflow_id) || !Number.isInteger(finalizer?.job_id) || !Number.isInteger(finalizer?.artifact_id) || !/^sha256:[0-9a-f]{64}$/.test(finalizer?.artifact_digest || '') || finalizer?.evidence_source !== 'fresh_github_rest_api_https') throw new Error('AIGOV_POST_CI_FINALIZER_RUN_UNVERIFIED');
  const sequenceDiagnostics = validateSequenceProducerIdentity(sequence, { ...context, scopeRevision: scope.scope_revision });
  if (sequenceDiagnostics.length) throw new Error(`AIGOV_POST_CI_SEQUENCE_IDENTITY_INVALID:${sequenceDiagnostics.join(',')}`);
  const sequenceItem = finalizedEvidence.evidence_items?.find((item) => item.evidence_id === 'designated-sequence-producer-identity');
  const ciItem = finalizedEvidence.evidence_items?.find((item) => item.evidence_id === 'exact-head-ci-identity');
  if (ciItem?.sha256 !== capturedCi.identity_digest || sequenceItem?.sha256 !== sequence.identity_digest || finalizedEvidence?.head_sha !== input.head || finalizedEvidence?.scope_revision !== scope.scope_revision) throw new Error('AIGOV_POST_CI_CAPTURED_IDENTITY_MISMATCH');
  const artifactItems = finalizedEvidence.evidence_items?.filter((item) => item.github_actions?.artifact_id === finalizer.artifact_id) || [];
  if (!artifactItems.length || artifactItems.some((item) => !finalizer.files?.some((file) => file.evidence_id === item.evidence_id && file.filename === item.github_actions.filename && file.final_file_byte_sha256 === item.sha256))) throw new Error('AIGOV_POST_CI_VALIDATION_ARTIFACT_FILE_MISMATCH');
  mkdirSync(outputDir, { recursive: true });
  const provenance = {
    schema_version: 'aigov-post-ci-provenance.v1',
    repository: REPOSITORY,
    repository_id: REPOSITORY_ID,
    pr_number: PR_NUMBER,
    exact_head_sha: input.head,
    scope_revision: scope.scope_revision,
    trigger: { workflow_id: capturedCi.workflow.workflow_id, run_id: capturedCi.run.run_id, name: capturedCi.workflow.name, path: capturedCi.workflow.path, api_url: capturedCi.run.api_url, html_url: capturedCi.run.html_url, conclusion: capturedCi.run.conclusion, ci_identity_digest: capturedCi.identity_digest, completed_at: capturedCi.completed_at },
    finalizer: { workflow_id: finalizer.workflow_id, run_id: finalizer.run_id, job_id: finalizer.job_id, name: finalizer.workflow_name, path: finalizer.workflow_path, api_url: finalizer.run_api_url, html_url: finalizer.run_html_url },
    sequence_producer_identity_digest: sequence.identity_digest,
    evidence_source: 'fresh_github_rest_api_https_captured_once_then_locally_revalidated',
    observed_at: finalizer.observed_at,
  };
  provenance.provenance_digest = canonicalSha256(provenance);
  writeFileSync(path.join(outputDir, 'aigov-post-ci-provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', output_dir: input.outputDir, finalizer_job_id: finalizer.job_id, sequence_identity_digest: sequence.identity_digest, provenance_sha256: sha256(`${JSON.stringify(provenance, null, 2)}\n`) }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
