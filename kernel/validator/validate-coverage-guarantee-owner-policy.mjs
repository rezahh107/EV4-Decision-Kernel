#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import {
  existsSync,
  readFileSync,
  readdirSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import {
  adaptLegacyValidatorSource,
  buildTrustedWrapperRuntimeSource,
  currentWorkPackageFromRoadmap,
  impactIdentityCodes,
  resolveCoverageIdentityMode,
  selectCurrentImpactCarriers,
} from './coverage-work-package-id.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIR = dirname(fileURLToPath(import.meta.url));
const WRAPPER_REPOSITORY_PATH = 'kernel/validator/validate-coverage-guarantee.mjs';
const PRF010_REPOSITORY_PATH = 'kernel/validator/validate-coverage-guarantee-prf010.mjs';
const LEGACY_REPOSITORY_PATH = 'kernel/validator/validate-coverage-guarantee-legacy.mjs';
const PRF010 = join(DIR, 'validate-coverage-guarantee-prf010.mjs');
const LEGACY = join(DIR, 'validate-coverage-guarantee-legacy.mjs');
const RUNTIME_WRAPPER = join(DIR, '.validate-coverage-guarantee.runtime.mjs');
const RUNTIME_PRF010 = join(DIR, '.validate-coverage-guarantee-prf010.runtime.mjs');
const RUNTIME_LEGACY = join(DIR, '.validate-coverage-guarantee-legacy.runtime.mjs');
const CONTRACT_PATH = 'kernel/decision-governance/coverage-guarantee-contract.v1.json';
const NEXT_WORK_PATH = 'planning/NEXT_WORK.md';
const IMPACT_DIR = 'planning/coverage/impacts';
const TARGET_REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const PINNED_GENERATION_A_COMMIT = '435add8ee3f3274f781b6e391f11e3262e380c4e';
const REQUIRED_PROMOTION_PREDICATES = [
  'repository_evidence_capture_complete',
  'official_source_fingerprints_complete',
  'contradiction_review_complete',
  'independent_review_passed',
  'project_owner_governance_approval',
  'planning_memory_synchronized',
  'exact_head_validation_passed',
  'merged_pr_evidence_recorded',
  'post_merge_evidence_closure_accepted',
];
const REQUIRED_SENSITIVE_PATHS = [
  '.github/workflows/validate-mvk.yml',
  'package.json',
  'kernel/validator/validate-coverage-guarantee',
  'kernel/validator/coverage-work-package-id.mjs',
  'kernel/validator/validate-coverage-guarantee-owner-policy.mjs',
  'tools/test-coverage-impact-governance.mjs',
];

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function readJson(path) {
  return JSON.parse(read(path));
}

function changedPaths(baseSha) {
  if (!/^[0-9a-f]{40}$/.test(baseSha || '')) return [];
  return execFileSync('git', ['diff', '--name-only', `${baseSha}...HEAD`], {
    cwd: ROOT,
    encoding: 'utf8',
  }).split(/\r?\n/).map((value) => value.trim()).filter(Boolean).sort();
}

function matchesSensitive(path, patterns) {
  return patterns.some((pattern) => path === pattern || path.startsWith(pattern));
}

function fail(code, message) {
  console.error(`${code}: ${message}`);
  process.exit(1);
}

function parsePullRequestNumber(raw) {
  return /^[1-9][0-9]*$/.test(raw || '') ? Number.parseInt(raw, 10) : null;
}

