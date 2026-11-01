import {configDefaults, defineConfig} from 'vitest/config';
import baseConfig from './vitest.config.ts';

/**
 * Runs the specs in `src/test/published/`, which import the BUILT package through
 * its own `exports` map (`eligius`, `eligius/runtime`, ...). They need
 * `npm run build` first; `npm run test:published` does both.
 */
export default defineConfig({
  ...baseConfig,
  test: {
    ...baseConfig.test,
    include: ['src/test/published/**/*.spec.ts'],
    exclude: configDefaults.exclude,
  },
});
