#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  createRecoveryCompletionVerifier,
  verifyRecoveryCompletionEvidence,
} from '../kernel/validator/recovery-completion-verifier-hardened.mjs';
import { createRecoveryHistoricalPrAssociationFetch } from '../kernel/validator/recovery-pr-association-fetch.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const BASE = '1'.repeat(40);
const HEAD = '2'.repeat(40);
const MAIN = '3'.repeat(40);
const TREE = '4'.repeat(40);
const EXACT_RUN = 1001;
const MAIN_RUN = 1002;
const EXACT_JOB = 2001;
const MAIN_JOB = 2002;

function ledgerFor(prNumber = 52, exactRunId = EXACT_RUN) {
  return {
    schema_version: 'recovery-ledger.v1',
    repository: REPOSITORY,
    default_branch: 'main',
    program_id: 'DCOV-COVERAGE-EXECUTION-PROGRAM',
    tasks: [{
      task_id: 'KREC-001',
      lifecycle_state: 'complete',
      execution_eligibility: 'complete',
      candidate: { branch: 'krec-001/recovery-ledger', pull_request: prNumber, pr_state: 'merged' },
      completion_evidence: {
        pull_request: prNumber,
        reviewed_head_sha: HEAD,
        merge_method: 'merge',
        merge_actor: 'rezahh107',
        resulting_main_sha: MAIN,
        exact_head_ci: {
          workflow: 'Validate MVK',
          run_id: exactRunId,
          head_sha: HEAD,
          conclusion: 'success',
          reference: `https://github.com/${REPOSITORY}/actions/runs/${exactRunId}`,
        },
        current_main_validation: {
          workflow: 'Validate Main',
          run_id: MAIN_RUN,
          head_sha: MAIN,
          conclusion: 'success',
          reference: `https://github.com/${REPOSITORY}/actions/runs/${MAIN_RUN}`,
        },
        evidence_refs: [
          { kind: 'authoritative_owner_merge', reference: `https://github.com/${REPOSITORY}/pull/${prNumber}` },
          { kind: 'authoritative_exact_head_ci', reference: `https://github.com/${REPOSITORY}/actions/runs/${exactRunId}` },
          { kind: 'authoritative_current_main_validation', reference: `https://github.com/${REPOSITORY}/actions/runs/${MAIN_RUN}` },
        ],
      },
    }],
  };
}

function blobSha(raw) {
  return createHash('sha1')
    .update(Buffer.from(`blob ${raw.length}\0`))
    .update(raw)
    .digest('hex');
}

function association({
  number = 52,
  headSha = HEAD,
  baseRef = 'main',
  repository = REPOSITORY,
  repositoryId = REPOSITORY_ID,
  state = 'closed',
} = {}) {
  return {
    number,
    state,
    head: { sha: headSha, repo: { id: repositoryId, full_name: repository } },
    base: { ref: baseRef, repo: { id: repositoryId, full_name: repository } },
  };
}