function validatePolicyAndImpact() {
  const contract = readJson(CONTRACT_PATH);
  if (contract?.merge_gate?.exact_head_ci_green !== 'required'
    || contract?.merge_gate?.independent_pr_inspector_green !== 'optional_advisory'
    || contract?.merge_gate?.explicit_owner_merge_command !== 'required') {
    fail('COV_PREMERGE_REVIEW_POLICY_MISMATCH', 'Exact-head CI and explicit owner Merge must remain required while independent pre-Merge review is optional advisory.');
  }
  if (JSON.stringify(contract?.promotion_boundary?.required_predicates)
    !== JSON.stringify(REQUIRED_PROMOTION_PREDICATES)) {
    fail('COV_EXTERNAL_PROMOTION_BOUNDARY_MISSING', 'External Coverage promotion must retain independent_review_passed and every existing predicate.');
  }
  for (const path of REQUIRED_SENSITIVE_PATHS) {
    if (!contract.coverage_sensitive_paths?.includes(path)) {
      fail('COV_SENSITIVE_ENFORCEMENT_PATH_MISSING', `Coverage sensitivity is missing ${path}.`);
    }
  }

  const currentWorkPackage = currentWorkPackageFromRoadmap(join(ROOT, NEXT_WORK_PATH));
  if (!currentWorkPackage) {
    fail('COV_CURRENT_WORK_PACKAGE_ID_INVALID', 'NEXT_WORK must contain exactly one structured current_work_package_id.');
  }
  const repository = process.env.COVERAGE_REPOSITORY || TARGET_REPOSITORY;
  const pullRequest = parsePullRequestNumber(process.env.COVERAGE_PR_NUMBER || '');
  const identity = resolveCoverageIdentityMode(process.env.COVERAGE_IDENTITY_MODE || '', pullRequest);
  if (identity.diagnostic_code) {
    fail(identity.diagnostic_code, 'Coverage identity mode and pull-request identity are inconsistent or unavailable.');
  }
  const baseSha = process.env.COVERAGE_BASE_SHA || '';
  if (!/^[0-9a-f]{40}$/.test(baseSha)) {
    fail('COV_IMPACT_BASE_MISSING', 'Coverage validation requires an authoritative 40-character base SHA.');
  }
  const allChanged = changedPaths(baseSha);
  const sensitive = allChanged.filter((path) => matchesSensitive(path, contract.coverage_sensitive_paths));
  const allImpacts = readdirSync(join(ROOT, IMPACT_DIR))
    .filter((name) => name.endsWith('.json'))
    .map((name) => readJson(`${IMPACT_DIR}/${name}`));
  const selection = selectCurrentImpactCarriers(allImpacts, {
    identityMode: identity.mode,
    repository,
    pullRequest,
    baseSha,
    currentWorkPackage,
    sensitivePaths: sensitive,
  });
  if (selection.diagnostic_code) {
    const messages = {
      COV_IMPACT_CURRENT_PR_COUNT_INVALID: 'A sensitive PR requires exactly one current Coverage Impact carrier.',
      COV_IMPACT_POST_MERGE_NOT_FOUND: 'Post-merge Coverage identity found no Impact carrier matching repository, exact base, current work package, and exact sensitive changed paths.',
      COV_IMPACT_POST_MERGE_AMBIGUOUS: 'Post-merge Coverage identity found multiple Impact carriers matching repository, exact base, current work package, and exact sensitive changed paths.',
    };
    fail(selection.diagnostic_code, messages[selection.diagnostic_code] || 'Coverage Impact identity selection failed closed.');
  }
  const impacts = selection.matches;
  for (const impact of impacts) {
    const codes = impactIdentityCodes(impact, currentWorkPackage, sensitive);
    if (codes.length > 0) {
      fail(codes[0], 'Current Impact identity, work package, or changed_paths do not match the exact sensitive diff.');
    }
    if (impact.coverage_state_before !== impact.coverage_state_after
      || impact.element_coverage_delta !== null
      || impact.question_coverage_delta !== null
      || impact.completed_obligation_ids?.length !== 0
      || impact.closed_family_ids?.length !== 0) {
      fail('COV_MAINTENANCE_CREDIT_FORBIDDEN', 'Recovery maintenance may not create Coverage credit, promotion, percentage, or closed obligations.');
    }
  }

  const conflated = structuredClone(contract);
  conflated.promotion_boundary.required_predicates = conflated.promotion_boundary.required_predicates
    .filter((predicate) => predicate !== 'independent_review_passed');
  if (JSON.stringify(conflated.promotion_boundary.required_predicates)
    === JSON.stringify(REQUIRED_PROMOTION_PREDICATES)) {
    fail('COV_REVIEW_POLICY_CONFLATION_TEST_FAILED', 'Advisory pre-Merge review must not satisfy external Coverage promotion.');
  }
  console.log(JSON.stringify({
    identity_mode: identity.mode,
    pull_request: pullRequest,
    current_work_package_id: currentWorkPackage,
    current_impact_ids: impacts.map((impact) => impact.impact_id),
    sensitive_changed_paths: sensitive,
    premerge_review: 'optional_advisory',
    external_promotion_independent_review: 'required',
    coverage_credit_authorized: false,
  }, null, 2));
  return baseSha;
}

