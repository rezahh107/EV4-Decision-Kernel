#!/usr/bin/env python3
"""Invoke the immutable PR Inspector v1.10.2 completion boundary."""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path

import yaml


PROTOCOL_VERSION = "v1.10.2"
INSPECTOR_REPOSITORY = "rezahh107/PR-Inspector"
INSPECTOR_REPOSITORY_ID = 1288323264
INSPECTOR_COMMIT = "9ed48bd995ee5b9270756254b04c1d48ccf21cbe"
RELEASE_LOCK_PATH = "release-locks/v1.10.2.sha256"
SEQUENCE_CONTEXT = "Validate rereview sequence enforcement"
SEQUENCE_APP_ID = 15368
SEQUENCE_WORKFLOW_PATH = ".github/workflows/validate-rereview-sequence.yml"
VALIDATOR_FRAGMENT = "scripts/validate_rereview_sequence.py"


def arguments() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspector-root", type=Path, required=True)
    parser.add_argument("--review-directory", type=Path, required=True)
    parser.add_argument("--inspector-commit", choices=[INSPECTOR_COMMIT], required=True)
    parser.add_argument("--target-repository", required=True)
    parser.add_argument("--pr-number", type=int, required=True)
    parser.add_argument("--reviewed-head-sha", required=True)
    parser.add_argument("--reviewed-scope-revision", required=True)
    return parser.parse_args()


def git(root: Path, *args: str) -> str:
    return subprocess.check_output(["git", *args], cwd=root, text=True).strip()


def parse_release_lock(text: str) -> dict[str, str]:
    entries: dict[str, str] = {}
    for line in text.splitlines():
        if not line:
            continue
        parts = line.split("  ", 1)
        if len(parts) != 2 or len(parts[0]) != 64 or any(c not in "0123456789abcdef" for c in parts[0]):
            raise ValueError("active release lock is malformed")
        digest, relative_path = parts
        if relative_path in entries:
            raise ValueError("active release lock contains a duplicate path")
        entries[relative_path] = digest
    return entries


def verify_active_snapshot(root: Path) -> None:
    if (root / "CURRENT_VERSION").read_text(encoding="utf-8").strip() != PROTOCOL_VERSION:
        raise ValueError("active CURRENT_VERSION does not match v1.10.2")
    manifest = yaml.safe_load((root / "protocol-manifest.yaml").read_text(encoding="utf-8"))
    if not isinstance(manifest, dict):
        raise ValueError("active protocol manifest is invalid")
    if (
        manifest.get("active_version") != PROTOCOL_VERSION
        or manifest.get("status") != "active"
        or manifest.get("entrypoint") != "BOOTSTRAP.md"
        or manifest.get("release_lock") != RELEASE_LOCK_PATH
        or manifest.get("canonical_contract") != f"protocols/{PROTOCOL_VERSION}/PR_REVIEW_CONTRACT.md"
        or manifest.get("canonical_schema") != f"protocols/{PROTOCOL_VERSION}/schemas/review-package.schema.json"
    ):
        raise ValueError("active protocol manifest identity is invalid")
    load_order = manifest.get("load_order")
    if (
        not isinstance(load_order, list)
        or not load_order
        or len(load_order) != len(set(load_order))
        or any(not isinstance(item, str) or not item.startswith(f"protocols/{PROTOCOL_VERSION}/") for item in load_order)
    ):
        raise ValueError("active protocol load order is invalid")
    lock = parse_release_lock((root / RELEASE_LOCK_PATH).read_text(encoding="utf-8"))
    if set(lock) != set(load_order):
        raise ValueError("active release lock does not cover the exact load order")
    for relative_path in load_order:
        raw = (root / relative_path).read_bytes()
        if hashlib.sha256(raw).hexdigest() != lock[relative_path]:
            raise ValueError(f"active release lock mismatch: {relative_path}")
    trust = json.loads(
        (root / f"protocols/{PROTOCOL_VERSION}/trust/INSPECTOR_TRUST_POLICY.json").read_text(encoding="utf-8")
    )
    if (
        trust.get("protocol_version") != PROTOCOL_VERSION
        or trust.get("inspector_repository") != INSPECTOR_REPOSITORY
        or trust.get("inspector_repository_id") != INSPECTOR_REPOSITORY_ID
        or trust.get("commit_evidence_source") != "github_rest_api_https"
    ):
        raise ValueError("active Inspector trust policy is invalid")


