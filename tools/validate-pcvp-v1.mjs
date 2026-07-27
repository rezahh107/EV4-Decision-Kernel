import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { sha256Text, validatePcvpBundle } from '../kernel/validator/pcvp-v1.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BUNDLE_ROOT = path.join(ROOT, 'kernel/pcvp/v1.0.0/bundle');
const FOUNDATION_PATH = path.join(ROOT, 'kernel/pcvp/pcvp-foundation.v1.json');
const MAP_PATH = path.join(ROOT, 'kernel/pcvp/pcvp-enforcement-map.v1.json');
const DEFAULT_SCOPE = path.join(ROOT, 'planning/governance/scopes/pcvp-v1-foundation.scope.json');

function readJson(file) {
  return JSON.parse(readFileSync(file, 'utf8'));
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1];
}

function fail(message) {
  throw new Error(message);
}

function sorted(values) {
  return [...values].sort();
}

const validation = validatePcvpBundle(BUNDLE_ROOT);
if (validation.result !== 'PASS') {
  console.error(JSON.stringify({
    result: validation.result,
    diagnostics: validation.diagnostics,
    fixtures: validation.fixtures,
  }, null, 2));
  process.exit(1);
}

const foundation = readJson(FOUNDATION_PATH);
for (const [key, expected] of Object.entries({
  policy_id: 'EV4-PCVP',
  policy_version: '1.0.0',
  bundle_id: 'EV4-PCVP-ACTIVE-BUNDLE',
  bundle_version: '1.0.0',
  canonical_owner: 'rezahh107/EV4-Decision-Kernel',
  architecture_lock_id: 'EV4-PCVP-ROLL-LOCK-20260727-R1',
  bundle_status: 'release_candidate',
  adoption_status: 'not_yet_adopted',
  rollout_state: 'canonical_foundation_dormant',
  compatibility_mode: 'ADDITIVE',
  activation_effect: 'NONE_UNTIL_DEDICATED_ACTIVATION',
  strict_activation_allowed: false,
  external_authenticity_proven: false,
})) {
  if (foundation[key] !== expected) fail(`foundation ${key} mismatch`);
}
if (foundation.manifest_path !== 'kernel/pcvp/v1.0.0/bundle/00-MANIFEST.yaml') {
  fail('foundation manifest path mismatch');
}

const enforcementMap = readJson(MAP_PATH);
const spec = readFileSync(path.join(BUNDLE_ROOT, '01-SPEC/EV4_PCVP_SPEC_v1.0.0.md'), 'utf8');
const ruleIds = [...spec.matchAll(/^### (PCVP-[A-Z0-9-]+)/gmu)].map((match) => match[1]);
const scenarioHeadings = [...spec.matchAll(/^### Fixture ([0-9]+) — (.+)$/gmu)].map((match) => ({
  source_id: `SPEC-FIXTURE-${match[1].padStart(2, '0')}`,
  source_heading: match[2],
}));
if (JSON.stringify(sorted(enforcementMap.rules.map((item) => item.source_id))) !== JSON.stringify(sorted(ruleIds))) {
  fail('enforcement map does not classify every authoritative rule ID exactly once');
}
if (JSON.stringify(enforcementMap.spec_behavioral_scenarios.map(({ source_id, source_heading }) => ({ source_id, source_heading }))) !== JSON.stringify(scenarioHeadings)) {
  fail('enforcement map does not classify every SPEC behavioral scenario in order');
}
for (const item of [...enforcementMap.rules, ...enforcementMap.spec_behavioral_scenarios]) {
  if (!['MACHINE_ENFORCED', 'BEHAVIORAL_TESTED', 'PROMPT_ONLY_BEST_EFFORT', 'NOT_APPLICABLE'].includes(item.enforcement_class)) {
    fail(`unsupported enforcement class for ${item.source_id}`);
  }
}

const base = option('--base');
const head = option('--head');
const scopePath = option('--scope') ? path.resolve(option('--scope')) : DEFAULT_SCOPE;
if ((base && !head) || (!base && head)) fail('--base and --head must be supplied together');
if (base && head) {
  const scope = readJson(scopePath);
  const actual = execFileSync('git', ['diff', '--name-only', `${base}..${head}`], {
    cwd: ROOT,
    encoding: 'utf8',
  }).trim().split(/\r?\n/u).filter(Boolean).sort();
  const expected = sorted(scope.committed);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`bounded scope mismatch\nexpected=${JSON.stringify(expected)}\nactual=${JSON.stringify(actual)}`);
  }
  const observedHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (observedHead !== head) fail(`exact head mismatch: ${observedHead} != ${head}`);
}

const scope = readJson(scopePath);
const expectedRevision = `sha256:${sha256Text(sorted(scope.committed).join('\n') + '\n')}`;
if (scope.scope_revision !== expectedRevision) fail(`scope revision mismatch: ${scope.scope_revision} != ${expectedRevision}`);
if (scope.base_sha !== '4fe332847e6867fc6aa4639a94a88b8177d31970') fail('scope base SHA mismatch');
if (scope.activation_impact !== 'NONE') fail('scope activation impact must remain NONE');

console.log(JSON.stringify({
  result: 'PASS',
  policy: 'EV4-PCVP@1.0.0',
  bundle: 'EV4-PCVP-ACTIVE-BUNDLE@1.0.0',
  adoption_status: foundation.adoption_status,
  rollout_state: foundation.rollout_state,
  integrity: validation.inventory,
  fixtures: {
    total: validation.fixtures.total,
    valid: validation.fixtures.valid,
    invalid: validation.fixtures.invalid,
    all_passed_at_declared_layer: validation.fixtures.all_passed_at_declared_layer,
  },
  authoritative_rules_classified: enforcementMap.rules.length,
  spec_behavioral_scenarios_classified: enforcementMap.spec_behavioral_scenarios.length,
  activation_effect: foundation.activation_effect,
}, null, 2));
