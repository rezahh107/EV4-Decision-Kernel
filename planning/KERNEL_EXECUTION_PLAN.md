# EV4 Decision Kernel — Execution Plan

## Purpose

This file is the durable execution plan for `rezahh107/EV4-Decision-Kernel`.

Future LLM sessions must read this file before proposing, implementing, or auditing the next task. Chat history is not a source of truth. This file explains what each roadmap item means, what it must produce, what evidence is required, and what must not be overclaimed.

`planning/NEXT_WORK.md` should remain the short dashboard. This file is the detailed operating map.

---

## Current Architecture Direction

`EV4-Decision-Kernel` is a decision-governance repository for Elementor V4 pipeline decisions.

It exists because important Elementor V4 choices are not simple one-step choices. Examples:

- Div vs Flexbox vs Grid
- Image vs SVG vs Background image
- Normal Flow vs Relative vs Absolute positioning
- Local Class vs Global Class
- Native Control vs Custom CSS
- Variable vs Literal value
- px vs rem vs % vs auto vs variable
- Button vs Link vs Clickable container
- Heading vs Paragraph
- Static value vs Dynamic Data
- Editor evidence vs Runtime evidence

The Kernel must help downstream EV4 repositories make these decisions in a structured, evidence-backed, schema-valid, non-overclaiming way.

Important architectural truth:

- The Kernel is a decision-governance layer.
- Downstream repositories must enforce when to consult the Kernel.
- Official Elementor documentation proves documented platform/editor capability only.
- Official docs do not prove target project availability, active Pro license, user permission, constructability, Builder execution, frontend runtime behavior, or production readiness.
- Project/source evidence and browser/runtime evidence must be separate from official documentation.
- V4 is the valid design target. V3 may appear only as legacy risk, migration boundary, unsupported target, forbidden fallback, or compatibility warning.
- The Kernel must evolve from decision documentation into rule-backed, evidence-backed, resolver-audited decision governance.

### Receipt-Safety Authority Note

`docs/architecture/EV4_KERNEL_DECISION_RECEIPT_SAFETY_PROFILE.md` and
`kernel/decision-governance/consumer-decision-receipt-safety-profile.v1.json`
are authoritative only for Wave 5 receipt-safety semantics. They require a
seven-field success closure, including `consumer_stage`, validated evidence,
and exact authoritative trace acceptance. They do not implement consumer
adoption, downstream rejection, Project Gate intake, runtime enforcement, or
KROAD-010.

---

## Core Anti-Boutique Rules

A task is not complete just because prose exists.

For a roadmap item to be marked complete, it must have repository evidence such as:

- a merged PR;
- a concrete file;
- a schema field;
- a validator;
- valid and invalid fixtures;
- adversarial fixtures where applicable;
- documentation that matches the implementation;
- downstream rejection evidence where downstream enforcement is claimed;
- runtime evidence where runtime proof is claimed.

If evidence is uncertain, leave the task unchecked and add a note.

Do not mark any item complete based only on chat history, intention, prompt text, or unmerged work.

---

## Evidence Tier Model

Use this vocabulary when describing decision confidence and resolver status.

### Evidence tiers

- `none`
  - No usable evidence exists.
- `official_docs`
  - Official Elementor documentation or official developer documentation supports documented platform/editor capability only.
- `project_export`
  - Saved source/project evidence exists, for example from WordPress/Elementor export or a controlled project fixture.
- `runtime_browser`
  - Rendered DOM, computed style, viewport, responsive, or browser-observed evidence exists.
- `downstream_validated`
  - A downstream EV4 consumer or Project Gate has consumed and validated the decision/evidence contract.

### Resolver status

- `auto_resolved`
  - A rule explicitly resolves the decision.
  - Required evidence exists.
  - No Architect free choice is needed.
- `conditional`
  - More than one option remains valid.
  - Architect may choose, but only inside the rule-defined allowed set.
  - Justification and evidence references are required.
- `unresolvable`
  - Rule or evidence is insufficient.
  - The pipeline must halt or return `insufficient_evidence`.
  - Free-form guessing is forbidden.

Suggested baseline:

- `auto_resolved` should generally require evidence tier `project_export` or higher for project-specific decisions.
- `official_docs` alone may allow `conditional` guidance, but should usually remain provisional unless the decision is only about documented platform capability.
- `none` should lead to `unresolvable`.

---

## Decision Record Schema v2 Required Concepts

When KROAD-003 is implemented, the decision record model must support at least:

- `resolver_status`
- `evidence_tier`
- `rule_id`
- `rule_version`
- `decision_type`
  - `resolver_derived`
  - `human_override`
- `trigger_source`
  - `initial_decision`
  - `evidence_change`
  - `downstream_failure`
  - `rule_revision`
  - `manual_override`
- `provisional_status`
- `reopen_count`
- `max_reopen_count`
- `previous_decision_ref`
- `requires_reaudit`
- `selected_option`
- `rejected_options`
- `allowed_options`
- `forbidden_options`
- `evidence_refs`
- `forbidden_overclaims`
- `downstream_owner`

Human override must be explicit. It must not be indistinguishable from resolver-derived decisions.

---

## Resolver Rule Authoring Contract

Every resolver rule should eventually include:

