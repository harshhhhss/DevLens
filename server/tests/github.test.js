import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
/**
 * Both outbound services are stubbed through global fetch and dispatched by
 * URL. This matches the existing suites (the controllers reach these services
 * through CommonJS require(), which bypasses Vitest's module mock registry) and
 * means Octokit's real request layer runs without a single packet leaving.
 */
import createApp from '../app.js';
import User from '../models/User.js';
import PullRequestReview from '../models/PullRequestReview.js';
import { encryptToken, decryptToken } from '../services/tokenCrypto.js';
import { triageFile, languageFor, MAX_FILES_PER_PR } from '../controllers/githubController.js';
import { MAX_CODE_LENGTH } from '../middleware/validators.js';

const app = createApp();

const AI_REVIEW = {
  summary: 'Concatenates SQL.',
  bugs: [{ line: 2, issue: 'Returns the query', fix: 'Return the row', category: 'logic-error' }],
  security: [
    { line: 2, severity: 'Critical', issue: 'SQL injection', fix: 'Parameterise', category: 'sql-injection' },
  ],
  performance: [],
  refactor: [],
  scores: { readability: 4, security: 1, overall: 2 },
  cleanCode: 'const user = await db.query(sql, [id]);',
};

const geminiResponse = (payload) =>
  new Response(
    JSON.stringify({
      candidates: [
        { content: { parts: [{ text: JSON.stringify(payload) }], role: 'model' }, finishReason: 'STOP', index: 0 },
      ],
    }),
    { status: 200, headers: { 'content-type': 'application/json' } }
  );

/** What the fake GitHub returns, set per test. */
const gh = {
  user: { login: 'octocat' },
  repos: [],
  pulls: [],
  files: [],
  comment: { id: 1, html_url: 'https://github.com/o/r/pull/7#issuecomment-1' },
};

/** Every GitHub request the code under test made, newest last. */
let githubCalls = [];
/** Every Gemini request, so prompt assertions and call counts still work. */
let geminiCalls = [];

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });

function handleGithub(url, init) {
  const { pathname } = new URL(url);
  const method = (init?.method || 'GET').toUpperCase();
  githubCalls.push({ pathname, method, body: init?.body });

  if (pathname === '/user') return json(gh.user);
  if (pathname === '/user/repos') return json(gh.repos);
  if (/^\/repos\/[^/]+\/[^/]+\/pulls$/.test(pathname)) return json(gh.pulls);
  if (/^\/repos\/[^/]+\/[^/]+\/pulls\/\d+\/files$/.test(pathname)) return json(gh.files);
  if (/^\/repos\/[^/]+\/[^/]+\/issues\/\d+\/comments$/.test(pathname)) return json(gh.comment, 201);
  return json({ message: 'Not Found' }, 404);
}

let fetchSpy;
const originalFetch = globalThis.fetch;

const commentCalls = () =>
  githubCalls.filter((c) => c.method === 'POST' && c.pathname.endsWith('/comments'));

async function authedUser(email = 'gh@example.com') {
  const res = await request(app)
    .post('/api/v1/auth/register')
    .send({ name: 'GH', email, password: 'password123' });
  return { token: res.body.token, userId: res.body._id };
}

/** Marks a user connected with an encrypted token, as the OAuth callback does. */
async function connectGithub(userId, accessToken = 'gho_testtoken123') {
  await User.findByIdAndUpdate(userId, {
    githubToken: encryptToken(accessToken),
    githubConnected: true,
    githubLogin: 'octocat',
  });
}

const auth = (token) => ({ Authorization: `Bearer ${token}` });

/** Queue of Gemini bodies; the last one repeats once the queue drains. */
let geminiQueue = [];

