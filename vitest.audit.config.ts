import { defineConfig } from 'vitest/config';
import os from 'node:os';

export default defineConfig({
  test: {
    include: ['tests/subscription-audit/**/*.test.{ts,tsx,js}'],
    exclude: ['src/__tests__/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/subscription-audit/setup-audit.ts'],  // No mocking for audit
    bail: false,
    isolate: true,
    maxThreads: Math.max(2, Math.min(6, os.cpus()?.length || 2)),
    minThreads: 2,
    css: false,
  }
});
