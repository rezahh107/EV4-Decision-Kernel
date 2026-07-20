import { recoveryPrimordials as p } from '../../kernel/validator/recovery-primordials.mjs';
import {
  createRecoveryCompletionTestAuthority,
  fetchRecoveryCompletionTestCapabilities,
  isRecoveryCompletionTestCapability,
  recoveryCompletionTestCapabilityMatches,
} from './recovery-completion-test-registry.mjs';

export async function fetchRecoveryCompletionCapabilities(ledger) {
  const session = createRecoveryCompletionTestAuthority({
    token: process.env.RECOVERY_GITHUB_TOKEN,
    now: p.dateNow,
  });
  return fetchRecoveryCompletionTestCapabilities(ledger, { session });
}

export const isRecoveryCompletionCapability = isRecoveryCompletionTestCapability;
export const recoveryCompletionCapabilityMatches = recoveryCompletionTestCapabilityMatches;
