# EV4-PCVP canonical package

This directory is the additive, dormant canonical package for
`EV4-PCVP@1.0.0`.

The normative authority remains the exact vendored bundle snapshot at:

```text
kernel/pcvp/v1.0.0/bundle/00-MANIFEST.yaml
```

Its declared authority order is:

```text
SPEC
-> MODEL_POLICY
-> exactly one repository-correct PROFILE
-> relevant SCHEMA
-> relevant FIXTURE
```

`pcvp-foundation.v1.json` is repository integration metadata only. It does not
restate or override policy semantics. `pcvp-enforcement-map.v1.json` truthfully
classifies current enforcement and gaps; it is not a second policy source.

Current state:

```yaml
adoption_status: not_yet_adopted
rollout_state: canonical_foundation_dormant
compatibility_mode: ADDITIVE
activation_effect: NONE_UNTIL_DEDICATED_ACTIVATION
```

Validation:

```bash
node tools/validate-pcvp-v1.mjs
node tools/test-pcvp-v1-fixtures.mjs
```

No producer may require this representation until every required consumer and
boundary reader tolerates it and the separate activation prerequisites pass.
