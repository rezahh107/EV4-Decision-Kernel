#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

const ROOT = process.cwd();
const LEDGER_PATH = 'planning/recovery/recovery-ledger.v1.json';
const PROGRAM_PATH = 'planning/recovery/recovery-execution-program.v1.json';
const SCHEMA_PATH = 'kernel/schemas/recovery-ledger.v1.schema.json';
const FIXTURE_ROOT = 'kernel/fixtures/recovery-ledger';
const SHA40 = /^[0-9a-f]{40}$/;
const REPOSITORY_URL = 'https://github.com/rezahh107/EV4-Decision-Kernel';

const clone = (value) => structuredClone(value);
const normalized = (value) => value === undefined ? null : value;
const canonical = (value) => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
};
const same = (left, right) => JSON.stringify(canonical(left)) === JSON.stringify(canonical(right));
const sameSet = (left, right) => JSON.stringify([...(left || [])].sort()) === JSON.stringify([...(right || [])].sort());
const readJson = (file) => JSON.parse(fs.readFileSync(path.join(ROOT, file), 'utf8'));

function diagnostic(diagnosticId, pathValue, expected, observed, remediation, severity = 'error') {
  return {
    diagnostic_id: diagnosticId,
    severity,
    path: pathValue,
    expected: normalized(expected),
    observed: normalized(observed),
    remediation,
  };
}

function uniqueDiagnostics(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = JSON.stringify([
      item.diagnostic_id,
      item.path,
      canonical(item.expected),
      canonical(item.observed),
    ]);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function add(items, condition, diagnosticId, pathValue, expected, observed, remediation) {
  if (condition) items.push(diagnostic(diagnosticId, pathValue, expected, observed, remediation));
}

function valueAtPointer(document, pointer) {
  if (!pointer) return document;
  let current = document;
  for (const raw of pointer.split('/').slice(1)) {
    const key = raw.replace(/~1/g, '/').replace(/~0/g, '~');
    if (current === null || current === undefined) return null;
    current = current[key];
  }
  return normalized(current);
}

function schemaDiagnostics(value, schema) {
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const validate = ajv.compile(schema);
  if (validate(value)) return [];
  return (validate.errors || []).map((error) => {
    const missing = error.keyword === 'required' ? error.params?.missingProperty : null;
    const pointer = missing
      ? (error.instancePath || '') + '/' + String(missing).replace(/~/g, '~0').replace(/\//g, '~1')
      : (error.instancePath || '/');
    return diagnostic(
      'RECOVERY_LEDGER_SCHEMA_INVALID',
      pointer,
      error.params,
      missing ? null : valueAtPointer(value, error.instancePath),
      'Conform the Recovery ledger document to recovery-ledger.v1.schema.json.',
    );
  });
}

function cycleDiagnostics(tasksById) {
  const diagnostics = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(taskId, trail) {
    if (visiting.has(taskId)) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_DEPENDENCY_CYCLE',
        '/tasks',
        'acyclic declared dependency graph',
        [...trail, taskId],
        'Restore the exact dependency graph from the active Recovery Program carrier.',
      ));
      return;
    }
    if (visited.has(taskId)) return;
    visiting.add(taskId);
    const task = tasksById.get(taskId);
    for (const dependency of task?.declared_dependencies || []) {
      if (tasksById.has(dependency)) visit(dependency, [...trail, taskId]);
    }
    visiting.delete(taskId);
    visited.add(taskId);
  }

  for (const taskId of tasksById.keys()) visit(taskId, []);
  return diagnostics;
}

