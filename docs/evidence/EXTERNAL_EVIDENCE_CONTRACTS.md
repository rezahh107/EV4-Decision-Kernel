# External Evidence Contracts

**Status:** Kernel-local Prompt 5 contract scaffolding  
**Scope:** schemas, fixtures, validator checks, and documentation for future external evidence packages  
**Owner or intended consumer:** EV4 Decision Kernel maintainers and future evidence producers

## Purpose

Prompt 5 defines how future external evidence sources may be represented and attached to Kernel decision records without claiming that evidence was collected, executed, validated downstream, or proven in production.

## Contracts Added

```text
kernel/schemas/evidence-workspace-envelope.schema.json
kernel/schemas/project-environment-profile.schema.json
kernel/schemas/wordpress-context-evidence.schema.json
kernel/schemas/elementor-project-availability-evidence.schema.json
kernel/schemas/runtime-snapshot-evidence.schema.json
kernel/schemas/responsive-runtime-evidence.schema.json
```

## Intended Future Producers

```text
rezahh107/EDIS-WordPress-Evidence-Exporter
rezahh107/EDIS-Browser-Runtime-Evidence-Collector
rezahh107/EDAS-v4
rezahh107/Elementor-Design-Audit-System
```

These repositories are not modified by this prompt. Their names are context only.

## Evidence Boundary

```text
Official docs prove documented platform capability only.
Project/environment evidence may support availability in a specific project only.
Runtime evidence may support observed runtime behavior for the captured context only.
Fixture validation proves local schema and semantic behavior only.
```

The contracts do not prove:

```text
production_ready
builder_executed
downstream_contract_enforced
official_docs_fully_covered
cross_repo_integrated
project_gate_integrated
```

## Validator

```text
kernel/validator/validate-evidence-workspace.mjs
```

The validator compiles all Prompt 5 schemas with Ajv, validates valid and invalid fixtures, asserts expected diagnostic codes exactly, checks evidence package references, checks kernel pins, validates status vocabulary use, and rejects runtime, downstream, Builder, and production overclaims.

## Not Included

```text
external exporters
runtime collectors
EDAS implementation
Project Gate intake
Architect/CE/Builder/Responsive repository changes
downstream consumer rejection
production readiness evidence
```
