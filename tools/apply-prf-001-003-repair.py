#!/usr/bin/env python3
from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BASE = "487ffd8fb3b4d64ddf0cd44c4d8d87eb7ab6b5a8"
BRANCH = "dcov/coverage-guarantee-activation"
ISSUER = "7a21045366bb9ad1ca2f950b8341ebb867dd8a52"


def run(*args: str, capture: bool = False, env: dict[str, str] | None = None) -> str:
    result = subprocess.run(
        list(args), cwd=ROOT, check=True, text=True,
        stdout=subprocess.PIPE if capture else None,
        env=env,
    )
    return result.stdout.strip() if capture else ""


def write(path: str, text: str) -> None:
    target = ROOT / path
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_text(text, encoding="utf-8")


def load(path: str) -> dict:
    return json.loads((ROOT / path).read_text(encoding="utf-8"))


def dump(path: str, value: dict) -> None:
    write(path, json.dumps(value, indent=2, ensure_ascii=False) + "\n")


def restore_from_base(path: str) -> None:
    write(path, run("git", "show", f"{BASE}:{path}", capture=True) + "\n")


# PRF-001: restore the trusted-base roadmap and promotion predicate.
for restored in (
    "docs/decision-governance/EV4_DECISION_COVERAGE_RECOVERY_SPEC.md",
    "planning/NEXT_WORK.md",
    "planning/KERNEL_EXECUTION_PLAN.md",
    "planning/EV4_DECISION_COVERAGE_OPERATIONALIZATION_MAP.md",
):
    restore_from_base(restored)

next_work_path = ROOT / "planning/NEXT_WORK.md"
next_work = next_work_path.read_text(encoding="utf-8")
proposal_note = """

## Current PR — Non-Executable Coverage Proposal

- [ ] `DCOV-EXEC-001` — proposal artifacts and validators only
  - `implementation_eligibility`: `blocked_pending_external_governance_approval`
  - This PR cannot approve its own recovery source, activate Coverage policy, or supersede KROAD-012 through KROAD-018.
  - Merge state, CI success, target-authored review text and target-authored evidence closure are not promotion authority.
  - KROAD-012 remains the next allowed roadmap item unless a separately supplied external project-owner governance carrier satisfies the full trusted-base promotion gate.
"""
next_work_path.write_text(next_work.rstrip() + proposal_note + "\n", encoding="utf-8")

for stale_review in (
    "planning/reviews/DCOV-EXEC-001_COVERAGE_GUARANTEE_ACTIVATION.md",
    "planning/reviews/KROAD-012R_RECOVERY_SPEC_INTEGRATION_REVIEW.md",
):
    path = ROOT / stale_review
    if path.exists():
        path.unlink()

contract_path = "kernel/decision-governance/coverage-guarantee-contract.v1.json"
contract = load(contract_path)
contract["promotion_boundary"] = {
    "status": "proposal_pending_external_governance_approval",
    "authority_source": "external_project_owner_governance",
    "target_repository_content_can_approve": False,
    "merge_or_ci_can_approve": False,
    "self_authored_closure_can_approve": False,
    "required_predicates": [
        "repository_evidence_capture_complete",
        "official_source_fingerprints_complete",
        "contradiction_review_complete",
        "independent_review_passed",
        "project_owner_governance_approval",
        "planning_memory_synchronized",
        "exact_head_validation_passed",
        "merged_pr_evidence_recorded",
        "post_merge_evidence_closure_accepted",
    ],
}
policy_requirements = contract["state_machine"]["eligibility"]["policy_active"]["requirements"]
if "external_governance_approval_verified" not in policy_requirements:
    policy_requirements.insert(0, "external_governance_approval_verified")
contract["expected_state_after_dcov_exec_001"] = "not_measurable_pending_external_promotion"
patterns = [item for item in contract["coverage_sensitive_paths"]
            if item != "kernel/validator/validate-coverage-guarantee.mjs"]
for item in (
    ".github/workflows/validate-mvk.yml",
    "package.json",
    "kernel/validator/validate-coverage-guarantee",
    "kernel/fixtures/coverage-enforcement-surface-mutations.v1.json",
):
    if item not in patterns:
        patterns.append(item)
contract["coverage_sensitive_paths"] = patterns
dump(contract_path, contract)

schema_path = "kernel/schemas/coverage-guarantee-contract.v1.schema.json"
schema = load(schema_path)
required = schema["required"]
if "promotion_boundary" not in required:
    required.insert(required.index("thresholds"), "promotion_boundary")
