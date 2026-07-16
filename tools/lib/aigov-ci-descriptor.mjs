import { canonicalSha256 } from './aigov-lifecycle.mjs';

export const GITHUB_ACTIONS_APP_ID = 15368;
export const GITHUB_ACTIONS_APP_SLUG = 'github-actions';

export const AUTHORITATIVE_WORKFLOWS = Object.freeze({
  behavioral: Object.freeze({ name: 'Behavioral Coverage Audit', path: '.github/workflows/behavioral-coverage.yml', checkName: 'Behavioral coverage' }),
  sequence: Object.freeze({ name: 'Validate rereview sequence enforcement', path: '.github/workflows/validate-rereview-sequence.yml', checkName: 'Validate rereview sequence enforcement' }),
  mvk: Object.freeze({ name: 'Validate MVK', path: '.github/workflows/validate-mvk.yml', checkName: 'Validate MVK' }),
  main: Object.freeze({ name: 'Validate Main', path: '.github/workflows/validate-main.yml', checkName: 'Validate Main' }),
});

const VERIFIED_RUNS = new WeakSet();
const VERIFIED_AGGREGATES = new WeakSet();
const VERIFIED_MERGES = new WeakSet();
const VERIFIED_CURRENT_MAIN = new WeakSet();
const VERIFIED_ENFORCEMENT = new WeakSet();
const unique = (values) => [...new Set(values)];
const validSha = (value) => /^[0-9a-f]{40}$/.test(value || '');

function freezeEvidence(value, registry) {
  const frozen = Object.freeze(value);
  registry.add(frozen);
  return frozen;
}

export function isVerifiedAuthoritativeRun(value) { return Boolean(value && VERIFIED_RUNS.has(value)); }
export function isVerifiedCiAggregate(value) { return Boolean(value && VERIFIED_AGGREGATES.has(value)); }
export function isVerifiedMergeResult(value) { return Boolean(value && VERIFIED_MERGES.has(value)); }
export function isVerifiedCurrentMain(value) { return Boolean(value && VERIFIED_CURRENT_MAIN.has(value)); }
export function isVerifiedRepositoryEnforcement(value) { return Boolean(value && VERIFIED_ENFORCEMENT.has(value)); }

