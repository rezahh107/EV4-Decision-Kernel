#!/usr/bin/env node
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';
import { parseDocument } from 'yaml';
import { canonical, validateLifecycleLedger } from '../../tools/lib/aigov-lifecycle.mjs';

const ROOT = process.cwd();
const POLICY_PATH = 'kernel/decision-governance/aigov-repository-policy.v1.json';
const POLICY_SCHEMA_PATH = 'kernel/schemas/aigov-repository-policy.v1.schema.json';
const SCOPE_PATH = 'planning/governance/scopes/aigov-v2-batch-a.scope.json';
const SCOPE_SCHEMA_PATH = 'kernel/schemas/aigov-scope-manifest.v1.schema.json';
const EVIDENCE_SCHEMA_PATH = 'kernel/schemas/aigov-evidence-manifest.v1.schema.json';
const EVIDENCE_PATH = 'planning/governance/evidence/aigov-v2-batch-a.evidence.json';
const REVIEW_SCHEMA_PATH = 'kernel/schemas/aigov-review-receipt.v1.schema.json';
const LEDGER_SCHEMA_PATH = 'kernel/schemas/aigov-lifecycle-ledger.v1.schema.json';
const FIXTURE_ROOT = 'kernel/fixtures/aigov';
const PLAN_ID = 'GOV-ADOPTION-EV4-DECISION-KERNEL-5FF5D7B-V2';
const BASE_SHA = '5ff5d7b20db11af36ab787eb8ac2d1127ea74644';
const REPOSITORY = 'rezahh107/EV4-Decision-Kernel';
const REPOSITORY_ID = 1292378784;
const PR_NUMBER = 49;
const EXPECTED_RULES = [
  'AIGOV-START-001', 'AIGOV-SCOPE-001', 'AIGOV-SCOPE-DISCLOSURE-001',
  'AIGOV-PROGRESS-001', 'AIGOV-EVIDENCE-001', 'AIGOV-INDEPENDENCE-001',
  'AIGOV-STALE-001', 'AIGOV-MERGE-001', 'AIGOV-CHANGE-CLASS-001',
  'AIGOV-EVIDENCE-PROPORTIONALITY-001', 'AIGOV-REPORTING-001',
  'AIGOV-SECURITY-PROFILE-001', 'AIGOV-HUMAN-001', 'AIGOV-COACH-001',
];
const REQUIRED_KROADS = ['KROAD-012', 'KROAD-013', 'KROAD-014', 'KROAD-015', 'KROAD-016', 'KROAD-017', 'KROAD-018'];
const CLASS_RANK = new Map(['L0', 'L1', 'L2', 'L3', 'L4'].map((value, index) => [value, index]));
const SECURITY_CARRIERS = {
  secret_change: ['implemented_detector', 'workflow_secret_expression_detector'],
  permission_change: ['implemented_detector', 'workflow_permission_semantic_diff'],
  ruleset_change: ['implemented_detector_and_external_evidence', 'repository_settings_mutation_detector'],
  branch_protection_change: ['implemented_detector_and_external_evidence', 'repository_settings_mutation_detector'],
  force_push: ['implemented_detector', 'force_push_command_detector'],
  history_rewrite: ['implemented_detector', 'history_rewrite_command_detector'],
  external_repository_write: ['implemented_detector', 'external_repository_write_detector'],
  broad_dependency_upgrade: ['implemented_detector', 'canonical_dependency_diff_detector'],
  destructive_deletion: ['implemented_detector', 'destructive_deletion_detector'],
  auto_merge: ['implemented_detector', 'merge_and_auto_merge_command_detector'],
};

const filePath = (value) => path.isAbsolute(value) ? value : path.join(ROOT, value);
const readJson = (relativePath) => JSON.parse(readFileSync(filePath(relativePath), 'utf8'));
const diagnostic = (code, message, source = 'repository') => ({ rule_id: code.split('_').slice(0, 2).join('-'), code, message, source });
const uniqueSorted = (values) => [...new Set(values)].sort();
const canonicalJson = (value) => JSON.stringify(canonical(value));

export function scopeRevision(scope) {
  const projection = structuredClone(scope);
  delete projection.scope_revision;
  return `sha256:${crypto.createHash('sha256').update(canonicalJson(projection)).digest('hex')}`;
}

function schemaDiagnostics(validator, value, label) {
  if (validator(value)) return [];
  return (validator.errors || []).map((error) => diagnostic('AIGOV_SCHEMA_INVALID', `${label}${error.instancePath || '/'} ${error.message}`, label));
}