- `rule_id`
- `rule_version`
- `decision_family_id`
- `input_context_schema`
- `required_evidence_tier`
- `required_evidence_refs`
- `allowed_options`
- `forbidden_options`
- `auto_resolve_conditions`
- `conditional_conditions`
- `unresolvable_conditions`
- `known_limitations`
- `forbidden_overclaims`
- `valid_fixture`
- `invalid_fixture`
- `adversarial_fixture`

A resolver rule without evidence references is not a reliable rule. It is only prose.

---

## Roadmap Status Vocabulary

Use these statuses in this file and in `planning/NEXT_WORK.md`:

- `completed`
- `not_started`
- `in_progress`
- `needs_audit`
- `blocked`
- `provisional`
- `superseded`

---

# Roadmap Items

---

## KROAD-000 — Live Baseline Precheck

- **Status:** completed
- **Purpose:** Establish the actual live repository state before any new work.
- **Depends on:** none
- **Primary question:** What is really merged, what files exist, what validators exist, and what gaps remain?

### What this task does

Inspect the live repository state rather than relying on chat history. Confirm:

- default branch;
- latest `main` commit;
- merged PRs relevant to Kernel state;
- existing schemas;
- existing fixtures;
- existing validators;
- `package.json` scripts;
- `validate:mvk` behavior;
- AGENTS.md governance rules;
- current documentation state;
- open gaps explicitly listed by previous PRs.

### Expected output

A short baseline report identifying:

- current head;
- relevant merged PRs;
- completed roadmap items supported by repository evidence;
- items that are uncertain or need audit;
- next safe task.

### Acceptance criteria

- The report is based on live repository evidence.
- No task is marked completed without repository evidence.
- Uncertain items are marked `needs_audit`, not completed.
- The next task is identified.

### Evidence required before marking complete

At least one of:

- live GitHub PR/commit evidence;
- repository files confirming the state;
- explicit merged PR references.

### Do not

- Do not rely only on chat history.
- Do not mark work complete because a prompt was prepared.
- Do not assume a PR was merged without checking.

---

## KROAD-001 — Cross-Repository Adoption Report

- **Status:** not_started
- **Purpose:** Discover which useful knowledge, contracts, schemas, evidence boundaries, and validation patterns from related repositories should be adopted, adapted, referenced, or excluded.
- **Depends on:** KROAD-000
- **Primary question:** What should the Kernel learn from nearby EV4/EDIS/EDAS repositories without becoming a copy of them?

### Related repositories to inspect

- `rezahh107/EDAS-v4`
- `rezahh107/elementor-v4-knowledge-base`
- `rezahh107/EV4-Workbook-Jinja`
- `rezahh107/EDIS-Browser-Runtime-Evidence-Collector`
- `rezahh107/EDIS-WordPress-Evidence-Exporter`
- `rezahh107/Elementor-Design-Audit-System`

### What this task does

Produce a read-only adoption report. For each repository, identify:

- useful source boundaries;
- useful evidence boundaries;
- schema patterns;
- fixture patterns;
- validator patterns;
- source manifest patterns;
- LLM handoff/source-precedence patterns;
- runtime evidence boundaries;
- saved source evidence boundaries;
- diagnostics and violation model patterns;
- what must not be imported.

### Repository-specific intent

#### EDAS-v4

Use for:

- input contract ideas;
- Atomic V4 / Legacy V3 / Hybrid / Unknown classification;
- export/schema boundary;
- normalized evidence graph ideas;
- unresolved dependency policy;
- deterministic ID policy;
- saved JSON vs runtime truth boundary.

Do not use it to make V3 a valid design target.

#### elementor-v4-knowledge-base

Use for:

- official-source index;
- source freshness ideas;
- coverage gaps;
- source status vocabulary;
- official docs backlog.

Do not treat it as final runtime/project truth.

#### EV4-Workbook-Jinja

Use for:

- LLM handoff pattern;
- always-read rules;
- source precedence;
- protected paths;
- insufficient evidence reporting;
- blocked environment reporting.

Do not treat it as Elementor truth.

#### EDIS-Browser-Runtime-Evidence-Collector

Use for:

- runtime/browser evidence boundaries;
- computed style limitations;
- viewport capture boundaries;
- source-runtime binding concepts;
- runtime package layout;
- privacy-safe evidence boundaries.

Do not import runtime proof into Kernel before actual integration.

#### EDIS-WordPress-Evidence-Exporter

Use for:

- saved source evidence producer boundary;
- immutable input snapshots;
- source drift detection;
- provenance;
- deterministic package ideas;
- explicit compatibility boundary.

Do not treat WordPress source export as runtime truth.

#### Elementor-Design-Audit-System

Use for:

- audit report schema ideas;
- diagnostics/violation model;
- severity vocabulary;
- element tree node concepts;
- metrics and warning model.

Do not use it as Kernel decision authority.

### Expected output

A document such as:

- `planning/CROSS_REPO_ADOPTION_REPORT.md`
- or another repository-consistent path.

It should classify findings as:

- `adopt_now`
- `adapt_later`
- `reference_only`
- `do_not_import`

### Acceptance criteria

