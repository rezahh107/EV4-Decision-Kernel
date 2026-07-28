# Fixture Use

Run valid fixtures against the handoff schema and the policy invariants. They must be accepted. Invalid fixtures state the layer at which rejection is expected in `fixture-index.yaml`.

Some invalid fixtures intentionally pass JSON Schema and must be rejected by cross-record or semantic policy checks. This separation is deliberate: schema validity does not prove semantic truth.
