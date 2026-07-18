#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import {
  mkdtempSync,
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
const TASK_ID = 'KREC-INTRINSIC-HARDENING';
const TEST_TOKEN = 'intrinsics-fixture-token';

const functionCall = Function.prototype.call;
const functionBind = Function.prototype.bind;
const bindIntrinsic = functionCall.bind(functionBind);
const uncurryThis = (method) => bindIntrinsic(functionCall, method);
const safeJsonStringify = bindIntrinsic(JSON.stringify, JSON);
const safeObjectKeys = bindIntrinsic(Object.keys, Object);
const safeObjectIsFrozen = bindIntrinsic(Object.isFrozen, Object);
const safeReflectSet = bindIntrinsic(Reflect.set, Reflect);
const safeMapGet = uncurryThis(Map.prototype.get);
const safeMapSize = uncurryThis(
  Object.getOwnPropertyDescriptor(Map.prototype, 'size').get,
);
const safeSetTimeout = setTimeout;

function completedLedger(expiryMs = 5 * 60 * 1000) {
  return {
    repository: 'rezahh107/EV4-Decision-Kernel',
    default_branch: 'main',
    program_id: 'DCOV-COVERAGE-EXECUTION-PROGRAM',
    tasks: [{
      task_id: TASK_ID,
      lifecycle_state: 'complete',
      test_expiry_ms: expiryMs,
      candidate: {
        branch: 'krec-001/recovery-ledger',
        pull_request: 52,
        pr_state: 'merged',
      },
      completion_evidence: {
        pull_request: 52,
        reviewed_head_sha: '2'.repeat(40),
        resulting_main_sha: '3'.repeat(40),
        merge_method: 'merge',
        exact_head_ci: { run_id: 1001 },
        current_main_validation: { run_id: 1002 },
      },
    }],
  };
}

function mutationHarness(includeFunctionIntrinsics) {
  const counters = {
    weakSetAdd: 0,
    weakSetHas: 0,
    weakSetDelete: 0,
    weakMapSet: 0,
    weakMapGet: 0,
    weakMapDelete: 0,
    objectFreeze: 0,
    jsonParse: 0,
    jsonStringify: 0,
    url: 0,
    buffer: 0,
    arrayIsArray: 0,
    objectKeys: 0,
    objectFromEntries: 0,
    functionCall: 0,
    functionBind: 0,
  };
  const originals = {
    weakSetAdd: WeakSet.prototype.add,
    weakSetHas: WeakSet.prototype.has,
    weakSetDelete: WeakSet.prototype.delete,
    weakMapSet: WeakMap.prototype.set,
    weakMapGet: WeakMap.prototype.get,
    weakMapDelete: WeakMap.prototype.delete,
    objectFreeze: Object.freeze,
    jsonParse: JSON.parse,
    jsonStringify: JSON.stringify,
    url: globalThis.URL,
    buffer: globalThis.Buffer,
    arrayIsArray: Array.isArray,
    objectKeys: Object.keys,
    objectFromEntries: Object.fromEntries,
    functionCall: Function.prototype.call,
    functionBind: Function.prototype.bind,
  };

  WeakSet.prototype.add = function fakeWeakSetAdd() {
    counters.weakSetAdd += 1;
    return this;
  };
  WeakSet.prototype.has = function fakeWeakSetHas() {
    counters.weakSetHas += 1;
    return true;
  };
  WeakSet.prototype.delete = function fakeWeakSetDelete() {
    counters.weakSetDelete += 1;
    return true;
  };
  WeakMap.prototype.set = function fakeWeakMapSet() {
    counters.weakMapSet += 1;
    return this;
  };
  WeakMap.prototype.get = function fakeWeakMapGet() {
    counters.weakMapGet += 1;
    return { expiresAt: Number.MAX_SAFE_INTEGER };
  };
  WeakMap.prototype.delete = function fakeWeakMapDelete() {
    counters.weakMapDelete += 1;
    return true;
  };
  Object.freeze = (value) => {
    counters.objectFreeze += 1;
    return value;
  };
  JSON.parse = () => {
    counters.jsonParse += 1;
    return { trusted: false, substituted: true };
  };
  JSON.stringify = () => {
    counters.jsonStringify += 1;
    return '{"forged":true}';
  };
  globalThis.URL = class FakeURL {
    constructor() {
      counters.url += 1;
      throw new Error('mutable global URL used');
    }
  };
  globalThis.Buffer = {
    concat() {
      counters.buffer += 1;
      throw new Error('mutable global Buffer used');
    },
  };
  Array.isArray = () => {
    counters.arrayIsArray += 1;
    return false;
  };
  Object.keys = () => {
    counters.objectKeys += 1;
    return [];
  };
  Object.fromEntries = () => {
    counters.objectFromEntries += 1;
    return {};
  };
  if (includeFunctionIntrinsics) {
    Function.prototype.call = function fakeFunctionCall() {
      counters.functionCall += 1;
      return undefined;
    };
    Function.prototype.bind = function fakeFunctionBind() {
      counters.functionBind += 1;
      return () => undefined;
    };
  }

  return {
    counters,
    restore() {
      Function.prototype.call = originals.functionCall;
      Function.prototype.bind = originals.functionBind;
      WeakSet.prototype.add = originals.weakSetAdd;
      WeakSet.prototype.has = originals.weakSetHas;
      WeakSet.prototype.delete = originals.weakSetDelete;
      WeakMap.prototype.set = originals.weakMapSet;
      WeakMap.prototype.get = originals.weakMapGet;
      WeakMap.prototype.delete = originals.weakMapDelete;
      Object.freeze = originals.objectFreeze;
      JSON.parse = originals.jsonParse;
      JSON.stringify = originals.jsonStringify;
      globalThis.URL = originals.url;
      globalThis.Buffer = originals.buffer;
      Array.isArray = originals.arrayIsArray;
      Object.keys = originals.objectKeys;
      Object.fromEntries = originals.objectFromEntries;
    },
  };
}

