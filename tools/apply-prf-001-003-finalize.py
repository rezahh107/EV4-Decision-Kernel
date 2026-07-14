#!/usr/bin/env python3
from __future__ import annotations

import json
import os
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
REVIEW_BASE = "487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8"
CURRENT_BASE = "3779937e407d9493932442f324a8d054459eb7b9"
BRANCH = "dcov/coverage-guarantee-activation"


def run(*args: str, capture: bool = False, env: dict[str, str] | None = None) -> str:
    result = subprocess.run(
        list(args), cwd=ROOT, check=True, text=True,
        stdout=subprocess.PIPE if capture else None,
        env=env,
    )
    return result.stdout.strip() if capture else ""


def read(path: str) -> str:
    return (ROOT / path).read_text(encoding="utf-8")


def write(path: str, text: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def load(path: str) -> dict:
    return json.loads(read(path))


def dump(path: str, value: dict) -> None:
    write(path, json.dumps(value, indent=2, ensure_ascii=False) + "\n")


# Restore the reviewed trusted-base promotion predicate exactly.
write(
    "docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md",
    run("git", "show", f"{REVIEW_BASE}:docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md", capture=True) + "\n",
)

# Keep the detailed roadmap, but remove the unapproved active overlay and
# restore original KROAD statuses/dependencies.
plan_path = "planning/KERNEL_EXECUTION_PLAN.md"
plan = read(plan_path)
replacement = """# Coverage Guarantee Proposal Overlay — Non-Executable\n\n- **Status:** proposed\n- **Authority:** blocked pending an external project-owner governance carrier satisfying every trusted-base promotion predicate.\n- **Scope:** candidate Coverage contract, data, validators and fixtures only.\n- **Do not:** treat merge metadata, CI success, repository placement, PR text or target-authored closure as implementation authority.\n- **Roadmap effect:** none; KROAD-012 through KROAD-018 retain their original status, order, dependencies and acceptance criteria.\n- **Next allowed item:** KROAD-012.\n\nThe proposed DCOV package decomposition is retained only as non-authoritative design context. It cannot replace or supersede any KROAD item until the full external promotion gate is independently satisfied.\n\n"""
plan, count = re.subn(
    r"# Coverage Execution Program — Active[\s\S]*?(?=\n# Roadmap Items)",
    replacement.rstrip(),
    plan,
    count=1,
)
if count != 1:
    raise SystemExit("active Coverage program section was not found")
plan = plan.replace("- **Status:** superseded_by_coverage_execution_program", "- **Status:** not_started")
plan = re.sub(r"\n- \*\*Unified execution mapping:\*\*[^\n]*", "", plan)
write(plan_path, plan)

# The operationalization map remains useful design context, but not authority.
map_path = "planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md"
text = read(map_path)
replacements = {
    "`active_unified_execution_map`": "`proposed_unapproved_execution_overlay`",
    "- `current_work_package`: `DCOV-EXEC-001`": "- `current_work_package`: `none_blocked_pending_external_governance_approval`",
    "- `only_next_executable_after_merge`: `DCOV-EXEC-002`": "- `only_next_executable_after_merge`: `none`",
    "This map replaces the fragmented proposed package path with five bounded executable packages. Contract states are computed; no manual promotion workflow is active.": "This map is a proposed package decomposition only. It does not replace KROAD-012 through KROAD-018 and is non-executable until the full external governance promotion gate is independently satisfied.",
    "    state_after: policy_active": "    state_after: not_measurable_pending_external_promotion",
    "This Draft PR creates the authoritative v1 contract": "This Draft PR proposes a candidate v1 contract",
    "- active manual authority lock count is zero;": "- the full external project-owner governance promotion carrier is verified;",
    "- state derives as `policy_active`.": "- state remains `not_measurable_pending_external_promotion` while approval is absent.",
    "This is the only next executable package after `DCOV-EXEC-001` merges.": "This package is not executable under the current authority state. KROAD-012 remains next allowed.",
    "`superseded_by_coverage_execution_program`": "`not_started`",
}
for old, new in replacements.items():
    text = text.replace(old, new)
write(map_path, text)

# Self-authored activation records cannot serve as approval evidence.
for path in (
    "planning/reviews/DCOV-EXEC-001_COVERAGE_GUARANTEE_ACTIVATION.md",
    "planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md",
):
    target = ROOT / path
    if target.exists():
        target.unlink()

# Adapt the preserved deep validator to a fail-closed proposal state while
# retaining all established schema/fixture/denominator/proof checks.
legacy_path = "kernel/validator/validate-coverage-guarantee-legacy.mjs"
legacy = read(legacy_path)
new_authority = r'''function authorityReferenceDiagnostics() {
  const diagnostics = [];
  const recovery = readText('docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md');
  const plan = readText('planning/KERNEL_EXECUTION_PLAN.md');
  const next = readText('planning/NEXT_WORK.md');
  const contract = readJson(PATHS.contract);
  const boundary = contract.promotion_boundary;
  const required = [
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
  if (!boundary
    || boundary.status !== 'proposal_pending_external_governance_approval'
    || boundary.authority_source !== 'external_project_owner_governance'
    || boundary.target_repository_content_can_approve !== false
    || boundary.merge_or_ci_can_approve !== false
    || boundary.self_authored_closure_can_approve !== false
    || !arraysEqual(boundary.required_predicates, required)) {
    diagnostics.push(diagnostic('COV_EXTERNAL_PROMOTION_BOUNDARY_MISSING', 'Coverage implementation remains ineligible until the complete external governance promotion carrier is verified.', PATHS.contract));
  }
  if (!recovery.includes('parent_authority: approved_recovery_source_of_record')
    || !recovery.includes('CI success')
    || !recovery.includes('do not independently or collectively imply this authority transition')) {
    diagnostics.push(diagnostic('COV_EXTERNAL_PROMOTION_PREDICATE_MISSING', 'The trusted-base promotion predicate is incomplete.', 'docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md'));
  }
  if (!plan.includes('**Status:** proposed')
    || plan.includes('Coverage Execution Program — Active')
    || plan.includes('replaces KROAD-012 through KROAD-018')) {
    diagnostics.push(diagnostic('COV_EXECUTION_PLAN_SELF_PROMOTION_FORBIDDEN', 'The Coverage recovery overlay must remain proposed and non-executable.', 'planning/KERNEL_EXECUTION_PLAN.md'));
  }
  if (!next.includes('KROAD-012')
    || next.includes('superseded_by_coverage_execution_program')
    || !next.includes('blocked_pending_external_governance_approval')) {
    diagnostics.push(diagnostic('COV_ROADMAP_SELF_PROMOTION_FORBIDDEN', 'KROAD-012 must remain next-allowed and the Coverage proposal must remain blocked.', 'planning/NEXT_WORK.md'));
  }
  return { diagnostics, active: 0, historical: 1 };
}'''
legacy, count = re.subn(
    r"function authorityReferenceDiagnostics\(\) \{[\s\S]*?\n\}\n\nfunction repositoryWiringDiagnostics\(\)",
    new_authority + "\n\nfunction repositoryWiringDiagnostics()",
    legacy,
    count=1,
)
if count != 1:
    raise SystemExit("authority diagnostics replacement failed")
legacy = legacy.replace(
    "const policyActive = mainDiagnostics.length === 0 && fixturesPassed;",
    "const proposalValidated = mainDiagnostics.length === 0 && fixturesPassed;\n"
    "  const policyActive = proposalValidated\n"
    "    && bundle.contract?.promotion_boundary?.status === 'approved_external_governance_authority';",
)
legacy = legacy.replace(
    "current_state: thresholdEnforced ? 'threshold_enforced' : measurementActive ? 'measurement_active' : policyActive ? 'policy_active' : 'inactive',",
    "current_state: thresholdEnforced ? 'threshold_enforced'\n"
    "      : measurementActive ? 'measurement_active'\n"
    "        : policyActive ? 'policy_active'\n"
    "          : proposalValidated\n"
    "            && bundle.contract?.promotion_boundary?.status === 'proposal_pending_external_governance_approval'\n"
    "            ? 'not_measurable_pending_external_promotion'\n"
    "            : 'inactive',",
)
write(legacy_path, legacy)

# The impact record is newly added in this PR, so bind it to the current live
# base and recompute the exact sensitive path set after all repairs.
impact_path = "planning/coverage/impacts/dcov-exec-001.bootstrap.json"
impact = load(impact_path)
impact["base_sha"] = CURRENT_BASE
impact["reason"] = "introduces_proposed_coverage_measurement_system_pending_external_promotion"
impact["coverage_state_before"] = "not_measurable"
impact["coverage_state_after"] = "not_measurable"
impact["zero_delta"] = True
impact["blocking_defect"] = {
    "defect_id": "PRF-001-EXTERNAL-GOVERNANCE-AUTHORITY-MISSING",
    "reason": "No separately supplied external project-owner governance approval carrier exists.",
}
impact["next_content_expansion_package"] = "KROAD-012"
dump(impact_path, impact)

# Remove temporary execution carriers before computing the committed diff.
for path in (
    "tools/apply-prf-001-003-finalize.py",
    ".github/workflows/apply-prf-001-003-finalize.yml",
):
    target = ROOT / path
    if target.exists():
        target.unlink()

changed = set(run("git", "diff", "--name-only", f"{CURRENT_BASE}..HEAD", capture=True).splitlines())
changed.update(run("git", "diff", "--name-only", capture=True).splitlines())
changed.update(run("git", "ls-files", "--others", "--exclude-standard", capture=True).splitlines())
contract = load("kernel/decision-governance/coverage-guarantee-contract.v1.json")
patterns = contract["coverage_sensitive_paths"]
sensitive = sorted(
    path for path in changed if path and any(path == pattern or path.startswith(pattern) for pattern in patterns)
)
impact = load(impact_path)
impact["changed_paths"] = sensitive
dump(impact_path, impact)

run("git", "diff", "--check")
run("git", "config", "user.name", "github-actions[bot]")
run("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
run("git", "add", "-A")
run("git", "commit", "-m", "fix(coverage): finalize external authority and enforcement invariants")

head = run("git", "rev-parse", "HEAD", capture=True)
env = dict(os.environ)
env.update({
    "COVERAGE_REPOSITORY": "rezahh107/EV4-Decision-Kernel",
    "COVERAGE_PR_NUMBER": "43",
    "COVERAGE_BASE_SHA": CURRENT_BASE,
    "COVERAGE_HEAD_SHA": head,
})
run("node", "--check", "kernel/validator/validate-coverage-guarantee.mjs")
run("node", "--check", "kernel/validator/validate-coverage-guarantee-prf010.mjs")
run("node", "--check", "kernel/validator/validate-coverage-guarantee-legacy.mjs")
run("npm", "ci")
run("npm", "run", "validate:coverage", env=env)
run("npm", "run", "validate:mvk", env=env)
run("npm", "run", "validate:roadmap-memory", env=env)
run("npm", "run", "validate:kroad-010-history-matrix", env=env)
run("git", "diff", "--check", f"{CURRENT_BASE}..HEAD")
run("git", "push", "origin", f"HEAD:{BRANCH}")
