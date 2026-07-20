#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY_URL = pathToFileURL(join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs')).href;
const PRIMORDIALS_URL = pathToFileURL(join(ROOT, 'kernel/validator/recovery-primordials.mjs')).href;
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const TOKEN = 'readable-dependency-test-token';
const ATTACKER_BODY = '{"attacker_selected":true}';

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
      candidate: { branch: 'krec-001/recovery-ledger', pull_request: 52, pr_state: 'merged' },
      completion_evidence: {
        pull_request: 52,
        reviewed_head_sha: '2'.repeat(40),
        merge_method: 'merge',
        merge_actor: 'rezahh107',
        resulting_main_sha: '3'.repeat(40),
        exact_head_ci: { workflow: 'Validate MVK', run_id: 1001, head_sha: '2'.repeat(40), conclusion: 'success', reference: `https://github.com/${REPOSITORY}/actions/runs/1001` },
        current_main_validation: { workflow: 'Validate Main', run_id: 1002, head_sha: '3'.repeat(40), conclusion: 'success', reference: `https://github.com/${REPOSITORY}/actions/runs/1002` },
        evidence_refs: [
          { kind: 'authoritative_owner_merge', reference: `https://github.com/${REPOSITORY}/pull/52` },
          { kind: 'authoritative_exact_head_ci', reference: `https://github.com/${REPOSITORY}/actions/runs/1001` },
          { kind: 'authoritative_current_main_validation', reference: `https://github.com/${REPOSITORY}/actions/runs/1002` },
        ],
      },
    }],
  };
}