function allCountersZero(counters) {
  return counters.weakSetAdd === 0
    && counters.weakSetHas === 0
    && counters.weakSetDelete === 0
    && counters.weakMapSet === 0
    && counters.weakMapGet === 0
    && counters.weakMapDelete === 0
    && counters.objectFreeze === 0
    && counters.jsonParse === 0
    && counters.jsonStringify === 0
    && counters.url === 0
    && counters.buffer === 0
    && counters.arrayIsArray === 0
    && counters.objectKeys === 0
    && counters.objectFromEntries === 0
    && counters.functionCall === 0
    && counters.functionBind === 0;
}

async function childMain() {
  const authority = await import(AUTHORITY_URL);
  const scenario = process.env.RECOVERY_INTRINSICS_SCENARIO;
  const ledger = completedLedger(scenario === 'expiry' ? 25 : undefined);
  const task = ledger.tasks[0];

  if (scenario === 'pre-mint') {
    const mutations = mutationHarness(false);
    let result;
    let capability;
    let output;
    try {
      result = await authority.fetchRecoveryCompletionCapabilities(ledger);
      capability = safeMapGet(result.capabilities, TASK_ID);
      const fabricated = {
        repository: ledger.repository,
        repository_id: 1292378784,
        default_branch: ledger.default_branch,
        task_id: TASK_ID,
        pull_request: 52,
        reviewed_head_sha: task.completion_evidence.reviewed_head_sha,
        resulting_main_sha: task.completion_evidence.resulting_main_sha,
        exact_head_run_id: 1001,
        current_main_run_id: 1002,
        merge_method: 'merge',
      };
      output = {
        scenario,
        minted: safeMapSize(result.capabilities) === 1 && Boolean(capability),
        diagnosticsEmpty: result.diagnostics.length === 0,
        genuineRecognized: authority.isRecoveryCompletionCapability(capability),
        genuineMatches: authority.recoveryCompletionCapabilityMatches(capability, ledger, task),
        fabricatedRejected: !authority.isRecoveryCompletionCapability(fabricated),
        fabricatedMatchRejected: !authority.recoveryCompletionCapabilityMatches(
          fabricated,
          ledger,
          task,
        ),
        tokenFrozen: safeObjectIsFrozen(capability),
        tokenKeyCount: safeObjectKeys(capability).length,
        secretAbsent: !safeJsonStringify(capability).includes(TEST_TOKEN),
        publicMintAbsent: authority.mintCapability === undefined
          && authority.registerRecoveryCompletionCapability === undefined,
        mutatedIntrinsicsUnused: allCountersZero(mutations.counters),
        counters: mutations.counters,
      };
    } finally {
      mutations.restore();
    }
    process.stdout.write(safeJsonStringify(output));
    return;
  }

  if (scenario === 'post-mint') {
    const result = await authority.fetchRecoveryCompletionCapabilities(ledger);
    const capability = safeMapGet(result.capabilities, TASK_ID);
    const before = authority.recoveryCompletionCapabilityMatches(capability, ledger, task);
    const mutations = mutationHarness(true);
    let output;
    try {
      const fabricated = {};
      const stillRecognized = authority.isRecoveryCompletionCapability(capability);
      const stillMatches = authority.recoveryCompletionCapabilityMatches(capability, ledger, task);
      const tokenRebound = safeReflectSet(capability, 'task_id', 'FORGED');
      task.completion_evidence.current_main_validation.run_id = 9002;
      const reboundRejected = !authority.recoveryCompletionCapabilityMatches(
        capability,
        ledger,
        task,
      );
      task.completion_evidence.current_main_validation.run_id = 1002;
      const originalBindingRestored = authority.recoveryCompletionCapabilityMatches(
        capability,
        ledger,
        task,
      );
      output = {
        scenario,
        before,
        stillRecognized,
        stillMatches,
        tokenRebound,
        reboundRejected,
        originalBindingRestored,
        fabricatedRejected: !authority.isRecoveryCompletionCapability(fabricated),
        fabricatedMatchRejected: !authority.recoveryCompletionCapabilityMatches(
          fabricated,
          ledger,
          task,
        ),
        mutatedIntrinsicsUnused: allCountersZero(mutations.counters),
        counters: mutations.counters,
      };
    } finally {
      mutations.restore();
    }
    process.stdout.write(safeJsonStringify(output));
    return;
  }

  if (scenario === 'expiry') {
    const result = await authority.fetchRecoveryCompletionCapabilities(ledger);
    const capability = safeMapGet(result.capabilities, TASK_ID);
    const initiallyRecognized = authority.isRecoveryCompletionCapability(capability);
    const mutations = mutationHarness(false);
    let output;
    try {
      await new Promise((resolve) => safeSetTimeout(resolve, 75));
      output = {
        scenario,
        initiallyRecognized,
        expiredRejected: !authority.isRecoveryCompletionCapability(capability),
        deleteHooksUnused: mutations.counters.weakSetDelete === 0
          && mutations.counters.weakMapDelete === 0,
        registryHooksUnused: mutations.counters.weakSetHas === 0
          && mutations.counters.weakMapGet === 0,
        counters: mutations.counters,
      };
    } finally {
      mutations.restore();
    }
    process.stdout.write(safeJsonStringify(output));
    return;
  }

  throw new Error(`Unknown intrinsic-hardening scenario: ${scenario}`);
}

