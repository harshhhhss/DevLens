import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import createApp from '../app.js';
import Review from '../models/Review.js';

const app = createApp();

/**
 * The Gemini SDK talks to the network through global fetch, so stubbing fetch
 * keeps the suite offline and deterministic while still exercising the real
 * aiService - including its prompt construction, JSON extraction and score
 * normalisation. vi.mock() cannot be used here: the controllers reach the AI
 * service through CommonJS require(), which bypasses Vitest's mock registry.
 */
const AI_REVIEW = {
  summary: 'Uses string concatenation to build SQL.',
  bugs: [{ line: 3, issue: 'Returns the query, not the row', fix: 'Return the result' }],
  security: [
    { line: 2, severity: 'Critical', issue: 'SQL injection', fix: 'Use a parameterised query' },
  ],
  performance: [{ line: 5, issue: 'O(n^2) scan', fix: 'Use a Set' }],
  refactor: [{ suggestion: 'Use const', reason: 'Block scoping' }],
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

/** The prompt text the server sent to Gemini on the Nth call. */
function promptSentOnCall(n = 0) {
  const [, init] = fetchSpy.mock.calls[n];
  return JSON.stringify(JSON.parse(init.body));
}

async function authedUser(email = 'reviewer@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Reviewer', email, password: 'password123' });
  return { token: res.body.token, userId: res.body._id };
}

beforeEach(() => {
  fetchSpy = vi.fn(async () => geminiResponse(AI_REVIEW));
  globalThis.fetch = fetchSpy;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('POST /api/v1/review', () => {
  it('stores the review and returns the full structured result', async () => {
    const { token, userId } = await authedUser();

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(201);
    expect(res.body.language).toBe('javascript');
    expect(res.body.code).toBe(SAMPLE_CODE);
    expect(res.body.result.scores).toMatchObject({ readability: 4, security: 1, overall: 2 });
    expect(res.body.result.security[0].severity).toBe('Critical');
    expect(res.body.result.cleanCode).toBe(AI_REVIEW.cleanCode);
    expect(res.body.result.bugs).toHaveLength(1);

    // Persisted against the right owner.
    const stored = await Review.findById(res.body._id);
    expect(stored).not.toBeNull();
    expect(String(stored.userId)).toBe(userId);
  });

  it('sends the submitted code and language to Gemini', async () => {
    const { token } = await authedUser();

    await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'python' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const prompt = promptSentOnCall(0);
    expect(prompt).toContain('SELECT * FROM users WHERE id');
    expect(prompt).toContain('python');
  });

  it('normalises language casing before storing', async () => {
    const { token } = await authedUser();

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'JavaScript' });

    expect(res.status).toBe(201);
    expect(res.body.language).toBe('javascript');
  });

  it('retries instead of clamping out-of-range scores', async () => {
    // Clamping 42 down to 10 would turn a model malfunction into a perfect
    // score, so an out-of-range value now fails validation and is retried.
    const { token } = await authedUser();
    fetchSpy.mockResolvedValueOnce(
      geminiResponse({ ...AI_REVIEW, scores: { readability: 42, security: -5, overall: 7 } })
    );

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(res.body.result.scores).toMatchObject({ readability: 4, security: 1, overall: 2 });
  });

  it('rounds fractional scores to one decimal place', async () => {
    const { token } = await authedUser();
    fetchSpy.mockResolvedValueOnce(
      geminiResponse({ ...AI_REVIEW, scores: { readability: 5.55, security: 3.21, overall: 7 } })
    );

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(201);
    expect(res.body.result.scores).toMatchObject({ readability: 5.6, security: 3.2, overall: 7 });
  });

  it('tolerates a model reply wrapped in markdown fences', async () => {
    const { token } = await authedUser();
    fetchSpy.mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          candidates: [
            {
              content: {
                parts: [{ text: '```json\n' + JSON.stringify(AI_REVIEW) + '\n```' }],
                role: 'model',
              },
              finishReason: 'STOP',
              index: 0,
            },
          ],
        }),
        { status: 200, headers: { 'content-type': 'application/json' } }
      )
    );

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(201);
    expect(res.body.result.cleanCode).toBe(AI_REVIEW.cleanCode);
  });

  it('requires authentication', async () => {
    const res = await request(app)
      .post('/api/v1/review')
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(401);
    expect(fetchSpy).not.toHaveBeenCalled();
    expect(await Review.countDocuments()).toBe(0);
  });

  it('rejects empty code without spending a Gemini call', async () => {
    const { token } = await authedUser();

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: '   ', language: 'javascript' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/code is required/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects an unsupported language without spending a Gemini call', async () => {
    const { token } = await authedUser();

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'brainfuck' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/language must be one of/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('rejects code over the length limit without spending a Gemini call', async () => {
    const { token } = await authedUser();

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'x'.repeat(20001), language: 'javascript' });

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/too long/i);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('does not persist a review when Gemini fails', async () => {
    const { token } = await authedUser();
    fetchSpy.mockResolvedValueOnce(
      new Response(JSON.stringify({ error: { message: 'quota exceeded' } }), { status: 429 })
    );

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(500);
    expect(await Review.countDocuments()).toBe(0);
  });

  it('does not persist a review when the model returns unparseable output', async () => {
    // Unparseable output is retried once, so both attempts must fail before the
    // request gives up. 502: the model answered, but with something unusable.
    const { token } = await authedUser();
    // A fresh Response per call: a body can only be consumed once, so reusing
    // one object would make the retry fail for the wrong reason.
    fetchSpy.mockImplementation(
      async () =>
        new Response(
          JSON.stringify({
            candidates: [
              { content: { parts: [{ text: 'not json at all' }], role: 'model' }, index: 0 },
            ],
          }),
          { status: 200, headers: { 'content-type': 'application/json' } }
        )
    );

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(502);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(await Review.countDocuments()).toBe(0);
  });
});

