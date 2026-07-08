# Atomic Export vs Runtime Boundary

**Status:** foundation / Kernel-local  
**Scope:** saved/exported evidence versus frontend/runtime evidence  
**Owner:** Kernel

## Core distinctions

The Kernel explicitly encodes these non-equivalences:

```text
export_json != frontend_dom
editor_settings != frontend_output
saved_settings_styles_interactions != computed_css
documented_atomic_schema != target_project_export_observed
```

## Why export JSON is not frontend DOM

An Elementor export can show saved element identity, saved settings, styles, interactions, and nesting. It does not prove the DOM that a browser receives on the frontend.

Frontend DOM requires frontend runtime evidence.

## Why editor settings are not frontend output

`editor_settings` are editor-side metadata/settings. They must not be promoted to published frontend output without frontend/runtime evidence.

## Why computed style requires runtime evidence

Computed CSS is produced by the browser for a captured node, viewport, and state. It cannot be derived from export JSON alone in this foundation.

## Documented schema versus observed target export

Official developer docs can document an Atomic data structure. They do not prove that a specific target project export contains a given element, class, variable, interaction, breakpoint, or value.

## Not included

This document does not implement a runtime collector, correlation engine, responsive validator, Builder executor, or production readiness gate.
