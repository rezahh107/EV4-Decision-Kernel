#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { fetchExactHeadCiIdentity, validateCiIdentity } from './lib/aigov-ci-evidence.mjs';

const ROOT = process.cwd();
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const PR_NUMBER = 49;

function parseArgs(argv) {
  const result = { head: null, evidenceManifest: null, output: 'artifacts/aigov-batch-a-finalized-evidence.json', ciOutput: 'artifacts/aigov-batch-a-ci-identity.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--head') result.head = argv[++index];
    else if (argv[index] === '--evidence-manifest') result.evidenceManifest = argv[++index];
    else if (argv[index] === '--output') result.output = argv[++index];
    else if (argv[index] === '--ci-output') result.ciOutput = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.head || '') || !result.evidenceManifest) throw new Error('--head and --evidence-manifest are required.');
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
  const { identity } = await fetchExactHeadCiIdentity({ githubJson, repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: args.head });
  const context = { repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: args.head };
  const identityDiagnostics = validateCiIdentity(identity, context);
  if (identityDiagnostics.length) throw new Error(`AIGOV_CI_IDENTITY_INVALID:${identityDiagnostics.join(',')}`);
  const regressionJob = identity.jobs.find((item) => item.name === 'MVK and roadmap regressions');
  const artifact = identity.artifacts.find((item) => item.name === 'aigov-batch-a-scope-disclosure');
  const actionRef = (filename, hashScope = 'final_file_bytes') => ({
    workflow_id: identity.workflow.workflow_id,
    run_id: identity.run.run_id,
    job_id: regressionJob.job_id,
    check_run_url: regressionJob.check_run_url,
    artifact_id: hashScope === 'final_file_bytes' ? artifact.artifact_id : null,
    artifact_name: hashScope === 'final_file_bytes' ? artifact.name : null,
    filename: hashScope === 'final_file_bytes' ? filename : null,
    hash_scope: hashScope,
  });
  evidence.manifest_state = 'executed_exact_head_ci_verified';
  for (const item of evidence.evidence_items.filter((candidate) => ['validation', 'scope_disclosure'].includes(candidate.kind) && candidate.status === 'passed')) {
    const filename = item.authoritative_reference.replace(/^local-file:artifacts\//, '');
    item.evidence_source = 'github_actions';
    item.github_actions = actionRef(filename);
    item.authoritative_reference = `${identity.run.html_url}#artifact:${artifact.artifact_id}:${artifact.name}:${filename}`;
  }
  const ciItem = evidence.evidence_items.find((item) => item.evidence_id === 'exact-head-ci-identity');
  if (!ciItem) throw new Error('AIGOV_EXACT_HEAD_CI_ITEM_MISSING');
  ciItem.status = 'passed';
  ciItem.sha256 = identity.identity_digest;
  ciItem.evidence_source = 'github_actions';
  ciItem.authoritative_reference = identity.run.html_url;
  ciItem.github_actions = actionRef(null, 'canonical_json_identity');
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const ciValidator = ajv.compile(JSON.parse(readFileSync(path.join(ROOT, 'kernel/schemas/aigov-ci-identity.v1.schema.json'), 'utf8')));
  const evidenceValidator = ajv.compile(JSON.parse(readFileSync(path.join(ROOT, 'kernel/schemas/aigov-evidence-manifest.v1.schema.json'), 'utf8')));
  if (!ciValidator(identity)) throw new Error(`AIGOV_CI_IDENTITY_SCHEMA_INVALID:${JSON.stringify(ciValidator.errors)}`);
  if (!evidenceValidator(evidence)) throw new Error(`AIGOV_EVIDENCE_SCHEMA_INVALID:${JSON.stringify(evidenceValidator.errors)}`);
  writeFileSync(path.resolve(ROOT, args.ciOutput), `${JSON.stringify(identity, null, 2)}\n`);
  writeFileSync(path.resolve(ROOT, args.output), `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', head_sha: args.head, scope_revision: scope.scope_revision, ci_identity_digest: identity.identity_digest, workflow_id: identity.workflow.workflow_id, run_id: identity.run.run_id, jobs: identity.jobs, artifacts: identity.artifacts, ci_output: args.ciOutput, evidence_output: args.output }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
