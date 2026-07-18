#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import {
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY_URL = pathToFileURL(
  join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs'),
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
  const original = object[key];
  object[key] = replacement;
  return {
    counter,
    restore() { object[key] = original; },
  };
}

async function childMain() {
  const scenario = process.env.RECOVERY_TRANSITIVE_SCENARIO;
  const authority = await import(AUTHORITY_URL);
  const ledger = completedLedger();
  const task = ledger.tasks[0];
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
    const originals = {
      on: EventEmitter.prototype.on,
      setTimeout: ClientRequest.prototype.setTimeout,
      end: ClientRequest.prototype.end,
      destroy: ClientRequest.prototype.destroy,
    };
    EventEmitter.prototype.on = function substitutedOn(event, listener) {
      counter.on += 1;
      if (event === 'data') listener(Buffer.from('{"attacker_selected":true}'));
      if (event === 'end') listener();
      return this;
    };
    ClientRequest.prototype.setTimeout = function substitutedSetTimeout() {
      counter.setTimeout += 1;
      return this;
    };
    ClientRequest.prototype.end = function substitutedEnd() {
      counter.end += 1;
      return this;
    };
    ClientRequest.prototype.destroy = function substitutedDestroy() {
      counter.destroy += 1;
      return this;
    };
    networkMutation = {
      counter,
      restore() {
        EventEmitter.prototype.on = originals.on;
        ClientRequest.prototype.setTimeout = originals.setTimeout;
        ClientRequest.prototype.end = originals.end;
        ClientRequest.prototype.destroy = originals.destroy;
      },
    };
  }

  let output;
  try {
    const result = await authority.fetchRecoveryCompletionCapabilities(ledger);
    const capability = safeMapGet(result.capabilities, 'KREC-001');
    output = {
      scenario,
      capabilityCount: safeMapSize(result.capabilities),
      capabilityRecognized: capability
        ? authority.isRecoveryCompletionCapability(capability)
        : false,
      capabilityMatches: capability
        ? authority.recoveryCompletionCapabilityMatches(capability, ledger, task)
        : false,
      diagnosticIds: safeArrayMap(result.diagnostics, (item) => item.diagnostic_id),
      diagnostics: result.diagnostics,
      mutationCalls: mutation?.counter.calls ?? 0,
      networkCalls: networkMutation?.counter ?? null,
      tokenKeys: capability ? safeObjectKeys(capability).length : null,
      attackerFetchCalled: scenario === 'state-substitution' ? mutation.counter.calls > 0 : false,
      attackerClockCalled: scenario === 'state-substitution' ? mutation.counter.calls > 0 : false,
    };
  } finally {
    mutation?.restore();
    networkMutation?.restore();
  }
  process.stdout.write(safeJsonStringify(output));
}

function gitBlobSha(raw) {
  const prefix = Buffer.from(`blob ${raw.length}\0`);
  return createHash('sha1').update(prefix).update(raw).digest('hex');
}

