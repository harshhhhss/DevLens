const mongoose = require('mongoose');

/**
 * Recorded when Gemini's response fails shape validation, including after the
 * single retry. Only failures are stored - successful reviews are the Review
 * documents themselves.
 *
 * The submitted code is deliberately not duplicated here: when a review is
 * saved it already lives on the Review document, and when it is not, the
 * snippet of Gemini's reply is what is actually needed to debug the failure.
 */
const reviewValidationFailureSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    language: {
      type: String,
      default: '',
    },
    // Human-readable reasons, e.g. "scores.readability: expected a number 0-10".
    failures: {
      type: [String],
      default: [],
    },
    // How many Gemini calls were made before giving up (1 = first attempt, 2 =
    // the retry also failed).
    attempts: {
      type: Number,
      default: 0,
    },
    // Truncated copy of what Gemini actually returned, for debugging.
    rawSnippet: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// Registered idempotently: tests reach this file both through the controller's
// require() and through an ESM import, which would otherwise compile the model
// twice against the same mongoose instance.
module.exports =
  mongoose.models.ReviewValidationFailure ||
  mongoose.model('ReviewValidationFailure', reviewValidationFailureSchema);
