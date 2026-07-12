# KROAD-011 Project Gate Intake Evidence Closure

**Status:** completed  
**Scope:** cross-repository evidence closure for `KROAD-011 — Project Gate Intake`  
**Owner:** Kernel roadmap memory; implementation owner remains `rezahh107/EV4-Project-Gate`  
**Validated Project Gate commit:** `c030460aa90b0b234c2e421554d4f8eb45061210`  
**Current Project Gate main:** `2ed9c256160e177605c08d3250d5ea7836b6bbf0`  
**Pinned Kernel commit:** `76a82e28543ff8f0babca11b7d7dccac96b92894`  
**Roadmap authority:** `planning/NEXT_WORK.md`

## Scope and closure decision

This record closes KROAD-011 because the required Project Gate implementation, correction, exact corrected-main validation, immutable Kernel pin, official Kernel bridge execution, adversarial fixtures, result-envelope validation, capability truth, and governance-carrier evidence are all present.

The implementation remains owned by `rezahh107/EV4-Project-Gate`. This Kernel repository records the accepted cross-repository evidence and advances the roadmap only. It does not copy Project Gate-owned schemas or validators into Kernel and does not redefine Kernel Resolver or L2 semantics.

```text
final_decision: KROAD-011_CLOSED
next_allowed: KROAD-012
KROAD-012_started: false
```

## EV4-Project-Gate repository identity

```text
repository: rezahh107/EV4-Project-Gate
default_branch: main
validated_main_commit: c030460aa90b0b234c2e421554d4f8eb45061210
current_main_commit: 2ed9c256160e177605c08d3250d5ea7836b6bbf0
validated_commit_relation: current main is one commit ahead
post_validation_commit: 2ed9c256160e177605c08d3250d5ea7836b6bbf0
post_validation_commit_message: docs: record merged PR #52 in historical ledger
post_validation_changed_path: docs/EV4_SHARED_CONTRACTS_STATUS.md
post_validation_semantic_classification: historical-ledger-only
```

GitHub compare evidence established that the only commit after the validated commit changes one historical ledger line. It does not modify KROAD-011 source code, schemas, validators, fixtures, tests, workflows, dependencies, locks, capability truth, governance enforcement, or validation semantics. Therefore `c030460...` is materially equivalent to the current `main` head for the KROAD-011 acceptance surface.

## PR #51 implementation evidence

```text
pull_request: 51
title: Implement KROAD-011 Project Gate Kernel decision intake
branch: feature/kroad-011-project-gate-intake
head_sha: 765fd4b1f086141e6453bd57ed4674d2025caf73
merge_commit_sha: 01fdc126f834e0c0d8fbb297a2d44488487e5379
state: merged
```

PR #51 implemented the Project Gate-owned intake path, result envelope, semantic lock consumption, official pinned Kernel bridge, Final Gate integration, fixtures, tests, and documentation. Its PR-associated KROAD workflow succeeded, but that PR-head evidence is retained only as implementation-review evidence and is not relabelled as corrected-main evidence.

## PR #52 correction evidence

```text
pull_request: 52
title: Post-merge KROAD-011 evidence and governance correction
branch: fix/kroad-011-evidence-and-governance-correction
head_sha: 9b3c48634f8921446979c1b93c1bc4f3eae8ed13
merge_commit_sha: c030460aa90b0b234c2e421554d4f8eb45061210
state: merged
```

PR #52 applied the bounded correction set:

- reconciled capability and implementation-status memory with the merged KROAD-011 state;
- replaced the nonexistent governance carrier with the real `run_final_gate` enforcement symbol;
- added side-effect-free AST carrier-existence validation;
- added explicit adversarial provenance, evidence, Resolver, runtime-overclaim, and deterministic-rejection coverage;
- changed the KROAD workflow push trigger to `main`;
- preserved Project Gate ownership and Kernel canonical authority.

## Exact corrected-main workflow evidence

```text
repository: rezahh107/EV4-Project-Gate
workflow_name: KROAD-011 Project Gate Intake
workflow_file: .github/workflows/kroad-011.yml
run_id: 29185523846
run_url: https://github.com/rezahh107/EV4-Project-Gate/actions/runs/29185523846
event: workflow_dispatch
head_branch: main
head_sha: c030460aa90b0b234c2e421554d4f8eb45061210
status: completed
conclusion: success
job_id: 86630804777
job_name: kroad-011
job_conclusion: success
earliest_observed_job_log_timestamp: 2026-07-12T08:14:30.8229453Z
```

The workflow summary explicitly recorded:

```text
KROAD-011 validated source head c030460aa90b0b234c2e421554d4f8eb45061210 against Kernel 76a82e28543ff8f0babca11b7d7dccac96b92894
```

