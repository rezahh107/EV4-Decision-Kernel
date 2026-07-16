#!/usr/bin/env python3
from __future__ import annotations

import argparse
import copy
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


EXPECTED_PROTOCOL = "v1.10.2"
EXPECTED_COMMIT = "9ed48bd995ee5b9270756254b04c1d48ccf21cbe"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inspector-root", type=Path, required=True)
    args = parser.parse_args()
    assert (args.inspector_root / "CURRENT_VERSION").read_text(encoding="utf-8").strip() == EXPECTED_PROTOCOL
    assert (args.inspector_root / ".git").exists()
    sys.path.insert(0, str(args.inspector_root))

    from pr_inspector._governance_transport import _mint_response
    from pr_inspector.decision_projection import project_decision
    from pr_inspector.governance import verify_github_governance_source, verify_governance_record
    from pr_inspector.sequence_enforcement import (
        SEQUENCE_ENFORCEMENT_CHECK_CONTEXT,
        verify_sequence_ci_enforcement,
        verify_sequence_producer_evidence,
    )

    package = json.loads((args.inspector_root / "fixtures/golden-green/review-package.json").read_text())
    assert package["protocol_version"] == EXPECTED_PROTOCOL
    bare = project_decision(package)
    assert bare["technical_status"] == "YELLOW_CHANGES_OR_VERIFICATION_REQUIRED"
    assert bare["next_action"]["kind"] == "verify"
    assert bare["next_action"]["may_modify_code"] is False
    assert bare["security_profile"]["sequence_ci_enforced"] is False
    assert "RSN-MERGE-ENFORCEMENT-MINIMUM-MISSING" in bare["security_profile"]["reason_codes"]

    raw = json.loads((args.inspector_root / "fixtures/governance/verified-enforced.json").read_text())
    raw = copy.deepcopy(raw)
    raw["responses"]["checks"]["payload"]["check_runs"][0]["name"] = SEQUENCE_ENFORCEMENT_CHECK_CONTEXT
    protection = raw["responses"]["branch_protection"]["payload"]["required_status_checks"]
    protection["checks"][0]["context"] = SEQUENCE_ENFORCEMENT_CHECK_CONTEXT
    protection["contexts"] = [SEQUENCE_ENFORCEMENT_CHECK_CONTEXT]
    now = datetime.now(timezone.utc)
    responses = {
        key: _mint_response(
            request_url=value["url"], response_url=value["url"],
            status_code=value["status_code"], fetched_at=now, payload=value["payload"]
        )
        for key, value in raw["responses"].items()
    }
    source = verify_github_governance_source(
        responses, expected_repository="example/project", expected_pr_number=42,
        expected_head_sha="1" * 40,
    )
    governance = verify_governance_record(
        source, expected_repository="example/project", expected_pr_number=42,
        expected_head_sha="1" * 40,
    )
    try:
        verify_sequence_ci_enforcement(
            governance, check_context=SEQUENCE_ENFORCEMENT_CHECK_CONTEXT,
            app_id=15368, producer_evidence=None,
        )
    except ValueError:
        pass
    else:
        raise AssertionError("same-App check without producer proof was accepted")

    producer = verify_sequence_producer_evidence(
        governance,
        check_context=SEQUENCE_ENFORCEMENT_CHECK_CONTEXT,
        app_id=15368,
        workflow_path=".github/workflows/validate-rereview-sequence.yml",
        workflow_sha="2" * 40,
        validator_command="python scripts/validate_rereview_sequence.py sequence.json",
    )
    capability = verify_sequence_ci_enforcement(
        governance,
        check_context=SEQUENCE_ENFORCEMENT_CHECK_CONTEXT,
        app_id=15368,
        producer_evidence=producer,
    )
    accepted = project_decision(package, sequence_enforcement=capability)
    assert accepted["technical_status"] == "GREEN_TECHNICALLY_READY"
    serialized = {
        "evidence_id": capability.evidence_id,
        "repository": capability.repository,
        "pull_request_number": capability.pull_request_number,
        "exact_head_sha": capability.exact_head_sha,
    }
    rejected = project_decision(package, sequence_enforcement=serialized)
    assert rejected["technical_status"] == "YELLOW_CHANGES_OR_VERIFICATION_REQUIRED"
    assert rejected["security_profile"]["sequence_ci_enforced"] is False
    print(json.dumps({
        "suite": "official-pr-inspector-security-capability-v1102",
        "status": "pass",
        "protocol_version": EXPECTED_PROTOCOL,
        "inspector_commit_sha": EXPECTED_COMMIT,
    }))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
