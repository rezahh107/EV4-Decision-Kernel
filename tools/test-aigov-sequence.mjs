#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { EVENT_ORDER, buildEvent, buildLedger, validateLifecycleLedger } from './lib/aigov-lifecycle.mjs';

const context = {
  planId: 'GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2',
  batchId: 'BATCH_A',
  repository: 'rezahh107/EV4-Decision-Kernel',
  repositoryId: 1292378784,
  prNumber: 49,
  baseSha: '5ff5d7b20db11af36ab787eb8ac2d1127ea74644',
  headSha: 'a'.repeat(40),
  scopeRevision: `sha256:${'b'.repeat(64)}`,
};
const evidenceDigests = EVENT_ORDER.map((_, index) => (index + 1).toString(16).repeat(64).slice(0, 64));
const kinds = ['local_deterministic', 'local_deterministic', 'local_deterministic', 'local_deterministic', 'local_deterministic', 'external_review', 'authoritative_owner_merge', 'authoritative_exact_main'];
const verified = {
  reviewDigests: new Set([evidenceDigests[5]]),
  mergeDigests: new Set([evidenceDigests[6]]),
  exactMainDigests: new Set([evidenceDigests[7]]),
};

function history(types = EVENT_ORDER, overrides = {}) {
  const events = [];
  let predecessorEventId = null;
  for (const [index, eventType] of types.entries()) {
    const eventContext = overrides.contextAt?.[index] || context;
    const event = buildEvent({
      eventType,
      predecessorEventId,
      occurredAt: `2026-07-15T10:0${index}:00Z`,
      context: eventContext,
      evidence: { kind: overrides.kinds?.[index] || kinds[index], sha256: overrides.digests?.[index] || evidenceDigests[index], reference: `evidence:${index}` },
    });
    events.push(event);
    predecessorEventId = event.event_id;
  }
  return buildLedger(context, events);
}

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);
const schemaValidate = ajv.compile(JSON.parse(readFileSync('kernel/schemas/aigov-lifecycle-ledger.v1.schema.json', 'utf8')));
const cases = [];

function run(name, ledger, expected, evidence = verified) {
  const schemaPass = schemaValidate(ledger);
  const diagnostics = schemaPass ? validateLifecycleLedger(ledger, context, evidence).map((item) => item.code) : ['AIGOV_LIFECYCLE_SCHEMA_INVALID'];
  cases.push({ name, expected, pass: expected === null ? diagnostics.length === 0 : diagnostics.includes(expected), diagnostics });
}

run('complete valid history', history(), null);
run('valid exact-head prefix', history(EVENT_ORDER.slice(0, 5)), null, {});

const duplicate = history();
duplicate.events[2].event_id = duplicate.events[1].event_id;
duplicate.ledger_id = buildLedger(context, duplicate.events).ledger_id;
run('duplicate lifecycle event', duplicate, 'AIGOV_LIFECYCLE_DUPLICATE_EVENT');

const replayDigests = [...evidenceDigests];
replayDigests[5] = replayDigests[4];
run('replayed receipt digest', history(EVENT_ORDER, { digests: replayDigests }), 'AIGOV_LIFECYCLE_EVIDENCE_REPLAY', { ...verified, reviewDigests: new Set([replayDigests[5]]) });

const missingPredecessor = history();
missingPredecessor.events[3].predecessor_event_id = null;
missingPredecessor.ledger_id = buildLedger(context, missingPredecessor.events).ledger_id;
run('missing predecessor', missingPredecessor, 'AIGOV_LIFECYCLE_PREDECESSOR_MISSING');

run('out of order events', history([EVENT_ORDER[0], EVENT_ORDER[2]]), 'AIGOV_SEQUENCE_INVALID', {});
run('owner Merge before current Green', history([...EVENT_ORDER.slice(0, 5), 'owner_merge'], { kinds: { 5: 'authoritative_owner_merge' }, digests: { 5: evidenceDigests[6] } }), 'AIGOV_SEQUENCE_INVALID', { mergeDigests: new Set([evidenceDigests[6]]) });
run('exact main before owner Merge', history([...EVENT_ORDER.slice(0, 6), 'exact_main_verified'], { kinds: { 6: 'authoritative_exact_main' }, digests: { 6: evidenceDigests[7] } }), 'AIGOV_SEQUENCE_INVALID', { reviewDigests: verified.reviewDigests, exactMainDigests: verified.exactMainDigests });

for (const [name, field, value, expected] of [
  ['foreign repository event', 'repository', 'other/repository', 'AIGOV_LIFECYCLE_SCHEMA_INVALID'],
  ['foreign PR event', 'prNumber', 50, 'AIGOV_LIFECYCLE_SCHEMA_INVALID'],
  ['review after head mutation', 'headSha', 'c'.repeat(40), 'AIGOV_LIFECYCLE_EVENT_IDENTITY_MISMATCH'],
  ['stale scope event', 'scopeRevision', `sha256:${'c'.repeat(64)}`, 'AIGOV_LIFECYCLE_EVENT_IDENTITY_MISMATCH'],
]) {
  const foreignContext = { ...context, [field]: value };
  const contexts = { 5: foreignContext };
  run(name, history(EVENT_ORDER, { contextAt: contexts }), expected);
}

run('review without verified external provenance', history(), 'AIGOV_REVIEW_PROVENANCE_UNVERIFIED', {});
run('owner Merge without authoritative evidence', history(), 'AIGOV_OWNER_MERGE_UNVERIFIED', { reviewDigests: verified.reviewDigests });

const report = { validator: 'test-aigov-sequence', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
