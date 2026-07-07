# Behavioral Rule Coverage — EV4 Decision Kernel

**Version:** 0.2.0-mvk-local  
**Status:** Kernel-local schema / validator / fixture coverage for Prompt 2

## Enforcement Status

| status | meaning |
|---|---|
| `prose_only` | Rule exists only in prose. |
| `schema_backed` | Rule has a schema field but no fixture-proven validator behavior. |
| `validator_backed` | Validator checks the rule, but fixture coverage is incomplete. |
| `fixture_tested` | Valid and invalid fixtures prove validator behavior locally. |
| `ci_enforced` | CI runs the relevant validator/tests automatically. |

No rule is marked `ci_enforced` in Prompt 2.

## MVK Coverage Matrix

| rule_id | concept | risk | status |
|---|---|---|---|
| `R-MVK-001` | Builder must not invent architecture / unlisted fallback. | Critical | `fixture_tested` |
| `R-MVK-002` | CE closure is required before Builder-ready package. | Critical | `fixture_tested` |
| `R-MVK-003` | Selected candidate must remain locked. | Critical | `validator_backed` |
| `R-MVK-004` | Approved class names must not be added or removed by Builder. | Critical | `prose_only` |
| `R-MVK-005` | Absolute positioning requires containing-block proof. | Critical | `fixture_tested` |
| `R-MVK-006` | Nested clickable topology is rejected. | Critical | `fixture_tested` |
| `R-MVK-007` | Exact UI path requires evidence. | High | `schema_backed` |
| `R-MVK-008` | Project Gate rejects missing kernel pin/hash. | Critical | `fixture_tested` |
| `R-MVK-009` | `production_ready: true` requires QA/runtime evidence. | Critical | `prose_only` |

## Local Validation

```bash
npm run validate:mvk
```

Expected result:

```text
Result: PASS
```

`fixture_tested` means local validator and fixtures cover the rule. It does not mean CI enforcement or downstream contract enforcement.
