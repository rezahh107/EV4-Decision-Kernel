import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const REQUIRED_FILES = [
  'planning/NEXT_WORK.md',
  'planning/KERNEL_EXECUTION_PLAN.md',
  'AGENTS.md',
];

const STALE_PRE_MERGE_PHRASES = [
  'not complete on main until this PR is merged',
  'expected post-merge state',
  'becomes complete only after this PR merges',
  'Pending PR',
];

const failures = [];

function readRequired(filePath) {
  const abs = path.join(ROOT, filePath);
  if (!fs.existsSync(abs)) {
    fail(filePath, 'required file is missing', 'Restore the file or update the roadmap-memory validator if the path intentionally changed.');
    return '';
  }
  return fs.readFileSync(abs, 'utf8');
}

function fail(filePath, problem, suggestedFix) {
  failures.push({ filePath, problem, suggestedFix });
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function extractSection(text, heading) {
  const headingPattern = new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, 'm');
  const match = headingPattern.exec(text);
  if (!match) return '';
  const start = match.index + match[0].length;
  const rest = text.slice(start);
  const next = /^##\s+/m.exec(rest);
  return next ? rest.slice(0, next.index) : rest;
}

function extractCompletedKroads(nextWork) {
  const completed = extractSection(nextWork, 'Completed');
  const matches = [...completed.matchAll(/^- \[x\] (KROAD-\d{3})\s+—\s+(.+)$/gm)];
  return matches.map((match) => ({ id: match[1], title: match[2] }));
}

function assertStatusAuthority(nextWork) {
  const hasAuthorityHeading = /^## Status Authority\s*$/m.test(nextWork);
  const hasDashboardLanguage = /authoritative current-status dashboard/i.test(nextWork);
  if (!hasAuthorityHeading || !hasDashboardLanguage) {
    fail(
      'planning/NEXT_WORK.md',
      'NEXT_WORK.md does not clearly declare itself as the current roadmap-status dashboard.',
      'Add a Status Authority section stating that current roadmap status lives in planning/NEXT_WORK.md.',
    );
  }
}

function assertExactlyOneNextTask(nextWork) {
  const section = extractSection(nextWork, 'Next Task');
  const nextTasks = [...section.matchAll(/^- \[ \] ((?:KROAD-\d{3})|(?:DCOV-EXEC-\d{3}))\s+—\s+.+$/gm)];
  if (nextTasks.length !== 1) {
    fail(
      'planning/NEXT_WORK.md',
      `NEXT_WORK.md must identify exactly one current next task, found ${nextTasks.length}.`,
      'Keep exactly one unchecked executable item under the Next Task section.',
    );
  }
}

function assertExternalPromotionBoundary(nextWork, executionPlan) {
  const current = extractSection(nextWork, 'Current PR');
  const next = extractSection(nextWork, 'Next Task');

  if (!/^- \[ \] `?DCOV-EXEC-001`?\s+—\s+Coverage Guarantee proposal and validation foundation$/m.test(current)) {
    fail(
      'planning/NEXT_WORK.md',
      'Current PR is not recorded as the non-executable DCOV-EXEC-001 proposal.',
      'Record DCOV-EXEC-001 under Current PR as a proposal and validation foundation only.',
    );
  }
  if (!/`implementation_eligibility`:\s+`blocked_pending_external_governance_approval`/.test(current)) {
    fail(
      'planning/NEXT_WORK.md',
      'DCOV-EXEC-001 is not fail-closed on missing external governance approval.',
      'Set implementation_eligibility to blocked_pending_external_governance_approval.',
    );
  }
  if (!/^- \[ \] KROAD-012\s+—\s+External Evidence Producer Boundary$/m.test(next)) {
    fail(
      'planning/NEXT_WORK.md',
      'The only next allowed roadmap item must remain KROAD-012.',
      'Keep only KROAD-012 under Next Task while the Coverage proposal lacks external approval.',
    );
  }
  if (!/`status`:\s+`next_allowed`/.test(next)) {
    fail(
      'planning/NEXT_WORK.md',
      'KROAD-012 is not classified as next_allowed.',
      'Set KROAD-012 status to next_allowed.',
    );
  }
  if (/superseded_by_coverage_execution_program/.test(nextWork)) {
    fail(
      'planning/NEXT_WORK.md',
      'NEXT_WORK.md still self-supersedes KROAD items through the unapproved Coverage proposal.',
      'Remove superseded_by_coverage_execution_program from current roadmap memory.',
    );
  }
  if (!/\*\*Status:\*\* proposed/.test(executionPlan)
    || /Coverage Execution Program — Active/.test(executionPlan)
    || /replaces KROAD-012 through KROAD-018/.test(executionPlan)) {
    fail(
      'planning/KERNEL_EXECUTION_PLAN.md',
      'The detailed plan still represents the Coverage overlay as active or authoritative.',
      'Keep the Coverage overlay proposed and non-executable without changing KROAD-012 through KROAD-018.',
    );
  }
}

