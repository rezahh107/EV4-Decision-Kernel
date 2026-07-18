import {
  GITHUB_ACTIONS_APP_ID,
  GITHUB_ACTIONS_APP_SLUG,
  RECOVERY_AUTHORITATIVE_WORKFLOWS,
} from '../../tools/lib/aigov-ci-descriptor.mjs';
import { recoveryPrimordials as p } from './recovery-primordials.mjs';

const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const VERIFIED_SOURCES = new p.TrustedWeakSet();
const VERIFIED_RUNS = new p.TrustedWeakSet();
const WORKFLOW_POLICIES = new p.TrustedSet([
  RECOVERY_AUTHORITATIVE_WORKFLOWS.mvk,
  RECOVERY_AUTHORITATIVE_WORKFLOWS.main,
]);

const validSha = (value) => {
  if (typeof value !== 'string' || value.length !== 40) return false;
  for (let index = 0; index < value.length; index += 1) {
    const code = p.stringCharCodeAt(value, index);
    if (!((code >= 48 && code <= 57) || (code >= 97 && code <= 102))) return false;
  }
  return true;
};

function stripAsciiWhitespace(value) {
  let result = '';
  for (let index = 0; index < value.length; index += 1) {
    const code = p.stringCharCodeAt(value, index);
    if (code !== 9 && code !== 10 && code !== 13 && code !== 32) result += value[index];
  }
  return result;
}

function validBase64(value) {
  if (!value || value.length % 4 !== 0) return false;
  let padding = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = p.stringCharCodeAt(value, index);
    const isAlphaNumeric = (code >= 48 && code <= 57)
      || (code >= 65 && code <= 90)
      || (code >= 97 && code <= 122);
    const isSymbol = code === 43 || code === 47;
    if (code === 61) {
      padding += 1;
      if (index < value.length - 2 || padding > 2) return false;
    } else {
      if (padding > 0 || (!isAlphaNumeric && !isSymbol)) return false;
    }
  }
  return true;
}

function uniqueDiagnostics(items) {
  const seen = new p.TrustedSet();
  const result = [];
  for (let index = 0; index < items.length; index += 1) {
    const item = items[index];
    if (!p.setHas(seen, item)) {
      p.setAdd(seen, item);
      p.arrayPush(result, item);
    }
  }
  return result;
}

function freezeEvidence(value, registry) {
  const frozen = p.objectFreeze(value);
  p.weakSetAdd(registry, frozen);
  return frozen;
}

export function isVerifiedRecoveryWorkflowSource(value) {
  return p.TrustedBoolean(value && p.weakSetHas(VERIFIED_SOURCES, value));
}

export function isVerifiedAuthoritativeRun(value) {
  return p.TrustedBoolean(value && p.weakSetHas(VERIFIED_RUNS, value));
}

export function workflowSourceIdentity(raw) {
  const bytes = p.bufferIsBuffer(raw) ? raw : p.bufferFrom(raw);
  const prefix = p.bufferFrom(`blob ${bytes.length}\0`);
  return p.objectFreeze({
    blob_sha: p.createHash('sha1').update(prefix).update(bytes).digest('hex'),
    final_byte_sha256: p.createHash('sha256').update(bytes).digest('hex'),
    size: bytes.length,
  });
}

function decodeContentPayload(payload) {
  const encoded = typeof payload?.content === 'string'
    ? stripAsciiWhitespace(payload.content)
    : '';
  if (!validBase64(encoded)) return null;
  const raw = p.bufferFrom(encoded, 'base64');
  if (p.bufferToString(raw, 'base64') !== encoded) return null;
  return raw;
}

function acceptedSource(expected, identity) {
  const sources = p.arrayIsArray(expected?.acceptedSources) ? expected.acceptedSources : [];
  return p.arraySome(sources, (item) => item?.blob_sha === identity.blob_sha
    && item?.final_byte_sha256 === identity.final_byte_sha256);
}