- Every listed repository is inspected.
- Every adoption recommendation has a reason.
- The report clearly separates source truth, runtime truth, project truth, and documentation truth.
- The report identifies what must not be imported.
- The report recommends whether the current roadmap order should change.

### Evidence required before marking complete

- A committed adoption report.
- Paths or source references for findings.
- Explicit classification for each repository.

### Do not

- Do not modify external repositories.
- Do not copy large systems into Kernel.
- Do not turn Kernel into a documentation mirror.
- Do not import V3 as a design target.
- Do not claim runtime proof from source evidence.

---

## KROAD-002 — Taxonomy + Execution-Risk Boundaries

- **Status:** completed
- **Purpose:** Establish the Kernel-local taxonomy and boundary foundation for decision governance.
- **Depends on:** KROAD-000
- **Known evidence:** PR #11 merged.

### What this task does

Defines the basic categories and boundaries that all later work must respect:

- decision families;
- evidence domains;
- safety gates;
- source-boundary rules;
- capability-proof rules;
- execution-risk controls;
- V4-only target rule;
- source-tier boundaries;
- capability/dependency gate;
- atomic export vs runtime boundary.

### Expected output

Artifacts such as:

- decision domain taxonomy;
- P0 decision family registry;
- source-tier boundaries;
- capability/dependency gate;
- atomic export boundary;
- execution-risk domain registry;
- matching schemas;
- valid/invalid fixtures;
- validator;
- documentation.

### Acceptance criteria

- V4-only target scope is enforced.
- V3 is not accepted as a valid target design option.
- Official docs are limited to documented platform capability.
- Export JSON is not treated as frontend DOM.
- `editor_settings` is not treated as frontend output.
- Computed style requires runtime/browser evidence.
- Builder-ready is blocked when capability proof is unproven.
- No downstream enforcement, Project Gate enforcement, runtime proof, Builder proof, or production readiness is claimed.

### Evidence required before marking complete

- Merged PR evidence.
- Repository files implementing the taxonomy/boundary foundation.
- Validator/fixture evidence where available.

### Do not

- Do not expand this into full matrix/resolver logic.
- Do not treat this as final Kernel release readiness.
- Do not claim downstream enforcement.

---

## KROAD-003 — Decision Record Schema v2 + Migration Plan

- **Status:** not_started
- **Purpose:** Upgrade the decision record model so Resolver, L2 Audit, Provisional Policy, Rule Versioning, Human Override, and Reopen Loop all use one coherent data contract.
- **Depends on:** KROAD-001, KROAD-002
- **Primary question:** What fields must every future decision record carry so the decision can be resolved, audited, reopened, migrated, and gated?

### Why this is required before Resolver

The Resolver cannot be safely added if decision records do not carry:

- resolver output;
- evidence tier;
- rule version;
- decision type;
- trigger source;
- provisional state;
- reopen state;
- prior decision lineage.

Without this, Resolver and L2 Audit would require repeated retrofits.

### What this task does

Create or migrate schemas and docs for Decision Record Schema v2.

It must define at least:

- `resolver_status`
- `evidence_tier`
- `rule_id`
- `rule_version`
- `decision_type`
- `trigger_source`
- `provisional_status`
- `reopen_count`
- `max_reopen_count`
- `previous_decision_ref`
- `requires_reaudit`
- `selected_option`
- `allowed_options`
- `rejected_options`
- `forbidden_options`
- `evidence_refs`
- `forbidden_overclaims`
- `downstream_owner`

### Migration plan requirements

If older decision records or fixtures exist, create a migration plan explaining:

- which files use old schema;
- which fields are missing;
- whether to migrate immediately or mark as legacy;
- how validators will treat old records;
- how to avoid silent compatibility drift.

### Expected output

Possible artifacts:

- updated decision record schema;
- migration notes;
- valid fixture for v2;
- invalid fixture for missing required v2 fields;
- documentation explaining v2 lifecycle fields.

### Acceptance criteria

- v2 schema exists or existing schema is explicitly extended.
- Old schema compatibility is addressed.
- Human override is explicit.
- Rule version is recorded.
- Reopen lineage is supported.
- Provisional status is represented.
- Unknown/missing evidence can be represented without guessing.

### Evidence required before marking complete

- Schema changes.
- Migration documentation.
- At least one valid v2 fixture.
- At least one invalid v2 fixture.
- Validator or documented validation path.

### Do not

- Do not build Resolver before v2 schema is ready.
- Do not silently accept old records as if they were v2-compliant.
- Do not hide human override inside normal resolver-derived decisions.

---

## KROAD-004 — P0 Decision Matrices

- **Status:** not_started
- **Purpose:** Define the first structured comparison matrices for high-value Elementor V4 decision families.
- **Depends on:** KROAD-003
- **Primary question:** For each P0 decision family, what are the candidate options, required evidence, common risks, forbidden overclaims, and decision boundaries?

### Initial P0 families

Include at least:

- Div / Flexbox / Grid
- Image / SVG / Background image
- Heading / Paragraph
- Button / Link / Clickable container
- Normal Flow / Relative / Absolute
- Native Control / Custom CSS
- Local Class / Global Class
- Variable / Literal
- px / rem / % / auto / variable

### What this task does

For each P0 matrix, define:

