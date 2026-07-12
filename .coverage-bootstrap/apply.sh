#!/usr/bin/env bash
set -euo pipefail

base_sha="487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8"
branch="${GITHUB_HEAD_REF:-${GITHUB_REF_NAME}}"

echo stage=fetch
git fetch --quiet --depth 1 origin "$base_sha"

echo stage=decode
cat .coverage-bootstrap/part-00 .coverage-bootstrap/part-01 .coverage-bootstrap/part-02 .coverage-bootstrap/part-03 .coverage-bootstrap/part-04 .coverage-bootstrap/part-05 > /tmp/payload.b64
base64 --decode /tmp/payload.b64 > /tmp/payload.zip
echo "5f4c722f0ac4bd9fedffe0a774fde66a0d9268783011e6f78f1c2cd39b51660f  /tmp/payload.zip" | sha256sum --check
unzip -q -o /tmp/payload.zip -d .

echo stage=hashes
sha256sum --check <<'EOF'
fdac64911973214a8aa0c7265ab7b032115e64b0c327bfb23163d714a11295b1  AGENTS.md
30256b2968bb545d146412bf900099d92c28f7611b96094e46f8ffb361cdef8e  docs/adr/ADR-006-coverage-guarantee-governance.md
ad1d9ac12b068548936e4df1790a38fe40d023297084d9e9b4434f8ed6e94e5d  docs/decision-governance/COVERAGE_GUARANTEE_CONTRACT.md
bd95590babc431b46cefe505c8332f6951a17c609b1013abd1c828e0ad812256  kernel/decision-governance/coverage-guarantee-contract.v1.json
ed14673deda7f4232d30adc6ff4efe921b3c8574314faf781322fc40c7cd9c07  kernel/schemas/coverage-guarantee-contract.v1.schema.json
bb7887c8aa2407dc7e16cb2417fc873d72ce883e33a6429679f775c994a29ab6  kernel/schemas/element-reconciliation-ledger.v1.schema.json
f63e972a5719438982eee0bc17dcc961412062f0ddceff33d3916946d8883478  kernel/schemas/decision-question-catalog.v1.schema.json
23a6a388b438812c331925dead83ecc03081f2e449e0e59ea5c24dff5ec6de79  planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md
e281889db3a0a9ec60f93ffe4b232671d3b2087b865043e90883fee6366afead  planning/NEXT_WORK.md
415232f5f058c8f0d2ce1f1f8604758a3cf268ee81ef8670b3ef1ca6a3509702  planning/reviews/COVERAGE_GUARANTEE_BOOTSTRAP_PR1_REVIEW.md
EOF

echo stage=semantic
python - <<'PY'
import json
from pathlib import Path
contract = json.loads(Path('kernel/decision-governance/coverage-guarantee-contract.v1.json').read_text())
assert contract['contract_state'] == 'policy_active'
assert contract['thresholds'] == {'minimum_content_floor': 90, 'owner_acceptance_target': 95, 'critical_p0_and_safety_coverage': 100}
current = contract['current_measurement']
assert current['element_coverage_percent'] is None and current['question_coverage_percent'] is None
assert current['element_denominator_source'] == 'unresolved' and current['question_denominator_source'] == 'unresolved'
bootstrap = contract['bootstrap_exception']
assert bootstrap['maximum_consecutive_infrastructure_prs'] == 2
assert bootstrap['bootstrap_prs_used_after_merge'] == 1
assert bootstrap['mandatory_next_content_work_package'] == 'COVG-CONTENT-001'
assert [r['rule_id'] for r in contract['anti_drift_rules']] == [f'R-{i:02d}' for i in range(1, 9)]
for path in ['kernel/schemas/coverage-guarantee-contract.v1.schema.json','kernel/schemas/element-reconciliation-ledger.v1.schema.json','kernel/schemas/decision-question-catalog.v1.schema.json']:
    assert json.loads(Path(path).read_text())['$schema'] == 'https://json-schema.org/draft/2020-12/schema'
assert not Path('kernel/validator/validate-coverage-guarantee.mjs').exists()
assert not Path('planning/coverage/coverage-baseline.v1.json').exists()
print('semantic=PASS')
PY

echo stage=clean
rm -rf .coverage-bootstrap
rm -f .github/workflows/apply-coverage-bootstrap-pr1.yml

git config user.name "github-actions[bot]"
git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
git add -A

echo stage=diff-check
git diff --cached --check
actual_paths="$(git diff --cached --name-only "$base_sha" | sort)"
printf 'actual_paths:\n%s\n' "$actual_paths"
expected_paths="$(printf '%s\n' AGENTS.md docs/adr/ADR-006-coverage-guarantee-governance.md docs/decision-governance/COVERAGE_GUARANTEE_CONTRACT.md kernel/decision-governance/coverage-guarantee-contract.v1.json kernel/schemas/coverage-guarantee-contract.v1.schema.json kernel/schemas/decision-question-catalog.v1.schema.json kernel/schemas/element-reconciliation-ledger.v1.schema.json planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md planning/NEXT_WORK.md planning/reviews/COVERAGE_GUARANTEE_BOOTSTRAP_PR1_REVIEW.md | sort)"
test "$actual_paths" = "$expected_paths"

echo stage=commit
tree_sha="$(git write-tree)"
commit_sha="$(printf '%s\n' 'Activate coverage guarantee bootstrap policy' | git commit-tree "$tree_sha" -p "$base_sha")"
echo final_commit="$commit_sha"
git push --force origin "$commit_sha:refs/heads/$branch"
echo stage=done
