---
title: "AI Authority Deterministic Governance — Source of Truth"
title_fa: "سند حقیقت حاکمیت دترمنستیک بر قضاوت‌های احتمالاتی هوش مصنوعی"
version: "1.1.0"
status: "active_governing_standard"
document_role: "immutable repository snapshot manifest"
repository_adoption_status: "blocked_open_enforcement_gaps"
raw_source_sha256: "30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757"
raw_source_size_bytes: 101922
compressed_payload: "docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md.gz.b64"
---

# AI Authority Deterministic Governance — SSOT v1.1.0 Snapshot

## Status

This file is the readable manifest for the exact user-supplied `v1.1.0` standard snapshot. The complete source bytes are stored as deterministic gzip (`mtime=0`) encoded with Base64 in:

```text
docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md.gz.b64
```

The standard is active, but repository adoption is separate. This repository remains `blocked_open_enforcement_gaps` until the approved adoption sequence is implemented, independently reviewed where required, merged by the owner, and verified on `main`.

## Exact Source Identity

```yaml
source_format: UTF-8 Markdown
source_size_bytes: 101922
source_sha256: 30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757
compression: gzip
compression_mtime: 0
transport_encoding: base64
```

## Deterministic Reconstruction

```bash
base64 -d docs/governance/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md.gz.b64 \
  | gzip -dc \
  > /tmp/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md

printf '%s  %s\n' \
  '30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757' \
  '/tmp/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md' \
  | sha256sum --check
```

## Authority Boundary

- This snapshot fixes the normative standard identity used by the adoption program.
- The snapshot does not, by itself, prove repository adoption or rule enforcement.
- Current repository status remains governed by `planning/NEXT_WORK.md`.
- Durable adoption authorization and scope are recorded in `planning/decisions/AIGOV_ADOPTION_DECISION.md`.
- Audit findings are recorded in `planning/reviews/AIGOV_ADOPTION_AUDIT.md`.
- Product roadmap items remain preserved; this standard does not silently complete, delete, or supersede them.
