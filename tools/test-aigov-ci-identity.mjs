#!/usr/bin/env node
import { validateFinalizedEvidenceArtifactFiles, verifyCiPayloads } from './lib/aigov-ci-evidence.mjs';

const repository = 'rezahh107/EV4-Decision-Kernel';
const repositoryId = 1292378784;
const prNumber = 49;
const headSha = 'a'.repeat(40);

function payloads() {
  const workflowRun = {
    id: 2001, workflow_id: 1001, name: 'Validate MVK', path: '.github/workflows/validate-mvk.yml', event: 'pull_request', status: 'completed', conclusion: 'success', head_sha: headSha,
    head_branch: 'governance/aigov-v2-batch-a-enforcement', run_attempt: 1, created_at: '2026-07-15T09:00:00Z', updated_at: '2026-07-15T09:40:00Z',
    html_url: `https://github.com/${repository}/actions/runs/2001`, url: `https://api.github.com/repos/${repository}/actions/runs/2001`, jobs_url: 'https://api.github.com/jobs', artifacts_url: 'https://api.github.com/artifacts',
    repository: { id: repositoryId, full_name: repository }, head_repository: { id: repositoryId, full_name: repository },
    pull_requests: [{ number: prNumber, head: { sha: headSha, ref: 'governance/aigov-v2-batch-a-enforcement' }, base: { sha: 'b'.repeat(40), ref: 'main' } }],
  };
  const names = ['External Coverage Trust Gate / Verify authoritative Coverage trust identity', 'Validate MVK', 'MVK and roadmap regressions'];
  const jobs = names.map((name, index) => ({ id: 3001 + index, name, head_sha: headSha, status: 'completed', conclusion: 'success', check_run_url: `https://api.github.com/repos/${repository}/check-runs/${3001 + index}`, html_url: `https://github.com/${repository}/actions/runs/2001/job/${3001 + index}`, started_at: `2026-07-15T09:${index}0:00Z`, completed_at: `2026-07-15T09:${index}9:00Z` }));
  const checkRuns = jobs.map((job) => ({ id: job.id, head_sha: headSha, status: 'completed', conclusion: 'success', details_url: job.html_url, external_id: `check-${job.id}`, app: { id: 15368, slug: 'github-actions', name: 'GitHub Actions', owner: { login: 'github' } } }));
  const artifacts = [{ id: 4001, name: 'aigov-batch-a-scope-disclosure', expired: false, digest: `sha256:${'e'.repeat(64)}`, url: `https://api.github.com/repos/${repository}/actions/artifacts/4001`, archive_download_url: `https://api.github.com/repos/${repository}/actions/artifacts/4001/zip`, created_at: '2026-07-15T09:29:00Z', expires_at: '2026-07-29T09:29:00Z', workflow_run: { id: 2001, head_sha: headSha, head_repository_id: repositoryId } }];
  return { workflowRun, jobs, checkRuns, artifacts };
}

const cases = [];
function run(name, mutate, expected) {
  const values = payloads();
  mutate(values);
  const result = verifyCiPayloads({ repository, repositoryId, prNumber, headSha, ...values, observedAt: '2026-07-15T09:41:00Z' });
  cases.push({ name, expected, pass: expected === null ? result.diagnostics.length === 0 && Boolean(result.identity) : result.diagnostics.some((item) => item.includes(expected)), diagnostics: result.diagnostics, identity_digest: result.identity?.identity_digest || null });
}

run('authoritative PR-head CI identity', () => {}, null);
run('stale CI tested SHA', ({ workflowRun }) => { workflowRun.head_sha = 'f'.repeat(40); }, 'AIGOV_CI_TESTED_SHA_MISMATCH');
run('merge-ref CI substituted for PR-head CI', ({ workflowRun }) => { workflowRun.head_branch = 'refs/pull/49/merge'; }, 'AIGOV_CI_SYNTHETIC_MERGE_REF');
run('same-name check from another producer', ({ checkRuns }) => { checkRuns[2].app = { id: 999, slug: 'lookalike', name: 'GitHub Actions', owner: { login: 'attacker' } }; }, 'AIGOV_CI_CHECK_PRODUCER_MISMATCH');
run('missing run identity', ({ workflowRun }) => { delete workflowRun.workflow_id; }, 'AIGOV_CI_WORKFLOW_IDENTITY_MISSING');
run('missing job identity', ({ jobs }) => { jobs.pop(); }, 'AIGOV_CI_JOB_IDENTITY_MISSING');
run('missing artifact identity', ({ artifacts }) => { artifacts[0].digest = null; }, 'AIGOV_CI_ARTIFACT_IDENTITY_MISSING');
run('artifact from another run', ({ artifacts }) => { artifacts[0].workflow_run.id = 9999; }, 'AIGOV_CI_ARTIFACT_RUN_MISMATCH');

{
  const evidence = {
    manifest_state: 'executed_exact_head_ci_verified',
    evidence_items: [{ evidence_id: 'command-log', status: 'passed', evidence_source: 'github_actions', github_actions: { artifact_id: 4001, filename: 'aigov-command-logs/command-log.log', hash_scope: 'final_file_bytes' } }],
  };
  const diagnostics = validateFinalizedEvidenceArtifactFiles(evidence, new Map([[4001, new Set()]]));
  cases.push({ name: 'finalized evidence claimed but absent from referenced artifact', expected: 'AIGOV_FINALIZED_EVIDENCE_FILE_ABSENT:command-log', pass: diagnostics.includes('AIGOV_FINALIZED_EVIDENCE_FILE_ABSENT:command-log'), diagnostics });
}

const report = { suite: 'aigov-exact-head-ci-identity', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