function fixtureModules(directory) {
  const httpPath = join(directory, 'mock-node-http.mjs');
  const httpsPath = join(directory, 'mock-node-https.mjs');
  const loaderPath = join(directory, 'loader.mjs');
  const workflowPaths = {
    mvk: join(ROOT, '.github/workflows/validate-mvk.yml'),
    main: join(ROOT, '.github/workflows/validate-main.yml'),
  };

  writeFileSync(httpPath, `
    import { EventEmitter } from 'node:events';
    const call = Function.prototype.call;
    const bind = Function.prototype.bind;
    const bindIntrinsic = call.bind(bind);
    const safeJsonStringify = bindIntrinsic(JSON.stringify, JSON);
    export class IncomingMessage extends EventEmitter {
      constructor(statusCode, headers, body) {
        super();
        this.statusCode = statusCode;
        this.headers = headers;
        this.body = body;
      }
    }
    export class ClientRequest extends EventEmitter {
      constructor(url, callback, resolver) {
        super();
        this.url = url;
        this.callback = callback;
        this.resolver = resolver;
        this.timeoutCallback = null;
        this.destroyed = false;
      }
      setTimeout(_milliseconds, callback) {
        this.timeoutCallback = callback;
        return this;
      }
      destroy(error) {
        this.destroyed = true;
        if (error) queueMicrotask(() => this.emit('error', error));
        return this;
      }
      end() {
        queueMicrotask(() => {
          if (this.destroyed) return;
          const resolved = this.resolver(this.url);
          if (resolved.error) {
            this.emit('error', new Error(resolved.error));
            return;
          }
          const response = new IncomingMessage(
            resolved.status,
            { date: resolved.date },
            Buffer.from(safeJsonStringify(resolved.payload)),
          );
          this.callback(response);
          queueMicrotask(() => {
            response.emit('data', response.body);
            response.emit('end');
          });
        });
        return this;
      }
    }
  `);

  writeFileSync(httpsPath, `
    import { readFileSync } from 'node:fs';
    import { createHash } from 'node:crypto';
    import { URL } from 'node:url';
    import { ClientRequest } from ${JSON.stringify(pathToFileURL(httpPath).href)};

    const call = Function.prototype.call;
    const bind = Function.prototype.bind;
    const bindIntrinsic = call.bind(bind);
    const uncurry = (method) => bindIntrinsic(call, method);
    const arrayMap = uncurry(Array.prototype.map);
    const arrayFilter = uncurry(Array.prototype.filter);
    const arrayJoin = uncurry(Array.prototype.join);
    const arrayAt = uncurry(Array.prototype.at);
    const stringSplit = uncurry(String.prototype.split);

    const REPOSITORY = ${JSON.stringify(REPOSITORY)};
    const REPOSITORY_ID = ${REPOSITORY_ID};
    const BASE = ${JSON.stringify(BASE)};
    const HEAD = ${JSON.stringify(HEAD)};
    const MAIN = ${JSON.stringify(MAIN)};
    const TREE = ${JSON.stringify(TREE)};
    const EXACT_RUN = ${EXACT_RUN};
    const MAIN_RUN = ${MAIN_RUN};
    const EXACT_JOB = ${EXACT_JOB};
    const MAIN_JOB = ${MAIN_JOB};
    const mode = process.env.RECOVERY_TRANSITIVE_TRANSPORT_MODE || 'valid';
    const now = Date.now();
    const responseDate = new Date(now).toUTCString();
    const exactCompleted = new Date(now - 30_000).toISOString();
    const mergedAt = new Date(now - 20_000).toISOString();
    const mainCompleted = new Date(now - 10_000).toISOString();
    const workflowFiles = {
      '.github/workflows/validate-mvk.yml': readFileSync(${JSON.stringify(workflowPaths.mvk)}),
      '.github/workflows/validate-main.yml': readFileSync(${JSON.stringify(workflowPaths.main)}),
    };

    const blobSha = (raw) => createHash('sha1')
      .update(Buffer.from('blob ' + raw.length + '\\0'))
      .update(raw)
      .digest('hex');
    const sourcePayload = (path) => {
      const raw = workflowFiles[path];
      return {
        type: 'file',
        encoding: 'base64',
        path,
        name: arrayAt(stringSplit(path, '/'), -1),
        size: raw.length,
        sha: blobSha(raw),
        content: raw.toString('base64'),
      };
    };
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
      html_url: 'https://github.com/' + REPOSITORY + '/actions/runs/' + id,
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

    const payload = (urlValue) => {
      if (mode === 'outage') return { error: 'simulated authentic transport outage' };
      const url = urlValue instanceof URL ? urlValue : new URL(String(urlValue));
      const path = url.pathname;
      if (path === '/repos/' + REPOSITORY) {
        return { id: REPOSITORY_ID, full_name: REPOSITORY, default_branch: 'main' };
      }
      if (path === '/repos/' + REPOSITORY + '/pulls/52') {
        return {
          number: 52,
          state: 'closed',
          merged: true,
          merged_at: mergedAt,
          merged_by: { login: 'rezahh107' },
          merge_commit_sha: MAIN,
          html_url: 'https://github.com/' + REPOSITORY + '/pull/52',
          head: { sha: HEAD, repo: { id: REPOSITORY_ID, full_name: REPOSITORY } },
          base: {
            ref: 'main',
            sha: BASE,
            repo: { id: REPOSITORY_ID, full_name: REPOSITORY },
          },
        };
      }
      if (path.endsWith('/commits/' + HEAD)) {
        return { sha: HEAD, commit: { tree: { sha: TREE } }, parents: [{ sha: BASE }] };
      }
      if (path.endsWith('/commits/' + MAIN)) {
        return {
          sha: MAIN,
          commit: { tree: { sha: '5'.repeat(40) } },
          parents: [{ sha: BASE }, { sha: HEAD }],
        };
      }
      if (path.endsWith('/branches/main')) return { name: 'main', commit: { sha: MAIN } };
      if (path.includes('/compare/' + HEAD + '...' + MAIN)) return { status: 'ahead' };
      if (path.includes('/compare/' + MAIN + '...main')) return { status: 'identical' };
      const contentPrefix = '/repos/' + REPOSITORY + '/contents/';
      if (path.startsWith(contentPrefix)) {
        const sourcePath = arrayJoin(
          arrayMap(stringSplit(path.slice(contentPrefix.length), '/'), decodeURIComponent),
          '/',
        );
        return sourcePayload(sourcePath);
      }
      if (path.endsWith('/actions/runs')) {
        const event = url.searchParams.get('event');
        return { workflow_runs: arrayFilter([exactRun, mainRun], (item) => item.event === event) };
      }
      if (path.endsWith('/actions/runs/' + EXACT_RUN)) return exactRun;
      if (path.endsWith('/actions/runs/' + MAIN_RUN)) return mainRun;
      if (path.endsWith('/actions/runs/' + EXACT_RUN + '/jobs')) {
        return { jobs: [job(exactRun, 'MVK and roadmap regressions')] };
      }
      if (path.endsWith('/actions/runs/' + MAIN_RUN + '/jobs')) {
        return { jobs: [job(mainRun, 'Validate Main')] };
      }
      if (path.endsWith('/check-runs/' + EXACT_JOB)) {
        return check(exactRun, 'MVK and roadmap regressions');
      }
      if (path.endsWith('/check-runs/' + MAIN_JOB)) return check(mainRun, 'Validate Main');
      return { error: 'unexpected fixture endpoint: ' + path + url.search };
    };

    export class Agent {
      constructor(options = {}) { this.options = options; }
    }
    export function request(url, _options, callback) {
      return new ClientRequest(url, callback, (input) => {
        const value = payload(input);
        if (value?.error) return value;
        return { status: 200, date: responseDate, payload: value };
      });
    }
  `);

  writeFileSync(loaderPath, `
    const httpUrl = ${JSON.stringify(pathToFileURL(httpPath).href)};
    const httpsUrl = ${JSON.stringify(pathToFileURL(httpsPath).href)};
    export async function resolve(specifier, context, nextResolve) {
      if (specifier === 'node:http') return { url: httpUrl, shortCircuit: true };
      if (specifier === 'node:https') return { url: httpsUrl, shortCircuit: true };
      return nextResolve(specifier, context);
    }
  `);
  return loaderPath;
}