function evidenceGraph({
  direct = true,
  associations = [association()],
  exactRunId = EXACT_RUN,
  exactRunPayloadId = EXACT_RUN,
  exactAppId = 15368,
  prNumber = 52,
  prState = 'closed',
  prMerged = true,
  prHead = HEAD,
  prBase = 'main',
  prRepository = REPOSITORY,
  prRepositoryId = REPOSITORY_ID,
} = {}) {
  const workflowFiles = {
    '.github/workflows/validate-mvk.yml': readFileSync(join(ROOT, '.github/workflows/validate-mvk.yml')),
    '.github/workflows/validate-main.yml': readFileSync(join(ROOT, '.github/workflows/validate-main.yml')),
  };
  const now = Date.now();
  const responseDate = new Date(now).toUTCString();
  const exactCompleted = new Date(now - 30_000).toISOString();
  const mergedAt = new Date(now - 20_000).toISOString();
  const mainCompleted = new Date(now - 10_000).toISOString();
  const run = ({ id, workflowId, name, path, event, headSha, completedAt, jobId }) => ({
    id,
    workflow_id: workflowId,
    run_attempt: 1,
    name,
    path,
    event,
    head_sha: headSha,
    head_branch: event === 'push' ? 'main' : 'krec-001/recovery-ledger',
    status: 'completed',
    conclusion: 'success',
    updated_at: completedAt,
    html_url: `https://github.com/${REPOSITORY}/actions/runs/${id}`,
    repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
    head_repository: { id: REPOSITORY_ID, full_name: REPOSITORY },
    pull_requests: event === 'pull_request' && direct
      ? [{ number: 52, head: { sha: headSha }, base: { ref: 'main' } }]
      : [],
    _job_id: jobId,
  });
  const exactRun = run({
    id: exactRunPayloadId,
    workflowId: 309028718,
    name: 'Validate MVK',
    path: '.github/workflows/validate-mvk.yml',
    event: 'pull_request',
    headSha: HEAD,
    completedAt: exactCompleted,
    jobId: EXACT_JOB,
  });
  const mainRun = run({
    id: MAIN_RUN,
    workflowId: 312952795,
    name: 'Validate Main',
    path: '.github/workflows/validate-main.yml',
    event: 'push',
    headSha: MAIN,
    completedAt: mainCompleted,
    jobId: MAIN_JOB,
  });
  const job = (value, name) => ({
    id: value._job_id,
    run_id: value.id,
    name,
    head_sha: value.head_sha,
    status: 'completed',
    conclusion: 'success',
    completed_at: value.updated_at,
  });
  const check = (value, name, appId = 15368) => ({
    id: value._job_id,
    name,
    head_sha: value.head_sha,
    status: 'completed',
    conclusion: 'success',
    completed_at: value.updated_at,
    app: {
      id: appId,
      slug: appId === 15368 ? 'github-actions' : 'untrusted-app',
      name: appId === 15368 ? 'GitHub Actions' : 'Untrusted App',
      owner: { login: appId === 15368 ? 'github' : 'attacker' },
    },
  });
  const sourcePayload = (sourcePath) => {
    const raw = workflowFiles[sourcePath];
    return {
      type: 'file',
      encoding: 'base64',
      path: sourcePath,
      name: sourcePath.split('/').at(-1),
      size: raw.length,
      sha: blobSha(raw),
      content: raw.toString('base64'),
    };
  };
  const pr = {
    number: prNumber,
    state: prState,
    merged: prMerged,
    merged_at: mergedAt,
    merged_by: { login: 'rezahh107' },
    merge_commit_sha: MAIN,
    html_url: `https://github.com/${REPOSITORY}/pull/${prNumber}`,
    head: { sha: prHead, repo: { id: prRepositoryId, full_name: prRepository } },
    base: { ref: prBase, sha: BASE, repo: { id: prRepositoryId, full_name: prRepository } },
  };

  async function fetchImpl(rawUrl) {
    const url = new URL(rawUrl);
    const path = url.pathname;
    let payload;
    let status = 200;
    if (path === `/repos/${REPOSITORY}`) {
      payload = { id: REPOSITORY_ID, full_name: REPOSITORY, default_branch: 'main' };
    } else if (path === `/repos/${REPOSITORY}/pulls/${prNumber}`) {
      payload = pr;
    } else if (path === `/repos/${REPOSITORY}/pulls/52` && prNumber !== 52) {
      payload = { message: 'not found' };
      status = 404;
    } else if (path.endsWith(`/commits/${HEAD}/pulls`)) {
      payload = associations;
    } else if (path.endsWith(`/commits/${HEAD}`)) {
      payload = { sha: HEAD, commit: { tree: { sha: TREE } }, parents: [{ sha: BASE }] };
    } else if (path.endsWith(`/commits/${MAIN}`)) {
      payload = { sha: MAIN, commit: { tree: { sha: '5'.repeat(40) } }, parents: [{ sha: BASE }, { sha: HEAD }] };
    } else if (path.endsWith('/branches/main')) {
      payload = { name: 'main', commit: { sha: MAIN } };
    } else if (path.includes(`/compare/${HEAD}...${MAIN}`)) {
      payload = { status: 'ahead' };
    } else if (path.includes(`/compare/${MAIN}...main`)) {
      payload = { status: 'identical' };
    } else if (path.startsWith(`/repos/${REPOSITORY}/contents/`)) {
      const sourcePath = path.slice(`/repos/${REPOSITORY}/contents/`.length)
        .split('/').map(decodeURIComponent).join('/');
      payload = sourcePayload(sourcePath);
    } else if (path === `/repos/${REPOSITORY}/actions/runs/${exactRunId}`) {
      payload = exactRun;
    } else if (path === `/repos/${REPOSITORY}/actions/runs/${MAIN_RUN}`) {
      payload = mainRun;
    } else if (path.endsWith('/actions/runs')) {
      const event = url.searchParams.get('event');
      payload = { workflow_runs: [exactRun, mainRun].filter((item) => item.event === event) };
    } else if (path === `/repos/${REPOSITORY}/actions/runs/${exactRunId}/jobs`) {
      payload = { jobs: [job(exactRun, 'MVK and roadmap regressions')] };
    } else if (path === `/repos/${REPOSITORY}/actions/runs/${MAIN_RUN}/jobs`) {
      payload = { jobs: [job(mainRun, 'Validate Main')] };
    } else if (path === `/repos/${REPOSITORY}/check-runs/${EXACT_JOB}`) {
      payload = check(exactRun, 'MVK and roadmap regressions', exactAppId);
    } else if (path === `/repos/${REPOSITORY}/check-runs/${MAIN_JOB}`) {
      payload = check(mainRun, 'Validate Main');
    } else {
      payload = { unexpected_fixture_endpoint: `${path}${url.search}` };
      status = 404;
    }
    return Object.freeze({
      ok: status >= 200 && status < 300,
      status,
      headers: Object.freeze({ get: (name) => String(name).toLowerCase() === 'date' ? responseDate : null }),
      json: async () => structuredClone(payload),
    });
  }
  return { fetchImpl, now };
}

