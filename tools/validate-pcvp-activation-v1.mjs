import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  EXPECTED_PREREQUISITES,
  validateActivationRecord,
} from '../kernel/validator/pcvp-activation-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const RECORD_PATH = path.join(ROOT, 'kernel/pcvp/pcvp-activation.v1.json');
const SCHEMA_PATH = path.join(ROOT, 'kernel/pcvp/pcvp-activation.v1.schema.json');
const DEFAULT_SCOPE = path.join(ROOT, 'planning/governance/scopes/pcvp-v1-activation.scope.json');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function flag(name) {
  return process.argv.includes(name);
}

function fail(message) {
  throw new Error(message);
}

function sha256Text(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex');
}

function sorted(values) {
  return [...values].sort();
}

async function githubJson(endpoint) {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || '';
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ev4-pcvp-activation-validator',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`https://api.github.com/${endpoint}`, { headers });
  if (!response.ok) {
    fail(`GitHub API ${endpoint} failed: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

async function verifyRemotePrerequisites(record) {
  for (const prerequisite of record.prerequisites) {
    const expected = EXPECTED_PREREQUISITES[prerequisite.role];
    if (!expected) fail(`unexpected prerequisite role: ${prerequisite.role}`);

    const pull = await githubJson(`repos/${prerequisite.repository}/pulls/${prerequisite.pull_request}`);
    if (pull.merged_at === null) fail(`${prerequisite.role} PR is not merged`);
    if (pull.head?.sha !== prerequisite.exact_head_sha) {
      fail(`${prerequisite.role} exact head drift: ${pull.head?.sha} != ${prerequisite.exact_head_sha}`);
    }
    if (pull.merge_commit_sha !== prerequisite.merge_commit_sha) {
      fail(`${prerequisite.role} merge commit drift: ${pull.merge_commit_sha} != ${prerequisite.merge_commit_sha}`);
    }

    for (const runId of prerequisite.evidence_run_ids) {
      const run = await githubJson(`repos/${prerequisite.repository}/actions/runs/${runId}`);
      if (run.head_sha !== prerequisite.exact_head_sha) {
        fail(`${prerequisite.role} run ${runId} head mismatch: ${run.head_sha} != ${prerequisite.exact_head_sha}`);
      }
      if (run.status !== 'completed' || run.conclusion !== 'success') {
        fail(`${prerequisite.role} run ${runId} is not successful`);
      }
    }
  }
}

const record = readJson(RECORD_PATH);
const schema = readJson(SCHEMA_PATH);
const validation = validateActivationRecord(record, schema);
if (validation.result !== 'PASS') {
  console.error(JSON.stringify(validation, null, 2));
  process.exit(1);
}

const base = option('--base');
const head = option('--head');
const scopePath = option('--scope') ? path.resolve(option('--scope')) : DEFAULT_SCOPE;
if ((base && !head) || (!base && head)) fail('--base and --head must be supplied together');

if (base && head) {
  const scope = readJson(scopePath);
  const actual = execFileSync('git', ['diff', '--name-only', `${base}..${head}`], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim().split(/\r?\n/u).filter(Boolean).sort();
  const expected = sorted(scope.committed);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`bounded activation scope mismatch\nexpected=${JSON.stringify(expected)}\nactual=${JSON.stringify(actual)}`);
  }
  const observedHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (observedHead !== head) fail(`exact head mismatch: ${observedHead} != ${head}`);
}

const scope = readJson(scopePath);
const expectedRevision = `sha256:${sha256Text(sorted(scope.committed).join('\n') + '\n')}`;
if (scope.scope_revision !== expectedRevision) {
  fail(`scope revision mismatch: ${scope.scope_revision} != ${expectedRevision}`);
}
if (scope.base_sha !== '03336312f6c3fcc4c315e56592bac3bac0bf7465') {
  fail('activation scope base SHA mismatch');
}
if (scope.activation_impact !== 'ARCHITECT_TO_PROJECT_GATE_TO_CE') {
  fail('activation scope impact mismatch');
}

if (flag('--verify-remote')) {
  await verifyRemotePrerequisites(record);
}

console.log(JSON.stringify({
  result: 'PASS',
  activation_id: record.activation_id,
  official_adoption_authorization: record.official_adoption_authorization,
  enabled_edges: record.activation_scope.enabled_edges,
  disabled_edges: record.activation_scope.disabled_edges,
  full_rollout_authorized: record.full_rollout_authorized,
  remote_prerequisites_verified: flag('--verify-remote'),
}, null, 2));
