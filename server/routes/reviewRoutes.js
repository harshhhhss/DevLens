const express = require('express');
const {
  createReview,
  getReviewHistory,
  getReviewInsights,
  getReviewById,
  deleteReview,
  updateReviewVisibility,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { reviewLimiter } = require('../middleware/rateLimiters');
const {
  createReviewRules,
  reviewIdRules,
  visibilityRules,
} = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.post('/', reviewLimiter, createReviewRules, createReview);
router.get('/history', getReviewHistory);
router.get('/insights', getReviewInsights);
router.get('/:id', reviewIdRules, getReviewById);
router.patch('/:id/visibility', reviewIdRules, visibilityRules, updateReviewVisibility);
router.delete('/:id', reviewIdRules, deleteReview);

module.exports = router;
