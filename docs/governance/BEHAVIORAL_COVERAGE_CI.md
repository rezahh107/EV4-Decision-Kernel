# Behavioral Coverage CI — EV4 Decision Kernel

**Status:** implemented v0.4.1 audit layer / advisory CI  
**Scope:** structural, enum, threshold, and overclaim-risk audit of `docs/governance/BEHAVIORAL_RULE_COVERAGE.md`  
**Owner or intended consumer:** Kernel maintainers, reviewers, and CI operators

## Purpose

Behavioral Rule Coverage v0.4.1 lets the Kernel distinguish prompt-level influence from system-level enforcement.

```text
prompt_level_influence:
  role framing, prose guidance, examples, templates, prompt instructions, review guidance

system_level_enforcement:
  schema validation, validator rules, fixtures, CI failure, sequence tests,
  runtime monitors, OS/harness enforcement, downstream rejection
```

The audit makes the coverage matrix machine-auditable. It does not implement the schemas, validators, fixtures, sequence tests, runtime monitors, OS/harness controls, or downstream consumers named by the matrix.

## Prompt 5 Evidence Workspace Rows

Prompt 5 adds evidence-workspace rules to the matrix. The default behavioral coverage workflow remains advisory. Prompt 5 may truthfully mark rows as `fixture_tested` when the local validator and valid/invalid fixtures assert exact diagnostics, but it must not mark those rows as `ci_enforced`, `runtime_monitor_enforced`, `sequence_ci_enforced`, `os_harness_enforced`, or `downstream_contract_enforced` without direct evidence for those carriers.

## Advisory Mode

Advisory mode is the active GitHub workflow mode.

It fails only when:

```text
- the source document is missing;
- the matrix is malformed;
- required columns are missing;
- enum values are invalid;
- the parser cannot safely interpret the matrix.
```

Advisory mode does not fail solely because open enforcement gaps exist.

## Strict Mode

Strict mode is available for local governance checks:

```bash
node tools/audit-behavioral-coverage.mjs --mode strict
```

Strict mode fails on advisory failures plus v0.4.1 threshold violations.

A strict failure can be expected while Critical/High rules remain below their minimum enforcement status. It is not automatically an implementation defect unless the failure is caused by malformed input, invalid enum values, or parser failure.

Strict mode is not the default GitHub Actions gate yet.

## Overclaim Boundaries

The audit report checks for these overclaim risks:

```text
- advisory CI treated as ci_enforced
- field presence treated as semantic enforcement
- fixture existence treated as CI enforcement
- synthetic fixture treated as real E2E
- CI success treated as production readiness
- downstream_contract_enforced without inspected downstream rejection evidence
- cross_turn Critical rule treated as satisfied by single-artifact ci_enforced
```

## Commands

```bash
node tools/audit-behavioral-coverage.mjs
node tools/audit-behavioral-coverage.mjs --mode advisory
node tools/audit-behavioral-coverage.mjs --mode strict
```

Both modes write:

```text
artifacts/behavioral-coverage-report.json
artifacts/behavioral-coverage-report.md
```

The generated `artifacts/` directory is ignored by Git. CI uploads the reports as a workflow artifact.

## Report Interpretation

An advisory `pass` means the source matrix parsed safely and enum values are valid. Warnings may still identify open enforcement gaps.

A strict `fail` means one or more v0.4.1 thresholds are unmet, unless `parse_status` is `malformed` or enum errors are present.

Neither result, by itself, makes a behavioral rule `ci_enforced`. The rule's actual validator or fixture test must fail CI on violation, and applicable downstream consumers must reject missing or invalid carriers before `downstream_contract_enforced` is justified.
