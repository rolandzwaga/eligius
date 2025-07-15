/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true, // Enables global test functions like `describe`, `it`, etc.
    environment: 'jsdom', // Use 'jsdom' if you're testing browser-based code
    coverage: {
      provider: 'istanbul', // Enables coverage reports
      reporter: ['text', 'json', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**'
      ]
    },
    include: ['src/test/**/*.spec.ts'],
    pool: 'threads',
    reporters: process.env.GITHUB_ACTIONS ? ['dot', 'github-actions'] : ['dot'],
  },
})
