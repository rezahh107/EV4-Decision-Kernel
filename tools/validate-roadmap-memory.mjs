import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();
const REQUIRED_FILES = [
  'planning/NEXT_WORK.md',
  'planning/KERNEL_EXECUTION_PLAN.md',
  'planning/decisions/AIGOV_ADOPTION_DECISION.md',
  'planning/reviews/AIGOV_ADOPTION_AUDIT.md',
  'docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md',
  'docs/governance/ssot-v1.1.0-payload/part-001.b64',
  'docs/governance/ssot-v1.1.0-payload/part-002.b64',
  'docs/governance/ssot-v1.1.0-payload/part-003.b64',
  'docs/governance/ssot-v1.1.0-payload/part-004.b64',
  'docs/governance/ssot-v1.1.0-payload/part-005.b64',
  'docs/governance/ssot-v1.1.0-payload/part-006.b64',
  'docs/governance/ssot-v1.1.0-payload/part-007.b64',
  'docs/governance/ssot-v1.1.0-payload/part-008.b64',
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
  const nextTasks = [...section.matchAll(/^- \[ \] ((?:KROAD-\d{3})|(?:DCOV-EXEC-\d{3})|(?:AIGOV-ADOPT-\d{3}))\s+—\s+.+$/gm)];
  if (nextTasks.length !== 1) {
    fail(
      'planning/NEXT_WORK.md',
      `NEXT_WORK.md must identify exactly one current next task, found ${nextTasks.length}.`,
      'Keep exactly one unchecked executable item under the Next Task section.',
    );
  }
}

function assertAigovAdoptionBoundary(nextWork, adoptionDecision, adoptionAudit, ssotManifest) {
  const next = extractSection(nextWork, 'Next Task');
  const nextProduct = extractSection(nextWork, 'Next Product Task');

  if (!/^- \[ \] AIGOV-ADOPT-000\s+—\s+Authority and status reconciliation$/m.test(next)) {
    fail(
      'planning/NEXT_WORK.md',
      'The current governance task is not AIGOV-ADOPT-000.',
      'Keep AIGOV-ADOPT-000 as the single current task until it is merged and post-merge verified.',
    );
  }
  if (!/`status`:\s+`in_progress`/.test(next)) {
    fail(
      'planning/NEXT_WORK.md',
      'AIGOV-ADOPT-000 is not classified as in_progress.',
      'Set the current governance increment status to in_progress.',
    );
  }
  if (!/^- \[ \] KROAD-012\s+—\s+External Evidence Producer Boundary$/m.test(nextProduct)) {
    fail(
      'planning/NEXT_WORK.md',
      'KROAD-012 is not preserved as the next product task.',
      'Keep KROAD-012 under Next Product Task while the governance adoption sequence is active.',
    );
  }
  if (!/`status`:\s+`next_product_task_blocked_by_governance_adoption`/.test(nextProduct)) {
    fail(
      'planning/NEXT_WORK.md',
      'KROAD-012 does not record the higher-priority governance dependency.',
      'Set KROAD-012 to next_product_task_blocked_by_governance_adoption.',
    );
  }
  if (!/plan_id:\s+GOV-ADOPTION-EV4-DECISION-KERNEL-D0E4652-V1/.test(adoptionDecision)) {
    fail(
      'planning/decisions/AIGOV_ADOPTION_DECISION.md',
      'The approved frozen-plan identity is missing or changed.',
      'Restore the exact approved plan ID.',
    );
  }
  if (!/current_increment:\s+AIGOV-ADOPT-000/.test(adoptionDecision)) {
    fail(
      'planning/decisions/AIGOV_ADOPTION_DECISION.md',
      'The adoption decision does not bind the current increment.',
      'Record AIGOV-ADOPT-000 as the current increment.',
    );
  }
  if (!/repository_adoption_status:\s+blocked_open_enforcement_gaps/.test(adoptionAudit)) {
    fail(
      'planning/reviews/AIGOV_ADOPTION_AUDIT.md',
      'The audit overstates repository adoption.',
      'Keep repository adoption blocked until the full sequence closes on main.',
    );
  }
  if (!/raw_source_sha256:\s+"30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757"/.test(ssotManifest)) {
    fail(
      'docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md',
      'The exact SSOT source digest is missing or changed.',
      'Restore the audited v1.1.0 SHA-256 identity.',
    );
  }
}

