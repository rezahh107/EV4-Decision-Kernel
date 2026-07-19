#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY_URL = pathToFileURL(
  join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs'),
).href;
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const HEAD = '2'.repeat(40);
const MAIN = '3'.repeat(40);
const EXACT_RUN = 1001;
const MAIN_RUN = 1002;
const TOKEN = 'transitive-production-graph-token';

const functionCall = Function.prototype.call;
const functionBind = Function.prototype.bind;
const bindIntrinsic = functionCall.bind(functionBind);
const uncurryThis = (method) => bindIntrinsic(functionCall, method);
const safeJsonStringify = bindIntrinsic(JSON.stringify, JSON);
const safeObjectKeys = bindIntrinsic(Object.keys, Object);
const safeMapGet = uncurryThis(Map.prototype.get);
const safeArrayMap = uncurryThis(Array.prototype.map);
const safeMapSize = uncurryThis(
  Object.getOwnPropertyDescriptor(Map.prototype, 'size').get,
);

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
          {
            kind: 'authoritative_owner_merge',
            reference: `https://github.com/${REPOSITORY}/pull/52`,
          },
          {
            kind: 'authoritative_exact_head_ci',
            reference: `https://github.com/${REPOSITORY}/actions/runs/${EXACT_RUN}`,
          },
          {
            kind: 'authoritative_current_main_validation',
            reference: `https://github.com/${REPOSITORY}/actions/runs/${MAIN_RUN}`,
          },
        ],
      },
    }],
  };
}

function mutationTarget(name) {
  const counter = { calls: 0 };
  const attackerState = {
    fetchImpl: async () => {
      counter.calls += 1;
      throw new Error('attacker fetch executed');
    },
    token: 'attacker-controlled-token',
    now: () => {
      counter.calls += 1;
      return 0;
    },
    requestCache: new Map(),
    runEvidenceCache: new Map(),
    evidenceCache: new Map(),
  };
  const table = {
    'weakmap-set': [WeakMap.prototype, 'set', function substitute() { counter.calls += 1; return this; }],
    'weakmap-get': [WeakMap.prototype, 'get', function substitute() { counter.calls += 1; return attackerState; }],
    'weakmap-delete': [WeakMap.prototype, 'delete', function substitute() { counter.calls += 1; return true; }],
    'map-get': [Map.prototype, 'get', function substitute() { counter.calls += 1; return attackerState; }],
    'map-set': [Map.prototype, 'set', function substitute() { counter.calls += 1; return this; }],
    'map-delete': [Map.prototype, 'delete', function substitute() { counter.calls += 1; return true; }],
    'map-clear': [Map.prototype, 'clear', function substitute() { counter.calls += 1; }],
    'set-add': [Set.prototype, 'add', function substitute() { counter.calls += 1; return this; }],
    'set-has': [Set.prototype, 'has', function substitute() { counter.calls += 1; return true; }],
    'object-freeze': [Object, 'freeze', (value) => { counter.calls += 1; return value; }],
    'json-stringify': [JSON, 'stringify', () => { counter.calls += 1; return '{"forged":true}'; }],
    'array-isarray': [Array, 'isArray', () => { counter.calls += 1; return false; }],
    'array-map': [Array.prototype, 'map', function substitute() { counter.calls += 1; return []; }],
    'array-filter': [Array.prototype, 'filter', function substitute() { counter.calls += 1; return []; }],
    'array-find': [Array.prototype, 'find', function substitute() { counter.calls += 1; return attackerState; }],
    'object-keys': [Object, 'keys', () => { counter.calls += 1; return []; }],
    'object-fromentries': [Object, 'fromEntries', () => { counter.calls += 1; return {}; }],
    'number-isfinite': [Number, 'isFinite', () => { counter.calls += 1; return true; }],
    'math-min': [Math, 'min', () => { counter.calls += 1; return Number.MAX_SAFE_INTEGER; }],
    'math-abs': [Math, 'abs', () => { counter.calls += 1; return 0; }],
    'date-parse': [Date, 'parse', () => { counter.calls += 1; return Number.MAX_SAFE_INTEGER; }],
  };
  const target = table[name];
  if (!target) throw new Error(`Unknown mutation target: ${name}`);
  const [object, key, replacement] = target;
  const descriptor = Object.getOwnPropertyDescriptor(object, key);
  Object.defineProperty(object, key, {
    ...descriptor,
    value: replacement,
  });
  return {
    counter,
    restore() { Object.defineProperty(object, key, descriptor); },
  };
}

