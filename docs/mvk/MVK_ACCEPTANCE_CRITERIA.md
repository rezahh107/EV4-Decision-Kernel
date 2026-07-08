# MVK Acceptance Criteria — EV4 Decision Kernel

Status: Kernel-local MVK source manifest and decision-card layer added for Prompt 3  
Scope: Official source manifest, evidence labels, core element decision cards, schemas, fixtures, validator integrity checks, and coverage alignment

## Prompt 3 Acceptance Criteria

```text
- Prompt 2.5 Ajv JSON Schema validation remains active.
- Structured diagnostics still include rule_id, code, message, and source.
- Invalid fixtures still assert expected diagnostic codes.
- Official Elementor source manifest exists under kernel/official-sources/.
- Real source/card artifacts are schema-validated, not only fixture-validated.
- Evidence labels exist under kernel/official-sources/.
- Every MVK core element has exactly one decision card.
- Standalone and registry decision cards share the same strict schema contract.
- Decision cards include use_when, avoid_when, decision_questions, required_evidence, role responsibilities, limitations, and minimum semantic children.
- Workbook-derived sources cannot be promoted to official Elementor proof.
- Decision cards must not claim project availability, runtime proof, Builder execution, or production readiness.
- Forbidden proof tokens are rejected in all non-allowed string fields.
- Forbidden proof keys with boolean true or string "true" are rejected outside allowed limitation/proof-gap paths.
- Components source entry points to the official Components page and keeps Pro/Admin/Atomic limitations.
- Source/card registry entries are listed in registry-manifest.v0.json.
- No downstream enforcement is claimed.
```

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
```

`npm run validate:mvk` runs both the Prompt 2.5 MVK validator and the Prompt 3 source/card validator. Expected source/card portion:

```text
Source/card validator summary
Schema setup: PASS (2/2 schemas compiled)
Source/card integrity: PASS
Schema validation: PASS (executed 12/12; valid fixtures schema-clean 4/4)
Valid fixtures passed schema + semantic validation: 4/4
Invalid fixtures failed with expected diagnostics: 8/8
Expected diagnostic assertions: PASS (8/8)
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
- Components require Atomic elements, Admin-level permissions, and Elementor Pro before target-project use can be claimed.
- No other EV4 repository consumes this package yet.
- No downstream EV4 consumer rejects invalid carriers yet.
```