async function verify(config = {}, ledger = ledgerFor(config.prNumber ?? 52, config.exactRunId ?? EXACT_RUN)) {
  const graph = evidenceGraph(config);
  const wrapped = createRecoveryHistoricalPrAssociationFetch(graph.fetchImpl, {
    repository: REPOSITORY,
    repositoryId: REPOSITORY_ID,
    defaultBranch: 'main',
    task: ledger.tasks[0],
  });
  const session = createRecoveryCompletionVerifier({
    fetchImpl: wrapped,
    token: 'test-token',
    now: () => graph.now,
  });
  return verifyRecoveryCompletionEvidence(ledger, 'KREC-001', { session });
}

const cases = [];
const record = (name, pass, result) => cases.push({
  name,
  pass: Boolean(pass),
  diagnostic_ids: (result?.diagnostics || []).map((item) => item.diagnostic_id),
});
const rejects = (result, code) => result.evidence === null
  && result.diagnostics.some((item) => item.diagnostic_id === code);

const direct = await verify({ direct: true });
record('direct run.pull_requests association', direct.diagnostics.length === 0 && Boolean(direct.evidence), direct);

const fallback = await verify({ direct: false, associations: [association()] });
record('one authoritative commit-to-PR fallback association', fallback.diagnostics.length === 0 && Boolean(fallback.evidence), fallback);

for (const [name, config] of [
  ['no commit-to-PR association', { direct: false, associations: [] }],
  ['ambiguous commit-to-PR associations', { direct: false, associations: [association(), association()] }],
  ['association to wrong PR', { direct: false, associations: [association({ number: 53 })] }],
  ['association to wrong Head', { direct: false, associations: [association({ headSha: '9'.repeat(40) })] }],
  ['association to wrong base', { direct: false, associations: [association({ baseRef: 'release' })] }],
  ['association to wrong repository', { direct: false, associations: [association({ repository: 'attacker/fork', repositoryId: 1 })] }],
]) {
  const result = await verify(config);
  record(name, rejects(result, 'RECOVERY_LEDGER_EXACT_HEAD_RUN_PR_MISMATCH'), result);
}

const currentPrSubstitution = await verify({
  direct: false,
  associations: [association({ number: 53 })],
  prNumber: 53,
  prState: 'open',
  prMerged: false,
  prHead: '8'.repeat(40),
}, ledgerFor(53));
record(
  'current PR 53 cannot replace historical PR 52 evidence',
  rejects(currentPrSubstitution, 'RECOVERY_LEDGER_GITHUB_PR_IDENTITY_MISMATCH'),
  currentPrSubstitution,
);

const wrongRun = await verify({ direct: true, exactRunId: 9999, exactRunPayloadId: EXACT_RUN }, ledgerFor(52, 9999));
record(
  'wrong workflow run ID rejected',
  wrongRun.evidence === null && wrongRun.diagnostics.length > 0,
  wrongRun,
);

const wrongApp = await verify({ direct: true, exactAppId: 999 });
record('wrong GitHub Actions App rejected', rejects(wrongApp, 'RECOVERY_LEDGER_WORKFLOW_PRODUCER_MISMATCH'), wrongApp);

const report = {
  suite: 'recovery-historical-pr-association',
  status: cases.every((item) => item.pass) ? 'pass' : 'fail',
  cases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
