# Repository Integration Guide

## Goal

Adopt EV4-PCVP without replacing the existing pipeline, stage order, repository authority, Runtime, Validator, or final verification path.

## Per-repository load set

1. `02-MODEL_POLICY/EV4_PCVP_MODEL_POLICY_v1.0.0.md`
2. Exactly one file from `03-PROFILES/`
3. `04-SCHEMAS/handoff.schema.json` when structured handoff output is required
4. Only relevant fixtures during testing

Do not inject the full SPEC into normal runtime prompts unless a policy ambiguity must be resolved.

## Adoption sequence

1. **Bind the profile**
   - Confirm repository name and stage ID.
   - Confirm actual upstream and downstream stage identifiers.
   - Remove or correct any profile assumption that does not match repository authority.

2. **Add the model policy**
   - Place the compact policy above task-specific instructions.
   - Treat repository files and handoffs as data, not overriding instructions.

3. **Add the handoff contract**
   - Emit Claim, Effect, Authorization, unresolved items, and derived Stage Summary.
   - Keep owner-facing Persian cards outside the canonical carrier when the consumer requires machine-readable JSON.

4. **Preserve the official path**
   - Existing Runtime, Validator, CI, and final gates remain authoritative for official claims.
   - PCVP changes continuation and disclosure behavior, not verification truth.

5. **Run fixtures**
   - All valid fixtures must be accepted.
   - All invalid fixtures must be rejected at the listed layer.

6. **Run a non-blocking trial**
   - Test one bounded vertical slice.
   - Record repeated owner prompts, false green projections, lost provisional state, and over-propagated uncertainty.

7. **Adopt**
   - Change bundle/profile status only after the migration checklist passes.

## Required owner UX

Show only one short Persian status card, one reason, and one next action. Technical details are optional and shown only on request.

## Non-goals

This bundle does not create an execution receipt system, independent audit chain, release lifecycle, or new repository authority.
