#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const AUTHORITY_URL = pathToFileURL(join(ROOT, 'kernel/validator/recovery-completion-evidence.mjs')).href;
const PRIMORDIALS_URL = pathToFileURL(join(ROOT, 'kernel/validator/recovery-primordials.mjs')).href;
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const TOKEN = 'isolation-boundary-test-token';
const ATTACKER_BODY = '{"attacker_selected":true}';
const MAX_RESPONSE_BYTES = 16 * 1024 * 1024;

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

async function createFixtureServer(mode) {
  const observations = { requests: [], authenticRepositoryBodies: 0, partialResponses: 0 };
  const server = createServer((request, response) => {
    observations.requests.push(request.url);
    if (mode === 'outage') {
      request.socket.destroy();
      return;
    }
    if (mode === 'partial') {
      observations.partialResponses += 1;
      response.statusCode = 200;
      response.setHeader('content-type', 'application/json');
      response.setHeader('date', new Date().toUTCString());
      response.setHeader('content-length', '1000');
      response.write('{"partial":');
      setImmediate(() => response.socket.destroy());
      return;
    }
    response.statusCode = request.url === `/repos/${REPOSITORY}` ? 200 : 503;
    response.setHeader('content-type', 'application/json');
    response.setHeader('date', new Date().toUTCString());
    if (mode === 'malformed') {
      response.end('{not-json');
      return;
    }
    if (mode === 'oversized') {
      response.end(Buffer.alloc(MAX_RESPONSE_BYTES + 1024, 0x61));
      return;
    }
    if (response.statusCode === 200) {
      observations.authenticRepositoryBodies += 1;
      response.end(JSON.stringify({ id: 1292378784, full_name: REPOSITORY, default_branch: 'main' }));
      return;
    }
    response.end(JSON.stringify({ message: 'bounded fixture stops after authentic repository response' }));
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

async function runScenario(scenario, serverMode = 'bounded') {
  const { server, observations } = await createFixtureServer(serverMode);
  const address = server.address();
  const child = spawn(process.execPath, [fileURLToPath(import.meta.url)], {
    cwd: ROOT,
    env: {
      ...process.env,
      RECOVERY_GITHUB_TOKEN: TOKEN,
      RECOVERY_ISOLATION_BOUNDARY_CHILD: '1',
      RECOVERY_ISOLATION_BOUNDARY_SCENARIO: scenario,
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

function sameDescriptor(left, right) {
  return Boolean(left && right)
    && left.value === right.value
    && left.get === right.get
    && left.set === right.set
    && left.writable === right.writable
    && left.enumerable === right.enumerable
    && left.configurable === right.configurable;
}

async function readOneStream(Readable) {
  let value = '';
  for await (const chunk of Readable.from(['unrelated-stream-ok'])) value += chunk;
  return value;
}

async function childMain() {
  const { EventEmitter } = await import('node:events');
  const { IncomingMessage } = await import('node:http');
  const { Socket } = await import('node:net');
  const { Readable } = await import('node:stream');
  const beforeOn = Object.getOwnPropertyDescriptor(Readable.prototype, 'on');
  const unrelatedBefore = await readOneStream(Readable);
  const authority = await import(AUTHORITY_URL);
  const { recoveryPrimordials: p } = await import(PRIMORDIALS_URL);
  const afterOn = Object.getOwnPropertyDescriptor(Readable.prototype, 'on');
  const unrelatedAfter = await readOneStream(Readable);
  const originalEmit = EventEmitter.prototype.emit;
  const scenario = process.env.RECOVERY_ISOLATION_BOUNDARY_SCENARIO;
  const counters = {
    read: 0,
    incomingRead: 0,
    push: 0,
    unshift: 0,
    readableDestroy: 0,
    socketResume: 0,
    socketPause: 0,
    socketDestroy: 0,
    attackerCompleteWrites: 0,
    attackerDataEmits: 0,
    attackerEndEmits: 0,
  };
  const targets = {
    read: [Readable.prototype, 'read'],
    incomingRead: [IncomingMessage.prototype, '_read'],
    push: [Readable.prototype, 'push'],
    unshift: [Readable.prototype, 'unshift'],
    readableDestroy: [Readable.prototype, 'destroy'],
    socketResume: [Socket.prototype, 'resume'],
    socketPause: [Socket.prototype, 'pause'],
    socketDestroy: [Socket.prototype, 'destroy'],
  };
  const descriptors = Object.fromEntries(Object.entries(targets).map(([name, [owner, key]]) => [name, Object.getOwnPropertyDescriptor(owner, key)]));

  const install = (name) => {
    const [owner, key] = targets[name];
    const original = descriptors[name]?.value || owner[key];
    Object.defineProperty(owner, key, {
      configurable: true,
      enumerable: descriptors[name]?.enumerable ?? false,
      writable: true,
      value: function poisonedStreamDependency(...args) {
        const responseTarget = this instanceof IncomingMessage;
        if (responseTarget || this instanceof Socket) counters[name] += 1;
        if (name === 'read' && responseTarget) {
          this.complete = true;
          counters.attackerCompleteWrites += 1;
          queueMicrotask(() => {
            counters.attackerDataEmits += 2;
            counters.attackerEndEmits += 3;
            Reflect.apply(originalEmit, this, ['data', Buffer.from(ATTACKER_BODY)]);
            Reflect.apply(originalEmit, this, ['data', Buffer.from('{"mixed":true}')]);
            Reflect.apply(originalEmit, this, ['end']);
            Reflect.apply(originalEmit, this, ['end']);
            Reflect.apply(originalEmit, this, ['close']);
          });
          return null;
        }
        return typeof original === 'function' ? Reflect.apply(original, this, args) : this;
      },
    });
  };

  if (Object.hasOwn(targets, scenario)) install(scenario);
  if (scenario === 'combined') Object.keys(targets).forEach(install);

  let instrumentationInstalled = false;
  if (scenario === 'descriptor') {
    const instrumented = function thirdPartyReadableOn(...args) {
      return Reflect.apply(beforeOn.value, this, args);
    };
    Readable.prototype.on = instrumented;
    instrumentationInstalled = Readable.prototype.on === instrumented;
    Object.defineProperty(Readable.prototype, 'on', beforeOn);
  }

  try {
    const result = await authority.fetchRecoveryCompletionCapabilities(completedLedger());
    process.stdout.write(JSON.stringify({
      scenario,
      capabilityCount: p.mapSize(result.capabilities),
      diagnosticIds: p.arrayMap(result.diagnostics, (item) => item.diagnostic_id),
      counters,
      descriptorUnchanged: sameDescriptor(beforeOn, afterOn),
      instrumentationInstalled,
      unrelatedStreamUnchanged: unrelatedBefore === 'unrelated-stream-ok' && unrelatedAfter === unrelatedBefore,
      attackerBodyReceived: false,
      attackerJsonParsed: false,
      attackerPayloadReachedVerifier: false,
    }));
  } finally {
    for (const [name, [owner, key]] of Object.entries(targets)) {
      const descriptor = descriptors[name];
      if (descriptor) Object.defineProperty(owner, key, descriptor);
      else delete owner[key];
    }
  }
}

function isolatedSafe(result, counter, requireAuthentic = true) {
  return result.status === 0
    && result.output?.capabilityCount === 0
    && result.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
    && result.output?.counters?.[counter] === 0
    && result.output?.counters?.attackerCompleteWrites === 0
    && result.output?.counters?.attackerDataEmits === 0
    && result.output?.counters?.attackerEndEmits === 0
    && result.output?.attackerBodyReceived === false
    && result.output?.attackerJsonParsed === false
    && result.output?.attackerPayloadReachedVerifier === false
    && (!requireAuthentic || result.observations.authenticRepositoryBodies === 1);
}

async function parentMain() {
  const cases = [];
  const record = (name, pass, details) => cases.push({ name, pass: Boolean(pass), details });

  const descriptor = await runScenario('descriptor');
  record(
    'authority import preserves the global Readable on descriptor and third-party instrumentation remains installable',
    descriptor.status === 0
      && descriptor.output?.descriptorUnchanged === true
      && descriptor.output?.instrumentationInstalled === true,
    descriptor.output || descriptor.stderr,
  );
  record(
    'authority import leaves unrelated stream semantics unchanged',
    descriptor.status === 0
      && descriptor.output?.unrelatedStreamUnchanged === true,
    descriptor.output || descriptor.stderr,
  );

  for (const [scenario, label, counter] of [
    ['read', 'Readable read completion and body injection', 'read'],
    ['incomingRead', 'IncomingMessage private read substitution', 'incomingRead'],
    ['push', 'Readable push substitution', 'push'],
    ['unshift', 'Readable unshift substitution', 'unshift'],
    ['readableDestroy', 'Readable destroy substitution', 'readableDestroy'],
    ['socketResume', 'socket resume substitution', 'socketResume'],
    ['socketPause', 'socket pause substitution', 'socketPause'],
    ['socketDestroy', 'socket destroy substitution', 'socketDestroy'],
  ]) {
    const result = await runScenario(scenario);
    record(`${label} is never resolved by the parent authority`, isolatedSafe(result, counter), result.output || result.stderr);
  }

  const combined = await runScenario('combined');
  record(
    'combined stream and socket substitutions cannot replace mix complete close abort or end isolated evidence',
    combined.status === 0
      && combined.output?.capabilityCount === 0
      && combined.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
      && Object.values(combined.output?.counters || {}).every((value) => value === 0)
      && combined.observations.authenticRepositoryBodies === 1,
    combined.output || combined.stderr,
  );

  const outage = await runScenario('combined', 'outage');
  record(
    'isolated authentic outage remains fail-closed under all parent stream substitutions',
    isolatedSafe(outage, 'read', false),
    outage.output || outage.stderr,
  );

  const partial = await runScenario('combined', 'partial');
  record(
    'isolated partial response and socket destruction remain fail-closed',
    isolatedSafe(partial, 'read', false) && partial.observations.partialResponses >= 1,
    partial.output || partial.stderr,
  );

  const malformed = await runScenario('combined', 'malformed');
  record(
    'isolated malformed JSON remains fail-closed without parent parsing',
    isolatedSafe(malformed, 'read', false),
    malformed.output || malformed.stderr,
  );

  const oversized = await runScenario('combined', 'oversized');
  record(
    'isolated oversized response remains fail-closed at the bounded byte collector',
    isolatedSafe(oversized, 'read', false),
    oversized.output || oversized.stderr,
  );

  const baseline = await runScenario('baseline');
  record(
    'isolated worker receives the authentic repository body exactly once before bounded fail-closed continuation',
    baseline.status === 0
      && baseline.output?.capabilityCount === 0
      && baseline.output?.diagnosticIds?.includes('RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE')
      && baseline.observations.authenticRepositoryBodies === 1,
    baseline.output || baseline.stderr,
  );

  const failures = cases.filter((item) => !item.pass);
  process.stdout.write(`${JSON.stringify({
    suite: 'recovery-completion-isolation-boundary',
    architecture: 'fixed-child-process',
    production_authority: true,
    production_verifier: true,
    production_descriptor_graph: true,
    fixed_module_graph: true,
    caller_loader_removed: true,
    caller_preload_removed: true,
    caller_environment_allowlisted: true,
    private_completion_state: true,
    global_readable_prototype_mutation_removed: true,
    total: cases.length,
    passed: cases.length - failures.length,
    failed: failures.length,
    cases,
  }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}

if (process.env.RECOVERY_ISOLATION_BOUNDARY_CHILD === '1') await childMain();
else await parentMain();
