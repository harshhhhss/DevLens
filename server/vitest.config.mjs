import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    // Tests mount app.js directly, which never loads dotenv - so real
    // credentials in server/.env can never leak into a test run.
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-not-a-real-key',
      GEMINI_API_KEY: 'test-gemini-key',
      CLIENT_URL: 'http://localhost:5173',
      PORT: '5055',
      TOKEN_ENCRYPTION_KEY: 'a'.repeat(64),
      GITHUB_CLIENT_ID: 'test-client-id',
      GITHUB_CLIENT_SECRET: 'test-client-secret',
    },
    setupFiles: ['./tests/setup.js'],
    // Suites share a single in-memory MongoDB connection per worker, so they
    // run serially to keep collection cleanup between tests deterministic.
    fileParallelism: false,
    testTimeout: 30000,
    hookTimeout: 120000,
    include: ['tests/**/*.test.js'],
  },
});