function completionDiagnostics(task, taskPath) {
  const diagnostics = [];
  const candidate = task.candidate;
  const completion = task.completion_evidence;

  if (candidate?.pr_state === 'open') {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_OPEN_PR_NOT_COMPLETION',
      taskPath + '/candidate/pr_state',
      'merged',
      candidate.pr_state,
      'Keep the task non-complete until authoritative owner Merge evidence exists.',
    ));
  }

  if (!completion || typeof completion !== 'object') {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_COMPLETION_EVIDENCE_REQUIRED',
      taskPath + '/completion_evidence',
      'exact-head CI, owner Merge, and current-main validation evidence',
      completion,
      'Record completion only in a later default-branch evidence update after Merge and current-main validation.',
    ));
    return diagnostics;
  }

  const exactHeadCi = completion.exact_head_ci;
  const currentMain = completion.current_main_validation;
  const mergeIdentityComplete = Number.isInteger(completion.pull_request)
    && SHA40.test(completion.reviewed_head_sha || '')
    && ['merge', 'squash', 'rebase'].includes(completion.merge_method)
    && completion.merge_actor === 'rezahh107'
    && SHA40.test(completion.resulting_main_sha || '');

  add(
    diagnostics,
    !mergeIdentityComplete,
    'RECOVERY_LEDGER_MERGE_IDENTITY_REQUIRED',
    taskPath + '/completion_evidence',
    'exact PR, reviewed head, owner, merge method, and resulting main SHA',
    {
      pull_request: completion.pull_request,
      reviewed_head_sha: completion.reviewed_head_sha,
      merge_method: completion.merge_method,
      merge_actor: completion.merge_actor,
      resulting_main_sha: completion.resulting_main_sha,
    },
    'Populate only identities resolved from the authoritative merged PR and resulting default-branch commit.',
  );

  const exactHeadComplete = exactHeadCi
    && exactHeadCi.workflow === 'Validate MVK'
    && Number.isInteger(exactHeadCi.run_id)
    && exactHeadCi.conclusion === 'success'
    && exactHeadCi.head_sha === completion.reviewed_head_sha;
  add(
    diagnostics,
    !exactHeadComplete,
    'RECOVERY_LEDGER_EXACT_HEAD_CI_REQUIRED',
    taskPath + '/completion_evidence/exact_head_ci',
    'successful Validate MVK bound to reviewed_head_sha',
    exactHeadCi,
    'Use the authoritative successful exact-head workflow identity; an asserted Green value is insufficient.',
  );

  const currentMainComplete = currentMain
    && currentMain.workflow === 'Validate Main'
    && Number.isInteger(currentMain.run_id)
    && currentMain.conclusion === 'success'
    && currentMain.head_sha === completion.resulting_main_sha;
  add(
    diagnostics,
    !currentMainComplete,
    'RECOVERY_LEDGER_CURRENT_MAIN_VALIDATION_REQUIRED',
    taskPath + '/completion_evidence/current_main_validation',
    'successful Validate Main bound to resulting_main_sha',
    currentMain,
    'Use the authoritative successful current-main workflow identity after owner Merge.',
  );

  if (exactHeadComplete && (!mergeIdentityComplete || !currentMainComplete)) {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_CI_GREEN_NOT_COMPLETION',
      taskPath + '/completion_evidence',
      'CI plus owner Merge plus current-main validation',
      'exact-head CI only',
      'Do not convert a Green PR check into a task-completion claim.',
    ));
  }

  add(
    diagnostics,
    completion.pull_request !== candidate?.pull_request,
    'RECOVERY_LEDGER_COMPLETION_IDENTITY_MISMATCH',
    taskPath + '/completion_evidence/pull_request',
    candidate?.pull_request,
    completion.pull_request,
    'Bind completion to the same candidate PR recorded for the task.',
  );

  const expectedReferences = mergeIdentityComplete && exactHeadComplete && currentMainComplete
    ? {
      authoritative_owner_merge: REPOSITORY_URL + '/pull/' + completion.pull_request,
      authoritative_exact_head_ci: REPOSITORY_URL + '/actions/runs/' + exactHeadCi.run_id,
      authoritative_current_main_validation: REPOSITORY_URL + '/actions/runs/' + currentMain.run_id,
    }
    : null;
  const observedReferences = Object.fromEntries(
    (Array.isArray(completion.evidence_refs) ? completion.evidence_refs : [])
      .filter((item) => item && typeof item.kind === 'string')
      .map((item) => [item.kind, item.reference]),
  );

  add(
    diagnostics,
    !expectedReferences || !same(observedReferences, expectedReferences)
      || exactHeadCi?.reference !== expectedReferences?.authoritative_exact_head_ci
      || currentMain?.reference !== expectedReferences?.authoritative_current_main_validation,
    'RECOVERY_LEDGER_COMPLETION_EVIDENCE_UNVERIFIED',
    taskPath + '/completion_evidence/evidence_refs',
    expectedReferences,
    observedReferences,
    'Use only coherent GitHub PR and Actions run references derived from the exact recorded identities.',
  );

  return diagnostics;
}

