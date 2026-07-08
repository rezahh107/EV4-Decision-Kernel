# Elementor V4 Source Quality Notes

**Status:** Kernel-local source quality note register
**Scope:** official Elementor documentation entries that are still usable but require caution, reconciliation, or later recheck

## Rule

A source-quality note does not invalidate an official source. It records that the source should not be used for a stronger claim than the inspected text supports.

## Current Notes

| source_ref | quality_status | note | boundary |
| ---------- | -------------- | ---- | -------- |
| `src.elementor.grid_container` | partial_source | Grid is represented through Grid Container documentation; a distinct atomic V4 Grid element page was not confirmed in this pass. | Keep `v4.grid` as `partially_supported`. |
| `src.elementor.v4.reset_style_settings` + `src.elementor.v4.v3_v4_differences` | conflicting_official_sources | Reset behavior should be rechecked together with V3/V4 difference documentation before hard reset-to-default claims. | Do not claim exact reset behavior or UI path without later evidence. |
| `src.elementor.v4.components` | dependency_boundary | Components requirements include Atomic elements, Admin-level permission, and Elementor Pro, but these are documented prerequisites only. | Do not claim target project availability, active Pro license, or current user permission. |
| `src.elementor.v4.nested_links` | documented_constraint | Nested clickable restrictions are official editor constraints. | Do not treat this as Builder execution or runtime click validation. |

## Recheck Trigger

Recheck these notes when official Elementor docs change, when a target-project evidence exporter is introduced, or when downstream repositories begin consuming the doc coverage index.