beforeEach(() => {
  githubCalls = [];
  geminiCalls = [];
  geminiQueue = [AI_REVIEW];
  gh.repos = [];
  gh.pulls = [];
  gh.files = [];

  fetchSpy = vi.fn(async (url, init) => {
    const href = typeof url === 'string' ? url : url.url;
    if (href.includes('api.github.com')) return handleGithub(href, init);
    if (href.includes('github.com/login/oauth')) return json({ access_token: 'gho_exchanged' });
    geminiCalls.push({ href, init });
    return geminiResponse(geminiQueue.length > 1 ? geminiQueue.shift() : geminiQueue[0]);
  });
  globalThis.fetch = fetchSpy;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

describe('token encryption', () => {
  it('round-trips a token back to the original value', () => {
    const original = 'gho_averyrealisticlookingtoken_0123456789';
    const encrypted = encryptToken(original);

    expect(encrypted).not.toContain(original);
    expect(decryptToken(encrypted)).toBe(original);
  });

  it('produces different ciphertext each time for the same input', () => {
    // A fresh IV per call, so identical tokens are not identifiable in the DB.
    expect(encryptToken('same-token')).not.toBe(encryptToken('same-token'));
  });

  it('refuses to decrypt tampered ciphertext', () => {
    const encrypted = encryptToken('gho_token');
    const [iv, tag, data] = encrypted.split(':');
    const flipped = Buffer.from(data, 'base64');
    flipped[0] ^= 0xff;

    expect(() => decryptToken([iv, tag, flipped.toString('base64')].join(':'))).toThrow();
  });

  it('rejects a malformed stored value', () => {
    expect(() => decryptToken('not-encrypted')).toThrow(/expected format/i);
  });

  it('never stores the raw token on the user document', async () => {
    const { userId } = await authedUser();
    await connectGithub(userId, 'gho_secretvalue');

    const raw = await User.findById(userId).select('+githubToken').lean();
    expect(raw.githubToken).not.toContain('gho_secretvalue');
    expect(decryptToken(raw.githubToken)).toBe('gho_secretvalue');
  });

  it('does not expose the token through the API', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId, 'gho_secretvalue');

    const res = await request(app).get('/api/v1/auth/me').set(auth(token));

    expect(JSON.stringify(res.body)).not.toContain('gho_secretvalue');
    expect(res.body.githubToken).toBeUndefined();
  });
});

describe('connection status and disconnect', () => {
  it('reports disconnected by default', async () => {
    const { token } = await authedUser();

    const res = await request(app).get('/api/v1/github/status').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.connected).toBe(false);
  });

  it('reports connected once a token is stored', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);

    const res = await request(app).get('/api/v1/github/status').set(auth(token));

    expect(res.body.connected).toBe(true);
    expect(res.body.login).toBe('octocat');
  });

  it('clears the stored token on disconnect', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);

    const res = await request(app).delete('/api/v1/github/disconnect').set(auth(token));

    expect(res.status).toBe(200);
    const raw = await User.findById(userId).select('+githubToken').lean();
    expect(raw.githubToken).toBeNull();
    expect(raw.githubConnected).toBe(false);
  });

  it('requires authentication on every data route', async () => {
    for (const [method, path] of [
      ['get', '/api/v1/github/status'],
      ['get', '/api/v1/github/repos'],
      ['get', '/api/v1/github/repos/o/r/pulls'],
      ['post', '/api/v1/github/review'],
      ['delete', '/api/v1/github/disconnect'],
    ]) {
      const res = await request(app)[method](path);
      expect(res.status, `${method} ${path}`).toBe(401);
    }
  });
});

