# AIGOV v2.6 Repository Transition Inventory

**Repository:** `rezahh107/EV4-Decision-Kernel`  
**Observed main:** `03336312f6c3fcc4c315e56592bac3bac0bf7465`  
**Observed open PRs:** `#53`  
**Remote branches deleted:** `false`

## Result

Seven required historical branches were re-inspected against the current live `main`. No historical branch is merged, cherry-picked, revived, or deleted by this transition. PR #45 and PR #32 retain useful requirements; those requirements remain mapped into the successor program rather than revived as stale code.

| Branch | PR | Ahead / Behind current main | Disposition | Deletion candidate |
|---|---:|---:|---|---|
| `krec-001/recovery-ledger` | #52 | 0 / 6 | `merged_lineage_stale` | `true` |
| `codex/refactor-github-pr-protection-configuration` | #45 | 1 / 146 | `requirements_extracted_into_aigov26` | `true` |
| `fix/ev4-wave5-receipt-safety-profile` | #32 | 2 / 207 | `requirements_extracted_into_aigov26` | `true` |
| `agent/coverage-guarantee-bootstrap-pr1` | #42 | 9 / 147 | `superseded_by_merged_work` | `true` |
| `kroad-010/evidence-closure-pr37-main` | #38 | 2 / 150 | `superseded_by_merged_work` | `true` |
| `kroad-010/downstream-consumer-contract` | #31 | 87 / 205 | `superseded_by_merged_work` | `true` |
| `kroad-007-l2-decision-audit` | #25 | 17 / 262 | `superseded_by_merged_work` | `true` |

## Current-main reconciliation

Current `main` includes the merged PCVP foundation work from PR #54. That work is preserved as current-main history and is not treated as AIGOV v2.6 adoption or implementation. The transition repair must validate against that PCVP foundation without changing its dormant activation/adoption boundary.

## PR #45 Requirement Extraction

The following requirements are preserved in `AIGOV26-001` through `AIGOV26-005`, `AIGOV26-007`, and `AIGOV26-008`:

- authenticated PR identity from the event and authoritative REST cross-check;
- lookup of checks associated with the exact PR Head;
- exact trusted GitHub App and check identity;
- separation of declarative required-check configuration from observed live enforcement;
- proof credit remains false until an independent official verification path succeeds;
- fail-closed rejection of stale, ambiguous, wrong-source, same-name, and spoofed results.

## PR #32 Requirement Extraction

The following requirements are preserved in `AIGOV26-002` through `AIGOV26-006`:

- direct or deterministic authoritative `consumer_stage` binding;
- exact source-retaining carrier binding;
- complete rejected-option representation;
- `evidence_state: validated` for successful Receipt projection;
- rejection of mixed lineage, arbitrary accepted status, execution overclaim, status upgrade, and trace mutation;
- Receipt text cannot replace, repair, or mutate the machine trace.

No residual requirement remains outside the successor tasks. No remote branch was deleted.
