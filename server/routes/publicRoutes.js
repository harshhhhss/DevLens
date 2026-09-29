const express = require('express');
const { getPublicReview } = require('../controllers/reviewController');
const { publicReviewLimiter } = require('../middleware/rateLimiters');
const { reviewIdRules } = require('../middleware/validators');

/**
 * Unauthenticated reads of reviews their owner has explicitly made public.
 *
 * Mounted separately from reviewRoutes because that router applies `protect`
 * to everything it serves - this is the one read in the API that must work
 * without a token.
 */
const router = express.Router();

router.get('/review/:id', publicReviewLimiter, reviewIdRules, getPublicReview);

module.exports = router;
