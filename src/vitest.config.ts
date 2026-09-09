import {defineConfig} from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    setupFiles: 'src/test/setup.ts',
    globals: true, // Enables global test functions like `describe`, `it`, etc.
    environment: 'jsdom', // Use 'jsdom' if you're testing browser-based code
    // Create the jsdom environment once per worker instead of once per file
    // (each file still gets a fresh window); jsdom setup dominated run time.
    pool: 'vmThreads',
    clearMocks: true,
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    coverage: {
      provider: 'istanbul', // Enables coverage reports
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        'src/build/**',
        'src/tools/**',
        'src/test/**',
        '**/metadata/**',
        'copy-schema.js',
        'build/**',
        'docs/**',
        // Exclude devtools integration that requires browser extension
        '**/devtool-event-listener.ts',
        // Exclude type-only and index files
        '**/types.ts',
        '**/index.ts',
      ],
    },
    include: ['src/test/**/*.spec.ts'],
    reporters: process.env.GITHUB_ACTIONS
      ? ['dot', 'github-actions']
      : ['default'],
  },
});