function replaceOwnMethod(owner, key, replacement) {
  const descriptor = Object.getOwnPropertyDescriptor(owner, key);
  Object.defineProperty(owner, key, {
    configurable: true,
    enumerable: descriptor?.enumerable ?? false,
    writable: true,
    value: replacement,
  });
  return () => {
    if (descriptor) Object.defineProperty(owner, key, descriptor);
    else delete owner[key];
  };
}

async function childMain() {
  const scenario = process.env.RECOVERY_TRANSITIVE_SCENARIO;
  const authority = await import(AUTHORITY_URL);
  const ledger = completedLedger();
  let mutation = null;
  let networkMutation = null;

  if (scenario === 'state-substitution') {
    mutation = mutationTarget('weakmap-get');
  } else if (scenario?.startsWith('intrinsic:')) {
    mutation = mutationTarget(scenario.slice('intrinsic:'.length));
  } else if (scenario === 'network-valid' || scenario === 'network-outage') {
    const { EventEmitter } = await import('node:events');
    const { ClientRequest } = await import('node:http');
    const counter = { on: 0, setTimeout: 0, end: 0, destroy: 0 };
    const restores = [
      replaceOwnMethod(EventEmitter.prototype, 'on', function substitutedOn(event, listener) {
        counter.on += 1;
        if (event === 'data') listener(Buffer.from('{"attacker_selected":true}'));
        if (event === 'end') listener();
        return this;
      }),
      replaceOwnMethod(ClientRequest.prototype, 'setTimeout', function substitutedSetTimeout() {
        counter.setTimeout += 1;
        return this;
      }),
      replaceOwnMethod(ClientRequest.prototype, 'end', function substitutedEnd() {
        counter.end += 1;
        return this;
      }),
      replaceOwnMethod(ClientRequest.prototype, 'destroy', function substitutedDestroy() {
        counter.destroy += 1;
        return this;
      }),
    ];
    networkMutation = {
      counter,
      restore() {
        for (let index = restores.length - 1; index >= 0; index -= 1) restores[index]();
      },
    };
  }

  try {
    const result = await authority.fetchRecoveryCompletionCapabilities(ledger);
    const capability = safeMapGet(result.capabilities, 'KREC-001');
    process.stdout.write(safeJsonStringify({
      scenario,
      capabilityCount: safeMapSize(result.capabilities),
      capabilityRecognized: capability
        ? authority.isRecoveryCompletionCapability(capability)
        : false,
      diagnosticIds: safeArrayMap(result.diagnostics, (item) => item.diagnostic_id),
      diagnostics: result.diagnostics,
      mutationCalls: mutation?.counter.calls ?? 0,
      networkCalls: networkMutation?.counter ?? null,
      tokenKeys: capability ? safeObjectKeys(capability).length : null,
      attackerFetchCalled: scenario === 'state-substitution' ? mutation.counter.calls > 0 : false,
      attackerClockCalled: scenario === 'state-substitution' ? mutation.counter.calls > 0 : false,
    }));
  } finally {
    mutation?.restore();
    networkMutation?.restore();
  }
}

async function createFixtureServer(mode) {
  const observations = { requests: 0, authenticRepositoryBodies: 0 };
  const server = createServer((request, response) => {
    observations.requests += 1;
    if (mode === 'outage') {
      request.socket.destroy();
      return;
    }
    response.setHeader('content-type', 'application/json');
    response.setHeader('date', new Date().toUTCString());
    if (request.url === `/repos/${REPOSITORY}`) {
      observations.authenticRepositoryBodies += 1;
      response.statusCode = 200;
      response.end(safeJsonStringify({
        id: REPOSITORY_ID,
        full_name: REPOSITORY,
        default_branch: 'main',
      }));
      return;
    }
    response.statusCode = 503;
    response.end('{"message":"bounded transitive fixture"}');
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  return { server, observations };
}

function collect(child) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => { stdout += chunk; });
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('close', (status, signal) => {
      let output = null;
      try { output = JSON.parse(stdout); } catch { output = null; }
      resolve({ status, signal, stdout, stderr, output });
    });
  });
}