function runScenario(loaderPath, scenario, transportMode = 'valid') {
  const result = spawnSync(
    process.execPath,
    ['--no-warnings', '--experimental-loader', loaderPath, fileURLToPath(import.meta.url)],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        RECOVERY_GITHUB_TOKEN: TOKEN,
        RECOVERY_TRANSITIVE_CHILD: '1',
        RECOVERY_TRANSITIVE_SCENARIO: scenario,
        RECOVERY_TRANSITIVE_TRANSPORT_MODE: transportMode,
      },
    },
  );
  let output = null;
  try { output = JSON.parse(result.stdout); } catch { output = null; }
  return { result, output };
}

function parentMain() {
  const directory = mkdtempSync(join(tmpdir(), 'recovery-transitive-'));
  const cases = [];
  const record = (name, pass, details = null) => cases.push({ name, pass: Boolean(pass), details });
  try {
    const loaderPath = fixtureModules(directory);
    const baseline = runScenario(loaderPath, 'baseline', 'valid');
    record(
      'real production authority verifier and descriptor graph accepts authentic baseline transport',
      baseline.result.status === 0
        && baseline.output?.capabilityCount === 1
        && baseline.output?.capabilityRecognized === true
        && baseline.output?.capabilityMatches === true
        && baseline.output?.tokenKeys === 0
        && baseline.output?.diagnosticIds?.length === 0,
      baseline.output || baseline.result.stderr,
    );

    const substitution = runScenario(loaderPath, 'state-substitution', 'outage');
    record(
      'poisoned verifier WeakMap get cannot substitute fetch token or clock',
      substitution.result.status === 0
        && substitution.output?.capabilityCount === 0
        && substitution.output?.mutationCalls === 0
        && substitution.output?.attackerFetchCalled === false
        && substitution.output?.attackerClockCalled === false
        && substitution.output?.diagnosticIds?.includes(
          'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
        ),
      substitution.output || substitution.result.stderr,
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
      const observed = runScenario(loaderPath, `intrinsic:${name}`, 'valid');
      record(
        `${name} substitution is not resolved by the production verification path`,
        observed.result.status === 0
          && observed.output?.capabilityCount === 1
          && observed.output?.capabilityRecognized === true
          && observed.output?.capabilityMatches === true
          && observed.output?.mutationCalls === 0
          && observed.output?.diagnosticIds?.length === 0,
        observed.output || observed.result.stderr,
      );
    }

    const networkValid = runScenario(loaderPath, 'network-valid', 'valid');
    const validNetworkCounters = networkValid.output?.networkCalls;
    record(
      'mutated EventEmitter and ClientRequest methods cannot inject body or reorder authentic completion',
      networkValid.result.status === 0
        && networkValid.output?.capabilityCount === 1
        && networkValid.output?.capabilityRecognized === true
        && networkValid.output?.capabilityMatches === true
        && validNetworkCounters?.on === 0
        && validNetworkCounters?.setTimeout === 0
        && validNetworkCounters?.end === 0
        && validNetworkCounters?.destroy === 0,
      networkValid.output || networkValid.result.stderr,
    );

    const networkOutage = runScenario(loaderPath, 'network-outage', 'outage');
    const outageCounters = networkOutage.output?.networkCalls;
    record(
      'mutated request methods cannot suppress an authentic transport failure',
      networkOutage.result.status === 0
        && networkOutage.output?.capabilityCount === 0
        && networkOutage.output?.diagnosticIds?.includes(
          'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
        )
        && outageCounters?.on === 0
        && outageCounters?.setTimeout === 0
        && outageCounters?.end === 0
        && outageCounters?.destroy === 0,
      networkOutage.output || networkOutage.result.stderr,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }

  const failures = cases.filter((item) => !item.pass);
  process.stdout.write(`${JSON.stringify({
    suite: 'recovery-completion-transitive-intrinsics',
    production_authority: true,
    production_verifier: true,
    production_descriptor_graph: true,
    transport_mock_boundary: 'node:http and node:https only',
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    cases,
  }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

if (process.env.RECOVERY_TRANSITIVE_CHILD === '1') {
  await childMain();
} else {
  parentMain();
}