export function verifyRecoveryWorkflowSourcePayload({
  repository,
  repositoryId,
  commitSha,
  expected,
  contentPayload,
  sourceApiUrl,
}) {
  const diagnostics = [];
  const identityBytes = decodeContentPayload(contentPayload);
  const pathParts = typeof expected?.path === 'string' ? p.stringSplit(expected.path, '/') : [];
  const encodedParts = p.arrayMap(pathParts, p.trustedEncodeURIComponent);
  const expectedApiUrl = `https://api.github.com/repos/${repository}/contents/${p.arrayJoin(encodedParts, '/')}?ref=${p.trustedEncodeURIComponent(commitSha || '')}`;

  if (repository !== REPOSITORY
    || repositoryId !== REPOSITORY_ID
    || !validSha(commitSha)
    || !p.setHas(WORKFLOW_POLICIES, expected)
    || sourceApiUrl !== expectedApiUrl) {
    p.arrayPush(diagnostics, 'AIGOV_RECOVERY_WORKFLOW_SOURCE_CONTEXT_MISMATCH');
  }

  const expectedName = p.arrayAt(pathParts, -1);
  if (!identityBytes
    || contentPayload?.type !== 'file'
    || contentPayload?.encoding !== 'base64'
    || contentPayload?.path !== expected?.path
    || contentPayload?.name !== expectedName
    || contentPayload?.size !== identityBytes?.length) {
    p.arrayPush(diagnostics, 'AIGOV_RECOVERY_WORKFLOW_SOURCE_PAYLOAD_MALFORMED');
  }

  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

  const sourceIdentity = workflowSourceIdentity(identityBytes);
  if (contentPayload.sha !== sourceIdentity.blob_sha) {
    p.arrayPush(diagnostics, 'AIGOV_RECOVERY_WORKFLOW_BLOB_SHA_MISMATCH');
  }
  if (!acceptedSource(expected, sourceIdentity)) {
    p.arrayPush(diagnostics, 'AIGOV_RECOVERY_WORKFLOW_SOURCE_DIGEST_MISMATCH');
  }
  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

  return {
    diagnostics: [],
    evidence: freezeEvidence({
      schema_version: 'recovery-workflow-source-evidence.v1',
      repository,
      repository_id: repositoryId,
      workflow_id: expected.workflowId,
      workflow_name: expected.name,
      workflow_path: expected.path,
      workflow_source_commit_sha: commitSha,
      workflow_blob_sha: sourceIdentity.blob_sha,
      workflow_final_byte_sha256: sourceIdentity.final_byte_sha256,
      workflow_source_reference: sourceApiUrl,
      workflow_policy_id: expected.policyId,
      external_trust_authority: expected.externalTrust?.authority || null,
    }, VERIFIED_SOURCES),
  };
}

function add(diagnostics, condition, code) {
  if (condition) p.arrayPush(diagnostics, code);
}

function verifyWorkflowDescriptorPayloads({
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
  add(
    diagnostics,
    !repository || !p.numberIsInteger(repositoryId) || !validSha(exactHeadSha) || !expected,
    'AIGOV_CI_CONTEXT_MALFORMED',
  );
  add(
    diagnostics,
    !workflow || !p.numberIsInteger(workflow.id)
      || workflow.path !== expected?.path || workflow.name !== expected?.name,
    'AIGOV_CI_WORKFLOW_DESCRIPTOR_MISMATCH',
  );
  add(
    diagnostics,
    !p.arrayIsArray(runs) || !p.arrayIsArray(allRepositoryRuns),
    'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED',
  );
  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

  const collisions = p.arrayFilter(allRepositoryRuns, (run) => run
    && run.repository?.id === repositoryId
    && run.repository?.full_name === repository
    && run.name === expected.name
    && run.event === event
    && run.head_sha === exactHeadSha
    && (run.workflow_id !== workflow.id || run.path !== expected.path));
  add(diagnostics, collisions.length > 0, 'AIGOV_CI_SAME_NAME_WORKFLOW_COLLISION');

  const malformed = p.arraySome(runs, (run) => !run
    || !p.numberIsInteger(run.id)
    || !p.numberIsInteger(run.run_attempt)
    || !run.repository
    || !p.numberIsInteger(run.repository.id)
    || typeof run.repository.full_name !== 'string'
    || typeof run.path !== 'string'
    || typeof run.name !== 'string'
    || typeof run.event !== 'string'
    || typeof run.head_sha !== 'string');
  add(diagnostics, malformed, 'AIGOV_CI_WORKFLOW_PAYLOAD_MALFORMED');

  const candidates = p.arrayFilter(runs, (run) => run
    && run.repository?.id === repositoryId
    && run.repository?.full_name === repository
    && run.workflow_id === workflow.id
    && run.path === expected.path
    && run.name === expected.name
    && run.event === event
    && run.head_sha === exactHeadSha
    && (expectedRunId == null || run.id === expectedRunId));
  add(diagnostics, candidates.length === 0, 'AIGOV_CI_AUTHORITATIVE_RUN_MISSING');
  add(diagnostics, candidates.length > 1, 'AIGOV_CI_AMBIGUOUS_DUPLICATE_RUNS');
  const run = candidates[0];
  add(
    diagnostics,
    p.TrustedBoolean(run) && (run.status !== 'completed' || run.conclusion !== 'success'),
    'AIGOV_CI_AUTHORITATIVE_RUN_NOT_SUCCESSFUL',
  );
  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

  add(
    diagnostics,
    !p.arrayIsArray(jobs) || !p.arrayIsArray(checkRuns),
    'AIGOV_CI_JOB_CHECK_PAYLOAD_MALFORMED',
  );
  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

  if (jobsRunId != null) {
    add(
      diagnostics,
      !p.numberIsInteger(jobsRunId) || jobsRunId !== run.id,
      'AIGOV_CI_JOB_SOURCE_RUN_MISMATCH',
    );
  } else if (jobs.length > 0) {
    const declared = new p.TrustedSet();
    for (let index = 0; index < jobs.length; index += 1) {
      const runId = jobs[index]?.run_id;
      if (p.numberIsInteger(runId)) p.setAdd(declared, runId);
    }
    if (p.setSize(declared) > 0) {
      add(
        diagnostics,
        p.setSize(declared) !== 1 || !p.setHas(declared, run.id),
        'AIGOV_CI_JOB_SOURCE_RUN_MISMATCH',
      );
    }
  }
  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

  const matchingJobs = p.arrayFilter(jobs, (job) => job?.name === expected.checkName);
  add(
    diagnostics,
    matchingJobs.length !== 1,
    matchingJobs.length ? 'AIGOV_CI_AMBIGUOUS_JOB' : 'AIGOV_CI_JOB_MISSING',
  );
  const job = matchingJobs[0];
  add(
    diagnostics,
    !job || !p.numberIsInteger(job.id) || job.head_sha !== exactHeadSha
      || job.status !== 'completed' || job.conclusion !== 'success',
    'AIGOV_CI_JOB_DESCRIPTOR_MISMATCH',
  );

  const matchingChecks = p.arrayFilter(checkRuns, (check) => check?.id === job?.id);
  add(
    diagnostics,
    matchingChecks.length !== 1,
    matchingChecks.length ? 'AIGOV_CI_AMBIGUOUS_CHECK' : 'AIGOV_CI_CHECK_MISSING',
  );
  const check = matchingChecks[0];
  add(
    diagnostics,
    !check || check.name !== expected.checkName || check.head_sha !== exactHeadSha
      || check.status !== 'completed' || check.conclusion !== 'success',
    'AIGOV_CI_CHECK_DESCRIPTOR_MISMATCH',
  );
  add(
    diagnostics,
    check?.app?.id !== GITHUB_ACTIONS_APP_ID
      || check?.app?.slug !== GITHUB_ACTIONS_APP_SLUG
      || check?.app?.owner?.login !== 'github',
    'AIGOV_CI_CHECK_APP_MISMATCH',
  );
  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

  const completedAt = job.completed_at || check.completed_at || run.updated_at || null;
  const completedAtMs = p.dateParse(completedAt || '');
  add(
    diagnostics,
    !completedAt || !p.numberIsFinite(completedAtMs),
    'AIGOV_CI_COMPLETION_TIME_INVALID',
  );
  if (diagnostics.length) return { diagnostics: uniqueDiagnostics(diagnostics), evidence: null };

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
    completed_at: p.dateToISOString(new p.NativeDate(completedAtMs)),
  };
  descriptor.descriptor_digest = p.canonicalSha256(descriptor);
  return { diagnostics: [], evidence: freezeEvidence(descriptor, VERIFIED_RUNS) };
}

