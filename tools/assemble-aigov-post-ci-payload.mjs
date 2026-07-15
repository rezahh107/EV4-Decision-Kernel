#!/usr/bin/env node
import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const target = path.resolve(ROOT, 'artifacts/aigov-post-ci-payload');
mkdirSync(target, { recursive: true });
const copies = [
  ['artifacts/aigov-post-ci/aigov-batch-a-ci-identity.json', 'aigov-batch-a-ci-identity.json'],
  ['artifacts/aigov-post-ci/aigov-batch-a-finalized-evidence.json', 'aigov-batch-a-finalized-evidence.json'],
  ['artifacts/aigov-post-ci/aigov-batch-a-lifecycle-ledger.json', 'aigov-batch-a-lifecycle-ledger.json'],
  ['artifacts/aigov-post-ci/aigov-batch-a-scope-disclosure.json', 'aigov-batch-a-scope-disclosure.json'],
  ['artifacts/aigov-post-ci/aigov-sequence-producer-identity.json', 'aigov-sequence-producer-identity.json'],
  ['artifacts/aigov-post-ci/aigov-post-ci-provenance.json', 'aigov-post-ci-provenance.json'],
  ['artifacts/aigov-post-ci/aigov-validation-artifact-identity.json', 'aigov-validation-artifact-identity.json'],
  ['artifacts/aigov-command-logs', 'aigov-command-logs'],
];
for (const [source, destination] of copies) cpSync(path.resolve(ROOT, source), path.join(target, destination), { recursive: true, errorOnExist: true });
console.log(JSON.stringify({ status: 'pass', payload_root: path.relative(ROOT, target), entries: copies.map((item) => item[1]) }, null, 2));
