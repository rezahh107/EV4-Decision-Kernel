import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { canonical, sha256 } from './aigov-lifecycle.mjs';

export const PROTOCOL_VERSION = 'v1.10.1';
export const INSPECTOR_COMMIT = '7a21045366bb9ad1ca2f950b8341ebb867dd8a52';
export const FIXED_ARTIFACTS = [
  'review-package.json',
  'DECISION_PROJECTION.json',
  'OWNER_DECISION_CARD.fa.md',
  'TECHNICAL_HANDOFF.en.md',
  'OWNER_RESULT.fa.txt',
  'artifact-manifest.json',
];
export const PROMPT_ARTIFACT = 'NEXT_ACTION_PROMPT.en.md';

const VERIFIED = new WeakSet();
const ALLOWED_REMOTES = new Set([
  'https://github.com/rezahh107/PR-Inspector.git',
  'https://github.com/rezahh107/PR-Inspector',
  'git@github.com:rezahh107/PR-Inspector.git',
]);

export function canonicalPackageSha256(pkg) {
  return sha256(`${JSON.stringify(canonical(pkg))}\n`);
}

function inspectorRoot(explicitRoot) {
  const candidates = [
    explicitRoot,
    process.env.PR_INSPECTOR_ROOT,
    '/tmp/pr-inspector-7a210453',
    path.resolve(process.cwd(), '_external/pr-inspector'),
  ].filter(Boolean);
  for (const candidate of candidates) {
    try {
      const root = path.resolve(candidate);
      const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
      const remote = execFileSync('git', ['remote', 'get-url', 'origin'], { cwd: root, encoding: 'utf8' }).trim();
      const status = execFileSync('git', ['status', '--porcelain=v1', '--untracked-files=all'], { cwd: root, encoding: 'utf8' }).trim();
      const version = readFileSync(path.join(root, 'CURRENT_VERSION'), 'utf8').trim();
      if (head === INSPECTOR_COMMIT && ALLOWED_REMOTES.has(remote) && version === PROTOCOL_VERSION && status === '') return root;
    } catch {
      // Try the next immutable checkout candidate.
    }
  }
  throw new Error(`PRI-OFFICIAL-ROOT-001: exact ${INSPECTOR_COMMIT} PR Inspector checkout is unavailable`);
}

function writeDirectory(artifacts) {
  const directory = mkdtempSync(path.join(os.tmpdir(), 'ev4-pr-inspector-directory-'));
  const seen = new Set();
  for (const item of artifacts || []) {
    const name = path.posix.basename(item.path || '');
    if (![...FIXED_ARTIFACTS, PROMPT_ARTIFACT].includes(name) || seen.has(name) || !Buffer.isBuffer(item.raw)) {
      rmSync(directory, { recursive: true, force: true });
      throw new Error(`PRI-OFFICIAL-INPUT-001:${name || 'unknown'}`);
    }
    seen.add(name);
    writeFileSync(path.join(directory, name), item.raw);
  }
  return directory;
}

function resultEvidence(value) {
  const evidence = Object.freeze(value);
  VERIFIED.add(evidence);
  return evidence;
}

export function isVerifiedOfficialDirectoryEvidence(value) {
  return Boolean(value && VERIFIED.has(value));
}

export function verifyOfficialReviewDirectory({ artifacts, context, live = true, explicitInspectorRoot = null }) {
  const root = inspectorRoot(explicitInspectorRoot);
  const directory = writeDirectory(artifacts);
  const pycache = mkdtempSync(path.join(os.tmpdir(), 'ev4-pr-inspector-pycache-'));
  try {
    let command;
    let args;
    if (live) {
      command = 'python3';
      args = [
        path.resolve(process.cwd(), 'tools/pr-inspector-official-boundary.py'),
        '--inspector-root', root,
        '--review-directory', directory,
        '--inspector-commit', INSPECTOR_COMMIT,
        '--target-repository', context.repository,
        '--pr-number', String(context.prNumber),
        '--reviewed-head-sha', context.headSha,
      ];
    } else {
      command = 'python3';
      args = [path.join(root, 'scripts/validate_review_v2.py'), directory];
    }
    const environment = { ...process.env, PYTHONPYCACHEPREFIX: pycache };
    delete environment.PYTHONHOME;
    delete environment.PYTHONPATH;
    const run = spawnSync(command, args, { cwd: root, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, env: environment });
    const output = `${run.stdout || ''}${run.stderr || ''}`.trim();
    if (run.status !== 0) {
      return resultEvidence({
        status: 'fail',
        live,
        diagnostics: [`PRI-OFFICIAL-BOUNDARY-FAILED:${output || `exit-${run.status ?? 1}`}`],
        projection: null,
        hashes: null,
      });
    }
    const projectionRaw = readFileSync(path.join(directory, 'DECISION_PROJECTION.json'));
    const packageRaw = readFileSync(path.join(directory, 'review-package.json'));
    const manifestRaw = readFileSync(path.join(directory, 'artifact-manifest.json'));
    const projection = JSON.parse(projectionRaw.toString('utf8'));
    const hashes = {
      canonical_review_package_sha256: canonicalPackageSha256(JSON.parse(packageRaw.toString('utf8'))),
      review_package_file_sha256: sha256(packageRaw),
      decision_projection_sha256: sha256(projectionRaw),
      artifact_manifest_sha256: sha256(manifestRaw),
      artifact_byte_hashes: Object.fromEntries(
        [...FIXED_ARTIFACTS, ...(projection.next_action?.prompt_required ? [PROMPT_ARTIFACT] : [])]
          .sort()
          .map((name) => [name, sha256(readFileSync(path.join(directory, name)))]),
      ),
    };
    let liveSummary = null;
    if (live) {
      const lines = (run.stdout || '').trim().split(/\r?\n/);
      liveSummary = JSON.parse(lines.at(-1));
      if (liveSummary.technical_status !== projection.technical_status
        || liveSummary.next_action_kind !== projection.next_action?.kind
        || liveSummary.reviewed_head_sha !== context.headSha
        || liveSummary.review_package_canonical_sha256 !== hashes.canonical_review_package_sha256
        || liveSummary.review_package_file_sha256 !== hashes.review_package_file_sha256
        || liveSummary.decision_projection_sha256 !== hashes.decision_projection_sha256
        || liveSummary.artifact_manifest_sha256 !== hashes.artifact_manifest_sha256
        || JSON.stringify(liveSummary.artifact_byte_hashes) !== JSON.stringify(hashes.artifact_byte_hashes)) {
        throw new Error('PRI-OFFICIAL-BOUNDARY-SUMMARY-MISMATCH');
      }
    }
    return resultEvidence({
      status: 'pass',
      live,
      diagnostics: [],
      projection,
      liveSummary,
      hashes,
    });
  } catch (error) {
    return resultEvidence({ status: 'fail', live, diagnostics: [`PRI-OFFICIAL-BOUNDARY-FAILED:${error.message}`], projection: null, hashes: null });
  } finally {
    rmSync(directory, { recursive: true, force: true });
    rmSync(pycache, { recursive: true, force: true });
  }
}