The GitHub connector did not expose a separate run-level `created_at` / `completed_at` payload. The exact tested head, branch, job identity, step conclusions, artifact association, earliest job-log timestamp, and artifact timestamp are recorded instead without inventing missing timestamps.

## Job and step evidence

The single required job completed successfully. Every applicable control step reported `success`:

| Step | Conclusion |
|---|---|
| Checkout Project Gate | success |
| Checkout pinned Decision Kernel | success |
| Install uv | success |
| Setup Python | success |
| Setup Node | success |
| Verify Project Gate uv lockfile | success |
| Install Project Gate package | success |
| Install pinned Kernel toolchain | success |
| Validate pinned Kernel MVK | success |
| Compute immutable Kernel semantic lock | success |
| Verify committed semantic lock when present | success |
| Run official pinned Kernel bridge smoke | success |
| Run focused Final Gate CLI and KROAD tests | success |
| Run complete Project Gate pytest suite | success |
| Verify capability truth | success |
| Verify workflow permissions | success |
| Verify GitHub Action pins | success |
| Verify runner boundary | success |
| Run Node status | success |
| Run Node validation | success |
| Upload KROAD-011 validation artifacts | success |
| Record exact tested head | success |

The workflow uses read-only repository permissions and immutable action SHAs.

## Artifact evidence

```text
artifact_id: 8257869671
artifact_name: kroad-011-validation-artifacts
digest: sha256:7bed55cfb64156872edcac1d31d4b584476abb8da6bb41501fc23579221fed83
size_in_bytes: 1568
created_at: 2026-07-12T08:15:06Z
expires_at: 2026-10-10T08:14:28Z
expired: false
workflow_run_id: 29185523846
workflow_run_head_branch: main
workflow_run_head_sha: c030460aa90b0b234c2e421554d4f8eb45061210
```

The artifact was downloaded and inspected. It contains:

```text
kernel-decision-intake-lock-computed.json
kernel-bridge-output.json
kroad-011-pytest.log
```

Observed contents:

```text
full_pytest: 407 passed, 24 skipped in 8.56s
bridge_schema_version: project-gate-kernel-l2-bridge.v1
bridge_execution_status: completed
kernel_audit_status: pass
resolver_status: auto_resolved
selected_option: flexbox
```

## Six pinned Kernel-owned artifacts

All six semantic dependencies are owned by `rezahh107/EV4-Decision-Kernel` and pin the accepted Kernel commit `76a82e28543ff8f0babca11b7d7dccac96b92894`.

| Role | Contract identity | Kernel path | SHA-256 file bytes |
|---|---|---|---|
| Decision Record schema | `decision-record.v2` | `kernel/schemas/decision-record.v2.schema.json` | `a20bfa42335d9696d259abb5e1c6a78e2d8a2a7df4e56bfa2d4eb68a6f9293fa` |
| L2 correctness audit | `auditDecisionRecord` | `kernel/validator/validate-l2-decision-correctness.mjs` | `980c249b1ae73e0f3b8d65a6c68c63111e2ad8d660cd9965b899c8fec0fca3c1` |
| Active layout rule | `resolver.contract.layout_structure.mvp.v0` | `kernel/decision-governance/resolver-rules/layout-structure.v0.json` | `30eefbb322bdc70038be3eda5751a809956df138dcbe9a0e294134c628eada0d` |
| P0 matrices | `p0-decision-matrices.v0` | `kernel/decision-governance/p0-decision-matrices.v0.json` | `e5f0d357fe5b5aadf8f9c0075d079263d3de85bcc877c83fe1f7563b8ebe2cc7` |
| Resolver implementation | `resolveDecision` | `kernel/resolver-mvp/resolve-high-risk-p0.mjs` | `f716af66c65762b688484d72a27c5c5a2d1ea858589b34ae2cf9f8ad0846af62` |
| Resolver registry | `resolver-rule-registry.v0` | `kernel/decision-governance/resolver-rule-registry.v0.json` | `efb96e7b24d206507784eeff3f2e1e834368430b79f8d1fe60bc38c40aac208c` |

The committed Project Gate semantic lock reproduced byte-for-byte against these official Kernel artifacts.

## Project Gate-owned implementation paths

The accepted implementation remains in Project Gate:

```text
schemas/kernel-decision-intake/kernel-decision-intake.v1.schema.json
schemas/kernel-decision-intake-result/kernel-decision-intake-result.v1.schema.json
contracts/locks/kernel-decision-intake.v1.lock.json
src/ev4_transition/kernel_decision_dependencies.py
src/ev4_transition/kernel_decision_intake.py
scripts/compute-kernel-decision-intake-lock.py
scripts/kernel-decision-intake-bridge.mjs
src/ev4_transition/transitions/final_gate.py
planning/DECISION_ESCAPE_ROUTES.yml
src/ev4_transition/data/capability-status.v1.json
docs/IMPLEMENTATION_STATUS.yaml
fixtures/kernel-decision-intake/cases.synthetic.json
tests/kernel_decision_intake/test_kernel_decision_intake.py
tests/planning/test_decision_escape_routes_schema.py
tests/transitions/test_final_gate.py
```

