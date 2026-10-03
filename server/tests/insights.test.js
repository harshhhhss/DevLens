import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import createApp from '../app.js';
import Review from '../models/Review.js';
import { validateReviewResult } from '../services/reviewValidation.js';
import { CATEGORY_IDS, categoryLabel } from '../services/findingCategories.js';

const app = createApp();

/** Same fetch-stub convention as the other suites. */
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

/** A valid review whose findings carry the given categories. */
const reviewWith = ({ bug, security, performance, refactor }) => ({
  summary: 'Sample.',
  bugs: bug ? [{ line: 1, issue: 'bug', fix: 'fix', category: bug }] : [],
  security: security
    ? [{ line: 2, severity: 'High', issue: 'vuln', fix: 'fix', category: security }]
    : [],
  performance: performance ? [{ line: 3, issue: 'slow', fix: 'fix', category: performance }] : [],
  refactor: refactor ? [{ suggestion: 'tidy', reason: 'clearer', category: refactor }] : [],
  scores: { readability: 5, security: 5, overall: 5 },
  cleanCode: 'const a = 1;',
});

const SAMPLE_CODE = 'function getUser(id) { return id; }';

let fetchSpy;
const originalFetch = globalThis.fetch;

async function authedUser(email) {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'Insights', email, password: 'password123' });
  return { token: res.body.token, userId: res.body._id };
}

/** Creates one review whose findings use the given categories. */
async function seedReview(token, categories) {
  fetchSpy.mockResolvedValueOnce(geminiResponse(reviewWith(categories)));
  const res = await request(app)
    .post('/api/v1/review')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: SAMPLE_CODE, language: 'javascript' });
  expect(res.status).toBe(201);
  return res.body._id;
}

const getInsights = (token) =>
  request(app).get('/api/v1/review/insights').set('Authorization', `Bearer ${token}`);

