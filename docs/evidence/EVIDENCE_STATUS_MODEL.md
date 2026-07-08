# Evidence Status Model

**Status:** Kernel-local Prompt 5 evidence status vocabulary  
**Scope:** external evidence package status terms, fixture status terms, and no-overclaim boundaries

## Purpose

The evidence status model lets the Kernel represent missing, declared, schema-valid, fixture-validated, and runtime-collected evidence without promoting any status beyond what the carrier proves.

## Status Vocabulary

```text
not_provided
declared_not_available
provided_unvalidated
provided_schema_valid
implemented_awaiting_fixture_validation
validated_fixture
collected_runtime_evidence
rejected_invalid
insufficient_evidence
not_applicable_with_reason
```

## Promotion Boundaries

```text
provided_schema_valid != runtime_validated
validated_fixture != real target-project proof
collected_runtime_evidence != production_ready
official docs != project availability evidence
fixture evidence != Builder execution
Kernel-local contract validation != downstream contract enforcement
```

## Required Not-Proven Claims

Every external evidence contract must preserve these prohibited claims in its not-proven boundary:

```text
production_ready
builder_executed
downstream_contract_enforced
official_docs_fully_covered
cross_repo_integrated
project_gate_integrated
```

## Registry Artifact

```text
kernel/registries/evidence-status-model.v0.json
```

This registry is Kernel-local scaffolding. It is not a canonical release artifact and is not consumed by downstream EV4 repositories yet.
