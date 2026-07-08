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
| `src.elementor.v4.classes` | class_mutation_boundary | Classes docs describe local/global class behavior and hierarchy. | Do not treat this as target class inventory, current permission, or safe mutation approval. |
| `src.elementor.v4.states` | runtime_boundary | States docs describe editor styling states. | Do not treat this as runtime hover/focus/active validation or accessibility proof. |
| `src.elementor.v4.variables` | design_system_boundary | Variables docs describe reusable design values and current type limits. | Do not treat this as target variable inventory, values, or active Pro proof. |
| `src.elementor.v4.logical_properties` | property_level_boundary | Logical properties are property-level writing-direction context. | Do not create a full control registry or runtime layout proof from this source alone. |
| `src.elementor.v4.attributes` | property_and_ui_path_boundary | Attribute docs include General-tab add/delete steps. | Do not treat UI steps as target-environment UI path proof, safe mutation, Builder execution, or runtime DOM output. |
| `src.elementor.v4.viewport_control` + responsive docs | breakpoint_gap | Viewport Control and Responsive Editing are not complete breakpoint-semantics documentation. | Keep breakpoint semantics as insufficient evidence until a breakpoint-specific official source is inspected. |

## Recheck Trigger

Recheck these notes when official Elementor docs change, when a target-project evidence exporter is introduced, or when downstream repositories begin consuming the doc coverage index.
