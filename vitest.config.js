// vitest.config.js
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./src/tests/setup.js'],
    testTimeout: 30000,
    coverage: {
      reporter: ['text', 'html', 'json'],
      exclude: [
        'node_modules/',
        'src/tests/',
        'src/config/',
        'src/index.js',
        '**/*.config.js',
        '**/*.test.js'
      ],
      provider: 'v8',
      enabled: true
    },
    reporters: ['default', 'verbose'],
    hookTimeout: 30000,
    teardownTimeout: 30000,
    pool: 'forks'
  }
});