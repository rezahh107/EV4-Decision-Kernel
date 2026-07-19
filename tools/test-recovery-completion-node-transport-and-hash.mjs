#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY_URL = pathToFileURL(
  join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs'),
).href;
const PRIMORDIALS_URL = pathToFileURL(
  join(ROOT, 'kernel/validator/recovery-primordials.mjs'),
).href;
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
const TOKEN = 'node-transport-and-hash-token';
const ATTACKER_BODY = '{"attacker_selected":true}';

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function sha256Canonical(value) {
  return createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
}

function blobSha(raw) {
  return createHash('sha1')
    .update(Buffer.from(`blob ${raw.length}\0`))
    .update(raw)
    .digest('hex');
}

function completedLedger() {
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

function writeLoader(directory) {
  const shimPath = join(directory, 'node-https-local-destination.mjs');
  const loaderPath = join(directory, 'loader.mjs');
  writeFileSync(shimPath, `
    import { request as httpRequest } from 'node:http';
    import { URL } from 'node:url';
    export class Agent {
      constructor(options = {}) { this.options = options; }
    }
    export function request(input, options = {}, callback) {
      const source = input instanceof URL ? input : new URL(String(input));
      const destination = new URL('http://127.0.0.1:' + process.env.RECOVERY_LOCAL_SERVER_PORT);
      destination.pathname = source.pathname;
      destination.search = source.search;
      return httpRequest(destination, {
        method: options.method || 'GET',
        headers: options.headers,
      }, callback);
    }
  `);
  writeFileSync(loaderPath, `
    const shimUrl = ${JSON.stringify(pathToFileURL(shimPath).href)};
    export async function resolve(specifier, context, nextResolve) {
      if (specifier === 'node:https') return { url: shimUrl, shortCircuit: true };
      return nextResolve(specifier, context);
    }
  `);
  return loaderPath;
}

function fixtureState(mode) {
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

  function sourcePayload(path) {
    const original = workflowFiles[path];
    const altered = Buffer.concat([original, Buffer.from('\n# attacker-selected-workflow\n')]);
    const raw = mode === 'altered-original-sha' || mode === 'altered-correct-sha'
      ? altered
      : original;
    const reportedSha = mode === 'altered-original-sha' ? blobSha(original) : blobSha(raw);
    return {
      type: 'file',
      encoding: 'base64',
      path,
      name: path.split('/').at(-1),
      size: raw.length,
      sha: reportedSha,
      content: raw.toString('base64'),
    };
  }

  function payload(url) {
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
        base: {
          ref: 'main',
          sha: BASE,
          repo: { id: REPOSITORY_ID, full_name: REPOSITORY },
        },
      };
    }
    if (path.endsWith(`/commits/${HEAD}`)) {
      return { sha: HEAD, commit: { tree: { sha: TREE } }, parents: [{ sha: BASE }] };
    }
    if (path.endsWith(`/commits/${MAIN}`)) {
      return {
        sha: MAIN,
        commit: { tree: { sha: '5'.repeat(40) } },
        parents: [{ sha: BASE }, { sha: HEAD }],
      };
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
    if (path.endsWith(`/check-runs/${EXACT_JOB}`)) {
      return check(exactRun, 'MVK and roadmap regressions');
    }
    if (path.endsWith(`/check-runs/${MAIN_JOB}`)) return check(mainRun, 'Validate Main');
    return { unexpected_fixture_endpoint: path + url.search };
  }

  return { payload, responseDate };
}

async function createFixtureServer(mode) {
  const state = fixtureState(mode);
  const server = createServer((request, response) => {
    if (mode === 'outage') {
      request.socket.destroy();
      return;
    }
    const answer = state.payload(new URL(request.url, 'http://127.0.0.1'));
    const send = () => {
      response.statusCode = answer.unexpected_fixture_endpoint ? 404 : 200;
      response.setHeader('content-type', 'application/json');
      response.setHeader('date', state.responseDate);
      response.end(JSON.stringify(answer));
    };
    if (mode === 'delayed-valid') setTimeout(send, 60);
    else send();
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return server;
}

function childOutput(processResult) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    processResult.stdout.on('data', (chunk) => { stdout += chunk; });
    processResult.stderr.on('data', (chunk) => { stderr += chunk; });
    processResult.on('close', (status, signal) => {
      let output = null;
      try { output = JSON.parse(stdout); } catch { output = null; }
      resolve({ status, signal, stdout, stderr, output });
    });
  });
}