describe('repo and pull request listing', () => {
  it('lists the connected user repositories', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);
    gh.repos = [
      { id: 1, name: 'devlens', full_name: 'octocat/devlens', owner: { login: 'octocat' }, private: false, default_branch: 'main', updated_at: '2026-01-01' },
    ];

    const res = await request(app).get('/api/v1/github/repos').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.repos).toHaveLength(1);
    expect(res.body.repos[0]).toMatchObject({ fullName: 'octocat/devlens', owner: 'octocat' });
  });

  it('lists open pull requests', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);
    gh.pulls = [
      { number: 7, title: 'Add caching', user: { login: 'dev' }, head: { ref: 'f' }, base: { ref: 'main' }, created_at: '2026-01-02', html_url: 'https://github.com/o/r/pull/7' },
    ];

    const res = await request(app).get('/api/v1/github/repos/octocat/devlens/pulls').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.pulls[0]).toMatchObject({ number: 7, title: 'Add caching' });
  });

  it('refuses when GitHub is not connected', async () => {
    const { token } = await authedUser();

    const res = await request(app).get('/api/v1/github/repos').set(auth(token));

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/connect your github/i);
    expect(githubCalls.filter((c) => c.pathname === '/user/repos')).toHaveLength(0);
  });

  it("never uses another user's token", async () => {
    const { userId: ownerId } = await authedUser('owner@example.com');
    await connectGithub(ownerId, 'gho_owner_token');
    const { token: otherToken } = await authedUser('other@example.com');

    const res = await request(app).get('/api/v1/github/repos').set(auth(otherToken));

    // The unconnected user is refused rather than borrowing the other token.
    expect(res.status).toBe(409);
    expect(githubCalls.filter((c) => c.pathname === '/user/repos')).toHaveLength(0);
  });
});

describe('file triage', () => {
  it('maps supported extensions and rejects the rest', () => {
    expect(languageFor('src/app.js')).toBe('javascript');
    expect(languageFor('main.py')).toBe('python');
    expect(languageFor('README.md')).toBeNull();
    expect(languageFor('package-lock.json')).toBeNull();
  });

  it.each([
    [{ filename: 'a.js', status: 'removed', patch: 'x' }, /deleted/i],
    [{ filename: 'a.js', status: 'modified', patch: '' }, /no diff/i],
    [{ filename: 'a.md', status: 'modified', patch: 'x' }, /not a supported/i],
    [{ filename: 'a.js', status: 'modified', patch: 'x'.repeat(MAX_CODE_LENGTH + 1) }, /character limit/i],
  ])('skips %o', (file, reason) => {
    expect(triageFile(file, 0).skipped).toMatch(reason);
  });

  it('caps how many files are reviewed', () => {
    const file = { filename: 'a.js', status: 'modified', patch: 'diff' };
    expect(triageFile(file, 0).language).toBe('javascript');
    expect(triageFile(file, MAX_FILES_PER_PR).skipped).toMatch(/first 10 files/i);
  });
});

