# PRF-013 External Trust Boundary

## Status

`implemented_pending_rereview`.

This repair is intentionally not reported as finally closed. A fresh independent PR Inspector review must re-evaluate the target and issuer before any merge-ready claim.

## Scope

This document covers the repository-wide protected merge boundary for `rezahh107/EV4-Decision-Kernel` pull requests after the PRF-013 defect was identified for target PR `#43`.

## Owner / Intended Consumer

Repository administrators own the live GitHub branch-protection/ruleset settings. The Kernel repository owns only the protected verifier workflow and the configuration contract recorded in Git.

## What It Is

The repair adds a repository-wide PR verifier workflow that derives the current PR number from the authenticated `pull_request` event, queries the GitHub REST API for that PR, and cross-checks repository ID, PR number, base SHA, and head SHA before accepting any external trust result.

The verifier then looks up the external protected result on the verified PR head SHA and requires the exact expected GitHub App source, the exact check name, successful completion, and the required identity bindings: repository ID, PR number, base SHA, head SHA, issuer workflow SHA, run ID, run attempt, attestation digest, and `proof_credit_authorized=false`.

## What It Is Not

This is not proof-credit authorization, trusted ingestion, production readiness, downstream enforcement, Builder execution proof, runtime proof, or a substitute for an independent PR Inspector review.

This is also not live branch-protection evidence. The repository records the required settings contract in `.github/branch-protection/prf-013-required-status-checks.json`; administrators must apply and inspect the equivalent GitHub ruleset/branch-protection settings outside Git before relying on it.

## Confirmed Facts

- The repository-wide verifier does not define or consume `TARGET_PR_NUMBER = 43`.
- The verifier runs on `pull_request`, not `pull_request_target`, so the protected repository workflow result is associated with the PR head context rather than the default-branch base SHA semantics of `pull_request_target`.
- The verifier rejects API/event PR-number, base-SHA, head-SHA, and repository-ID mismatch.
- The verifier accepts only a check run attached to the verified head SHA.
- The verifier accepts only the exact expected external GitHub App slug and check name.
- The verifier requires `proof_credit_authorized=false` in the external result binding.

## Proposed Methods

Repository administrators should configure branch protection or rulesets to require:

1. `PR Inspector / external-trust-result` from the exact `pr-inspector` GitHub App source, not “any source”.
2. `PRF-013 external head trust boundary` from the repository workflow verifier.

The external issuer should publish `PR Inspector / external-trust-result` as a check run or commit status on the externally verified PR head SHA. The output must bind repository ID, PR number, base/head SHA, issuer workflow SHA, run ID/attempt, attestation digest, and `proof_credit_authorized=false`.

## Open Decisions

- The live GitHub App slug and check name must be confirmed against the separately reviewed PR Inspector deployment before activation.
- Live branch-protection/ruleset evidence must be captured after administrators apply exact-source requirements.
- PR #43 and a second PR number must both be demonstrated with dynamic PR identity resolution before activation.

## Required Demonstrations Before Activation

- PR `#43` resolves dynamically and verifies without a repository-wide PR-number constant.
- A second PR number resolves dynamically and verifies.
- Event/API PR-number mismatch fails closed.
- The final external protected result is attached to the verified PR head SHA, not the base SHA.
- A new PR head makes the previous result stale and non-satisfying.
- Same-name checks from another workflow or source do not satisfy the exact App-source requirement.
- Missing external result, missing expected App source, or missing verifier workflow blocks merge.
- `proof_credit_authorized` remains `false`.

## Next Allowed Step

Open a minimal, separately reviewed default-branch bootstrap PR containing only this verifier, configuration contract, and validation. After merge, activate live settings only after the head-associated external result path is demonstrated on a test PR.

## What Must Not Be Done Yet

- Do not merge target PR `#43` merely to install this guard.
- Do not merge either existing PR until a fresh independent PR Inspector review returns merge-ready.
- Do not authorize proof credit or trusted ingestion.
- Do not weaken PRF-001 through PRF-012.
- Do not treat a base-bound `pull_request_target` job as a head-bound protected result.