export function verifyWorkflowDescriptorPayloads({
  repository,
  repositoryId,
  exactHeadSha,
  event,
  expected,
  workflow,
  runs,
  jobs,
  checkRuns,
  allRepositoryRuns = runs,
  expectedRunId = null,
  jobsRunId = null,
}) {
  const diagnostics = [];
  const add = (condition, code) => { if (condition) diagnostics.push(code); };
  add(!repository || !Number.isInteger(repositoryId) || !validSha(exactHeadSha) || !expected, 'AIGOV_CI_CONTEXT_MALFORMED');
  add(!workflow || !Number.isInteger(workflow.id) || workflow.path !== expected?.path || workflow.name !== expected?.name, 'AIGOV_CI_WORKFLOW_DESCRIPTOR_MISMATCH');
  add(!Array.isArray(runs) || !Array.isArray(allRepositoryRuns), 'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  const collisions = allRepositoryRuns.filter((run) => run
    && run.repository?.id === repositoryId
    && run.repository?.full_name === repository
    && run.name === expected.name
    && run.event === event
    && run.head_sha === exactHeadSha
    && (run.workflow_id !== workflow.id || run.path !== expected.path));
  add(collisions.length > 0, 'AIGOV_CI_SAME_NAME_WORKFLOW_COLLISION');
  const malformed = runs.some((run) => !run
    || !Number.isInteger(run.id)
    || !Number.isInteger(run.run_attempt)
    || !run.repository
    || !Number.isInteger(run.repository.id)
    || typeof run.repository.full_name !== 'string'
    || typeof run.path !== 'string'
    || typeof run.name !== 'string'
    || typeof run.event !== 'string'
    || typeof run.head_sha !== 'string');
  add(malformed, 'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED');
  const candidates = runs.filter((run) => run
    && run.repository?.id === repositoryId
    && run.repository?.full_name === repository
    && run.workflow_id === workflow.id
    && run.path === expected.path
    && run.name === expected.name
    && run.event === event
    && run.head_sha === exactHeadSha
    && (expectedRunId == null || run.id === expectedRunId));
  add(candidates.length === 0, 'AIGOV_CI_AUTHORITATIVE_RUN_MISSING');
  add(candidates.length > 1, 'AIGOV_CI_AMBIGUOUS_DUPLICATE_RUNS');
  const run = candidates[0];
  add(Boolean(run) && (run.status !== 'completed' || run.conclusion !== 'success'), 'AIGOV_CI_AUTHORITATIVE_RUN_NOT_SUCCESSFUL');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  add(!Array.isArray(jobs) || !Array.isArray(checkRuns), 'AIGOV_CI_JOB_CHECK_PAYLOAD_MALFORMED');
  const boundJobsRunId = jobsRunId ?? jobs?.[0]?.run_id ?? null;
  add(!Number.isInteger(boundJobsRunId) || boundJobsRunId !== run.id, 'AIGOV_CI_JOB_SOURCE_RUN_MISMATCH');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  const matchingJobs = jobs.filter((job) => job?.name === expected.checkName);
  add(matchingJobs.length !== 1, matchingJobs.length ? 'AIGOV_CI_AMBIGUOUS_JOB' : 'AIGOV_CI_JOB_MISSING');
  const job = matchingJobs[0];
  add(!job
    || !Number.isInteger(job.id)
    || job.head_sha !== exactHeadSha
    || job.status !== 'completed'
    || job.conclusion !== 'success', 'AIGOV_CI_JOB_DESCRIPTOR_MISMATCH');
  const matchingChecks = checkRuns.filter((check) => check?.id === job?.id);
  add(matchingChecks.length !== 1, matchingChecks.length ? 'AIGOV_CI_AMBIGUOUS_CHECK' : 'AIGOV_CI_CHECK_MISSING');
  const check = matchingChecks[0];
  add(!check
    || check.name !== expected.checkName
    || check.head_sha !== exactHeadSha
    || check.status !== 'completed'
    || check.conclusion !== 'success', 'AIGOV_CI_CHECK_DESCRIPTOR_MISMATCH');
  add(check?.app?.id !== GITHUB_ACTIONS_APP_ID
    || check?.app?.slug !== GITHUB_ACTIONS_APP_SLUG
    || check?.app?.owner?.login !== 'github', 'AIGOV_CI_CHECK_APP_MISMATCH');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };

  const completedAt = job.completed_at || check.completed_at || run.updated_at || null;
  add(!completedAt || !Number.isFinite(Date.parse(completedAt)), 'AIGOV_CI_COMPLETION_TIME_INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  const descriptor = {
    schema_version: 'aigov-authoritative-check-descriptor.v1',
    repository,
    repository_id: repositoryId,
    workflow_id: workflow.id,
    workflow_path: expected.path,
    workflow_name: expected.name,
    event,
    exact_head_sha: exactHeadSha,
    run_id: run.id,
    run_attempt: run.run_attempt,
    status: run.status,
    conclusion: run.conclusion,
    job_id: job.id,
    check_name: check.name,
    check_head_sha: check.head_sha,
    check_app_id: check.app.id,
    check_app_slug: check.app.slug,
    completed_at: new Date(Date.parse(completedAt)).toISOString(),
  };
  descriptor.descriptor_digest = canonicalSha256(descriptor);
  return { diagnostics: [], evidence: freezeEvidence(descriptor, VERIFIED_RUNS) };
}

