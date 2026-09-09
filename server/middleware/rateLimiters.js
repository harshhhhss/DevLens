const rateLimit = require('express-rate-limit');

// Limits are skipped under test so repeated requests within a suite cannot trip
// a 429 and make assertions order-dependent.
const isTest = () => process.env.NODE_ENV === 'test';

function makeLimiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: true,
    legacyHeaders: false,
    skip: isTest,
    // Keep the error body in the same { message } shape as the rest of the API.
    handler: (req, res) => res.status(429).json({ message }),
  });
}

/**
 * Sign-in and sign-up: tight, because these are the endpoints worth
 * brute-forcing. Successful requests are not counted, so a legitimate user is
 * never locked out by their own valid logins.
 */
const authLimiter = makeLimiter({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  message: 'Too many authentication attempts. Please try again in 15 minutes.',
});

/**
 * Review submission: every call costs a Gemini request, so this protects the
 * API quota as much as the server itself.
 */
const reviewLimiter = makeLimiter({
  windowMs: 60 * 60 * 1000,
  limit: 30,
  message: 'Review limit reached. Please try again later.',
});

module.exports = { authLimiter, reviewLimiter };
