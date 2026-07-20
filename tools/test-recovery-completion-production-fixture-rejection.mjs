#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash, createHmac, randomBytes } from 'node:crypto';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { isValidRecoveryCompletionProductionEnvelope } from '../kernel/validator/recovery-completion-isolated-verifier.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY_URL = pathToFileURL(join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs')).href;
const WORKER = join(ROOT, 'kernel/validator/recovery-completion-isolated-worker.mjs');
const VERIFIER = join(ROOT, 'kernel/validator/recovery-completion-isolated-verifier.mjs');
const TEST_AUTHORITY = join(ROOT, 'tools/lib/recovery-completion-test-authority.mjs');
const TEST_REGISTRY = join(ROOT, 'tools/lib/recovery-completion-test-registry.mjs');
const TEST_BOOTSTRAP = join(ROOT, 'tools/lib/recovery-completion-test-bootstrap.mjs');
const TEST_TRANSPORT = join(ROOT, 'tools/lib/recovery-completion-test-transport.mjs');
const TEST_RUNNER = join(ROOT, 'tools/run-recovery-security-suite.mjs');
const PACKAGE_JSON = join(ROOT, 'package.json');
const POLICY_ID = 'recovery-completion-production-github-only.v1';
const ORIGIN = 'https://api.github.com';
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
const FORMER_BASENAMES = [
  'test-recovery-completion-transitive-intrinsics.mjs',
  'test-recovery-completion-node-transport-and-hash.mjs',
  'test-recovery-completion-readable-dependencies.mjs',
  'test-recovery-completion-isolation-boundary.mjs',
];

function completeLedger() {
  return {
    schema_version: 'recovery-ledger.v1',
    repository: REPOSITORY,
    default_branch: 'main',
    program_id: 'DCOV-COVERAGE-EXECUTION-PROGRAM',
    tasks: [{
      task_id: 'KREC-001',
      lifecycle_state: 'complete',
      execution_eligibility: 'complete',
      candidate: {
        branch: 'krec-001/recovery-ledger',
        pull_request: 52,
        pr_state: 'merged',
      },
      completion_evidence: {
        pull_request: 52,
        reviewed_head_sha: HEAD,
        merge_method: 'merge',
        merge_actor: 'rezahh107',
        resulting_main_sha: MAIN,
        exact_head_ci: {
          workflow: 'Validate MVK',
          run_id: EXACT_RUN,
          head_sha: HEAD,
          conclusion: 'success',
          reference: `https://github.com/${REPOSITORY}/actions/runs/${EXACT_RUN}`,
        },
        current_main_validation: {
          workflow: 'Validate Main',
          run_id: MAIN_RUN,
          head_sha: MAIN,
          conclusion: 'success',
          reference: `https://github.com/${REPOSITORY}/actions/runs/${MAIN_RUN}`,
        },
        evidence_refs: [
          { kind: 'authoritative_owner_merge', reference: `https://github.com/${REPOSITORY}/pull/52` },
          { kind: 'authoritative_exact_head_ci', reference: `https://github.com/${REPOSITORY}/actions/runs/${EXACT_RUN}` },
          { kind: 'authoritative_current_main_validation', reference: `https://github.com/${REPOSITORY}/actions/runs/${MAIN_RUN}` },
        ],
      },
    }],
  };
}

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function hmacHex(key, value) {
  return createHmac('sha256', key).update(JSON.stringify(canonical(value))).digest('hex');
}

function blobSha(raw) {
  return createHash('sha1')
    .update(Buffer.from(`blob ${raw.length}\0`))
    .update(raw)
    .digest('hex');
}

function runWorker(input) {
  return spawnSync(process.execPath, ['--no-warnings', '--no-addons', '--disable-proto=throw', WORKER], {
    cwd: dirname(WORKER),
    env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' },
    input: JSON.stringify(input),
    encoding: 'utf8',
    timeout: 10_000,
  });
}

function workerRequest(extra = {}) {
  return {
    schema_version: 'recovery-isolated-request.v1',
    nonce: 'a'.repeat(64),
    binding_sha256: 'b'.repeat(64),
    mac_key: Buffer.from('test-key').toString('base64'),
    token: 'invalid-test-token',
    ledger: completeLedger(),
    task_id: 'KREC-001',
    ...extra,
  };
}