export function aggregateAuthoritativeCi({ exactHeadSha, event, descriptors, requiredPaths }) {
  const diagnostics = [];
  if (!validSha(exactHeadSha) || !Array.isArray(descriptors) || descriptors.some((item) => !isVerifiedAuthoritativeRun(item))) diagnostics.push('AIGOV_CI_UNVERIFIED_DESCRIPTOR');
  const paths = descriptors?.map((item) => item.workflow_path) || [];
  if (new Set(paths).size !== paths.length) diagnostics.push('AIGOV_CI_DUPLICATE_WORKFLOW_DESCRIPTOR');
  const expectedPaths = [...(requiredPaths || [])].sort();
  if (JSON.stringify([...paths].sort()) !== JSON.stringify(expectedPaths)) diagnostics.push('AIGOV_CI_REQUIRED_WORKFLOW_SET_MISMATCH');
  if (descriptors?.some((item) => item.exact_head_sha !== exactHeadSha || item.event !== event)) diagnostics.push('AIGOV_CI_AGGREGATE_CONTEXT_MISMATCH');
  const completed = descriptors?.map((item) => Date.parse(item.completed_at)) || [];
  if (completed.some((item) => !Number.isFinite(item))) diagnostics.push('AIGOV_CI_COMPLETION_TIME_INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  const value = {
    schema_version: 'aigov-authoritative-ci-aggregate.v1',
    exact_head_sha: exactHeadSha,
    event,
    descriptors: Object.freeze([...descriptors]),
    completed_at: new Date(Math.max(...completed)).toISOString(),
  };
  return { diagnostics: [], evidence: freezeEvidence(value, VERIFIED_AGGREGATES) };
}

export function verifyMergeResultPayloads({ pr, reviewedHeadSha, headCommit, mergeCommit, headToMain, mergeToMain }) {
  const diagnostics = [];
  const add = (condition, code) => { if (condition) diagnostics.push(code); };
  add(!pr || pr.number !== 50 || pr.merged !== true || pr.head?.sha !== reviewedHeadSha || !validSha(pr.merge_commit_sha), 'AIGOV_BATCH_B_MERGE_IDENTITY_UNVERIFIED');
  add(!headCommit || headCommit.sha !== reviewedHeadSha || !validSha(headCommit.tree?.sha), 'AIGOV_BATCH_B_REVIEWED_HEAD_TREE_UNVERIFIED');
  add(!mergeCommit || mergeCommit.sha !== pr?.merge_commit_sha || !validSha(mergeCommit.tree?.sha) || !Array.isArray(mergeCommit.parents), 'AIGOV_BATCH_B_MERGE_COMMIT_UNVERIFIED');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  const parents = mergeCommit.parents.map((item) => item.sha);
  const exactTree = headCommit.tree.sha === mergeCommit.tree.sha;
  let mergeMethod = 'unknown';
  let methodProof = false;
  if (parents.includes(reviewedHeadSha)) {
    mergeMethod = 'merge';
    methodProof = ['ahead', 'identical'].includes(headToMain?.status);
  } else if (parents.length === 1 && exactTree && parents[0] === pr.base?.sha) {
    mergeMethod = 'squash';
    methodProof = true;
  } else if (parents.length === 1 && exactTree) {
    mergeMethod = 'rebase';
    methodProof = true;
  }
  add(!methodProof || mergeMethod === 'unknown', 'AIGOV_BATCH_B_MERGE_RESULT_UNVERIFIED');
  add(!['ahead', 'identical'].includes(mergeToMain?.status), 'AIGOV_BATCH_B_CURRENT_MAIN_MISSING_MERGE_RESULT');
  add(!pr.merged_at || !Number.isFinite(Date.parse(pr.merged_at)), 'AIGOV_BATCH_B_MERGE_TIME_INVALID');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  return {
    diagnostics: [],
    evidence: freezeEvidence({
      schema_version: 'aigov-merge-result-evidence.v1',
      merge_method: mergeMethod,
      reviewed_head_sha: reviewedHeadSha,
      reviewed_head_tree_sha: headCommit.tree.sha,
      merge_commit_sha: mergeCommit.sha,
      merge_result_tree_sha: mergeCommit.tree.sha,
      merge_actor: pr.merged_by?.login || null,
      merged_at: new Date(Date.parse(pr.merged_at)).toISOString(),
      current_main_contains_merge_result: true,
      method_aware_verified: true,
    }, VERIFIED_MERGES),
  };
}