- decision family id;
- options;
- when each option is appropriate;
- when each option is forbidden or risky;
- required evidence;
- evidence tier needed;
- likely downstream consumer;
- constructability concerns;
- runtime concerns;
- accessibility concerns where relevant;
- rejected-alternative requirements;
- provisional behavior.

### Expected output

Possible artifacts:

- matrix JSON or Markdown;
- schemas if the repository pattern requires;
- documentation;
- fixtures if validator is available.

### Acceptance criteria

- Matrices do not pretend to be deterministic resolvers.
- Each matrix identifies required evidence.
- Each matrix identifies forbidden overclaims.
- Each matrix maps to downstream roles.
- Each matrix indicates when the decision is provisional.
- V3 is not a valid target option.

### Evidence required before marking complete

- Matrix files.
- Documentation.
- Source/evidence references.
- Validation or fixture evidence if available.

### Do not

- Do not claim matrix existence equals decision correctness.
- Do not create a full Elementor feature registry.
- Do not create a full control-level registry.
- Do not resolve decisions without resolver rules.

---

## KROAD-005 — Decision Resolver Contract

- **Status:** not_started
- **Purpose:** Define how a decision matrix becomes an executable or semi-executable resolver contract.
- **Depends on:** KROAD-003, KROAD-004
- **Primary question:** How does the Kernel decide whether a case is auto-resolved, conditional, or unresolvable?

### What this task does

Create the resolver contract structure.

The resolver must be three-state:

- `auto_resolved`
- `conditional`
- `unresolvable`

### Resolver contract must define

- rule id;
- rule version;
- decision family id;
- input context;
- required evidence tier;
- evidence refs;
- option set;
- allowed options;
- forbidden options;
- auto-resolution conditions;
- conditional conditions;
- unresolvable conditions;
- limitations;
- diagnostics;
- fixture requirements.

### Expected output

Possible artifacts:

- resolver contract schema;
- resolver rule schema;
- resolver status vocabulary;
- documentation;
- initial empty/placeholder registry with no false completion claims.

### Acceptance criteria

- Resolver status is machine-readable.
- Evidence tier is part of resolver logic.
- Resolver rules require evidence references.
- Resolver can return `unresolvable` instead of guessing.
- Official-doc-only decisions are not automatically treated as project-ready.
- Unknown decision family fails closed.

### Evidence required before marking complete

- Resolver contract file/schema.
- Documentation.
- Example valid/invalid resolver rule.
- Diagnostic behavior or validator plan.

### Do not

- Do not implement broad resolver MVP here unless scoped.
- Do not make resolver a hidden LLM opinion.
- Do not allow a resolver rule with no evidence reference.
- Do not produce a single forced answer when evidence is insufficient.

---

## KROAD-006 — Resolver MVP for High-Risk P0 Families

- **Status:** not_started
- **Purpose:** Implement a small resolver MVP for the highest-risk P0 families instead of trying to solve every decision family at once.
- **Depends on:** KROAD-005
- **Primary question:** Can the Kernel constrain real high-risk decisions with actual resolver logic?

### Suggested MVP families

Start with a limited set:

- Div / Flexbox / Grid
- Image / SVG / Background image
- Native Control / Custom CSS
- Normal Flow / Relative / Absolute

### What this task does

For each MVP family, implement initial resolver rules that can produce:

- `auto_resolved`;
- `conditional`;
- `unresolvable`.

Each resolver rule must include:

- rule version;
- evidence requirements;
- allowed/forbidden options;
- diagnostics;
- valid fixture;
- invalid fixture;
- adversarial fixture.

### Expected output

Possible artifacts:

- resolver registry for MVP families;
- resolver rule files;
- validator updates;
- fixtures;
- docs explaining limitations.

### Acceptance criteria

- At least one high-risk family is genuinely resolver-backed.
- The resolver can reject insufficient evidence.
- The resolver can return conditional rather than over-resolving.
- The resolver can fail closed for unknown contexts.
- Decisions with only official-doc support are correctly marked provisional/conditional when project/runtime evidence is needed.

### Evidence required before marking complete

- Resolver rules.
- Fixtures.
- Validator or test behavior.
- Documentation.
- No unsupported overclaims.

### Do not

- Do not attempt all P0 families at once.
- Do not present heuristic prose as executable resolver logic.
- Do not mark MVP as full decision engine.
- Do not claim semantic correctness outside covered cases.

---

## KROAD-007 — L2 Decision Correctness Audit

- **Status:** not_started
- **Purpose:** Add a second-level audit that checks whether a selected decision is consistent with the resolver and evidence, not merely well-formed.
- **Depends on:** KROAD-005, KROAD-006
- **Primary question:** Can a well-formatted but wrong decision be caught?

### Core rule

L2 Audit must not be a second free-text LLM opinion.

It must:

1. read the recorded decision context;
2. rerun the same resolver or equivalent deterministic rule evaluation;
3. compare resolver output to Architect-selected option;
4. validate justification and evidence refs in conditional cases;
5. reject overclaims.

### What this task does

Create L2 audit logic and documentation for:

- resolver-result mismatch;
- selected option outside allowed set;
- forbidden option selected;
- evidence tier too low;
- missing evidence refs;
- invalid conditional justification;
- human override not marked;
- rule version mismatch;
- decision requiring re-audit.

