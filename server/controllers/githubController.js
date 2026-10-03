const crypto = require('crypto');
const User = require('../models/User');
const PullRequestReview = require('../models/PullRequestReview');
const github = require('../services/githubService');
const { encryptToken, decryptToken } = require('../services/tokenCrypto');
const { reviewCode } = require('../services/aiService');
const { AiValidationError } = require('../services/reviewValidation');
const { MAX_CODE_LENGTH, SUPPORTED_LANGUAGES } = require('../middleware/validators');

/**
 * Extension to language, limited to the languages the review pipeline already
 * supports. Anything else (markdown, lockfiles, images) is skipped rather than
 * guessed at.
 */
const EXTENSION_LANGUAGE = {
  js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
  ts: 'typescript', tsx: 'typescript',
  py: 'python', java: 'java',
  c: 'cpp', h: 'cpp', cc: 'cpp', cpp: 'cpp', cxx: 'cpp', hpp: 'cpp',
  go: 'go', rs: 'rust', php: 'php', rb: 'ruby',
};

/**
 * A pull request can touch hundreds of files and each reviewed file costs a
 * Gemini call, so the number reviewed is capped. The per-file size cap is the
 * same MAX_CODE_LENGTH the paste and upload paths already enforce.
 */
const MAX_FILES_PER_PR = 10;

const languageFor = (filename) => {
  const ext = String(filename).split('.').pop()?.toLowerCase();
  const language = EXTENSION_LANGUAGE[ext];
  return SUPPORTED_LANGUAGES.includes(language) ? language : null;
};

/** Loads the caller's decrypted GitHub token, or null when not connected. */
async function tokenFor(userId) {
  const user = await User.findById(userId).select('+githubToken');
  if (!user?.githubToken) return null;
  try {
    return decryptToken(user.githubToken);
  } catch (error) {
    console.error(`DevLens: could not decrypt GitHub token: ${error.message}`);
    return null;
  }
}

const notConnected = (res) =>
  res.status(409).json({ message: 'Connect your GitHub account first' });

