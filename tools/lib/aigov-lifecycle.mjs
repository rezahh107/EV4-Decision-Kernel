import crypto from 'node:crypto';

export const EVENT_ORDER = [
  'start_preflight',
  'scope_committed',
  'scope_disclosed',
  'implementation_complete',
  'exact_head_validated',
  'independent_review_green',
  'owner_merge',
  'exact_main_verified',
];

export function sha256(value) {
  const bytes = Buffer.isBuffer(value) ? value : Buffer.from(String(value));
  return crypto.createHash('sha256').update(bytes).digest('hex');
}

export function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

export function canonicalSha256(value) {
  return sha256(JSON.stringify(canonical(value)));
}

export function eventId(event) {
  const projection = structuredClone(event);
  delete projection.event_id;
  return `sha256:${canonicalSha256(projection)}`;
}

export function ledgerId(ledger) {
  const projection = structuredClone(ledger);
  delete projection.ledger_id;
  return `sha256:${canonicalSha256(projection)}`;
}

function add(diagnostics, code, message) {
  diagnostics.push({ code, message });
}

export function validateLifecycleLedger(ledger, context, verifiedEvidence = {}) {
  const diagnostics = [];
  const reviewDigests = verifiedEvidence.reviewDigests || new Set();
  const mergeDigests = verifiedEvidence.mergeDigests || new Set();
  const exactMainDigests = verifiedEvidence.exactMainDigests || new Set();
  const identities = [
    ['repository', context.repository],
    ['repository_id', context.repositoryId],
    ['pr_number', context.prNumber],
    ['head_sha', context.headSha],
    ['scope_revision', context.scopeRevision],
  ];

  for (const [field, expected] of identities) {
    if (ledger[field] !== expected) add(diagnostics, 'AIGOV_LEDGER_IDENTITY_MISMATCH', `Ledger ${field} does not match the exact lifecycle context.`);
  }
  if (context.baseSha && ledger.base_sha !== context.baseSha) add(diagnostics, 'AIGOV_LEDGER_IDENTITY_MISMATCH', 'Ledger base_sha does not match the exact lifecycle context.');
  if (ledger.ledger_id !== ledgerId(ledger)) add(diagnostics, 'AIGOV_LEDGER_HASH_MISMATCH', 'ledger_id does not match the canonical ledger content.');

  const seenEventIds = new Set();
  const seenEvidenceDigests = new Set();
  for (const [index, event] of (ledger.events || []).entries()) {
    if (seenEventIds.has(event.event_id)) add(diagnostics, 'AIGOV_LIFECYCLE_DUPLICATE_EVENT', `Duplicate event_id at index ${index}.`);
    seenEventIds.add(event.event_id);
    if (event.event_id !== eventId(event)) add(diagnostics, 'AIGOV_EVENT_HASH_MISMATCH', `event_id at index ${index} does not match the canonical event content.`);

    const expectedType = EVENT_ORDER[index];
    if (event.event_type !== expectedType) add(diagnostics, 'AIGOV_SEQUENCE_INVALID', `Expected ${expectedType || 'no further event'} at index ${index}, observed ${event.event_type}.`);
    const expectedPredecessor = index === 0 ? null : ledger.events[index - 1]?.event_id;
    if (event.predecessor_event_id !== expectedPredecessor) add(diagnostics, 'AIGOV_LIFECYCLE_PREDECESSOR_MISSING', `Event ${event.event_type} does not bind its immediate predecessor.`);

    for (const [field, expected] of identities) {
      if (event[field] !== expected) add(diagnostics, 'AIGOV_LIFECYCLE_EVENT_IDENTITY_MISMATCH', `Event ${event.event_type} has stale or foreign ${field}.`);
    }

    const digest = event.evidence?.sha256;
    if (digest && seenEvidenceDigests.has(digest)) add(diagnostics, 'AIGOV_LIFECYCLE_EVIDENCE_REPLAY', `Evidence digest was replayed by ${event.event_type}.`);
    if (digest) seenEvidenceDigests.add(digest);

    if (event.event_type === 'independent_review_green') {
      if (event.evidence?.kind !== 'external_review' || !reviewDigests.has(digest)) {
        add(diagnostics, 'AIGOV_REVIEW_PROVENANCE_UNVERIFIED', 'Independent review event lacks a verifier-created external provenance capability.');
      }
    }
    if (event.event_type === 'owner_merge') {
      if (event.evidence?.kind !== 'authoritative_owner_merge' || !mergeDigests.has(digest)) {
        add(diagnostics, 'AIGOV_OWNER_MERGE_UNVERIFIED', 'Owner Merge event lacks fresh authoritative GitHub evidence.');
      }
      if (index < EVENT_ORDER.indexOf('owner_merge') || ledger.events[index - 1]?.event_type !== 'independent_review_green') {
        add(diagnostics, 'AIGOV_OWNER_MERGE_BEFORE_GREEN', 'Owner Merge cannot precede a current independent Green event.');
      }
    }
    if (event.event_type === 'exact_main_verified') {
      if (event.evidence?.kind !== 'authoritative_exact_main' || !exactMainDigests.has(digest)) {
        add(diagnostics, 'AIGOV_EXACT_MAIN_EVIDENCE_UNVERIFIED', 'Exact-main completion lacks fresh authoritative current-main evidence.');
      }
      if (ledger.events[index - 1]?.event_type !== 'owner_merge') {
        add(diagnostics, 'AIGOV_EXACT_MAIN_BEFORE_OWNER_MERGE', 'Exact-main completion cannot precede authoritative owner Merge.');
      }
    }
  }

  return diagnostics;
}

export function buildEvent({ eventType, predecessorEventId, occurredAt, context, evidence }) {
  const event = {
    event_id: '',
    event_type: eventType,
    predecessor_event_id: predecessorEventId,
    occurred_at: occurredAt,
    repository: context.repository,
    repository_id: context.repositoryId,
    pr_number: context.prNumber,
    head_sha: context.headSha,
    scope_revision: context.scopeRevision,
    evidence,
  };
  event.event_id = eventId(event);
  return event;
}

export function buildLedger(context, events) {
  const ledger = {
    schema_version: 'aigov-lifecycle-ledger.v1',
    ledger_id: '',
    plan_id: context.planId,
    batch_id: context.batchId,
    repository: context.repository,
    repository_id: context.repositoryId,
    pr_number: context.prNumber,
    base_sha: context.baseSha,
    head_sha: context.headSha,
    scope_revision: context.scopeRevision,
    events,
  };
  ledger.ledger_id = ledgerId(ledger);
  return ledger;
}
