# KROAD-010 Downstream Consumer Contract

**Status:** KROAD-010 implementation / Kernel-local  
**Scope:** one initial downstream consumer contract for `rezahh107/EV4-Architect-Repo`  
**Owner:** Kernel  
**Intended consumer:** Architect decision-output boundary

## Machine-readable artifacts

```text
kernel/schemas/downstream-consumer-contract.v0.schema.json
kernel/decision-governance/downstream-consumer-contract.v0.json
kernel/validator/validate-downstream-consumer-contract.mjs
kernel/fixtures/valid/downstream_consumer/
kernel/fixtures/invalid/downstream_consumer/
kernel/fixtures/adversarial/downstream_consumer/
```

## What this is

KROAD-010 defines a Kernel-owned contract for an Architect output that consumes a Kernel-governed decision explicitly. A resolver-backed record is accepted only when it identifies an immutable Kernel commit and all required artifacts resolve from that exact commit snapshot.

The initial consumer is exactly:

```text
rezahh107/EV4-Architect-Repo
role: architect
```

Architect was selected because it owns candidate generation, comparison, selection, and decision records, and the Kernel already has an Architect source/card consumption boundary. Extending that boundary is the smallest safe first consumer contract.

## What this is not

```text
- not a modification of EV4-Architect-Repo
- not live downstream enforcement
- not KROAD-011 Project Gate intake
- not runtime/browser evidence
- not external evidence producer integration
- not a re-audit policy
- not a new Resolver MVP family
- not Builder execution proof
- not real target-project proof
- not production readiness
```

The fixtures simulate consumer records inside the Kernel repository. Actual downstream enforcement still requires inspected rejection behavior in the selected downstream repository.

## Snapshot-bound Kernel pin

`kernel_pin.kernel_ref` is not accepted merely because it looks like a SHA. The validator requires that the commit:

```text
- exists in the local Git object database;
- is an ancestor of the validation head;
- contains the KROAD-010 contract path;
- contains every referenced matrix, card, registry, rule, schema, Decision Record, L2 result, and vertical-slice artifact;
- matches the current executable validation files used to rerun L2.
```

All referenced JSON is read with `git show <pinned-commit>:<path>`. The validator never falls back to the working tree when a pinned artifact is absent. CI checks out the pull-request head with full history so these checks are deterministic.

Important pin diagnostics include:

```text
DOWNSTREAM_CONSUMER_PINNED_COMMIT_UNAVAILABLE
DOWNSTREAM_CONSUMER_PINNED_COMMIT_NOT_ANCESTOR
DOWNSTREAM_CONSUMER_PINNED_CONTRACT_MISSING
DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING
DOWNSTREAM_CONSUMER_PINNED_EXECUTION_DRIFT
```

## Consumption states

```text
kernel_consumed
insufficient_evidence
```

### `kernel_consumed`

For resolver-covered `layout_structure`, the pinned snapshot must provide the exact matrix, decision card, resolver registry and rule, Decision Record v2 schema and record, L2 contract and passing result, and KROAD-009 vertical slice. The validator reads the referenced Decision Record from the pinned snapshot, reruns L2, and compares decision identity, resolver status, selected option, rule ID/version, provisional state, and evidence refs.

### `insufficient_evidence`

`insufficient_evidence` is a halt state, not a weaker decision channel. It requires:

```text
decision_id: null
resolver_status: null
selected_option_id: null
rule_id: null
rule_version: null
provisional: true
```

Decision-bearing refs must also be null:

```text
decision_card_ref
resolver_rule_ref
decision_record_ref
l2_audit_result_ref
vertical_slice_ref
```

`missing_kernel_refs` must equal that exact null-ref set, and evidence must be represented as `evidence_gap`. A covered family may use `l2_audit_status: not_run`; a resolver-uncovered family uses `l2_audit_status: unsupported`. Any retained fake decision or resolver carrier fails deterministically.

## Missing-reference and unsupported-family behavior

A claimed `kernel_consumed` record with missing refs fails closed. A family without an active resolver rule cannot borrow `layout_structure` artifacts and must remain no-decision `insufficient_evidence`.

Representative diagnostics:

```text
DOWNSTREAM_CONSUMER_REQUIRED_KERNEL_REF_MISSING
DOWNSTREAM_CONSUMER_DECISION_RECORD_REF_REQUIRED
DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_REQUIRED
DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_DECISION_FIELDS_FORBIDDEN
DOWNSTREAM_CONSUMER_INSUFFICIENT_EVIDENCE_ARTIFACT_REFS_FORBIDDEN
DOWNSTREAM_CONSUMER_MISSING_REF_SET_MISMATCH
DOWNSTREAM_CONSUMER_UNSUPPORTED_RESOLVER_FAMILY
```

## Synthetic evidence and no-overclaim boundary

Kernel fixture evidence cannot prove live downstream enforcement, real target-project correctness, runtime/browser validation, Builder execution, Project Gate acceptance, or production readiness. Each prohibited claim has a specific machine-readable diagnostic.

## Fixtures

Valid paths include snapshot-bound `layout_structure` consumption, covered-family no-decision `insufficient_evidence`, and unsupported-family no-decision `insufficient_evidence`.

Adversarial coverage includes:

```text
- fake resolver reuse for an unsupported family;
- synthetic-evidence overclaim;
- covered-family insufficient_evidence carrying a fake decision;
- unknown well-formed commit SHA;
- ancestor commit missing the KROAD-010 contract;
- working-tree-only artifact drift.
```

## Validation

```bash
npm run validate:downstream-consumer-contract
npm run validate:mvk
npm run validate:roadmap-memory
```

## Confirmed boundaries

```text
selected downstream target: EV4-Architect-Repo only
downstream repository modifications: none
live downstream enforcement: not claimed
active Resolver MVP families: layout_structure only
new Resolver MVP families: none
KROAD-011+: not implemented
Project Gate intake: not implemented
runtime/browser evidence: not implemented
Builder execution proof: not claimed
production readiness: not claimed
```

## Next allowed step

The next roadmap item is `KROAD-011 — Project Gate Intake`. It is not implemented by this contract.
