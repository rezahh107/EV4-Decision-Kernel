import { createHash } from 'node:crypto';
import {
  GITHUB_ACTIONS_APP_ID,
  GITHUB_ACTIONS_APP_SLUG,
  RECOVERY_AUTHORITATIVE_WORKFLOWS,
  isVerifiedAuthoritativeRun,
  isVerifiedRecoveryWorkflowSource,
  verifyRecoveryWorkflowDescriptorPayloads,
  verifyRecoveryWorkflowSourcePayload,
} from '../../tools/lib/aigov-ci-descriptor.mjs';

const API = 'https://api.github.com';
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const DEFAULT_BRANCH = 'main';
const OWNER = 'rezahh107';
const MAX_RESPONSE_AGE_MS = 5 * 60 * 1000;
const SHA40 = /^[0-9a-f]{40}$/;
const VERIFIED_COMPLETIONS = new WeakSet();
const SESSION_STATE = new WeakMap();

const normalized = (value) => value === undefined ? null : value;
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const same = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const sha256 = (value) => createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');

function diagnostic(diagnosticId, path, expected, observed, remediation) {
  return {
    diagnostic_id: diagnosticId,
    severity: 'error',
    path,
    expected: normalized(expected),
    observed: normalized(observed),
    remediation,
  };
}