describe('POST /api/v1/github/review', () => {
  const prFiles = [
    { filename: 'src/db.js', status: 'modified', additions: 5, deletions: 1, changes: 6, patch: '+ const q = "SELECT " + id;' },
    { filename: 'src/util.py', status: 'added', additions: 9, deletions: 0, changes: 9, patch: '+ def f(): pass' },
    { filename: 'README.md', status: 'modified', additions: 2, deletions: 0, changes: 2, patch: '+ docs' },
  ];

  it('reviews each supported file and aggregates the result', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);
    gh.files = prFiles;

    const res = await request(app)
      .post('/api/v1/github/review')
      .set(auth(token))
      .send({ owner: 'octocat', repo: 'devlens', pullNumber: 7 });

    expect(res.status).toBe(201);
    expect(res.body.summary.filesReviewed).toBe(2);
    expect(res.body.summary.filesSkipped).toBe(1); // the markdown file
    expect(res.body.summary.totalFindings).toBe(4); // 2 findings x 2 files
    expect(res.body.summary.criticalCount).toBe(2);
    expect(res.body.summary.averageScores.overall).toBe(2);

    // One Gemini call per reviewed file, none for the skipped one.
    expect(geminiCalls).toHaveLength(2);

    const md = res.body.files.find((f) => f.filename === 'README.md');
    expect(md.result).toBeNull();
    expect(md.skipped).toMatch(/not a supported/i);
  });

  it('routes each diff through the hardened review pipeline', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);
    gh.files = [prFiles[0]];

    await request(app)
      .post('/api/v1/github/review')
      .set(auth(token))
      .send({ owner: 'octocat', repo: 'devlens', pullNumber: 7 });

    const prompt = JSON.parse(geminiCalls[0].init.body).contents[0].parts[0].text;

    // The same prompt-injection containment the paste path gets.
    expect(prompt).toMatch(/<user_code boundary="[0-9a-f]{16}">/);
    expect(prompt).toMatch(/UNTRUSTED DATA/);
    // And the same structured-output contract.
    expect(prompt).toContain('"cleanCode"');
    expect(prompt).toContain('sql-injection');
    expect(prompt).toContain(prFiles[0].patch);
  });

  it('records a file whose review fails without failing the whole request', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);
    gh.files = [prFiles[0], prFiles[1]];

    // First file: both attempts invalid, so validation gives up. Second: fine.
    const broken = { ...AI_REVIEW, cleanCode: '' };
    // Two invalid replies exhaust the retry for the first file; then valid.
    geminiQueue = [broken, broken, AI_REVIEW];

    const res = await request(app)
      .post('/api/v1/github/review')
      .set(auth(token))
      .send({ owner: 'octocat', repo: 'devlens', pullNumber: 7 });

    expect(res.status).toBe(201);
    expect(res.body.summary.filesReviewed).toBe(1);
    const failed = res.body.files.find((f) => f.filename === 'src/db.js');
    expect(failed.result).toBeNull();
    expect(failed.skipped).toMatch(/unusable review/i);
  });

  it('validates the request body', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);

    const res = await request(app)
      .post('/api/v1/github/review')
      .set(auth(token))
      .send({ owner: 'octocat', repo: 'devlens', pullNumber: 'not-a-number' });

    expect(res.status).toBe(400);
    expect(githubCalls.filter((c) => c.pathname.endsWith('/files'))).toHaveLength(0);
  });

  it('requires a connected account', async () => {
    const { token } = await authedUser();

    const res = await request(app)
      .post('/api/v1/github/review')
      .set(auth(token))
      .send({ owner: 'o', repo: 'r', pullNumber: 1 });

    expect(res.status).toBe(409);
    expect(geminiCalls).toHaveLength(0);
  });

  it('stores the report against its owner only', async () => {
    const { token, userId } = await authedUser();
    await connectGithub(userId);
    gh.files = [prFiles[0]];

    const res = await request(app)
      .post('/api/v1/github/review')
      .set(auth(token))
      .send({ owner: 'octocat', repo: 'devlens', pullNumber: 7 });

    const stored = await PullRequestReview.findById(res.body._id);
    expect(String(stored.userId)).toBe(userId);
  });
});

describe('POST /api/v1/github/review/:reviewId/comment', () => {
  async function seedReport(token, userId) {
    await connectGithub(userId);
    gh.files = [{ filename: 'src/db.js', status: 'modified', additions: 1, deletions: 0, changes: 1, patch: '+ q' }];
    const res = await request(app)
      .post('/api/v1/github/review')
      .set(auth(token))
      .send({ owner: 'octocat', repo: 'devlens', pullNumber: 7 });
    return res.body._id;
  }

  it('posts the summary only when explicitly asked', async () => {
    const { token, userId } = await authedUser();
    const reviewId = await seedReport(token, userId);

    // Running the review must not have commented on its own.
    expect(commentCalls()).toHaveLength(0);

    const res = await request(app)
      .post(`/api/v1/github/review/${reviewId}/comment`)
      .set(auth(token));

    expect(res.status).toBe(201);
    expect(commentCalls()).toHaveLength(1);
    const body = JSON.parse(commentCalls()[0].body).body;
    expect(body).toContain('DevLens review');
    expect(body).toContain('SQL injection');
  });

  it("will not comment using another user's report", async () => {
    const { token, userId } = await authedUser('owner@example.com');
    const reviewId = await seedReport(token, userId);

    const { token: otherToken, userId: otherId } = await authedUser('other@example.com');
    await connectGithub(otherId);

    const res = await request(app)
      .post(`/api/v1/github/review/${reviewId}/comment`)
      .set(auth(otherToken));

    expect(res.status).toBe(404);
    expect(commentCalls()).toHaveLength(0);
  });
});
