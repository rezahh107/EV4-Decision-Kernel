# MVK Vertical Slice — EV4 Decision Kernel

Status: Draft / Wave 0 planning  
Scope: One narrow end-to-end planning slice for future MVK validation  
Owner or intended consumer: Architect, CE, Builder, Responsive, Project Gate, and future Kernel validator authors

## What This Document Is

This document defines the first vertical slice the Kernel should later validate.

## What This Document Is Not

```text
- not a final schema
- not yet CI-enforced
- not yet runtime-validated
- not a Builder instruction template
- not proof of constructability
```

## Confirmed Facts

```text
- The slice must stay narrow.
- Builder UX guidance may support evidence-request wording, but it is not constructability proof.
- Project Gate remains verifier-only.
```

## Proposed Approach

Section model:

```text
Root wrapper: Div Block or Flexbox
Content: Heading + Paragraph + Button
Media: Image or SVG decision
Position case: decorative SVG absolute inside relative parent
Responsive case: desktop explicit, tablet inherited, mobile overridden value or unknown
Negative fixture: absolute without relative parent
Negative fixture: clickable card + clickable button nested link
```

Expected flow:

```text
Architect Decision Records
  -> CE Decision Closure
  -> Builder Execution Resolution
  -> Responsive Runtime Validation Record
  -> Project Gate Acceptance Packet
```

Planned future fixture names:

```text
valid/mvk-section-complete.json
invalid/missing-ce-closure.json
invalid/missing-kernel-pin.json
invalid/absolute-without-relative-parent.json
invalid/nested-clickable-card-button.json
invalid/builder-unlisted-fallback.json
```

## Open Decisions

```text
- exact fixture directory layout
- exact validation command
- exact Responsive Runtime Validation Record shape
- exact static-vs-semantic validator split
```

## Acceptance Criteria

The future vertical slice must prove:

```text
- incomplete package without CE closure fails
- package without kernel pin/hash fails
- absolute SVG without relative parent proof fails
- nested clickable topology fails
- Builder package with unlisted fallback fails
- complete package passes static + semantic validation
```

## What Must Not Be Done Yet

```text
- do not create fixtures in this Wave 0 patch
- do not create validators in this Wave 0 patch
- do not create Builder execution instructions here
- do not claim Responsive validation without runtime evidence
- do not add a large Elementor registry
```