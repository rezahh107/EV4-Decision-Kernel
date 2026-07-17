#!/usr/bin/env node
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

export const CURRENT_WORK_PACKAGE_FIELD = 'current_work_package_id';
export const WORK_PACKAGE_ID_PATTERN = /^[A-Z0-9][A-Z0-9._-]*$/;
export const COVERAGE_IDENTITY_MODES = Object.freeze({
  PULL_REQUEST: 'pull_request',
  POST_MERGE: 'post_merge',
});
export const TRUSTED_WRAPPER_GENERATIONS = Object.freeze({
  EXTERNAL_AUTHORITY_V1: 'external_authority_v1',
  OWNER_POLICY_V1: 'owner_policy_v1',
});

const TRUSTED_WRAPPER_BLOB_SHA1 = Object.freeze({
  [TRUSTED_WRAPPER_GENERATIONS.EXTERNAL_AUTHORITY_V1]: 'a3f7a0519a790c4fb33615b22cd78b4a504e0130',
  [TRUSTED_WRAPPER_GENERATIONS.OWNER_POLICY_V1]: '237943fe60a6fdafa2cba96186f4d36b73732f0b',
});

export function parseCurrentWorkPackageId(text) {
  if (typeof text !== 'string') return null;
  const matches = [...text.matchAll(/^current_work_package_id:\s*([A-Z0-9][A-Z0-9._-]*)\s*$/gm)];
  if (matches.length !== 1) return null;
  return WORK_PACKAGE_ID_PATTERN.test(matches[0][1]) ? matches[0][1] : null;
}

export function currentWorkPackageFromRoadmap(path = 'planning/NEXT_WORK.md') {
  try {
    return parseCurrentWorkPackageId(readFileSync(path, 'utf8'));
  } catch {
    return null;
  }
}

export function impactWorkPackageToken(workPackageId) {
  return typeof workPackageId === 'string' && WORK_PACKAGE_ID_PATTERN.test(workPackageId)
    ? workPackageId.toLowerCase()
    : null;
}

export function canonicalPathSet(paths) {
  return [...new Set(Array.isArray(paths) ? paths : [])].sort();
}

export function exactPathSetMatches(actualPaths, expectedPaths) {
  const actual = canonicalPathSet(actualPaths);
  const expected = canonicalPathSet(expectedPaths);
  return JSON.stringify(actual) === JSON.stringify(expected)
    && (Array.isArray(actualPaths) ? actualPaths.length : 0) === expected.length;
}

export function impactIdentityCodes(impact, currentWorkPackage, sensitivePaths) {
  const codes = [];
  if (!impact || impact.work_package_id !== currentWorkPackage) {
    codes.push('COV_IMPACT_WORK_PACKAGE_MISMATCH');
  }
  const token = impactWorkPackageToken(impact?.work_package_id);
  if (!token || typeof impact?.impact_id !== 'string'
    || !impact.impact_id.includes(`.${token}.`)) {
    codes.push('COV_IMPACT_ID_MISMATCH');
  }
  if (!exactPathSetMatches(impact?.changed_paths, sensitivePaths)) {
    codes.push('COV_IMPACT_CHANGED_PATHS_MISMATCH');
  }
  return [...new Set(codes)];
}

export function resolveCoverageIdentityMode(explicitMode, pullRequest) {
  const hasPullRequest = Number.isInteger(pullRequest) && pullRequest > 0;
  const requestedMode = explicitMode || (hasPullRequest ? COVERAGE_IDENTITY_MODES.PULL_REQUEST : null);
  if (!Object.values(COVERAGE_IDENTITY_MODES).includes(requestedMode)) {
    return { mode: null, diagnostic_code: 'COV_IDENTITY_MODE_INVALID' };
  }
  if (requestedMode === COVERAGE_IDENTITY_MODES.PULL_REQUEST && !hasPullRequest) {
    return { mode: null, diagnostic_code: 'COV_PULL_REQUEST_NUMBER_MISSING' };
  }
  if (requestedMode === COVERAGE_IDENTITY_MODES.POST_MERGE && hasPullRequest) {
    return { mode: null, diagnostic_code: 'COV_POST_MERGE_PR_NUMBER_FORBIDDEN' };
  }
  return { mode: requestedMode, diagnostic_code: null };
}

export function selectCurrentImpactCarriers(impacts, context) {
  const source = Array.isArray(impacts) ? impacts : [];
  const sensitivePaths = canonicalPathSet(context?.sensitivePaths);
  if (sensitivePaths.length === 0) {
    return { matches: [], diagnostic_code: null };
  }
  const baseMatches = source.filter((impact) => impact?.repository === context.repository
    && impact?.base_sha === context.baseSha);
  if (context.identityMode === COVERAGE_IDENTITY_MODES.PULL_REQUEST) {
    const matches = baseMatches.filter((impact) => impact.pull_request === context.pullRequest);
    return {
      matches,
      diagnostic_code: matches.length === 1 ? null : 'COV_IMPACT_CURRENT_PR_COUNT_INVALID',
    };
  }
  if (context.identityMode === COVERAGE_IDENTITY_MODES.POST_MERGE) {
    const matches = baseMatches.filter((impact) => impact.work_package_id === context.currentWorkPackage
      && exactPathSetMatches(impact.changed_paths, sensitivePaths));
    return {
      matches,
      diagnostic_code: matches.length === 0
        ? 'COV_IMPACT_POST_MERGE_NOT_FOUND'
        : matches.length > 1
          ? 'COV_IMPACT_POST_MERGE_AMBIGUOUS'
          : null,
    };
  }
  return { matches: [], diagnostic_code: 'COV_IDENTITY_MODE_INVALID' };
}

