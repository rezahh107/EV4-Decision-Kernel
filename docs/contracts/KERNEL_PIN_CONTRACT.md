# Kernel Pin Contract — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: Planned pin and hash contract for future Kernel consumers  
Owner or intended consumer: Local EV4 repository profiles, Project Gate, Kernel validators

future_schema_path: `kernel/schemas/kernel-pin.schema.json`

## What This Document Is

This document plans how future consumers identify the exact Kernel snapshot they use.

## What This Document Is Not

```text
- not a final schema
- not yet CI-enforced
- not yet runtime-validated
- not a release artifact
- not a reusable workflow
```

## Confirmed Facts

```text
- Floating consumption from main is rejected.
- Vendored/pinned snapshot is the first intended distribution model.
- Project Gate should later reject missing or mismatched pin/hash.
```

## Proposed Approach

Proposed planning shape:

```yaml
kernel_pin:
  kernel_repository: rezahh107/EV4-Decision-Kernel
  kernel_ref_type: commit | release | vendored_snapshot
  kernel_ref: string
  snapshot_hash: string
  hash_algorithm: sha256
  contract_index_ref: docs/contracts/CONTRACT_INDEX.md
  created_at: string
  consumed_by_repository: string
```

Minimum future rejection cases:

```text
- missing kernel_pin
- missing snapshot_hash
- unsupported hash_algorithm
- contract_index_ref missing
- floating branch ref used as executable source
```

## Open Decisions

```text
- exact hash algorithm
- exact hash coverage set
- whether release IDs are allowed in MVK or only later
- exact local profile path for KERNEL_PIN.json
```

## Acceptance Criteria

```text
- Future consumers can identify the Kernel source.
- Project Gate can later reject missing pin/hash.
- Local profile cannot replace the pin with prose.
- The pin does not authorize rule forks.
```

## What Must Not Be Done Yet

```text
- do not create KERNEL_PIN.json in other repositories
- do not create release automation
- do not create reusable workflow centralization
- do not claim hash verification is implemented
- do not claim downstream enforcement
```