function uniqueDiagnostics(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify([item.diagnostic_id, item.path, item.expected, item.observed]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function completionBinding(ledger, task) {
  return {
    repository: ledger?.repository,
    default_branch: ledger?.default_branch,
    program_id: ledger?.program_id,
    task_id: task?.task_id,
    candidate: task?.candidate,
    completion_evidence: task?.completion_evidence,
  };
}

export function isRecoveryCompletionCapability(value) {
  return Boolean(value && VERIFIED_COMPLETIONS.has(value));
}

export function recoveryCompletionCapabilityMatches(value, ledger, task) {
  return isRecoveryCompletionCapability(value)
    && value.repository === REPOSITORY
    && value.repository_id === REPOSITORY_ID
    && value.default_branch === DEFAULT_BRANCH
    && value.task_id === task?.task_id
    && value.binding_sha256 === sha256(completionBinding(ledger, task));
}

function mintCapability(ledger, task, evidence) {
  const capability = Object.freeze({
    capability_type: 'recovery-completion-capability.v1',
    repository: REPOSITORY,
    repository_id: REPOSITORY_ID,
    default_branch: DEFAULT_BRANCH,
    task_id: task.task_id,
    pull_request: evidence.pull_request,
    reviewed_head_sha: evidence.reviewed_head_sha,
    resulting_main_sha: evidence.resulting_main_sha,
    exact_head_run_id: evidence.exact_head_run_id,
    current_main_run_id: evidence.current_main_run_id,
    exact_head_workflow_source: evidence.exact_head_workflow_source,
    current_main_workflow_source: evidence.current_main_workflow_source,
    observed_at: evidence.observed_at,
    binding_sha256: sha256(completionBinding(ledger, task)),
  });
  VERIFIED_COMPLETIONS.add(capability);
  return capability;
}

export function createRecoveryEvidenceSession({
  fetchImpl = globalThis.fetch,
  token = process.env.RECOVERY_GITHUB_TOKEN || null,
  now = () => Date.now(),
} = {}) {
  const session = Object.freeze({ session_type: 'recovery-evidence-session.v1' });
  SESSION_STATE.set(session, {
    fetchImpl,
    token,
    now,
    requestCache: new Map(),
    runEvidenceCache: new Map(),
    capabilityCache: new Map(),
  });
  return session;
}

function sessionState(session) {
  const state = SESSION_STATE.get(session);
  if (!state) throw new Error('Recovery evidence session capability required');
  if (typeof state.fetchImpl !== 'function') throw new Error('GitHub evidence transport unavailable');
  if (typeof state.token !== 'string' || state.token.length === 0) {
    throw new Error('RECOVERY_GITHUB_TOKEN unavailable');
  }
  return state;
}

function githubHeaders(token) {
  return {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'ev4-recovery-completion-boundary',
    'X-GitHub-Api-Version': '2022-11-28',
    Authorization: `Bearer ${token}`,
  };
}

async function githubJson(apiPath, session) {
  const state = sessionState(session);
  if (state.requestCache.has(apiPath)) return state.requestCache.get(apiPath);
  const url = API + apiPath;
  const pending = (async () => {
    const response = await state.fetchImpl(url, {
      headers: githubHeaders(state.token),
      redirect: 'error',
      cache: 'no-store',
    });
    if (!response || typeof response.json !== 'function' || response.ok !== true) {
      const status = response?.status ?? 'unavailable';
      throw new Error(`GitHub API ${status}: ${apiPath}`);
    }
    const responseDate = response.headers?.get?.('date') || null;
    return {
      value: await response.json(),
      url,
      response_date: responseDate,
    };
  })();
  state.requestCache.set(apiPath, pending);
  try {
    return await pending;
  } catch (error) {
    state.requestCache.delete(apiPath);
    throw error;
  }
}

function responseFreshnessDiagnostics(responses, nowMs, taskPath) {
  const stale = [];
  for (const response of responses) {
    const responseMs = Date.parse(response?.response_date || '');
    if (!Number.isFinite(responseMs)
      || Math.abs(nowMs - responseMs) > MAX_RESPONSE_AGE_MS) {
      stale.push({ url: response?.url || null, response_date: response?.response_date || null });
    }
  }
  return stale.length ? [diagnostic(
    'RECOVERY_LEDGER_GITHUB_EVIDENCE_STALE',
    taskPath + '/completion_evidence',
    `fresh GitHub HTTPS responses within ${MAX_RESPONSE_AGE_MS}ms`,
    stale,
    'Fetch fresh official GitHub payloads; cached, undated, or stale responses cannot mint completion authority.',
  )] : [];
}

function runDiagnostics({
  ledgerEvidence,
  expected,
  descriptorResult,
  workflow,
  run,
  jobs,
  checks,
  repositoryId,
  prNumber,
  headSha,
  event,
  taskPath,
  mergedAt,
}) {
  const diagnostics = [];
  const prefix = expected.path === RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk.path
    ? 'RECOVERY_LEDGER_EXACT_HEAD_RUN'
    : 'RECOVERY_LEDGER_CURRENT_MAIN_RUN';
  if (descriptorResult.diagnostics.length || !isVerifiedAuthoritativeRun(descriptorResult.evidence)) {
    diagnostics.push(diagnostic(
      prefix + '_UNVERIFIED',
      taskPath,
      {
        repository_id: repositoryId,
        workflow: expected,
        event,
        head_sha: headSha,
        run_id: ledgerEvidence?.run_id,
        conclusion: 'success',
      },
      {
        workflow_id: workflow?.id,
        run_id: run?.id,
        repository_id: run?.repository?.id,
        workflow_name: run?.name,
        workflow_path: run?.path,
        event: run?.event,
        head_sha: run?.head_sha,
        status: run?.status,
        conclusion: run?.conclusion,
        verifier_diagnostics: descriptorResult.diagnostics,
      },
      'Use a fresh successful run and exact job/check produced by the canonical GitHub Actions workflow.',
    ));
  }

  const matchingJob = jobs.find((job) => job?.name === expected.checkName);
  const matchingCheck = checks.find((check) => check?.id === matchingJob?.id);
  if (matchingCheck?.app?.id !== GITHUB_ACTIONS_APP_ID
    || matchingCheck?.app?.slug !== GITHUB_ACTIONS_APP_SLUG
    || matchingCheck?.app?.name !== 'GitHub Actions'
    || matchingCheck?.app?.owner?.login !== 'github') {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_WORKFLOW_PRODUCER_MISMATCH',
      taskPath,
      { app_id: GITHUB_ACTIONS_APP_ID, slug: GITHUB_ACTIONS_APP_SLUG, name: 'GitHub Actions', owner: 'github' },
      matchingCheck?.app || null,
      'Accept only the immutable GitHub Actions App producer identity for the exact workflow check.',
    ));
  }

  const expectedReference = `https://github.com/${REPOSITORY}/actions/runs/${run?.id}`;
  if (ledgerEvidence?.workflow !== expected.name
    || ledgerEvidence?.run_id !== run?.id
    || ledgerEvidence?.head_sha !== headSha
    || ledgerEvidence?.conclusion !== 'success'
    || ledgerEvidence?.reference !== expectedReference
    || run?.html_url !== expectedReference) {
    diagnostics.push(diagnostic(
      prefix + '_LEDGER_MISMATCH',
      taskPath,
      {
        workflow: expected.name,
        run_id: run?.id,
        head_sha: headSha,
        conclusion: 'success',
        reference: expectedReference,
      },
      ledgerEvidence,
      'Copy the exact official workflow identity into the ledger; ledger values never establish authority.',
    ));
  }

  if (run?.repository?.id !== repositoryId
    || run?.repository?.full_name !== REPOSITORY
    || run?.head_repository?.id !== repositoryId
    || run?.head_repository?.full_name !== REPOSITORY) {
    diagnostics.push(diagnostic(
      prefix + '_REPOSITORY_MISMATCH',
      taskPath,
      { repository: REPOSITORY, repository_id: repositoryId },
      {
        repository: run?.repository,
        head_repository: run?.head_repository,
      },
      'Reject workflow runs originating from another repository or fork.',
    ));
  }

  if (event === 'pull_request') {
    const pullRequest = (run?.pull_requests || []).find((item) => item?.number === prNumber);
    if (!pullRequest || pullRequest?.head?.sha !== headSha || pullRequest?.base?.ref !== DEFAULT_BRANCH) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_EXACT_HEAD_RUN_PR_MISMATCH',
        taskPath,
        { pull_request: prNumber, head_sha: headSha, base_ref: DEFAULT_BRANCH },
        run?.pull_requests || null,
        'Bind exact-head CI to the same authoritative PR Head and default-branch base.',
      ));
    }
  } else if (run?.head_branch !== DEFAULT_BRANCH) {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_CURRENT_MAIN_RUN_BRANCH_MISMATCH',
      taskPath,
      DEFAULT_BRANCH,
      run?.head_branch,
      'Use a successful Validate Main push run from the exact default branch.',
    ));
  }

  const completedAt = Date.parse(descriptorResult.evidence?.completed_at || '');
  const mergeAt = Date.parse(mergedAt || '');
  const timeInvalid = !Number.isFinite(completedAt)
    || !Number.isFinite(mergeAt)
    || (event === 'pull_request' ? completedAt > mergeAt : completedAt < mergeAt);
  if (timeInvalid) {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_WORKFLOW_TIME_ORDER_INVALID',
      taskPath,
      event === 'pull_request' ? 'exact-head completion no later than Merge' : 'current-main completion no earlier than Merge',
      { workflow_completed_at: descriptorResult.evidence?.completed_at || null, merged_at: mergedAt || null },
      'Use temporally ordered exact-head, Merge, and current-main evidence from fresh GitHub payloads.',
    ));
  }
  return diagnostics;
}

