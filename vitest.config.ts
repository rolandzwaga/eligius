/// <reference types="vitest" />
import { defineConfig } from 'vite'

export default defineConfig({
  test: {
    globals: true, // Enables global test functions like `describe`, `it`, etc.
    environment: 'jsdom', // Use 'jsdom' if you're testing browser-based code
    coverage: {
      provider: 'istanbul', // Enables coverage reports
    },
    include: ['src/test/**/*.spec.ts'],
  },
})
