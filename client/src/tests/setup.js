import '@testing-library/jest-dom/vitest';
import { afterEach, beforeEach } from 'vitest';
import { cleanup } from '@testing-library/react';

beforeEach(() => {
  // Each test starts from a signed-out browser.
  localStorage.clear();
});

afterEach(() => {
  cleanup();
});
