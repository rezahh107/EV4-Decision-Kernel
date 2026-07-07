# ADR-005 — MVK Scope and Vertical Slice

Status: Accepted for Wave 0 planning  
Date: 2026-07-07  
Decision type: MVK planning boundary  
Scope: Minimum Viable Kernel scope and one vertical validation slice; planning only  
Owner: EV4 Decision Kernel

## Context

This ADR locks the first small MVK target.

This ADR is not an implementation of schemas, validators, fixtures, CI, registries, release automation, or runtime validation.

Confirmed facts:

```text
- The first Kernel must stay small.
- Wave 0 must not create a full platform.
- The vertical slice must prove static and semantic rejection paths before larger registries are added.
```

Proposed approach:

```text
Build a narrow MVK around a single Elementor-like section: root wrapper, basic text/content, media decision, one absolute SVG positioning case, responsive provenance, CE closure, Builder resolution, and Project Gate packet.
```

Open decisions:

```text
- Exact schema syntax.
- Exact validator implementation language.
- Exact fixture filenames.
- Exact static vs semantic validator split.
```

## Decision

The initial MVK is limited to:

```text
1. Evidence model
2. Kernel pin contract
3. Core element IDs: Div Block, Flexbox, Grid, Heading, Paragraph, Button, Image, SVG
4. Core hard gates: nested clickable topology, absolute containing block proof, responsive provenance
5. Element Decision Record
6. Position Decision Record
7. Value/Unit Decision Record
8. CE Closure
9. Builder Resolution
10. Project Gate Acceptance Packet
11. Valid/invalid fixture strategy
12. One local validator plan
```

The vertical slice is:

```text
Root wrapper: Div Block or Flexbox
Content: Heading + Paragraph + Button
Media: Image or SVG decision
Position case: decorative SVG absolute inside relative parent
Responsive case: desktop explicit, tablet inherited, mobile override or unknown
Negative fixture: absolute without relative parent
Negative fixture: clickable card + clickable button nested link
```

## Accepted Now

Expected flow:

```text
Architect Decision Records
  -> CE Decision Closure
  -> Builder Execution Resolution
  -> Responsive Runtime Validation Record
  -> Project Gate Acceptance Packet
```

The vertical slice must prove:

```text
- incomplete package without CE closure fails
- package without kernel pin/hash fails
- absolute SVG without relative parent proof fails
- nested clickable topology fails
- Builder package with unlisted fallback fails
- complete package passes static + semantic validation
```

## Deferred

```text
- full Dynamic Tags registry
- full Components registry
- full Variables registry
- full Control-Level Registry
- official-doc monitoring
- migration automation
- release automation
- reusable workflow centralization
- signed validation outputs
```

## Consequences

The Kernel can become useful without becoming a broad Elementor platform.

The first validator can focus on a small number of high-risk gates instead of attempting complete domain coverage.

## Alternatives Considered

```text
1. Start with a full Elementor registry.
2. Start with only prose and no fixtures.
3. Start with CI and release automation before schema contracts.
```

## Rejected Options

```text
- Full registry first: rejected as overengineering.
- Prose-only MVK: rejected because Critical rules need future enforcement carriers.
- Automation first: rejected because contract shape is not settled.
```

## Acceptance Criteria

```text
- MVK scope remains small.
- One vertical slice is defined.
- Required negative fixtures are named.
- Full registries and automation remain deferred.
- No implementation readiness is claimed.
```

## What This ADR Does Not Authorize

```text
- creating real schema files
- creating validators
- creating fixture files
- creating workflows
- creating registries beyond planning docs
- claiming MVK implementation, CI enforcement, or runtime validation
```