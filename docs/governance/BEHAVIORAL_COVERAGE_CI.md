# Behavioral Coverage CI — EV4 Decision Kernel

**Status:** implemented audit layer / advisory CI  
**Scope:** structural and coverage-state audit of `docs/governance/BEHAVIORAL_RULE_COVERAGE.md`  
**Owner or intended consumer:** Kernel maintainers, reviewers, and CI operators

## Purpose

Behavioral rules can influence an LLM without being enforceable by the repository. The coverage matrix records the carriers expected to move a rule from guidance toward deterministic rejection:

```text
Concept
  -> canonical schema field
  -> minimum semantic children
  -> validator rule
  -> valid fixture
  -> invalid fixture
  -> CI enforcement
  -> downstream rejection
```

The audit makes the matrix machine-auditable and detects weak or missing coverage. It does not implement the schemas, validators, fixtures, or downstream consumers named by that matrix.

## Enforcement Boundary

```text
prompt_level_influence:
  prose guidance, templates, examples, role instructions

system_level_enforcement:
  parser checks, schema validation, validator rules, fixtures, CI,
  downstream rejection
```

`tools/audit-behavioral-coverage.mjs` is system-level enforcement for the **shape and declared state of the coverage matrix**. It is not system-level enforcement of each listed behavioral rule.

Running this audit does not justify changing a matrix row to `ci_enforced`. That status requires the rule's actual validator or fixture test to run in CI. Cross-agent enforcement remains incomplete until the applicable downstream consumer rejects missing or invalid carriers.

## Commands

The script has no external package dependency and defaults to advisory mode:

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

## Advisory Mode

Advisory mode is the active repository workflow mode. It fails only when the source document is unavailable or the matrix is structurally malformed, including:

```text
- missing MVK Coverage Matrix section
- missing or non-exact required columns
- malformed Markdown separator row
- wrong row cell count
- empty cells instead of explicit None
- duplicate rule_id values
- no parseable rule rows
```

Weak Critical/High coverage, missing carriers, and invalid risk/status values are reported without failing advisory mode. This is intentional while MVK schemas, validators, and fixtures are developed in a separate scoped patch.

## Strict Mode

Strict mode is available for local governance checks and later CI activation. It fails on structural errors plus any of these conditions:

```text
- a Critical rule is prose_only or schema_backed
- a Critical rule has invalid_fixture == None
- a Critical rule marked ci_enforced has CI_step == None
- any rule has a risk outside Critical, High, Medium, Low
- any rule has a status outside the allowed status set
```

Strict mode is not used by the current GitHub Actions workflow. A strict failure during the current phase is an expected coverage result, not necessarily a parser failure.

## Current Repository Phase

This patch adds only the behavioral coverage audit layer:

```text
included:
  coverage parser
  advisory workflow
  strict-mode capability
  generated machine/human reports

not included:
  MVK schemas
  MVK fixtures
  semantic validator implementation
  downstream intake rejection
  release automation
  reusable workflows
```

The workflow runs on pull requests, pushes to `main`, and manual dispatch. It remains advisory so known unenforced Critical rules do not block parallel MVK work.

## Later Fail-Closed Activation

Moving CI from advisory to strict requires an explicit governance change. Before activation, applicable Critical rows should have real, repository-resolvable carriers and executed evidence for at least:

```text
- semantic validator rule
- invalid fixture
- CI step that runs the validator or fixture test
```

Strict CI still does not prove final cross-agent enforcement. Where a rule governs a handoff, the target remains `downstream_contract_enforced`, backed by deterministic downstream rejection.

## Report Interpretation

An advisory `pass` means the source matrix parsed successfully; warnings may still identify open enforcement gaps.

A strict `fail` means one or more configured strict thresholds are unmet. It does not mean the Markdown parser failed unless `parse_status` is `malformed`.

The checked-in `BEHAVIORAL_COVERAGE_CI_REPORT.md` is a placeholder and usage reference. Actual results are generated under `artifacts/` and uploaded by CI.
