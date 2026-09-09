import { describe, it, expect, afterEach, vi } from 'vitest';
import { getErrorMessage } from './errorMessage.js';

describe('getErrorMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("prefers the server's own message above everything else", () => {
    const error = {
      response: { status: 400, data: { message: 'Password must be at least 6 characters' } },
    };

    expect(getErrorMessage(error)).toBe('Password must be at least 6 characters');
  });

  it('explains a timeout rather than blaming the user', () => {
    expect(getErrorMessage({ code: 'ECONNABORTED', message: 'timeout of 0ms exceeded' })).toMatch(
      /timed out/i
    );
  });

  it('detects being offline', () => {
    vi.stubGlobal('navigator', { onLine: false });

    expect(getErrorMessage({ message: 'Network Error' })).toMatch(/offline/i);
  });

  it('reports an unreachable server when there is no response', () => {
    vi.stubGlobal('navigator', { onLine: true });

    expect(getErrorMessage({ message: 'Network Error' })).toMatch(/could not reach the server/i);
  });

  it.each([
    [401, /session has expired/i],
    [403, /do not have permission/i],
    [404, /could not find/i],
    [409, /already exists/i],
    [413, /too large/i],
    [429, /too many requests/i],
    [500, /ran into a problem/i],
    [503, /temporarily unavailable/i],
  ])('maps status %i to a specific message', (status, pattern) => {
    expect(getErrorMessage({ response: { status, data: {} } })).toMatch(pattern);
  });

  it('uses the caller fallback for an unmapped status', () => {
    const message = getErrorMessage({ response: { status: 418, data: {} } }, 'Custom fallback');

    expect(message).toBe('Custom fallback');
  });

  it('never returns an empty string', () => {
    expect(getErrorMessage(undefined)).toBeTruthy();
    expect(getErrorMessage(null)).toBeTruthy();
    expect(getErrorMessage({})).toBeTruthy();
  });
});