// @route GET /api/v1/github/status
const getStatus = async (req, res, next) => {
  try {
    return res.status(200).json({
      connected: Boolean(req.user.githubConnected),
      login: req.user.githubLogin || null,
      scope: process.env.GITHUB_SCOPE || github.DEFAULT_SCOPE,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/v1/github/connect
const connect = async (req, res, next) => {
  try {
    // The state carries the user id, signed with JWT_SECRET, so the callback
    // can tell which account authorised without a session cookie, and a forged
    // state cannot attach someone else's token to an account.
    const state = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(String(req.user._id))
      .digest('hex');

    const url = github.buildAuthorizeUrl(`${req.user._id}.${state}`);

    // Returned as JSON rather than a redirect so the SPA controls navigation
    // and the Authorization header is never required on a browser redirect.
    return res.status(200).json({ url });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @route GET /api/v1/github/callback  (GitHub redirects the browser here)
const callback = async (req, res, next) => {
  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.status(400).json({ message: 'Missing code or state' });
    }

    const [userId, signature] = String(state).split('.');
    const expected = crypto
      .createHmac('sha256', process.env.JWT_SECRET)
      .update(String(userId))
      .digest('hex');

    // timingSafeEqual needs equal lengths, so compare digests of fixed size.
    const ok =
      signature &&
      signature.length === expected.length &&
      crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));

    if (!ok) {
      return res.status(400).json({ message: 'Invalid state' });
    }

    const accessToken = await github.exchangeCodeForToken(code);
    const login = await github.getLogin(accessToken).catch(() => null);

    await User.findByIdAndUpdate(userId, {
      githubToken: encryptToken(accessToken),
      githubConnected: true,
      githubLogin: login,
    });

    // Hand the browser back to the app rather than rendering JSON at the
    // end of an OAuth redirect.
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    return res.redirect(`${clientUrl}/github?connected=1`);
  } catch (error) {
    const clientUrl = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();
    return res.redirect(`${clientUrl}/github?error=${encodeURIComponent(error.message)}`);
  }
};

// @route DELETE /api/v1/github/disconnect
const disconnect = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, {
      githubToken: null,
      githubConnected: false,
      githubLogin: null,
    });
    return res.status(200).json({ message: 'GitHub disconnected' });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/v1/github/repos
const listRepos = async (req, res, next) => {
  try {
    const token = await tokenFor(req.user._id);
    if (!token) return notConnected(res);

    return res.status(200).json({ repos: await github.listRepos(token) });
  } catch (error) {
    return res.status(502).json({ message: `GitHub request failed: ${error.message}` });
  }
};

// @route GET /api/v1/github/repos/:owner/:repo/pulls
const listPulls = async (req, res, next) => {
  try {
    const token = await tokenFor(req.user._id);
    if (!token) return notConnected(res);

    const { owner, repo } = req.params;
    return res.status(200).json({ pulls: await github.listPullRequests(token, owner, repo) });
  } catch (error) {
    return res.status(502).json({ message: `GitHub request failed: ${error.message}` });
  }
};

/**
 * Decides what to do with one changed file before any Gemini call is made.
 * @returns {{ language: string }|{ skipped: string }}
 */
function triageFile(file, reviewedSoFar) {
  if (file.status === 'removed') return { skipped: 'File was deleted in this pull request' };
  if (!file.patch) return { skipped: 'No diff available (binary or too large on GitHub)' };

  const language = languageFor(file.filename);
  if (!language) return { skipped: 'Not a supported source language' };

  if (file.patch.length > MAX_CODE_LENGTH) {
    return { skipped: `Diff is larger than the ${MAX_CODE_LENGTH} character limit` };
  }
  if (reviewedSoFar >= MAX_FILES_PER_PR) {
    return { skipped: `Only the first ${MAX_FILES_PER_PR} files are reviewed` };
  }

  return { language };
}

// @route POST /api/v1/github/review
const reviewPullRequest = async (req, res, next) => {
  try {
    const token = await tokenFor(req.user._id);
    if (!token) return notConnected(res);

    const { owner, repo, pullNumber } = req.body;

    let files;
    try {
      files = await github.listPullRequestFiles(token, owner, repo, Number(pullNumber));
    } catch (error) {
      return res.status(502).json({ message: `GitHub request failed: ${error.message}` });
    }

    const reviewed = [];
    let reviewedCount = 0;

    // Sequential on purpose: each file is a Gemini call, and firing a whole
    // pull request at once is the fastest way to exhaust the quota.
    for (const file of files) {
      const triage = triageFile(file, reviewedCount);

      if (triage.skipped) {
        reviewed.push({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          language: '',
          result: null,
          skipped: triage.skipped,
        });
        continue;
      }

      try {
        // The same entry point the paste and upload paths use, so the diff gets
        // the boundary delimiters, the output validation and the single retry.
        const result = await reviewCode(file.patch, triage.language);
        reviewedCount += 1;
        reviewed.push({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          language: triage.language,
          result,
          skipped: '',
        });
      } catch (error) {
        const reason =
          error instanceof AiValidationError
            ? 'The AI returned an unusable review for this file'
            : `Review failed: ${error.message}`;
        reviewed.push({
          filename: file.filename,
          status: file.status,
          additions: file.additions,
          deletions: file.deletions,
          language: triage.language,
          result: null,
          skipped: reason,
        });
      }
    }

    const withResults = reviewed.filter((f) => f.result);
    const countFindings = (r) =>
      (r.bugs?.length || 0) +
      (r.security?.length || 0) +
      (r.performance?.length || 0) +
      (r.refactor?.length || 0);

    const average = (field) =>
      withResults.length
        ? Math.round(
            (withResults.reduce((sum, f) => sum + (f.result.scores?.[field] || 0), 0) /
              withResults.length) *
              10
          ) / 10
        : 0;

    const summary = {
      filesReviewed: withResults.length,
      filesSkipped: reviewed.length - withResults.length,
      totalFindings: withResults.reduce((sum, f) => sum + countFindings(f.result), 0),
      criticalCount: withResults.reduce(
        (sum, f) => sum + (f.result.security || []).filter((s) => s.severity === 'Critical').length,
        0
      ),
      averageScores: {
        readability: average('readability'),
        security: average('security'),
        overall: average('overall'),
      },
    };

    const saved = await PullRequestReview.create({
      userId: req.user._id,
      owner,
      repo,
      pullNumber: Number(pullNumber),
      files: reviewed,
      summary,
    });

    return res.status(201).json(saved);
  } catch (error) {
    next(error);
  }
};

/** Markdown body posted back to the pull request. */
function buildCommentBody(prReview) {
  const { summary } = prReview;
  const lines = [
    '## DevLens review',
    '',
    `**${summary.filesReviewed}** file(s) reviewed, **${summary.totalFindings}** finding(s)` +
      (summary.criticalCount ? `, **${summary.criticalCount}** critical` : '') +
      '.',
    '',
    `Scores: readability ${summary.averageScores.readability}/10 · security ${summary.averageScores.security}/10 · overall ${summary.averageScores.overall}/10`,
    '',
  ];

  for (const file of prReview.files.filter((f) => f.result)) {
    const r = file.result;
    const findings = [
      ...(r.security || []).map((s) => `  - **${s.severity} security:** ${s.issue}`),
      ...(r.bugs || []).map((b) => `  - **Bug:** ${b.issue}`),
      ...(r.performance || []).map((p) => `  - **Performance:** ${p.issue}`),
    ];
    if (!findings.length) continue;
    lines.push(`### \`${file.filename}\``, ...findings, '');
  }

  return lines.join('\n');
}

// @route POST /api/v1/github/review/:reviewId/comment
const commentOnPullRequest = async (req, res, next) => {
  try {
    const token = await tokenFor(req.user._id);
    if (!token) return notConnected(res);

    // Scoped by userId like every other owned resource.
    const prReview = await PullRequestReview.findOne({
      _id: req.params.reviewId,
      userId: req.user._id,
    });

    if (!prReview) return res.status(404).json({ message: 'Review not found' });

    const comment = await github.postPullRequestComment(
      token,
      prReview.owner,
      prReview.repo,
      prReview.pullNumber,
      buildCommentBody(prReview)
    );

    prReview.commentedAt = new Date();
    await prReview.save();

    return res.status(201).json({ url: comment.url, commentedAt: prReview.commentedAt });
  } catch (error) {
    return res.status(502).json({ message: `GitHub request failed: ${error.message}` });
  }
};

module.exports = {
  getStatus,
  connect,
  callback,
  disconnect,
  listRepos,
  listPulls,
  reviewPullRequest,
  commentOnPullRequest,
  buildCommentBody,
  triageFile,
  languageFor,
  MAX_FILES_PER_PR,
};
