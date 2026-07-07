# EV4 Decision Kernel

**Status:** working-reference / MVK-planning  
**Owner:** `rezahh107/EV4-Decision-Kernel`  
**Primary language:** Persian for explanatory docs; English for technical identifiers, schema names, file paths, and rule IDs.

---

## Purpose

`EV4 Decision Kernel` is the shared governance, evidence, and decision-contract layer for the EV4 multi-repository Elementor V4 workflow.

Its purpose is not to design a specific Elementor section. Its purpose is to define the common contracts that make section-design decisions traceable, reviewable, testable, and fail-closed across EV4 repositories.

```text
Documented Elementor capability
!= enabled in target project
!= allowed for current user
!= correct design choice
!= constructability proven
!= exact UI path proven
!= Builder executed
!= Responsive validated
!= production ready
```

This repository exists to prevent high-risk LLM workflow rules from remaining prose-only.

---

## EV4 Role Boundary

```text
Architect
  generates candidates, compares alternatives, selects architecture with reasons,
  and produces decision records.

Constructability Engineer / CE
  proves constructability, dependencies, controls, units, permissions,
  version compatibility, and closes open architecture decisions.

Builder
  executes only approved, locked, evidence-bound decisions.
  It resolves exact controls, values, units, classes, states, viewports, and UI paths.
  It must not invent architecture or substitute elements.

Responsive
  validates actual runtime behavior across viewports, states, input methods, and direction.

Project Gate
  verifies lineage, schema validity, evidence completeness, registry version/hash,
  ownership, and stage authority.
  It must not make Elementor design decisions.
```

---

## Current Architectural Decision

Current decision label:

```text
MODIFY_ARCHITECTURE
```

Adopt now:

```text
- central Kernel concept
- local profile without rule fork
- MVK-first approach
- vendored/pinned snapshot before releases
- local CI wrapper before reusable workflow
- Project Gate as verifier, not Elementor domain owner
```

Defer:

```text
- full release automation
- reusable workflow centralization
- docs monitoring automation
- migrations
- full control registry
- signed validation outputs
```

Need ADR:

```text
- independent repo vs shared-contracts location
- distribution model
- Project Gate boundary
- profile allowed content
- exact Builder-ready definition
```

---

## Repository Layout

Initial documentation scaffold:

```text
.
├── README.md
├── AGENTS.md
└── docs/
    ├── EV4_DECISION_KERNEL_WORKING_REFERENCE_FA.md
    ├── governance/
    │   └── BEHAVIORAL_RULE_COVERAGE.md
    ├── ux/
    │   └── BUILDER_UX_RESPONSE_BOUNDARY.md
    └── waves/
        └── WAVE_0_ADR_AND_MVK_PLANNING.md
```

Planned MVK scaffold, not created yet:

```text
kernel/
├── registries/
├── schemas/
├── rules/
├── fixtures/
│   ├── valid/
│   └── invalid/
└── validator/
```

Do not create the full platform until Wave 0 ADRs and MVK scope are accepted.

---

## Kernel Ownership

The Kernel owns shared, role-neutral contracts:

```text
- canonical IDs
- registry envelopes
- evidence vocabulary
- decision-record schemas
- hard-gate rule definitions
- behavioral rule coverage model
- fixtures for critical/high rules
- validation-pack shape
- versioning and pinning conventions
```

The Kernel must not choose a design for a specific Elementor section.

```text
Kernel says: Absolute needs a positioned containing block proof.
Architect says: This decorative SVG should be absolute inside this relative stage.
CE says: That decision is constructible in the target environment.
Builder says: I can resolve and execute the locked control path, or I must stop.
```

---

## Profile Rule

Each EV4 repository may later contain a local profile:

```text
decision-kernel-profile/
├── KERNEL_PIN.json
├── profile.yaml
├── adapter-map.yaml
├── local-ci-wrapper.*
└── README.md
```

Profiles must not fork Kernel rule logic.

Allowed in profile:

```text
- role activation map
- adapter mapping
- local CI wrapper
- local path mapping
- compatibility note
```

Forbidden in profile:

```text
- redefining Kernel rules
- weakening hard gates
- changing evidence vocabulary meaning
- silently accepting missing CE closure
- allowing Builder architecture invention
```

---

## Minimum Viable Kernel Direction

The first useful Kernel must be small:

```text
1. Evidence model
2. Kernel pin schema
3. Core element IDs: Div Block, Flexbox, Grid, Heading, Paragraph, Button, Image, SVG
4. Core hard gates:
   - nested clickable topology
   - absolute containing block proof
   - responsive provenance
5. Element Decision Record
6. Position Decision Record
7. Value/Unit Decision Record
8. CE Closure
9. Builder Resolution
10. Project Gate Acceptance Packet
11. valid/invalid fixtures
12. one vertical E2E slice
```

---

## Documentation Rules

Documentation in this repository must follow these rules:

```text
- Separate confirmed facts, proposed methods, and open decisions.
- Do not treat Workbook-derived rules as official Elementor capabilities.
- Do not treat schema-valid as semantic-valid or runtime-valid.
- Do not turn Project Gate into a domain-decision owner.
- Do not allow Builder to select new architecture when upstream decisions are missing.
- Critical rules must not remain prose-only.
```

---

## First Implementation Target

The next patch should create Wave 0 ADRs and MVK planning artifacts only.

Do not implement yet:

```text
- full registries
- full schema set
- rule engine
- GitHub Release automation
- reusable workflows
- docs monitoring
- migration system
```

See:

```text
docs/waves/WAVE_0_ADR_AND_MVK_PLANNING.md
```