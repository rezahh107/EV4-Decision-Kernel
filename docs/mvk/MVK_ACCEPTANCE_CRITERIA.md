# MVK Acceptance Criteria — EV4 Decision Kernel

Status: Kernel-local MVK foundation added for Prompt 2  
Scope: First local schema, fixture, and validator package

## Prompt 2 Acceptance Criteria

```text
- Core element registry contains only the approved eight MVK element IDs.
- Core constraint registry contains only the approved six MVK hard gates.
- JSON Schema files exist for evidence, kernel pin, decision records, CE closure, Builder resolution, and Project Gate packet.
- Valid fixtures pass local validation.
- Invalid fixtures fail local validation.
- Validator includes semantic checks beyond shallow field presence.
- Project Gate packet carries pin, lineage, validation reports, and gate decision only.
- Documentation does not claim CI enforcement unless CI actually runs the validator.
```

## Local Validation

```bash
npm run validate:mvk
```

Expected output:

```text
MVK validator summary
Registries: PASS
Valid fixtures passed: 4/4
Invalid fixtures failed as expected: 5/5
Result: PASS
```

## Known Gaps

```text
- CI is not wired yet.
- Validator is MVK-local, not a full rule engine.
- Schemas are not a released canonical artifact.
- Responsive Runtime Validation Record remains future scope.
- No other EV4 repository consumes this package yet.
```
