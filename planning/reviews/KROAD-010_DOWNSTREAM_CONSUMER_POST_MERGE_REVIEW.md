# KROAD-010 Downstream Consumer Contract — Post-Merge Review

**Status:** needs_audit  
**Scope:** evidence-only post-merge verification record for KROAD-010 bootstrap and activation  
**Owner:** Kernel  
**Roadmap authority:** `planning/NEXT_WORK.md`

## Closure audit snapshot

```text
audit_date: 2026-07-10
current_main_head: a7d3fbddc0290a7af96fbbf7ed9c4720d9020829
activation_merge_commit: 60836283d9a5ae98c3c3819c7ab33a6f40206289
bootstrap_commit: aa0317a07c10acf4e398dc9e5869f4e6966569f9
reviewed_activation_head: f61fbf931e585b50403be2b015d34fee3a206a17
```

`60836283d9a5ae98c3c3819c7ab33a6f40206289` is the KROAD-010 activation merge commit and the exact historical evidence target recorded by the roadmap. It is not the current `main` HEAD.

The current `main` HEAD is four commits ahead of the activation merge. The intervening changes affect only:

```text
docs/decision-governance/KROAD_010_DOWNSTREAM_CONSUMER_CONTRACT.md
planning/NEXT_WORK.md
planning/reviews/KROAD-010_DOWNSTREAM_CONSUMER_POST_MERGE_REVIEW.md
```

No executable Kernel file, package wiring file, validator, fixture, schema, or GitHub Actions workflow changed after the activation merge.

## Verified repository state

PR #33 merged the lifecycle-neutral acceptance stack to `main` as:

```text
aa0317a07c10acf4e398dc9e5869f4e6966569f9
```

PR #34 merged the activation layer to `main` as:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
```

The reviewed PR #34 head was:

```text
f61fbf931e585b50403be2b015d34fee3a206a17
```

Git comparison confirms that the activation merge commit is one commit ahead of the reviewed activation head, the reviewed head is its merge base, and there are no file differences between them.

## Confirmed pre-merge evidence

On exact PR #34 head `f61fbf931e585b50403be2b015d34fee3a206a17`:

```text
Validate MVK — run number 372 — success
Behavioral Coverage Audit — run number 340 — success
```

The Validate MVK job confirmed:

```text
source syntax and JSON — success
MVK fixtures and gates — success
roadmap memory — success
prototype integrity — success
merge/squash/rebase history matrix — success
history matrix artifact upload — success
```

History matrix artifact:

```text
artifact_id: 8235134860
digest: sha256:0f3b2370957958aab14cc826355b5c45158edf4bf8847c123338e5bd5e9cd607
```

## Workflow definitions inspected

`.github/workflows/validate-mvk.yml` defines `Validate MVK` for `pull_request` and pushes to `main`. It does not define `workflow_dispatch`.

`.github/workflows/behavioral-coverage.yml` defines `Behavioral Coverage Audit` for `pull_request`, pushes to `main`, and `workflow_dispatch`.

## Exact activation-commit Actions evidence

Target:

```text
60836283d9a5ae98c3c3819c7ab33a6f40206289
```

The connected commit-workflow query returned:

```text
workflow_runs: []
combined_statuses: []
```

The available connector query currently filters to pull-request-triggered workflow runs. The target is a merge commit whose relevant workflows would have been push-triggered. Therefore this empty result does not prove that the push runs do not exist; it means the required direct run metadata remains unverifiable through the available inspection path.

The following exact-commit fields could not be evidenced:

```text
Validate MVK run ID and URL
Behavioral Coverage Audit run ID and URL
event and exact head_sha from each run record
creation and update timestamps
job and step conclusions
kroad-010-history-matrix artifact ID and digest
```

The history-matrix artifact is classified as unavailable for inspection because no exact activation-commit `Validate MVK` run ID was retrievable. This is not a claim that the artifact was never produced or has expired.

## Current-HEAD supplementary evidence

Target:

```text
a7d3fbddc0290a7af96fbbf7ed9c4720d9020829
```

The connected commit-workflow query and combined-status query also returned no visible runs or statuses for the current merge commit. Direct current-HEAD push-run evidence therefore remains unverified through this connector path.

PR #35 head `8c8d6729acc809da88a878adf5201e08b1b05bb9` is one commit behind current `main` HEAD and has no file differences from it. Its pull-request-triggered runs provide supplementary tree-equivalent regression evidence only:

```text
Validate MVK
  run_id: 29113466370
  run_number: 374
  url: https://github.com/rezahh107/EV4-Decision-Kernel/actions/runs/29113466370
  event: pull_request
  head_sha: 8c8d6729acc809da88a878adf5201e08b1b05bb9
  status: completed
  conclusion: success

