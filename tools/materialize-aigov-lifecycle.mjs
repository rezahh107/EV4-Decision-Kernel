#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { buildEvent, buildLedger, canonicalSha256, sha256, validateLifecycleLedger } from './lib/aigov-lifecycle.mjs';
import { validateCiIdentity } from './lib/aigov-ci-evidence.mjs';

const ROOT = process.cwd();
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';
const SCHEMA_PATH = 'kernel/schemas/aigov-lifecycle-ledger.v1.schema.json';
const CI_SCHEMA_PATH = 'kernel/schemas/aigov-ci-identity.v1.schema.json';

function parseArgs(argv) {
  const result = { head: null, evidenceManifest: null, scopeDisclosure: null, ciIdentity: null, output: 'artifacts/aigov-batch-a-lifecycle-ledger.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--head') result.head = argv[++index];
    else if (argv[index] === '--evidence-manifest') result.evidenceManifest = argv[++index];
    else if (argv[index] === '--scope-disclosure') result.scopeDisclosure = argv[++index];
    else if (argv[index] === '--ci-identity') result.ciIdentity = argv[++index];
    else if (argv[index] === '--output') result.output = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.head || '') || !result.evidenceManifest || !result.scopeDisclosure || !result.ciIdentity) throw new Error('--head, --evidence-manifest, --scope-disclosure and --ci-identity are required.');
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = JSON.parse(readFileSync(path.resolve(ROOT, SCOPE_PATH), 'utf8'));
  const evidenceRaw = readFileSync(path.resolve(ROOT, args.evidenceManifest));
  const evidence = JSON.parse(evidenceRaw.toString('utf8'));
  const disclosureRaw = readFileSync(path.resolve(ROOT, args.scopeDisclosure));
  const disclosure = JSON.parse(disclosureRaw.toString('utf8'));
  const ciIdentity = JSON.parse(readFileSync(path.resolve(ROOT, args.ciIdentity), 'utf8'));
  const actualHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (args.head !== actualHead || evidence.head_sha !== args.head || disclosure.head_sha !== args.head || evidence.scope_revision !== scope.scope_revision || disclosure.scope_revision !== scope.scope_revision || evidence.manifest_state !== 'executed_exact_head' || disclosure.status !== 'pass') throw new Error('AIGOV_LIFECYCLE_INPUT_IDENTITY_MISMATCH');
  const context = { planId: scope.plan_id, batchId: scope.batch_id, repository: scope.repository, repositoryId: 1292378784, prNumber: 49, baseSha: scope.base_sha, headSha: args.head, scopeRevision: scope.scope_revision };
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validateCiSchema = ajv.compile(JSON.parse(readFileSync(path.resolve(ROOT, CI_SCHEMA_PATH), 'utf8')));
  if (!validateCiSchema(ciIdentity)) throw new Error(`AIGOV_CI_IDENTITY_SCHEMA_INVALID:${JSON.stringify(validateCiSchema.errors)}`);
  const ciDiagnostics = validateCiIdentity(ciIdentity, context);
  if (ciDiagnostics.length) throw new Error(`AIGOV_CI_IDENTITY_INVALID:${JSON.stringify(ciDiagnostics)}`);
  if (Date.parse(evidence.generated_at) > Date.parse(ciIdentity.completed_at)) throw new Error('AIGOV_CI_COMPLETION_PRECEDES_LOCAL_EVIDENCE');
  const occurredAt = evidence.generated_at;
  const evidenceRows = [
    ['start_preflight', sha256(`${scope.repository}:${args.head}`), `git:${args.head}`, occurredAt, 'local_deterministic'],
    ['scope_committed', sha256(JSON.stringify(scope)), SCOPE_PATH, occurredAt, 'local_deterministic'],
    ['scope_disclosed', sha256(disclosureRaw), args.scopeDisclosure, occurredAt, 'local_deterministic'],
    ['implementation_complete', sha256(execFileSync('git', ['rev-parse', `${args.head}^{tree}`], { cwd: ROOT, encoding: 'utf8' }).trim()), `git-tree:${args.head}`, occurredAt, 'local_deterministic'],
    ['exact_head_validated', ciIdentity.identity_digest, ciIdentity.run.html_url, ciIdentity.completed_at, 'authoritative_exact_head_ci'],
  ];
  const events = [];
  let predecessorEventId = null;
  for (const [eventType, digest, reference, eventTime, kind] of evidenceRows) {
    const event = buildEvent({ eventType, predecessorEventId, occurredAt: eventTime, context, evidence: { kind, sha256: digest, reference } });
    events.push(event);
    predecessorEventId = event.event_id;
  }
  const ledger = buildLedger(context, events);
  const validate = ajv.compile(JSON.parse(readFileSync(path.resolve(ROOT, SCHEMA_PATH), 'utf8')));
  if (!validate(ledger)) throw new Error(`AIGOV_LIFECYCLE_SCHEMA_INVALID:${JSON.stringify(validate.errors)}`);
  const diagnostics = validateLifecycleLedger(ledger, context, { ciDigests: new Set([ciIdentity.identity_digest]) });
  if (diagnostics.length) throw new Error(`AIGOV_LIFECYCLE_INVALID:${JSON.stringify(diagnostics)}`);
  writeFileSync(path.resolve(ROOT, args.output), `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', head_sha: args.head, scope_revision: scope.scope_revision, ledger_sha256: canonicalSha256(ledger), output: args.output }, null, 2));
}

main();
