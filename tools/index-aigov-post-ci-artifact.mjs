#!/usr/bin/env node
import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { canonicalSha256, sha256 } from './lib/aigov-lifecycle.mjs';

const ROOT = process.cwd();
function args(argv) {
  const out = { artifactId: null, artifactDigest: null, artifactName: null, payloadRoot: 'artifacts/aigov-post-ci-payload', provenance: 'artifacts/aigov-post-ci/aigov-post-ci-provenance.json', output: 'artifacts/aigov-post-ci-artifact-index.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--artifact-id') out.artifactId = Number(argv[++index]);
    else if (argv[index] === '--artifact-digest') out.artifactDigest = argv[++index];
    else if (argv[index] === '--artifact-name') out.artifactName = argv[++index];
    else if (argv[index] === '--payload-root') out.payloadRoot = argv[++index];
    else if (argv[index] === '--provenance') out.provenance = argv[++index];
    else if (argv[index] === '--output') out.output = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!Number.isInteger(out.artifactId) || !/^sha256:[0-9a-f]{64}$/.test(out.artifactDigest || '') || !out.artifactName) throw new Error('Assigned artifact ID, digest and name are required.');
  return out;
}

function files(root, directory = root) {
  return readdirSync(directory).flatMap((name) => {
    const full = path.join(directory, name);
    return statSync(full).isDirectory() ? files(root, full) : [full];
  }).sort();
}

function main() {
  const input = args(process.argv.slice(2));
  const provenance = JSON.parse(readFileSync(path.resolve(ROOT, input.provenance), 'utf8'));
  const payloadRoot = path.resolve(ROOT, input.payloadRoot);
  const entries = files(payloadRoot).map((filename) => {
    const raw = readFileSync(filename);
    return {
      filename: path.relative(payloadRoot, filename).split(path.sep).join('/'),
      final_file_byte_sha256: sha256(raw),
      hash_scope: 'final_file_bytes',
      workflow_id: provenance.finalizer.workflow_id,
      run_id: provenance.finalizer.run_id,
      job_id: provenance.finalizer.job_id,
      artifact_id: input.artifactId,
      artifact_name: input.artifactName,
    };
  });
  if (!entries.length) throw new Error('AIGOV_POST_CI_PAYLOAD_EMPTY');
  const index = {
    schema_version: 'aigov-post-ci-artifact-index.v1',
    index_digest: '',
    repository: provenance.repository,
    repository_id: provenance.repository_id,
    pr_number: provenance.pr_number,
    exact_head_sha: provenance.exact_head_sha,
    scope_revision: provenance.scope_revision,
    workflow_id: provenance.finalizer.workflow_id,
    run_id: provenance.finalizer.run_id,
    job_id: provenance.finalizer.job_id,
    artifact_id: input.artifactId,
    artifact_name: input.artifactName,
    artifact_digest: input.artifactDigest,
    files: entries,
  };
  index.index_digest = canonicalSha256(index);
  writeFileSync(path.resolve(ROOT, input.output), `${JSON.stringify(index, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', output: input.output, index_digest: index.index_digest, files: entries.length }, null, 2));
}

main();