Behavioral Coverage Audit
  run_id: 29113466379
  run_number: 342
  url: https://github.com/rezahh107/EV4-Decision-Kernel/actions/runs/29113466379
  event: pull_request
  head_sha: 8c8d6729acc809da88a878adf5201e08b1b05bb9
  status: completed
  conclusion: success
```

The `Validate MVK` job and all reported steps succeeded, including source/JSON validation, MVK gates, roadmap memory, prototype integrity, history matrix, and artifact upload.

Supplementary PR #35 history-matrix artifact:

```text
artifact_id: 8235668853
digest: sha256:f42a3cb0ae381578b8d7fc8dc77726079092cd997eeceab5ba9ca1a37d04ab4c
created_at: 2026-07-10T18:08:46Z
expires_at: 2026-07-24T18:08:45Z
```

The `Behavioral Coverage Audit` job and all reported steps succeeded, including immutable action-pin verification, advisory coverage audit, and coverage-report upload.

Neither PR #35 evidence nor current tree equality is substituted for the exact activation-commit requirement.

## Confirmed implementation state

The merged activation:

- pins all seven ordinary Consumer Record fixtures to merged bootstrap commit `aa0317a07c10acf4e398dc9e5869f4e6966569f9`;
- activates `primary -> canonical-lock -> lineage` exactly once and in that order;
- preserves production ancestor and byte-equality checks;
- includes deterministic merge-commit, squash, and rebase history testing;
- keeps prototype-pollution regression coverage;
- does not claim live downstream enforcement, runtime proof, Builder execution proof, Project Gate acceptance, or production readiness.

## Decision

```text
KROAD-010: needs_audit
KROAD-011: blocked
```

KROAD-010 remains unchecked because direct successful `Validate MVK` and `Behavioral Coverage Audit` run records for the exact activation merge commit have not been retrieved and recorded.

Whether a rerunnable existing push run exists is `UNKNOWN`; no exact run ID is available through the connected path. Do not start KROAD-011 and do not reinterpret later-commit or tree-equivalent PR evidence as satisfying the existing exact-commit rule.

## Safest concrete next action

Use an authenticated GitHub Actions client that can list push-triggered runs by commit:

```bash
gh run list \
  --repo rezahh107/EV4-Decision-Kernel \
  --commit 60836283d9a5ae98c3c3819c7ab33a6f40206289 \
  --limit 100 \
  --json databaseId,workflowName,event,headSha,status,conclusion,createdAt,updatedAt,url
```

For each matching run:

```bash
gh run view <RUN_ID> \
  --repo rezahh107/EV4-Decision-Kernel \
  --json databaseId,workflowName,event,headSha,status,conclusion,createdAt,updatedAt,url,jobs

gh api \
  repos/rezahh107/EV4-Decision-Kernel/actions/runs/<VALIDATE_MVK_RUN_ID>/artifacts
```

If both exact-commit runs exist and succeeded, record their complete evidence and then mark KROAD-010 complete. If no such runs exist, do not silently substitute a later run; changing the exact-commit evidence rule would require a separate explicit roadmap/governance decision.

## Preserved limitations

```text
active consumer contract: Kernel-local only
live downstream-repository rejection evidence: not claimed
runtime/browser proof: not claimed
Builder execution proof: not claimed
Project Gate acceptance: not claimed
production readiness: not claimed
```
