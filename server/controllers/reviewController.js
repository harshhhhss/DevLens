const Review = require('../models/Review');
const { reviewCode } = require('../services/aiService');

const SUPPORTED_LANGUAGES = [
  'javascript',
  'python',
  'java',
  'cpp',
  'typescript',
  'go',
  'rust',
  'php',
  'ruby',
];

// @route POST /api/v1/review
const createReview = async (req, res, next) => {
  try {
    const { code, language } = req.body;

    if (!code || typeof code !== 'string' || !code.trim()) {
      return res.status(400).json({ message: 'Code is required' });
    }

    if (!language || !SUPPORTED_LANGUAGES.includes(String(language).toLowerCase())) {
      return res.status(400).json({
        message: `Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`,
      });
    }

    if (code.length > 20000) {
      return res.status(400).json({ message: 'Code is too long (max 20000 characters)' });
    }

    const normalizedLanguage = String(language).toLowerCase();
    const result = await reviewCode(code, normalizedLanguage);

    const review = await Review.create({
      userId: req.user._id,
      code,
      language: normalizedLanguage,
      result,
    });

    return res.status(201).json(review);
  } catch (error) {
    next(error);
  }
};

// @route GET /api/v1/review/history
const getReviewHistory = async (req, res, next) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 50);
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ userId: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-code')
        .lean(),
      Review.countDocuments({ userId: req.user._id }),
    ]);

    return res.status(200).json({
      reviews,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      total,
    });
  } catch (error) {
    next(error);
  }
};

// @route GET /api/v1/review/:id
const getReviewById = async (req, res, next) => {
  try {
    const review = await Review.findOne({ _id: req.params.id, userId: req.user._id });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json(review);
  } catch (error) {
    next(error);
  }
};

// @route DELETE /api/v1/review/:id
const deleteReview = async (req, res, next) => {
  try {
    const review = await Review.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    return res.status(200).json({ message: 'Review deleted' });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReview, getReviewHistory, getReviewById, deleteReview };
