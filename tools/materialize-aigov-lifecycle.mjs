#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { buildEvent, buildLedger, canonicalSha256, sha256, validateLifecycleLedger } from './lib/aigov-lifecycle.mjs';

const ROOT = process.cwd();
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';
const SCHEMA_PATH = 'kernel/schemas/aigov-lifecycle-ledger.v1.schema.json';

function parseArgs(argv) {
  const result = { head: null, evidenceManifest: null, scopeDisclosure: null, output: 'artifacts/aigov-batch-a-lifecycle-ledger.json' };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--head') result.head = argv[++index];
    else if (argv[index] === '--evidence-manifest') result.evidenceManifest = argv[++index];
    else if (argv[index] === '--scope-disclosure') result.scopeDisclosure = argv[++index];
    else if (argv[index] === '--output') result.output = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.head || '') || !result.evidenceManifest || !result.scopeDisclosure) throw new Error('--head, --evidence-manifest and --scope-disclosure are required.');
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const scope = JSON.parse(readFileSync(path.resolve(ROOT, SCOPE_PATH), 'utf8'));
  const evidenceRaw = readFileSync(path.resolve(ROOT, args.evidenceManifest));
  const evidence = JSON.parse(evidenceRaw.toString('utf8'));
  const disclosureRaw = readFileSync(path.resolve(ROOT, args.scopeDisclosure));
  const disclosure = JSON.parse(disclosureRaw.toString('utf8'));
  const actualHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (args.head !== actualHead || evidence.head_sha !== args.head || disclosure.head_sha !== args.head || evidence.scope_revision !== scope.scope_revision || disclosure.scope_revision !== scope.scope_revision || evidence.manifest_state !== 'executed_exact_head' || disclosure.status !== 'pass') throw new Error('AIGOV_LIFECYCLE_INPUT_IDENTITY_MISMATCH');
  const occurredAt = execFileSync('git', ['show', '-s', '--format=%cI', args.head], { cwd: ROOT, encoding: 'utf8' }).trim();
  const context = { planId: scope.plan_id, batchId: scope.batch_id, repository: scope.repository, repositoryId: 1292378784, prNumber: 49, baseSha: scope.base_sha, headSha: args.head, scopeRevision: scope.scope_revision };
  const evidenceRows = [
    ['start_preflight', sha256(`${scope.repository}:${args.head}`), `git:${args.head}`],
    ['scope_committed', sha256(JSON.stringify(scope)), SCOPE_PATH],
    ['scope_disclosed', sha256(disclosureRaw), args.scopeDisclosure],
    ['implementation_complete', sha256(execFileSync('git', ['rev-parse', `${args.head}^{tree}`], { cwd: ROOT, encoding: 'utf8' }).trim()), `git-tree:${args.head}`],
    ['exact_head_validated', sha256(evidenceRaw), args.evidenceManifest],
  ];
  const events = [];
  let predecessorEventId = null;
  for (const [eventType, digest, reference] of evidenceRows) {
    const event = buildEvent({ eventType, predecessorEventId, occurredAt, context, evidence: { kind: 'local_deterministic', sha256: digest, reference } });
    events.push(event);
    predecessorEventId = event.event_id;
  }
  const ledger = buildLedger(context, events);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(JSON.parse(readFileSync(path.resolve(ROOT, SCHEMA_PATH), 'utf8')));
  if (!validate(ledger)) throw new Error(`AIGOV_LIFECYCLE_SCHEMA_INVALID:${JSON.stringify(validate.errors)}`);
  const diagnostics = validateLifecycleLedger(ledger, context);
  if (diagnostics.length) throw new Error(`AIGOV_LIFECYCLE_INVALID:${JSON.stringify(diagnostics)}`);
  writeFileSync(path.resolve(ROOT, args.output), `${JSON.stringify(ledger, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', head_sha: args.head, scope_revision: scope.scope_revision, ledger_sha256: canonicalSha256(ledger), output: args.output }, null, 2));
}

main();
