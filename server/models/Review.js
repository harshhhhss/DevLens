const mongoose = require('mongoose');

const bugSchema = new mongoose.Schema(
  {
    line: { type: mongoose.Schema.Types.Mixed, default: null },
    issue: { type: String, default: '' },
    fix: { type: String, default: '' },
  },
  { _id: false }
);

const securityIssueSchema = new mongoose.Schema(
  {
    line: { type: mongoose.Schema.Types.Mixed, default: null },
    severity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Low',
    },
    issue: { type: String, default: '' },
    fix: { type: String, default: '' },
  },
  { _id: false }
);

const performanceIssueSchema = new mongoose.Schema(
  {
    line: { type: mongoose.Schema.Types.Mixed, default: null },
    issue: { type: String, default: '' },
    fix: { type: String, default: '' },
  },
  { _id: false }
);

const refactorSuggestionSchema = new mongoose.Schema(
  {
    suggestion: { type: String, default: '' },
    reason: { type: String, default: '' },
  },
  { _id: false }
);

const scoresSchema = new mongoose.Schema(
  {
    readability: { type: Number, min: 0, max: 10, default: 0 },
    security: { type: Number, min: 0, max: 10, default: 0 },
    overall: { type: Number, min: 0, max: 10, default: 0 },
  },
  { _id: false }
);

const reviewResultSchema = new mongoose.Schema(
  {
    summary: { type: String, default: '' },
    bugs: { type: [bugSchema], default: [] },
    security: { type: [securityIssueSchema], default: [] },
    performance: { type: [performanceIssueSchema], default: [] },
    refactor: { type: [refactorSuggestionSchema], default: [] },
    scores: { type: scoresSchema, default: () => ({}) },
    cleanCode: { type: String, default: '' },
  },
  { _id: false }
);

const reviewSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    code: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      required: true,
      enum: [
        'javascript',
        'python',
        'java',
        'cpp',
        'typescript',
        'go',
        'rust',
        'php',
        'ruby',
      ],
    },
    result: {
      type: reviewResultSchema,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
