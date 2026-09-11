const mongoose = require('mongoose');

/**
 * A record of submitted code that contained instruction-like text near a
 * comment marker - i.e. a possible prompt-injection attempt.
 *
 * These are observations, not blocks: the submission still goes through to
 * Gemini. The collection exists so we can see how often this is tried.
 *
 * The full code already lives on the Review document, so only a hash and a
 * short snippet are kept here.
 */
const promptFlagSchema = new mongoose.Schema(
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
    // Which suspicious phrases matched, so patterns can be counted over time.
    patterns: {
      type: [String],
      default: [],
    },
    // SHA-256 of the full submission: lets repeat attempts be grouped without
    // storing the code twice.
    codeHash: {
      type: String,
      default: '',
      index: true,
    },
    // Truncated, purely for eyeballing what was attempted.
    snippet: {
      type: String,
      default: '',
    },
    codeLength: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// Registered idempotently: tests reach this file both through the controller's
// require() and through an ESM import, which would otherwise compile the model
// twice against the same mongoose instance.
module.exports = mongoose.models.PromptFlag || mongoose.model('PromptFlag', promptFlagSchema);