async function fetchRunEvidence({
  ledgerEvidence,
  expected,
  event,
  headSha,
  repositoryId,
  prNumber,
  taskPath,
  mergedAt,
  session,
}) {
  const state = sessionState(session);
  const cacheKey = `${expected.policyId}:${ledgerEvidence?.run_id}:${headSha}:${event}`;
  let pending = state.runEvidenceCache.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      const encodedPath = expected.path.split('/').map(encodeURIComponent).join('/');
      const sourceResponse = await githubJson(
        `/repos/${REPOSITORY}/contents/${encodedPath}?ref=${encodeURIComponent(headSha)}`,
        session,
      );
      const sourceResult = verifyRecoveryWorkflowSourcePayload({
        repository: REPOSITORY,
        repositoryId,
        commitSha: headSha,
        expected,
        contentPayload: sourceResponse.value,
        sourceApiUrl: sourceResponse.url,
      });
      const runResponse = await githubJson(
        `/repos/${REPOSITORY}/actions/runs/${ledgerEvidence?.run_id}`,
        session,
      );
      const allRunsResponse = await githubJson(
        `/repos/${REPOSITORY}/actions/runs?head_sha=${encodeURIComponent(headSha)}&event=${event}&per_page=100`,
        session,
      );
      const jobsResponse = await githubJson(
        `/repos/${REPOSITORY}/actions/runs/${ledgerEvidence?.run_id}/jobs?filter=latest&per_page=100`,
        session,
      );
      const jobs = Array.isArray(jobsResponse.value?.jobs) ? jobsResponse.value.jobs : [];
      const matchingJobs = jobs.filter((job) => job?.name === expected.checkName);
      const checkResponses = await Promise.all(matchingJobs.map(
        (job) => githubJson(`/repos/${REPOSITORY}/check-runs/${job.id}`, session),
      ));
      const checks = checkResponses.map((item) => item.value);
      const descriptorResult = verifyRecoveryWorkflowDescriptorPayloads({
        source: sourceResult.evidence,
        repository: REPOSITORY,
        repositoryId,
        exactHeadSha: headSha,
        event,
        expected,
        runs: [runResponse.value],
        allRepositoryRuns: allRunsResponse.value?.workflow_runs,
        jobs,
        checkRuns: checks,
        expectedRunId: ledgerEvidence?.run_id,
        jobsRunId: runResponse.value?.id,
      });
      return {
        sourceResponse,
        sourceResult,
        runResponse,
        allRunsResponse,
        jobsResponse,
        jobs,
        checkResponses,
        checks,
        descriptorResult,
      };
    })();
    state.runEvidenceCache.set(cacheKey, pending);
  }
  let core;
  try {
    core = await pending;
  } catch (error) {
    state.runEvidenceCache.delete(cacheKey);
    throw error;
  }
  const {
    sourceResponse,
    sourceResult,
    runResponse,
    allRunsResponse,
    jobsResponse,
    jobs,
    checkResponses,
    checks,
    descriptorResult,
  } = core;
  const diagnostics = [];
  if (sourceResult.diagnostics.length
    || !isVerifiedRecoveryWorkflowSource(sourceResult.evidence)) {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_WORKFLOW_SOURCE_UNVERIFIED',
      taskPath,
      {
        repository: REPOSITORY,
        repository_id: repositoryId,
        workflow_id: expected.workflowId,
        workflow_path: expected.path,
        workflow_commit_sha: headSha,
        accepted_sources: expected.acceptedSources,
        validator_command: expected.validatorCommand,
        required_job: expected.checkName,
        required_needs: expected.requiredNeeds,
      },
      {
        workflow_id: runResponse.value?.workflow_id,
        workflow_path: runResponse.value?.path,
        workflow_commit_sha: headSha,
        workflow_blob_sha: sourceResponse.value?.sha,
        verifier_diagnostics: sourceResult.diagnostics,
      },
      'Use the accepted immutable workflow bytes from the exact executed commit with the required job, command, dependency graph, token and read permissions.',
    ));
  }
  diagnostics.push(...runDiagnostics({
    ledgerEvidence,
    expected,
    descriptorResult,
    workflow: {
      id: runResponse.value?.workflow_id,
      name: runResponse.value?.name,
      path: runResponse.value?.path,
    },
    run: runResponse.value,
    jobs,
    checks,
    repositoryId,
    prNumber,
    headSha,
    event,
    taskPath,
    mergedAt,
  }));
  return {
    diagnostics,
    descriptor: descriptorResult.evidence,
    source: sourceResult.evidence,
    responses: [sourceResponse, runResponse, allRunsResponse, jobsResponse, ...checkResponses],
  };
}

