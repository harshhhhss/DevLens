import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import createApp from '../app.js';
import Review from '../models/Review.js';

const app = createApp();

/**
 * Same convention as review.test.js: stub global fetch so creating a review
 * exercises the real aiService without a network call.
 */
const AI_REVIEW = {
  summary: 'Builds SQL by concatenation.',
  bugs: [{ line: 2, issue: 'Returns the query string', fix: 'Return the row', category: 'logic-error' }],
  security: [{ line: 2, severity: 'Critical', issue: 'SQL injection', fix: 'Parameterise', category: 'sql-injection' }],
  performance: [{ line: 4, issue: 'O(n^2) scan', fix: 'Use a Set', category: 'algorithmic-complexity' }],
  refactor: [{ suggestion: 'Use const', reason: 'Block scoping', category: 'style' }],
  scores: { readability: 4, security: 1, overall: 2 },
  cleanCode: 'const user = await db.query(sql, [id]);',
};

function geminiResponse(payload) {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: { parts: [{ text: JSON.stringify(payload) }], role: 'model' },
          finishReason: 'STOP',
          index: 0,
        },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );
}

const SAMPLE_CODE = 'function getUser(id) { return "SELECT * FROM users WHERE id = " + id; }';

let fetchSpy;
const originalFetch = globalThis.fetch;

async function authedUser(email) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Owner', email, password: 'password123' });
  return { token: res.body.token, userId: res.body._id };
}

/** Creates a review owned by `token`'s user and returns its id. */
async function createReview(token) {
  const res = await request(app)
    .post('/api/v1/review')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: SAMPLE_CODE, language: 'javascript' });
  return res.body._id;
}

const setVisibility = (token, id, visibility) =>
  request(app)
    .patch(`/api/v1/review/${id}/visibility`)
    .set('Authorization', `Bearer ${token}`)
    .send({ visibility });

beforeEach(() => {
  fetchSpy = vi.fn(async () => geminiResponse(AI_REVIEW));
  globalThis.fetch = fetchSpy;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('PATCH /api/v1/review/:id/visibility', () => {
  it('defaults a new review to private', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);

    const stored = await Review.findById(id);
    expect(stored.visibility).toBe('private');
  });

  it('lets the owner publish and unpublish', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);

    const made = await setVisibility(token, id, 'public');
    expect(made.status).toBe(200);
    expect(made.body.visibility).toBe('public');
    expect((await Review.findById(id)).visibility).toBe('public');

    const reverted = await setVisibility(token, id, 'private');
    expect(reverted.status).toBe(200);
    expect(reverted.body.visibility).toBe('private');
    expect((await Review.findById(id)).visibility).toBe('private');
  });

  it("refuses to change another user's review", async () => {
    const { token: ownerToken } = await authedUser('owner@example.com');
    const id = await createReview(ownerToken);
    const { token: otherToken } = await authedUser('other@example.com');

    const res = await setVisibility(otherToken, id, 'public');

    expect(res.status).toBe(404);
    // Unchanged, so a failed attempt cannot publish someone else's review.
    expect((await Review.findById(id)).visibility).toBe('private');
  });

  it('requires authentication', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);

    const res = await request(app)
      .patch(`/api/v1/review/${id}/visibility`)
      .send({ visibility: 'public' });

    expect(res.status).toBe(401);
    expect((await Review.findById(id)).visibility).toBe('private');
  });

  it.each([['unlisted'], [''], [null], [true]])(
    'rejects an invalid visibility value (%s)',
    async (value) => {
      const { token } = await authedUser('owner@example.com');
      const id = await createReview(token);

      const res = await setVisibility(token, id, value);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/visibility must be one of/i);
      expect((await Review.findById(id)).visibility).toBe('private');
    }
  );

  it('rejects a missing visibility field', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);

    const res = await request(app)
      .patch(`/api/v1/review/${id}/visibility`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('answers 404 for a malformed id', async () => {
    const { token } = await authedUser('owner@example.com');

    const res = await setVisibility(token, 'not-an-id', 'public');

    expect(res.status).toBe(404);
  });
});

