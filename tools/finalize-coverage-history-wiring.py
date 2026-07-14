#!/usr/bin/env python3
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
LEGACY = ROOT / 'kernel/validator/validate-coverage-guarantee-legacy.mjs'
BRANCH = 'dcov/coverage-guarantee-activation'

text = LEGACY.read_text(encoding='utf-8')
old = """  if (packageJson.scripts?.['validate:coverage'] !== 'node kernel/validator/validate-coverage-guarantee.mjs') {
    diagnostics.push(diagnostic('COV_PACKAGE_SCRIPT_MISSING', 'package.json must expose npm run validate:coverage.', PATHS.package));
  }
"""
new = """  const validateCoverageScript = String(packageJson.scripts?.['validate:coverage'] || '');
  const expectedCoverageScript = 'node kernel/validator/validate-coverage-guarantee-history.mjs && node kernel/validator/validate-coverage-guarantee.mjs';
  if (validateCoverageScript !== expectedCoverageScript) {
    diagnostics.push(diagnostic('COV_PACKAGE_SCRIPT_MISSING', 'package.json must expose the exact authoritative history-hydration and Coverage validation chain.', PATHS.package));
  }
"""
if old not in text:
    raise SystemExit('legacy package wiring block not found')
LEGACY.write_text(text.replace(old, new), encoding='utf-8')

for temporary in (
    ROOT / '.github/workflows/coverage-diagnostic-temporary.yml',
    ROOT / 'tools/finalize-coverage-history-wiring.py',
    ROOT / '.github/workflows/finalize-coverage-history-wiring.yml',
):
    if temporary.exists():
        temporary.unlink()

subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
subprocess.run(['git', 'config', 'user.name', 'github-actions[bot]'], cwd=ROOT, check=True)
subprocess.run(['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], cwd=ROOT, check=True)
subprocess.run(['git', 'add', '-A'], cwd=ROOT, check=True)
subprocess.run(['git', 'commit', '-m', 'fix(coverage): validate exact history hydration chain'], cwd=ROOT, check=True)
subprocess.run(['git', 'push', 'origin', f'HEAD:{BRANCH}'], cwd=ROOT, check=True)
