#!/usr/bin/env python3
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
IMPACT = ROOT / 'planning/coverage/impacts/dcov-exec-001.bootstrap.json'
PATH = 'kernel/validator/validate-coverage-guarantee-history.mjs'
BRANCH = 'dcov/coverage-guarantee-activation'

value = json.loads(IMPACT.read_text(encoding='utf-8'))
paths = set(value['changed_paths'])
paths.add(PATH)
value['changed_paths'] = sorted(paths)
IMPACT.write_text(json.dumps(value, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')

for temporary in (
    ROOT / 'tools/add-history-hydrator-impact.py',
    ROOT / '.github/workflows/add-history-hydrator-impact.yml',
):
    if temporary.exists():
        temporary.unlink()

subprocess.run(['git', 'diff', '--check'], cwd=ROOT, check=True)
subprocess.run(['git', 'config', 'user.name', 'github-actions[bot]'], cwd=ROOT, check=True)
subprocess.run(['git', 'config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com'], cwd=ROOT, check=True)
subprocess.run(['git', 'add', '-A'], cwd=ROOT, check=True)
subprocess.run(['git', 'commit', '-m', 'fix(coverage): bind history hydrator to impact record'], cwd=ROOT, check=True)
subprocess.run(['git', 'push', 'origin', f'HEAD:{BRANCH}'], cwd=ROOT, check=True)
