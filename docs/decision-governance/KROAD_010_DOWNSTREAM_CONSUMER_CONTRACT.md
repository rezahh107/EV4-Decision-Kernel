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

KROAD-010 defines a Kernel-owned contract for an Architect output that consumes a Kernel-governed decision explicitly. It prevents a resolver-covered decision from being represented as Kernel-backed unless the consumer record names the relevant matrix/card, active resolver rule, Decision Record v2, L2 audit contract/result, evidence/provenance, and immutable Kernel pin.

The initial consumer is exactly:

```text
rezahh107/EV4-Architect-Repo
role: architect
```

Architect was selected because Architect owns candidate generation, comparison, selection, and decision records, and the Kernel already has an Architect source/card consumption boundary. Extending that boundary is the smallest safe first consumer contract.

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

The fixtures simulate a consumer record inside the Kernel repository. They demonstrate the contract and deterministic rejection behavior only. Actual downstream enforcement requires a later inspected change in the selected downstream repository.

## Contract shape

Every record identifies:

```text
consumer identity
immutable Kernel commit pin
decision family
consumption status
Kernel artifact refs
Decision Record v2 output identity
resolver rule ID/version when resolver-backed
L2 audit status/result ref
evidence and provenance refs
unsupported/provisional/missing-ref handling
explicit no-overclaim acknowledgements
claims and limitations
```

Supported consumption statuses are:

```text
kernel_consumed
insufficient_evidence
```

## Resolver-covered `layout_structure` path

`layout_structure` is the only active Resolver MVP family. A `kernel_consumed` Architect record must reference the live Kernel graph:

```text
matrix:
  kernel/decision-governance/p0-decision-matrices.v0.json#p0.matrix.layout_structure.v0

decision card:
  kernel/decision-cards/elements.core.v0.json#v4.<selected_option>

resolver registry:
  kernel/decision-governance/resolver-rule-registry.v0.json

resolver rule:
  kernel/decision-governance/resolver-rules/layout-structure.v0.json#resolver.rule.layout_structure.mvp.v0@0.1.0

Decision Record v2 schema:
  kernel/schemas/decision-record.v2.schema.json

Decision Record output:
  an explicit `#decision_record` reference

L2 audit contract:
  kernel/validator/validate-l2-decision-correctness.mjs#auditDecisionRecord

L2 audit result:
  an explicit referenced result with `pass`

KROAD-009 vertical slice:
  kernel/decision-governance/kroad-009-layout-structure-vertical-slice.v0.json
```

The validator loads the referenced Decision Record envelope, reruns the existing L2 audit, and compares the consumer-declared decision ID, resolver status, selected option, rule ID/version, provisional state, and evidence refs with the referenced record.

## Missing-reference behavior

For a resolver-covered `kernel_consumed` record, any required Kernel ref that is null, empty, unreadable, or mismatched causes deterministic failure. Important diagnostics include:

```text
DOWNSTREAM_CONSUMER_REQUIRED_KERNEL_REF_MISSING
DOWNSTREAM_CONSUMER_DECISION_RECORD_REF_REQUIRED
DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_REQUIRED
DOWNSTREAM_CONSUMER_KERNEL_REF_MISMATCH
DOWNSTREAM_CONSUMER_REFERENCED_L2_AUDIT_NOT_PASS
```

The contract does not guess missing refs and does not silently downgrade a claimed `kernel_consumed` record.

## Unsupported-family behavior

A P0 matrix family without an active resolver rule cannot be presented as resolver-backed. The honest path is:

```text
consumption_status: insufficient_evidence
l2_audit_status: unsupported
provisional: true
missing_kernel_refs: non-empty
```

The validator emits the warning:

```text
DOWNSTREAM_CONSUMER_RESOLVER_FAMILY_UNSUPPORTED
```

Trying to reuse the `layout_structure` rule or Decision Record for another family fails with:

```text
DOWNSTREAM_CONSUMER_UNSUPPORTED_RESOLVER_FAMILY
```

No free decision is authorized by the unsupported status.

## Synthetic evidence and no-overclaim boundary

Kernel fixture evidence remains synthetic. A fixture may not prove:

```text
live downstream enforcement
real target-project correctness or availability
runtime/browser validation
Builder execution
Project Gate acceptance
production readiness
```

Any true claim in those categories emits a specific machine-readable overclaim diagnostic. In particular:

```text
DOWNSTREAM_CONSUMER_OVERCLAIM_DOWNSTREAM_ENFORCEMENT
DOWNSTREAM_CONSUMER_OVERCLAIM_RUNTIME_VALIDATION
DOWNSTREAM_CONSUMER_OVERCLAIM_BUILDER_EXECUTION
DOWNSTREAM_CONSUMER_OVERCLAIM_PROJECT_GATE_ACCEPTANCE
DOWNSTREAM_CONSUMER_OVERCLAIM_PRODUCTION_READINESS
DOWNSTREAM_CONSUMER_OVERCLAIM_REAL_TARGET_PROJECT_PROOF
```

## Fixtures

Valid contract paths:

```text
kernel/fixtures/valid/downstream_consumer/architect_layout_structure_kernel_consumed_valid.json
kernel/fixtures/valid/downstream_consumer/architect_media_choice_insufficient_evidence_valid.json
```

Deterministic missing-ref rejection:

```text
kernel/fixtures/invalid/downstream_consumer/architect_layout_structure_missing_kernel_refs_invalid.json
```

Adversarial misuse and overclaim rejection:

```text
kernel/fixtures/adversarial/downstream_consumer/architect_unsupported_family_resolver_backed_adversarial.json
kernel/fixtures/adversarial/downstream_consumer/architect_synthetic_evidence_overclaim_adversarial.json
```

## Validation

Run:

```bash
npm run validate:downstream-consumer-contract
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes the KROAD-010 validator after the KROAD-009 vertical-slice validator.

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
