# KROAD-010 Downstream Consumer Contract

**Status:** staged / blocked pending bootstrap merge, main-history pinning, and final validation  
**Scope:** one Kernel-local downstream consumer contract for `rezahh107/EV4-Architect-Repo`  
**Owner:** Kernel  
**Intended consumer:** Architect decision-output boundary

## Status authority

Mutable roadmap and activation state belongs only in `planning/NEXT_WORK.md`.

The byte-pinned manifest is lifecycle-neutral. Its `status` identifies the contract definition and its `next_allowed_step` delegates roadmap progression to `planning/NEXT_WORK.md`; neither field is changed merely to mark KROAD-010 complete.

## Current state

KROAD-010 is not complete on verified `main` history yet.

The implementation is split into two controlled stages:

1. PR #33 lands and directly executes the final byte-stable acceptance semantics on `main` without activating Consumer Records;
2. PR #31 pins ordinary Consumer Records to that actual `main` commit, enables all gates, and proves the resulting histories.

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
  -> lifecycle-neutral manifest, manifest/policy parity, package script
     identity, validate:mvk gate uniqueness/order, and mutation regressions

validate-downstream-consumer-lineage.mjs
  -> immutable acceptance snapshot, Consumer-to-Decision-Record lineage,
     evidence limitations, patch-path safety, and anti-downgrade checks
```

The gates remain separate so record semantics, repository orchestration, and Decision Record lineage are independently reviewable.

## Bootstrap and immutable pin design

A feature-branch commit is not a merge-method-independent durable anchor. The accepted design requires a bootstrap commit that already exists on `main` before ordinary Consumer Records are pinned.

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

For every evaluated record, each acceptance-semantic file must exist in the pinned main-history commit and current checkout and match byte-for-byte.

No final anchor SHA is documented until PR #33 is actually merged and the resulting `main` commit is verified.

## Bootstrap-specific execution evidence

PR #33 contains `tools/validate-kroad-010-bootstrap.mjs` and a dedicated Workflow step.

The harness creates a detached temporary worktree at the exact PR head, activates package wiring only inside that temporary worktree, repins ordinary test records to the same head, and directly executes:

```text
primary
canonical-lock
lineage
```

The bootstrap branch itself does not activate KROAD-010 in `package.json`. A green legacy MVK run alone is not accepted as bootstrap execution evidence.

## Fixture patch security

Fixture JSON is untrusted input.

The lineage patcher rejects these path segments before mutation:

```text
__proto__
prototype
constructor
```

It also requires allowlisted roots, numeric array indexes, own-property traversal, and plain-object or array containers. The same guard applies to `record_patch` and `envelope_patch`.

Direct adversarial cases are:

```text
kernel/fixtures/lineage/downstream_consumer/prototype_pollution_record_patch_invalid.json
kernel/fixtures/lineage/downstream_consumer/prototype_pollution_envelope_patch_invalid.json
```

Both require:

```text
DOWNSTREAM_CONSUMER_FIXTURE_PATCH_PATH_FORBIDDEN
```

The validator additionally checks that `Object.prototype` remains unchanged during its bootstrap security self-test.

## Evidence lineage

A consumer must preserve evidence ID, evidence tier, source type, evidence ref, and normalized material limitations.

Limitation order and duplicate strings are non-semantic after trim/dedup/sort normalization. Removing, adding, or rewriting a material limitation fails with:

```text
DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH
```

## Canonical regression lock

The canonical lock requires these gates exactly once in `validate:mvk` and in this order:

```text
primary -> canonical-lock -> lineage
```

The mutation suite verifies failure when a gate is removed, renamed, duplicated, reordered, when manifest/policy or execution sets drift, or when mutable lifecycle wording is reintroduced into the pinned manifest.

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

1. the byte-stable bootstrap stack is independently reviewed and merged to `main`;
2. ordinary records are pinned to the verified bootstrap commit on `main`;
3. exact-head CI passes on the activation PR;
4. merge, squash, and rebase history simulations preserve valid-record behavior;
5. deliberate acceptance-code drift still fails closed;
6. the final merged `main` history is validated.
