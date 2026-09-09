import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import MockAdapter from 'axios-mock-adapter';
import api, {
  registerUser,
  loginUser,
  fetchMe,
  submitReview,
  fetchReviewHistory,
  fetchReviewById,
  deleteReviewById,
} from './api.js';

let mock;

beforeEach(() => {
  mock = new MockAdapter(api);
});

afterEach(() => {
  mock.restore();
});

describe('request interceptor', () => {
  it('attaches the stored JWT as a Bearer token', async () => {
    localStorage.setItem('devlens_token', 'token-123');
    mock.onGet('/auth/me').reply(200, { _id: '1' });

    await fetchMe();

    expect(mock.history.get[0].headers.Authorization).toBe('Bearer token-123');
  });

  it('sends no Authorization header when signed out', async () => {
    mock.onGet('/auth/me').reply(200, {});

    await fetchMe();

    expect(mock.history.get[0].headers.Authorization).toBeUndefined();
  });

  it('picks up a token stored after the module was imported', async () => {
    mock.onGet('/auth/me').reply(200, {});

    await fetchMe();
    localStorage.setItem('devlens_token', 'later-token');
    await fetchMe();

    expect(mock.history.get[0].headers.Authorization).toBeUndefined();
    expect(mock.history.get[1].headers.Authorization).toBe('Bearer later-token');
  });
});

describe('response interceptor', () => {
  it('clears the stored session on 401', async () => {
    localStorage.setItem('devlens_token', 'expired');
    localStorage.setItem('devlens_user', JSON.stringify({ name: 'Ada' }));
    mock.onGet('/auth/me').reply(401, { message: 'Not authorized' });

    await expect(fetchMe()).rejects.toBeTruthy();

    expect(localStorage.getItem('devlens_token')).toBeNull();
    expect(localStorage.getItem('devlens_user')).toBeNull();
  });

  it('keeps the session on non-401 failures', async () => {
    localStorage.setItem('devlens_token', 'still-good');
    localStorage.setItem('devlens_user', JSON.stringify({ name: 'Ada' }));
    mock.onPost('/review').reply(500, { message: 'Gemini exploded' });

    await expect(submitReview({ code: 'x', language: 'javascript' })).rejects.toBeTruthy();

    // A server-side failure must not sign the user out.
    expect(localStorage.getItem('devlens_token')).toBe('still-good');
    expect(localStorage.getItem('devlens_user')).not.toBeNull();
  });

  it('rejects with the error so callers can read the server message', async () => {
    mock.onPost('/auth/login').reply(401, { message: 'Invalid email or password' });

    await expect(loginUser({ email: 'a@b.com', password: 'nope' })).rejects.toMatchObject({
      response: { status: 401, data: { message: 'Invalid email or password' } },
    });
  });
});

describe('endpoint helpers', () => {
  it('registerUser posts to /auth/register', async () => {
    mock.onPost('/auth/register').reply(201, { _id: '1', token: 't' });
    const body = { name: 'Ada', email: 'ada@example.com', password: 'password123' };

    const res = await registerUser(body);

    expect(res.status).toBe(201);
    expect(mock.history.post[0].url).toBe('/auth/register');
    expect(JSON.parse(mock.history.post[0].data)).toEqual(body);
  });

  it('loginUser posts to /auth/login', async () => {
    mock.onPost('/auth/login').reply(200, { token: 't' });

    await loginUser({ email: 'ada@example.com', password: 'password123' });

    expect(mock.history.post[0].url).toBe('/auth/login');
  });

  it('submitReview posts code and language to /review', async () => {
    mock.onPost('/review').reply(201, { _id: 'r1' });

    await submitReview({ code: 'const a = 1;', language: 'javascript' });

    expect(mock.history.post[0].url).toBe('/review');
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      code: 'const a = 1;',
      language: 'javascript',
    });
  });

  it('fetchReviewHistory defaults to page 1 with a limit of 10', async () => {
    mock.onGet(/\/review\/history/).reply(200, { reviews: [] });

    await fetchReviewHistory();

    expect(mock.history.get[0].url).toBe('/review/history?page=1&limit=10');
  });

  it('fetchReviewHistory passes through explicit paging', async () => {
    mock.onGet(/\/review\/history/).reply(200, { reviews: [] });

    await fetchReviewHistory(3, 25);

    expect(mock.history.get[0].url).toBe('/review/history?page=3&limit=25');
  });

  it('fetchReviewById and deleteReviewById target the review id', async () => {
    mock.onGet('/review/abc123').reply(200, { _id: 'abc123' });
    mock.onDelete('/review/abc123').reply(200, { message: 'Review deleted' });

    await fetchReviewById('abc123');
    await deleteReviewById('abc123');

    expect(mock.history.get[0].url).toBe('/review/abc123');
    expect(mock.history.delete[0].url).toBe('/review/abc123');
  });
});

describe('base URL resolution', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  async function freshApi() {
    vi.resetModules();
    const mod = await import('./api.js');
    return mod.default;
  }

  it('uses VITE_API_BASE_URL when set', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'https://api.example.com/api/v1');

    const instance = await freshApi();

    expect(instance.defaults.baseURL).toBe('https://api.example.com/api/v1');
  });

  it('falls back to the legacy VITE_API_URL name', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_API_URL', 'https://legacy.example.com/api/v1');

    const instance = await freshApi();

    expect(instance.defaults.baseURL).toBe('https://legacy.example.com/api/v1');
  });

  it('falls back to a local dev URL that is not the commonly-taken port 5000', async () => {
    vi.stubEnv('VITE_API_BASE_URL', '');
    vi.stubEnv('VITE_API_URL', '');

    const instance = await freshApi();

    expect(instance.defaults.baseURL).toContain('localhost');
    expect(instance.defaults.baseURL).not.toContain(':5000');
  });
});