def exact_checkout(args: argparse.Namespace) -> None:
    if git(args.inspector_root, "rev-parse", "HEAD") != args.inspector_commit:
        raise ValueError("inspector checkout does not match the pinned release commit")
    remote = git(args.inspector_root, "remote", "get-url", "origin")
    if remote not in {
        "https://github.com/rezahh107/PR-Inspector.git",
        "https://github.com/rezahh107/PR-Inspector",
        "git@github.com:rezahh107/PR-Inspector.git",
    }:
        raise ValueError("inspector checkout remote is not canonical")
    if git(args.inspector_root, "status", "--porcelain=v1", "--untracked-files=all"):
        raise ValueError("inspector checkout is not an immutable clean worktree")
    verify_active_snapshot(args.inspector_root)


def git_blob_sha(raw: bytes) -> str:
    return hashlib.sha1(b"blob " + str(len(raw)).encode() + b"\0" + raw).hexdigest()


def local_workflow_proof(payload: dict, head_sha: str) -> tuple[str, str]:
    if payload.get("type") != "file" or payload.get("path") != SEQUENCE_WORKFLOW_PATH:
        raise ValueError("designated workflow path is not authoritative")
    if payload.get("encoding") != "base64" or not isinstance(payload.get("content"), str):
        raise ValueError("designated workflow bytes are unavailable")
    raw = base64.b64decode(payload["content"].replace("\n", ""), validate=True)
    if raw.startswith(b"\xef\xbb\xbf") or b"\r" in raw or not raw.endswith(b"\n"):
        raise ValueError("designated workflow byte encoding is not canonical")
    if payload.get("sha") != git_blob_sha(raw):
        raise ValueError("designated workflow Git blob identity is invalid")
    workflow = yaml.safe_load(raw.decode("utf-8"))
    if not isinstance(workflow, dict) or workflow.get("name") != SEQUENCE_CONTEXT:
        raise ValueError("designated check context is missing")
    triggers = workflow.get("on", workflow.get(True))
    if not isinstance(triggers, dict) or "pull_request" not in triggers:
        raise ValueError("designated workflow is not a pull-request producer")
    if workflow.get("permissions") != {"contents": "read"}:
        raise ValueError("designated workflow minimum permissions are missing")
    jobs = workflow.get("jobs")
    if not isinstance(jobs, dict):
        raise ValueError("designated workflow jobs are missing")
    matching_jobs = [job for job in jobs.values() if isinstance(job, dict) and job.get("name") == SEQUENCE_CONTEXT]
    if len(matching_jobs) != 1:
        raise ValueError("designated producer job is missing or ambiguous")
    job = matching_jobs[0]
    if job.get("permissions", {"contents": "read"}) != {"contents": "read"}:
        raise ValueError("designated producer job permissions are not read-only")
    steps = job.get("steps")
    if not isinstance(steps, list) or not all(isinstance(step, dict) for step in steps):
        raise ValueError("designated producer steps are invalid")
    external_uses = [
        step["uses"]
        for step in steps
        if isinstance(step.get("uses"), str) and not step["uses"].startswith(("./", "docker://"))
    ]
    for uses in external_uses:
        ref = uses.rsplit("@", 1)[-1]
        if len(ref) != 40 or any(char not in "0123456789abcdefABCDEF" for char in ref):
            raise ValueError("designated workflow contains a mutable action reference")
    checkouts = [step for step in steps if str(step.get("uses", "")).startswith("actions/checkout@")]
    if len(checkouts) != 2 or any(step.get("with", {}).get("persist-credentials") is not False for step in checkouts):
        raise ValueError("designated workflow checkout identity is incomplete")
    target_checkout = next((step for step in checkouts if "repository" not in step.get("with", {})), None)
    inspector_checkout = next(
        (step for step in checkouts if step.get("with", {}).get("repository") == INSPECTOR_REPOSITORY), None
    )
    if target_checkout is None or target_checkout.get("with", {}).get("ref") != "${{ github.event.pull_request.head.sha }}":
        raise ValueError("designated target checkout is not exact-head-bound")
    if inspector_checkout is None or inspector_checkout.get("with", {}).get("ref") != INSPECTOR_COMMIT:
        raise ValueError("designated PR Inspector checkout is not immutably pinned")
    validator_steps = [step for step in steps if isinstance(step.get("run"), str) and VALIDATOR_FRAGMENT in step["run"]]
    expected_command = (
        "python _external/pr-inspector/scripts/validate_rereview_sequence.py "
        "artifacts/pr-inspector-rereview-sequence.pending.json"
    )
    if len(validator_steps) != 1 or validator_steps[0]["run"].strip() != expected_command:
        raise ValueError("designated workflow does not execute the official sequence validator exactly once")
    if not any("git rev-parse HEAD" in str(step.get("run", "")) for step in steps):
        raise ValueError("designated workflow does not assert the exact checked-out head")
    return head_sha, expected_command


