# Behavioral Rule Coverage — EV4 Decision Kernel

**Version:** 0.1.0  
**Status:** draft / MVK governance  
**Scope:** high-risk LLM-executed prompt, protocol, handoff, schema, and repository-governance rules  
**Primary use case:** detecting and reducing prose-only behavioral gates in EV4 agentic workflows.

---

## 1. Purpose

In EV4, prompt files, protocol documents, handoff templates, schema files, fixtures, validators, and CI workflows act as **behavioral code** for LLM agents.

A behavioral rule that exists only as prose is not equivalent to an enforced system constraint.

This document tracks whether high-risk rules have been converted from prose into enforceable carriers:

```text
schema fields
validator rules
valid fixtures
invalid fixtures
CI checks
downstream consumer contracts
runtime state gates
```

The goal is not to eliminate prose. The goal is to ensure that Critical and High behavioral gates are not prose-only.

---

## 2. Key Terms

### Behavioral Gate

A behavioral gate is any rule that decides whether an LLM agent is allowed to proceed, emit a package, execute an action, assume a condition, transform an artifact, or pass work downstream.

Examples:

```text
Builder must not invent architecture.
CE closure is required before Builder-ready output.
Project Gate must not make Elementor domain decisions.
Production readiness must remain false without QA evidence.
Approved class names must not be added or removed by Builder.
```

### Enforcement Carrier

An enforcement carrier is a machine-checkable mechanism that makes a behavioral rule difficult or impossible to ignore silently.

Common carriers:

```text
JSON Schema field
YAML schema field
typed contract
validator rule
rule ID
valid fixture
invalid fixture
CI step
downstream intake rejection
runtime state transition
```

### EFBG

```text
EFBG = Enforcement-Free Behavioral Gate
```

An EFBG is a rule intended to constrain downstream LLM behavior but existing only as prose, examples, markdown protocol, role guidance, or informal instruction.

Risk:

```text
The model may understand the rule conceptually but still skip it operationally.
```

---

## 3. Semantic Illusion

Field presence is not semantic enforcement.

Bad shallow compliance:

```json
{
  "ce_closure_present": true
}
```

Better minimum semantic carrier:

```json
{
  "ce_decision_closure": {
    "closure_id": "CE-CLOSE-001",
    "architect_decision_refs": ["ADR-ELEMENT-001"],
    "constructability_status": "proven",
    "architecture_decisions_open": 0,
    "constructability_decisions_open": 0,
    "bounded_execution_details_open": ["current UI path evidence"],
    "builder_ready": true
  }
}
```

A valid carrier should make semantic drift harder, not merely make output look compliant.

---

## 4. Risk Levels

| risk | definition | enforcement expectation |
|---|---|---|
| `Critical` | Ignoring the rule can cause architecture drift, unsafe Builder decisions, invalid package emission, false readiness, integrity failure, or expensive rework. | Must not remain `prose_only` or shallow `schema_backed`. Requires validator, invalid fixture, and CI target. |
| `High` | Ignoring the rule can cause significant ambiguity, rework, layout drift, unsupported assumptions, or downstream repair. | Should reach at least `validator_backed`; preferably `fixture_tested`. |
| `Medium` | Ignoring the rule can reduce quality or clarity but does not directly break safety or downstream execution. | Schema or prose may be acceptable. |
| `Low` | Tone, style, formatting, or low-risk guidance. | Prose is usually sufficient. Do not over-engineer. |

Only Critical and High rules should normally appear in this file.

---

## 5. Enforcement Status

| status | meaning |
|---|---|
| `prose_only` | Rule exists only in prose, prompt text, role instructions, examples, or comments. |
| `schema_backed` | Rule has a schema field or typed structure, but no validator logic or failing fixture proves behavior. |
| `validator_backed` | A validator checks the rule, but fixtures may be incomplete. |
| `fixture_tested` | Valid and invalid fixtures prove validator behavior. |
| `ci_enforced` | CI runs the relevant validator/tests automatically. |
| `downstream_contract_enforced` | Downstream consumer rejects missing or invalid carriers. |

Recommended minimum thresholds:

```text
Critical -> fixture_tested minimum; ci_enforced preferred; downstream_contract_enforced final target
High     -> validator_backed minimum; fixture_tested preferred
Medium   -> schema_backed or prose may be acceptable
Low      -> prose is usually acceptable
```

---

## 6. MVK Coverage Matrix

This table is intentionally small. It tracks only the rules required to prove the first EV4 Decision Kernel vertical slice.

