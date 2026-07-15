#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fetchExactHeadCiIdentity } from './lib/aigov-ci-evidence.mjs';
import { fetchSequenceProducerIdentity } from './lib/aigov-sequence-producer.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const PR_NUMBER = 49;

function parseArgs(argv) {
  const result = { head: null, attempts: 30, intervalMs: 10_000 };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--head') result.head = argv[++index];
    else if (argv[index] === '--attempts') result.attempts = Number(argv[++index]);
    else if (argv[index] === '--interval-ms') result.intervalMs = Number(argv[++index]);
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.head || '') || !Number.isInteger(result.attempts) || result.attempts < 1 || !Number.isInteger(result.intervalMs) || result.intervalMs < 1_000) throw new Error('Exact head and valid wait bounds are required.');
  return result;
}

async function githubJson(apiPath) {
  const url = `https://api.github.com${apiPath}`;
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ev4-aigov-source-ci-waiter', 'X-GitHub-Api-Version': '2022-11-28' }, redirect: 'error' });
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${url}`);
  return { value: await response.json(), observedAt: new Date().toISOString(), url };
}

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function main() {
  const input = parseArgs(process.argv.slice(2));
  const scope = JSON.parse(readFileSync('planning/governance/scopes/aigov-v2-batch-a.scope.json', 'utf8'));
  let ready = false;
  for (let attempt = 1; attempt <= input.attempts; attempt += 1) {
    const runs = await githubJson(`/repos/${REPOSITORY}/actions/runs?head_sha=${input.head}&event=pull_request&status=completed&per_page=100`);
    const successful = new Set((runs.value?.workflow_runs || []).filter((run) => run.head_sha === input.head && run.conclusion === 'success').map((run) => `${run.name}:${run.path}`));
    ready = successful.has('Validate MVK:.github/workflows/validate-mvk.yml') && successful.has('Validate rereview sequence enforcement:.github/workflows/validate-rereview-sequence.yml');
    if (ready) break;
    if (attempt < input.attempts) await delay(input.intervalMs);
  }
  if (!ready) throw new Error('AIGOV_SOURCE_CI_WAIT_EXHAUSTED');
  const [ci, sequence] = await Promise.all([
    fetchExactHeadCiIdentity({ githubJson, repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: input.head }),
    fetchSequenceProducerIdentity({ githubJson, repository: REPOSITORY, repositoryId: REPOSITORY_ID, prNumber: PR_NUMBER, headSha: input.head, scopeRevision: scope.scope_revision }),
  ]);
  if (!ci.identity || !sequence.identity) throw new Error('AIGOV_SOURCE_CI_AUTHORITATIVE_IDENTITY_UNAVAILABLE');
  console.log(JSON.stringify({ status: 'pass', head_sha: input.head, ci_run_id: ci.identity.run.run_id, sequence_run_id: sequence.identity.run.run_id, ci_completed_at: ci.identity.completed_at, sequence_completed_at: sequence.identity.completed_at }, null, 2));
}

main().catch((error) => { console.error(error.message); process.exitCode = 1; });
