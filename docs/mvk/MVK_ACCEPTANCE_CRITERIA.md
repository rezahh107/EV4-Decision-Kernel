# MVK Acceptance Criteria — EV4 Decision Kernel

Status: Kernel-local MVK source manifest and decision-card layer added for Prompt 3  
Scope: Official source manifest, evidence labels, core element decision cards, schemas, fixtures, validator integrity checks, and coverage alignment

## Prompt 3 Acceptance Criteria

```text
- Prompt 2.5 Ajv JSON Schema validation remains active.
- Structured diagnostics still include rule_id, code, message, and source.
- Invalid fixtures still assert expected diagnostic codes.
- Official Elementor source manifest exists under kernel/official-sources/.
- Evidence labels exist under kernel/official-sources/.
- Every MVK core element has exactly one decision card.
- Decision cards include use_when, avoid_when, decision_questions, required_evidence, role responsibilities, limitations, and minimum semantic children.
- Workbook-derived sources cannot be promoted to official Elementor proof.
- Decision cards must not claim project availability, runtime proof, Builder execution, or production readiness.
- Source/card registry entries are listed in registry-manifest.v0.json.
- No downstream enforcement is claimed.
```

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
```

Expected MVK output:

```text
MVK validator summary
Registries: PASS
Schema setup: PASS (10/10 schemas compiled)
Source/card integrity: PASS
Schema validation: PASS (executed 25/25; valid fixtures schema-clean 8/8)
Valid fixtures passed schema + semantic validation: 8/8
Invalid fixtures failed with expected diagnostics: 17/17
Expected diagnostic assertions: PASS (17/17)
Result: PASS
```

## Known Gaps

```text
- CI workflow results must be inspected before changing any row to ci_enforced.
- Validator is MVK-local, not a full rule engine.
- Schemas are not a released canonical artifact.
- Responsive Runtime Validation Record remains future scope.
- Project availability requires future WordPress/EDIS project evidence.
- Runtime proof requires future browser/runtime evidence.
- Builder execution proof requires future Builder evidence.
- No other EV4 repository consumes this package yet.
- No downstream EV4 consumer rejects invalid carriers yet.
```
