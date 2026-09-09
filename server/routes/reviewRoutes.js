const express = require('express');
const {
  createReview,
  getReviewHistory,
  getReviewById,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');
const { reviewLimiter } = require('../middleware/rateLimiters');
const { createReviewRules, reviewIdRules } = require('../middleware/validators');

const router = express.Router();

router.use(protect);

router.post('/', reviewLimiter, createReviewRules, createReview);
router.get('/history', getReviewHistory);
router.get('/:id', reviewIdRules, getReviewById);
router.delete('/:id', reviewIdRules, deleteReview);

module.exports = router;
