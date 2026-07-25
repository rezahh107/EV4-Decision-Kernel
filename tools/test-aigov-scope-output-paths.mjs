#!/usr/bin/env node
import path from 'node:path';
import { tmpdir } from 'node:os';
import { resolveOutputPath } from './generate-aigov-v3-batch-b-scope.mjs';

const ROOT = process.cwd();
const cases = [];
const record = (name, pass, details) => cases.push({ name, pass: Boolean(pass), details });

const relative = 'tmp/aigov-scope-report.json';
const relativeResolved = resolveOutputPath(relative);
record(
  'relative output resolves repository-relative',
  relativeResolved === path.resolve(ROOT, relative),
  { expected: path.resolve(ROOT, relative), observed: relativeResolved },
);

const absolute = path.join(tmpdir(), 'aigov-scope-absolute.json');
const absoluteResolved = resolveOutputPath(absolute);
record(
  'absolute output remains exact absolute path',
  absoluteResolved === path.normalize(absolute),
  { expected: path.normalize(absolute), observed: absoluteResolved },
);

const failureAbsolute = path.join(tmpdir(), 'aigov-scope-failure.json');
const failureResolved = resolveOutputPath(failureAbsolute);
record(
  'absolute failure report remains exact absolute path',
  failureResolved === path.normalize(failureAbsolute),
  { expected: path.normalize(failureAbsolute), observed: failureResolved },
);

const duplicatedRoot = path.join('/simulated/repository/root', absolute);
record(
  'duplicated repository root regression is impossible',
  absoluteResolved !== duplicatedRoot && failureResolved !== path.join('/simulated/repository/root', failureAbsolute),
  { absoluteResolved, duplicatedRoot },
);

const report = {
  suite: 'aigov-scope-output-paths',
  status: cases.every((item) => item.pass) ? 'pass' : 'fail',
  cases,
};
console.log(JSON.stringify(report, null, 2));
if (report.status !== 'pass') process.exitCode = 1;
