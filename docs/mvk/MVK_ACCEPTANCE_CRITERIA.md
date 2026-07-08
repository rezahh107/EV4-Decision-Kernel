# MVK Acceptance Criteria — EV4 Decision Kernel

Status: Kernel-local MVK source/card consumption-boundary layer, external evidence workspace contracts, and Behavioral Rule Coverage v0.4.1 advisory audit model  
Scope: schemas, fixtures, validator checks, docs, registry manifest updates, behavioral coverage matrix, advisory audit parser, threshold reporting, and no-overclaim boundaries

## Prompt 3 Acceptance Criteria

```text
- Prompt 2.5 Ajv JSON Schema validation remains active.
- Structured diagnostics still include rule_id, code, message, and source.
- Invalid fixtures still assert expected diagnostic codes.
- Official Elementor source manifest exists under kernel/official-sources/.
- Real source/card artifacts are schema-validated, not only fixture-validated.
- Evidence labels exist under kernel/official-sources/.
- Every MVK core element has exactly one decision card.
- Workbook-derived sources cannot be promoted to official Elementor proof.
- Decision cards must not claim project availability, runtime proof, Builder execution, or production readiness.
- No downstream enforcement is claimed.
```

## Prompt 4 Acceptance Criteria

```text
- Architect source/card consumption schema exists.
- CE source/card consumption schema exists.
- Architect and CE valid fixtures pass schema and semantic validation.
- Required invalid fixtures fail with deterministic expected diagnostic codes.
- Architect records cannot claim project availability from official docs.
- CE records cannot claim Builder execution.
- CE records cannot claim runtime responsive validation.
- CE must check or acknowledge every required_evidence item listed by the consumed card.
- Forbidden proof claims are rejected outside explicit limitation/proof-gap fields.
- No downstream enforcement, Builder execution, runtime validation, project availability, or production readiness is claimed.
```

## Prompt 4.5 Acceptance Criteria — Behavioral Rule Coverage v0.4.1

```text
- Behavioral Rule Coverage v0.4.1 is the active practical audit model.
- The coverage matrix uses rule_id, concept, risk, prose_source, schema_carrier, validator_rule, valid_fixture, invalid_fixture, CI_step, downstream_contract, session_scope, recovery_action, and status.
- Advisory mode fails on missing document, malformed matrix, missing required columns, invalid enum values, or unsafe parser interpretation.
- Advisory mode does not fail solely because open enforcement gaps exist.
- Strict mode reports and fails on v0.4.1 threshold violations.
- The default GitHub Actions behavioral coverage workflow remains advisory.
- Prompt-level influence is not treated as system-level enforcement.
```

## Prompt 5 Acceptance Criteria — External Evidence Contracts and Evidence Workspace

```text
- Evidence status vocabulary exists at kernel/registries/evidence-status-model.v0.json.
- Evidence workspace envelope schema exists.
- Project environment profile schema exists.
- WordPress context evidence schema exists.
- Elementor project availability evidence schema exists.
- Runtime snapshot evidence schema exists.
- Responsive runtime evidence schema exists.
- All Prompt 5 schemas compile with Ajv.
- Valid Prompt 5 fixtures pass schema and semantic validation.
- Invalid Prompt 5 fixtures fail with exact expected diagnostic codes.
- Evidence package references inside workspace envelopes are checked.
- Kernel pin shape is checked where required or referenced.
- Evidence status vocabulary values are validated.
- Package status overclaims are rejected.
- Forbidden production, runtime, downstream, Builder, cross-repo, Project Gate, and official-docs-completeness claims are rejected outside explicit limitation/not-proven fields.
- Every evidence schema preserves explicit not-proven boundaries.
- Fixture evidence is not described as real runtime, project, Builder, downstream, or production evidence.
- Registry manifest lists Prompt 5 schema and evidence status artifacts.
```

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

`npm run validate:mvk` runs the Prompt 2.5 MVK validator, Prompt 3 source/card validator, Prompt 4 consumption-boundary validator, and Prompt 5 evidence-workspace validator.

Expected Prompt 5 portion:

```text
Evidence workspace validator summary
Schema setup: PASS (6/6 schemas compiled)
Evidence package registry load: PASS (5 package refs)
Schema validation: PASS (executed 15/15; valid fixtures schema-clean 6/6)
Valid fixtures passed schema + semantic validation: 6/6
Invalid fixtures failed with expected diagnostics: 9/9
Expected diagnostic assertions: PASS (9/9)
Result: PASS
```

## Known Gaps

```text
- CI workflow results must be inspected before changing any row to ci_enforced.
- Validator is MVK-local, not a full rule engine.
- Schemas are not a released canonical artifact.
- Architect repository does not yet consume this contract.
- CE repository does not yet consume this contract.
- Builder repository does not yet consume this contract.
- Responsive repository does not yet consume this contract.
- Project Gate does not yet consume this contract.
- External exporters and runtime collectors are not implemented here.
- Runtime snapshot fixtures are sample records, not production evidence.
- No other EV4 repository consumes this package yet.
- No downstream EV4 consumer rejects invalid carriers yet.
- No sequence-aware replay/diff test exists for cross_turn Critical behavior yet.
- No runtime monitor exists yet.
- No OS/process/file/network harness enforcement exists yet.
```