function fixtureModules(directory) {
  const verifierPath = join(directory, 'mock-recovery-completion-verifier.mjs');
  const httpsPath = join(directory, 'mock-node-https.mjs');
  const loaderPath = join(directory, 'loader.mjs');

  writeFileSync(verifierPath, `
    import { createHash } from 'node:crypto';
    const call = Function.prototype.call;
    const bind = Function.prototype.bind;
    const bindIntrinsic = call.bind(bind);
    const uncurry = (method) => bindIntrinsic(call, method);
    const arrayIsArray = bindIntrinsic(Array.isArray, Array);
    const arrayMap = uncurry(Array.prototype.map);
    const arraySort = uncurry(Array.prototype.sort);
    const objectKeys = bindIntrinsic(Object.keys, Object);
    const objectFromEntries = bindIntrinsic(Object.fromEntries, Object);
    const jsonStringify = bindIntrinsic(JSON.stringify, JSON);
    const dateParse = bindIntrinsic(Date.parse, Date);
    const numberIsFinite = bindIntrinsic(Number.isFinite, Number);
    const NativeDate = Date;

    const canonical = (value) => {
      if (arrayIsArray(value)) return arrayMap(value, canonical);
      if (value && typeof value === 'object') {
        const keys = objectKeys(value);
        arraySort(keys);
        return objectFromEntries(arrayMap(keys, (key) => [key, canonical(value[key])]))
      }
      return value;
    };
    export function recoveryCompletionBinding(ledger, task) {
      return {
        repository: ledger?.repository,
        default_branch: ledger?.default_branch,
        program_id: ledger?.program_id,
        task_id: task?.task_id,
        candidate: task?.candidate,
        completion_evidence: task?.completion_evidence,
      };
    }
    const bindingSha = (ledger, task) => createHash('sha256')
      .update(jsonStringify(canonical(recoveryCompletionBinding(ledger, task))))
      .digest('hex');
    export function createRecoveryCompletionVerifier({ fetchImpl, token, now }) {
      return { fetchImpl, token, now };
    }
    export function recoveryVerifiedEvidenceMatches(value, ledger, task, nowMs) {
      const completion = task?.completion_evidence;
      const expiresAt = dateParse(value?.expires_at || '');
      return value?.evidence_type === 'recovery-completion-verification.v1'
        && numberIsFinite(expiresAt)
        && numberIsFinite(nowMs)
        && nowMs < expiresAt
        && value.repository === 'rezahh107/EV4-Decision-Kernel'
        && value.repository_id === 1292378784
        && value.default_branch === 'main'
        && value.task_id === task?.task_id
        && value.pull_request === completion?.pull_request
        && value.reviewed_head_sha === completion?.reviewed_head_sha
        && value.resulting_main_sha === completion?.resulting_main_sha
        && value.exact_head_run_id === completion?.exact_head_ci?.run_id
        && value.current_main_run_id === completion?.current_main_validation?.run_id
        && value.merge_method === completion?.merge_method
        && value.binding_sha256 === bindingSha(ledger, task);
    }
    export async function verifyRecoveryCompletionEvidence(ledger, taskId, { session }) {
      let task = null;
      for (let index = 0; index < ledger.tasks.length; index += 1) {
        if (ledger.tasks[index]?.task_id === taskId) task = ledger.tasks[index];
      }
      const response = await session.fetchImpl(
        'https://api.github.com/repos/rezahh107/EV4-Decision-Kernel/authority-probe',
        { headers: { Authorization: 'Bearer ' + session.token } },
      );
      const payload = await response.json();
      if (!response.ok || payload?.trusted !== true) {
        return { evidence: null, diagnostics: [{ diagnostic_id: 'MOCK_TRANSPORT_REJECTED' }] };
      }
      const nowMs = session.now();
      const completion = task.completion_evidence;
      return {
        diagnostics: [],
        evidence: {
          evidence_type: 'recovery-completion-verification.v1',
          repository: 'rezahh107/EV4-Decision-Kernel',
          repository_id: 1292378784,
          default_branch: 'main',
          task_id: task.task_id,
          pull_request: completion.pull_request,
          reviewed_head_sha: completion.reviewed_head_sha,
          resulting_main_sha: completion.resulting_main_sha,
          exact_head_run_id: completion.exact_head_ci.run_id,
          current_main_run_id: completion.current_main_validation.run_id,
          exact_head_workflow_source: {
            workflow_id: 309028718,
            workflow_commit_sha: completion.reviewed_head_sha,
            workflow_blob_sha: 'a'.repeat(40),
            workflow_final_byte_sha256: 'b'.repeat(64),
            workflow_policy_id: 'recovery-workflow-source.mvk.v1',
            reference: 'https://api.github.com/mock/mvk',
          },
          current_main_workflow_source: {
            workflow_id: 312952795,
            workflow_commit_sha: completion.resulting_main_sha,
            workflow_blob_sha: 'c'.repeat(40),
            workflow_final_byte_sha256: 'd'.repeat(64),
            workflow_policy_id: 'recovery-workflow-source.main.v1',
            reference: 'https://api.github.com/mock/main',
          },
          observed_at: new NativeDate(nowMs).toISOString(),
          expires_at: new NativeDate(nowMs + task.test_expiry_ms).toISOString(),
          merge_method: completion.merge_method,
          binding_sha256: bindingSha(ledger, task),
        },
      };
    }
  `);

  writeFileSync(httpsPath, `
    import { Buffer as NodeBuffer } from 'node:buffer';
    import { EventEmitter } from 'node:events';
    const stringify = JSON.stringify.bind(JSON);
    const NativeDate = Date;
    export class Agent {
      constructor(options = {}) { this.options = options; }
    }
    export function request(url, options, callback) {
      const requestValue = new EventEmitter();
      requestValue.setTimeout = () => requestValue;
      requestValue.destroy = (error) => {
        queueMicrotask(() => requestValue.emit('error', error));
      };
      requestValue.end = () => {
        queueMicrotask(() => {
          const response = new EventEmitter();
          response.statusCode = 200;
          response.headers = { date: new NativeDate().toUTCString() };
          callback(response);
          queueMicrotask(() => {
            const authorized = options?.headers?.Authorization === 'Bearer ${TEST_TOKEN}';
            response.emit('data', NodeBuffer.from(stringify({ trusted: authorized })));
            response.emit('end');
          });
        });
      };
      return requestValue;
    }
  `);

  writeFileSync(loaderPath, `
    import { pathToFileURL } from 'node:url';
    const verifierUrl = pathToFileURL(process.env.RECOVERY_INTRINSICS_VERIFIER).href;
    const httpsUrl = pathToFileURL(process.env.RECOVERY_INTRINSICS_HTTPS).href;
    export async function resolve(specifier, context, nextResolve) {
      const authorityParent = context.parentURL?.endsWith('/recovery-completion-evidence.mjs');
      if (authorityParent && specifier === './recovery-completion-verifier.mjs') {
        return { url: verifierUrl, shortCircuit: true };
      }
      if (authorityParent && specifier === 'node:https') {
        return { url: httpsUrl, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    }
  `);

  return { verifierPath, httpsPath, loaderPath };
}

