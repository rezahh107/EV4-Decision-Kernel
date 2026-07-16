#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import {
  INSPECTOR_COMMIT,
  PROTOCOL_VERSION,
  verifySequenceProducerPayloads,
} from './lib/aigov-sequence-producer-v1102.mjs';

const ROOT = process.cwd();
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const HEAD = 'a'.repeat(40);
const SCOPE = `sha256:${'b'.repeat(64)}`;

function blobSha(raw) {
  return crypto.createHash('sha1').update(Buffer.from(`blob ${raw.length}\0`)).update(raw).digest('hex');
}

function fixture() {
  const raw = readFileSync('.github/workflows/validate-rereview-sequence.yml');
  const workflowMetadata = { id: 3001, name: 'Validate rereview sequence enforcement', path: '.github/workflows/validate-rereview-sequence.yml' };
  const run = {
    id: 2001,
    workflow_id: 3001,
    run_attempt: 1,
    name: workflowMetadata.name,
    path: workflowMetadata.path,
    event: 'pull_request',
    head_sha: HEAD,
    status: 'completed',
    conclusion: 'success',
    updated_at: '2026-07-16T12:00:00Z',
    repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
    pull_requests: [{ number: 50, head: { sha: HEAD } }],
  };
  const job = {
    id: 4001,
    run_id: 2001,
    name: 'Validate rereview sequence enforcement',
    head_sha: HEAD,
    status: 'completed',
    conclusion: 'success',
    completed_at: '2026-07-16T11:59:00Z',
  };
  const check = {
    id: 4001,
    name: job.name,
    head_sha: HEAD,
    status: 'completed',
    conclusion: 'success',
    app: { id: 15368, slug: 'github-actions', owner: { login: 'github' } },
  };
  const artifact = {
    id: 5001,
    name: 'aigov-rereview-sequence-producer',
    expired: false,
    digest: `sha256:${'c'.repeat(64)}`,
    workflow_run: { id: 2001, head_sha: HEAD },
  };
  return {
    repository: REPOSITORY,
    repositoryId: REPOSITORY_ID,
    prNumber: 50,
    headSha: HEAD,
    scopeRevision: SCOPE,
    workflowMetadata,
    workflowRuns: [run],
    allRepositoryRuns: [run],
    jobs: [job],
    checkRuns: [check],
    artifacts: [artifact],
    workflowFile: {
      type: 'file',
      path: workflowMetadata.path,
      encoding: 'base64',
      content: raw.toString('base64'),
      sha: blobSha(raw),
    },
    observedAt: '2026-07-16T12:01:00Z',
  };
}

const cases = [];
function run(name, mutate, expected) {
  const value = fixture();
  mutate(value);
  const result = verifySequenceProducerPayloads(value);
  const pass = expected === null
    ? Boolean(result.identity) && result.diagnostics.length === 0
    : result.diagnostics.some((item) => String(item).startsWith(expected));
  cases.push({ name, expected: expected || 'pass', diagnostics: result.diagnostics, pass });
}

