const express = require('express');
const {
  createReview,
  getReviewHistory,
  getReviewById,
  deleteReview,
} = require('../controllers/reviewController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect);

router.post('/', createReview);
router.get('/history', getReviewHistory);
router.get('/:id', getReviewById);
router.delete('/:id', deleteReview);

module.exports = router;
