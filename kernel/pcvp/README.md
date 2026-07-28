# EV4-PCVP canonical package

This directory owns the canonical `EV4-PCVP@1.0.0` bundle snapshot and the
Decision Kernel integration authority around that snapshot.

The normative policy remains the exact immutable bundle snapshot at:

```text
kernel/pcvp/v1.0.0/bundle/00-MANIFEST.yaml
```

Its declared authority order remains:

```text
SPEC
-> MODEL_POLICY
-> exactly one repository-correct PROFILE
-> relevant SCHEMA
-> relevant FIXTURE
```

`pcvp-foundation.v1.json` is repository integration metadata only. It does not
restate or override policy semantics. `pcvp-enforcement-map.v1.json` truthfully
classifies policy enforcement. `pcvp-activation.v1.json` is the canonical
machine-validated staged activation authority; it may authorize only the exact
edge explicitly listed in that record.

The immutable bundle snapshot itself remains:

```yaml
bundle_adoption_status: not_yet_adopted
bundle_status: release_candidate
```

The dedicated activation authority currently permits only:

```yaml
official_adoption_authorization: true
enabled_edge: ARCHITECT_TO_PROJECT_GATE_TO_CE
architect_producer_emission: true
architect_to_project_gate: true
project_gate_to_ce: true

ce_to_builder_emission: false
builder_to_responsive_emission: false
responsive_to_final_emission: false
full_rollout_authorized: false
```

This staged authority does not create Runtime correctness, Project Gate PASS,
CE correctness, production readiness, deployment status, or official
verification evidence.

Validation:

```bash
node tools/validate-pcvp-v1.mjs
node tools/test-pcvp-v1-fixtures.mjs
node tools/validate-pcvp-activation-v1.mjs
node tools/test-pcvp-activation-v1.mjs
```

CI additionally verifies the pinned prerequisite PR merge identities and
exact-head successful Actions runs through the GitHub API.

Rollback/safe-disable requires a dedicated canonical activation-reversal
change. It must not rewrite history, delete evidence, accept invalid carriers,
or weaken legacy validation.