run('active v1.10.2 designated producer positive', () => {}, null);
run('stale v1.10.1 inspector pin rejected', (value) => {
  const raw = Buffer.from(value.workflowFile.content, 'base64');
  const text = raw.toString('utf8').replace(INSPECTOR_COMMIT, '7a21045366bb9ad1ca2f950b8341ebb867dd8a52');
  const changed = Buffer.from(text);
  value.workflowFile.content = changed.toString('base64');
  value.workflowFile.sha = blobSha(changed);
}, 'AIGOV_SEQUENCE_INSPECTOR_PIN_MISMATCH');
run('same-name workflow collision rejected', (value) => {
  value.allRepositoryRuns.push({ ...value.workflowRuns[0], id: 2002, workflow_id: 9999, path: '.github/workflows/lookalike.yml' });
}, 'AIGOV_CI_SAME_NAME_WORKFLOW_COLLISION');
run('wrong workflow path rejected', (value) => { value.workflowMetadata.path = '.github/workflows/validate-mvk.yml'; }, 'AIGOV_CI_WORKFLOW_DESCRIPTOR_MISMATCH');
run('wrong workflow ID rejected', (value) => { value.workflowRuns[0].workflow_id = 9999; }, 'AIGOV_CI_AUTHORITATIVE_RUN_MISSING');
run('wrong GitHub App rejected', (value) => { value.checkRuns[0].app.id = 99999; }, 'AIGOV_CI_CHECK_APP_MISMATCH');
run('missing job rejected', (value) => { value.jobs = []; }, 'AIGOV_CI_JOB_MISSING');
run('missing check rejected', (value) => { value.checkRuns = []; }, 'AIGOV_CI_CHECK_MISSING');
run('skipped run rejected', (value) => { value.workflowRuns[0].conclusion = 'skipped'; }, 'AIGOV_CI_AUTHORITATIVE_RUN_NOT_SUCCESSFUL');
run('cancelled run rejected', (value) => { value.workflowRuns[0].conclusion = 'cancelled'; }, 'AIGOV_CI_AUTHORITATIVE_RUN_NOT_SUCCESSFUL');
run('malformed workflow payload rejected', (value) => { value.workflowRuns = [{}]; }, 'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED');
run('producer evidence for another repository rejected', (value) => { value.workflowRuns[0].repository.full_name = 'attacker/lookalike'; }, 'AIGOV_CI_AUTHORITATIVE_RUN_MISSING');
run('producer evidence for another head rejected', (value) => { value.workflowRuns[0].head_sha = 'd'.repeat(40); }, 'AIGOV_CI_AUTHORITATIVE_RUN_MISSING');
run('producer artifact missing rejected', (value) => { value.artifacts = []; }, 'AIGOV_SEQUENCE_PRODUCER_ARTIFACT_MISSING_OR_AMBIGUOUS');
run('mutable workflow reference rejected', (value) => {
  const raw = Buffer.from(value.workflowFile.content, 'base64');
  const text = raw.toString('utf8').replace('actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1', 'actions/setup-python@v6');
  const changed = Buffer.from(text);
  value.workflowFile.content = changed.toString('base64');
  value.workflowFile.sha = blobSha(changed);
}, 'AIGOV_SEQUENCE_MUTABLE_WORKFLOW_REFERENCE');
{
  const value = fixture();
  const first = verifySequenceProducerPayloads(value);
  const replay = verifySequenceProducerPayloads({ ...value, replayDigests: new Set([first.identity.identity_digest]) });
  cases.push({
    name: 'replayed sequence producer identity rejected',
    expected: 'AIGOV_SEQUENCE_PRODUCER_REPLAY',
    diagnostics: replay.diagnostics,
    pass: replay.diagnostics.includes('AIGOV_SEQUENCE_PRODUCER_REPLAY'),
  });
}

let official = { status: 'fail', output: '' };
try {
  const inspectorRoot = process.env.PR_INSPECTOR_ROOT || '/tmp/pr-inspector-9ed48bd995';
  const output = execFileSync('python3', ['tools/test-pr-inspector-security-capability.py', '--inspector-root', inspectorRoot], { cwd: ROOT, encoding: 'utf8' });
  official = { status: 'pass', output: output.trim() };
} catch (error) {
  official = { status: 'fail', output: `${error.stdout || ''}${error.stderr || ''}` };
}
cases.push({
  name: 'official v1.10.2 opaque security capability boundary',
  expected: 'official pass',
  diagnostics: official.status === 'pass' ? [] : [official.output],
  pass: official.status === 'pass',
});

const report = {
  suite: 'aigov-designated-sequence-producer-v1102',
  protocol_version: PROTOCOL_VERSION,
  inspector_commit_sha: INSPECTOR_COMMIT,
  status: cases.every((item) => item.pass) ? 'pass' : 'fail',
  cases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
