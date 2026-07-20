import { register } from 'node:module';

const loaderUrl = new URL('../fixtures/recovery-completion-test-authority-loader.mjs', import.meta.url).href;
register(loaderUrl, import.meta.url);

const bootstrapUrl = import.meta.url;
const inherited = typeof process.env.NODE_OPTIONS === 'string' ? process.env.NODE_OPTIONS.trim() : '';
if (!inherited.includes(bootstrapUrl)) {
  const option = `--import=${bootstrapUrl}`;
  process.env.NODE_OPTIONS = inherited ? `${inherited} ${option}` : option;
}