function mergeMethod(pr, headCommit, mergeCommit, headToResult) {
  const parents = Array.isArray(mergeCommit?.parents) ? mergeCommit.parents.map((item) => item?.sha) : [];
  const exactTree = SHA40.test(headCommit?.commit?.tree?.sha || '')
    && headCommit.commit.tree.sha === mergeCommit?.commit?.tree?.sha;
  if (parents.includes(pr?.head?.sha)
    && ['ahead', 'identical'].includes(headToResult?.status)) return 'merge';
  if (parents.length === 1 && exactTree && parents[0] === pr?.base?.sha) return 'squash';
  if (parents.length === 1 && exactTree) return 'rebase';
  return null;
}

export async function fetchRecoveryCompletionCapability(
  ledger,
  taskId,
  {
    session = null,
    fetchImpl = globalThis.fetch,
    token = process.env.RECOVERY_GITHUB_TOKEN || null,
    now = () => Date.now(),
  } = {},
) {
  const taskIndex = Array.isArray(ledger?.tasks)
    ? ledger.tasks.findIndex((item) => item?.task_id === taskId)
    : -1;
  const task = taskIndex >= 0 ? ledger.tasks[taskIndex] : null;
  const taskPath = taskIndex >= 0 ? `/tasks/${taskIndex}` : '/tasks';
  const completion = task?.completion_evidence;
  const candidate = task?.candidate;
  if (!task || task.lifecycle_state !== 'complete' || !completion || !candidate) {
    return {
      capability: null,
      diagnostics: [diagnostic(
        'RECOVERY_LEDGER_AUTHORITATIVE_COMPLETION_CAPABILITY_REQUIRED',
        taskPath + '/completion_evidence',
        'complete task with fetchable GitHub evidence',
        completion || null,
        'Keep the task non-complete until official GitHub evidence can be fetched and sealed.',
      )],
    };
  }

  const evidenceSession = session || createRecoveryEvidenceSession({ fetchImpl, token, now });
  try {
    const state = sessionState(evidenceSession);
    const capabilityKey = `${taskId}:${sha256(completionBinding(ledger, task))}`;
    const cachedCapability = state.capabilityCache.get(capabilityKey);
    if (cachedCapability && recoveryCompletionCapabilityMatches(cachedCapability, ledger, task)) {
      return { capability: cachedCapability, diagnostics: [] };
    }
    const repositoryResponse = await githubJson(`/repos/${REPOSITORY}`, evidenceSession);
    const pullResponse = await githubJson(
      `/repos/${REPOSITORY}/pulls/${completion.pull_request}`,
      evidenceSession,
    );
    const pr = pullResponse.value;
    const reviewedHead = completion.reviewed_head_sha;
    const resultingMain = completion.resulting_main_sha;
    const [headResponse, mergeResponse, branchResponse, headToResultResponse, resultToMainResponse] = await Promise.all([
      githubJson(`/repos/${REPOSITORY}/commits/${reviewedHead}`, evidenceSession),
      githubJson(`/repos/${REPOSITORY}/commits/${resultingMain}`, evidenceSession),
      githubJson(`/repos/${REPOSITORY}/branches/${DEFAULT_BRANCH}`, evidenceSession),
      githubJson(`/repos/${REPOSITORY}/compare/${reviewedHead}...${resultingMain}`, evidenceSession),
      githubJson(`/repos/${REPOSITORY}/compare/${resultingMain}...${DEFAULT_BRANCH}`, evidenceSession),
    ]);

    const repository = repositoryResponse.value;
    const diagnostics = [];
    if (repository?.id !== REPOSITORY_ID
      || repository?.full_name !== REPOSITORY
      || repository?.default_branch !== DEFAULT_BRANCH) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_GITHUB_REPOSITORY_IDENTITY_MISMATCH',
        '/repository',
        { id: REPOSITORY_ID, full_name: REPOSITORY, default_branch: DEFAULT_BRANCH },
        { id: repository?.id, full_name: repository?.full_name, default_branch: repository?.default_branch },
        'Bind completion only to the fresh official identity of the configured repository and default branch.',
      ));
    }

    if (pr?.number !== completion.pull_request
      || pr?.number !== candidate.pull_request
      || pr?.merged !== true
      || pr?.state !== 'closed'
      || pr?.head?.sha !== reviewedHead
      || pr?.head?.repo?.id !== REPOSITORY_ID
      || pr?.head?.repo?.full_name !== REPOSITORY
      || pr?.base?.ref !== DEFAULT_BRANCH
      || pr?.base?.repo?.id !== REPOSITORY_ID
      || pr?.merge_commit_sha !== resultingMain
      || pr?.html_url !== `https://github.com/${REPOSITORY}/pull/${completion.pull_request}`) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_GITHUB_PR_IDENTITY_MISMATCH',
        taskPath + '/completion_evidence/pull_request',
        {
          pull_request: completion.pull_request,
          merged: true,
          reviewed_head_sha: reviewedHead,
          resulting_main_sha: resultingMain,
          repository_id: REPOSITORY_ID,
          base_ref: DEFAULT_BRANCH,
        },
        {
          number: pr?.number,
          merged: pr?.merged,
          state: pr?.state,
          head: pr?.head,
          base: pr?.base,
          merge_commit_sha: pr?.merge_commit_sha,
          html_url: pr?.html_url,
        },
        'Use the exact fresh merged PR payload from the target repository; an open, wrong, or cross-repository PR cannot complete a task.',
      ));
    }

    if (pr?.merged_by?.login !== completion.merge_actor
      || completion.merge_actor !== OWNER
      || !pr?.merged_at
      || !Number.isFinite(Date.parse(pr.merged_at))) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_GITHUB_MERGE_ACTOR_MISMATCH',
        taskPath + '/completion_evidence/merge_actor',
        { merge_actor: OWNER, merged_at: 'valid GitHub timestamp' },
        { merge_actor: pr?.merged_by?.login || null, merged_at: pr?.merged_at || null },
        'Record only the owner identity and Merge timestamp returned by the official merged PR payload.',
      ));
    }

    const observedMergeMethod = mergeMethod(
      pr,
      headResponse.value,
      mergeResponse.value,
      headToResultResponse.value,
    );
    if (!observedMergeMethod
      || observedMergeMethod !== completion.merge_method
      || headResponse.value?.sha !== reviewedHead
      || mergeResponse.value?.sha !== resultingMain) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_GITHUB_MERGE_METHOD_MISMATCH',
        taskPath + '/completion_evidence/merge_method',
        observedMergeMethod || 'method-aware verified merge result',
        {
          ledger_merge_method: completion.merge_method,
          head_commit_sha: headResponse.value?.sha,
          merge_commit_sha: mergeResponse.value?.sha,
        },
        'Derive merge, squash, or rebase from fresh GitHub commit relationships and exact tree identity.',
      ));
    }

    if (branchResponse.value?.name !== DEFAULT_BRANCH
      || !SHA40.test(branchResponse.value?.commit?.sha || '')
      || !['ahead', 'identical'].includes(resultToMainResponse.value?.status)) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_GITHUB_DEFAULT_BRANCH_RESULT_MISSING',
        taskPath + '/completion_evidence/resulting_main_sha',
        { default_branch: DEFAULT_BRANCH, contains: resultingMain },
        {
          branch_name: branchResponse.value?.name,
          branch_sha: branchResponse.value?.commit?.sha,
          compare_status: resultToMainResponse.value?.status,
        },
        'Require the exact Merge result to be reachable from the fresh official default-branch state.',
      ));
    }

    const exactHeadRun = await fetchRunEvidence({
      ledgerEvidence: completion.exact_head_ci,
      expected: RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk,
      event: 'pull_request',
      headSha: reviewedHead,
      repositoryId: REPOSITORY_ID,
      prNumber: completion.pull_request,
      taskPath: taskPath + '/completion_evidence/exact_head_ci',
      mergedAt: pr?.merged_at,
      session: evidenceSession,
    });
    const currentMainRun = await fetchRunEvidence({
      ledgerEvidence: completion.current_main_validation,
      expected: RECOVERY_AUTHORITATIVE_WORKFLOWS.main,
      event: 'push',
      headSha: resultingMain,
      repositoryId: REPOSITORY_ID,
      prNumber: completion.pull_request,
      taskPath: taskPath + '/completion_evidence/current_main_validation',
      mergedAt: pr?.merged_at,
      session: evidenceSession,
    });
    diagnostics.push(...exactHeadRun.diagnostics, ...currentMainRun.diagnostics);

    const allResponses = [
      repositoryResponse,
      pullResponse,
      headResponse,
      mergeResponse,
      branchResponse,
      headToResultResponse,
      resultToMainResponse,
      ...exactHeadRun.responses,
      ...currentMainRun.responses,
    ];
    diagnostics.push(...responseFreshnessDiagnostics(allResponses, state.now(), taskPath));

    const expectedRefs = {
      authoritative_owner_merge: `https://github.com/${REPOSITORY}/pull/${completion.pull_request}`,
      authoritative_exact_head_ci: `https://github.com/${REPOSITORY}/actions/runs/${completion.exact_head_ci?.run_id}`,
      authoritative_current_main_validation: `https://github.com/${REPOSITORY}/actions/runs/${completion.current_main_validation?.run_id}`,
    };
    const observedRefs = Object.fromEntries(
      (Array.isArray(completion.evidence_refs) ? completion.evidence_refs : [])
        .filter((item) => item && typeof item.kind === 'string')
        .map((item) => [item.kind, item.reference]),
    );
    if (!same(expectedRefs, observedRefs)) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_GITHUB_EVIDENCE_REFERENCE_MISMATCH',
        taskPath + '/completion_evidence/evidence_refs',
        expectedRefs,
        observedRefs,
        'Copy exact official PR and workflow URLs only as comparison references; URLs never mint authority.',
      ));
    }

    const unique = uniqueDiagnostics(diagnostics);
    if (unique.length) return { capability: null, diagnostics: unique };
    const workflowSourceReference = (descriptor) => Object.freeze({
      workflow_id: descriptor.workflow_id,
      workflow_commit_sha: descriptor.workflow_source_commit_sha,
      workflow_blob_sha: descriptor.workflow_blob_sha,
      workflow_final_byte_sha256: descriptor.workflow_final_byte_sha256,
      workflow_policy_id: descriptor.workflow_policy_id,
      reference: descriptor.workflow_source_reference,
    });
    const capability = mintCapability(ledger, task, {
      pull_request: completion.pull_request,
      reviewed_head_sha: reviewedHead,
      resulting_main_sha: resultingMain,
      exact_head_run_id: exactHeadRun.descriptor.run_id,
      current_main_run_id: currentMainRun.descriptor.run_id,
      exact_head_workflow_source: workflowSourceReference(exactHeadRun.descriptor),
      current_main_workflow_source: workflowSourceReference(currentMainRun.descriptor),
      observed_at: new Date(state.now()).toISOString(),
    });
    state.capabilityCache.set(capabilityKey, capability);
    return { capability, diagnostics: [] };
  } catch (error) {
    return {
      capability: null,
      diagnostics: [diagnostic(
        'RECOVERY_LEDGER_GITHUB_EVIDENCE_UNAVAILABLE',
        taskPath + '/completion_evidence',
        'complete fresh official GitHub REST evidence set',
        error instanceof Error ? error.message : String(error),
        'Fail closed until every required official GitHub payload is available; do not substitute ledger data or serialized lookalikes.',
      )],
    };
  }
}