function runChild(scenario, modules) {
  const result = spawnSync(
    process.execPath,
    ['--no-warnings', `--experimental-loader=${modules.loaderPath}`, fileURLToPath(import.meta.url)],
    {
      cwd: ROOT,
      encoding: 'utf8',
      env: {
        ...process.env,
        RECOVERY_GITHUB_TOKEN: TEST_TOKEN,
        RECOVERY_INTRINSICS_CHILD: '1',
        RECOVERY_INTRINSICS_SCENARIO: scenario,
        RECOVERY_INTRINSICS_VERIFIER: modules.verifierPath,
        RECOVERY_INTRINSICS_HTTPS: modules.httpsPath,
      },
    },
  );
  let output = null;
  try {
    output = JSON.parse(result.stdout);
  } catch {
    output = null;
  }
  return { result, output };
}

if (process.env.RECOVERY_INTRINSICS_CHILD === '1') {
  await childMain();
} else {
  const directory = mkdtempSync(join(tmpdir(), 'recovery-intrinsics-'));
  const cases = [];
  const record = (name, pass, detail = null) => cases.push({ name, pass: Boolean(pass), detail });
  try {
    const modules = fixtureModules(directory);
    const preMint = runChild('pre-mint', modules);
    record('isolated pre-mint mutation subprocess exits cleanly', preMint.result.status === 0, preMint.result.stderr);
    record('captured transport and canonical intrinsics still mint one capability', preMint.output?.minted && preMint.output?.diagnosticsEmpty, preMint.output);
    record('genuine capability remains recognized and exact-bound', preMint.output?.genuineRecognized && preMint.output?.genuineMatches, preMint.output);
    record('ordinary fabricated object cannot manufacture registry membership', preMint.output?.fabricatedRejected, preMint.output);
    record('ordinary fabricated object cannot pass capability matching', preMint.output?.fabricatedMatchRejected, preMint.output);
    record('registered authority token is zero-data and frozen', preMint.output?.tokenFrozen && preMint.output?.tokenKeyCount === 0, preMint.output);
    record('registered authority token exposes no workflow credential', preMint.output?.secretAbsent, preMint.output);
    record('production module exposes no public mint or registration function', preMint.output?.publicMintAbsent, preMint.output);
    record('pre-mint substitutions never invoke mutable intrinsic surfaces', preMint.output?.mutatedIntrinsicsUnused, preMint.output?.counters);

    const postMint = runChild('post-mint', modules);
    record('isolated post-mint mutation subprocess exits cleanly', postMint.result.status === 0, postMint.result.stderr);
    record('registered capability survives Function.prototype.call and bind substitution', postMint.output?.before && postMint.output?.stillRecognized && postMint.output?.stillMatches, postMint.output);
    record('frozen token cannot be rebound through caller-visible fields', postMint.output?.tokenRebound === false, postMint.output);
    record('private registration snapshot rejects another evidence binding', postMint.output?.reboundRejected, postMint.output);
    record('original private binding remains valid after rejected rebind', postMint.output?.originalBindingRestored, postMint.output);
    record('post-mint prototype substitution cannot forge membership or matching', postMint.output?.fabricatedRejected && postMint.output?.fabricatedMatchRejected, postMint.output);
    record('post-mint authority checks bypass every mutated intrinsic', postMint.output?.mutatedIntrinsicsUnused, postMint.output?.counters);

    const expiry = runChild('expiry', modules);
    record('isolated expiry mutation subprocess exits cleanly', expiry.result.status === 0, expiry.result.stderr);
    record('expired private registration fails closed', expiry.output?.initiallyRecognized && expiry.output?.expiredRejected, expiry.output);
    record('expiry cleanup uses captured WeakSet and WeakMap delete operations', expiry.output?.deleteHooksUnused && expiry.output?.registryHooksUnused, expiry.output?.counters);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }

  const failed = cases.filter((item) => !item.pass);
  process.stdout.write(`Recovery intrinsic hardening: ${cases.length - failed.length}/${cases.length} cases passed.\n`);
  if (failed.length) {
    process.stderr.write(`${JSON.stringify(failed, null, 2)}\n`);
    process.exitCode = 1;
  }
}