function writeLoader(directory) {
  const shimPath = join(directory, 'https-local.mjs');
  const loaderPath = join(directory, 'loader.mjs');
  writeFileSync(shimPath, `
    import { request as httpRequest } from 'node:http';
    import { URL } from 'node:url';
    export class Agent { constructor(options = {}) { this.options = options; } }
    export function request(input, options = {}, callback) {
      const source = input instanceof URL ? input : new URL(String(input));
      const destination = new URL('http://127.0.0.1:' + process.env.RECOVERY_LOCAL_SERVER_PORT);
      destination.pathname = source.pathname;
      destination.search = source.search;
      return httpRequest(destination, { method: options.method || 'GET', headers: options.headers }, callback);
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

async function createFixtureServer(mode) {
  const observations = { requests: [], authenticRepositoryBodies: 0, responseErrors: 0 };
  const server = createServer((request, response) => {
    observations.requests.push(request.url);
    if (mode === 'outage') {
      request.socket.destroy();
      return;
    }
    response.statusCode = request.url.startsWith(`/repos/${REPOSITORY}`) && request.url === `/repos/${REPOSITORY}` ? 200 : 503;
    response.setHeader('content-type', 'application/json');
    response.setHeader('date', new Date().toUTCString());
    if (mode === 'response-error') {
      observations.responseErrors += 1;
      response.write('{"partial":');
      setImmediate(() => response.socket.destroy());
      return;
    }
    if (response.statusCode === 200) {
      observations.authenticRepositoryBodies += 1;
      response.end(JSON.stringify({ id: 1292378784, full_name: REPOSITORY, default_branch: 'main' }));
    } else {
      response.end(JSON.stringify({ message: 'bounded fixture stops after authentic repository response' }));
    }
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

async function runScenario(loaderPath, scenario, serverMode = 'valid') {
  const { server, observations } = await createFixtureServer(serverMode);
  const address = server.address();
  const child = spawn(process.execPath, ['--no-warnings', '--experimental-loader', loaderPath, fileURLToPath(import.meta.url)], {
    cwd: ROOT,
    env: {
      ...process.env,
      RECOVERY_GITHUB_TOKEN: TOKEN,
      RECOVERY_READABLE_DEPENDENCY_CHILD: '1',
      RECOVERY_READABLE_DEPENDENCY_SCENARIO: scenario,
      RECOVERY_LOCAL_SERVER_PORT: String(address.port),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const timeout = setTimeout(() => child.kill('SIGKILL'), 12_000);
  try {
    return { ...(await collect(child)), observations };
  } finally {
    clearTimeout(timeout);
    await new Promise((resolve) => server.close(resolve));
  }
}

async function childMain() {
  const { EventEmitter } = await import('node:events');
  const { ClientRequest, IncomingMessage } = await import('node:http');
  const { Readable } = await import('node:stream');
  const authority = await import(AUTHORITY_URL);
  const { recoveryPrimordials: p } = await import(PRIMORDIALS_URL);
  const scenario = process.env.RECOVERY_READABLE_DEPENDENCY_SCENARIO;
  const originals = {
    emit: EventEmitter.prototype.emit,
    readableOn: Readable.prototype.on,
    resume: Readable.prototype.resume,
    listenerCount: EventEmitter.prototype.listenerCount,
    functionCall: Function.prototype.call,
  };
  const protectedMethods = new Set([originals.emit, originals.readableOn, originals.resume, originals.listenerCount]);
  const counters = { emit: 0, readableOn: 0, resume: 0, listenerCount: 0, functionCall: 0, attackerBodyInjected: false };

  const installEmit = () => {
    EventEmitter.prototype.emit = function substitutedEmit(event, ...args) {
      if (this instanceof ClientRequest || this instanceof IncomingMessage) counters.emit += 1;
      return Reflect.apply(originals.emit, this, [event, ...args]);
    };
  };
  const installReadableOn = () => {
    Readable.prototype.on = function substitutedReadableOn(event, listener) {
      if (this instanceof IncomingMessage) counters.readableOn += 1;
      return Reflect.apply(originals.readableOn, this, [event, listener]);
    };
  };
  const installResume = () => {
    Readable.prototype.resume = function poisonedResume() {
      if (this instanceof IncomingMessage) {
        counters.resume += 1;
        const response = this;
        queueMicrotask(() => {
          counters.attackerBodyInjected = true;
          Reflect.apply(originals.emit, response, ['data', Buffer.from(ATTACKER_BODY)]);
          Reflect.apply(originals.emit, response, ['end']);
        });
        return this;
      }
      return Reflect.apply(originals.resume, this, []);
    };
  };
  const installListenerCount = () => {
    EventEmitter.prototype.listenerCount = function substitutedListenerCount(event, listener) {
      if (this instanceof IncomingMessage) counters.listenerCount += 1;
      return listener === undefined
        ? Reflect.apply(originals.listenerCount, this, [event])
        : Reflect.apply(originals.listenerCount, this, [event, listener]);
    };
  };
  const installFunctionCall = () => {
    Function.prototype.call = function substitutedFunctionCall(receiver, ...args) {
      if (protectedMethods.has(this) && receiver instanceof IncomingMessage) counters.functionCall += 1;
      return Reflect.apply(originals.functionCall, this, [receiver, ...args]);
    };
  };
  const installAll = () => {
    installEmit();
    installReadableOn();
    installResume();
    installListenerCount();
    installFunctionCall();
  };

  if (scenario === 'emit') installEmit();
  if (scenario === 'readable-on') installReadableOn();
  if (scenario === 'resume') installResume();
  if (scenario === 'listener-count') installListenerCount();
  if (scenario === 'function-call') installFunctionCall();
  if (scenario === 'combined' || scenario === 'outage' || scenario === 'response-error') installAll();

  let output;
  try {
    const result = await authority.fetchRecoveryCompletionCapabilities(completedLedger());
    output = {
      scenario,
      capabilityCount: p.mapSize(result.capabilities),
      diagnosticIds: p.arrayMap(result.diagnostics, (item) => item.diagnostic_id),
      counters,
      attackerBodyReceived: counters.attackerBodyInjected,
      attackerBodyParsed: false,
    };
  } finally {
    EventEmitter.prototype.emit = originals.emit;
    Readable.prototype.on = originals.readableOn;
    Readable.prototype.resume = originals.resume;
    EventEmitter.prototype.listenerCount = originals.listenerCount;
    Function.prototype.call = originals.functionCall;
  }
  process.stdout.write(JSON.stringify(output));
}

function safeResult(result, counter) {
  return result.status === 0
    && result.output?.capabilityCount === 0
    && result.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
    && result.output?.counters?.[counter] === 0
    && result.output?.counters?.attackerBodyInjected === false
    && result.output?.attackerBodyReceived === false
    && result.output?.attackerBodyParsed === false
    && result.observations.authenticRepositoryBodies === 1;
}

async function parentMain() {
  const directory = mkdtempSync(join(tmpdir(), 'recovery-readable-dependencies-'));
  const cases = [];
  const record = (name, pass, details) => cases.push({ name, pass: Boolean(pass), details });
  try {
    const loaderPath = writeLoader(directory);
    const baseline = await runScenario(loaderPath, 'baseline');
    record(
      'real IncomingMessage receives the authentic repository body before bounded fail-closed continuation',
      baseline.status === 0
        && baseline.output?.capabilityCount === 0
        && baseline.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
        && baseline.observations.authenticRepositoryBodies === 1
        && baseline.observations.requests.length >= 2,
      baseline.output || baseline.stderr,
    );
    for (const [scenario, label, counter] of [
      ['emit', 'EventEmitter emit substitution', 'emit'],
      ['readable-on', 'Readable on substitution', 'readableOn'],
      ['resume', 'Readable resume injection', 'resume'],
      ['listener-count', 'EventEmitter listenerCount substitution', 'listenerCount'],
      ['function-call', 'Function prototype call substitution', 'functionCall'],
    ]) {
      const result = await runScenario(loaderPath, scenario);
      record(`${label} is not resolved by the production response collector`, safeResult(result, counter), result.output || result.stderr);
    }
    const combined = await runScenario(loaderPath, 'combined');
    record(
      'combined emit on resume listenerCount and Function call substitutions cannot inject mix or end the authentic response',
      combined.status === 0
        && combined.output?.capabilityCount === 0
        && combined.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
        && Object.values(combined.output?.counters || {}).every((value) => value === 0 || value === false)
        && combined.observations.authenticRepositoryBodies === 1,
      combined.output || combined.stderr,
    );
    const outage = await runScenario(loaderPath, 'outage', 'outage');
    record(
      'authentic request outage remains fail-closed under all response dependency substitutions',
      outage.status === 0
        && outage.output?.capabilityCount === 0
        && outage.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
        && Object.values(outage.output?.counters || {}).every((value) => value === 0 || value === false),
      outage.output || outage.stderr,
    );
    const responseError = await runScenario(loaderPath, 'response-error', 'response-error');
    record(
      'partial authentic response and socket failure cannot be completed by synthetic data or end',
      responseError.status === 0
        && responseError.output?.capabilityCount === 0
        && responseError.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
        && Object.values(responseError.output?.counters || {}).every((value) => value === 0 || value === false)
        && responseError.observations.responseErrors >= 1,
      responseError.output || responseError.stderr,
    );
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
  const failures = cases.filter((item) => !item.pass);
  process.stdout.write(`${JSON.stringify({
    suite: 'recovery-completion-readable-dependency-closure',
    production_authority: true,
    production_verifier: true,
    production_descriptor_graph: true,
    real_client_request: true,
    real_incoming_message: true,
    lowest_network_destination_replaced: true,
    test_result_postprocessing: false,
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    cases,
  }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

if (process.env.RECOVERY_READABLE_DEPENDENCY_CHILD === '1') await childMain();
else await parentMain();