schema["properties"]["promotion_boundary"] = {
    "type": "object",
    "additionalProperties": False,
    "required": [
        "status", "authority_source", "target_repository_content_can_approve",
        "merge_or_ci_can_approve", "self_authored_closure_can_approve",
        "required_predicates",
    ],
    "properties": {
        "status": {"const": "proposal_pending_external_governance_approval"},
        "authority_source": {"const": "external_project_owner_governance"},
        "target_repository_content_can_approve": {"const": False},
        "merge_or_ci_can_approve": {"const": False},
        "self_authored_closure_can_approve": {"const": False},
        "required_predicates": {"const": contract["promotion_boundary"]["required_predicates"]},
    },
}
schema["properties"]["expected_state_after_dcov_exec_001"] = {
    "const": "not_measurable_pending_external_promotion"
}
dump(schema_path, schema)

contract_doc_path = ROOT / "docs/decision-governance/COVERAGE_GUARANTEE_CONTRACT.md"
contract_doc = contract_doc_path.read_text(encoding="utf-8")
banner = """> **Authority status:** `proposal_pending_external_governance_approval`. This target repository, this PR, CI success, merge metadata and target-authored closure records cannot activate this contract. `policy_active` remains a target state available only after the full external project-owner governance promotion gate is independently satisfied.\n\n"""
if not contract_doc.startswith("> **Authority status:**"):
    contract_doc_path.write_text(banner + contract_doc, encoding="utf-8")

# PRF-001: make the preserved validator derive inactive state until external promotion.
legacy_path = ROOT / "kernel/validator/validate-coverage-guarantee-legacy.mjs"
legacy = legacy_path.read_text(encoding="utf-8")
legacy = legacy.replace(
    "&& impact.reason === 'introduces_the_coverage_measurement_system'\n"
    "        && impact.coverage_state_before === 'not_measurable'\n"
    "        && impact.coverage_state_after === 'policy_active'",
    "&& impact.reason === 'introduces_proposed_coverage_measurement_system_pending_external_promotion'\n"
    "        && impact.coverage_state_before === 'not_measurable'\n"
    "        && impact.coverage_state_after === 'not_measurable'",
)
legacy = legacy.replace(
    "const policyActive = mainDiagnostics.length === 0 && fixturesPassed;",
    "const policyActive = mainDiagnostics.length === 0 && fixturesPassed\n"
    "    && bundle.contract?.promotion_boundary?.status === 'approved_external_governance_authority';",
)
new_authority_function = r'''function authorityReferenceDiagnostics() {
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
  return { diagnostics, active: 0, historical: 0 };
}'''
legacy, count = re.subn(
    r"function authorityReferenceDiagnostics\(\) \{[\s\S]*?\n\}\n\nfunction repositoryWiringDiagnostics\(\)",
    new_authority_function + "\n\nfunction repositoryWiringDiagnostics()",
    legacy,
    count=1,
)
if count != 1:
    raise SystemExit("authorityReferenceDiagnostics replacement failed")
legacy_path.write_text(legacy, encoding="utf-8")

# PRF-003: deterministic single-path mutation fixtures.
aggregate_path = "kernel/fixtures/coverage-enforcement-surface-mutations.v1.json"
aggregate_cases = {
    "fixture_version": "1.0.0",
    "purpose": "single_path_coverage_enforcement_surface_mutations",
    "cases": [
        {"id": "workflow-without-impact", "changed_path": ".github/workflows/validate-mvk.yml", "impact_record_present": False, "expected_diagnostic": "COV_IMPACT_RECORD_MISSING"},
        {"id": "package-without-impact", "changed_path": "package.json", "impact_record_present": False, "expected_diagnostic": "COV_IMPACT_RECORD_MISSING"},
        {"id": "prf010-without-impact", "changed_path": "kernel/validator/validate-coverage-guarantee-prf010.mjs", "impact_record_present": False, "expected_diagnostic": "COV_IMPACT_RECORD_MISSING"},
        {"id": "legacy-without-impact", "changed_path": "kernel/validator/validate-coverage-guarantee-legacy.mjs", "impact_record_present": False, "expected_diagnostic": "COV_IMPACT_RECORD_MISSING"},
        {"id": "workflow-impact-path-mismatch", "changed_path": ".github/workflows/validate-mvk.yml", "impact_record_present": True, "expected_diagnostic": "COV_IMPACT_CHANGED_PATHS_MISMATCH"},
    ],
}
dump(aggregate_path, aggregate_cases)

