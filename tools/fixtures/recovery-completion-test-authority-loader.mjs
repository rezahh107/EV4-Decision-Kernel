import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

const productionUrl = pathToFileURL(join(process.cwd(), 'kernel/validator/recovery-completion-evidence.mjs')).href;
const testAuthorityUrl = new URL('../lib/recovery-completion-test-authority.mjs', import.meta.url).href;

export async function resolve(specifier, context, nextResolve) {
  const resolved = await nextResolve(specifier, context);
  if (resolved.url === productionUrl) return { url: testAuthorityUrl, shortCircuit: true };
  return resolved;
}
