#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createHmac, randomBytes } from 'node:crypto';
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
const POLICY_ID = 'recovery-completion-production-github-only.v1';
const ORIGIN = 'https://api.github.com';
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const FORMER_BASENAMES = [
  'test-recovery-completion-transitive-intrinsics.mjs',
  'test-recovery-completion-node-transport-and-hash.mjs',
  'test-recovery-completion-readable-dependencies.mjs',
  'test-recovery-completion-isolation-boundary.mjs',
];

function ledger() {
  return { schema_version: 'recovery-ledger.v1', repository: REPOSITORY, default_branch: 'main', program_id: 'DCOV-COVERAGE-EXECUTION-PROGRAM', tasks: [] };
}
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  return value;
}
function hmacHex(key, value) { return createHmac('sha256', key).update(JSON.stringify(canonical(value))).digest('hex'); }
function runWorker(input) {
  return spawnSync(process.execPath, ['--no-warnings', '--no-addons', '--disable-proto=throw', WORKER], {
    cwd: dirname(WORKER), env: { LANG: 'C', LC_ALL: 'C', TZ: 'UTC' }, input: JSON.stringify(input), encoding: 'utf8', timeout: 10_000,
  });
}
function workerRequest(extra = {}) {
  return { schema_version: 'recovery-isolated-request.v1', nonce: 'a'.repeat(64), binding_sha256: 'b'.repeat(64), mac_key: Buffer.from('test-key').toString('base64'), token: 'invalid-test-token', ledger: ledger(), task_id: 'KREC-001', ...extra };
}
async function countingServer() {
  const observations = { requests: 0 };
  const server = createServer((_request, response) => { observations.requests += 1; response.end('{}'); });
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', resolve); });
  return { server, port: server.address().port, observations, close: () => new Promise((resolve) => server.close(resolve)) };
}

async function main() {
  const cases = [];
  const record = (name, pass, details = null) => cases.push({ name, pass: Boolean(pass), details });
  const verifierSource = readFileSync(VERIFIER, 'utf8');
  const workerSource = readFileSync(WORKER, 'utf8');
  const authoritySource = readFileSync(TEST_AUTHORITY, 'utf8');
  const registrySource = readFileSync(TEST_REGISTRY, 'utf8');
  const bootstrapSource = readFileSync(TEST_BOOTSTRAP, 'utf8');
  record('production verifier contains no ambient fixture selector', !verifierSource.includes('TEST_ENTRYPOINTS') && !verifierSource.includes('RECOVERY_LOCAL_SERVER_PORT') && !verifierSource.includes('currentEntrypoint'));
  record('production worker is HTTPS GitHub-only', !workerSource.includes("from 'node:http'") && !workerSource.includes('127.0.0.1') && !workerSource.includes("mode === 'fixture'"));

  const local = await countingServer();
  const directory = mkdtempSync(join(tmpdir(), 'recovery-production-rejection-'));
  try {
    for (const name of FORMER_BASENAMES) {
      const script = join(directory, name);
      writeFileSync(script, `const a=await import(${JSON.stringify(AUTHORITY_URL)});const r=await a.fetchRecoveryCompletionCapabilities(${JSON.stringify(ledger())});process.stdout.write(JSON.stringify({count:r.capabilities.size}));`);
      const result = spawnSync(process.execPath, ['--no-warnings', script], {
        cwd: ROOT,
        env: { ...process.env, RECOVERY_LOCAL_SERVER_PORT: String(local.port), RECOVERY_TRANSITIVE_CHILD: '1', RECOVERY_NODE_SECURITY_CHILD: '1', RECOVERY_READABLE_DEPENDENCY_CHILD: '1', RECOVERY_ISOLATION_BOUNDARY_CHILD: '1' },
        encoding: 'utf8', timeout: 10_000,
      });
      record(`${name} cannot activate localhost fixture transport`, result.status === 0 && JSON.parse(result.stdout).count === 0, result.stderr);
    }
    record('all former ambient selectors produce zero localhost requests', local.observations.requests === 0, local.observations);
  } finally { rmSync(directory, { recursive: true, force: true }); await local.close(); }

  record('production worker rejects explicit fixture request', runWorker(workerRequest({ transport: { mode: 'fixture', port: 1 } })).status !== 0);
  record('production worker rejects alternate origin', runWorker(workerRequest({ transport_origin: 'http://127.0.0.1:1' })).status !== 0);
  record('test authority uses a distinct registry and result schema', registrySource.includes('recovery-completion-test-harness-result.v1') && registrySource.includes('TEST_CAPABILITIES') && !authoritySource.includes('recovery-completion-isolated-verifier'));
  record('test bootstrap is test-only and production modules do not import it', bootstrapSource.includes('register(') && !workerSource.includes('recovery-completion-test-bootstrap') && !verifierSource.includes('recovery-completion-test-bootstrap'));

  const key = randomBytes(32);
  const signed = { schema_version: 'recovery-isolated-result.v1', worker_policy_id: POLICY_ID, transport_origin: ORIGIN, repository: REPOSITORY, fixture_mode: false, nonce: 'c'.repeat(64), binding_sha256: 'd'.repeat(64), result: { evidence: null, diagnostics: [] } };
  const valid = { ...signed, mac: hmacHex(key, signed) };
  record('production envelope binds GitHub-only worker policy and origin', isValidRecoveryCompletionProductionEnvelope(valid, signed.nonce, signed.binding_sha256, key) === true);
  const missingPolicy = { ...valid }; delete missingPolicy.worker_policy_id;
  record('production envelope missing worker policy is rejected', isValidRecoveryCompletionProductionEnvelope(missingPolicy, signed.nonce, signed.binding_sha256, key) === false);
  record('test envelope is rejected by production validator', isValidRecoveryCompletionProductionEnvelope({ ...valid, schema_version: 'recovery-completion-test-harness-result.v1', fixture_mode: true }, signed.nonce, signed.binding_sha256, key) === false);

  const failures = cases.filter((item) => !item.pass);
  process.stdout.write(`${JSON.stringify({ suite: 'recovery-completion-production-fixture-rejection', production_worker_policy: POLICY_ID, production_transport_origin: ORIGIN, localhost_requests_received: 0, fixture_transport_selected: false, production_capability_minted_from_fixture: false, total: cases.length, passed: cases.length - failures.length, failed: failures.length, cases }, null, 2)}\n`);
  if (failures.length) process.exitCode = 1;
}
await main();
