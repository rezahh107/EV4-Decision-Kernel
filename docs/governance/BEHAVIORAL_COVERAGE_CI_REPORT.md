# Behavioral Coverage CI Report

**Status:** checked-in placeholder / not an executed CI result  
**Source of actual results:** generated `artifacts/behavioral-coverage-report.{json,md}`

## Purpose

This file documents where to find an audit result without claiming that a workflow or local command has passed.

Generate a current report with:

```bash
node tools/audit-behavioral-coverage.mjs --mode advisory
```

Optionally evaluate the future fail-closed threshold with:

```bash
node tools/audit-behavioral-coverage.mjs --mode strict
```

## Expected Interpretation During the Current Phase

```text
advisory pass:
  the coverage document and matrix were structurally parseable;
  coverage warnings may remain.

strict fail:
  one or more configured strict coverage thresholds are still unmet;
  this can be expected while Critical rules remain prose_only or schema_backed.
```

Neither result, by itself, makes a behavioral rule `ci_enforced`. The rule's actual validator or fixture test must run in CI, and applicable downstream consumers must reject missing or invalid carriers before `downstream_contract_enforced` is justified.

## Generated Report Paths

```text
artifacts/behavioral-coverage-report.json
artifacts/behavioral-coverage-report.md
```

The JSON report is intended for machine consumption. The Markdown report is intended for maintainers and reviewers. Both are generated artifacts and are not committed.
