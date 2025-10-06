import { defineConfig } from 'vitest/config';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const resolvePath = (p: string) => path.resolve(__dirname, p);

export default defineConfig({
  test: {
    include: ['tests/**/*.test.{ts,tsx,js}'],
    exclude: ['src/__tests__/**'],
    environment: 'jsdom',
    globals: true,
    setupFiles: ['tests/mocks/setup.ts'],
    bail: false,
    isolate: true,
    maxThreads: Math.max(2, Math.min(6, os.cpus()?.length || 2)),
    minThreads: 2,
    css: false,
    poolOptions: {
      threads: {
        singleThread: false
      }
    }
  },
  resolve: {
    alias: {
      '@': resolvePath('src')
    }
  }
});