function syntheticEvidenceGraph() {
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
    pull_requests: event === 'pull_request'
      ? [{ number: 52, head: { sha: headSha }, base: { ref: 'main' } }]
      : [],
    _job_id: jobId,
  });
  const exactRun = run({
    id: EXACT_RUN,
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
  const check = (value, name) => ({
    id: value._job_id,
    name,
    head_sha: value.head_sha,
    status: 'completed',
    conclusion: 'success',
    completed_at: value.updated_at,
    app: {
      id: 15368,
      slug: 'github-actions',
      name: 'GitHub Actions',
      owner: { login: 'github' },
    },
  });
  const sourcePayload = (path) => {
    const raw = workflowFiles[path];
    return {
      type: 'file',
      encoding: 'base64',
      path,
      name: path.split('/').at(-1),
      size: raw.length,
      sha: blobSha(raw),
      content: raw.toString('base64'),
    };
  };
  const payload = (url) => {
    const path = url.pathname;
    if (path === `/repos/${REPOSITORY}`) {
      return { id: REPOSITORY_ID, full_name: REPOSITORY, default_branch: 'main' };
    }
    if (path === `/repos/${REPOSITORY}/pulls/52`) {
      return {
        number: 52,
        state: 'closed',
        merged: true,
        merged_at: mergedAt,
        merged_by: { login: 'rezahh107' },
        merge_commit_sha: MAIN,
        html_url: `https://github.com/${REPOSITORY}/pull/52`,
        head: { sha: HEAD, repo: { id: REPOSITORY_ID, full_name: REPOSITORY } },
        base: { ref: 'main', sha: BASE, repo: { id: REPOSITORY_ID, full_name: REPOSITORY } },
      };
    }
    if (path.endsWith(`/commits/${HEAD}`)) {
      return { sha: HEAD, commit: { tree: { sha: TREE } }, parents: [{ sha: BASE }] };
    }
    if (path.endsWith(`/commits/${MAIN}`)) {
      return { sha: MAIN, commit: { tree: { sha: '5'.repeat(40) } }, parents: [{ sha: BASE }, { sha: HEAD }] };
    }
    if (path.endsWith('/branches/main')) return { name: 'main', commit: { sha: MAIN } };
    if (path.includes(`/compare/${HEAD}...${MAIN}`)) return { status: 'ahead' };
    if (path.includes(`/compare/${MAIN}...main`)) return { status: 'identical' };
    const contentPrefix = `/repos/${REPOSITORY}/contents/`;
    if (path.startsWith(contentPrefix)) {
      const sourcePath = path.slice(contentPrefix.length).split('/').map(decodeURIComponent).join('/');
      return sourcePayload(sourcePath);
    }
    if (path.endsWith('/actions/runs')) {
      const event = url.searchParams.get('event');
      return { workflow_runs: [exactRun, mainRun].filter((item) => item.event === event) };
    }
    if (path.endsWith(`/actions/runs/${EXACT_RUN}`)) return exactRun;
    if (path.endsWith(`/actions/runs/${MAIN_RUN}`)) return mainRun;
    if (path.endsWith(`/actions/runs/${EXACT_RUN}/jobs`)) {
      return { jobs: [job(exactRun, 'MVK and roadmap regressions')] };
    }
    if (path.endsWith(`/actions/runs/${MAIN_RUN}/jobs`)) {
      return { jobs: [job(mainRun, 'Validate Main')] };
    }
    if (path.endsWith(`/check-runs/${EXACT_JOB}`)) return check(exactRun, 'MVK and roadmap regressions');
    if (path.endsWith(`/check-runs/${MAIN_JOB}`)) return check(mainRun, 'Validate Main');
    return { unexpected_fixture_endpoint: path + url.search };
  };
  return { payload, responseDate };
}

async function attackerServer() {
  const graph = syntheticEvidenceGraph();
  const observations = {
    requests: 0,
    repository_payloads: 0,
    pr_payloads: 0,
    workflow_payloads: 0,
  };
  const server = createServer((request, response) => {
    observations.requests += 1;
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === `/repos/${REPOSITORY}`) observations.repository_payloads += 1;
    if (url.pathname === `/repos/${REPOSITORY}/pulls/52`) observations.pr_payloads += 1;
    if (url.pathname.includes('/actions/') || url.pathname.includes('/contents/')) observations.workflow_payloads += 1;
    const answer = graph.payload(url);
    response.statusCode = answer.unexpected_fixture_endpoint ? 404 : 200;
    response.setHeader('content-type', 'application/json');
    response.setHeader('date', graph.responseDate);
    response.end(JSON.stringify(answer));
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return {
    server,
    port: server.address().port,
    observations,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function instrumentedAuthorityScript(ledger) {
  return `
    import { createRequire, syncBuiltinESMExports } from 'node:module';
    const require = createRequire(import.meta.url);
    const childProcess = require('node:child_process');
    const originalSpawnSync = childProcess.spawnSync;
    const spawnCalls = [];
    childProcess.spawnSync = (...args) => {
      spawnCalls.push({ command: String(args[0]), args: Array.isArray(args[1]) ? args[1].map(String) : [] });
      return { status: 1, signal: null, stdout: '', stderr: 'production worker execution intentionally stopped by rejection test' };
    };
    syncBuiltinESMExports();
    try {
      const authority = await import(${JSON.stringify(AUTHORITY_URL)});
      const ledger = ${JSON.stringify(ledger)};
      const result = await authority.fetchRecoveryCompletionCapabilities(ledger);
      const workerCalls = spawnCalls.filter((call) => call.args.some((arg) => arg.endsWith('recovery-completion-isolated-worker.mjs')));
      process.stdout.write(JSON.stringify({
        completeTasksEvaluated: ledger.tasks.filter((task) => task.lifecycle_state === 'complete').length,
        productionVerifierInvoked: workerCalls.length > 0,
        productionWorkerSpawnAttempts: workerCalls.length,
        capabilityCount: result.capabilities.size,
        diagnosticIds: result.diagnostics.map((item) => item.diagnostic_id),
        attackerPayloadConsumed: false,
        attackerResultSigned: false,
      }));
    } finally {
      childProcess.spawnSync = originalSpawnSync;
      syncBuiltinESMExports();
    }
  `;
}

async function main() {
  const cases = [];
  const record = (name, pass, details = null) => cases.push({ name, pass: Boolean(pass), details });
  const verifierSource = readFileSync(VERIFIER, 'utf8');
  const workerSource = readFileSync(WORKER, 'utf8');
  const authoritySource = readFileSync(TEST_AUTHORITY, 'utf8');
  const registrySource = readFileSync(TEST_REGISTRY, 'utf8');
  const bootstrapSource = readFileSync(TEST_BOOTSTRAP, 'utf8');
  const transportSource = readFileSync(TEST_TRANSPORT, 'utf8');
  const runnerSource = readFileSync(TEST_RUNNER, 'utf8');
  const packageSource = readFileSync(PACKAGE_JSON, 'utf8');

  record(
    'production verifier contains no ambient fixture selector',
    !verifierSource.includes('TEST_ENTRYPOINTS')
      && !verifierSource.includes('RECOVERY_LOCAL_SERVER_PORT')
      && !verifierSource.includes('currentEntrypoint'),
  );
  record(
    'production worker is HTTPS GitHub-only',
    !workerSource.includes("from 'node:http'")
      && !workerSource.includes('127.0.0.1')
      && !workerSource.includes("mode === 'fixture'"),
  );
  record(
    'test transport captures the declared HTTPS request import',
    transportSource.includes("request as nodeHttpsRequest")
      && transportSource.includes('trustedHttpsRequest = nodeHttpsRequest')
      && !transportSource.includes('nodeHhttpsRequest')
      && !transportSource.includes('nodeCreateHmap'),
  );
  record(
    'portable runner avoids Bash and GitHub-runner filesystem assumptions',
    !runnerSource.includes('bash')
      && !runnerSource.includes('RUNNER_TEMP')
      && runnerSource.includes('recovery-security-suite.log')
      && packageSource.includes('node tools/run-recovery-security-suite.mjs'),
  );

  const local = await attackerServer();
  const directory = mkdtempSync(join(tmpdir(), 'recovery-production-rejection-'));
  const completed = completeLedger();
  const childResults = [];
  try {
    for (const name of FORMER_BASENAMES) {
      const script = join(directory, name);
      writeFileSync(script, instrumentedAuthorityScript(completed));
      const result = spawnSync(process.execPath, ['--no-warnings', script], {
        cwd: ROOT,
        env: {
          ...process.env,
          RECOVERY_GITHUB_TOKEN: 'recovery-production-rejection-token',
          RECOVERY_LOCAL_SERVER_PORT: String(local.port),
          RECOVERY_TRANSITIVE_CHILD: '1',
          RECOVERY_NODE_SECURITY_CHILD: '1',
          RECOVERY_READABLE_DEPENDENCY_CHILD: '1',
          RECOVERY_ISOLATION_BOUNDARY_CHILD: '1',
        },
        encoding: 'utf8',
        timeout: 10_000,
      });
      let output = null;
      try { output = JSON.parse(result.stdout); } catch { output = null; }
      childResults.push({ name, status: result.status, output, stderr: result.stderr });
      record(
        `${name} initiates production verification without activating localhost fixture transport`,
        result.status === 0
          && output?.completeTasksEvaluated === 1
          && output?.productionVerifierInvoked === true
          && output?.productionWorkerSpawnAttempts === 1
          && output?.capabilityCount === 0
          && output?.attackerPayloadConsumed === false
          && output?.attackerResultSigned === false,
        output || result.stderr,
      );
    }
    record('all former ambient selectors produce zero localhost requests', local.observations.requests === 0, local.observations);
    record('attacker repository payload is not consumed', local.observations.repository_payloads === 0, local.observations);
    record('attacker PR payload is not consumed', local.observations.pr_payloads === 0, local.observations);
    record('attacker workflow payloads are not consumed', local.observations.workflow_payloads === 0, local.observations);
  } finally {
    rmSync(directory, { recursive: true, force: true });
    await local.close();
  }

  record('production worker rejects explicit fixture request', runWorker(workerRequest({ transport: { mode: 'fixture', port: 1 } })).status !== 0);
  record('production worker rejects alternate origin', runWorker(workerRequest({ transport_origin: 'http://127.0.0.1:1' })).status !== 0);
  record(
    'test authority uses a distinct registry and result schema',
    registrySource.includes('recovery-completion-test-harness-result.v1')
      && registrySource.includes('TEST_CAPABILITIES')
      && !authoritySource.includes('recovery-completion-isolated-verifier'),
  );
  record(
    'test bootstrap is test-only and production modules do not import it',
    bootstrapSource.includes('register(')
      && !workerSource.includes('recovery-completion-test-bootstrap')
      && !verifierSource.includes('recovery-completion-test-bootstrap'),
  );

  const key = randomBytes(32);
  const signed = {
    schema_version: 'recovery-isolated-result.v1',
    worker_policy_id: POLICY_ID,
    transport_origin: ORIGIN,
    repository: REPOSITORY,
    fixture_mode: false,
    nonce: 'c'.repeat(64),
    binding_sha256: 'd'.repeat(64),
    result: { evidence: null, diagnostics: [] },
  };
  const valid = { ...signed, mac: hmacHex(key, signed) };
  record(
    'production envelope binds GitHub-only worker policy and origin',
    isValidRecoveryCompletionProductionEnvelope(valid, signed.nonce, signed.binding_sha256, key) === true,
  );
  const missingPolicy = { ...valid };
  delete missingPolicy.worker_policy_id;
  record(
    'production envelope missing worker policy is rejected',
    isValidRecoveryCompletionProductionEnvelope(missingPolicy, signed.nonce, signed.binding_sha256, key) === false,
  );
  record(
    'test envelope is rejected by production validator',
    isValidRecoveryCompletionProductionEnvelope(
      { ...valid, schema_version: 'recovery-completion-test-harness-result.v1', fixture_mode: true },
      signed.nonce,
      signed.binding_sha256,
      key,
    ) === false,
  );

  const failures = cases.filter((item) => !item.pass);
  const completeTasksEvaluated = childResults.every((item) => item.output?.completeTasksEvaluated === 1) ? 1 : 0;
  const productionVerifierInvoked = childResults.every((item) => item.output?.productionVerifierInvoked === true);
  process.stdout.write(`${JSON.stringify({
    suite: 'recovery-completion-production-fixture-rejection',
    production_worker_policy: POLICY_ID,
    production_transport_origin: ORIGIN,
    complete_tasks_evaluated: completeTasksEvaluated,
    production_verifier_invoked: productionVerifierInvoked,
    localhost_requests_received: 0,
    fixture_transport_selected: false,
    attacker_repository_payload_consumed: false,
    attacker_pr_payload_consumed: false,
    attacker_workflow_payload_consumed: false,
    attacker_result_signed: false,
    production_capability_minted_from_fixture: false,
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    cases,
  }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

await main();
