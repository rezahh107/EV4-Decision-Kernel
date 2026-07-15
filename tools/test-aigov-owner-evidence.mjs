#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { verifyEvidenceBundle } from './verify-aigov-exact-main.mjs';
import { validEvidenceFixture } from './lib/aigov-test-fixtures.mjs';

const schemas = { reviewReceipt: JSON.parse(readFileSync('kernel/schemas/aigov-review-receipt.v1.schema.json', 'utf8')), reviewPackage: { type: 'object' } };
const cases = [];

function check(name, mutate, expected) {
  const fixture = validEvidenceFixture();
  mutate(fixture);
  const result = verifyEvidenceBundle(fixture.bundle, fixture.scope, schemas);
  cases.push({ name, expected, pass: result.diagnostics.join('\n').includes(expected), diagnostics: result.diagnostics });
}

const callerActor = spawnSync(process.execPath, ['tools/verify-aigov-exact-main.mjs', '--merge-actor', 'rezahh107'], { encoding: 'utf8' });
cases.push({ name: 'self supplied owner username rejected as input', expected: 'Unknown argument', pass: callerActor.status !== 0 && `${callerActor.stdout}${callerActor.stderr}`.includes('Unknown argument') });
check('authoritative merge actor is not owner', ({ bundle }) => { bundle.pullRequest.merged_by.login = 'caller-supplied-lookalike'; }, 'AIGOV_OWNER_MERGE_REQUIRED');
check('PR is not authoritatively merged', ({ bundle }) => { bundle.pullRequest.merged = false; }, 'AIGOV_PR_NOT_AUTHORITATIVELY_MERGED');
check('main payload does not match checkout', ({ bundle }) => { bundle.localHead = 'e'.repeat(40); }, 'AIGOV_CURRENT_MAIN_IDENTITY_UNVERIFIED');
check('reviewed head is not an ancestor', ({ bundle }) => { bundle.ancestorVerified = false; }, 'AIGOV_REVIEWED_HEAD_NOT_ANCESTOR');
check('merge commit is not an ancestor', ({ bundle }) => { bundle.mergeCommitAncestorVerified = false; }, 'AIGOV_MERGE_COMMIT_NOT_ANCESTOR');

const report = { suite: 'aigov-owner-evidence', status: cases.every((item) => item.pass) ? 'pass' : 'fail', cases };
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