beforeEach(() => {
  fetchSpy = vi.fn(async () => geminiResponse(reviewWith({ bug: 'null-safety' })));
  globalThis.fetch = fetchSpy;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('finding categories', () => {
  it('accepts every category in the taxonomy', () => {
    for (const category of CATEGORY_IDS) {
      const { valid } = validateReviewResult(reviewWith({ bug: category }));
      expect(valid, `category ${category} should validate`).toBe(true);
    }
  });

  it('rejects a finding with no category', () => {
    const payload = reviewWith({ bug: 'null-safety' });
    delete payload.bugs[0].category;

    const { valid, failures } = validateReviewResult(payload);

    expect(valid).toBe(false);
    expect(failures.join(' ')).toContain('bugs[0].category');
  });

  it('rejects a category outside the taxonomy', () => {
    const payload = reviewWith({ security: 'sql-injection' });
    payload.security[0].category = 'made-up-category';

    const { failures } = validateReviewResult(payload);

    expect(failures.join(' ')).toContain('security[0].category');
  });

  it('checks every finding type, not just bugs', () => {
    for (const field of ['bugs', 'security', 'performance', 'refactor']) {
      const payload = reviewWith({
        bug: 'null-safety',
        security: 'xss',
        performance: 'memory',
        refactor: 'naming',
      });
      delete payload[field][0].category;

      expect(validateReviewResult(payload).failures.join(' ')).toContain(`${field}[0].category`);
    }
  });

  it('persists the category on the saved review', async () => {
    const { token } = await authedUser('cat@example.com');
    const id = await seedReview(token, { bug: 'off-by-one', security: 'secrets' });

    const stored = await Review.findById(id).lean();
    expect(stored.result.bugs[0].category).toBe('off-by-one');
    expect(stored.result.security[0].category).toBe('secrets');
  });

  it('retries once when a category is missing, exactly like other bad fields', async () => {
    const { token } = await authedUser('retry@example.com');
    const bad = reviewWith({ bug: 'null-safety' });
    delete bad.bugs[0].category;

    fetchSpy
      .mockResolvedValueOnce(geminiResponse(bad))
      .mockResolvedValueOnce(geminiResponse(reviewWith({ bug: 'null-safety' })));

    const res = await request(app)
      .post('/api/v1/review')
      .set('Authorization', `Bearer ${token}`)
      .send({ code: SAMPLE_CODE, language: 'javascript' });

    expect(res.status).toBe(201);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('sends the allowed categories to Gemini in the prompt', async () => {
    const { token } = await authedUser('prompt@example.com');
    await seedReview(token, { bug: 'null-safety' });

    const [, init] = fetchSpy.mock.calls[0];
    const prompt = JSON.parse(init.body).contents[0].parts[0].text;

    expect(prompt).toContain('sql-injection');
    expect(prompt).toContain('null-safety');
    expect(prompt).toContain('"category"');
  });
});

describe('GET /api/v1/review/insights', () => {
  it('requires authentication', async () => {
    const res = await request(app).get('/api/v1/review/insights');
    expect(res.status).toBe(401);
  });

  it('returns a genuine empty result for a user with no reviews', async () => {
    const { token } = await authedUser('empty@example.com');

    const res = await getInsights(token);

    expect(res.status).toBe(200);
    expect(res.body.totalReviews).toBe(0);
    expect(res.body.totalFindings).toBe(0);
    expect(res.body.categories).toEqual([]);
  });

  it('counts findings per category across the user reviews', async () => {
    const { token } = await authedUser('counts@example.com');
    await seedReview(token, { bug: 'null-safety', security: 'sql-injection' });
    await seedReview(token, { bug: 'null-safety', performance: 'memory' });
    await seedReview(token, { refactor: 'naming' });

    const res = await getInsights(token);

    expect(res.status).toBe(200);
    expect(res.body.totalReviews).toBe(3);
    expect(res.body.totalFindings).toBe(5);

    const byId = Object.fromEntries(res.body.categories.map((c) => [c.category, c]));
    expect(byId['null-safety'].count).toBe(2);
    expect(byId['sql-injection'].count).toBe(1);
    expect(byId.memory.count).toBe(1);
    expect(byId.naming.count).toBe(1);
  });

  it('sorts categories by how often they recur', async () => {
    const { token } = await authedUser('sorted@example.com');
    await seedReview(token, { bug: 'null-safety' });
    await seedReview(token, { bug: 'null-safety' });
    await seedReview(token, { bug: 'naming' });

    const res = await getInsights(token);

    expect(res.body.categories[0].category).toBe('null-safety');
    expect(res.body.categories[0].count).toBe(2);
  });

  it('includes a human label for each category', async () => {
    const { token } = await authedUser('labels@example.com');
    await seedReview(token, { security: 'sql-injection' });

    const res = await getInsights(token);

    expect(res.body.categories[0].label).toBe(categoryLabel('sql-injection'));
    expect(res.body.categories[0].label).not.toBe('sql-injection');
  });

  it('reports a trend from the recent window against the previous one', async () => {
    const { token } = await authedUser('trend@example.com');
    // Six reviews: the five most recent form the "recent" window.
    await seedReview(token, { bug: 'naming' }); // oldest -> previous window
    for (let i = 0; i < 5; i += 1) await seedReview(token, { bug: 'null-safety' });

    const res = await getInsights(token);

    const byId = Object.fromEntries(res.body.categories.map((c) => [c.category, c]));
    expect(res.body.trendWindow).toBe(5);
    expect(byId['null-safety']).toMatchObject({ recent: 5, previous: 0, trend: 'up' });
    expect(byId.naming).toMatchObject({ recent: 0, previous: 1, trend: 'down' });
  });

  it("never mixes in another user's findings", async () => {
    const { token: mine } = await authedUser('mine@example.com');
    const { token: theirs } = await authedUser('theirs@example.com');

    await seedReview(mine, { bug: 'null-safety' });
    await seedReview(theirs, { bug: 'sql-injection' });
    await seedReview(theirs, { bug: 'sql-injection' });

    const res = await getInsights(mine);

    expect(res.body.totalReviews).toBe(1);
    expect(res.body.totalFindings).toBe(1);
    expect(res.body.categories).toHaveLength(1);
    expect(res.body.categories[0].category).toBe('null-safety');
    // Their far more common category must not leak in.
    expect(JSON.stringify(res.body)).not.toContain('sql-injection');
  });

  it('is not shadowed by the /:id route', async () => {
    const { token } = await authedUser('route@example.com');

    const res = await getInsights(token);

    // A 404 here would mean "insights" was read as a review id.
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('categories');
  });
});
