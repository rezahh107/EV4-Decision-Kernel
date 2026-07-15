#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { verifySequenceProducerPayloads } from './lib/aigov-sequence-producer.mjs';

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
  const run = {
    id: 2001, workflow_id: 3001, run_attempt: 1, name: 'Validate rereview sequence enforcement', path: '.github/workflows/validate-rereview-sequence.yml',
    event: 'pull_request', head_sha: HEAD, status: 'completed', conclusion: 'success', html_url: `https://github.com/${REPOSITORY}/actions/runs/2001`, url: `https://api.github.com/repos/${REPOSITORY}/actions/runs/2001`,
    updated_at: '2026-07-15T12:00:00Z', repository: { id: REPOSITORY_ID, full_name: REPOSITORY }, pull_requests: [{ number: 49, head: { sha: HEAD } }],
  };
  const job = { id: 4001, name: 'Validate rereview sequence enforcement', head_sha: HEAD, status: 'completed', conclusion: 'success', completed_at: '2026-07-15T11:59:00Z', check_run_url: `https://api.github.com/repos/${REPOSITORY}/check-runs/4001`, html_url: `https://github.com/${REPOSITORY}/actions/runs/2001/job/4001` };
  const check = { id: 4001, name: job.name, head_sha: HEAD, status: 'completed', conclusion: 'success', app: { id: 15368, slug: 'github-actions', owner: { login: 'github' } } };
  const artifact = { id: 5001, name: 'aigov-rereview-sequence-producer', expired: false, digest: `sha256:${'c'.repeat(64)}`, url: `https://api.github.com/repos/${REPOSITORY}/actions/artifacts/5001`, workflow_run: { id: 2001, head_sha: HEAD } };
  return { repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: 49, headSha: HEAD, scopeRevision: SCOPE, workflowRun: run, jobs: [job], checkRuns: [check], artifacts: [artifact], workflowFile: { type: 'file', path: '.github/workflows/validate-rereview-sequence.yml', encoding: 'base64', content: raw.toString('base64'), sha: blobSha(raw) }, observedAt: '2026-07-15T12:01:00Z' };
}

const cases = [];
function run(name, mutate, expected) {
  const value = fixture();
  mutate(value);
  const result = verifySequenceProducerPayloads(value);
  cases.push({ name, expected, diagnostics: result.diagnostics, pass: expected === null ? Boolean(result.identity) && result.diagnostics.length === 0 : result.diagnostics.includes(expected) });
}

run('designated producer positive', () => {}, null);
run('generic Validate MVK substituted', (v) => { v.workflowRun.name = 'Validate MVK'; }, 'AIGOV_SEQUENCE_WORKFLOW_IDENTITY_MISSING');
run('same-name check wrong App ID', (v) => { v.checkRuns[0].app.id = 99999; }, 'AIGOV_SEQUENCE_CHECK_APP_MISMATCH');
run('same-App check without producer artifact', (v) => { v.artifacts = []; }, 'AIGOV_SEQUENCE_PRODUCER_ARTIFACT_MISSING');
run('producer proof wrong workflow path', (v) => { v.workflowRun.path = '.github/workflows/validate-mvk.yml'; }, 'AIGOV_SEQUENCE_WORKFLOW_IDENTITY_MISSING');
run('mutable workflow reference', (v) => {
  const text = Buffer.from(v.workflowFile.content, 'base64').toString('utf8').replace('actions/setup-python@ece7cb06caefa5fff74198d8649806c4678c61a1', 'actions/setup-python@v6');
  const raw = Buffer.from(text); v.workflowFile.content = raw.toString('base64'); v.workflowFile.sha = blobSha(raw);
}, 'AIGOV_SEQUENCE_MUTABLE_WORKFLOW_REFERENCE');
run('workflow omits official sequence validator', (v) => {
  const text = Buffer.from(v.workflowFile.content, 'base64').toString('utf8').replaceAll('validate_rereview_sequence.py', 'other_validator.py');
  const raw = Buffer.from(text); v.workflowFile.content = raw.toString('base64'); v.workflowFile.sha = blobSha(raw);
}, 'AIGOV_SEQUENCE_VALIDATOR_COMMAND_MISSING');
run('producer evidence for another repository', (v) => { v.workflowRun.repository.full_name = 'attacker/lookalike'; }, 'AIGOV_SEQUENCE_REPOSITORY_MISMATCH');
run('producer evidence for another PR', (v) => { v.workflowRun.pull_requests[0].number = 50; }, 'AIGOV_SEQUENCE_PR_IDENTITY_MISMATCH');
run('producer evidence for another head', (v) => { v.workflowRun.head_sha = 'd'.repeat(40); }, 'AIGOV_SEQUENCE_EXACT_HEAD_RUN_UNVERIFIED');
{
  const value = fixture();
  const first = verifySequenceProducerPayloads(value);
  const replay = verifySequenceProducerPayloads({ ...value, replayDigests: new Set([first.identity.identity_digest]) });
  cases.push({ name: 'replayed sequence producer identity', expected: 'AIGOV_SEQUENCE_PRODUCER_REPLAY', diagnostics: replay.diagnostics, pass: replay.diagnostics.includes('AIGOV_SEQUENCE_PRODUCER_REPLAY') });
}

let official = { status: 'fail', output: '' };
try {
  const inspectorRoot = process.env.PR_INSPECTOR_ROOT || '/tmp/pr-inspector-7a210453';
  const output = execFileSync('python3', ['tools/test-pr-inspector-security-capability.py', '--inspector-root', inspectorRoot], { cwd: ROOT, encoding: 'utf8' });
  official = { status: 'pass', output: output.trim() };
} catch (error) {
  official = { status: 'fail', output: `${error.stdout || ''}${error.stderr || ''}` };
}
cases.push({ name: 'official bare-boolean and lookalike capability boundary', expected: 'official pass', diagnostics: official.status === 'pass' ? [] : [official.output], pass: official.status === 'pass' });

const report = { suite: 'aigov-designated-sequence-producer', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