export function verifyCurrentMainExecution({ beforeSha, afterSha, eventHeadSha, descriptor }) {
  const diagnostics = [];
  if (!validSha(beforeSha) || beforeSha !== afterSha || beforeSha !== eventHeadSha) diagnostics.push('AIGOV_BATCH_B_CURRENT_MAIN_MOVED');
  if (!isVerifiedAuthoritativeRun(descriptor)
    || descriptor.workflow_path !== AUTHORITATIVE_WORKFLOWS.main.path
    || descriptor.event !== 'push'
    || descriptor.exact_head_sha !== beforeSha
    || descriptor.check_name !== AUTHORITATIVE_WORKFLOWS.main.checkName) diagnostics.push('AIGOV_BATCH_B_CURRENT_MAIN_VALIDATION_UNVERIFIED');
  if (diagnostics.length) return { diagnostics: unique(diagnostics), evidence: null };
  return {
    diagnostics: [],
    evidence: freezeEvidence({ schema_version: 'aigov-current-main-evidence.v1', current_main_sha: beforeSha, validation: descriptor, green: true }, VERIFIED_CURRENT_MAIN),
  };
}

function rulesetEvidence(payload) {
  const checks = [];
  const bypass = [];
  let strict = false;
  for (const ruleset of Array.isArray(payload) ? payload : []) {
    if (ruleset?.enforcement !== 'active') continue;
    bypass.push(...(ruleset.bypass_actors || []));
    for (const rule of ruleset.rules || []) {
      if (rule?.type !== 'required_status_checks') continue;
      strict ||= rule.parameters?.strict_required_status_checks_policy === true;
      for (const item of rule.parameters?.required_status_checks || []) checks.push({ context: item.context, app_id: item.integration_id ?? item.app_id ?? null });
    }
  }
  return { checks, bypass, strict };
}

export function verifyRepositoryEnforcementPayloads({ branchProtection, rulesets, requiredChecks }) {
  const diagnostics = [];
  const branchAvailable = Boolean(branchProtection && branchProtection.__unavailable !== true);
  const rulesetAvailable = Array.isArray(rulesets);
  if (!branchAvailable && !rulesetAvailable) diagnostics.push('AIGOV_BATCH_B_REQUIRED_CHECK_CONFIGURATION_UNVERIFIED');
  const bpChecks = branchAvailable ? (branchProtection.required_status_checks?.checks || []) : [];
  const bpStrict = branchAvailable && branchProtection.required_status_checks?.strict === true;
  const bpAdminEnforced = branchAvailable && branchProtection.enforce_admins?.enabled === true;
  const rs = rulesetEvidence(rulesets);
  const checks = [...bpChecks.map((item) => ({ context: item.context, app_id: item.app_id ?? null })), ...rs.checks];
  for (const required of requiredChecks || []) {
    if (!checks.some((item) => item.context === required.context && item.app_id === required.appId)) diagnostics.push(`AIGOV_BATCH_B_REQUIRED_CHECK_MISSING:${required.context}`);
  }
  if (!(bpStrict || rs.strict)) diagnostics.push('AIGOV_BATCH_B_STALE_CHECK_POLICY_UNVERIFIED');
  if (branchAvailable && !bpAdminEnforced) diagnostics.push('AIGOV_BATCH_B_ADMIN_BYPASS_UNVERIFIED');
  if (rs.bypass.length) diagnostics.push('AIGOV_BATCH_B_BYPASS_ACTORS_PRESENT');
  const status = diagnostics.length ? 'unverified' : 'verified';
  return {
    diagnostics: unique(diagnostics),
    evidence: freezeEvidence({
      schema_version: 'aigov-repository-enforcement-evidence.v1',
      status,
      required_check_configuration: status,
      repository_settings_enforced: status === 'verified' ? 'verified' : 'not_claimed',
      checks,
      strict_stale_check_policy: bpStrict || rs.strict,
      admin_enforcement: bpAdminEnforced,
      bypass_actors: rs.bypass,
    }, VERIFIED_ENFORCEMENT),
  };
}
