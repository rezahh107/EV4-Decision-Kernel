#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const verifier = fileURLToPath(new URL('./verify-aigov-v3-exact-main.mjs', import.meta.url));
const result = spawnSync(process.execPath, [verifier, ...process.argv.slice(2)], { stdio: 'inherit' });
process.exitCode = Number.isInteger(result.status) ? result.status : 1;