export function recoveryLedgerDiagnostics(ledger, program) {
  const diagnostics = [];
  if (!ledger || typeof ledger !== 'object' || Array.isArray(ledger)) {
    return [diagnostic(
      'RECOVERY_LEDGER_MALFORMED',
      '/',
      'object',
      ledger,
      'Provide a JSON object conforming to the Recovery ledger schema.',
    )];
  }
  if (!program || typeof program !== 'object' || Array.isArray(program)) {
    return [diagnostic(
      'RECOVERY_LEDGER_PROGRAM_CARRIER_UNAVAILABLE',
      '/program_ref',
      PROGRAM_PATH,
      program,
      'Restore and validate the active Recovery Program carrier before validating its ledger.',
    )];
  }

  add(
    diagnostics,
    ledger.program_id !== program.program_id
      || ledger.program_id !== 'DCOV-COVERAGE-EXECUTION-PROGRAM'
      || ledger.program_ref !== PROGRAM_PATH,
    'RECOVERY_LEDGER_PROGRAM_IDENTITY_MISMATCH',
    '/program_id',
    {
      program_id: program.program_id,
      program_ref: PROGRAM_PATH,
    },
    {
      program_id: ledger.program_id,
      program_ref: ledger.program_ref,
    },
    'Bind the ledger to the live canonical Recovery Program carrier without redefining it.',
  );
  add(
    diagnostics,
    ledger.program_authority_state !== program.program_status,
    'RECOVERY_LEDGER_PROGRAM_AUTHORITY_MISMATCH',
    '/program_authority_state',
    program.program_status,
    ledger.program_authority_state,
    'Mirror the authority state from the canonical Recovery Program carrier.',
  );

  const effects = ledger.effects || {};
  const effectRules = [
    ['coverage_promotion_effect', 'none', 'RECOVERY_LEDGER_COVERAGE_PROMOTION_FORBIDDEN'],
    ['coverage_credit', false, 'RECOVERY_LEDGER_COVERAGE_CREDIT_FORBIDDEN'],
    ['readiness_claim', false, 'RECOVERY_LEDGER_READINESS_CLAIM_FORBIDDEN'],
    ['product_effect', 'none', 'RECOVERY_LEDGER_PRODUCT_EFFECT_FORBIDDEN'],
    ['external_repository_effect', 'none', 'RECOVERY_LEDGER_EXTERNAL_REPOSITORY_EFFECT_FORBIDDEN'],
    ['kroad_supersession_effect', 'none', 'RECOVERY_LEDGER_KROAD_SUPERSESSION_FORBIDDEN'],
  ];
  for (const [field, expected, code] of effectRules) {
    add(
      diagnostics,
      effects[field] !== expected,
      code,
      '/effects/' + field,
      expected,
      effects[field],
      'Restore the Recovery-only boundary; this ledger cannot create downstream effects.',
    );
  }

  const programTasks = Array.isArray(program.tasks) ? program.tasks : [];
  const programById = new Map(programTasks.map((task) => [task.task_id, task]));
  const tasks = Array.isArray(ledger.tasks) ? ledger.tasks : [];
  const tasksById = new Map();
  const seen = new Set();

  for (const [index, task] of tasks.entries()) {
    const taskPath = '/tasks/' + index;
    if (!task || typeof task !== 'object' || Array.isArray(task)) {
      diagnostics.push(diagnostic(
        'RECOVERY_LEDGER_TASK_MALFORMED',
        taskPath,
        'task object',
        task,
        'Replace the entry with a complete task record.',
      ));
      continue;
    }
    const taskId = task.task_id;
    const carrierTask = programById.get(taskId);
    add(
      diagnostics,
      !carrierTask,
      'RECOVERY_LEDGER_TASK_ID_UNKNOWN',
      taskPath + '/task_id',
      [...programById.keys()],
      taskId,
      'Remove unknown tasks; the task universe is owned by the active Recovery Program carrier.',
    );
    add(
      diagnostics,
      seen.has(taskId),
      'RECOVERY_LEDGER_TASK_ID_DUPLICATE',
      taskPath + '/task_id',
      'exactly one entry per canonical task',
      taskId,
      'Keep exactly one ledger entry for each task_id.',
    );
    seen.add(taskId);
    if (!tasksById.has(taskId)) tasksById.set(taskId, task);

    if (!carrierTask) continue;
    add(
      diagnostics,
      task.title !== carrierTask.title,
      'RECOVERY_LEDGER_TASK_TITLE_MISMATCH',
      taskPath + '/title',
      carrierTask.title,
      task.title,
      'Copy the exact title from the active Recovery Program carrier.',
    );
    add(
      diagnostics,
      !sameSet(task.declared_dependencies, carrierTask.depends_on),
      'RECOVERY_LEDGER_DEPENDENCY_GRAPH_MISMATCH',
      taskPath + '/declared_dependencies',
      carrierTask.depends_on,
      task.declared_dependencies,
      'Restore the exact declared dependency set from the active Recovery Program carrier.',
    );
    add(
      diagnostics,
      Array.isArray(task.declared_dependencies) && task.declared_dependencies.includes(taskId),
      'RECOVERY_LEDGER_SELF_DEPENDENCY',
      taskPath + '/declared_dependencies',
      'dependencies excluding self',
      task.declared_dependencies,
      'Remove the self-dependency and restore the canonical dependency set.',
    );
    add(
      diagnostics,
      task.authority?.carrier_status !== carrierTask.status,
      'RECOVERY_LEDGER_TASK_AUTHORITY_MISMATCH',
      taskPath + '/authority/carrier_status',
      carrierTask.status,
      task.authority?.carrier_status,
      'Mirror task authority state from the active Recovery Program carrier.',
    );
    add(
      diagnostics,
      task.authority?.implementation_authorized !== carrierTask.implementation_authorized,
      'RECOVERY_LEDGER_TASK_AUTHORIZATION_MISMATCH',
      taskPath + '/authority/implementation_authorized',
      carrierTask.implementation_authorized,
      task.authority?.implementation_authorized,
      'Mirror implementation_authorized from the active Recovery Program carrier.',
    );
    add(
      diagnostics,
      task.coverage_credit !== false,
      'RECOVERY_LEDGER_COVERAGE_CREDIT_FORBIDDEN',
      taskPath + '/coverage_credit',
      false,
      task.coverage_credit,
      'Recovery lifecycle state cannot create Coverage credit.',
    );
    add(
      diagnostics,
      task.readiness_claim !== false,
      'RECOVERY_LEDGER_READINESS_CLAIM_FORBIDDEN',
      taskPath + '/readiness_claim',
      false,
      task.readiness_claim,
      'Recovery lifecycle state cannot create a readiness claim.',
    );
  }

  const expectedTaskIds = [...programById.keys()];
  add(
    diagnostics,
    tasks.length !== programTasks.length
      || seen.size !== programTasks.length
      || expectedTaskIds.some((taskId) => !seen.has(taskId)),
    'RECOVERY_LEDGER_TASK_SET_MISMATCH',
    '/tasks',
    expectedTaskIds,
    tasks.map((task) => task?.task_id),
    'Provide exactly one entry for every task and no extra entry.',
  );
  diagnostics.push(...cycleDiagnostics(tasksById));

  for (const [index, task] of tasks.entries()) {
    if (!task || typeof task !== 'object' || Array.isArray(task)) continue;
    const taskPath = '/tasks/' + index;
    const dependencies = Array.isArray(task.declared_dependencies) ? task.declared_dependencies : [];
    const dependenciesComplete = dependencies.every(
      (dependencyId) => tasksById.get(dependencyId)?.lifecycle_state === 'complete',
    );
    const expectedEligibility = task.lifecycle_state === 'complete'
      ? 'complete'
      : dependenciesComplete
        ? 'dependency_ready'
        : 'dependency_blocked';
    add(
      diagnostics,
      task.execution_eligibility !== expectedEligibility,
      'RECOVERY_LEDGER_EXECUTION_ELIGIBILITY_MISMATCH',
      taskPath + '/execution_eligibility',
      expectedEligibility,
      task.execution_eligibility,
      'Derive eligibility only from complete declared dependencies, never from prompt, branch, PR, or CI state.',
    );

    if (task.lifecycle_state === 'not_started') {
      add(
        diagnostics,
        task.candidate !== null || task.completion_evidence !== null,
        'RECOVERY_LEDGER_UNDEFINED_FIELD_NOT_NULL',
        taskPath,
        {
          candidate: null,
          completion_evidence: null,
        },
        {
          candidate: task.candidate,
          completion_evidence: task.completion_evidence,
        },
        'Keep candidate and completion fields null until machine-observable state exists.',
      );
    } else if (task.lifecycle_state === 'in_progress') {
      add(
        diagnostics,
        !task.candidate || typeof task.candidate.branch !== 'string',
        'RECOVERY_LEDGER_CANDIDATE_REQUIRED',
        taskPath + '/candidate',
        'branch-backed candidate',
        task.candidate,
        'Record in_progress only after a bounded candidate branch exists.',
      );
      add(
        diagnostics,
        task.completion_evidence !== null,
        'RECOVERY_LEDGER_COMPLETION_EVIDENCE_FORBIDDEN',
        taskPath + '/completion_evidence',
        null,
        task.completion_evidence,
        'Candidate work is not completion evidence.',
      );
    } else if (task.lifecycle_state === 'checks_pending') {
      add(
        diagnostics,
        !Number.isInteger(task.candidate?.pull_request) || task.candidate?.pr_state !== 'open',
        'RECOVERY_LEDGER_OPEN_PR_REQUIRED',
        taskPath + '/candidate',
        'open pull request identity',
        task.candidate,
        'Record checks_pending only for a live open PR.',
      );
      add(
        diagnostics,
        task.completion_evidence !== null,
        'RECOVERY_LEDGER_COMPLETION_EVIDENCE_FORBIDDEN',
        taskPath + '/completion_evidence',
        null,
        task.completion_evidence,
        'Exact-head checks are candidate evidence, not completion proof.',
      );
    } else if (task.lifecycle_state === 'complete') {
      for (const dependencyId of dependencies) {
        add(
          diagnostics,
          tasksById.get(dependencyId)?.lifecycle_state !== 'complete',
          'RECOVERY_LEDGER_COMPLETE_DEPENDENCY_INCOMPLETE',
          taskPath + '/declared_dependencies',
          'all dependencies complete',
          {
            dependency_id: dependencyId,
            lifecycle_state: tasksById.get(dependencyId)?.lifecycle_state,
          },
          'Revert the task to a non-complete state until every declared dependency is complete.',
        );
      }
      add(
        diagnostics,
        !Number.isInteger(task.candidate?.pull_request) || task.candidate?.pr_state !== 'merged',
        'RECOVERY_LEDGER_MERGED_CANDIDATE_REQUIRED',
        taskPath + '/candidate',
        'merged candidate PR identity',
        task.candidate,
        'Completion requires the merged state of the exact candidate PR.',
      );
      diagnostics.push(...completionDiagnostics(task, taskPath));
    }

    if (task.candidate && typeof task.candidate === 'object') {
      add(
        diagnostics,
        task.candidate.pull_request === null && task.candidate.pr_state !== null,
        'RECOVERY_LEDGER_UNDEFINED_FIELD_NOT_NULL',
        taskPath + '/candidate/pr_state',
        null,
        task.candidate.pr_state,
        'Keep pr_state null until a pull_request identity exists.',
      );
      add(
        diagnostics,
        Number.isInteger(task.candidate.pull_request) && task.candidate.pr_state === null,
        'RECOVERY_LEDGER_CANDIDATE_STATE_REQUIRED',
        taskPath + '/candidate/pr_state',
        'open, closed, or merged',
        task.candidate.pr_state,
        'Bind every candidate PR number to its machine-observed PR state.',
      );
    }
  }

  return uniqueDiagnostics(diagnostics);
}