function assertSsotPayload(files) {
  const partPaths = Array.from(
    { length: 8 },
    (_, index) => `docs/governance/ssot-v1.1.0-payload/part-${String(index + 1).padStart(3, '0')}.b64`,
  );
  const expectedPartSha256 = [
    '9c9ef266832b7748ed4f51851d70638ccf7ade1f519a612113ff669e8cb1a753',
    'cc3b95570207848f4fcbbc0fe6bd912638619efae0c67acdeb89b6af13ec0c2a',
    'e8d42957e7665dc3c1db4c364b7dd242e13e545a31cc6124b34ad28e0284fcd5',
    '1701611223e4561456569b09a517751c03a48fb487685387fad50e1da2df7c26',
    '1014c5bfe2b366586a4582d49a36a643236b180a4676b013f2aed78f54e05e78',
    'f578e37ca4b9e29fb8505eba97c4d357a6510b7afd2a0ecdbebf0032c060bf43',
    'ef29003748aee9069ce3975a5abcc313bc63fd84d61a9b714609fcf18a2dd9ab',
    '8bf646b1cae69fe7a7780d92ec5a23f13eeebf82cbe20f85c6cb52e890d4b55c',
  ];
  const normalizedParts = partPaths.map((partPath, index) => {
    const value = files[partPath].trim();
    const digest = crypto.createHash('sha256').update(value, 'utf8').digest('hex');
    if (digest !== expectedPartSha256[index]) {
      fail(
        partPath,
        `SSOT payload part digest mismatch: expected ${expectedPartSha256[index]}, found ${digest}.`,
        'Restore the exact audited Base64 payload part.',
      );
    }
    return value;
  });

  const encodedPayload = normalizedParts.join('');
  if (encodedPayload.length !== 42288) {
    fail(
      'docs/governance/ssot-v1.1.0-payload/',
      `SSOT payload encoded length mismatch: expected 42288, found ${encodedPayload.length}.`,
      'Restore all eight exact payload parts in lexical order.',
    );
    return;
  }

  try {
    const compressed = Buffer.from(encodedPayload, 'base64');
    const source = zlib.gunzipSync(compressed);
    const digest = crypto.createHash('sha256').update(source).digest('hex');
    if (source.length !== 101922 || digest !== '30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757') {
      fail(
        'docs/governance/ssot-v1.1.0-payload/',
        `Reconstructed SSOT identity mismatch: size=${source.length}, sha256=${digest}.`,
        'Restore the exact audited v1.1.0 source payload.',
      );
    }
  } catch (error) {
    fail(
      'docs/governance/ssot-v1.1.0-payload/',
      `SSOT payload reconstruction failed: ${error.message}`,
      'Restore valid deterministic gzip Base64 payload parts.',
    );
  }
}

function assertExternalPromotionBoundary(nextWork, executionPlan) {
  const coverage = extractSection(nextWork, 'Blocked Coverage Proposal');

  if (!/^- \[ \] `?DCOV-EXEC-001`?\s+—\s+Coverage Guarantee proposal and validation foundation$/m.test(coverage)) {
    fail(
      'planning/NEXT_WORK.md',
      'The non-executable DCOV-EXEC-001 proposal is not preserved.',
      'Record DCOV-EXEC-001 under Blocked Coverage Proposal.',
    );
  }
  if (!/`implementation_eligibility`:\s+`blocked_pending_external_governance_approval`/.test(coverage)) {
    fail(
      'planning/NEXT_WORK.md',
      'DCOV-EXEC-001 is not fail-closed on missing external governance approval.',
      'Set implementation_eligibility to blocked_pending_external_governance_approval.',
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

assertSsotPayload(files);
assertStatusAuthority(files['planning/NEXT_WORK.md']);
assertExactlyOneNextTask(files['planning/NEXT_WORK.md']);
assertAigovAdoptionBoundary(
  files['planning/NEXT_WORK.md'],
  files['planning/decisions/AIGOV_ADOPTION_DECISION.md'],
  files['planning/reviews/AIGOV_ADOPTION_AUDIT.md'],
  files['docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md'],
);
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