### Expected output

Possible artifacts:

- L2 audit validator;
- L2 audit schema or diagnostics;
- adversarial fixtures;
- docs explaining L1 vs L2.

### Acceptance criteria

- L2 catches at least one well-formed but semantically invalid decision.
- L2 does not rely only on free-text model judgment.
- Conditional decisions are checked for evidence-backed justification.
- Human override is counted and visible.
- L2 uses rule version from the decision record.

### Evidence required before marking complete

- L2 audit files.
- Valid/invalid/adversarial fixtures.
- Diagnostics.
- Documentation.

### Do not

- Do not implement L2 as “ask another model if this is right.”
- Do not claim universal semantic correctness.
- Do not audit beyond resolver-covered families unless marked provisional.

---

## KROAD-008 — Resolver Fixtures: Valid / Invalid / Adversarial

- **Status:** not_started
- **Purpose:** Ensure every resolver rule has enforcement evidence, not just prose.
- **Depends on:** KROAD-005
- **Primary question:** Does every rule have test cases that prove it accepts, rejects, and resists near-valid mistakes?

### Fixture triplet rule

Every resolver rule should have:

1. `valid fixture`
   - must pass;
2. `invalid fixture`
   - must fail clearly;
3. `adversarial fixture`
   - looks close to valid but must fail or become conditional/unresolvable.

### What this task does

Define and enforce a rule-authoring policy that no resolver rule is considered complete unless the fixture triplet exists.

### Expected output

Possible artifacts:

- fixture naming policy;
- fixture folders;
- validator expectations;
- documentation;
- sample triplet for one MVP rule.

### Acceptance criteria

- Fixture triplet policy is documented.
- At least one resolver rule has full triplet coverage.
- Adversarial fixture is meaningfully different from invalid fixture.
- Diagnostics are specific, not generic.
- Missing fixture triplet prevents a rule from being considered complete.

### Evidence required before marking complete

- Fixture files.
- Validator/test output or documented validation behavior.
- Resolver rule linked to fixture triplet.

### Do not

- Do not postpone adversarial fixtures as “later.”
- Do not use empty fixture stubs.
- Do not make fixtures pass by case-name dispatch.
- Do not count synthetic fixtures as real target-project evidence.

---

## KROAD-009 — Vertical Slice

- **Status:** not_started
- **Purpose:** Prove that one decision family works end-to-end through matrix, resolver, record, audit, fixtures, and documentation.
- **Depends on:** KROAD-003, KROAD-004, KROAD-005, KROAD-006, KROAD-007, KROAD-008
- **Primary question:** Can the Kernel govern one real decision from input context to accepted/rejected decision record?

### Suggested vertical slice

Use one contained family, such as:

- Image vs SVG vs Background image

or another high-risk family if better supported by existing evidence.

### What this task does

Build a complete path:

1. source/evidence references;
2. decision matrix;
3. resolver rule;
4. decision record v2;
5. valid decision fixture;
6. invalid decision fixture;
7. adversarial decision fixture;
8. L2 audit;
9. documentation;
10. update NEXT_WORK.

### Expected output

A complete example showing how future families should be implemented.

### Acceptance criteria

- A future model can copy the pattern for other families.
- The path catches at least one well-formed but wrong decision.
- The path distinguishes official docs, project evidence, and runtime evidence.
- The decision record includes rule version and evidence tier.
- Provisional status is correctly applied when evidence is insufficient.

### Evidence required before marking complete

- End-to-end artifacts.
- Passing valid fixture.
- Failing invalid/adversarial fixture.
- Documentation showing the flow.

### Do not

- Do not make a demo that bypasses actual schemas/validators.
- Do not claim all P0 families are covered.
- Do not claim runtime validation unless runtime evidence exists.

---

## KROAD-010 — Downstream Consumer Contract

- **Status:** not_started
- **Purpose:** Make downstream EV4 repositories enforce when and how to consult the Kernel.
- **Depends on:** KROAD-009
- **Primary question:** How does Architect or CE know it must use the Kernel instead of deciding freely?

Receipt-safety dependency boundary: a downstream consumer that renders Wave 5
success receipts must conform to the canonical receipt-safety profile, but the
Kernel-local profile alone is not downstream enforcement and does not satisfy
this KROAD item.

### Candidate downstream consumers

Start with one:

- `EV4-Architect-Repo`
- or `EV4-Constructability-Engineer-Repo`

### What this task does

Define and implement a consumer contract requiring downstream records to reference Kernel artifacts when they touch Kernel-governed decision families.

The downstream output should require fields such as:

- `kernel_decision_family_ref`
- `decision_card_ref`
- `resolver_rule_ref`
- `decision_record_ref`
- `evidence_refs`
- `kernel_pin`
- `provisional_status`
- `forbidden_overclaims_acknowledged`

### Expected output

Possible artifacts:

- downstream schema patch;
- downstream prompt/AGENTS update;
- consumer contract docs;
- valid/invalid downstream fixtures;
- rejection behavior for missing Kernel references.

### Acceptance criteria

- A downstream consumer cannot silently bypass Kernel for covered decision families.
- Missing Kernel reference causes failure or explicit `insufficient_evidence`.
- Official docs are not treated as project/runtime proof.
- The downstream consumer does not claim Builder execution or production readiness.
- The contract is enforced by schema/validator/fixture, not only prose.