export function validateBehaviorCase(testCase, policy) {
  const item = testCase.case || {};
  const diagnostics = [];
  if (!item.preflight_present) diagnostics.push(diagnostic('AIGOV_START_PREFLIGHT_MISSING', 'Repository/session preflight is required.', testCase.fixture_id));
  if (!item.head_identity_matches) diagnostics.push(diagnostic('AIGOV_HEAD_MISMATCH', 'Validated checkout does not match the expected exact head.', testCase.fixture_id));
  if (!item.scope_disclosure_matches) diagnostics.push(diagnostic('AIGOV_SCOPE_DISCLOSURE_MISMATCH', 'Computed scope disclosure does not match declared scope.', testCase.fixture_id));
  const missingDeferred = REQUIRED_KROADS.filter((id) => !(item.deferred_ids || []).includes(id));
  if (missingDeferred.length) diagnostics.push(diagnostic('AIGOV_DEFERRED_ITEM_DELETED', `Deferred items disappeared: ${missingDeferred.join(', ')}.`, testCase.fixture_id));
  if (!item.evidence_manifest_complete) diagnostics.push(diagnostic('AIGOV_EVIDENCE_INCOMPLETE', 'Evidence manifest is missing or incomplete.', testCase.fixture_id));
  if (item.completion?.state === 'completed' && item.completion?.exact_main_verified !== true) diagnostics.push(diagnostic('AIGOV_PREMAIN_COMPLETION_FORBIDDEN', 'Completion cannot be asserted before exact-main verification.', testCase.fixture_id));
  const review = item.review_receipt;
  if (review) {
    if (review.reviewer_identity === review.implementer_identity) diagnostics.push(diagnostic('AIGOV_REVIEW_NOT_INDEPENDENT', 'Reviewer and implementer identities must differ.', testCase.fixture_id));
    if (!review.head_matches) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_HEAD', 'Review receipt is bound to a stale head.', testCase.fixture_id));
    if (!review.scope_revision_matches) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_SCOPE', 'Review receipt is bound to a stale scope revision.', testCase.fixture_id));
  }
  if ((CLASS_RANK.get(item.declared_change_class) ?? -1) < (CLASS_RANK.get(item.required_change_class) ?? 99)) diagnostics.push(diagnostic('AIGOV_CHANGE_CLASS_UNDERSPECIFIED', 'Declared change class is below the deterministic minimum.', testCase.fixture_id));
  if ((item.verification_budget_executed ?? 0) < (item.verification_budget_required ?? 1)) diagnostics.push(diagnostic('AIGOV_VERIFICATION_BUDGET_INSUFFICIENT', 'Executed verification budget is below the required budget.', testCase.fixture_id));
  if ((item.reporting_budget_reported ?? 0) < (item.reporting_budget_required ?? 1) || item.material_failures_omitted) diagnostics.push(diagnostic('AIGOV_REPORTING_OMISSION', 'Reporting budget or material-failure disclosure is incomplete.', testCase.fixture_id));
  if ((item.security_changes || []).some((value) => Object.hasOwn(SECURITY_CARRIERS, value))) diagnostics.push(diagnostic('AIGOV_SECURITY_PROFILE_VIOLATION', 'Forbidden security or authority mutation requested.', testCase.fixture_id));
  if (item.human_technical_proof) diagnostics.push(diagnostic('AIGOV_HUMAN_TECHNICAL_PROOF_FORBIDDEN', 'Human approval cannot substitute for technical evidence.', testCase.fixture_id));
  if (item.coach_text_as_evidence) diagnostics.push(diagnostic('AIGOV_COACH_EVIDENCE_CONFUSION', 'Coaching text cannot be completion evidence.', testCase.fixture_id));
  if (item.coverage_status !== 'not_measurable_pending_external_promotion') diagnostics.push(diagnostic('AIGOV_COVERAGE_SELF_PROMOTION', 'Target-authored Coverage promotion is forbidden.', testCase.fixture_id));
  if (REQUIRED_KROADS.some((id) => !(item.kroad_ids || []).includes(id))) diagnostics.push(diagnostic('AIGOV_KROAD_PRESERVATION_FAILED', 'KROAD-012 through KROAD-018 must remain preserved.', testCase.fixture_id));
  const expectedOrder = policy.sequence.ordered_events;
  const events = item.events || [];
  if (events.some((event, index) => event !== expectedOrder[index])) diagnostics.push(diagnostic('AIGOV_SEQUENCE_INVALID', 'Cross-turn governance event order is invalid or skips a predecessor.', testCase.fixture_id));
  return diagnostics;
}

function fixturePaths() {
  const paths = [];
  for (const kind of ['valid', 'invalid', 'adversarial']) {
    const dir = path.join(ROOT, FIXTURE_ROOT, kind);
    for (const name of readdirSync(dir).filter((entry) => entry.endsWith('.json')).sort()) paths.push(`${FIXTURE_ROOT}/${kind}/${name}`);
  }
  return paths;
}

function validateFixtures(policy, selectedCase = null) {
  const diagnostics = [];
  const results = [];
  for (const fixturePath of fixturePaths()) {
    const fixture = readJson(fixturePath);
    if (selectedCase && !fixture.fixture_id.includes(selectedCase) && !fixturePath.includes(selectedCase)) continue;
    const observed = uniqueSorted(validateBehaviorCase(fixture, policy).map((item) => item.code));
    const expected = uniqueSorted(fixture.expected_diagnostics || []);
    const expectedValid = fixture.expected_valid === true;
    const actualValid = observed.length === 0;
    const matches = expectedValid === actualValid && canonicalJson(observed) === canonicalJson(expected);
    results.push({ fixture: fixturePath, expected_valid: expectedValid, actual_valid: actualValid, expected_diagnostics: expected, observed_diagnostics: observed, matches });
    if (!matches) diagnostics.push(diagnostic('AIGOV_FIXTURE_EXPECTATION_MISMATCH', `${fixturePath}: expected ${JSON.stringify(expected)}, observed ${JSON.stringify(observed)}.`, fixturePath));
  }
  if (selectedCase && results.length === 0) diagnostics.push(diagnostic('AIGOV_FIXTURE_NOT_FOUND', `No fixture matched ${selectedCase}.`, FIXTURE_ROOT));
  return { diagnostics, results };
}

function git(args, options = {}) {
  try {
    return execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], ...options }).trim();
  } catch {
    return '';
  }
}

function parseWorkflow(text, source) {
  const document = parseDocument(text, { prettyErrors: false, strict: true, uniqueKeys: true });
  if (document.errors.length) throw new Error(`${source}: ${document.errors.map((error) => error.message).join('; ')}`);
  return document.toJS({ mapAsMap: false });
}

function collectWorkflowValues(value, result = { uses: [], runs: [], scalarEntries: [] }, pathParts = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectWorkflowValues(item, result, [...pathParts, index]));
  } else if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      if (key === 'uses' && typeof child === 'string') result.uses.push(child);
      if (key === 'run' && typeof child === 'string') result.runs.push(child);
      if (typeof child === 'string') result.scalarEntries.push({ path: [...pathParts, key].join('.'), key, value: child });
      collectWorkflowValues(child, result, [...pathParts, key]);
    }
  }
  return result;
}

const permissionRank = (value) => ({ none: 0, read: 1, write: 2 }[value] ?? (value === 'read-all' ? 1 : value === 'write-all' ? 2 : -1));
function normalizePermissions(value) {
  if (value == null) return null;
  if (typeof value === 'string') return { '*': permissionRank(value) };
  if (typeof value !== 'object' || Array.isArray(value)) return { invalid: 99 };
  return Object.fromEntries(Object.entries(value).map(([key, permission]) => [key, permissionRank(permission)]));
}

export function permissionExpansions(baseValue, currentValue) {
  const base = normalizePermissions(baseValue);
  const current = normalizePermissions(currentValue);
  if (base === null || current === null) return [];
  const keys = new Set([...Object.keys(base), ...Object.keys(current)]);
  return [...keys].filter((key) => {
    const baseRank = base[key] ?? base['*'] ?? 0;
    const currentRank = current[key] ?? current['*'] ?? 0;
    return currentRank > baseRank;
  }).sort();
}

