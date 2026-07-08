# MVK Acceptance Criteria — EV4 Decision Kernel

Status: Kernel-local MVK source/card consumption-boundary layer plus Behavioral Rule Coverage v0.4.1 advisory audit model  
Scope: Architect and CE consumption-boundary schemas, fixtures, validator checks, docs, registry manifest updates, behavioral coverage matrix, advisory audit parser, threshold reporting, and no-overclaim boundaries

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

## Prompt 4 Acceptance Criteria

```text
- Architect source/card consumption schema exists.
- CE source/card consumption schema exists.
- Architect and CE valid fixtures pass schema and semantic validation.
- Required invalid fixtures fail with deterministic expected diagnostic codes.
- consumed_element_id must resolve to a real card in kernel/decision-cards/elements.core.v0.json.
- consumed_card_ref must match the consumed element card ref.
- official_source_refs_used must exist in kernel/official-sources/elementor-v4-source-manifest.v0.json.
- Architect records cannot claim project availability from official docs.
- Architect records cannot claim a card proves the correct design choice.
- CE records cannot claim Builder execution.
- CE records cannot claim runtime responsive validation.
- CE constructable_with_limitations and constructable_pending_builder_resolution require constructability_evidence.
- CE must check or acknowledge every required_evidence item listed by the consumed card.
- CE `required_evidence_checked` entries with `checked` require `evidence_ref`.
- CE `required_evidence_checked` entries with `acknowledged_not_available` or `not_applicable_with_reason` require `reason`.
- Forbidden proof claims are rejected outside explicit limitation/proof-gap fields with stem-oriented scanner coverage.
- Invalid fixture assertions reject unexpected extra diagnostic codes.
- Registry manifest lists the consumption-boundary schema entries.
- Behavioral coverage rows describe only Kernel-local schema, validator, fixture, and advisory CI behavior.
- No downstream enforcement, Builder execution, runtime validation, project availability, constructability proof from official docs, or production readiness is claimed.
```

## Prompt 4.5 Acceptance Criteria — Behavioral Rule Coverage v0.4.1

```text
- Behavioral Rule Coverage v0.4.1 is the active practical audit model.
- The coverage matrix uses rule_id, concept, risk, prose_source, schema_carrier, validator_rule, valid_fixture, invalid_fixture, CI_step, downstream_contract, session_scope, recovery_action, and status.
- The audit script validates required columns.
- The audit script validates risk, session_scope, recovery_action, and status enum values.
- Advisory mode fails on missing document, malformed matrix, missing required columns, invalid enum values, or unsafe parser interpretation.
- Advisory mode does not fail solely because open enforcement gaps exist.
- Strict mode reports and fails on v0.4.1 threshold violations.
- The default GitHub Actions behavioral coverage workflow remains advisory.
- advisory_ci_observed is not treated as ci_enforced.
- downstream_contract_enforced requires inspected downstream rejection evidence.
- sequence_ci_enforced requires sequence-aware replay/diff tests or equivalent.
- runtime_monitor_enforced requires an actual runtime monitor.
- os_harness_enforced requires OS/process/file/network-level enforcement.
- Overclaim risk checks are included in generated JSON and Markdown reports.
- Prompt 5 external evidence contracts are not started.
```

## Local Validation

```bash
npm ci --ignore-scripts --no-audit --no-fund
npm run validate:mvk
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

`npm run validate:mvk` runs the Prompt 2.5 MVK validator, the Prompt 3 source/card validator, and the Prompt 4 consumption-boundary validator. Expected Prompt 4 portion:

```text
Source/card consumption-boundary validator summary
Schema setup: PASS (2/2 schemas compiled)
Consumption registry load: PASS (8 cards; 16 sources)
Schema validation: PASS (executed 18/18; valid fixtures schema-clean 4/4)
Valid fixtures passed schema + semantic validation: 4/4
Invalid fixtures failed with expected diagnostics: 14/14
Expected diagnostic assertions: PASS (14/14)
Result: PASS
```

## Known Gaps

```text
- CI workflow results must be inspected before changing any row to ci_enforced.
- Validator is MVK-local, not a full rule engine.
- Schemas are not a released canonical artifact.
- Architect repository does not yet consume this contract.
- CE repository does not yet consume this contract.
- Responsive Runtime Validation Record remains future scope.
- Project availability requires future WordPress/EDIS project evidence.
- Runtime proof requires future browser/runtime evidence.
- Builder execution proof requires future Builder evidence.
- Components require Atomic elements, Admin-level permissions, and Elementor Pro before target-project use can be claimed.
- No other EV4 repository consumes this package yet.
- No downstream EV4 consumer rejects invalid carriers yet.
- No sequence-aware replay/diff test exists for cross_turn Critical behavior yet.
- No runtime monitor exists yet.
- No OS/process/file/network harness enforcement exists yet.
```