function replaceExactlyOnce(source, needle, replacement, code) {
  const first = source.indexOf(needle);
  if (first < 0 || source.indexOf(needle, first + needle.length) >= 0) {
    fail(code, 'Pinned validator source no longer matches the bounded adapter expectation.');
  }
  return source.replace(needle, replacement);
}

function cleanup() {
  for (const path of [RUNTIME_WRAPPER, RUNTIME_PRF010, RUNTIME_LEGACY]) {
    try { unlinkSync(path); } catch { /* absent */ }
  }
}

function repositorySourceAtCommit(commitSha, repositoryPath, code) {
  try {
    return execFileSync('git', ['show', `${commitSha}:${repositoryPath}`], {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  } catch {
    fail(code, `Pinned source ${repositoryPath} cannot be resolved from ${commitSha}.`);
  }
}

function prepareRuntime(baseSha) {
  cleanup();
  const legacySource = repositorySourceAtCommit(
    baseSha,
    LEGACY_REPOSITORY_PATH,
    'COV_TRUSTED_BASE_LEGACY_MISSING',
  );
  writeFileSync(RUNTIME_LEGACY, adaptLegacyValidatorSource(legacySource), 'utf8');
  const prf010Source = repositorySourceAtCommit(
    baseSha,
    PRF010_REPOSITORY_PATH,
    'COV_TRUSTED_BASE_PRF010_MISSING',
  );
  writeFileSync(RUNTIME_PRF010, replaceExactlyOnce(
    prf010Source,
    "'validate-coverage-guarantee-legacy.mjs'",
    "'.validate-coverage-guarantee-legacy.runtime.mjs'",
    'COV_PRF010_ADAPTER_SOURCE_MISMATCH',
  ), 'utf8');
  const baseWrapperSource = repositorySourceAtCommit(
    baseSha,
    WRAPPER_REPOSITORY_PATH,
    'COV_TRUSTED_BASE_WRAPPER_MISSING',
  );
  const pinnedGenerationASource = repositorySourceAtCommit(
    PINNED_GENERATION_A_COMMIT,
    WRAPPER_REPOSITORY_PATH,
    'COV_PINNED_TRUSTED_WRAPPER_MISSING',
  );
  let runtime;
  try {
    runtime = buildTrustedWrapperRuntimeSource(baseWrapperSource, pinnedGenerationASource);
  } catch (error) {
    fail(error.code || 'COV_TRUSTED_BASE_WRAPPER_ADAPTER_FAILED', error.message);
  }
  writeFileSync(RUNTIME_WRAPPER, runtime.source, 'utf8');
  return runtime.generation;
}

if (!existsSync(PRF010) || !existsSync(LEGACY)) {
  fail('COV_PRESERVED_VALIDATOR_MISSING', 'The PRF-010 gate and legacy validator are required.');
}

const baseSha = validatePolicyAndImpact();
const trustedWrapperGeneration = prepareRuntime(baseSha);
console.log(`Coverage trusted-base wrapper generation: ${trustedWrapperGeneration}`);
process.once('exit', cleanup);
try {
  await import(pathToFileURL(RUNTIME_WRAPPER).href);
} finally {
  cleanup();
}
