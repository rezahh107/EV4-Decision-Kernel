# MVK Acceptance Criteria — EV4 Decision Kernel

Status: Kernel-local MVK validation repair added for Prompt 2.5  
Scope: JSON Schema conformance gate, semantic validator diagnostics, fixture assertions, and coverage alignment

## Prompt 2.5 Acceptance Criteria

```text
- Core element registry contains only the approved eight MVK element IDs.
- Core constraint registry remains limited to the approved six MVK hard gates.
- JSON Schema Draft 2020-12 conformance validation is executed by `kernel/validator/validate-mvk.mjs`.
- Fixtures are mapped to their intended schema kind before semantic validation.
- Valid fixtures pass JSON Schema validation and semantic validation.
- Invalid fixtures fail with expected diagnostic codes.
- Schema validation failures emit structured diagnostics with `rule_id`, `code`, `message`, and `source`.
- Semantic validation failures emit structured diagnostics with `rule_id`, `code`, `message`, and `source`.
- R-MVK-003 selected-candidate lock is aligned between the coverage matrix and rule registry.
- R-MVK-005 has matching valid and invalid `position_decision_record` fixtures.
- R-MVK-007 remains `schema_backed` only; exact UI path evidence is not fixture-tested yet.
- `.github/workflows/validate-mvk.yml` installs MVK validator dependencies and runs `npm run validate:mvk`.
- No downstream enforcement is claimed.
```

## Local Validation

```bash
npm install
npm run validate:mvk
```

Expected output:

```text
MVK validator summary
Registries: PASS
Schema setup: PASS (8/8 schemas compiled)
Schema validation: PASS (executed 16/16; valid fixtures schema-clean 5/5)
Valid fixtures passed schema + semantic validation: 5/5
Invalid fixtures failed with expected diagnostics: 11/11
Expected diagnostic assertions: PASS (11/11)
Result: PASS
```

## Coverage Audit

```bash
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

Expected interpretation:

```text
- Advisory mode should pass if the coverage matrix remains structurally valid.
- Strict mode should pass when all Critical rows avoid prose_only/schema_backed, have invalid fixtures, and do not claim ci_enforced without CI_step.
- Strict mode does not prove downstream enforcement.
```

## Known Gaps

```text
- CI workflow results must be inspected before changing any row to `ci_enforced`.
- Validator is MVK-local, not a full rule engine.
- Schemas are not a released canonical artifact.
- Responsive Runtime Validation Record remains future scope.
- R-MVK-007 exact UI path evidence has schema carriers but no semantic validator or fixture pair yet.
- No other EV4 repository consumes this package yet.
- No downstream EV4 consumer rejects invalid carriers yet.
```
