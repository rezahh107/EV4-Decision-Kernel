# KROAD-010 Downstream Consumer Contract

**Status:** staged / blocked pending bootstrap merge, main-history pinning, and final validation  
**Scope:** one Kernel-local downstream consumer contract for `rezahh107/EV4-Architect-Repo`  
**Owner:** Kernel  
**Intended consumer:** Architect decision-output boundary

## Current state

KROAD-010 is not complete on `main` yet.

The implementation is split into two controlled stages:

1. a bootstrap PR lands the final byte-stable acceptance semantics on `main` without activating Consumer Records;
2. the activation PR pins ordinary Consumer Records to that actual `main` commit, enables all gates, and proves the resulting history.

Until both stages pass exact-head CI and post-merge-history validation, KROAD-011 is not an available next task.

## Machine-readable artifacts

```text
kernel/schemas/downstream-consumer-contract.v0.schema.json
kernel/decision-governance/downstream-consumer-contract.v0.json
kernel/validator/validate-downstream-consumer-contract.mjs
kernel/decision-governance/downstream-consumer-lineage-binding.v0.json
kernel/validator/validate-downstream-consumer-lineage.mjs
kernel/validator/validate-downstream-consumer-canonical-lock.mjs
kernel/fixtures/contract-lock/downstream_consumer/canonical_lock_mutations.json
kernel/fixtures/valid/downstream_consumer/
kernel/fixtures/invalid/downstream_consumer/
kernel/fixtures/adversarial/downstream_consumer/
kernel/fixtures/lineage/downstream_consumer/
```

## Three deterministic validation gates

```text
validate-downstream-consumer-contract.mjs
  -> record shape, immutable pin, snapshot refs, insufficient_evidence,
     unsupported-family misuse, and no-overclaim boundaries

validate-downstream-consumer-canonical-lock.mjs
  -> canonical manifest/policy parity, package script identity,
     validate:mvk gate presence/uniqueness/order, and mutation regressions

validate-downstream-consumer-lineage.mjs
  -> immutable acceptance-semantics snapshot, Consumer-to-Decision-Record
     lineage, evidence limitations, and anti-downgrade checks
```

The gates remain separate so record semantics, repository orchestration, and Decision Record lineage are independently reviewable.

## Bootstrap and immutable pin design

A feature-branch commit is not a merge-method-independent durable anchor. Squash and rebase can replace feature-branch ancestry.

The accepted design therefore requires a bootstrap commit that already exists on `main` before ordinary Consumer Records are pinned.

The immutable snapshot contains acceptance-semantic files only:

```text
kernel/decision-governance/downstream-consumer-contract.v0.json
kernel/schemas/downstream-consumer-contract.v0.schema.json
kernel/validator/validate-downstream-consumer-contract.mjs
kernel/decision-governance/downstream-consumer-lineage-binding.v0.json
kernel/validator/validate-downstream-consumer-lineage.mjs
kernel/validator/validate-downstream-consumer-canonical-lock.mjs
kernel/schemas/decision-record.v2.schema.json
kernel/decision-governance/resolver-rule-registry.v0.json
kernel/decision-governance/resolver-rules/layout-structure.v0.json
kernel/resolver-mvp/resolve-high-risk-p0.mjs
kernel/validator/validate-l2-decision-correctness.mjs
```

`package.json` and `package-lock.json` are orchestration files, not immutable record semantics. Their exact scripts and MVK ordering are enforced by the canonical-lock gate instead of byte-pinning them across bootstrap and activation.

For every evaluated record, each acceptance-semantic file must:

```text
- exist in the pinned main-history commit;
- exist in the current checkout;
- match byte-for-byte between the pinned commit and current checkout.
```

Representative diagnostics:

```text
DOWNSTREAM_CONSUMER_LINEAGE_EXECUTION_SET_INVALID
DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING
DOWNSTREAM_CONSUMER_LINEAGE_CURRENT_EXECUTION_FILE_MISSING
DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT
```

No final anchor SHA is documented until the bootstrap PR is actually merged and the resulting `main` commit is verified.

## Evidence lineage

A consumer must preserve:

```text
- evidence ID;
- evidence tier;
- source type;
- evidence ref;
- normalized material limitations.
```

Limitation order and duplicate strings are non-semantic after trim/dedup/sort normalization. Removing, adding, or rewriting a material limitation is semantic drift and must fail with:

```text
DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH
```

The normal lineage runner includes both:

```text
kernel/fixtures/lineage/downstream_consumer/evidence_limitations_mismatch_invalid.json
kernel/fixtures/lineage/downstream_consumer/evidence_limitations_reordered_equivalent_valid.json
```

## Full Decision Record binding

The lineage gate also binds:

```text
- provisional state;
- downstream owner;
- rerun L2 status;
- L2 result from the same envelope;
- exact matrix fragment;
- contract, Decision Record, and vertical-slice provenance.
```

Representative diagnostics:

```text
DOWNSTREAM_CONSUMER_PROVISIONAL_STATUS_MISMATCH
DOWNSTREAM_CONSUMER_DECISION_OWNER_MISMATCH
DOWNSTREAM_CONSUMER_EVIDENCE_LINEAGE_MISMATCH
DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH
DOWNSTREAM_CONSUMER_L2_STATUS_MISMATCH
DOWNSTREAM_CONSUMER_L2_RESULT_ENVELOPE_MISMATCH
DOWNSTREAM_CONSUMER_L2_AUDIT_RESULT_REF_MISMATCH
DOWNSTREAM_CONSUMER_MATRIX_REF_MISMATCH
DOWNSTREAM_CONSUMER_PROVENANCE_REF_MISSING
```

## Canonical regression lock

The canonical lock requires:

```text
validate:downstream-consumer-contract
validate:downstream-consumer-canonical-lock
validate:downstream-consumer-lineage
```

Each gate must appear exactly once in `validate:mvk` and in this order:

```text
primary -> canonical-lock -> lineage
```

The mutation suite verifies failure when a gate is removed, renamed, duplicated, reordered, or when manifest/policy case sets or the immutable execution set drift.

## `insufficient_evidence` is not a decision channel

`insufficient_evidence` requires null decision fields and null decision-bearing refs. It cannot carry a hidden selected option, Resolver rule, Decision Record, or vertical-slice claim.

## Confirmed boundaries

```text
selected downstream target: EV4-Architect-Repo only
downstream repository modifications: none
live downstream enforcement: not claimed
active Resolver MVP families: layout_structure only
KROAD-011+: not implemented
runtime/browser evidence: not implemented
Builder execution proof: not claimed
production readiness: not claimed
```

## Validation

```bash
npm run validate:downstream-consumer-contract
npm run validate:downstream-consumer-canonical-lock
npm run validate:downstream-consumer-lineage
npm run validate:mvk
npm run validate:roadmap-memory
```

## Completion gate

KROAD-010 may be marked complete only after:

1. the byte-stable bootstrap stack is merged to `main`;
2. ordinary records are pinned to the verified bootstrap commit on `main`;
3. exact-head CI passes on the activation PR;
4. merge, squash, and rebase history simulations preserve valid-record behavior;
5. deliberate acceptance-code drift still fails closed;
6. the final merged `main` history is validated.
