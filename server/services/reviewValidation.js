/**
 * Shape validation for Gemini's review response.
 *
 * This runs on the *parsed* reply, before normalisation. normalizeResult()
 * coerces anything it is given - a missing array becomes [], a missing score
 * becomes 0, a missing cleanCode becomes '' - so a malformed reply would
 * otherwise be saved as a plausible-looking but empty review. Validating first
 * is what makes that detectable.
 *
 * The checks mirror what buildPrompt() actually asks Gemini to return.
 */

const RAW_SNIPPET_LENGTH = 500;

const SEVERITIES = ['Low', 'Medium', 'High', 'Critical'];

/** Error thrown when a response still fails validation after the retry. */
class AiValidationError extends Error {
  constructor(message, { failures = [], attempts = 0, rawSnippet = '' } = {}) {
    super(message);
    this.name = 'AiValidationError';
    this.failures = failures;
    this.attempts = attempts;
    this.rawSnippet = rawSnippet;
  }
}

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const isNonEmptyString = (value) => typeof value === 'string' && value.trim() !== '';

function validateScore(scores, field, failures) {
  const value = scores?.[field];

  if (typeof value !== 'number' || !Number.isFinite(value)) {
    failures.push(`scores.${field}: expected a number, got ${describe(value)}`);
    return;
  }
  if (value < 0 || value > 10) {
    failures.push(`scores.${field}: expected 0-10, got ${value}`);
  }
}

function describe(value) {
  if (value === undefined) return 'undefined';
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value;
}

/**
 * Validates one entry of a findings array. Entries must be objects carrying the
 * field that gives them meaning; `fix`/`reason` are treated as optional because
 * a finding without a suggested fix is still useful, whereas one without a
 * description is not.
 */
function validateEntries(list, field, requiredKey, failures) {
  list.forEach((entry, index) => {
    if (!isPlainObject(entry)) {
      failures.push(`${field}[${index}]: expected an object, got ${describe(entry)}`);
      return;
    }
    if (!isNonEmptyString(entry[requiredKey])) {
      failures.push(`${field}[${index}].${requiredKey}: expected a non-empty string`);
    }
    if (
      field === 'security' &&
      entry.severity !== undefined &&
      !SEVERITIES.includes(entry.severity)
    ) {
      failures.push(
        `security[${index}].severity: expected one of ${SEVERITIES.join(', ')}, got ${JSON.stringify(
          entry.severity
        )}`
      );
    }
  });
}

/**
 * @param {unknown} parsed - the JSON.parse'd Gemini reply
 * @returns {{ valid: boolean, failures: string[] }}
 */
function validateReviewResult(parsed) {
  const failures = [];

  if (!isPlainObject(parsed)) {
    return { valid: false, failures: [`response: expected an object, got ${describe(parsed)}`] };
  }

  // summary is requested but not load-bearing, so it is only type-checked when
  // present rather than required.
  if (parsed.summary !== undefined && typeof parsed.summary !== 'string') {
    failures.push(`summary: expected a string, got ${describe(parsed.summary)}`);
  }

  const arrayFields = [
    ['bugs', 'issue'],
    ['security', 'issue'],
    ['performance', 'issue'],
    ['refactor', 'suggestion'],
  ];

  for (const [field, requiredKey] of arrayFields) {
    const value = parsed[field];
    if (!Array.isArray(value)) {
      failures.push(`${field}: expected an array, got ${describe(value)}`);
      continue;
    }
    validateEntries(value, field, requiredKey, failures);
  }

  if (!isPlainObject(parsed.scores)) {
    failures.push(`scores: expected an object, got ${describe(parsed.scores)}`);
  } else {
    validateScore(parsed.scores, 'readability', failures);
    validateScore(parsed.scores, 'security', failures);
    validateScore(parsed.scores, 'overall', failures);
  }

  if (!isNonEmptyString(parsed.cleanCode)) {
    failures.push(
      `cleanCode: expected a non-empty string, got ${describe(parsed.cleanCode)}`
    );
  }

  return { valid: failures.length === 0, failures };
}

/** Truncates a raw Gemini reply to something safe to store for debugging. */
function rawSnippetOf(raw, length = RAW_SNIPPET_LENGTH) {
  const text = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');
  if (!text) return '';
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

module.exports = {
  validateReviewResult,
  AiValidationError,
  rawSnippetOf,
  RAW_SNIPPET_LENGTH,
  SEVERITIES,
};
