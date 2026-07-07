# Wave 0 — ADR and MVK Planning

**Version:** 0.1.0  
**Status:** draft / planning  
**Scope:** governance and planning only  
**Do not implement full Kernel in this wave.**

---

## 1. Objective

Wave 0 prepares the EV4 Decision Kernel repository for a small, enforceable Minimum Viable Kernel.

Wave 0 must answer ownership and boundary questions before schemas, validators, release artifacts, reusable workflows, or large registries are created.

---

## 2. Current Decision

```text
MODIFY_ARCHITECTURE
```

Use:

```text
central Kernel concept
local profile without rule fork
MVK-first implementation
vendored/pinned snapshot before releases
local CI wrapper before reusable workflow
Project Gate as verifier, not domain owner
```

Defer:

```text
full release automation
central reusable workflow
docs monitoring
migrations
full control registry
signed validation outputs
```

---

## 3. ADRs Required

### ADR-001 — Kernel Ownership and Repository Boundary

Must decide:

```text
- Keep Kernel as independent repository?
- Move any part into shared-contracts?
- What must never live in Project Gate?
- Who owns source-of-truth registry IDs?
```

Acceptance:

```text
Project Gate does not become Elementor domain-decision owner.
Kernel ownership is explicit.
Local repo profiles cannot fork rule logic.
```

### ADR-002 — Distribution Model

Must decide initial and later distribution:

```text
- Wave 1 vendored snapshot + pin + hash
- Later GitHub Release artifact
- Later reusable workflow with commit SHA
```

Acceptance:

```text
No repo consumes floating main.
Each consumer has KERNEL_PIN.json.
Registry/hash mismatch can be rejected.
```

### ADR-003 — Project Gate Boundary

Must decide what Gate verifies:

```text
- lineage
- hashes
- schema validity
- evidence completeness
- stage authority
- validation report presence
```

Must not verify:

```text
- SVG vs Image design choice
- Flex vs Grid design choice
- CE constructability reasoning itself
- Builder UI-path selection itself
```

Acceptance:

```text
Gate verifies pinned outputs and completeness.
Domain validation remains in owner repos.
```

### ADR-004 — Local Profile Allowed Content

Must define local profile shape:

```text
decision-kernel-profile/
├── KERNEL_PIN.json
├── profile.yaml
├── adapter-map.yaml
├── local-ci-wrapper.*
└── README.md
```

Allowed:

```text
role activation map
adapter mapping
local path mapping
local CI wrapper
compatibility notes
```

Forbidden:

```text
rule logic fork
weakened evidence vocabulary
local hard-gate override
Builder architecture invention
Gate domain decision logic
```

### ADR-005 — MVK Scope and Vertical Slice

Must lock:

```text
- MVK element set
- MVK hard gates
- MVK decision records
- one vertical E2E slice
- acceptance criteria
```

---

## 4. MVK Scope Proposal

Minimum useful Kernel:

```text
1. Evidence model
2. Kernel pin schema
3. Core element IDs:
   Div Block, Flexbox, Grid, Heading, Paragraph, Button, Image, SVG
4. Core hard gates:
   nested clickable topology
   absolute containing block proof
   responsive provenance
5. Element Decision Record schema
6. Position Decision Record schema
7. Value/Unit Decision Record schema
8. CE Closure schema
9. Builder Resolution schema
10. Project Gate Acceptance Packet schema
11. valid/invalid fixtures
12. one validator script/CLI
```

Do not include in MVK:

```text
- full dynamic tag registry
- full components lifecycle
- full variables manager
- all Elementor controls
- docs monitoring
- migration automation
- signed attestation
```

---

## 5. Vertical E2E Slice Proposal

Section contents:

```text
Root wrapper: Div Block or Flexbox
Content: Heading + Paragraph + Button
Media: Image or SVG decision
Position case: decorative SVG absolute inside relative parent
Responsive case: desktop explicit, tablet inherited, mobile override or unknown
Negative fixture: absolute without relative parent
Negative fixture: clickable card + clickable button nested link
```

Flow:

```text
Architect Decision Records
  -> CE Decision Closure
  -> Builder Execution Resolution
  -> Responsive Runtime Validation Record
  -> Project Gate Acceptance Packet
```

Acceptance:

```text
- package without CE closure fails
- package without kernel pin/hash fails
- package with absolute SVG but no relative parent proof fails
- package with nested clickable topology fails
- Builder package with unlisted fallback fails
- complete package passes static + semantic validation
```

---

## 6. Wave 0 Acceptance Criteria

Wave 0 is complete when:

```text
- ADR drafts exist for ownership, distribution, Project Gate boundary, profile content, and MVK scope.
- Behavioral Rule Coverage is present and tracks Critical/High rules only.
- Builder UX boundary is documented separately from Kernel domain rules.
- README and AGENTS define anti-overengineering constraints.
- No full platform implementation has been added.
```

---

## 7. What Must Not Be Done Yet

Do not create:

```text
- full kernel/registries population
- full schemas directory
- rule engine platform
- GitHub Release automation
- reusable workflow centralization
- docs monitoring automation
- migrations
- signed validation outputs
```

Do not claim:

```text
MVK implemented
CI enforced
runtime validated
production ready
```

---

## 8. Next Patch Prompt Direction

The next model prompt should ask for:

```text
Create Wave 0 ADR drafts and MVK planning artifacts only.
Do not implement full Kernel.
Do not create release automation, reusable workflows, migrations, docs monitoring, or full registries.
```

This file is the control document for that prompt.