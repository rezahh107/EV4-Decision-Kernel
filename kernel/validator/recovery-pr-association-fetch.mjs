import { URL } from 'node:url';

const API_ORIGIN = 'https://api.github.com';

function headerValue(response, name) {
  const getter = response?.headers?.get;
  return typeof getter === 'function' ? getter.call(response.headers, name) : null;
}

function responseWithPayload(response, payload, responseDate) {
  return Object.freeze({
    ok: response?.ok === true,
    status: response?.status ?? 0,
    headers: Object.freeze({
      get(name) {
        return String(name).toLowerCase() === 'date'
          ? responseDate || headerValue(response, 'date')
          : headerValue(response, name);
      },
    }),
    json: async () => payload,
  });
}

function repositoryMatches(value, repository, repositoryId) {
  return value?.id === repositoryId && value?.full_name === repository;
}

function associationCandidateMatches(value, context) {
  return value?.head?.sha === context.reviewedHeadSha
    && value?.base?.ref === context.defaultBranch
    && repositoryMatches(value?.head?.repo, context.repository, context.repositoryId)
    && repositoryMatches(value?.base?.repo, context.repository, context.repositoryId);
}

function validDate(value) {
  const parsed = Date.parse(value || '');
  return Number.isFinite(parsed) ? parsed : null;
}

/**
 * Wrap the production GitHub transport with a bounded historical-PR fallback.
 * Direct run.pull_requests associations remain authoritative when present.
 * The fallback only materializes one exact association proven by the official
 * commit-to-pulls endpoint and never reads the current workflow PR identity.
 */
export function createRecoveryHistoricalPrAssociationFetch(fetchImpl, {
  repository,
  repositoryId,
  defaultBranch,
  task,
}) {
  if (typeof fetchImpl !== 'function') throw new TypeError('fetchImpl must be a function');
  const completion = task?.completion_evidence;
  const candidate = task?.candidate;
  const context = Object.freeze({
    repository,
    repositoryId,
    defaultBranch,
    pullRequest: completion?.pull_request,
    candidatePullRequest: candidate?.pull_request,
    reviewedHeadSha: completion?.reviewed_head_sha,
    exactHeadRunId: completion?.exact_head_ci?.run_id,
  });

  return async function recoveryHistoricalPrAssociationFetch(rawUrl, init = {}) {
    const response = await fetchImpl(rawUrl, init);
    const source = new URL(rawUrl);
    const expectedRunPath = `/repos/${context.repository}/actions/runs/${context.exactHeadRunId}`;
    if (source.origin !== API_ORIGIN || source.pathname !== expectedRunPath || source.search) {
      return response;
    }

    const run = await response.json();
    const direct = Array.isArray(run?.pull_requests) ? run.pull_requests : [];
    if (direct.length > 0) return responseWithPayload(response, run);

    const prerequisites = response?.ok === true
      && run?.id === context.exactHeadRunId
      && run?.event === 'pull_request'
      && run?.head_sha === context.reviewedHeadSha
      && Number.isInteger(context.pullRequest)
      && context.pullRequest === context.candidatePullRequest
      && typeof context.reviewedHeadSha === 'string';
    if (!prerequisites) return responseWithPayload(response, run);

    const associationUrl = `${API_ORIGIN}/repos/${context.repository}/commits/${encodeURIComponent(context.reviewedHeadSha)}/pulls?per_page=100`;
    const associationResponse = await fetchImpl(associationUrl, init);
    if (associationResponse?.ok !== true) return responseWithPayload(response, run);
    const associations = await associationResponse.json();
    const plausible = Array.isArray(associations)
      ? associations.filter((item) => associationCandidateMatches(item, context))
      : [];
    const match = plausible.length === 1 ? plausible[0] : null;
    if (!match || match.number !== context.pullRequest || match.state !== 'closed') {
      return responseWithPayload(response, run);
    }

    const runDate = validDate(headerValue(response, 'date'));
    const associationDate = validDate(headerValue(associationResponse, 'date'));
    if (runDate === null || associationDate === null) return responseWithPayload(response, run);
    const combinedDate = new Date(Math.min(runDate, associationDate)).toUTCString();
    const authoritativeAssociation = {
      number: match.number,
      head: {
        sha: match.head.sha,
        repo: { id: match.head.repo.id, full_name: match.head.repo.full_name },
      },
      base: {
        ref: match.base.ref,
        repo: { id: match.base.repo.id, full_name: match.base.repo.full_name },
      },
    };
    return responseWithPayload(
      response,
      { ...run, pull_requests: [authoritativeAssociation] },
      combinedDate,
    );
  };
}
