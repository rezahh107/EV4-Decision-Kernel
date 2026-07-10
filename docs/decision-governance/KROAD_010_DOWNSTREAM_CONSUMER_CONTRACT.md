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
kernel/decision-governance/downstream-consumer-lineage-binding.v0.json
kernel/validator/validate-downstream-consumer-lineage.mjs
kernel/fixtures/valid/downstream_consumer/
kernel/fixtures/invalid/downstream_consumer/
kernel/fixtures/adversarial/downstream_consumer/
kernel/fixtures/lineage/downstream_consumer/
```

## What this is

KROAD-010 defines a Kernel-owned contract for one simulated Architect consumer output. A resolver-backed consumer record is accepted only when its immutable Kernel pin and required artifact refs are valid and its material Decision Record lineage remains intact.

The initial consumer is exactly:

```text
rezahh107/EV4-Architect-Repo
role: architect
```

Architect is the smallest safe initial target because it owns candidate generation, comparison, selection, and Decision Records, and the Kernel already defines an Architect source/card consumption boundary.

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

The fixtures simulate consumer behavior inside this repository. Actual downstream enforcement still requires inspected rejection behavior in the selected downstream repository.

## Two deterministic validation gates

KROAD-010 uses two complementary gates:

```text
validate-downstream-consumer-contract.mjs
  -> record shape, immutable pin, snapshot refs, insufficient_evidence,
     unsupported-family misuse, and no-overclaim boundaries

validate-downstream-consumer-lineage.mjs
  -> Consumer-to-Decision-Record lineage and anti-downgrade checks
```

The second gate is intentionally separate so snapshot mechanics and semantic lineage remain independently reviewable.

## Snapshot-bound Kernel pin

The contract validator requires the declared commit to exist, be an ancestor of the validation head, contain the KROAD-010 contract, and contain the referenced decision artifacts. Referenced artifacts are loaded from the declared commit snapshot rather than silently falling back to the working tree.

Representative diagnostics include:

```text
DOWNSTREAM_CONSUMER_PINNED_COMMIT_UNAVAILABLE
DOWNSTREAM_CONSUMER_PINNED_COMMIT_NOT_ANCESTOR
DOWNSTREAM_CONSUMER_PINNED_CONTRACT_MISSING
DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING
DOWNSTREAM_CONSUMER_PINNED_EXECUTION_DRIFT
```

CI checks out the exact PR head with full history so snapshot validation can operate deterministically.

## `insufficient_evidence` is not a decision channel

`insufficient_evidence` requires null decision fields and null decision-bearing refs. It may halt a resolver-covered family with `l2_audit_status: not_run` or an uncovered family with `l2_audit_status: unsupported`.

It cannot carry a hidden selected option, Resolver rule, Decision Record, or vertical-slice claim.

## Full Decision Record lineage binding

A passing L2 result does not erase provisional state. The lineage validator binds the consumer record to the pinned Decision Record through:

```text
- provisional state;
- downstream owner;
- exact evidence ID, tier, source type, and ref;
- rerun L2 status;
- L2 result from the same decision envelope;
- exact matrix fragment;
- required contract, decision-envelope, and vertical-slice provenance refs.
```

A Decision Record with:

```yaml
provisional_status:
  is_provisional: true
  blocks_final_release: true
```

may still have `L2: pass`. The consumer must therefore preserve `provisional: true`; it cannot upgrade that decision to non-provisional.

Representative diagnostics:

```text
DOWNSTREAM_CONSUMER_PROVISIONAL_STATUS_MISMATCH
DOWNSTREAM_CONSUMER_DECISION_OWNER_MISMATCH
DOWNSTREAM_CONSUMER_EVIDENCE_LINEAGE_MISMATCH
DOWNSTREAM_CONSUMER_L2_STATUS_MISMATCH
DOWNSTREAM_CONSUMER_L2_RESULT_ENVELOPE_MISMATCH
DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_MISMATCH
DOWNSTREAM_CONSUMER_MATRIX_REF_MISMATCH
DOWNSTREAM_CONSUMER_PROVENANCE_REF_MISSING
```

## Lineage fixtures

The lineage gate includes:

```text
valid:
  conditional + provisional Decision Record with L2 pass

invalid/adversarial:
  provisional true represented as false
  wrong downstream owner
  missing or swapped evidence lineage
  unrelated passing L2 result
  wrong matrix fragment
  missing required provenance
```

Fixtures use a full valid KROAD-010 consumer record as their base and apply explicit machine-readable mutations. This keeps each case focused while the validator still evaluates a complete consumer record and pinned Decision Record envelope.

## Validation

```bash
npm run validate:downstream-consumer-contract
npm run validate:downstream-consumer-lineage
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` runs both KROAD-010 gates.

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
