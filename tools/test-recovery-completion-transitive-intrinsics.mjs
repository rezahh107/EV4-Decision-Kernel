#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY_URL = pathToFileURL(join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs')).href;
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const TOKEN = 'transitive-production-graph-token';
const HEAD = '2'.repeat(40);
const MAIN = '3'.repeat(40);

const call = Function.prototype.call;
const bind = Function.prototype.bind;
const bindIntrinsic = call.bind(bind);
const uncurryThis = (method) => bindIntrinsic(call, method);
const safeJsonStringify = bindIntrinsic(JSON.stringify, JSON);
const safeMapGet = uncurryThis(Map.prototype.get);
const safeMapSize = uncurryThis(Object.getOwnPropertyDescriptor(Map.prototype, 'size').get);
const safeArrayMap = uncurryThis(Array.prototype.map);

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
          run_id: 1001,
          head_sha: HEAD,
          conclusion: 'success',
          reference: `https://github.com/${REPOSITORY}/actions/runs/1001`,
        },
        current_main_validation: {
          workflow: 'Validate Main',
          run_id: 1002,
          head_sha: MAIN,
          conclusion: 'success',
          reference: `https://github.com/${REPOSITORY}/actions/runs/1002`,
        },
        evidence_refs: [
          { kind: 'authoritative_owner_merge', reference: `https://github.com/${REPOSITORY}/pull/52` },
          { kind: 'authoritative_exact_head_ci', reference: `https://github.com/${REPOSITORY}/actions/runs/1001` },
          { kind: 'authoritative_current_main_validation', reference: `https://github.com/${REPOSITORY}/actions/runs/1002` },
        ],
      },
    }],
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

function installIntrinsicCounter(name) {
  const counter = { calls: 0 };
  const table = {
    'weakmap-set': [WeakMap.prototype, 'set'],
    'weakmap-get': [WeakMap.prototype, 'get'],
    'weakmap-delete': [WeakMap.prototype, 'delete'],
    'map-get': [Map.prototype, 'get'],
    'map-set': [Map.prototype, 'set'],
    'map-delete': [Map.prototype, 'delete'],
    'map-clear': [Map.prototype, 'clear'],
    'set-add': [Set.prototype, 'add'],
    'set-has': [Set.prototype, 'has'],
    'object-freeze': [Object, 'freeze'],
    'json-stringify': [JSON, 'stringify'],
    'array-isarray': [Array, 'isArray'],
    'array-map': [Array.prototype, 'map'],
    'array-filter': [Array.prototype, 'filter'],
    'array-find': [Array.prototype, 'find'],
    'object-keys': [Object, 'keys'],
    'object-fromentries': [Object, 'fromEntries'],
    'number-isfinite': [Number, 'isFinite'],
    'math-min': [Math, 'min'],
    'math-abs': [Math, 'abs'],
    'date-parse': [Date, 'parse'],
  };
  const target = table[name];
  if (!target) throw new Error(`Unknown mutation target: ${name}`);
  const [owner, key] = target;
  const original = owner[key];
  const restore = replaceOwnMethod(owner, key, function countedIntrinsic(...args) {
    counter.calls += 1;
    return Reflect.apply(original, this === owner ? owner : this, args);
  });
  return { counter, restore };
}

