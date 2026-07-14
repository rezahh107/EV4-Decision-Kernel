import fs from 'node:fs';

const workflowPath = '.github/workflows/prf-013-external-trust-boundary.yml';
const configPath = '.github/branch-protection/prf-013-required-status-checks.json';
const nextWorkPath = 'planning/NEXT_WORK.md';
const failures = [];

function fail(code, detail) {
  failures.push(`${code}: ${detail}`);
}

function read(path) {
  if (!fs.existsSync(path)) {
    fail('PRF013_FILE_MISSING', path);
    return '';
  }
  return fs.readFileSync(path, 'utf8');
}

const workflow = read(workflowPath);
const configText = read(configPath);
read(nextWorkPath);

if (/TARGET_PR_NUMBER\s*[:=]/.test(workflow)) {
  fail('PRF013_STATIC_TARGET_PR_NUMBER', 'repository-wide workflow must not pin TARGET_PR_NUMBER');
}
if (/pull_request_target\s*:/.test(workflow)) {
  fail('PRF013_PULL_REQUEST_TARGET_USED', 'protected result verifier must not rely on pull_request_target base SHA semantics');
}
if (!/on:\s*\n\s+pull_request:/m.test(workflow)) {
  fail('PRF013_PULL_REQUEST_EVENT_MISSING', 'workflow must run in pull_request context');
}
if (!/pulls\.get/.test(workflow) || !/apiPullRequest\.number !== prNumber/.test(workflow)) {
  fail('PRF013_API_PR_CROSSCHECK_MISSING', 'workflow must query and cross-check the derived PR identity');
}
for (const token of [
  'apiPullRequest.base.repo.id !== expectedRepositoryId',
  'apiPullRequest.base.sha !== eventPullRequest.base.sha',
  'apiPullRequest.head.sha !== eventPullRequest.head.sha',
  'checks.listForRef',
  'ref: verifiedHeadSha',
  'run.head_sha !== verifiedHeadSha',
  'run.app?.slug !== expectedAppSlug',
  'proof_credit_authorized=false',
  'attestation_digest=sha256:',
]) {
  if (!workflow.includes(token)) fail('PRF013_REQUIRED_BINDING_MISSING', token);
}
if (!/PROOF_CREDIT_AUTHORIZED:\s*"false"/.test(workflow)) {
  fail('PRF013_PROOF_CREDIT_NOT_FALSE', 'workflow environment must keep proof credit disabled');
}
if (!/@[0-9a-f]{40}(\s|$)/i.test(workflow)) {
  fail('PRF013_ACTION_PIN_MISSING', 'external action uses must be pinned to full commit SHAs');
}

let config;
try {
  config = JSON.parse(configText);
} catch (error) {
  fail('PRF013_CONFIG_JSON_INVALID', error.message);
}
if (config) {
  const external = config.required_status_checks?.find((check) => check.context === 'PR Inspector / external-trust-result');
  if (!external) fail('PRF013_EXTERNAL_REQUIRED_CHECK_MISSING', 'PR Inspector / external-trust-result');
  if (external?.expected_source !== 'GitHub App slug: pr-inspector') {
    fail('PRF013_EXPECTED_APP_SOURCE_MISSING', 'external result must require exact pr-inspector GitHub App source');
  }
  if (external?.source_policy !== 'exact_app_source_only_not_any_source') {
    fail('PRF013_ANY_SOURCE_NOT_FORBIDDEN', 'external result must not use any-source matching');
  }
  if (external?.association !== 'pull_request_head_sha') {
    fail('PRF013_HEAD_ASSOCIATION_MISSING', 'external result must be head-associated');
  }
  if (config.activation_gate?.proof_credit_authorized !== false) {
    fail('PRF013_CONFIG_PROOF_CREDIT_NOT_FALSE', 'configuration contract must keep proof credit disabled');
  }
}

if (failures.length > 0) {
  console.error('PRF-013 boundary validation failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('PRF-013 boundary validation passed.');
