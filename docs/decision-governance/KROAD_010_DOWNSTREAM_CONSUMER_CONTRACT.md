# KROAD-010 Downstream Consumer Contract

**Status:** activation merged; roadmap completion remains `needs_audit` pending direct final-`main` validation  
**Scope:** one Kernel-local downstream consumer contract for `rezahh107/EV4-Architect-Repo`  
**Owner:** Kernel  
**Intended consumer:** Architect decision-output boundary

## Status authority

Mutable roadmap and activation state belongs only in `planning/NEXT_WORK.md`.

The byte-pinned manifest is lifecycle-neutral. Its `status` identifies the contract definition; it does not change merely because KROAD-010 moves between staged, activated, and completed states.

## Verified bootstrap anchor

PR #33 merged the reviewed lifecycle-neutral acceptance stack to `main`.

```text
bootstrap_main_commit: aa0317a07c10acf4e398dc9e5869f4e6966569f9
bootstrap_pr: 33
```

Ordinary KROAD-010 Consumer Records pin this exact commit. A PR head, feature-only commit, floating ref, or synthetic test commit is not an acceptable production anchor.

## Verified activation merge

PR #34 merged the activation layer to `main`.

```text
activation_main_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
activation_pr: 34
reviewed_head: f61fbf931e585b50403be2b015d34fee3a206a17
```

Git comparison confirms that the resulting merge commit is one commit ahead of the reviewed PR head and contains no file differences from it.

The reviewed head passed `Validate MVK` run 372 and `Behavioral Coverage Audit` run 340. A direct workflow result associated with the merged `main` commit was not available through the connected inspection path, so roadmap completion remains `needs_audit` rather than `completed`.

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

Inside `validate:mvk`, each gate appears exactly once and in this order:

```text
primary -> canonical-lock -> lineage
```

## Production pin rules

Production validation requires:

```text
kernel_ref:
  full lowercase 40-character commit SHA
  commit exists
  commit is an ancestor of validation HEAD
  required artifacts exist at the pinned commit
  current immutable semantics match the pinned snapshot
```

These rules are not weakened or special-cased for tests.

The immutable snapshot contains acceptance-semantic files, including the canonical-lock validator. It excludes orchestration files:

```text
package.json
package-lock.json
```

Package orchestration is protected separately by the canonical wiring lock.

## No transient SHA in canonical regressions

Canonical fixtures do not pin a PR head, feature-only commit, floating ref, or synthetic CI commit for byte-drift testing.

History-dependent regressions are owned by the test-only history matrix. Runtime-created SHAs remain inside isolated disposable histories and never become committed production pins.

## Deterministic Git-history matrix

`tools/validate-kroad-010-history-matrix.mjs` creates an isolated repository with these runtime roles:

```text
I = dynamically discovered incomplete pre-bootstrap main ancestor
D = complete but stale acceptance-semantics anchor
B = lifecycle-neutral current bootstrap anchor
A = activation changes
```

The harness discovers `I` from authoritative first-parent `main` history rather than hard-coding a historical SHA.

Required relationship:

```text
I -> D -> B -> final history
```

For every simulated final history:

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

The byte-drift case must emit:

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

- captured fixture order and required diagnostics;
- unchanged pass/fail/insufficient-evidence behavior;
- reviewable source shape with no physical line over 120 characters.

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

Confirmed:

1. ordinary records pin `aa0317a07c10acf4e398dc9e5869f4e6966569f9`;
2. exact-head activation CI passed;
3. merge, squash, and rebase matrix results passed with clean worktrees and exact diagnostics;
4. deliberate acceptance-code drift fails closed;
5. PR #34 merged as `60836283d9a5ae98c3c3819c7ab33a6f40206289`.

Still required before KROAD-010 may be marked complete:

6. direct final merged-`main` validation must be observed and recorded.

The post-merge evidence record is `planning/reviews/KROAD-010_DOWNSTREAM_CONSUMER_POST_MERGE_REVIEW.md`.
