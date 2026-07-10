# KROAD-010 Downstream Consumer Contract

**Status:** bootstrap staged / blocked pending independent review and merge authorization  
**Scope:** lifecycle-neutral Kernel-local acceptance semantics for one future `EV4-Architect-Repo` consumer  
**Owner:** Kernel  
**Intended consumer:** Architect decision-output boundary

## Status authority

Mutable roadmap and activation state belongs only in `planning/NEXT_WORK.md`.

The byte-pinned manifest is lifecycle-neutral. Its `status` identifies the contract definition and does not change merely because KROAD-010 moves from staged to completed.

## Controlled two-PR sequence

KROAD-010 is split into two stages:

1. PR #33 lands final byte-stable acceptance semantics on `main` without activating ordinary Consumer Records.
2. PR #31 syncs with that verified `main` commit, pins ordinary records to it, activates package wiring, and proves merge-method-independent history behavior.

PR #33 does not establish the final production anchor until it is explicitly merged and the resulting `main` commit is verified.

## Bootstrap artifacts

```text
kernel/schemas/downstream-consumer-contract.v0.schema.json
kernel/decision-governance/downstream-consumer-contract.v0.json
kernel/validator/validate-downstream-consumer-contract.mjs
kernel/decision-governance/downstream-consumer-lineage-binding.v0.json
kernel/validator/validate-downstream-consumer-lineage.mjs
kernel/validator/validate-downstream-consumer-canonical-lock.mjs
kernel/fixtures/contract-lock/downstream_consumer/canonical_lock_mutations.json
kernel/fixtures/contract-lock/downstream_consumer/primary-validator-baseline.v0.json
tools/validate-kroad-010-bootstrap.mjs
tools/validate-kroad-010-primary-baseline.mjs
tools/validate-kroad-010-prototype-integrity.mjs
```

The bootstrap also carries representative primary and lineage fixtures so the final validators can be executed directly before they become immutable on `main`.

## Three production validation gates

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

The commands remain independent. PR #31 will activate them exactly once and in this order:

```text
primary -> canonical-lock -> lineage
```

## Immutable snapshot classification

The immutable snapshot contains acceptance-semantic files, including the canonical-lock validator. It excludes:

```text
package.json
package-lock.json
```

Package files are orchestration state and are protected separately by the canonical wiring lock after activation.

Every production Consumer Record must eventually pin an actual verified `main` commit containing these semantics. A PR head or feature-only commit is not an acceptable production anchor.

## No transient history fixture

Canonical bootstrap data does not retain byte-drift or missing-stack fixtures that hard-code feature-branch commits.

The former history-dependent fixtures are recorded only as migrated behavior in `primary-validator-baseline.v0.json`. Their executable replacement is the activation-only runtime history matrix owned by PR #31.

That matrix constructs runtime `incomplete_anchor`, `stale_anchor`, and `bootstrap_anchor` commits inside disposable repositories. No synthetic SHA becomes a production record pin.

## Direct bootstrap execution

`tools/validate-kroad-010-bootstrap.mjs` creates a detached temporary worktree at the exact bootstrap head, activates package wiring only inside the temporary history, repins ordinary test records to the bootstrap head, commits the synthetic activation state, and verifies a clean worktree.

It directly executes:

```text
primary
primary-baseline
canonical-lock
lineage
prototype-integrity
```

The bootstrap branch itself does not activate KROAD-010 in `package.json`.

## Primary validator maintainability

The primary validator is expanded into reviewable functions with descriptive identifiers and exported test seams.

`primary-validator-baseline.v0.json` captures only stable fixture order, expected status, and required diagnostic codes. It contains no PR number or feature-branch head dependency.

`validate-kroad-010-primary-baseline.mjs` enforces:

- unchanged fixture ordering and required diagnostics;
- unchanged pass/fail/insufficient-evidence behavior;
- at least 100 physical lines;
- no physical line longer than 120 characters.

No formatting dependency was added.

## Fixture patch security

Fixture JSON is untrusted input.

The lineage patcher rejects every path segment named:

```text
__proto__
prototype
constructor
```

The guard applies to both `record_patch` and `envelope_patch`. It also requires allowlisted roots, numeric array indexes, own-property traversal, and plain-object or array containers.

Direct fixtures cover all six record/envelope combinations:

```text
prototype_pollution_record_patch_invalid.json
prototype_pollution_record_constructor_invalid.json
prototype_pollution_record_prototype_invalid.json
prototype_pollution_envelope_patch_invalid.json
prototype_pollution_envelope_constructor_invalid.json
prototype_pollution_envelope_prototype_invalid.json
```

Stable rejection diagnostic:

```text
DOWNSTREAM_CONSUMER_FIXTURE_PATCH_PATH_FORBIDDEN
```

`validate-kroad-010-prototype-integrity.mjs` also proves that `Object.prototype` remains unchanged and that normal allowlisted patching still works.

## Evidence lineage

A consumer must preserve evidence ID, evidence tier, source type, evidence ref, and normalized material limitations.

Normalization trims strings, removes duplicates, and ignores ordering. Adding, removing, or rewriting a material limitation fails with:

```text
DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH
```

## Canonical regression lock

The mutation suite rejects:

- missing or renamed gate scripts;
- duplicated or reordered KROAD-010 gates;
- manifest/policy case-set drift;
- immutable execution-set drift;
- reintroduction of mutable lifecycle wording into the pinned manifest.

## `insufficient_evidence` is not a decision channel

`insufficient_evidence` requires null decision fields and null decision-bearing refs. It cannot carry a hidden selected option, Resolver rule, Decision Record, or vertical-slice claim.

## Confirmed boundaries

```text
ordinary production records activated: no
actual main-history bootstrap anchor: not yet available
downstream repository modifications: none
live downstream enforcement: not claimed
KROAD-011+: not implemented
runtime/browser evidence: not implemented
Builder execution proof: not claimed
Project Gate acceptance: not claimed
production readiness: not claimed
```

## Bootstrap validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
npm run validate:roadmap-memory
node tools/validate-kroad-010-bootstrap.mjs primary
node tools/validate-kroad-010-bootstrap.mjs primary-baseline
node tools/validate-kroad-010-bootstrap.mjs canonical-lock
node tools/validate-kroad-010-bootstrap.mjs lineage
node tools/validate-kroad-010-bootstrap.mjs prototype-integrity
```

## Required continuation after merge authorization

1. independently review the exact PR #33 head;
2. explicitly authorize and merge PR #33;
3. verify the actual resulting commit and immutable blob SHAs on `main`;
4. sync PR #31 with `main`;
5. repin ordinary records to that exact bootstrap commit;
6. rerun exact-head CI and the merge/squash/rebase history matrix;
7. validate final merged `main` before marking KROAD-010 complete.