### Evidence required before marking complete

- Modified downstream repository or explicit Kernel-local consumer contract.
- Fixture showing invalid missing-Kernel-reference rejection.
- Documentation explaining when Kernel must be consulted.

### Do not

- Do not patch all downstream repos at once.
- Do not claim downstream enforcement if only Kernel-local docs exist.
- Do not make Kernel responsible for auto-detecting downstream decisions.

---

## KROAD-011 — Project Gate Intake

- **Status:** not_started
- **Purpose:** Allow Project Gate to reject incomplete, unproven, overclaimed, or Kernel-bypassing decision packets.
- **Depends on:** KROAD-010
- **Primary question:** Can Project Gate enforce completeness after downstream decisions are produced?

### What this task does

Define how Project Gate consumes Kernel-related artifacts, such as:

- decision records;
- resolver result;
- evidence tier;
- provisional count;
- human override count;
- unresolved decision count;
- Kernel pin;
- source/runtime evidence refs.

### Expected Project Gate behavior

Reject or block when:

- decision family is covered by Kernel but no Kernel ref exists;
- selected option is outside resolver-allowed options;
- evidence tier is too low for locked status;
- critical P0 decision is provisional;
- human override is not explicit;
- rule version is stale and requires re-audit;
- decision is marked Builder-ready without proof;
- runtime proof is claimed without runtime evidence.

### Expected output

Possible artifacts:

- Project Gate intake schema;
- Project Gate rejection fixtures;
- docs explaining Project Gate role;
- integration PR in Project Gate repo.

### Acceptance criteria

- Project Gate can reject missing/invalid Kernel decision records.
- Project Gate reports provisional/human_override/unresolved counts.
- Project Gate does not make design decisions itself.
- Project Gate does not claim runtime proof unless evidence exists.

### Evidence required before marking complete

- Project Gate repository changes or explicit intake contract.
- Rejection fixtures.
- Validation evidence.

### Do not

- Do not make Project Gate a designer.
- Do not let Project Gate override Architect choice.
- Do not claim integration without live repo evidence.

---

## KROAD-012 — External Evidence Producer Boundary

- **Status:** not_started
- **Purpose:** Define what external evidence producers can and cannot prove.
- **Depends on:** KROAD-001, KROAD-011
- **Primary question:** What does each external evidence source prove, and what does it not prove?

### Producer boundaries

#### WordPress Evidence Exporter

Should provide:

- saved source evidence;
- registries;
- provenance;
- immutable input snapshots;
- source drift detection.

Must not claim:

- runtime DOM;
- computed style;
- final class precedence;
- breakpoint resolution;
- Builder execution;
- production readiness.

#### Browser Runtime Evidence Collector

Should provide:

- rendered DOM observations;
- geometry;
- computed style values;
- viewport evidence;
- source-runtime binding evidence;
- responsive runtime facts.

Must not claim:

- saved source truth;
- final design correctness;
- Builder execution;
- production readiness;
- permanent monitoring unless explicitly implemented.

#### EDAS-v4 / deterministic processing layer

May provide:

- normalized evidence processing;
- formulas;
- findings;
- coverage;
- correlation.

Must not become uncontrolled LLM reasoning.

### Expected output

Possible artifacts:

- producer boundary docs;
- evidence package schema updates;
- producer responsibility registry;
- valid/invalid package examples.

### Acceptance criteria

- Each producer has a clear proof boundary.
- Evidence package status cannot overclaim.
- Kernel knows which tier each producer contributes to.
- Missing producer evidence results in provisional/insufficient status, not guessing.

### Evidence required before marking complete

- Boundary documentation.
- Schemas/fixtures if applicable.
- Mapping to evidence tiers.

### Do not

- Do not modify producer repos unless task explicitly includes them.
- Do not claim producer integration from documentation alone.
- Do not treat source evidence as runtime evidence.

---

## KROAD-013 — Runtime / Browser Evidence Layer

- **Status:** not_started
- **Purpose:** Introduce actual runtime/browser evidence into Kernel decision governance.
- **Depends on:** KROAD-012
- **Primary question:** Can the Kernel distinguish source/editor claims from rendered browser facts?

### Runtime evidence may include

- frontend DOM structure;
- computed style;
- bounding boxes;
- viewport profile;
- responsive behavior;
- visible/hidden state;
- overflow evidence;
- source-runtime binding;
- screenshot references where privacy policy allows.

### What this task does

Define and validate how browser/runtime evidence is referenced by decision records and resolvers.

### Expected output

Possible artifacts:

- runtime evidence schema or mapping;
- runtime evidence refs in decision record;
- fixtures;
- documentation;
- integration boundary with Browser Runtime Evidence Collector.

### Acceptance criteria

- Runtime evidence is a separate tier.
- Computed style cannot be claimed from export JSON alone.
- Runtime evidence can trigger re-audit.
- Runtime absence limits confidence but does not invalidate source truth.
- Privacy and bounded evidence rules are documented.

### Evidence required before marking complete

- Runtime schema/mapping.
- Fixture showing runtime-backed decision.
- Fixture rejecting runtime overclaim.
- Documentation.

