import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { checkEnv, REQUIRED_VARS } from '../config/validateEnv.js';
import createApp from '../app.js';

const app = createApp();

const completeEnv = {
  MONGO_URI: 'mongodb://127.0.0.1:27017/devlens',
  JWT_SECRET: 'secret',
  GEMINI_API_KEY: 'key',
  PORT: '5055',
  CLIENT_URL: 'http://localhost:5173',
};

describe('environment validation', () => {
  it('passes when every required variable is set', () => {
    const result = checkEnv(completeEnv);
    expect(result.valid).toBe(true);
    expect(result.missing).toEqual([]);
  });

  it('names exactly which variable is missing', () => {
    const { MONGO_URI, ...withoutMongo } = completeEnv;

    const result = checkEnv(withoutMongo);

    expect(result.valid).toBe(false);
    expect(result.missing).toEqual(['MONGO_URI']);
    expect(result.message).toContain('MONGO_URI');
    expect(result.message).not.toContain('JWT_SECRET');
  });

  it('reports every missing variable at once', () => {
    const result = checkEnv({ PORT: '5055' });

    expect(result.missing).toEqual(
      REQUIRED_VARS.map((v) => v.name).filter((n) => n !== 'PORT')
    );
  });

  it('treats an empty or whitespace value as missing', () => {
    expect(checkEnv({ ...completeEnv, JWT_SECRET: '' }).missing).toEqual(['JWT_SECRET']);
    expect(checkEnv({ ...completeEnv, JWT_SECRET: '   ' }).missing).toEqual(['JWT_SECRET']);
  });

  it('explains how to fix the problem', () => {
    const result = checkEnv({});
    expect(result.message).toMatch(/\.env\.example/);
  });
});

describe('security middleware', () => {
  it('sets helmet security headers on responses', async () => {
    const res = await request(app).get('/api/v1/health');

    expect(res.status).toBe(200);
    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-frame-options']).toBeDefined();
    // helmet removes the framework fingerprint.
    expect(res.headers['x-powered-by']).toBeUndefined();
  });

  it('still serves the health check unchanged', async () => {
    const res = await request(app).get('/api/v1/health');
    expect(res.body).toEqual({ status: 'ok', service: 'devlens-api' });
  });

  it('returns a JSON 404 for an unknown route', async () => {
    const res = await request(app).get('/api/v1/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/route not found/i);
  });
});
