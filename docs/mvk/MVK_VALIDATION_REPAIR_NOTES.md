# MVK Validation Repair Notes — Prompt 2.5

**Status:** implementation note for MVK validation repair  
**Scope:** local schema conformance, structured diagnostics, fixture expectations, npm dependency locking, and coverage alignment  
**Owner:** `EV4-Decision-Kernel`

## What changed

```text
- `validate-mvk.mjs` now executes JSON Schema Draft 2020-12 validation using Ajv.
- Fixture validation is mapped by record kind before semantic checks run.
- Validator failures are structured diagnostics with `rule_id`, `code`, `message`, `source`, and optional `path`.
- Invalid fixtures assert expected diagnostic codes.
- R-MVK-003 is present in `kernel/rules/mvk-hard-gates.v0.json` and the coverage matrix.
- R-MVK-005 now has a valid `position_decision_record` fixture matching the invalid absolute-position fixture.
- `package-lock.json` pins the npm dependency tree.
- `Validate MVK` installs dependencies with `npm ci`.
- `Behavioral Coverage Audit` runs both advisory and strict modes in CI.
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

## Local supply-chain note

`package-lock.json` was generated from the exact `package.json` dependency set and normalized to the public npm registry URLs. A sandbox check verified that the committed dependency graph can be installed with:

```bash
npm ci --ignore-scripts --no-audit --no-fund
```

CI remains the repository evidence source for the full PR validation path.

## Web/source note

Ajv documentation states that Draft 2020-12 support uses a separate Ajv class and that Draft 2020-12 cannot be mixed with previous JSON Schema versions in the same Ajv instance. The MVK schemas use Draft 2020-12, so the validator uses `ajv/dist/2020.js`.

npm documentation states that `package-lock.json` describes the exact dependency tree and is intended to be committed so teammates, deployments, and CI install the same dependencies. npm documentation also defines `npm ci` as the clean-install command intended for automated environments with an existing lockfile.

Sources:

```text
https://ajv.js.org/json-schema.html
https://docs.npmjs.com/cli/v10/configuring-npm/package-lock-json
https://docs.npmjs.com/cli/v10/commands/npm-ci
```

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
