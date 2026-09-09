/**
 * Fails fast at startup when configuration is missing.
 *
 * Without this, a missing MONGO_URI surfaces as an opaque driver error and a
 * missing GEMINI_API_KEY only breaks once a user submits their first review -
 * long after the deploy looked successful.
 */

const REQUIRED_VARS = [
  { name: 'MONGO_URI', hint: 'MongoDB connection string, e.g. mongodb+srv://user:pass@cluster/devlens' },
  { name: 'JWT_SECRET', hint: 'long random string used to sign auth tokens' },
  { name: 'GEMINI_API_KEY', hint: 'Google Gemini API key from https://aistudio.google.com/app/apikey' },
  { name: 'PORT', hint: 'port the API listens on, e.g. 5055' },
  { name: 'CLIENT_URL', hint: 'allowed frontend origin(s), comma-separated' },
];

/**
 * @param {NodeJS.ProcessEnv} env
 * @returns {{ valid: boolean, missing: string[], message: string }}
 */
function checkEnv(env = process.env) {
  const missing = REQUIRED_VARS.filter(({ name }) => {
    const value = env[name];
    return value === undefined || String(value).trim() === '';
  });

  if (missing.length === 0) {
    return { valid: true, missing: [], message: '' };
  }

  const lines = [
    `Missing required environment variable${missing.length > 1 ? 's' : ''}: ${missing
      .map((v) => v.name)
      .join(', ')}`,
    '',
    ...missing.map(({ name, hint }) => `  ${name} - ${hint}`),
    '',
    'Copy server/.env.example to server/.env and fill in the values above.',
  ];

  return { valid: false, missing: missing.map((v) => v.name), message: lines.join('\n') };
}

/**
 * Validates and, when something is missing, prints the reason and exits.
 * Kept separate from checkEnv so tests can assert on the result without
 * killing the test process.
 */
function validateEnv(env = process.env) {
  const result = checkEnv(env);

  if (!result.valid) {
    console.error('\nDevLens cannot start.\n');
    console.error(result.message);
    console.error('');
    process.exit(1);
  }

  return result;
}

module.exports = { validateEnv, checkEnv, REQUIRED_VARS };
