#!/usr/bin/env node
import { cpSync, mkdirSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const target = path.resolve(ROOT, 'artifacts/aigov-validation-evidence');
mkdirSync(target, { recursive: true });
cpSync(path.resolve(ROOT, 'artifacts/aigov-command-logs'), path.join(target, 'aigov-command-logs'), { recursive: true, errorOnExist: true });
cpSync(path.resolve(ROOT, 'artifacts/aigov-batch-a-executed-evidence.json'), path.join(target, 'aigov-batch-a-executed-evidence.json'), { errorOnExist: true });
cpSync(path.resolve(ROOT, 'artifacts/aigov-batch-a-scope-disclosure.json'), path.join(target, 'aigov-batch-a-scope-disclosure.json'), { errorOnExist: true });
console.log(JSON.stringify({ status: 'pass', payload_root: path.relative(ROOT, target) }, null, 2));