### Do not

- Do not claim runtime integration without actual package evidence.
- Do not require runtime evidence for purely structural source facts.
- Do not collect private data unnecessarily.

---

## KROAD-014 — Provisional Re-Audit Policy

- **Status:** not_started
- **Purpose:** Ensure decisions made with incomplete evidence remain provisional and are re-audited when stronger evidence arrives.
- **Depends on:** KROAD-003, KROAD-012, KROAD-013
- **Primary question:** Which decisions may remain provisional, which may not, and when must re-audit happen?

### What this task does

Define policy for:

- provisional status;
- evidence-tier thresholds;
- critical vs non-critical decision families;
- re-audit triggers;
- provisional count reporting;
- final release constraints.

### Suggested policy

- Official-doc-only project-specific decisions should be provisional.
- Critical P0 decisions should not pass Final Release Gate while provisional.
- Evidence arrival from project export or runtime should trigger re-audit.
- Rule revision should trigger re-audit.
- Downstream failure should trigger re-audit.

### Expected output

Possible artifacts:

- provisional policy doc;
- schema fields if not already present;
- validator rules;
- fixtures;
- Project Gate count requirements.

### Acceptance criteria

- Critical P0 provisional decisions are blocked from final release.
- Provisional decisions include reason and missing evidence.
- Re-audit trigger is explicit.
- Project Gate can report provisional count.
- Provisional status cannot be silently cleared.

### Evidence required before marking complete

- Policy document.
- Schema/validator support.
- Fixtures showing provisional allowed and blocked cases.

### Do not

- Do not leave “provisional until evidence arrives” open-ended without criteria.
- Do not allow critical P0 provisional decisions to silently ship.
- Do not clear provisional status without evidence.

---

## KROAD-015 — Decision Reopen / Feedback Loop

- **Status:** not_started
- **Purpose:** Make decision records reopenable when downstream failure, new evidence, or rule revision invalidates or weakens the original decision.
- **Depends on:** KROAD-003, KROAD-007, KROAD-014
- **Primary question:** How does the system repair root decisions instead of only failing downstream?

### Reopen triggers

- `evidence_change`
- `downstream_failure`
- `rule_revision`
- `manual_override`
- `runtime_conflict`
- `project_availability_change`

### What this task does

Define versioned decision lifecycle:

- decision v1 remains immutable;
- reopen creates decision v2;
- previous decision ref is preserved;
- reopen reason is required;
- trigger source is required;
- max reopen count is enforced;
- after max reopen count, escalate.

### Required behavior

- Do not overwrite old decisions.
- Do not hide repeated instability.
- Do not let Builder continue against stale decision without policy.
- Race condition behavior must be defined.

### Race condition policy to define

If Builder is executing a decision and reopen triggers:

- halt Builder if the decision is safety-critical or structurally invalidated;
- otherwise mark current execution as stale and require patch/reconciliation;
- record which decision version Builder used.

### Expected output

Possible artifacts:

- decision lifecycle doc;
- reopen schema;
- fixtures;
- validator rules;
- Project Gate compatibility rules.

### Acceptance criteria

- Reopened decisions are versioned.
- Prior decision remains auditable.
- Max reopen count is enforced.
- Escalation path exists.
- Race condition policy exists.
- Reopen can be triggered by rule revision, not only downstream failure.

### Evidence required before marking complete

- Schema/policy files.
- Fixture for reopen.
- Fixture for max reopen exceeded.
- Documentation.

### Do not

- Do not overwrite old decisions.
- Do not allow infinite reopen loops.
- Do not hide human escalation.

---

## KROAD-016 — Cross-Turn / Sequence Enforcement

- **Status:** not_started
- **Purpose:** Ensure EV4 pipeline stages cannot mutate, overclaim, or silently reinterpret decisions across Architect → CE → Builder → Responsive.
- **Depends on:** KROAD-010, KROAD-011, KROAD-015
- **Primary question:** Can the system detect when a downstream stage changes the meaning of an upstream decision?

### Sequence to protect

- Architect owns selected design choices and decision records.
- CE owns constructability assessment.
- Builder executes locked decisions.
- Responsive validates responsive/runtime behavior.
- Project Gate checks lineage, completeness, and claims.

### What this task does

Define sequence constraints such as:

- Architect cannot claim Builder execution.
- CE cannot claim runtime validation.
- Builder cannot change selected option without reopen.
- Responsive cannot change source decision; it can report runtime result.
- Project Gate cannot design; it can accept/reject.
- Each stage must preserve decision id, version, rule version, and evidence refs.

### Expected output

Possible artifacts:

- sequence contract;
- replay/diff tests;
- cross-turn fixtures;
- stage ownership docs;
- validator for claim mutation.

### Acceptance criteria

- Stage ownership is explicit.
- Decision identity is preserved.
- Unauthorized claim upgrades are rejected.
- Downstream failure triggers reopen path.
- Sequence validation is more than prose.

### Evidence required before marking complete

- Contract files.
- Fixtures or tests for mutation/replay.
- Documentation.

### Do not

- Do not claim sequence enforcement from static docs only.
- Do not let later stages silently rewrite upstream decisions.
- Do not let Project Gate become a design authority.

---