export function validateRecoveryLedgerDocument(ledger, program, schema) {
  return uniqueDiagnostics([
    ...schemaDiagnostics(ledger, schema),
    ...recoveryLedgerDiagnostics(ledger, program),
  ]);
}

export function recoveryLedgerHistoryDiagnostics(previousLedger, currentLedger) {
  const diagnostics = [];
  const currentById = new Map(
    (Array.isArray(currentLedger?.tasks) ? currentLedger.tasks : []).map((task) => [task.task_id, task]),
  );
  for (const previousTask of Array.isArray(previousLedger?.tasks) ? previousLedger.tasks : []) {
    if (previousTask.lifecycle_state !== 'complete') continue;
    const currentTask = currentById.get(previousTask.task_id);
    add(
      diagnostics,
      !currentTask
        || currentTask.lifecycle_state !== 'complete'
        || !same(currentTask.completion_evidence, previousTask.completion_evidence),
      'RECOVERY_LEDGER_COMPLETION_EVIDENCE_IMMUTABLE',
      '/tasks/' + previousTask.task_id,
      {
        lifecycle_state: 'complete',
        completion_evidence: previousTask.completion_evidence,
      },
      currentTask || null,
      'Never remove, rewrite, or downgrade accepted completion evidence; append a separately governed correction record instead.',
    );
  }
  return diagnostics;
}