async function runScenario(loaderPath, scenario, serverMode = 'valid') {
  const server = await createFixtureServer(serverMode);
  const address = server.address();
  const child = spawn(
    process.execPath,
    ['--no-warnings', '--experimental-loader', loaderPath, fileURLToPath(import.meta.url)],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        RECOVERY_GITHUB_TOKEN: TOKEN,
        RECOVERY_NODE_SECURITY_CHILD: '1',
        RECOVERY_NODE_SECURITY_SCENARIO: scenario,
        RECOVERY_LOCAL_SERVER_PORT: String(address.port),
        RECOVERY_EXPECTED_DIGEST_A: sha256Canonical({ value: 'A' }),
        RECOVERY_EXPECTED_DIGEST_B: sha256Canonical({ value: 'B' }),
      },
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  try {
    return await childOutput(child);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

async function childMain() {
  const scenario = process.env.RECOVERY_NODE_SECURITY_SCENARIO;
  const { EventEmitter } = await import('node:events');
  const { ClientRequest, IncomingMessage } = await import('node:http');
  const { Readable } = await import('node:stream');
  const { createHash: childCreateHash } = await import('node:crypto');
  const authority = await import(AUTHORITY_URL);
  const { recoveryPrimordials: p } = await import(PRIMORDIALS_URL);

  const hashPrototype = Object.getPrototypeOf(childCreateHash('sha256'));
  const originals = {
    emit: EventEmitter.prototype.emit,
    readableOn: Readable.prototype.on,
    hashUpdate: hashPrototype.update,
    hashDigest: hashPrototype.digest,
  };
  const counters = {
    authorityEmit: 0,
    readableOn: 0,
    hashUpdate: 0,
    hashDigest: 0,
    attackerBodyInjected: false,
    attackerErrorSuppressed: false,
  };

  function installEventMutations() {
    EventEmitter.prototype.emit = function substitutedEmit(event, ...args) {
      if (this instanceof ClientRequest || this instanceof IncomingMessage) {
        counters.authorityEmit += 1;
        if (this instanceof ClientRequest && event === 'response') {
          const response = args[0];
          const result = Reflect.apply(originals.emit, this, [event, ...args]);
          counters.attackerBodyInjected = true;
          Reflect.apply(originals.emit, response, ['data', Buffer.from(ATTACKER_BODY)]);
          Reflect.apply(originals.emit, response, ['end']);
          return result;
        }
        if (event === 'error') {
          counters.attackerErrorSuppressed = true;
          return true;
        }
        if (event === 'data') return Reflect.apply(originals.emit, this, ['end']);
      }
      return Reflect.apply(originals.emit, this, [event, ...args]);
    };
  }

  function installReadableMutation() {
    Readable.prototype.on = function substitutedReadableOn(event, listener) {
      if (this instanceof IncomingMessage) counters.readableOn += 1;
      return Reflect.apply(EventEmitter.prototype.on, this, [event, listener]);
    };
  }

  function installHashUpdateMutation() {
    hashPrototype.update = function substitutedHashUpdate() {
      counters.hashUpdate += 1;
      return this;
    };
  }

  function installHashDigestMutation() {
    hashPrototype.digest = function substitutedHashDigest(encoding) {
      counters.hashDigest += 1;
      return encoding === 'hex' ? '0'.repeat(64) : Buffer.alloc(32);
    };
  }

  if (scenario === 'emit-injection' || scenario === 'outage-substitutions') installEventMutations();
  if (scenario === 'readable-on' || scenario === 'outage-substitutions') installReadableMutation();
  if (scenario === 'hash-update') installHashUpdateMutation();
  if (scenario === 'hash-digest') installHashDigestMutation();
  if (scenario === 'hash-combined'
    || scenario === 'altered-original-sha'
    || scenario === 'altered-correct-sha'
    || scenario === 'async-mutation') {
    installHashUpdateMutation();
    installHashDigestMutation();
  }

  const ledger = completedLedger();
  const task = ledger.tasks[0];
  let mutationScheduled = false;
  try {
    const pending = authority.fetchRecoveryCompletionCapabilities(ledger);
    if (scenario === 'async-mutation') {
      mutationScheduled = true;
      setTimeout(() => {
        task.completion_evidence.reviewed_head_sha = '9'.repeat(40);
      }, 10);
    }
    const result = await pending;
    const capability = p.mapGet(result.capabilities, 'KREC-001');
    const digestA = p.canonicalSha256({ value: 'A' });
    const digestB = p.canonicalSha256({ value: 'B' });
    process.stdout.write(JSON.stringify({
      scenario,
      capabilityCount: p.mapSize(result.capabilities),
      capabilityRecognized: capability ? authority.isRecoveryCompletionCapability(capability) : false,
      capabilityMatches: capability
        ? authority.recoveryCompletionCapabilityMatches(capability, ledger, task)
        : false,
      diagnosticIds: p.arrayMap(result.diagnostics, (item) => item.diagnostic_id),
      counters,
      digestA,
      digestB,
      expectedDigestA: process.env.RECOVERY_EXPECTED_DIGEST_A,
      expectedDigestB: process.env.RECOVERY_EXPECTED_DIGEST_B,
      mutationScheduled,
    }));
  } finally {
    EventEmitter.prototype.emit = originals.emit;
    Readable.prototype.on = originals.readableOn;
    hashPrototype.update = originals.hashUpdate;
    hashPrototype.digest = originals.hashDigest;
  }
}

async function parentMain() {
  const directory = mkdtempSync(join(tmpdir(), 'recovery-node-security-'));
  const cases = [];
  const record = (name, pass, details = null) => cases.push({ name, pass: Boolean(pass), details });
  try {
    const loaderPath = writeLoader(directory);

    const baseline = await runScenario(loaderPath, 'baseline', 'valid');
    record(
      'real ClientRequest and IncomingMessage baseline receives authentic body and mints one capability',
      baseline.status === 0
        && baseline.output?.capabilityCount === 1
        && baseline.output?.capabilityRecognized === true
        && baseline.output?.capabilityMatches === true
        && baseline.output?.diagnosticIds?.length === 0,
      baseline.output || baseline.stderr,
    );

    const emitInjection = await runScenario(loaderPath, 'emit-injection', 'valid');
    record(
      'mutated EventEmitter emit cannot inject body end early suppress errors or reorder authority events',
      emitInjection.status === 0
        && emitInjection.output?.capabilityCount === 1
        && emitInjection.output?.capabilityRecognized === true
        && emitInjection.output?.counters?.authorityEmit === 0
        && emitInjection.output?.counters?.attackerBodyInjected === false
        && emitInjection.output?.counters?.attackerErrorSuppressed === false,
      emitInjection.output || emitInjection.stderr,
    );

    const readableOn = await runScenario(loaderPath, 'readable-on', 'valid');
    record(
      'captured Readable on preserves flowing response semantics after prototype substitution',
      readableOn.status === 0
        && readableOn.output?.capabilityCount === 1
        && readableOn.output?.capabilityRecognized === true
        && readableOn.output?.counters?.readableOn === 0,
      readableOn.output || readableOn.stderr,
    );

    const outage = await runScenario(loaderPath, 'outage-substitutions', 'outage');
    record(
      'authentic outage fails closed despite emit and readable listener substitutions',
      outage.status === 0
        && outage.output?.capabilityCount === 0
        && outage.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
        && outage.output?.counters?.authorityEmit === 0
        && outage.output?.counters?.readableOn === 0
        && outage.output?.counters?.attackerBodyInjected === false,
      outage.output || outage.stderr,
    );

    const hashUpdate = await runScenario(loaderPath, 'hash-update', 'valid');
    record(
      'Hash update substitution is never resolved by production authority verifier or descriptor paths',
      hashUpdate.status === 0
        && hashUpdate.output?.capabilityCount === 1
        && hashUpdate.output?.counters?.hashUpdate === 0,
      hashUpdate.output || hashUpdate.stderr,
    );

    const hashDigest = await runScenario(loaderPath, 'hash-digest', 'valid');
    record(
      'Hash digest substitution is never resolved by production authority verifier or descriptor paths',
      hashDigest.status === 0
        && hashDigest.output?.capabilityCount === 1
        && hashDigest.output?.counters?.hashDigest === 0,
      hashDigest.output || hashDigest.stderr,
    );

    const hashCombined = await runScenario(loaderPath, 'hash-combined', 'valid');
    record(
      'distinct canonical inputs retain correct distinct digests under combined Hash substitutions',
      hashCombined.status === 0
        && hashCombined.output?.digestA === hashCombined.output?.expectedDigestA
        && hashCombined.output?.digestB === hashCombined.output?.expectedDigestB
        && hashCombined.output?.digestA !== hashCombined.output?.digestB
        && hashCombined.output?.counters?.hashUpdate === 0
        && hashCombined.output?.counters?.hashDigest === 0,
      hashCombined.output || hashCombined.stderr,
    );

    const alteredOriginal = await runScenario(loaderPath, 'altered-original-sha', 'altered-original-sha');
    record(
      'altered workflow bytes with original reported blob SHA remain rejected under Hash substitutions',
      alteredOriginal.status === 0
        && alteredOriginal.output?.capabilityCount === 0
        && alteredOriginal.output?.counters?.hashUpdate === 0
        && alteredOriginal.output?.counters?.hashDigest === 0
        && alteredOriginal.output?.diagnosticIds?.includes('RECOVERY_LEDGER_EXACT_HEAD_RUN_UNVERIFIED'),
      alteredOriginal.output || alteredOriginal.stderr,
    );

    const alteredCorrect = await runScenario(loaderPath, 'altered-correct-sha', 'altered-correct-sha');
    record(
      'altered workflow bytes with matching altered blob SHA fail accepted final-byte identity',
      alteredCorrect.status === 0
        && alteredCorrect.output?.capabilityCount === 0
        && alteredCorrect.output?.counters?.hashUpdate === 0
        && alteredCorrect.output?.counters?.hashDigest === 0
        && alteredCorrect.output?.diagnosticIds?.includes('RECOVERY_LEDGER_EXACT_HEAD_RUN_UNVERIFIED'),
      alteredCorrect.output || alteredCorrect.stderr,
    );

    const asyncMutation = await runScenario(loaderPath, 'async-mutation', 'delayed-valid');
    record(
      'asynchronous completion input mutation remains detected when Hash prototypes are substituted',
      asyncMutation.status === 0
        && asyncMutation.output?.mutationScheduled === true
        && asyncMutation.output?.capabilityCount === 0
        && asyncMutation.output?.diagnosticIds?.includes('RECOVERY_LEDGER_COMPLETION_INPUT_MUTATED')
        && asyncMutation.output?.counters?.hashUpdate === 0
        && asyncMutation.output?.counters?.hashDigest === 0,
      asyncMutation.output || asyncMutation.stderr,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }

  const failures = cases.filter((item) => !item.pass);
  process.stdout.write(`${JSON.stringify({
    suite: 'recovery-completion-node-transport-and-hash',
    production_authority: true,
    production_verifier: true,
    production_descriptor_graph: true,
    real_client_request: true,
    real_incoming_message: true,
    lowest_network_destination_replaced: true,
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    cases,
  }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

if (process.env.RECOVERY_NODE_SECURITY_CHILD === '1') {
  await childMain();
} else {
  await parentMain();
}
