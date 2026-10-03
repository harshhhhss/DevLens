const express = require('express');
const {
  getStatus,
  connect,
  callback,
  disconnect,
  listRepos,
  listPulls,
  reviewPullRequest,
  commentOnPullRequest,
} = require('../controllers/githubController');
const { protect } = require('../middleware/authMiddleware');
const { reviewLimiter } = require('../middleware/rateLimiters');
const { pullRequestReviewRules } = require('../middleware/validators');

const router = express.Router();

/**
 * The OAuth callback is the one route here without `protect`: GitHub redirects
 * the browser to it, so there is no Authorization header to present. It is
 * authenticated instead by the HMAC-signed `state` it must carry back.
 */
router.get('/callback', callback);

router.use(protect);

router.get('/status', getStatus);
router.get('/connect', connect);
router.delete('/disconnect', disconnect);
router.get('/repos', listRepos);
router.get('/repos/:owner/:repo/pulls', listPulls);

// Reuses the review limiter: a pull request costs several Gemini calls.
router.post('/review', reviewLimiter, pullRequestReviewRules, reviewPullRequest);
router.post('/review/:reviewId/comment', commentOnPullRequest);

module.exports = router;
