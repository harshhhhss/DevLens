/**
 * Fixed taxonomy for review findings.
 *
 * Every finding Gemini returns carries exactly one of these. A closed list is
 * what makes the weakness tracker possible: free-text labels would never
 * aggregate, because the same problem would come back worded differently on
 * every review.
 *
 * Shared by the prompt, the validator, the Review schema and the insights
 * aggregation, so the four can never drift apart.
 */

const FINDING_CATEGORIES = [
  // Correctness
  { id: 'null-safety', label: 'Null and undefined safety' },
  { id: 'off-by-one', label: 'Off-by-one and boundary errors' },
  { id: 'type-coercion', label: 'Type confusion and coercion' },
  { id: 'error-handling', label: 'Error and exception handling' },
  { id: 'concurrency', label: 'Concurrency and race conditions' },
  { id: 'logic-error', label: 'Incorrect logic' },

  // Security
  { id: 'sql-injection', label: 'SQL and query injection' },
  { id: 'xss', label: 'Cross-site scripting' },
  { id: 'command-injection', label: 'Command and code injection' },
  { id: 'auth', label: 'Authentication and authorisation' },
  { id: 'secrets', label: 'Hardcoded secrets' },
  { id: 'input-validation', label: 'Missing input validation' },
  { id: 'crypto', label: 'Weak cryptography and randomness' },
  { id: 'data-exposure', label: 'Sensitive data exposure' },

  // Performance
  { id: 'algorithmic-complexity', label: 'Algorithmic complexity' },
  { id: 'resource-leak', label: 'Unreleased resources' },
  { id: 'blocking-io', label: 'Blocking or synchronous I/O' },
  { id: 'n-plus-one', label: 'Repeated queries in a loop' },
  { id: 'memory', label: 'Memory use' },

  // Maintainability
  { id: 'naming', label: 'Naming' },
  { id: 'complexity', label: 'Function size and complexity' },
  { id: 'duplication', label: 'Duplicated code' },
  { id: 'dead-code', label: 'Dead or unreachable code' },
  { id: 'style', label: 'Style and consistency' },
  { id: 'testing', label: 'Testability and test coverage' },
  { id: 'documentation', label: 'Missing documentation' },

  // Fallback - the model is told to use this only when nothing else fits.
  { id: 'other', label: 'Other' },
];

const CATEGORY_IDS = FINDING_CATEGORIES.map((c) => c.id);

const CATEGORY_LABELS = Object.fromEntries(FINDING_CATEGORIES.map((c) => [c.id, c.label]));

const DEFAULT_CATEGORY = 'other';

const isCategory = (value) => typeof value === 'string' && CATEGORY_IDS.includes(value);

/** Human label for a stored id, falling back to the id itself. */
const categoryLabel = (id) => CATEGORY_LABELS[id] || id;

module.exports = {
  FINDING_CATEGORIES,
  CATEGORY_IDS,
  CATEGORY_LABELS,
  DEFAULT_CATEGORY,
  isCategory,
  categoryLabel,
};
