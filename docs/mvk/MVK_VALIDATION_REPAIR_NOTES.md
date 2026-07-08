# MVK Validation Repair Notes — Prompt 2.5

**Status:** implementation note for MVK validation repair  
**Scope:** local schema conformance, structured diagnostics, fixture expectations, and coverage alignment  
**Owner:** `EV4-Decision-Kernel`

## What changed

```text
- `validate-mvk.mjs` now executes JSON Schema Draft 2020-12 validation using Ajv.
- Fixture validation is mapped by record kind before semantic checks run.
- Validator failures are structured diagnostics with `rule_id`, `code`, `message`, `source`, and optional `path`.
- Invalid fixtures assert expected diagnostic codes.
- R-MVK-003 is present in `kernel/rules/mvk-hard-gates.v0.json` and the coverage matrix.
- R-MVK-005 now has a valid `position_decision_record` fixture matching the invalid absolute-position fixture.
```

## Schema map

```text
element_decision_record -> kernel/schemas/element-decision-record.schema.json
position_decision_record -> kernel/schemas/position-decision-record.schema.json
value_unit_decision_record -> kernel/schemas/value-unit-decision-record.schema.json
ce_decision_closure -> kernel/schemas/ce-decision-closure.schema.json
builder_resolution_result -> kernel/schemas/builder-resolution-result.schema.json
project_gate_acceptance_packet -> kernel/schemas/project-gate-acceptance-packet.schema.json
kernel_pin -> kernel/schemas/kernel-pin.schema.json
evidence -> kernel/schemas/evidence.schema.json
```

## Diagnostic boundary

```text
schema: JSON Schema conformance failures
semantic: MVK-local hard-gate behavior failures
registry: registry envelope and core ID failures
fixture: fixture read/parse failures
```

Schema diagnostics use `SCHEMA_CONFORMANCE` unless a later prompt intentionally maps a specific schema failure to a behavioral rule. Semantic diagnostics map to the relevant `R-MVK-*` rule where implemented.

## Coverage honesty

```text
- `fixture_tested` means local schema + semantic validation and expected invalid diagnostics are proven by fixture execution.
- `ci_enforced` is not claimed until the PR workflow run is observed passing.
- `downstream_contract_enforced` is not claimed because no downstream EV4 consumer rejects these carriers yet.
- R-MVK-007 remains `schema_backed`; exact UI path evidence still lacks a semantic validator and invalid fixture pair.
```

## Web/source note

Ajv documentation states that Draft 2020-12 support uses a separate Ajv class and that Draft 2020-12 cannot be mixed with previous JSON Schema versions in the same Ajv instance. The MVK schemas use Draft 2020-12, so the validator uses `ajv/dist/2020.js`.

Source: https://ajv.js.org/json-schema.html

## Explicitly not included

```text
- official Elementor source manifest
- Element Decision Cards
- full rule engine platform
- release automation
- reusable workflows
- cross-repo integration patches
- signed validation outputs
- downstream runtime enforcement
```