describe('GET /api/v1/review/history', () => {
  it("returns only the requesting user's reviews, newest first", async () => {
    const { token } = await authedUser();

    await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'first', language: 'javascript' });
    await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: 'second', language: 'python' });

    // A second user's review must not appear.
    const other = await authedUser('other@example.com');
    await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${other.token}`)
      .send({ code: 'theirs', language: 'go' });

    const res = await request(app)
      .get('/api/v1/review/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.reviews).toHaveLength(2);
    expect(res.body.reviews[0].language).toBe('python'); // newest first
    // The list view omits the code blob.
    expect(res.body.reviews[0].code).toBeUndefined();
  });

  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/review/history');
    expect(res.status).toBe(401);
  });
});

describe('GET and DELETE /api/v1/review/:id', () => {
  it('returns a single review including its code', async () => {
    const { token } = await authedUser();
    const created = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    const res = await request(app)
      .get(`/api/v1/review/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.code).toBe(SAMPLE_CODE);
  });

  it("does not expose another user's review", async () => {
    const { token } = await authedUser();
    const created = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    const other = await authedUser('other@example.com');

    const res = await request(app)
      .get(`/api/v1/review/${created.body._id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(404);
  });

  it('answers 404 for a malformed id rather than a 500', async () => {
    const { token } = await authedUser();

    const res = await request(app)
      .get('/api/v1/review/not-a-valid-id')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(res.body.message).toMatch(/not found/i);
  });

  it("deletes the owner's review", async () => {
    const { token } = await authedUser();
    const created = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    const res = await request(app)
      .delete(`/api/v1/review/${created.body._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(await Review.countDocuments()).toBe(0);
  });

  it("does not delete another user's review", async () => {
    const { token } = await authedUser();
    const created = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    const other = await authedUser('other@example.com');

    const res = await request(app)
      .delete(`/api/v1/review/${created.body._id}`)
      .set('Authorization', `Bearer ${other.token}`);

    expect(res.status).toBe(404);
    expect(await Review.countDocuments()).toBe(1);
  });
});
