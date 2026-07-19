import { spawnSync as nodeSpawnSync } from 'node:child_process';
import {
  createHmac as nodeCreateHmac,
  randomBytes as nodeRandomBytes,
  timingSafeEqual as nodeTimingSafeEqual,
} from 'node:crypto';
import { basename, dirname } from 'node:path';
import { setTimeout as nodeSetTimeout } from 'node:timers';
import { fileURLToPath } from 'node:url';
import { recoveryPrimordials as p } from './recovery-primordials.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const DEFAULT_BRANCH = 'main';
const MAX_INPUT_BYTES = 1024 * 1024;
const MAX_OUTPUT_BYTES = 8 * 1024 * 1024;
const WORKER_TIMEOUT_MS = 45_000;
const MUTATION_OBSERVATION_DELAY_MS = 20;
const WORKER_PATH = fileURLToPath(new URL('./recovery-completion-isolated-worker.mjs', import.meta.url));
const WORKER_CWD = dirname(WORKER_PATH);
const TRUSTED_EXECUTABLE = process.execPath;
const TRUSTED_PLATFORM = process.platform;
const TRUSTED_SYSTEM_ROOT = typeof process.env.SystemRoot === 'string'
  ? process.env.SystemRoot
  : null;
const TEST_ENTRYPOINTS = new p.TrustedSet([
  'test-recovery-completion-transitive-intrinsics.mjs',
  'test-recovery-completion-node-transport-and-hash.mjs',
  'test-recovery-completion-readable-dependencies.mjs',
  'test-recovery-completion-isolation-boundary.mjs',
]);
const currentEntrypoint = typeof process.argv[1] === 'string' ? basename(process.argv[1]) : '';
const declaredTestPort = Number.parseInt(process.env.RECOVERY_LOCAL_SERVER_PORT || '', 10);
const fixtureModeRequested = (process.env.RECOVERY_TRANSITIVE_CHILD === '1'
    || process.env.RECOVERY_NODE_SECURITY_CHILD === '1'
    || process.env.RECOVERY_READABLE_DEPENDENCY_CHILD === '1'
    || process.env.RECOVERY_ISOLATION_BOUNDARY_CHILD === '1')
  && p.setHas(TEST_ENTRYPOINTS, currentEntrypoint)
  && Number.isInteger(declaredTestPort)
  && declaredTestPort > 0
  && declaredTestPort <= 65535;
const FIXTURE_PORT = fixtureModeRequested ? declaredTestPort : null;

const spawnSync = nodeSpawnSync;
const randomBytes = nodeRandomBytes;
const timingSafeEqual = nodeTimingSafeEqual;
const trustedSetTimeout = nodeSetTimeout;
const hmacProbe = nodeCreateHmac('sha256', p.bufferFrom('probe'));
const hmacPrototype = p.objectGetPrototypeOf(hmacProbe);
const hmacUpdate = p.uncurryThis(hmacPrototype.update);
const hmacDigest = p.uncurryThis(hmacPrototype.digest);
const ISOLATED_SESSIONS = new p.TrustedWeakMap();
const HEX_64 = /^[0-9a-f]{64}$/;

function canonical(value) {
  if (p.arrayIsArray(value)) return p.arrayMap(value, canonical);
  if (value && typeof value === 'object') {
    const keys = p.objectKeys(value);
    p.arraySort(keys);
    return p.objectFromEntries(p.arrayMap(keys, (key) => [key, canonical(value[key])]));
  }
  return value;
}

function canonicalJson(value) {
  return p.jsonStringify(canonical(value));
}

function hmacHex(key, value) {
  const hmac = nodeCreateHmac('sha256', key);
  hmacUpdate(hmac, canonicalJson(value));
  return hmacDigest(hmac, 'hex');
}

function diagnostic(taskPath, observed) {
  return {
    diagnostic_id: 'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
    severity: 'error',
    path: `${taskPath}/completion_evidence`,
    expected: 'complete fresh official GitHub REST evidence set',
    observed,
    remediation: 'Fail closed until every required official GitHub payload is available; do not substitute ledger data or serialized lookalikes.',
  };
}

function safeError(error) {
  try {
    return error && typeof error.message === 'string' ? error.message : p.TrustedString(error);
  } catch {
    return 'isolated verifier failure';
  }
}

function snapshotLedger(ledger, taskId) {
  const tasks = p.arrayIsArray(ledger?.tasks) ? ledger.tasks : [];
  const taskIndex = p.arrayFindIndex(tasks, (item) => item?.task_id === taskId);
  const task = taskIndex >= 0 ? tasks[taskIndex] : null;
  const taskPath = taskIndex >= 0 ? `/tasks/${taskIndex}` : '/tasks';
  if (!task) return { ledger: null, task: null, taskPath };
  const narrow = {
    schema_version: ledger?.schema_version,
    repository: ledger?.repository,
    default_branch: ledger?.default_branch,
    program_id: ledger?.program_id,
    tasks: [task],
  };
  const encoded = p.jsonStringify(narrow);
  if (p.bufferFrom(encoded).length > MAX_INPUT_BYTES) {
    throw new p.TrustedError('Recovery isolation input exceeds bounded capacity');
  }
  const copy = p.jsonParse(encoded);
  return { ledger: copy, task: copy.tasks[0], taskPath };
}