export function verifyRecoveryWorkflowDescriptorPayloads({
  source,
  repository,
  repositoryId,
  exactHeadSha,
  event,
  expected,
  runs,
  jobs,
  checkRuns,
  allRepositoryRuns = runs,
  expectedRunId = null,
  jobsRunId = null,
}) {
  if (!isVerifiedRecoveryWorkflowSource(source)
    || !p.setHas(WORKFLOW_POLICIES, expected)
    || source.repository !== repository
    || source.repository_id !== repositoryId
    || source.workflow_id !== expected?.workflowId
    || source.workflow_name !== expected?.name
    || source.workflow_path !== expected?.path
    || source.workflow_source_commit_sha !== exactHeadSha
    || event !== expected?.event) {
    return {
      diagnostics: ['AIGOV_RECOVERY_WORKFLOW_SOURCE_CAPABILITY_REQUIRED'],
      evidence: null,
    };
  }

  const verified = verifyWorkflowDescriptorPayloads({
    repository,
    repositoryId,
    exactHeadSha,
    event,
    expected,
    workflow: {
      id: source.workflow_id,
      name: source.workflow_name,
      path: source.workflow_path,
    },
    runs,
    jobs,
    checkRuns,
    allRepositoryRuns,
    expectedRunId,
    jobsRunId,
  });
  if (verified.diagnostics.length || !isVerifiedAuthoritativeRun(verified.evidence)) return verified;

  const descriptor = {
    ...verified.evidence,
    workflow_source_commit_sha: source.workflow_source_commit_sha,
    workflow_blob_sha: source.workflow_blob_sha,
    workflow_final_byte_sha256: source.workflow_final_byte_sha256,
    workflow_source_reference: source.workflow_source_reference,
    workflow_policy_id: source.workflow_policy_id,
    external_trust_authority: source.external_trust_authority,
  };
  delete descriptor.descriptor_digest;
  descriptor.descriptor_digest = p.canonicalSha256(descriptor);
  return { diagnostics: [], evidence: freezeEvidence(descriptor, VERIFIED_RUNS) };
}
