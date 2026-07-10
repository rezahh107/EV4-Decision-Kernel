# KROAD-010 Downstream Consumer Contract

**Status:** staged / blocked pending bootstrap merge, main-history pinning, and final validation  
**Scope:** one Kernel-local downstream consumer contract for `rezahh107/EV4-Architect-Repo`  
**Owner:** Kernel  
**Intended consumer:** Architect decision-output boundary

## Status authority

Mutable roadmap and activation state belongs only in `planning/NEXT_WORK.md`.

The byte-pinned manifest is lifecycle-neutral. Its `status` identifies the contract definition; it does not change merely because KROAD-010 moves from staged to completed.

## Controlled two-PR sequence

KROAD-010 is split into two stages:

1. PR #33 lands final byte-stable acceptance semantics on `main` without activating ordinary Consumer Records.
2. PR #31 syncs with that verified `main` commit, pins ordinary records to it, activates package wiring, and proves merge-method-independent history behavior.

Until both stages pass exact-head CI and final-main validation, KROAD-011 is unavailable.

## Machine-readable artifacts

```text
kernel/schemas/downstream-consumer-contract.v0.schema.json
kernel/decision-governance/downstream-consumer-contract.v0.json
kernel/validator/validate-downstream-consumer-contract.mjs
kernel/decision-governance/downstream-consumer-lineage-binding.v0.json
kernel/validator/validate-downstream-consumer-lineage.mjs
kernel/validator/validate-downstream-consumer-canonical-lock.mjs
kernel/fixtures/contract-lock/downstream_consumer/canonical_lock_mutations.json
kernel/fixtures/contract-lock/downstream_consumer/primary-validator-baseline.v0.json
kernel/fixtures/history-matrix/downstream_consumer/history-matrix.v0.json
tools/validate-kroad-010-primary-baseline.mjs
tools/validate-kroad-010-prototype-integrity.mjs
tools/validate-kroad-010-history-matrix.mjs
```

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

The commands remain independent. Inside `validate:mvk`, each appears exactly once and in this order:

```text
primary -> canonical-lock -> lineage
```

## Production pin rules

Production validation continues to require:

```text
kernel_ref:
  full lowercase 40-character commit SHA
  commit exists
  commit is an ancestor of validation HEAD
  required artifacts exist at the pinned commit
  current immutable semantics match the pinned snapshot
```

These rules are not weakened or special-cased for tests.

The immutable snapshot contains acceptance-semantic files, including the canonical-lock validator. It excludes:

```text
package.json
package-lock.json
```

Package files are orchestration state and are protected separately by the canonical wiring lock.

## No transient SHA in canonical regressions

Canonical fixtures do not pin a PR head, feature-only commit, floating ref, or synthetic CI commit for byte-drift testing.

History-dependent regressions are owned by the test-only history matrix. Runtime-created SHAs are written only into isolated disposable histories and never committed as production pins.

## Deterministic Git-history matrix

`tools/validate-kroad-010-history-matrix.mjs` creates an isolated repository with these runtime roles:

```text
I = incomplete pre-bootstrap main ancestor
D = complete but stale acceptance-semantics anchor
B = lifecycle-neutral current bootstrap anchor
A = activation changes
```

Required relationship:

```text
I -> D -> B -> final history
```

For each final history:

```text
ordinary records pin B
byte-drift regression pins D
missing-stack regression pins I
current checkout contains B semantics plus A wiring
```

The harness independently constructs:

```text
merge_commit
squash
rebase
```

Every state is committed before validation. `git status --porcelain` must be empty before and after each suite.

The byte-drift case must emit exactly the dedicated behavior:

```text
DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_DRIFT
```

`DOWNSTREAM_CONSUMER_LINEAGE_PIN_UNAVAILABLE` is not accepted as byte-drift evidence.

The matrix also proves:

```text
DOWNSTREAM_CONSUMER_LINEAGE_PINNED_EXECUTION_FILE_MISSING
DOWNSTREAM_CONSUMER_PINNED_ARTIFACT_MISSING
```

Mutation guards reject omitted merge methods, non-ancestor anchors, feature-only bootstrap anchors, dirty worktrees, weakened drift diagnostics, and ordinary records using the wrong anchor. Canonical-lock and prototype suites cover lifecycle drift, removed/reordered gates, and forbidden patch segments.

## Primary validator maintainability

The primary validator is expanded into reviewable functions with descriptive identifiers and exported test seams.

`primary-validator-baseline.v0.json` captures only stable fixture order, expected status, and required diagnostic codes. It does not depend on a PR number or feature-branch head.

`validate-kroad-010-primary-baseline.mjs` enforces:

- the captured fixture order and required diagnostics;
- unchanged pass/fail/insufficient-evidence behavior;
- a reviewable source shape with no physical line over 120 characters.

## Fixture patch security

Fixture JSON is untrusted input.

The lineage patcher rejects every path segment named:

```text
__proto__
prototype
constructor
```

The guard applies to both `record_patch` and `envelope_patch`. It also requires allowlisted roots, numeric array indexes, own-property traversal, and plain-object or array containers.

Direct security coverage includes all six record/envelope combinations for `__proto__`, `constructor`, and `prototype`, plus an `Object.prototype` integrity check.

Stable rejection diagnostic:

```text
DOWNSTREAM_CONSUMER_FIXTURE_PATCH_PATH_FORBIDDEN
```

## Evidence lineage

A consumer must preserve evidence ID, evidence tier, source type, evidence ref, and normalized material limitations.

Normalization trims strings, removes duplicates, and ignores ordering. Adding, removing, or rewriting a material limitation fails with:

```text
DOWNSTREAM_CONSUMER_EVIDENCE_LIMITATIONS_MISMATCH
```

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
Project Gate acceptance: not claimed
production readiness: not claimed
```

## Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:downstream-consumer-contract
npm run validate:downstream-consumer-canonical-lock
npm run validate:downstream-consumer-lineage
npm run validate:kroad-010-history-matrix
npm run validate:mvk
npm run validate:roadmap-memory
```

## Completion gate

KROAD-010 may be marked complete only after:

1. PR #33 is independently reviewed and explicitly merged to `main`;
2. the actual resulting bootstrap commit and immutable blob SHAs are verified;
3. PR #31 is synced with `main` and ordinary records pin that exact commit;
4. exact-head CI passes on PR #31;
5. merge, squash, and rebase matrix results all pass with clean worktrees and exact diagnostics;
6. deliberate acceptance-code drift still fails closed;
7. final merged `main` is validated.