async function runScenario(scenario, transportMode = 'bounded') {
  const { server, observations } = await createFixtureServer(transportMode);
  const address = server.address();
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: ROOT,
    env: {
      ...process.env,
      RECOVERY_GITHUB_TOKEN: TOKEN,
      RECOVERY_TRANSITIVE_CHILD: '1',
      RECOVERY_TRANSITIVE_SCENARIO: scenario,
      RECOVERY_LOCAL_SERVER_PORT: String(address.port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const timeout = setTimeout(() => child.kill('SIGKILL'), 60_000);
  try {
    return { ...(await collect(child)), observations };
  } finally {
    clearTimeout(timeout);
    await new Promise((resolve) => server.close(resolve));
  }
}

function failClosedWithoutParentMutation(result, expectedCounter = null, requireRepository = true) {
  const network = result.output?.networkCalls;
  return result.status === 0
    && result.output?.capabilityCount === 0
    && result.output?.capabilityRecognized === false
    && result.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
    && result.output?.mutationCalls === 0
    && result.output?.attackerFetchCalled === false
    && result.output?.attackerClockCalled === false
    && (expectedCounter === null || result.output?.mutationCalls === expectedCounter)
    && (!network || (network.on === 0
      && network.setTimeout === 0
      && network.end === 0
      && network.destroy === 0))
    && (!requireRepository || result.observations.authenticRepositoryBodies === 1);
}

async function parentMain() {
  const cases = [];
  const record = (name, pass, details = null) => cases.push({ name, pass: Boolean(pass), details });

  const baseline = await runScenario('baseline');
  record(
    'production authority uses the fixed isolated transport rather than caller process stream state',
    failClosedWithoutParentMutation(baseline),
    baseline.output || baseline.stderr,
  );

  const substitution = await runScenario('state-substitution', 'outage');
  record(
    'poisoned verifier WeakMap get cannot substitute fetch token or clock',
    failClosedWithoutParentMutation(substitution, 0, false),
    substitution.output || substitution.stderr,
  );

  const intrinsicNames = [
    'weakmap-set',
    'weakmap-delete',
    'map-get',
    'map-set',
    'map-delete',
    'map-clear',
    'set-add',
    'set-has',
    'object-freeze',
    'json-stringify',
    'array-isarray',
    'array-map',
    'array-filter',
    'array-find',
    'object-keys',
    'object-fromentries',
    'number-isfinite',
    'math-min',
    'math-abs',
    'date-parse',
  ];
  for (const name of intrinsicNames) {
    const observed = await runScenario(`intrinsic:${name}`);
    record(
      `${name} substitution is not resolved by the isolated production verification path`,
      failClosedWithoutParentMutation(observed),
      observed.output || observed.stderr,
    );
  }

  const networkValid = await runScenario('network-valid');
  record(
    'mutated parent EventEmitter and ClientRequest methods cannot inject or redirect isolated evidence',
    failClosedWithoutParentMutation(networkValid),
    networkValid.output || networkValid.stderr,
  );

  const networkOutage = await runScenario('network-outage', 'outage');
  record(
    'mutated parent request methods cannot suppress an isolated authentic transport failure',
    failClosedWithoutParentMutation(networkOutage, 0, false),
    networkOutage.output || networkOutage.stderr,
  );

  const failures = cases.filter((item) => !item.pass);
  process.stdout.write(`${JSON.stringify({
    suite: 'recovery-completion-transitive-intrinsics',
    production_authority: true,
    production_verifier: true,
    production_descriptor_graph: true,
    transport_boundary: 'fixed isolated child process with local Node HTTP fixture',
    caller_loader_propagated: false,
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    cases,
  }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

if (process.env.RECOVERY_TRANSITIVE_CHILD === '1') await childMain();
else await parentMain();