function effectiveWorkflowPermissions(workflow) {
  const result = [{ location: 'workflow', value: workflow?.permissions, explicit: workflow?.permissions != null }];
  for (const [jobName, job] of Object.entries(workflow?.jobs || {})) {
    result.push({ location: `jobs.${jobName}`, value: job?.permissions ?? workflow?.permissions, explicit: job?.permissions != null || workflow?.permissions != null });
  }
  return result;
}

function dangerousCommandDiagnostics(commands, source) {
  const diagnostics = [];
  const officialCoverageValidation = [
    'set -euo pipefail',
    'git reset --hard "${COVERAGE_HEAD_SHA}"',
    'git clean -ffdx',
    'test "$(git rev-parse HEAD)" = "${COVERAGE_HEAD_SHA}"',
    'test -z "$(git status --porcelain=v1 --untracked-files=all)"',
    'npm ci',
    'npm run validate:coverage',
  ].join('\n');
  const scanText = source === '.github/workflows/validate-mvk.yml' && commands.includes(officialCoverageValidation)
    ? commands.replace(officialCoverageValidation, officialCoverageValidation
      .replace('git reset --hard "${COVERAGE_HEAD_SHA}"\n', '')
      .replace('git clean -ffdx\n', ''))
    : commands;
  if (/\bgh\s+pr\s+merge\b|\bgh\s+api\b[^\n]*(?:\/merges|\/auto-merge)|enablePullRequestAutoMerge|\bgit\s+merge(?!-)\b/i.test(scanText)) diagnostics.push(diagnostic('AIGOV_MERGE_COMMAND_FORBIDDEN', 'Executable path contains a merge or auto-merge command.', source));
  if (/\bgit\s+push\b[^\n]*(?:--force(?:-with-lease)?|-f\b)/i.test(scanText)) diagnostics.push(diagnostic('AIGOV_FORCE_PUSH_FORBIDDEN', 'Executable path contains a force-push command.', source));
  if (/\bgit\s+(?:rebase|filter-branch|filter-repo)\b|\bgit\s+commit\b[^\n]*--amend|\bgit\s+update-ref\b|\bgit\s+reflog\s+expire\b|\bgit\s+reset\b[^\n]*--hard/i.test(scanText)) diagnostics.push(diagnostic('AIGOV_HISTORY_REWRITE_FORBIDDEN', 'Executable path contains a history-rewrite command.', source));
  if (/(?:\bgh\s+api\b|\bcurl\b)[^\n]*(?:--method\s+(?:POST|PUT|PATCH|DELETE)|-X\s*(?:POST|PUT|PATCH|DELETE))[^\n]*(?:\/rulesets|\/branches\/[^\s]+\/protection|\/actions\/permissions)/i.test(scanText)) diagnostics.push(diagnostic('AIGOV_REPOSITORY_SETTINGS_MUTATION_FORBIDDEN', 'Executable path contains a repository-settings or branch-protection mutation.', source));
  if (/\bgit\s+push\b|\bgh\s+(?:pr|repo|release)\s+(?:create|edit|close|merge|delete)\b|\bgh\s+api\b[^\n]*(?:--method\s+(?:POST|PUT|PATCH|DELETE)|-X\s*(?:POST|PUT|PATCH|DELETE))|\bcurl\b[^\n]*-X\s*(?:POST|PUT|PATCH|DELETE)/i.test(scanText)) diagnostics.push(diagnostic('AIGOV_EXTERNAL_REPOSITORY_WRITE_FORBIDDEN', 'Executable repository write target cannot be proven in-bounds.', source));
  if (/\brm\s+-[^\n]*r[^\n]*f|\bgit\s+rm\b|\bgit\s+clean\b[^\n]*-[^\n]*[fd]|\bfind\b[^\n]*-delete\b|\bgh\s+api\b[^\n]*(?:--method\s+DELETE|-X\s*DELETE)/i.test(scanText)) diagnostics.push(diagnostic('AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN', 'Executable path contains destructive deletion.', source));
  if (/\b(?:npm|pnpm|yarn)\s+(?:update|upgrade|up)\b|\bnpm\s+audit\s+fix\b[^\n]*--force|\bnpx\s+npm-check-updates\b[^\n]*-u\b/i.test(scanText)) diagnostics.push(diagnostic('AIGOV_BROAD_DEPENDENCY_UPGRADE_FORBIDDEN', 'Executable path contains a broad dependency-upgrade command.', source));
  return diagnostics;
}

function maskJavascript(text) {
    const chars = [...text];
    let quote = null;
    let lineComment = false;
    let blockComment = false;
    let escaped = false;
    for (let index = 0; index < chars.length; index += 1) {
      const char = chars[index];
      const next = chars[index + 1];
      if (lineComment) { if (char === '\n') lineComment = false; else chars[index] = ' '; continue; }
      if (blockComment) { chars[index] = char === '\n' ? '\n' : ' '; if (char === '*' && next === '/') { chars[index + 1] = ' '; blockComment = false; index += 1; } continue; }
      if (quote) {
        chars[index] = char === '\n' ? '\n' : ' ';
        if (escaped) escaped = false;
        else if (char === '\\') escaped = true;
        else if (char === quote) quote = null;
        continue;
      }
      if (char === '/' && next === '/') { chars[index] = chars[index + 1] = ' '; lineComment = true; index += 1; continue; }
      if (char === '/' && next === '*') { chars[index] = chars[index + 1] = ' '; blockComment = true; index += 1; continue; }
      if (char === '\'' || char === '"' || char === '`') { quote = char; chars[index] = ' '; }
    }
    return chars.join('');
}