describe('GET /api/v1/public/review/:id', () => {
  it('serves a public review with no token at all', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);
    await setVisibility(token, id, 'public');

    const res = await request(app).get(`/api/v1/public/review/${id}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(id);
    expect(res.body.code).toBe(SAMPLE_CODE);
    expect(res.body.language).toBe('javascript');
    expect(res.body.result.scores).toMatchObject({ readability: 4, security: 1, overall: 2 });
    expect(res.body.result.cleanCode).toBe(AI_REVIEW.cleanCode);
  });

  it('serves a public review to a signed-in non-owner', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);
    await setVisibility(token, id, 'public');
    const { token: otherToken } = await authedUser('other@example.com');

    const res = await request(app)
      .get(`/api/v1/public/review/${id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(200);
    expect(res.body._id).toBe(id);
  });

  it('never exposes owner-identifying fields', async () => {
    const { token, userId } = await authedUser('owner@example.com');
    const id = await createReview(token);
    await setVisibility(token, id, 'public');

    const res = await request(app).get(`/api/v1/public/review/${id}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBeUndefined();
    expect(res.body.__v).toBeUndefined();
    // Nothing anywhere in the payload points back at the owner.
    const body = JSON.stringify(res.body);
    expect(body).not.toContain(userId);
    expect(body).not.toContain('owner@example.com');
    expect(body).not.toContain('password');
  });

  it('answers 404 while the review is private', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);

    const res = await request(app).get(`/api/v1/public/review/${id}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('stops serving a review once it is made private again', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);
    await setVisibility(token, id, 'public');
    expect((await request(app).get(`/api/v1/public/review/${id}`)).status).toBe(200);

    await setVisibility(token, id, 'private');

    expect((await request(app).get(`/api/v1/public/review/${id}`)).status).toBe(404);
  });

  it('answers a private review and an unknown id identically', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);

    const privateRes = await request(app).get(`/api/v1/public/review/${id}`);
    const missingRes = await request(app).get(
      '/api/v1/public/review/507f1f77bcf86cd799439011'
    );
    const malformedRes = await request(app).get('/api/v1/public/review/not-an-id');

    // Same status and body, so existence is never leaked by the difference.
    expect(privateRes.status).toBe(404);
    expect(missingRes.status).toBe(404);
    expect(malformedRes.status).toBe(404);
    expect(privateRes.body).toEqual(missingRes.body);
    expect(privateRes.body).toEqual(malformedRes.body);
  });

  it('does not require the private review route to change behaviour', async () => {
    // The owner-scoped route stays owner-only even when the review is public.
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);
    await setVisibility(token, id, 'public');
    const { token: otherToken } = await authedUser('other@example.com');

    const res = await request(app)
      .get(`/api/v1/review/${id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

describe('public review rate limiting', () => {
  // Limiters are skipped when NODE_ENV=test, and `skip` is evaluated per
  // request, so flipping the flag inside the test exercises the real limiter.
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
  });

  it('applies a limit to the unauthenticated route', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);
    await setVisibility(token, id, 'public');

    process.env.NODE_ENV = 'development';
    const res = await request(app).get(`/api/v1/public/review/${id}`);

    expect(res.status).toBe(200);
    expect(res.headers['ratelimit-limit']).toBe('60');
  });

  it('returns 429 once the window is exhausted', async () => {
    const { token } = await authedUser('owner@example.com');
    const id = await createReview(token);
    await setVisibility(token, id, 'public');

    process.env.NODE_ENV = 'development';
    let last;
    for (let i = 0; i < 62; i += 1) {
      last = await request(app).get(`/api/v1/public/review/${id}`);
      if (last.status === 429) break;
    }

    expect(last.status).toBe(429);
    expect(last.body.message).toMatch(/too many requests/i);
  });
});
