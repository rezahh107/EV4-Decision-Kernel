# EV4 PCVP v1.0.0 Migration Checklist

## Authority and scope

- [ ] Repository and stage identity are confirmed.
- [ ] Existing pipeline order, contracts, validators, and authority remain unchanged.
- [ ] The active profile contains no inferred owner permission.
- [ ] Preauthorized effects are bounded to reasoning, drafts, or explicitly approved reversible effects.

## Canonical model

- [ ] Claim owns applicability and verification only.
- [ ] Effect owns continuation and blocker state only.
- [ ] Authorization owns basis, scope, status, and lifetime only.
- [ ] Stage status is derived and not used as evidence.
- [ ] Applicability is separate from verification.

## Continuation behavior

- [ ] `CONTINUE` always references an active, covering Authorization.
- [ ] `AUTHORIZATION_REQUIRED` never executes before authorization.
- [ ] `BLOCKED` includes one exact blocker and one recovery action.
- [ ] The same already-authorized blocker is not asked again.
- [ ] New material blockers invalidate only affected authorizations.
- [ ] Uncertainty propagates only through explicit dependencies.

## Truthfulness

- [ ] Provisional outputs never claim Runtime or Validator PASS.
- [ ] Owner permission never changes verification state.
- [ ] Contradicted critical claims block dependent effects.
- [ ] Confidence or percentage does not create verification.
- [ ] No hidden persistent-state claim is made without real storage.

## UX

- [ ] Owner-visible output is Persian, short, and fixed-format.
- [ ] Green, yellow, and red match the projection rules.
- [ ] Yellow distinguishes continuation available from owner choice required.
- [ ] One response asks at most one primary owner question.

## Validation

- [ ] All valid fixtures are accepted.
- [ ] All invalid fixtures are rejected at the expected layer.
- [ ] Structural validation is not represented as semantic or official proof.
- [ ] A bounded non-blocking trial has completed.

## Adoption decision

- [ ] Profile is repository-correct.
- [ ] No blocking fixture failure remains.
- [ ] Bundle and profile versions are recorded in the repository integration point.
- [ ] Adoption status may now change from `not_yet_adopted`.
