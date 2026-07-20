import {
  createRecoveryCompletionVerifier as createDirectRecoveryCompletionVerifier,
  recoveryCompletionBinding,
  recoveryVerifiedEvidenceMatches,
  verifyRecoveryCompletionEvidence as verifyDirectRecoveryCompletionEvidence,
} from './recovery-completion-verifier-hardened.mjs';
import {
  createRecoveryCompletionIsolatedVerifier,
  isRecoveryCompletionIsolatedVerifier,
  verifyRecoveryCompletionEvidenceIsolated,
} from './recovery-completion-isolated-verifier.mjs';

export { recoveryCompletionBinding, recoveryVerifiedEvidenceMatches };

export function createRecoveryCompletionVerifier(options = {}) {
  const productionAuthority = options?.fetchImpl?.name === 'trustedGithubFetch'
    && options?.now?.name === 'trustedNow';
  return productionAuthority
    ? createRecoveryCompletionIsolatedVerifier({ token: options.token, now: options.now })
    : createDirectRecoveryCompletionVerifier(options);
}

export function verifyRecoveryCompletionEvidence(ledger, taskId, options = {}) {
  if (isRecoveryCompletionIsolatedVerifier(options?.session)) {
    return verifyRecoveryCompletionEvidenceIsolated(ledger, taskId, options.session);
  }
  return verifyDirectRecoveryCompletionEvidence(ledger, taskId, options);
}