def main() -> int:
    args = arguments()
    exact_checkout(args)
    if not args.reviewed_scope_revision.startswith("sha256:") or len(args.reviewed_scope_revision) != 71:
        raise ValueError("reviewed scope revision is invalid")
    sys.path.insert(0, str(args.inspector_root))

    from scripts.validate_rereview_sequence import _fetch_governance
    from pr_inspector.governance import fetch_github_api_response, github_response_payload
    from pr_inspector.official_review import github_pull_request_head_source, verify_completed_review
    from pr_inspector.review_provenance import trust_policy, verify_github_commit_payload
    from pr_inspector.sequence_enforcement import verify_sequence_ci_enforcement, verify_sequence_producer_evidence

    policy = trust_policy()
    api_version = policy["github_api_version"]
    token = os.environ.get("AIGOV_GITHUB_TOKEN")
    inspector_repo_url = f"https://api.github.com/repos/{INSPECTOR_REPOSITORY}"
    inspector_commit_url = f"{inspector_repo_url}/commits/{args.inspector_commit}"
    inspector_main_url = f"{inspector_repo_url}/commits/main"
    inspector_compare_url = f"{inspector_repo_url}/compare/{args.inspector_commit}...main"
    inspector_repo_response = fetch_github_api_response(inspector_repo_url, token=token, api_version=api_version)
    inspector_commit_response = fetch_github_api_response(inspector_commit_url, token=token, api_version=api_version)
    inspector_main_response = fetch_github_api_response(inspector_main_url, token=token, api_version=api_version)
    inspector_compare_response = fetch_github_api_response(inspector_compare_url, token=token, api_version=api_version)
    inspector_commit = verify_github_commit_payload(
        github_response_payload(inspector_repo_response),
        github_response_payload(inspector_commit_response),
        expected_commit_sha=args.inspector_commit,
    )
    repo_payload = github_response_payload(inspector_repo_response)
    main_payload = github_response_payload(inspector_main_response)
    compare_payload = github_response_payload(inspector_compare_response)
    if (
        inspector_commit.repository_id != INSPECTOR_REPOSITORY_ID
        or inspector_commit.repository != INSPECTOR_REPOSITORY
        or repo_payload.get("default_branch") != "main"
    ):
        raise ValueError("inspector repository identity is not trusted")
    if (
        not isinstance(main_payload, dict)
        or not isinstance(compare_payload, dict)
        or compare_payload.get("status") not in {"ahead", "identical"}
        or compare_payload.get("base_commit", {}).get("sha") != args.inspector_commit
        or compare_payload.get("merge_base_commit", {}).get("sha") != args.inspector_commit
        or compare_payload.get("head_commit", {}).get("sha") != main_payload.get("sha")
    ):
        raise ValueError("active Inspector release commit is not on official main")

    event = {
        "target_repository": args.target_repository,
        "pr_number": args.pr_number,
        "resulting_head_sha": args.reviewed_head_sha,
    }
    governance = _fetch_governance(
        event,
        token=token,
        api_version=api_version,
        specialist_requirement=None,
    )
    workflow_url = (
        f"https://api.github.com/repos/{args.target_repository}/contents/"
        f"{SEQUENCE_WORKFLOW_PATH}?ref={args.reviewed_head_sha}"
    )
    workflow_response = fetch_github_api_response(workflow_url, token=token, api_version=api_version)
    workflow_payload = github_response_payload(workflow_response)
    if not isinstance(workflow_payload, dict):
        raise ValueError("designated workflow payload is not an object")
    workflow_sha, validator_command = local_workflow_proof(workflow_payload, args.reviewed_head_sha)

    sequence = None
    sequence_error = None
    try:
        producer = verify_sequence_producer_evidence(
            governance,
            check_context=SEQUENCE_CONTEXT,
            app_id=SEQUENCE_APP_ID,
            workflow_path=SEQUENCE_WORKFLOW_PATH,
            workflow_sha=workflow_sha,
            validator_command=validator_command,
        )
        sequence = verify_sequence_ci_enforcement(
            governance,
            check_context=SEQUENCE_CONTEXT,
            app_id=SEQUENCE_APP_ID,
            producer_evidence=producer,
        )
    except ValueError as exc:
        sequence_error = str(exc)

    head_source = github_pull_request_head_source(
        args.target_repository,
        args.pr_number,
        token=token,
        api_version=api_version,
    )
    completion = verify_completed_review(
        args.review_directory,
        head_source=head_source,
        governance_evidence=governance,
        sequence_enforcement=sequence,
    )
    package = json.loads((args.review_directory / "review-package.json").read_text(encoding="utf-8"))
    identity = package.get("review_identity", {})
    if (
        package.get("protocol_version") != PROTOCOL_VERSION
        or identity.get("inspector_commit_sha") != INSPECTOR_COMMIT
        or identity.get("target_repository") != args.target_repository
        or identity.get("pr_number") != args.pr_number
        or identity.get("reviewed_head_sha") != args.reviewed_head_sha
    ):
        raise ValueError("official review package identity does not match the active review context")
    projection = completion.decision_projection()
    result = {
        "status": "pass",
        "protocol_version": completion.protocol_version,
        "target_repository": completion.target_repository,
        "pr_number": completion.pr_number,
        "reviewed_head_sha": completion.reviewed_head_sha,
        "reviewed_scope_revision": args.reviewed_scope_revision,
        "technical_status": projection["technical_status"],
        "next_action_kind": projection["next_action"]["kind"],
        "next_action_may_modify_code": projection["next_action"]["may_modify_code"],
        "security_profile": projection["security_profile"],
        "sequence_capability_verified": sequence is not None,
        "sequence_capability_limitation": sequence_error,
        "governance_evidence_status": governance.enforcement_status,
        "inspector_repository": inspector_commit.repository,
        "inspector_repository_id": inspector_commit.repository_id,
        "inspector_commit_sha": inspector_commit.commit_sha,
        "inspector_current_main_sha": main_payload["sha"],
        "active_release_on_official_main": True,
        "review_package_canonical_sha256": completion.review_package_canonical_sha256,
        "review_package_file_sha256": completion.review_package_file_sha256,
        "decision_projection_sha256": completion.decision_projection_sha256,
        "artifact_manifest_sha256": completion.artifact_manifest_sha256,
        "artifact_byte_hashes": dict(completion.artifact_sha256),
    }
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"PRI-OFFICIAL-V1102-LIVE-001: {exc}", file=sys.stderr)
        raise SystemExit(1)
