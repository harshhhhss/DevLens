const { body, param, validationResult } = require('express-validator');

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

const MAX_CODE_LENGTH = 20000;

/**
 * Collapses validator output into the same `{ message }` body the controllers
 * already return, so adding validation does not change the shape the frontend
 * reads (err.response.data.message).
 *
 * Messages below deliberately mirror the controllers' existing strings; the
 * controllers keep their own checks as a second line of defence.
 */
const handleValidation =
  (status = 400) =>
  (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) return next();

    return res.status(status).json({ message: errors.array()[0].msg });
  };

const REGISTER_REQUIRED = 'Name, email and password are required';

const registerRules = [
  body('name').trim().notEmpty().withMessage(REGISTER_REQUIRED),
  body('email')
    .trim()
    .notEmpty()
    .withMessage(REGISTER_REQUIRED)
    .bail()
    // No normalizeEmail(): it strips dots/plus-tags on Gmail addresses, which
    // would silently change the identity users already registered under.
    .isEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage(REGISTER_REQUIRED)
    .bail()
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
  handleValidation(),
];

const LOGIN_REQUIRED = 'Email and password are required';

const loginRules = [
  body('email').trim().notEmpty().withMessage(LOGIN_REQUIRED),
  body('password').notEmpty().withMessage(LOGIN_REQUIRED),
  handleValidation(),
];

const createReviewRules = [
  body('code')
    .exists({ checkFalsy: true })
    .withMessage('Code is required')
    .bail()
    .isString()
    .withMessage('Code is required')
    .bail()
    .custom((value) => value.trim().length > 0)
    .withMessage('Code is required')
    .bail()
    .isLength({ max: MAX_CODE_LENGTH })
    .withMessage(`Code is too long (max ${MAX_CODE_LENGTH} characters)`),
  body('language')
    .exists({ checkFalsy: true })
    .withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`)
    .bail()
    .custom((value) => SUPPORTED_LANGUAGES.includes(String(value).toLowerCase()))
    .withMessage(`Language must be one of: ${SUPPORTED_LANGUAGES.join(', ')}`),
  handleValidation(),
];

/**
 * A malformed id can never match a document. Answering 404 with the
 * controllers' own "Review not found" keeps the response identical to the
 * miss case, instead of letting a Mongoose CastError surface as a 500.
 */
const reviewIdRules = [
  param('id').isMongoId().withMessage('Review not found'),
  handleValidation(404),
];

module.exports = {
  registerRules,
  loginRules,
  createReviewRules,
  reviewIdRules,
  handleValidation,
  SUPPORTED_LANGUAGES,
  MAX_CODE_LENGTH,
};