| rule_id | concept | risk | prose_source | schema_carrier | validator_rule | valid_fixture | invalid_fixture | CI_step | downstream_contract | status |
|---|---|---|---|---|---|---|---|---|---|---|
| `R-MVK-001` | Builder must not invent architecture when upstream decisions are missing. | Critical | `AGENTS.md`, working reference | `builder_resolution_result.decision`, `decision_ref`, `ce_closure_ref` | `None` | `None` | `None` | `None` | Builder rejects missing locked decision | `prose_only` |
| `R-MVK-002` | CE closure is required before Builder-ready package. | Critical | working reference | `ce_decision_closure`, `builder_ready` | `None` | `None` | `None` | `None` | Builder intake rejects missing closure | `prose_only` |
| `R-MVK-003` | Selected candidate must remain locked. | Critical | EV4 role boundary | `selected_candidate_id`, `architect_decision_ref` | `None` | `None` | `None` | `None` | CE/Builder reject candidate mismatch | `prose_only` |
| `R-MVK-004` | Approved class names must not be added or removed by Builder. | Critical | EV4 role boundary | `approved_class_names`, `class_change_policy` | `None` | `None` | `None` | `None` | Builder action batch rejects unapproved class | `prose_only` |
| `R-MVK-005` | Absolute positioning requires containing-block proof. | Critical | working reference | `position_decision_record.containing_block_ref` | `None` | `None` | `None` | `None` | CE blocks Builder-ready if missing | `prose_only` |
| `R-MVK-006` | Nested clickable topology is rejected. | Critical | working reference | `interaction_topology.nested_click_risk` | `None` | `None` | `None` | `None` | Architect/CE block invalid topology | `prose_only` |
| `R-MVK-007` | Exact UI path requires evidence. | High | Builder UX/evidence boundary | `ui_evidence_status`, `exact_path_allowed` | `None` | `None` | `None` | `None` | Builder asks evidence instead of guessing | `prose_only` |
| `R-MVK-008` | Project Gate rejects missing kernel pin/hash. | Critical | README, working reference | `KERNEL_PIN.json`, `registry_hash` | `None` | `None` | `None` | `None` | Project Gate rejects incomplete packet | `prose_only` |
| `R-MVK-009` | `production_ready: true` requires QA/runtime evidence. | Critical | EV4 role boundary | `production_ready`, `qa_evidence_refs` | `None` | `None` | `None` | `None` | Gate keeps production_ready false | `prose_only` |

The current `prose_only` status is intentional for the initial documentation scaffold. Wave 1 must start closing these gaps.

---

## 7. Interpretation Rules

### Critical Rule With Weak Status

If a Critical rule has status:

```text
prose_only
schema_backed
```

then it is an open enforcement gap.

Required next action:

```text
Add schema carrier.
Add validator rule.
Add invalid fixture.
Wire into CI or local validation command.
Add downstream rejection requirement.
```

### High Rule With Weak Status

If a High rule is `prose_only`, schedule schema or validator work.

If a High rule is `schema_backed`, it may be acceptable temporarily only if the risk is documented and a fixture path is planned.

### CI-Enforced Is Not Final

A rule can be `ci_enforced` and still not fully safe if the downstream consumer accepts invalid or missing data.

Final target for cross-agent handoffs:

```text
downstream_contract_enforced
```

---

## 8. Audit Method

Search prose files for modal and imperative language.

English patterns:

```text
must
must not
should
should not
never
always
only
shall
required
forbidden
blocked
allowed only
do not
cannot
```

Persian patterns:

```text
باید
نباید
هرگز
همیشه
فقط
مجاز نیست
الزامی است
اجباری است
مسدود
متوقف شود
```

Red flags:

```text
A rule says must but no schema field exists.
A rule says must not but no invalid fixture exists.
A rule blocks Builder behavior but Builder intake does not reject missing data.
A rule depends on model memory or good faith.
A rule uses vague terms like preserve, match, respect, same as reference without semantic children.
A rule says fail closed but missing data passes validation.
```

---

## 9. Anti-Overengineering Guard

Do not create validators for every instruction.

Do not add low-risk style guidance.

Do not enforce creative preferences unless violation causes a structural or safety failure.

Good enforcement is:

```text
small
specific
testable
fail-closed
fixture-backed
downstream-aware
```

Bad enforcement is:

```text
large
vague
difficult to maintain
not tested
not connected to CI
not connected to downstream rejection
```

---

## 10. Patch Strategy

Recommended sequence:

```text
PATCH-001: Coverage Matrix Lite
  Add this document.
  Track Critical and High rules only.

PATCH-002: Critical Rule Coverage Validator
  Add a small validator that fails if risk == Critical and status is prose_only or schema_backed.
  Keep parser simple and conservative.

PATCH-003: Close Top Coverage Gaps
  Add schema carriers, validator rules, invalid fixtures, and CI steps for the most dangerous gaps.

PATCH-004: Downstream Contract Alignment
  Ensure downstream agents reject missing or invalid carriers.

PATCH-005: Stale Prose Cleanup
  Replace duplicated prose with references to canonical schema, validator, and coverage entries.
```

---

## 11. Governance Rule

Every new Critical behavioral rule must answer:

```text
What field carries it?
What validator checks it?
What invalid fixture proves it fails?
What CI step runs it?
What downstream consumer rejects it?
```

If these questions cannot be answered, the rule is not yet enforced.