## Repository Memory

- [ ] Updated `planning/NEXT_WORK.md` in this PR.
- [ ] Updated `planning/KERNEL_EXECUTION_PLAN.md` if task meaning/scope/dependencies changed.
- [ ] Not needed. Reason:

If a PR completes a KROAD item, the PR body should mention:
- the KROAD id;
- the evidence added;
- whether the checkbox was ticked in `planning/NEXT_WORK.md`.

## Repository Memory Consistency

- [ ] Checked `planning/NEXT_WORK.md` for current roadmap status.
- [ ] Checked that changed planning/report documents do not contain stale pre-merge wording.
- [ ] If a KROAD item was completed, status references now point to `planning/NEXT_WORK.md` or match it.
- [ ] If status was intentionally left only in `planning/NEXT_WORK.md`, this is stated clearly.
- [ ] Ran the roadmap-memory validator, or explained why it was not applicable.

## Coverage Guarantee

- [ ] Classified whether changed paths are coverage-sensitive.
- [ ] Added or updated a valid Coverage Impact Record when coverage-sensitive.
- [ ] Did not enter a manual coverage percentage or hide an unresolved denominator candidate.
- [ ] Kept critical P0/safety coverage separate from aggregate coverage.
- [ ] Ran `npm run validate:coverage`.

## Merge Gate

- [ ] Exact-head CI is green.
- [ ] Independent PR Inspector is green on this exact head.
- [ ] The owner issued an explicit Merge command.