function adapterError(code, label = '') {
  const error = new Error(`${code}${label ? `:${label}` : ''}`);
  error.code = code;
  return error;
}

function gitBlobSha1(source) {
  if (typeof source !== 'string') return null;
  const header = `blob ${Buffer.byteLength(source, 'utf8')}\0`;
  return createHash('sha1').update(header, 'utf8').update(source, 'utf8').digest('hex');
}

export function classifyTrustedWrapperSource(source) {
  const blobSha = gitBlobSha1(source);
  return Object.entries(TRUSTED_WRAPPER_BLOB_SHA1)
    .find(([, expected]) => expected === blobSha)?.[0] || null;
}

function replaceExactlyOnce(source, needle, replacement, code) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    throw adapterError(code);
  }
  return source.replace(needle, replacement);
}

export function buildTrustedWrapperRuntimeSource(baseWrapperSource, pinnedGenerationASource) {
  const generation = classifyTrustedWrapperSource(baseWrapperSource);
  if (!generation) {
    throw adapterError('COV_TRUSTED_BASE_WRAPPER_GENERATION_UNSUPPORTED');
  }
  let trustedSource = baseWrapperSource;
  if (generation === TRUSTED_WRAPPER_GENERATIONS.OWNER_POLICY_V1) {
    if (classifyTrustedWrapperSource(pinnedGenerationASource)
      !== TRUSTED_WRAPPER_GENERATIONS.EXTERNAL_AUTHORITY_V1) {
      throw adapterError('COV_PINNED_TRUSTED_WRAPPER_MISMATCH');
    }
    trustedSource = pinnedGenerationASource;
  }
  trustedSource = replaceExactlyOnce(
    trustedSource,
    "'validate-coverage-guarantee-prf010.mjs'",
    "'.validate-coverage-guarantee-prf010.runtime.mjs'",
    'COV_WRAPPER_PRF010_ADAPTER_SOURCE_MISMATCH',
  );
  trustedSource = replaceExactlyOnce(
    trustedSource,
    "'validate-coverage-guarantee-legacy.mjs'",
    "'.validate-coverage-guarantee-legacy.runtime.mjs'",
    'COV_WRAPPER_LEGACY_ADAPTER_SOURCE_MISMATCH',
  );
  if (trustedSource.includes('validate-coverage-guarantee-owner-policy.mjs')) {
    throw adapterError('COV_TRUSTED_BASE_WRAPPER_RECURSION_FORBIDDEN');
  }
  return { generation, source: trustedSource };
}

function replaceLegacyExactlyOnce(source, needle, replacement, label) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    throw new Error(`COV_LEGACY_ADAPTER_SOURCE_MISMATCH:${label}`);
  }
  return source.replace(needle, replacement);
}

export function adaptLegacyValidatorSource(source) {
  let adapted = source;
  adapted = replaceLegacyExactlyOnce(
    adapted,
`function currentWorkPackageFromRoadmap() {
  const match = readText('planning/NEXT_WORK.md')
    .match(/Current PR[\\s\\S]*?DCOV-EXEC-[0-9]{3}/);
  return match?.[0].match(/DCOV-EXEC-[0-9]{3}/)?.[0] || null;
}`,
`function currentWorkPackageFromRoadmap() {
  const nextWork = readText('planning/NEXT_WORK.md');
  const matches = [...nextWork.matchAll(/^current_work_package_id:\\s*([A-Z0-9][A-Z0-9._-]*)\\s*$/gm)];
  return matches.length === 1 ? matches[0][1] : null;
}`,
    'current_work_package_parser',
  );
  adapted = replaceLegacyExactlyOnce(
    adapted,
`const validZeroDelta = impact.work_type === 'blocking_defect'
        && impact.blocking_defect
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      if (!validZeroDelta) {
        diagnostics.push(diagnostic('COV_ZERO_DELTA_NOT_BLOCKING_DEFECT', 'Zero-delta coverage-sensitive work is limited to a blocking defect with a named next content package.', impact.impact_id));
      }`,
`const validBlockingDefect = impact.work_type === 'blocking_defect'
        && impact.blocking_defect
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      const validNonCoverageMaintenance = impact.work_type === 'maintenance'
        && impact.coverage_sensitive === false
        && impact.impact_classification === 'not_applicable'
        && impact.coverage_state_before === impact.coverage_state_after
        && impact.element_coverage_delta === null
        && impact.question_coverage_delta === null
        && (impact.completed_obligation_ids || []).length === 0
        && (impact.closed_family_ids || []).length === 0
        && impact.blocking_defect === null
        && typeof impact.next_content_expansion_package === 'string'
        && impact.next_content_expansion_package.length > 0;
      if (!validBlockingDefect && !validNonCoverageMaintenance) {
        diagnostics.push(diagnostic('COV_ZERO_DELTA_NOT_ALLOWED', 'Zero-delta work requires either a bounded blocking defect or non-Coverage maintenance that preserves state and grants no credit.', impact.impact_id));
      }`,
    'zero_delta_policy',
  );
  adapted = replaceLegacyExactlyOnce(
    adapted,
    'merge_gate_requirements: Object.keys(contract.merge_gate),',
    'merge_gate: contract.merge_gate,',
    'normative_merge_gate_projection',
  );
  return adapted;
}