Project Gate consumes the official pinned Kernel Resolver and L2 implementation through the bridge. It does not introduce a competing canonical Kernel schema, Resolver rule, Resolver implementation, L2 validator, or P0 matrix.

## Governance carrier and carrier-existence enforcement

The KROAD-011 escape-route carrier points to the actual enforcement function:

```text
src/ev4_transition/transitions/final_gate.py::run_final_gate
```

`tests/planning/test_decision_escape_routes_schema.py` performs side-effect-free AST validation that local Python carrier paths and top-level symbols exist. This is enforcement evidence, not documentation-only evidence.

## Capability-truth evidence

The exact-main workflow successfully ran:

```text
uv run python scripts/check-capability-truth.py
```

The active capability source remains:

```text
src/ev4_transition/data/capability-status.v1.json
```

`docs/IMPLEMENTATION_STATUS.yaml` is aligned with that source. The historical merge ledger is explicitly non-authoritative and cannot upgrade PR-head evidence into exact-main evidence.

## Adversarial fixtures and deterministic-result evidence

The synthetic suite includes explicit expected statuses, Project Gate diagnostic codes, diagnostic paths, and upstream diagnostic codes. Required coverage includes:

- full-length unsupported Kernel commit SHA;
- missing packet provenance;
- broken `provenance_ref`;
- asserted-claim provenance mismatch;
- asserted-claim source mismatch;
- missing required evidence;
- under-tier or Resolver-unresolvable intake;
- runtime/browser claim without runtime proof;
- deterministic repeated rejection with stable canonical serialization and digest.

All fixtures remain explicitly synthetic. They prove deterministic validator behavior, not a real external handoff.

## Result-envelope schema validation

Produced results are validated against:

```text
schemas/kernel-decision-intake-result/kernel-decision-intake-result.v1.schema.json
```

The focused KROAD tests and complete Project Gate suite succeeded on the validated corrected-main commit. Result-envelope conformance is therefore part of the observed exact-main test evidence.

## Official Kernel Resolver and L2 consumption evidence

The run checked out Kernel commit `76a82e...`, installed its toolchain, ran `npm run validate:mvk`, reproduced the semantic lock, and executed `scripts/kernel-decision-intake-bridge.mjs`.

The inspected bridge result reported:

```text
bridge_schema_version: project-gate-kernel-l2-bridge.v1
execution_status: completed
kernel_audit.audit_status: pass
kernel_audit.resolver_output.resolver_status: auto_resolved
kernel_audit.resolver_output.selected_option.option_id: flexbox
kernel_audit.resolver_output.rule_id: resolver.rule.layout_structure.mvp.v0
kernel_audit.resolver_output.rule_version: 0.1.0
```

This establishes consumption of the pinned official Kernel behavior rather than a Project Gate redefinition.

## Remaining limitations and explicit non-claims

This closure does not prove or claim:

- a real non-synthetic cross-repository handoff;
- live downstream producer rejection;
- Builder execution;
- runtime or browser validation;
- responsive correctness;
- frontend correctness;
- full Resolver-family coverage beyond the active `layout_structure` family;
- ecosystem readiness;
- release readiness;
- production readiness;
- KROAD-012 implementation or start.

The historical ledger commit after the validated SHA is not treated as a new implementation result. PR-head CI is not relabelled as exact-main evidence. Documentation is not treated as enforcement. Synthetic fixtures are not treated as real handoff evidence.

## Final acceptance matrix

| Criterion | Result |
|---|---|
| Project Gate PR #51 merged | PASS |
| Project Gate PR #52 merged | PASS |
| Corrected implementation paths exist | PASS |
| Capability truth consistent | PASS |
| Governance carrier references real enforcement | PASS |
| Carrier-existence validation exists | PASS |
| Required adversarial fixtures exist | PASS |
| Deterministic rejection behavior tested | PASS |
| Exact corrected-main workflow successful | PASS |
| Required workflow job and controls successful | PASS |
| Semantic Kernel lock reproduced and compared | PASS |
| Official pinned Kernel bridge successful | PASS |
| Result envelopes schema-validated | PASS |
| No competing canonical Kernel contract in Project Gate | PASS |
| Explicit bounded non-claims preserved | PASS |
| Final decision | `KROAD-011_CLOSED` |
