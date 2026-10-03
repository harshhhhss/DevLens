const mongoose = require('mongoose');

/**
 * One review of one GitHub pull request.
 *
 * Separate from Review because a Review is a single snippet with one language
 * and one result, whereas a pull request is many files reviewed together. The
 * per-file results reuse the same shape, so the frontend can render them with
 * the existing components.
 */
const fileReviewSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true },
    language: { type: String, default: '' },
    status: { type: String, default: '' },
    additions: { type: Number, default: 0 },
    deletions: { type: Number, default: 0 },
    // Mixed, because this is the same normalised result object Review stores.
    result: { type: mongoose.Schema.Types.Mixed, default: null },
    // Set when a file was not reviewed, with the reason.
    skipped: { type: String, default: '' },
  },
  { _id: false }
);

const pullRequestReviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    owner: { type: String, required: true },
    repo: { type: String, required: true },
    pullNumber: { type: Number, required: true },
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    files: { type: [fileReviewSchema], default: [] },
    summary: {
      filesReviewed: { type: Number, default: 0 },
      filesSkipped: { type: Number, default: 0 },
      totalFindings: { type: Number, default: 0 },
      criticalCount: { type: Number, default: 0 },
      averageScores: {
        readability: { type: Number, default: 0 },
        security: { type: Number, default: 0 },
        overall: { type: Number, default: 0 },
      },
    },
    // Set once the user explicitly posts the summary back to the PR.
    commentedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PullRequestReview ||
  mongoose.model('PullRequestReview', pullRequestReviewSchema);