## KROAD-017 — Official Docs Freshness Monitor

- **Status:** not_started
- **Purpose:** Prevent Kernel official-source knowledge from becoming stale when Elementor documentation changes.
- **Depends on:** KROAD-001, KROAD-004
- **Primary question:** How does the Kernel know when official source-backed claims may be outdated?

### What this task does

Define a lightweight freshness model for official Elementor sources.

May include:

- source id;
- URL;
- source type;
- retrieval date;
- last checked date;
- content fingerprint;
- last known update date where available;
- stale threshold;
- affected decision families;
- affected resolver rules;
- requires re-audit flag.

### Useful source pattern

`elementor-v4-knowledge-base` may provide useful manifest/freshness ideas.

### Expected output

Possible artifacts:

- official source freshness policy;
- source manifest update;
- stale-source diagnostics;
- docs monitor plan;
- fixtures.

### Acceptance criteria

- Source freshness is tracked.
- Stale source can mark affected rules/decisions as requiring re-audit.
- Official docs still prove only documented capability.
- Freshness does not imply project availability.

### Evidence required before marking complete

- Freshness metadata.
- Policy.
- Validator/fixture or documented manual process.

### Do not

- Do not claim live monitoring unless automation exists.
- Do not treat “fresh official docs” as runtime/project evidence.
- Do not block everything just because optional docs are stale unless policy says so.

---

## KROAD-018 — Final Kernel Release Gate

- **Status:** not_started
- **Purpose:** Determine whether the Kernel is ready for stable ecosystem-wide use using quantitative criteria, not subjective judgment.
- **Depends on:** KROAD-001 through KROAD-017, or documented exceptions
- **Primary question:** Is the Kernel operationally ready, or does it still behave like a boutique reference document?

### Release gate must be quantitative

Suggested criteria:

- 100% P0 families have a defined matrix.
- 100% critical P0 families have resolver coverage or documented exception.
- 0 locked decisions without `evidence_ref`.
- 0 critical P0 decisions with unresolved/provisional status.
- 0 unknown decision family in downstream outputs.
- L2 adversarial fixture pass rate meets required threshold, preferably 100% for covered rules.
- `provisional_count` is reported.
- `human_override_count` is reported.
- `unresolved_decision_count` is reported.
- Project Gate intake exists or release is explicitly marked limited/non-stable.
- Downstream consumer enforcement exists for at least the chosen MVP consumer.
- Runtime evidence limitations are explicit.
- Freshness policy exists.

### What this task does

Create the final readiness gate and report model.

### Expected output

Possible artifacts:

- release gate document;
- quantitative checklist;
- release readiness schema/report;
- fixture or sample report;
- clear status such as:
  - `not_ready`
  - `limited_mvp_ready`
  - `ecosystem_ready`
  - `blocked`

### Acceptance criteria

- Release criteria are numeric or objectively checkable.
- Missing downstream/runtime/project evidence prevents overclaim.
- Human overrides and provisional decisions are counted.
- Final gate cannot be passed by prose alone.
- Known exceptions are explicit and bounded.

### Evidence required before marking complete

- Release gate artifact.
- Evidence-backed readiness report.
- Quantitative counts.
- Documentation of any exceptions.

### Do not

- Do not declare production readiness because CI is green.
- Do not declare ecosystem readiness without downstream and Project Gate evidence.
- Do not hide provisional or human override counts.
- Do not let Final Release Gate become another subjective LLM opinion.

---

# Recommended Execution Order

Use this order unless a future merged PR updates this plan with evidence-backed reasoning:

1. KROAD-001 — Cross-Repository Adoption Report
2. KROAD-003 — Decision Record Schema v2 + Migration Plan
3. KROAD-004 — P0 Decision Matrices
4. KROAD-005 — Decision Resolver Contract
5. KROAD-006 — Resolver MVP for high-risk P0 families
6. KROAD-008 — Resolver Fixtures: valid / invalid / adversarial
7. KROAD-007 — L2 Decision Correctness Audit
8. KROAD-009 — Vertical Slice
9. KROAD-010 — Downstream Consumer Contract
10. KROAD-011 — Project Gate Intake
11. KROAD-012 — External Evidence Producer Boundary
12. KROAD-013 — Runtime / Browser Evidence Layer
13. KROAD-014 — Provisional Re-Audit Policy
14. KROAD-015 — Decision Reopen / Feedback Loop
15. KROAD-016 — Cross-Turn / Sequence Enforcement
16. KROAD-017 — Official Docs Freshness Monitor
17. KROAD-018 — Final Kernel Release Gate

Note: KROAD-008 may be implemented partly alongside KROAD-005 and KROAD-006, because every resolver rule should be authored with valid, invalid, and adversarial fixtures.

---

# Future LLM Operating Rule

Before doing any next task:

1. Read `planning/NEXT_WORK.md`.
2. Read this file.
3. Inspect live repository state.
4. Identify the next unchecked KROAD item.
5. Confirm dependencies.
6. Implement only the next scoped task.
7. Update `planning/NEXT_WORK.md` in the same PR.
8. If task meaning, scope, dependencies, or acceptance criteria changed, update this file too.
9. Do not tick completed unless repository evidence exists.
10. If uncertain, add a note instead of checking the box.
