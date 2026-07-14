---
title: "AI Authority Deterministic Governance — Source of Truth"
title_fa: "سند حقیقت حاکمیت دترمنستیک بر قضاوت‌های احتمالاتی هوش مصنوعی"
version: "1.1.0"
status: "active_governing_standard"
document_role: "immutable repository snapshot manifest"
repository_adoption_status: "blocked_open_enforcement_gaps"
raw_source_sha256: "30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757"
raw_source_size_bytes: 101922
payload_directory: "docs/governance/ssot-v1.1.0-payload"
payload_parts: 8
compressed_base64_length: 42288
---

# AI Authority Deterministic Governance — SSOT v1.1.0 Snapshot

## Status

This file is the readable manifest for the exact user-supplied `v1.1.0` standard snapshot. The complete source bytes are stored as eight ordered deterministic-gzip Base64 parts under:

```text
docs/governance/ssot-v1.1.0-payload/
```

The standard is active, but repository adoption is separate. This repository remains `blocked_open_enforcement_gaps` until the approved adoption sequence is implemented, independently reviewed where required, merged by the owner, and verified on `main`.

## Exact Source Identity

```yaml
source_format: UTF-8 Markdown
source_size_bytes: 101922
source_sha256: 30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757
compression: deterministic_gzip
compression_mtime: 0
transport_encoding: base64
encoded_payload_length: 42288
payload_part_count: 8
```

## Payload Part Integrity

| Part | Base64 characters | SHA-256 of normalized part |
|---|---:|---|
| `part-001.b64` | 6000 | `9c9ef266832b7748ed4f51851d70638ccf7ade1f519a612113ff669e8cb1a753` |
| `part-002.b64` | 6000 | `cc3b95570207848f4fcbbc0fe6bd912638619efae0c67acdeb89b6af13ec0c2a` |
| `part-003.b64` | 6000 | `e8d42957e7665dc3c1db4c364b7dd242e13e545a31cc6124b34ad28e0284fcd5` |
| `part-004.b64` | 6000 | `1701611223e4561456569b09a517751c03a48fb487685387fad50e1da2df7c26` |
| `part-005.b64` | 6000 | `1014c5bfe2b366586a4582d49a36a643236b180a4676b013f2aed78f54e05e78` |
| `part-006.b64` | 6000 | `f578e37ca4b9e29fb8505eba97c4d357a6510b7afd2a0ecdbebf0032c060bf43` |
| `part-007.b64` | 6000 | `ef29003748aee9069ce3975a5abcc313bc63fd84d61a9b714609fcf18a2dd9ab` |
| `part-008.b64` | 288 | `8bf646b1cae69fe7a7780d92ec5a23f13eeebf82cbe20f85c6cb52e890d4b55c` |

## Deterministic Reconstruction

```bash
cat docs/governance/ssot-v1.1.0-payload/part-*.b64 \
  | tr -d '\n' \
  | base64 -d \
  | gzip -dc \
  > /tmp/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md

printf '%s  %s\n' \
  '30ed521c5364ef5131f225c8e61bc8e49e721ae8d6bef5ca08c3941c1d523757' \
  '/tmp/AI_AUTHORITY_DETERMINISTIC_GOVERNANCE_SSOT_v1.1.0.fa.md' \
  | sha256sum --check
```

`npm run validate:roadmap-memory` independently checks every normalized part digest, encoded payload length, gzip reconstruction, source byte length and source SHA-256.

## Authority Boundary

- This snapshot fixes the normative standard identity used by the adoption program.
- The snapshot does not, by itself, prove repository adoption or rule enforcement.
- Current repository status remains governed by `planning/NEXT_WORK.md`.
- Durable adoption authorization and scope are recorded in `planning/decisions/AIGOV_ADOPTION_DECISION.md`.
- Audit findings are recorded in `planning/reviews/AIGOV_ADOPTION_AUDIT.md`.
- Product roadmap items remain preserved; this standard does not silently complete, delete, or supersede them.