function assertCompletedItemsHaveEvidence(nextWork) {
  const completed = extractSection(nextWork, 'Completed');
  const itemRegex = /^- \[x\] (KROAD-\d{3})\s+—\s+.+$/gm;
  const items = [...completed.matchAll(itemRegex)];

  for (let i = 0; i < items.length; i += 1) {
    const current = items[i];
    const next = items[i + 1];
    const start = (current.index ?? 0) + current[0].length;
    const end = next?.index ?? completed.length;
    const body = completed.slice(start, end);
    const hasEvidence = /Update note:|Known evidence:|PR #\d+|planning\//i.test(body);
    if (!hasEvidence) {
      fail(
        'planning/NEXT_WORK.md',
        `${current[1]} is marked complete without an update note or evidence reference.`,
        'Add an indented Update note or evidence reference under the completed KROAD item.',
      );
    }
  }
}

function hasExplicitStatusNeutralization(nextWork, id) {
  const statusAuthority = extractSection(nextWork, 'Status Authority');
  const mentionsId = new RegExp(escapeRegExp(id), 'i').test(statusAuthority);
  const mentionsDetailedPlan = /KERNEL_EXECUTION_PLAN\.md/i.test(statusAuthority);
  const saysNonAuthoritative = /non-authoritative/i.test(statusAuthority);
  const pointsToNextWork = /Current status source/i.test(statusAuthority) && /planning\/NEXT_WORK\.md/i.test(statusAuthority);
  return mentionsId && mentionsDetailedPlan && saysNonAuthoritative && pointsToNextWork;
}

function assertKernelDoesNotOverrideCompletedStatus(nextWork, executionPlan) {
  const hasStatusAuthority = /^## Status Authority\s*$/m.test(nextWork) && /authoritative current-status dashboard/i.test(nextWork);
  const completedIds = extractCompletedKroads(nextWork).map((item) => item.id);

  for (const id of completedIds) {
    const sectionStart = executionPlan.indexOf(`## ${id}`);
    if (sectionStart === -1) continue;
    const sectionRest = executionPlan.slice(sectionStart);
    const nextSection = sectionRest.slice(1).search(/\n## KROAD-\d{3}/);
    const section = nextSection === -1 ? sectionRest : sectionRest.slice(0, nextSection + 1);
    const hasStaleNotStarted = /^- \*\*Status:\*\*\s+not_started\s*$/m.test(section);

    if (hasStaleNotStarted && (!hasStatusAuthority || !hasExplicitStatusNeutralization(nextWork, id))) {
      fail(
        'planning/KERNEL_EXECUTION_PLAN.md',
        `${id} is complete in NEXT_WORK.md but still has mutable status not_started in the detailed plan.`,
        'Replace the stale per-item status with a stable current-status-source note, or explicitly document the legacy detailed-plan status as non-authoritative in NEXT_WORK.md.',
      );
    }
  }
}

function planningMarkdownFiles() {
  const planningDir = path.join(ROOT, 'planning');
  if (!fs.existsSync(planningDir)) return [];
  return fs.readdirSync(planningDir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => `planning/${name}`);
}

function assertNoStalePreMergeWording() {
  for (const filePath of planningMarkdownFiles()) {
    const text = fs.readFileSync(path.join(ROOT, filePath), 'utf8');
    const lines = text.split('\n');
    lines.forEach((line, i) => {
      const lower = line.toLowerCase();
      const explicitlyHistorical = /historical|history|previous review|past PR|legacy/i.test(line);
      for (const phrase of STALE_PRE_MERGE_PHRASES) {
        if (lower.includes(phrase.toLowerCase()) && !explicitlyHistorical) {
          fail(
            filePath,
            `stale pre-merge wording on line ${i + 1}: ${phrase}`,
            'Rewrite the line as current-state wording, or explicitly mark it as historical context.',
          );
        }
      }
    });
  }
}

const files = Object.fromEntries(REQUIRED_FILES.map((filePath) => [filePath, readRequired(filePath)]));

assertStatusAuthority(files['planning/NEXT_WORK.md']);
assertExactlyOneNextTask(files['planning/NEXT_WORK.md']);
assertExternalPromotionBoundary(files['planning/NEXT_WORK.md'], files['planning/KERNEL_EXECUTION_PLAN.md']);
assertCompletedItemsHaveEvidence(files['planning/NEXT_WORK.md']);
assertKernelDoesNotOverrideCompletedStatus(files['planning/NEXT_WORK.md'], files['planning/KERNEL_EXECUTION_PLAN.md']);
assertNoStalePreMergeWording();

if (failures.length > 0) {
  console.error('Roadmap memory validation failed:');
  for (const failure of failures) {
    console.error(`\n${failure.filePath}`);
    console.error(`  Problem: ${failure.problem}`);
    console.error(`  Suggested fix: ${failure.suggestedFix}`);
  }
  process.exit(1);
}

console.log('Roadmap memory validation passed.');
