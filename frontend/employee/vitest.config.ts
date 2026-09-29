import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  resolve: {
    alias: Object.fromEntries(
      ['context', 'interfaces', 'hooks', 'configs', 'components', 'utils'].map(name => [
        `@${name}`, path.resolve(__dirname, `src/${name}`),
      ])
    ),
  },
  esbuild: { jsx: 'automatic' },
  test: { environment: 'jsdom', restoreMocks: true },
});