function allowlistedEnvironment() {
  const env = {
    LANG: 'C',
    LC_ALL: 'C',
    TZ: 'UTC',
  };
  if (TRUSTED_PLATFORM === 'win32' && TRUSTED_SYSTEM_ROOT) env.SystemRoot = TRUSTED_SYSTEM_ROOT;
  return env;
}

function validEnvelope(envelope, nonce, bindingSha256, key) {
  if (!envelope || envelope.schema_version !== 'recovery-isolated-result.v1') return false;
  if (envelope.nonce !== nonce || envelope.binding_sha256 !== bindingSha256) return false;
  if (!envelope.result || !p.arrayIsArray(envelope.result.diagnostics)) return false;
  if (typeof envelope.mac !== 'string' || !p.regexpTest(HEX_64, envelope.mac)) return false;
  const signed = {
    schema_version: envelope.schema_version,
    nonce: envelope.nonce,
    binding_sha256: envelope.binding_sha256,
    result: envelope.result,
  };
  const expected = p.bufferFrom(hmacHex(key, signed), 'hex');
  const observed = p.bufferFrom(envelope.mac, 'hex');
  return expected.length === observed.length && timingSafeEqual(expected, observed);
}

export function createRecoveryCompletionIsolatedVerifier({ token, now } = {}) {
  const session = p.objectFreeze({ verifier_type: 'recovery-completion-isolated-verifier.v1' });
  p.weakMapSet(ISOLATED_SESSIONS, session, p.objectFreeze({
    token: typeof token === 'string' && token.length > 0 ? token : null,
    now: typeof now === 'function' ? now : p.dateNow,
  }));
  return session;
}

export function isRecoveryCompletionIsolatedVerifier(value) {
  return p.TrustedBoolean(value && p.weakMapGet(ISOLATED_SESSIONS, value));
}

export async function verifyRecoveryCompletionEvidenceIsolated(ledger, taskId, session) {
  const state = p.weakMapGet(ISOLATED_SESSIONS, session);
  const snapshot = snapshotLedger(ledger, taskId);
  if (!state || !snapshot.task) {
    return { evidence: null, diagnostics: [diagnostic(snapshot.taskPath, 'isolated verifier session or task unavailable')] };
  }
  if (snapshot.ledger.repository !== REPOSITORY || snapshot.ledger.default_branch !== DEFAULT_BRANCH) {
    return { evidence: null, diagnostics: [diagnostic(snapshot.taskPath, 'isolated verifier repository boundary mismatch')] };
  }
  if (!state.token) {
    return { evidence: null, diagnostics: [diagnostic(snapshot.taskPath, 'RECOVERY_GITHUB_TOKEN unavailable')] };
  }

  // Snapshot first, then yield once so caller-side asynchronous mutation is
  // observable by the parent binding check while the child keeps immutable input.
  await new p.TrustedPromise((resolve) => trustedSetTimeout(resolve, MUTATION_OBSERVATION_DELAY_MS));

  const bindingSha256 = p.canonicalSha256({
    repository: snapshot.ledger.repository,
    default_branch: snapshot.ledger.default_branch,
    program_id: snapshot.ledger.program_id,
    task_id: snapshot.task.task_id,
    candidate: snapshot.task.candidate,
    completion_evidence: snapshot.task.completion_evidence,
  });
  const nonce = p.bufferToString(randomBytes(32), 'hex');
  const macKey = randomBytes(32);
  const request = {
    schema_version: 'recovery-isolated-request.v1',
    nonce,
    binding_sha256: bindingSha256,
    mac_key: p.bufferToString(macKey, 'base64'),
    token: state.token,
    ledger: snapshot.ledger,
    task_id: snapshot.task.task_id,
    transport: FIXTURE_PORT
      ? { mode: 'fixture', port: FIXTURE_PORT }
      : { mode: 'github' },
  };

  try {
    const encoded = canonicalJson(request);
    const execution = spawnSync(
      TRUSTED_EXECUTABLE,
      ['--no-warnings', '--no-addons', '--disable-proto=throw', WORKER_PATH],
      {
        cwd: WORKER_CWD,
        env: allowlistedEnvironment(),
        input: encoded,
        encoding: 'utf8',
        timeout: WORKER_TIMEOUT_MS,
        maxBuffer: MAX_OUTPUT_BYTES,
        windowsHide: true,
        shell: false,
      },
    );
    if (execution.error) throw execution.error;
    if (execution.signal || execution.status !== 0) {
      throw new p.TrustedError(`isolated verifier exited ${execution.status ?? execution.signal}`);
    }
    if (typeof execution.stdout !== 'string' || p.bufferFrom(execution.stdout).length > MAX_OUTPUT_BYTES) {
      throw new p.TrustedError('isolated verifier output malformed or oversized');
    }
    const envelope = p.jsonParse(execution.stdout);
    if (!validEnvelope(envelope, nonce, bindingSha256, macKey)) {
      throw new p.TrustedError('isolated verifier result authentication failed');
    }
    return envelope.result;
  } catch (error) {
    return { evidence: null, diagnostics: [diagnostic(snapshot.taskPath, safeError(error))] };
  }
}
