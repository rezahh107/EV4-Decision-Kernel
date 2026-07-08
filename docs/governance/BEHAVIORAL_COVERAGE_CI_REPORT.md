# Behavioral Coverage CI Report

**Status:** checked-in v0.4.1 report reference / not an executed CI result  
**Source of actual results:** generated `artifacts/behavioral-coverage-report.{json,md}`

## Purpose

This file documents the current report shape without claiming that a workflow or local command has passed.

Generate a current advisory report with:

```bash
node tools/audit-behavioral-coverage.mjs --mode advisory
```

Evaluate strict v0.4.1 thresholds with:

```bash
node tools/audit-behavioral-coverage.mjs --mode strict
```

## Expected Interpretation During the Current Phase

```text
advisory pass:
  the coverage document and matrix were structurally parseable;
  enum values were valid;
  coverage warnings and threshold gaps may remain.

strict fail:
  one or more v0.4.1 Critical/High thresholds are still unmet;
  this can be expected while rules remain below ci_enforced, sequence_ci_enforced,
  runtime_monitor_enforced, or downstream_contract_enforced as applicable.
```

## Required v0.4.1 Report Sections

```text
source
mode
outcome
parse_status
rules parsed
risk counts
status counts
threshold violations
overclaim risk checks
structural errors
open enforcement gaps
rules
```

## Overclaim Boundary

Neither advisory nor strict output, by itself, makes a behavioral rule `ci_enforced`.

```text
advisory_ci_observed != ci_enforced
schema field presence != semantic enforcement
fixture existence != CI enforcement
CI success != production readiness
downstream_contract_enforced requires inspected downstream rejection evidence
sequence_ci_enforced requires sequence-aware replay/diff tests or equivalent
runtime_monitor_enforced requires an actual runtime monitor
os_harness_enforced requires OS/process/file/network-level enforcement
```

## Generated Report Paths

```text
artifacts/behavioral-coverage-report.json
artifacts/behavioral-coverage-report.md
```

The JSON report is intended for machine consumption. The Markdown report is intended for maintainers and reviewers. Both are generated artifacts and are not committed.