function git(args) {
  return execFileSync('git', args, {
    cwd: ROOT,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function commitExists(commitSha) {
  try {
    git(['cat-file', '-e', commitSha + '^{commit}']);
    return true;
  } catch {
    return false;
  }
}

function isAncestor(ancestor, descendant) {
  try {
    execFileSync('git', ['merge-base', '--is-ancestor', ancestor, descendant], {
      cwd: ROOT,
      stdio: 'ignore',
    });
    return true;
  } catch {
    return false;
  }
}

function resolveMainRef() {
  for (const ref of ['refs/remotes/origin/main', 'refs/heads/main', 'HEAD']) {
    try {
      return git(['rev-parse', ref]);
    } catch {
      continue;
    }
  }
  return null;
}

export function repositoryCompletionDiagnostics(ledger) {
  const diagnostics = [];
  const mainSha = resolveMainRef();
  for (const [index, task] of (Array.isArray(ledger?.tasks) ? ledger.tasks : []).entries()) {
    if (task.lifecycle_state !== 'complete') continue;
    const completion = task.completion_evidence || {};
    const reviewedHead = completion.reviewed_head_sha;
    const resultingMain = completion.resulting_main_sha;
    const pathValue = '/tasks/' + index + '/completion_evidence';
    const identitiesExist = SHA40.test(reviewedHead || '')
      && SHA40.test(resultingMain || '')
      && commitExists(reviewedHead)
      && commitExists(resultingMain);
    add(
      diagnostics,
      !identitiesExist,
      'RECOVERY_LEDGER_COMPLETION_GIT_IDENTITY_UNVERIFIED',
      pathValue,
      'existing reviewed-head and resulting-main commits',
      {
        reviewed_head_sha: reviewedHead,
        resulting_main_sha: resultingMain,
      },
      'Use exact commits present in repository history; never invent completion SHAs.',
    );
    if (!identitiesExist) continue;

    let methodAwareMerge = false;
    if (completion.merge_method === 'merge') {
      methodAwareMerge = isAncestor(reviewedHead, resultingMain);
    } else if (['squash', 'rebase'].includes(completion.merge_method)) {
      try {
        methodAwareMerge = git(['rev-parse', reviewedHead + '^{tree}'])
          === git(['rev-parse', resultingMain + '^{tree}']);
      } catch {
        methodAwareMerge = false;
      }
    }
    add(
      diagnostics,
      !methodAwareMerge,
      'RECOVERY_LEDGER_MERGE_RESULT_UNVERIFIED',
      pathValue + '/resulting_main_sha',
      'method-aware relationship to reviewed_head_sha',
      {
        merge_method: completion.merge_method,
        reviewed_head_sha: reviewedHead,
        resulting_main_sha: resultingMain,
      },
      'Resolve and verify the actual GitHub merge method and resulting commit.',
    );
    add(
      diagnostics,
      !mainSha || !isAncestor(resultingMain, mainSha),
      'RECOVERY_LEDGER_DEFAULT_BRANCH_IDENTITY_UNVERIFIED',
      pathValue + '/resulting_main_sha',
      'resulting_main_sha reachable from current main',
      {
        resulting_main_sha: resultingMain,
        current_main_sha: mainSha,
      },
      'Record completion only after the merge result is present on the current default branch.',
    );
  }
  return uniqueDiagnostics(diagnostics);
}

function decodePointerPart(value) {
  return value.replace(/~1/g, '/').replace(/~0/g, '~');
}

export function applyFixturePatch(document, operations) {
  const result = clone(document);
  for (const operation of operations || []) {
    const parts = String(operation.path || '').split('/').slice(1).map(decodePointerPart);
    if (!parts.length) throw new Error('RECOVERY_LEDGER_FIXTURE_ROOT_PATCH_FORBIDDEN');
    let parent = result;
    for (const part of parts.slice(0, -1)) {
      if (parent === null || parent === undefined) {
        throw new Error('RECOVERY_LEDGER_FIXTURE_POINTER_UNRESOLVED:' + operation.path);
      }
      parent = parent[part];
    }
    if (parent === null || parent === undefined) {
      throw new Error('RECOVERY_LEDGER_FIXTURE_POINTER_UNRESOLVED:' + operation.path);
    }
    const key = parts.at(-1);
    if (operation.op === 'remove') {
      if (Array.isArray(parent)) parent.splice(Number(key), 1);
      else delete parent[key];
    } else if (operation.op === 'replace') {
      parent[key] = clone(operation.value);
    } else if (operation.op === 'add') {
      if (Array.isArray(parent) && key === '-') parent.push(clone(operation.value));
      else if (Array.isArray(parent)) parent.splice(Number(key), 0, clone(operation.value));
      else parent[key] = clone(operation.value);
    } else {
      throw new Error('RECOVERY_LEDGER_FIXTURE_OPERATION_UNKNOWN:' + operation.op);
    }
  }
  return result;
}

function runFixtureSuite(canonicalLedger, program, schema) {
  const fixtures = [];
  for (const category of ['valid', 'invalid', 'adversarial']) {
    const file = path.join(ROOT, FIXTURE_ROOT, category, 'cases.json');
    const fixtureSet = JSON.parse(fs.readFileSync(file, 'utf8'));
    for (const fixtureCase of fixtureSet.cases || []) {
      const document = applyFixturePatch(canonicalLedger, fixtureCase.patch || []);
      const observed = validateRecoveryLedgerDocument(document, program, schema);
      const observedIds = new Set(observed.map((item) => item.diagnostic_id));
      const expected = fixtureCase.expected_diagnostic_ids || [];
      const pass = category === 'valid'
        ? observed.length === 0
        : expected.length > 0 && expected.every((diagnosticId) => observedIds.has(diagnosticId));
      fixtures.push({
        category,
        case_id: fixtureCase.case_id,
        pass,
        expected_diagnostic_ids: expected,
        observed_diagnostic_ids: [...observedIds].sort(),
      });
    }
  }
  return fixtures;
}

function previousLedgerAtBase() {
  const baseSha = process.env.COVERAGE_BASE_SHA;
  if (!SHA40.test(baseSha || '')) return null;
  try {
    return JSON.parse(git(['show', baseSha + ':' + LEDGER_PATH]));
  } catch {
    return null;
  }
}

function run() {
  const ledger = readJson(LEDGER_PATH);
  const program = readJson(PROGRAM_PATH);
  const schema = readJson(SCHEMA_PATH);
  const fixtures = runFixtureSuite(ledger, program, schema);
  const previousLedger = previousLedgerAtBase();
  const diagnostics = uniqueDiagnostics([
    ...validateRecoveryLedgerDocument(ledger, program, schema),
    ...(previousLedger ? recoveryLedgerHistoryDiagnostics(previousLedger, ledger) : []),
    ...repositoryCompletionDiagnostics(ledger),
  ]);
  if (fixtures.some((fixture) => !fixture.pass)) {
    diagnostics.push(diagnostic(
      'RECOVERY_LEDGER_FIXTURE_EXPECTATION_FAILED',
      '/kernel/fixtures/recovery-ledger',
      'all fixture expectations pass',
      fixtures.filter((fixture) => !fixture.pass),
      'Repair the fixture or validator until every declared case is deterministic.',
    ));
  }
  const report = {
    validator: 'recovery-ledger.v1',
    status: diagnostics.length ? 'fail' : 'pass',
    program_id: ledger.program_id,
    diagnostics: uniqueDiagnostics(diagnostics),
    fixtures,
  };
  console.log(JSON.stringify(report, null, 2));
  if (report.status !== 'pass') process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) run();