fixture_template = {
    "fixture_version": "1.0.0",
    "fixture_kind": "invalid",
    "expected_diagnostic_codes": ["COV_IMPACT_RECORD_MISSING"],
    "scenario": {
        "base": "canonical_coverage_bundle",
        "mutations": [{"op": "replace_artifact", "artifact": "impacts", "value": []}],
        "changed_paths": [],
        "runtime_context": {
            "repository": "rezahh107/EV4-Decision-Kernel",
            "pullRequestNumber": 43,
            "baseSha": BASE,
            "expectedBaseSha": BASE,
            "currentWorkPackage": "DCOV-EXEC-001",
        },
    },
}
for slug, changed in (
    ("workflow", ".github/workflows/validate-mvk.yml"),
    ("package", "package.json"),
    ("prf010-validator", "kernel/validator/validate-coverage-guarantee-prf010.mjs"),
    ("legacy-validator", "kernel/validator/validate-coverage-guarantee-legacy.mjs"),
):
    fixture = json.loads(json.dumps(fixture_template))
    fixture["scenario"]["changed_paths"] = [changed]
    dump(f"kernel/fixtures/coverage-guarantee/invalid/impact-missing-{slug}.json", fixture)

mismatch = json.loads(json.dumps(fixture_template))
mismatch["expected_diagnostic_codes"] = ["COV_IMPACT_CHANGED_PATHS_MISMATCH"]
mismatch["scenario"]["mutations"] = []
mismatch["scenario"]["changed_paths"] = [".github/workflows/validate-mvk.yml"]
dump("kernel/fixtures/coverage-guarantee/invalid/impact-enforcement-paths-mismatch.json", mismatch)

# Keep the wrapper aggregate fixture path aligned.
wrapper_path = ROOT / "kernel/validator/validate-coverage-guarantee.mjs"
wrapper = wrapper_path.read_text(encoding="utf-8").replace(
    "kernel/fixtures/coverage-guarantee/invalid/enforcement-surface-impact-mutations.json",
    aggregate_path,
)
wrapper_path.write_text(wrapper, encoding="utf-8")

impact_path = "planning/coverage/impacts/dcov-exec-001.bootstrap.json"
impact = load(impact_path)
impact["reason"] = "introduces_proposed_coverage_measurement_system_pending_external_promotion"
impact["coverage_state_after"] = "not_measurable"
impact["zero_delta"] = True
impact["blocking_defect"] = {
    "defect_id": "PRF-001-EXTERNAL-GOVERNANCE-AUTHORITY-MISSING",
    "reason": "The target repository has no separately supplied external project-owner governance approval carrier.",
}
impact["next_content_expansion_package"] = "KROAD-012"
if "External project-owner governance approval is absent; Coverage policy remains non-active." not in impact["known_gaps"]:
    impact["known_gaps"].append("External project-owner governance approval is absent; Coverage policy remains non-active.")
dump(impact_path, impact)

# Remove temporary automation before validation and final commit.
for temporary in (
    "tools/apply-prf-001-003-repair.py",
    ".github/workflows/apply-prf-001-003-repair.yml",
):
    path = ROOT / temporary
    if path.exists():
        path.unlink()

# Recompute the exact sensitive diff under the repaired classifier.
def lines(*args: str) -> set[str]:
    output = run(*args, capture=True)
    return {line.strip() for line in output.splitlines() if line.strip()}

changed = lines("git", "diff", "--name-only", f"{BASE}..HEAD")
changed |= lines("git", "diff", "--name-only")
changed |= lines("git", "ls-files", "--others", "--exclude-standard")
patterns = contract["coverage_sensitive_paths"]
sensitive = sorted(path for path in changed if any(path == pattern or path.startswith(pattern) for pattern in patterns))
impact = load(impact_path)
impact["changed_paths"] = sensitive
dump(impact_path, impact)

run("git", "diff", "--check")
run("npm", "ci")
head = run("git", "rev-parse", "HEAD", capture=True)
env = dict(__import__("os").environ)
env.update({
    "COVERAGE_REPOSITORY": "rezahh107/EV4-Decision-Kernel",
    "COVERAGE_PR_NUMBER": "43",
    "COVERAGE_BASE_SHA": BASE,
    "COVERAGE_HEAD_SHA": head,
})
run("node", "--check", "kernel/validator/validate-coverage-guarantee.mjs")
run("node", "--check", "kernel/validator/validate-coverage-guarantee-prf010.mjs")
run("node", "--check", "kernel/validator/validate-coverage-guarantee-legacy.mjs")
run("npm", "run", "validate:coverage", env=env)
run("npm", "run", "validate:roadmap-memory", env=env)
run("npm", "run", "validate:kroad-010-history-matrix", env=env)

run("git", "config", "user.name", "github-actions[bot]")
run("git", "config", "user.email", "41898282+github-actions[bot]@users.noreply.github.com")
run("git", "add", "-A")
run("git", "commit", "-m", "fix(coverage): restore external authority and enforcement coverage")
run("git", "push", "origin", f"HEAD:{BRANCH}")