function javascriptOperationDiagnostics(text, source) {
  const diagnostics = [];
  const mask = maskJavascript(text);
  const callSlices = (pattern) => {
    const slices = [];
    for (const match of mask.matchAll(pattern)) {
      const start = match.index;
      const open = mask.indexOf('(', start);
      if (open < 0) continue;
      let depth = 0;
      let end = open;
      for (; end < mask.length; end += 1) {
        if (mask[end] === '(') depth += 1;
        else if (mask[end] === ')' && --depth === 0) { end += 1; break; }
      }
      slices.push(text.slice(start, end));
    }
    return slices;
  };
  const childCalls = callSlices(/\b(?:exec|execSync|execFile|execFileSync|spawn|spawnSync)\s*\(/g);
  diagnostics.push(...dangerousCommandDiagnostics(childCalls.join('\n'), source));
  const apiCalls = callSlices(/\b(?:fetch|https\.request|request|octokit\.request|github\.request)\s*\(/gi);
  const apiText = apiCalls.join('\n');
  const mutatingMethod = /\b(?:method\s*:\s*['"](?:POST|PUT|PATCH|DELETE)['"]|['"](?:POST|PUT|PATCH|DELETE)\s+\/repos\/|\.request\s*\(\s*['"](?:POST|PUT|PATCH|DELETE))/i.test(apiText);
  const githubMutationApi = apiCalls.length > 0 && mutatingMethod;
  const repositoryEndpoint = /\/repos\/(?:[A-Za-z0-9_.-]+|\$\{[^}]+\})\/(?:[A-Za-z0-9_.-]+|\$\{[^}]+\})/i.test(text);
  const settingsEndpoint = /\/(?:rulesets|branches\/(?:[^\s'"`]+|\$\{[^}]+\})\/protection|actions\/permissions)\b/i.test(text);
  const mergeEndpoint = /enablePullRequestAutoMerge|\/(?:merges|auto-merge)\b|\.merge\s*\(/i.test(text);
  if (githubMutationApi && settingsEndpoint) diagnostics.push(diagnostic('AIGOV_REPOSITORY_SETTINGS_MUTATION_FORBIDDEN', 'Local JavaScript performs a GitHub settings mutation.', source));
  if (githubMutationApi && repositoryEndpoint) diagnostics.push(diagnostic('AIGOV_EXTERNAL_REPOSITORY_WRITE_FORBIDDEN', 'Local JavaScript performs a repository write whose target cannot be proven in-bounds.', source));
  if (githubMutationApi && mergeEndpoint) diagnostics.push(diagnostic('AIGOV_MERGE_COMMAND_FORBIDDEN', 'Local JavaScript performs a merge or auto-merge mutation.', source));
  if (/\boctokit\.(?:rest\.)?repos\.(?:update|create|delete|replace|add|remove)|\bgithub\.rest\.repos\.(?:update|create|delete|replace|add|remove)/i.test(mask)) diagnostics.push(diagnostic('AIGOV_EXTERNAL_REPOSITORY_WRITE_FORBIDDEN', 'Local JavaScript invokes a mutating Octokit repository method.', source));
  if (/\b(?:eval|Function)\s*\(/i.test(mask) || childCalls.some((call) => /\(\s*(?:process\.(?:env|argv)|[`'"]?\$\{)/i.test(call)) || (githubMutationApi && /\b(?:fetch|request)\s*\(\s*[A-Za-z_$]/i.test(apiText))) diagnostics.push(diagnostic('AIGOV_DYNAMIC_EXECUTION_UNRESOLVED', 'Reachable local JavaScript contains an unresolved dynamic execution path.', source));
  return diagnostics;
}

function shellInvocations(command) {
  const paths = [];
  for (const match of command.matchAll(/(?:^|[;&|\n]\s*|\b)(?:node|bash|sh|python3?|ruby)\s+(?:--?[^\s]+\s+)*([A-Za-z0-9_./-]+(?:\.(?:mjs|cjs|js|sh|py|rb)))/g)) paths.push(match[1]);
  for (const match of command.matchAll(/(?:^|[;&|\n]\s*)(\.\/[A-Za-z0-9_./-]+)/g)) paths.push(match[1]);
  for (const match of command.matchAll(/(?:^|[;&|\n]\s*)(?:source|\.)\s+([A-Za-z0-9_./-]+)/g)) paths.push(match[1]);
  return uniqueSorted(paths);
}

function npmInvocations(command) {
  return [...command.matchAll(/\bnpm\s+run\s+([A-Za-z0-9:_.-]+)/g)].map((match) => match[1]);
}

function reachableScriptDiagnostics(workflow, source, readRepositoryFile) {
  if (!readRepositoryFile) return [];
  const diagnostics = [];
  const visitedFiles = new Set();
  const visitedScripts = new Set();
  let packageScripts = null;
  try { packageScripts = JSON.parse(readRepositoryFile('package.json') || '{}').scripts || {}; } catch { diagnostics.push(diagnostic('AIGOV_LOCAL_SCRIPT_UNRESOLVED', 'package.json could not be parsed for workflow script reachability.', source)); }

  const scanCommand = (command, commandSource) => {
    diagnostics.push(...dangerousCommandDiagnostics(command, commandSource));
    if (/\beval\b|\b(?:bash|sh)\s+-c\s+["']?\$|\b(?:node|bash|sh|python3?)\s+["']?\$/.test(command)) diagnostics.push(diagnostic('AIGOV_DYNAMIC_EXECUTION_UNRESOLVED', 'Reachable shell command contains unresolved dynamic execution.', commandSource));
    for (const scriptName of npmInvocations(command)) {
      if (visitedScripts.has(scriptName)) continue;
      visitedScripts.add(scriptName);
      const script = packageScripts?.[scriptName];
      if (typeof script !== 'string') diagnostics.push(diagnostic('AIGOV_LOCAL_SCRIPT_UNRESOLVED', `npm script ${scriptName} cannot be resolved.`, commandSource));
      else scanCommand(script, `package.json#scripts.${scriptName}`);
    }
    for (const relative of shellInvocations(command)) scanFile(relative, commandSource);
  };

  const scanAction = (relative, parentSource) => {
    const root = relative.replace(/^\.\//, '').replace(/\/$/, '');
    const actionPath = [`${root}/action.yml`, `${root}/action.yaml`].find((candidate) => readRepositoryFile(candidate) != null);
    if (!actionPath) { diagnostics.push(diagnostic('AIGOV_LOCAL_ACTION_UNRESOLVED', `Local action ${relative} has no resolvable action.yml/action.yaml.`, parentSource)); return; }
    let action;
    try { action = parseWorkflow(readRepositoryFile(actionPath), actionPath); } catch (error) { diagnostics.push(diagnostic('AIGOV_LOCAL_ACTION_UNRESOLVED', error.message, actionPath)); return; }
    if (action.runs?.using === 'composite') {
      for (const step of action.runs.steps || []) {
        if (typeof step.run === 'string') scanCommand(step.run, actionPath);
        if (typeof step.uses === 'string' && step.uses.startsWith('./')) scanAction(path.posix.join(root, step.uses), actionPath);
      }
    } else {
      for (const field of ['pre', 'main', 'post']) if (typeof action.runs?.[field] === 'string') scanFile(path.posix.join(root, action.runs[field]), actionPath);
    }
  };

  const scanFile = (relative, parentSource) => {
    const normalized = path.posix.normalize(relative.replace(/^\.\//, ''));
    if (normalized.startsWith('../') || path.posix.isAbsolute(normalized)) { diagnostics.push(diagnostic('AIGOV_LOCAL_SCRIPT_UNRESOLVED', `Local script escapes repository: ${relative}.`, parentSource)); return; }
    if (visitedFiles.has(normalized)) return;
    visitedFiles.add(normalized);
    const text = readRepositoryFile(normalized);
    if (typeof text !== 'string') { diagnostics.push(diagnostic('AIGOV_LOCAL_SCRIPT_UNRESOLVED', `Local script cannot be resolved: ${normalized}.`, parentSource)); return; }
    if (/\.(?:mjs|cjs|js)$/.test(normalized)) {
      diagnostics.push(...javascriptOperationDiagnostics(text, normalized));
      const codeMask = maskJavascript(text);
      for (const match of text.matchAll(/(?:\bimport(?:[\s\S]*?\bfrom)?|\brequire\s*\()\s*['"](\.{1,2}\/[A-Za-z0-9_./-]+)['"]/g)) {
        if (codeMask.slice(match.index, match.index + 6).trim() === '') continue;
        const candidate = path.posix.normalize(path.posix.join(path.posix.dirname(normalized), match[1]));
        const resolved = [candidate, `${candidate}.mjs`, `${candidate}.js`, `${candidate}.cjs`, `${candidate}/index.mjs`, `${candidate}/index.js`].find((item) => readRepositoryFile(item) != null);
        if (!resolved) diagnostics.push(diagnostic('AIGOV_LOCAL_SCRIPT_UNRESOLVED', `Static local import cannot be resolved: ${match[1]}.`, normalized));
        else scanFile(resolved, normalized);
      }
    } else scanCommand(text, normalized);
  };

  const values = collectWorkflowValues(workflow);
  for (const command of values.runs) scanCommand(command, source);
  for (const target of values.uses.filter((item) => item.startsWith('./'))) scanAction(target, source);
  return diagnostics;
}

export function classifyDependencyChange(basePackage, currentPackage) {
  const sections = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];
  const changed = [];
  const added = [];
  const removed = [];
  for (const section of sections) {
    const base = basePackage?.[section] || {};
    const current = currentPackage?.[section] || {};
    for (const name of new Set([...Object.keys(base), ...Object.keys(current)])) {
      if (!(name in base)) added.push(`${section}:${name}@${current[name]}`);
      else if (!(name in current)) removed.push(`${section}:${name}@${base[name]}`);
      else if (canonicalJson(base[name]) !== canonicalJson(current[name])) changed.push(`${section}:${name}:${base[name]}->${current[name]}`);
    }
  }
  return {
    identical: canonicalJson(Object.fromEntries(sections.map((key) => [key, basePackage?.[key] || {}]))) === canonicalJson(Object.fromEntries(sections.map((key) => [key, currentPackage?.[key] || {}]))),
    broad: changed.length > 0 || removed.length > 0 || added.length > 1,
    added: added.sort(),
    changed: changed.sort(),
    removed: removed.sort(),
  };
}

export function analyzeWorkflowYaml(currentText, { source = 'workflow.yml', baseText = null, readRepositoryFile = null } = {}) {
  const diagnostics = [];
  let current;
  try {
    current = parseWorkflow(currentText, source);
  } catch (error) {
    return [diagnostic('AIGOV_WORKFLOW_YAML_INVALID', error.message, source)];
  }
  const values = collectWorkflowValues(current);
  for (const target of values.uses) {
    if (!target.startsWith('./') && !target.startsWith('docker://') && !/@[0-9a-fA-F]{40}$/.test(target)) diagnostics.push(diagnostic('AIGOV_ACTION_NOT_IMMUTABLY_PINNED', `Workflow action is not pinned by a 40-character SHA: ${target}.`, source));
  }
  const commands = values.runs.join('\n');
  diagnostics.push(...dangerousCommandDiagnostics(commands, source));
  for (const entry of values.scalarEntries) {
    if (/\$\{\{\s*secrets\.[A-Za-z_][A-Za-z0-9_]*\s*\}\}|\$\{\{\s*github\.token\s*\}\}/i.test(entry.value)) diagnostics.push(diagnostic('AIGOV_SECRET_ACCESS_FORBIDDEN', `Workflow accesses a credential at ${entry.path}.`, source));
  }
  diagnostics.push(...reachableScriptDiagnostics(current, source, readRepositoryFile));

  if (baseText != null) {
    let base;
    try {
      base = parseWorkflow(baseText, `${source}@base`);
    } catch (error) {
      diagnostics.push(diagnostic('AIGOV_WORKFLOW_BASE_YAML_INVALID', error.message, source));
      return diagnostics;
    }
    const basePermissions = new Map(effectiveWorkflowPermissions(base).map((item) => [item.location, item]));
    for (const currentPermission of effectiveWorkflowPermissions(current)) {
      if (!currentPermission.explicit || currentPermission.value == null) diagnostics.push(diagnostic('AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN', `Effective permission boundary at ${currentPermission.location} is inherited from an unproven default.`, source));
      const basePermission = basePermissions.get(currentPermission.location);
      if (!basePermission && currentPermission.location !== 'workflow') diagnostics.push(diagnostic('AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN', `No base permission boundary exists for ${currentPermission.location}.`, source));
      const expansions = permissionExpansions(basePermission?.value, currentPermission.value);
      if (expansions.length) diagnostics.push(diagnostic('AIGOV_WORKFLOW_PERMISSION_EXPANSION', `Permission expansion at ${currentPermission.location}: ${expansions.join(', ')}.`, source));
    }
    const baseWorkflowPermission = basePermissions.get('workflow')?.value;
    if (baseWorkflowPermission != null && current?.permissions == null) diagnostics.push(diagnostic('AIGOV_WORKFLOW_PERMISSION_BOUNDARY_UNKNOWN', 'An explicit workflow permission boundary was removed.', source));
  }
  return diagnostics;
}

function securityCarrierDiagnostics(policy) {
  const diagnostics = [];
  const declared = new Map((policy.security_profile.enforcement_carriers || []).map((item) => [item.forbidden_change, item]));
  for (const forbiddenChange of policy.security_profile.forbidden_changes) {
    const expected = SECURITY_CARRIERS[forbiddenChange];
    const carrier = declared.get(forbiddenChange);
    if (!expected || !carrier) diagnostics.push(diagnostic('AIGOV_SECURITY_CARRIER_MISSING', `${forbiddenChange} has no implemented or explicitly external enforcement carrier.`, POLICY_PATH));
    else if (carrier.classification !== expected[0] || carrier.carrier !== expected[1]) diagnostics.push(diagnostic('AIGOV_SECURITY_CARRIER_MISMATCH', `${forbiddenChange} is not aligned with its deterministic enforcement carrier.`, POLICY_PATH));
    if (carrier?.classification === 'unsupported_not_enforced') diagnostics.push(diagnostic('AIGOV_SECURITY_CARRIER_UNSUPPORTED', `${forbiddenChange} is honestly unsupported and therefore cannot pass repository validation.`, POLICY_PATH));
  }
  for (const forbiddenChange of declared.keys()) if (!policy.security_profile.forbidden_changes.includes(forbiddenChange)) diagnostics.push(diagnostic('AIGOV_SECURITY_CARRIER_ORPHANED', `${forbiddenChange} has a carrier but is absent from forbidden_changes.`, POLICY_PATH));
  if (policy.security_profile.repository_settings_enforcement !== 'external_evidence_required_not_proven') diagnostics.push(diagnostic('AIGOV_REPOSITORY_SETTINGS_OVERCLAIM', 'Repository settings enforcement cannot be claimed without fresh authoritative settings evidence.', POLICY_PATH));
  return diagnostics;
}

function workflowSecurityDiagnostics(policy) {
  const diagnostics = [...securityCarrierDiagnostics(policy)];
  const workflowDir = path.join(ROOT, '.github/workflows');
  const readRepositoryFile = (relativePath) => {
    const normalized = path.posix.normalize(relativePath.replace(/^\.\//, ''));
    if (normalized.startsWith('../') || path.posix.isAbsolute(normalized)) return null;
    const absolute = path.join(ROOT, normalized);
    return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null;
  };
  for (const name of readdirSync(workflowDir).filter((entry) => /\.ya?ml$/.test(entry)).sort()) {
    const relativePath = `.github/workflows/${name}`;
    const currentText = readFileSync(path.join(ROOT, relativePath), 'utf8');
    const baseText = git(['show', `${BASE_SHA}:${relativePath}`]) || null;
    diagnostics.push(...analyzeWorkflowYaml(currentText, { source: relativePath, baseText, readRepositoryFile }));
  }
  const basePackageRaw = git(['show', `${BASE_SHA}:package.json`]);
  if (basePackageRaw) {
    const dependencyChange = classifyDependencyChange(JSON.parse(basePackageRaw), readJson('package.json'));
    if (dependencyChange.broad) diagnostics.push(diagnostic('AIGOV_BROAD_DEPENDENCY_UPGRADE_FORBIDDEN', `Broad dependency mutation detected: ${JSON.stringify(dependencyChange)}.`, 'package.json'));
  }
  const deleted = git(['diff', '--name-only', '--diff-filter=D', BASE_SHA]).split('\n').filter(Boolean);
  if (deleted.length) diagnostics.push(diagnostic('AIGOV_DESTRUCTIVE_DELETION_FORBIDDEN', `Batch A must not delete repository files: ${deleted.join(', ')}.`, 'git_diff'));
  return diagnostics;
}

function repositoryStateDiagnostics(policy, scope) {
  const diagnostics = [];
  const nextWork = readFileSync(path.join(ROOT, 'planning/NEXT_WORK.md'), 'utf8');
  const decision = readFileSync(path.join(ROOT, 'planning/decisions/AIGOV_ADOPTION_DECISION.md'), 'utf8');
  const audit = readFileSync(path.join(ROOT, 'planning/reviews/AIGOV_ADOPTION_AUDIT.md'), 'utf8');
  const kroadReview = readFileSync(path.join(ROOT, 'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md'), 'utf8');
  if (!nextWork.includes('Repository adoption status: `blocked_open_enforcement_gaps`')) diagnostics.push(diagnostic('AIGOV_PREMAIN_COMPLETION_FORBIDDEN', 'Repository adoption must remain blocked before Batch A exact-main verification.', 'planning/NEXT_WORK.md'));
  for (const token of ['Active batch: `BATCH_A`', 'AIGOV-ADOPT-000: `merged_pending_batch_a_reconciliation`', 'AIGOV-ADOPT-001 through AIGOV-ADOPT-007: `in_batch_a_implementation`', 'AIGOV-ADOPT-008: `blocked_pending_batch_a_exact_main`', 'Coverage proposal state: `not_measurable_pending_external_promotion`']) if (!nextWork.includes(token)) diagnostics.push(diagnostic('AIGOV_PROGRESS_STATE_MISMATCH', `Required Batch A status is missing: ${token}.`, 'planning/NEXT_WORK.md'));
  for (const id of REQUIRED_KROADS) if (!nextWork.includes(id)) diagnostics.push(diagnostic('AIGOV_KROAD_PRESERVATION_FAILED', `${id} is absent from current roadmap memory.`, 'planning/NEXT_WORK.md'));
  if (!kroadReview.includes('historical_non_authoritative')) diagnostics.push(diagnostic('AIGOV_KROAD_012R_AUTHORITY_VIOLATION', 'KROAD-012R must remain historical_non_authoritative.', 'planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md'));
  if (!decision.includes(`plan_id: ${PLAN_ID}`) || !audit.includes(`plan_id: ${PLAN_ID}`)) diagnostics.push(diagnostic('AIGOV_PLAN_IDENTITY_MISMATCH', 'Decision and audit must bind the frozen V2 plan.', 'planning'));
  if (scope.scope_revision !== scopeRevision(scope)) diagnostics.push(diagnostic('AIGOV_SCOPE_REVISION_MISMATCH', `scope_revision must equal ${scopeRevision(scope)}.`, SCOPE_PATH));
  const policyRules = uniqueSorted(policy.rules.map((item) => item.rule_id));
  if (canonicalJson(policyRules) !== canonicalJson(uniqueSorted(EXPECTED_RULES))) diagnostics.push(diagnostic('AIGOV_POLICY_RULE_SET_INCOMPLETE', 'Policy must contain exactly the fourteen required AIGOV rules.', POLICY_PATH));
  if (canonicalJson(policy.roadmap_preservation.original_kroad_ids) !== canonicalJson(REQUIRED_KROADS)) diagnostics.push(diagnostic('AIGOV_KROAD_PRESERVATION_FAILED', 'Policy KROAD preservation set is not exact.', POLICY_PATH));
  return diagnostics;
}

export function evidenceManifestDiagnostics(evidence, policy, scope, { expectedHead = null, requireExecutedBudget = false } = {}) {
  const diagnostics = [];
  const classPolicy = policy.change_classes.find((item) => item.id === evidence.change_class);
  const minimumVerification = classPolicy?.minimum_verification_budget ?? Number.POSITIVE_INFINITY;
  const minimumReporting = classPolicy?.minimum_reporting_budget ?? Number.POSITIVE_INFINITY;
  const itemIds = evidence.evidence_items.map((item) => item.evidence_id);
  if (new Set(itemIds).size !== itemIds.length) diagnostics.push(diagnostic('AIGOV_EVIDENCE_DUPLICATE_ID', 'Evidence item IDs must be unique.', EVIDENCE_PATH));
  if (evidence.scope_revision !== scope.scope_revision || evidence.evidence_items.some((item) => item.scope_revision !== scope.scope_revision)) diagnostics.push(diagnostic('AIGOV_EVIDENCE_SCOPE_MISMATCH', 'Every evidence item must bind the exact scope revision.', EVIDENCE_PATH));
  if (evidence.repository !== REPOSITORY || evidence.repository_id !== REPOSITORY_ID || evidence.pr_number !== PR_NUMBER || evidence.base_sha !== BASE_SHA) diagnostics.push(diagnostic('AIGOV_EVIDENCE_IDENTITY_MISMATCH', 'Evidence manifest repository, PR or base identity is not exact.', EVIDENCE_PATH));
  if (evidence.verification_budget.required_checks < minimumVerification) diagnostics.push(diagnostic('AIGOV_VERIFICATION_BUDGET_INSUFFICIENT', `Change class ${evidence.change_class} requires at least ${minimumVerification} checks.`, EVIDENCE_PATH));
  if (evidence.reporting_budget.required_sections < minimumReporting || evidence.reporting_budget.reported_sections < minimumReporting) diagnostics.push(diagnostic('AIGOV_REPORTING_OMISSION', `Change class ${evidence.change_class} requires at least ${minimumReporting} reporting sections.`, EVIDENCE_PATH));
  const executedItems = evidence.evidence_items.filter((item) => ['validation', 'scope_disclosure'].includes(item.kind) && ['passed', 'failed'].includes(item.status));
  if (evidence.verification_budget.executed_checks !== executedItems.length) diagnostics.push(diagnostic('AIGOV_EVIDENCE_BUDGET_COUNT_MISMATCH', 'executed_checks must equal executed validation and scope evidence items.', EVIDENCE_PATH));
  for (const item of evidence.evidence_items) {
    if (item.head_sha !== evidence.head_sha) diagnostics.push(diagnostic('AIGOV_EVIDENCE_HEAD_MISMATCH', `${item.evidence_id} is not bound to the manifest head.`, EVIDENCE_PATH));
    if (item.status === 'passed' && (!item.sha256 || !item.authoritative_reference)) diagnostics.push(diagnostic('AIGOV_PASSED_EVIDENCE_UNHASHED', `${item.evidence_id} passed without a hash and stable reference.`, EVIDENCE_PATH));
    if (item.evidence_source === 'github_actions' && item.status === 'passed' && !item.github_actions) diagnostics.push(diagnostic('AIGOV_GITHUB_ACTIONS_IDENTITY_MISSING', `${item.evidence_id} lacks workflow/run/job/check/artifact identity.`, EVIDENCE_PATH));
  }
  const externalKinds = ['independent_review', 'owner_merge', 'exact_main_receipt'];
  if (evidence.evidence_items.some((item) => externalKinds.includes(item.kind) && item.status !== 'pending')) diagnostics.push(diagnostic('AIGOV_EXTERNAL_GATE_PREMATURE', 'Independent review, owner Merge and exact-main items must remain pending on the PR head.', EVIDENCE_PATH));
  if (evidence.completion_receipt.exact_main_verified || evidence.completion_receipt.state !== 'pending_exact_main_verification') diagnostics.push(diagnostic('AIGOV_PREMAIN_COMPLETION_FORBIDDEN', 'Batch A evidence must remain pending exact-main verification on the PR head.', EVIDENCE_PATH));
  if (evidence.manifest_state === 'template_pending_execution') {
    if (evidence.head_sha !== 'derived_at_runtime' || evidence.generated_at !== null || evidence.verification_budget.executed_checks !== 0 || executedItems.length) diagnostics.push(diagnostic('AIGOV_EVIDENCE_TEMPLATE_INVALID', 'Committed evidence template must remain unexecuted and runtime-bound.', EVIDENCE_PATH));
    if (evidence.evidence_items.filter((item) => ['validation', 'scope_disclosure'].includes(item.kind)).length < minimumVerification) diagnostics.push(diagnostic('AIGOV_EVIDENCE_ITEM_BUDGET_INCOMPLETE', 'Evidence template does not define enough stable verification items.', EVIDENCE_PATH));
    if (requireExecutedBudget) diagnostics.push(diagnostic('AIGOV_EXECUTED_EVIDENCE_REQUIRED', 'An executed exact-head evidence manifest is required.', EVIDENCE_PATH));
  } else if (['executed_exact_head', 'executed_exact_head_ci_verified'].includes(evidence.manifest_state)) {
    if (!/^[0-9a-f]{40}$/.test(evidence.head_sha) || evidence.head_sha !== expectedHead || !evidence.generated_at) diagnostics.push(diagnostic('AIGOV_EVIDENCE_HEAD_MISMATCH', 'Executed evidence must bind the exact expected head.', EVIDENCE_PATH));
    if (evidence.verification_budget.executed_checks < minimumVerification || executedItems.some((item) => item.status !== 'passed')) diagnostics.push(diagnostic('AIGOV_VERIFICATION_BUDGET_INSUFFICIENT', 'Executed exact-head evidence is below budget or contains a failed check.', EVIDENCE_PATH));
    if (evidence.manifest_state === 'executed_exact_head_ci_verified') {
      const ciItem = evidence.evidence_items.find((item) => item.evidence_id === 'exact-head-ci-identity');
      if (!ciItem || ciItem.status !== 'passed' || ciItem.evidence_source !== 'github_actions' || !ciItem.github_actions) diagnostics.push(diagnostic('AIGOV_EXACT_HEAD_CI_UNVERIFIED', 'Finalized evidence must bind the authoritative exact-head CI identity.', EVIDENCE_PATH));
      if (executedItems.some((item) => item.evidence_source !== 'github_actions' || !item.github_actions)) diagnostics.push(diagnostic('AIGOV_GITHUB_ACTIONS_IDENTITY_MISSING', 'Finalized executed checks must reference their workflow run, job, check run and artifact file.', EVIDENCE_PATH));
    }
  }
  return diagnostics;
}

function parseArgs(argv) {
  const result = { fixturesOnly: false, selectedCase: null, reviewReceipt: null, expectedHead: null, evidenceManifest: EVIDENCE_PATH, requireExecutedBudget: false, lifecycleLedger: null };
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--fixtures-only') result.fixturesOnly = true;
    else if (argv[index] === '--case') result.selectedCase = argv[++index];
    else if (argv[index] === '--review-receipt') result.reviewReceipt = argv[++index];
    else if (argv[index] === '--expected-head') result.expectedHead = argv[++index];
    else if (argv[index] === '--evidence-manifest') result.evidenceManifest = argv[++index];
    else if (argv[index] === '--require-executed-budget') result.requireExecutedBudget = true;
    else if (argv[index] === '--lifecycle-ledger') result.lifecycleLedger = argv[++index];
    else throw new Error(`Unknown argument: ${argv[index]}`);
  }
  return result;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const policy = readJson(POLICY_PATH);
  const scope = readJson(SCOPE_PATH);
  const evidence = readJson(args.evidenceManifest);
  const ajv = new Ajv2020({ allErrors: true, strict: false });
  addFormats(ajv);
  const policyValidator = ajv.compile(readJson(POLICY_SCHEMA_PATH));
  const scopeValidator = ajv.compile(readJson(SCOPE_SCHEMA_PATH));
  const evidenceValidator = ajv.compile(readJson(EVIDENCE_SCHEMA_PATH));
  const reviewValidator = ajv.compile(readJson(REVIEW_SCHEMA_PATH));
  const ledgerValidator = ajv.compile(readJson(LEDGER_SCHEMA_PATH));
  const diagnostics = [
    ...schemaDiagnostics(policyValidator, policy, POLICY_PATH),
    ...schemaDiagnostics(scopeValidator, scope, SCOPE_PATH),
    ...schemaDiagnostics(evidenceValidator, evidence, args.evidenceManifest),
  ];
  const fixtureResult = validateFixtures(policy, args.selectedCase);
  diagnostics.push(...fixtureResult.diagnostics);
  diagnostics.push(...evidenceManifestDiagnostics(evidence, policy, scope, { expectedHead: args.expectedHead, requireExecutedBudget: args.requireExecutedBudget }));
  if (!args.fixturesOnly) diagnostics.push(...repositoryStateDiagnostics(policy, scope), ...workflowSecurityDiagnostics(policy));

  if (args.reviewReceipt) {
    if (!existsSync(filePath(args.reviewReceipt))) diagnostics.push(diagnostic('AIGOV_REVIEW_RECEIPT_MISSING', 'External review receipt was not found.', args.reviewReceipt));
    else {
      const receipt = readJson(args.reviewReceipt);
      const reviewSchemaDiagnostics = schemaDiagnostics(reviewValidator, receipt, args.reviewReceipt);
      diagnostics.push(...reviewSchemaDiagnostics);
      if (!reviewSchemaDiagnostics.length) {
        if (receipt.target.scope_revision !== scope.scope_revision) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_SCOPE', 'Review receipt scope revision is stale.', args.reviewReceipt));
        if (!args.expectedHead || receipt.target.head_sha !== args.expectedHead) diagnostics.push(diagnostic('AIGOV_REVIEW_STALE_HEAD', 'Review receipt head is not the authoritative expected PR head.', args.reviewReceipt));
        if (receipt.provenance.evidence_source !== 'github_rest_api_https' || receipt.provenance.inspector_repository !== 'rezahh107/PR-Inspector' || receipt.provenance.inspector_repository_id !== 1288323264) diagnostics.push(diagnostic('AIGOV_REVIEW_PROVENANCE_UNVERIFIED', 'Review receipt is not bound to the trusted external inspector source.', args.reviewReceipt));
      }
    }
  }

  if (args.lifecycleLedger) {
    if (!existsSync(filePath(args.lifecycleLedger))) diagnostics.push(diagnostic('AIGOV_LIFECYCLE_LEDGER_MISSING', 'Lifecycle ledger was not found.', args.lifecycleLedger));
    else {
      const ledger = readJson(args.lifecycleLedger);
      const ledgerSchemaDiagnostics = schemaDiagnostics(ledgerValidator, ledger, args.lifecycleLedger);
      diagnostics.push(...ledgerSchemaDiagnostics);
      if (!ledgerSchemaDiagnostics.length) diagnostics.push(...validateLifecycleLedger(ledger, {
        repository: REPOSITORY,
        repositoryId: REPOSITORY_ID,
        prNumber: PR_NUMBER,
        baseSha: BASE_SHA,
        headSha: args.expectedHead,
        scopeRevision: scope.scope_revision,
      }).map((item) => diagnostic(item.code, item.message, args.lifecycleLedger)));
    }
  }

  const report = {
    validator: 'validate-aigov-governance',
    plan_id: PLAN_ID,
    batch_id: 'BATCH_A',
    tested_head: git(['status', '--porcelain=v1', '--untracked-files=all']) ? `worktree_uncommitted_from_${git(['rev-parse', 'HEAD']) || 'unknown'}` : (git(['rev-parse', 'HEAD']) || 'unknown'),
    scope_revision: scope.scope_revision,
    fixture_count: fixtureResult.results.length,
    fixture_results: fixtureResult.results,
    evidence_manifest: args.evidenceManifest,
    evidence_manifest_state: evidence.manifest_state,
    status: diagnostics.length ? 'fail' : 'pass',
    diagnostic_count: diagnostics.length,
    diagnostics,
  };
  console.log(JSON.stringify(report, null, 2));
  if (diagnostics.length) process.exitCode = 1;
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) main();
