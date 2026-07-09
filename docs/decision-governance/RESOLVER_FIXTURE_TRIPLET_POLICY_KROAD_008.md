# KROAD-008 Resolver Fixture Triplet Policy

**Status:** KROAD-008 implementation / Kernel-local  
**Scope:** fixture triplet coverage for active Resolver MVP rules  
**Owner:** Kernel  
**Machine-readable artifacts:**

```text
kernel/decision-governance/resolver-fixture-triplet-policy.v0.json
kernel/validator/validate-resolver-fixture-triplets.mjs
kernel/decision-governance/resolver-rule-registry.v0.json
```

## What this is

KROAD-008 defines and enforces the rule that an active Resolver MVP rule is not considered complete unless it has valid, invalid, and adversarial fixture coverage.

The active Resolver MVP family remains:

```text
layout_structure
```

The active rule remains:

```text
resolver.rule.layout_structure.mvp.v0@0.1.0
```

## What this is not

```text
- not KROAD-009 Vertical Slice
- not a new Resolver MVP family
- not all-P0 resolver coverage
- not downstream consumer enforcement
- not Project Gate intake
- not runtime/browser evidence
- not Builder execution proof
- not production readiness
- not real target-project proof
```

## Triplet requirement

Every active resolver rule must have at least one fixture in each category:

```text
valid
invalid
adversarial
```

A resolver rule is incomplete when any category is missing.

## Fixture roles

### `valid`

A valid fixture must pass by deterministic resolver evaluation and match its explicit `expected_result`.

The current KROAD-008 valid coverage anchor is:

```text
kernel/fixtures/valid/resolver_mvp/layout_structure_auto_resolved_flexbox.json
```

This proves the resolver accepts exact `project_export` evidence-ref-bound single-axis layout context and resolves to `flexbox`.

### `invalid`

An invalid fixture must fail clearly, usually as `unresolvable`, and must assert specific diagnostic codes.

The current KROAD-008 invalid coverage anchor is:

```text
kernel/fixtures/invalid/resolver_mvp/invalid_missing_evidence_refs.json
```

This proves missing evidence refs fail closed with explicit diagnostics.

### `adversarial`

An adversarial fixture must look close to valid but must not pass as valid. It must either become `conditional` or `unresolvable`, and it must assert specific diagnostic codes.

The current KROAD-008 adversarial coverage anchor is:

```text
kernel/fixtures/adversarial/resolver_mvp/adversarial_grid_without_availability.json
```

This case is meaningfully different from an ordinary invalid fixture because it has:

```text
- project_export evidence;
- exact required evidence ref;
- structured two-axis grid context;
- failure only because grid_availability_proven=false.
```

It therefore tests a near-valid overclaim boundary: a grid-like project-export context must not auto-resolve unless grid availability is explicitly evidenced.

## Machine-readable policy

The policy file is:

```text
kernel/decision-governance/resolver-fixture-triplet-policy.v0.json
```

It records:

```text
- required fixture kinds;
- active rule triplet mapping;
- valid / invalid / adversarial fixture refs;
- adversarial distinction metadata;
- empty fixture stub policy;
- case-name dispatch prohibition;
- synthetic fixture evidence boundary;
- KROAD-009+ boundary flags.
```

## Validator enforcement

The validator is:

```text
kernel/validator/validate-resolver-fixture-triplets.mjs
```

It checks that:

```text
- every active rule in resolver-rule-registry.v0.json has a policy entry;
- valid, invalid, and adversarial fixture arrays are non-empty;
- fixture paths match their expected category;
- fixture metadata and file case_kind match;
- fixture input and expected_result are non-empty;
- invalid and adversarial fixtures assert diagnostic codes;
- invalid fixtures fail closed as unresolvable;
- adversarial fixtures are conditional or unresolvable, never auto_resolved;
- adversarial fixtures include explicit distinction metadata;
- valid, invalid, and adversarial inputs are not identical;
- fixture evidence refs remain source_type=kernel_fixture;
- fixture notes and evidence limitations do not claim real target-project proof or runtime validation;
- resolveDecision(fixture.input) matches expected resolver status, selected option, and diagnostic codes.
```

## Case-name dispatch boundary

The validator does not accept coverage just because a case name or path exists. It reads the fixture input, reruns the deterministic Resolver MVP, and compares actual output to `expected_result`.

Identical resolver inputs across valid, invalid, and adversarial categories are rejected so a fixture cannot pass by category label alone.

## Empty fixture stubs

A fixture does not count when it lacks required fields such as:

```text
fixture_type
schema_version
case_id
case_kind
input
expected_result
```

A non-empty `input` object and explicit `expected_result.selected_option` are required.

## Synthetic evidence boundary

KROAD-008 fixture evidence is synthetic Kernel-local evidence only.

The validator requires fixture evidence refs and notes to preserve these boundaries:

```text
- source_type=kernel_fixture;
- controlled fixture or matrix guidance only;
- not real target-project proof/evidence;
- not runtime validation.
```

Synthetic fixture evidence must not be represented as target-project availability, runtime proof, Builder execution proof, downstream acceptance, or production readiness.

## Validation

Run:

```bash
npm run validate:resolver-fixture-triplets
npm run validate:mvk
npm run validate:roadmap-memory
```

`validate:mvk` includes `validate:resolver-fixture-triplets`.

## Boundaries preserved

```text
- no KROAD-009 Vertical Slice
- no downstream consumer contract
- no Project Gate intake
- no runtime/browser evidence implementation
- no Builder execution proof
- no production-readiness carrier
- no all-P0 resolver expansion
- no new Resolver MVP family
```

## Next allowed step

After KROAD-008 is merged, the next roadmap step is:

```text
KROAD-009 — Vertical Slice
```

KROAD-009 is not implemented by this policy, validator, or PR.