async function childMain() {
  const scenario = process.env.RECOVERY_TRANSITIVE_SCENARIO;
  const authority = await import(AUTHORITY_URL);
  let mutation = null;
  let networkMutation = null;

  if (scenario === 'state-substitution') {
    mutation = installIntrinsicCounter('weakmap-get');
  } else if (scenario?.startsWith('intrinsic:')) {
    mutation = installIntrinsicCounter(scenario.slice('intrinsic:'.length));
  } else if (scenario === 'network-valid' || scenario === 'network-outage') {
    const { EventEmitter } = await import('node:events');
    const { ClientRequest, IncomingMessage } = await import('node:http');
    const counters = { on: 0, setTimeout: 0, end: 0, destroy: 0 };
    const originalOn = EventEmitter.prototype.on;
    const originalSetTimeout = ClientRequest.prototype.setTimeout;
    const originalEnd = ClientRequest.prototype.end;
    const originalDestroy = ClientRequest.prototype.destroy;
    const restores = [
      replaceOwnMethod(EventEmitter.prototype, 'on', function countedOn(event, listener) {
        if (this instanceof ClientRequest || this instanceof IncomingMessage) counters.on += 1;
        return Reflect.apply(originalOn, this, [event, listener]);
      }),
      replaceOwnMethod(ClientRequest.prototype, 'setTimeout', function countedSetTimeout(...args) {
        counters.setTimeout += 1;
        return Reflect.apply(originalSetTimeout, this, args);
      }),
      replaceOwnMethod(ClientRequest.prototype, 'end', function countedEnd(...args) {
        counters.end += 1;
        return Reflect.apply(originalEnd, this, args);
      }),
      replaceOwnMethod(ClientRequest.prototype, 'destroy', function countedDestroy(...args) {
        counters.destroy += 1;
        return Reflect.apply(originalDestroy, this, args);
      }),
    ];
    networkMutation = {
      counters,
      restore() {
        for (let index = restores.length - 1; index >= 0; index -= 1) restores[index]();
      },
    };
  }

  try {
    const result = await authority.fetchRecoveryCompletionCapabilities(completedLedger());
    const capability = safeMapGet(result.capabilities, 'KREC-001');
    process.stdout.write(safeJsonStringify({
      scenario,
      capabilityCount: safeMapSize(result.capabilities),
      capabilityRecognized: capability ? authority.isRecoveryCompletionCapability(capability) : false,
      diagnosticIds: safeArrayMap(result.diagnostics, (item) => item.diagnostic_id),
      mutationCalls: mutation?.counter.calls ?? 0,
      networkCalls: networkMutation?.counters ?? null,
    }));
  } finally {
    mutation?.restore();
    networkMutation?.restore();
  }
}

async function createFixtureServer(mode) {
  const observations = { authenticRepositoryBodies: 0 };
  const server = createServer((request, response) => {
    if (mode === 'outage') {
      request.socket.destroy();
      return;
    }
    response.setHeader('content-type', 'application/json');
    response.setHeader('date', new Date().toUTCString());
    if (request.url === `/repos/${REPOSITORY}`) {
      observations.authenticRepositoryBodies += 1;
      response.statusCode = 200;
      response.end(safeJsonStringify({ id: REPOSITORY_ID, full_name: REPOSITORY, default_branch: 'main' }));
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

async function runScenario(scenario, mode = 'bounded') {
  const { server, observations } = await createFixtureServer(mode);
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
  const timer = setTimeout(() => child.kill('SIGKILL'), 60_000);
  try {
    return { ...(await collect(child)), observations };
  } finally {
    clearTimeout(timer);
    await new Promise((resolve) => server.close(resolve));
  }
}

function passes(result, requireRepository = true) {
  const network = result.output?.networkCalls;
  return result.status === 0
    && result.output?.capabilityCount === 0
    && result.output?.capabilityRecognized === false
    && result.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
    && result.output?.mutationCalls === 0
    && (!network || (network.on === 0 && network.setTimeout === 0 && network.end === 0 && network.destroy === 0))
    && (!requireRepository || result.observations.authenticRepositoryBodies === 1);
}

async function parentMain() {
  const cases = [];
  const record = (name, result, requireRepository = true) => cases.push({
    name,
    pass: passes(result, requireRepository),
    details: result.output || result.stderr,
  });

  record('fixed isolated transport ignores caller process stream state', await runScenario('baseline'));
  record('private verifier state ignores post-initialization WeakMap replacement', await runScenario('state-substitution', 'outage'), false);

  const intrinsicNames = [
    'weakmap-set', 'weakmap-delete', 'map-get', 'map-set', 'map-delete', 'map-clear',
    'set-add', 'set-has', 'object-freeze', 'json-stringify', 'array-isarray',
    'array-map', 'array-filter', 'array-find', 'object-keys', 'object-fromentries',
    'number-isfinite', 'math-min', 'math-abs', 'date-parse',
  ];
  for (const name of intrinsicNames) {
    record(`${name} is not resolved by isolated production verification`, await runScenario(`intrinsic:${name}`));
  }

  record('parent EventEmitter and ClientRequest substitutions are outside isolated transport', await runScenario('network-valid'));
  record('parent request substitutions cannot suppress isolated outage', await runScenario('network-outage', 'outage'), false);

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
