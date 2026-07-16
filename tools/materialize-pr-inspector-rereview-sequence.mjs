#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { sha256 } from './lib/aigov-lifecycle.mjs';
import { INSPECTOR_COMMIT, SEQUENCE_APP_ID, SEQUENCE_CONTEXT, SEQUENCE_WORKFLOW, VALIDATOR_FRAGMENT } from './lib/aigov-sequence-producer.mjs';

const ROOT = process.cwd();
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const DEFAULT_SCOPE = 'planning/governance/scopes/aigov-v3-batch-b.scope.json';

function args(argv) {
  const result = { head: null, workflowSha: null, runId: null, runAttempt: null, prNumber: null, scopePath: DEFAULT_SCOPE, output: 'artifacts/pr-inspector-rereview-sequence.pending.json', producerOutput: 'artifacts/aigov-sequence-producer-execution.json' };
  for (let index = 0; index < argv.length; index += 1) {
    const key = argv[index];
    if (key === '--head') result.head = argv[++index];
    else if (key === '--workflow-sha') result.workflowSha = argv[++index];
    else if (key === '--run-id') result.runId = Number(argv[++index]);
    else if (key === '--run-attempt') result.runAttempt = Number(argv[++index]);
    else if (key === '--pr-number') result.prNumber = Number(argv[++index]);
    else if (key === '--scope-path') result.scopePath = argv[++index];
    else if (key === '--output') result.output = argv[++index];
    else if (key === '--producer-output') result.producerOutput = argv[++index];
    else throw new Error(`Unknown argument: ${key}`);
  }
  if (!/^[0-9a-f]{40}$/.test(result.head || '') || result.workflowSha !== result.head || !Number.isInteger(result.runId) || !Number.isInteger(result.runAttempt) || !Number.isInteger(result.prNumber) || result.prNumber < 1) throw new Error('Exact head/workflow SHA, PR and numeric run identity are required.');
  return result;
}

function main() {
  const input = args(process.argv.slice(2));
  const observedHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim();
  if (observedHead !== input.head) throw new Error('AIGOV_SEQUENCE_PRODUCER_HEAD_MISMATCH');
  const scope = JSON.parse(readFileSync(path.join(ROOT, input.scopePath), 'utf8'));
  if (scope.plan_id !== 'GOV-ADOPTION-EV4-DECISION-KERNEL-86E25A9-V3' || scope.batch_id !== 'BATCH_B') throw new Error('AIGOV_SEQUENCE_PRODUCER_SCOPE_MISMATCH');
  const sequence = {
    schema_version: 3,
    events: [{ event_id: `implemented-pending-rereview-${input.head}`, event_type: 'implemented_pending_rereview', target_repository: REPOSITORY, pr_number: input.prNumber, resulting_head_sha: input.head }],
  };
  const sequenceRaw = Buffer.from(`${JSON.stringify(sequence, null, 2)}\n`);
  const workflowRaw = readFileSync(path.join(ROOT, SEQUENCE_WORKFLOW.path));
  const validatorCommand = `python _external/pr-inspector/${VALIDATOR_FRAGMENT} ${input.output}`;
  const producer = {
    schema_version: 'aigov-sequence-producer-execution.v1',
    execution_state: 'producer_executed_required_check_configuration_unverified',
    repository: REPOSITORY,
    repository_id: REPOSITORY_ID,
    pr_number: input.prNumber,
    exact_head_sha: input.head,
    scope_revision: scope.scope_revision,
    protocol_version: 'v1.10.1',
    inspector_commit_sha: INSPECTOR_COMMIT,
    check_context: SEQUENCE_CONTEXT,
    app_id: SEQUENCE_APP_ID,
    workflow_path: SEQUENCE_WORKFLOW.path,
    workflow_commit_sha: input.workflowSha,
    workflow_file_sha256: sha256(workflowRaw),
    run_id: input.runId,
    run_attempt: input.runAttempt,
    job_id: null,
    artifact_id: null,
    validator_command: validatorCommand,
    sequence_file: input.output,
    sequence_file_sha256: sha256(sequenceRaw),
    required_check_configuration: 'not_verified_external_administrative_action',
    repository_settings_enforced: 'not_claimed',
  };
  mkdirSync(path.dirname(path.resolve(ROOT, input.output)), { recursive: true });
  writeFileSync(path.resolve(ROOT, input.output), sequenceRaw);
  writeFileSync(path.resolve(ROOT, input.producerOutput), `${JSON.stringify(producer, null, 2)}\n`);
  console.log(JSON.stringify({ status: 'pass', sequence: input.output, producer: input.producerOutput, pr_number: input.prNumber, scope_revision: scope.scope_revision }, null, 2));
}
main();
