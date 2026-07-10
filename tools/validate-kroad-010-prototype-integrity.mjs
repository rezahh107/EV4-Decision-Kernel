#!/usr/bin/env node

import {setPath} from '../kernel/validator/validate-downstream-consumer-lineage.mjs';

const EXPECTED = 'DOWNSTREAM_CONSUMER_FIXTURE_PATCH_PATH_FORBIDDEN';
const before = Object.prototype.polluted;

function assertRejected(target, path, roots) {
  try {
    setPath(target, path, 'yes', roots);
  } catch (error) {
    if (error?.code === EXPECTED) return;
    throw error;
  }
  throw new Error(`Forbidden prototype path was accepted: ${path}`);
}

const recordRoots = new Set(['evidence_refs']);
const envelopeRoots = new Set(['decision_record']);
for (const path of [
  '__proto__.polluted',
  'constructor.prototype.polluted',
  'prototype.polluted',
]) {
  assertRejected({evidence_refs: [{}]}, path, recordRoots);
}
for (const path of [
  'decision_record.__proto__.polluted',
  'decision_record.constructor.prototype.polluted',
  'decision_record.prototype.polluted',
]) {
  assertRejected({decision_record: {}}, path, envelopeRoots);
}

const normal = {evidence_refs: [{limitations: ['a']}]};
setPath(normal, 'evidence_refs.0.limitations', ['b'], recordRoots);
if (JSON.stringify(normal.evidence_refs[0].limitations) !== JSON.stringify(['b'])) {
  throw new Error('Normal allowlisted patching regressed.');
}
if (Object.prototype.polluted !== before) {
  throw new Error('Object.prototype changed during prototype-integrity tests.');
}

console.log('KROAD-010 prototype integrity: PASS (record+envelope, __proto__+constructor+prototype)');
