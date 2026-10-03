const crypto = require('crypto');

/**
 * Symmetric encryption for third-party access tokens at rest.
 *
 * A GitHub token is a bearer credential for someone's repositories: a database
 * dump must not be enough to use it. AES-256-GCM is used rather than CBC so the
 * ciphertext is authenticated, and a database row cannot be tampered with to
 * change what decrypts out.
 *
 * Built on Node's crypto module; no dependency is needed for this.
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit nonce, the size GCM is specified for
const KEY_LENGTH = 32;

/**
 * Derives the 32-byte key from TOKEN_ENCRYPTION_KEY.
 *
 * Read lazily rather than at import time so the server can boot and report a
 * clear startup error instead of throwing while modules load.
 */
function getKey() {
  const secret = process.env.TOKEN_ENCRYPTION_KEY;
  if (!secret) {
    throw new Error('TOKEN_ENCRYPTION_KEY is not set, so GitHub tokens cannot be stored safely');
  }
  // Accept either 64 hex characters (a raw 32-byte key) or any passphrase,
  // which is hashed to the right length.
  if (/^[0-9a-f]{64}$/i.test(secret)) return Buffer.from(secret, 'hex');
  return crypto.createHash('sha256').update(secret).digest();
}

/**
 * @param {string} plaintext
 * @returns {string} "iv:authTag:ciphertext", all base64
 */
function encryptToken(plaintext) {
  if (typeof plaintext !== 'string' || plaintext === '') {
    throw new Error('Cannot encrypt an empty token');
  }

  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return [iv.toString('base64'), authTag.toString('base64'), ciphertext.toString('base64')].join(
    ':'
  );
}

/**
 * @param {string} payload the value produced by encryptToken
 * @returns {string} the original token
 * @throws if the payload was tampered with or the key is wrong
 */
function decryptToken(payload) {
  if (typeof payload !== 'string' || !payload.includes(':')) {
    throw new Error('Stored token is not in the expected format');
  }

  const [ivB64, tagB64, dataB64] = payload.split(':');
  if (!ivB64 || !tagB64 || !dataB64) {
    throw new Error('Stored token is not in the expected format');
  }

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));

  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

module.exports = { encryptToken, decryptToken, KEY_LENGTH };
