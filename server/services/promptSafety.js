const crypto = require('crypto');

/**
 * Prompt-injection defence for user-submitted code.
 *
 * Two independent layers:
 *   1. Containment - the code is wrapped in a delimiter carrying a random
 *      per-request token, so text inside it cannot close the block and address
 *      the model directly.
 *   2. Observation - a cheap scan flags instruction-like phrases in comments.
 *      This never blocks a submission; it only records that it happened.
 */

const SNIPPET_LENGTH = 300;

/**
 * Phrases that are unremarkable in prose but suspicious inside source code
 * comments, where they are usually aimed at the model rather than a reader.
 */
const INJECTION_PATTERNS = [
  { name: 'ignore-previous', re: /ignore\s+(?:all\s+|any\s+)?(?:previous|prior|above|earlier)/i },
  { name: 'disregard-above', re: /disregard\s+(?:the\s+)?(?:above|previous|prior|earlier)/i },
  { name: 'forget-instructions', re: /forget\s+(?:everything|all|your|the)\b/i },
  { name: 'system-prompt', re: /system\s*(?:prompt|message|instruction)/i },
  { name: 'you-are-now', re: /you\s+are\s+now\b/i },
  { name: 'new-instructions', re: /new\s+instructions?\b/i },
  { name: 'act-as', re: /(?:act|behave)\s+as\s+(?:a|an|if)\b/i },
  { name: 'override-instructions', re: /override\s+(?:the\s+)?(?:previous|above|system|prior)/i },
  { name: 'reveal-prompt', re: /(?:reveal|print|repeat|show)\s+(?:me\s+)?(?:your|the)\s+(?:prompt|instructions|system)/i },
  { name: 'say-code-is-perfect', re: /(?:say|report|respond)\s+(?:that\s+)?(?:the\s+)?code\s+is\s+(?:perfect|clean|flawless|fine)/i },
  { name: 'do-not-report', re: /(?:do\s*n[o']?t|never)\s+(?:report|mention|flag|include)\b/i },
  { name: 'developer-mode', re: /(?:developer|debug|god|jailbreak)\s+mode/i },
];

/**
 * Comment openers across the languages DevLens supports, plus the string
 * delimiters that docstrings use. A line counts as "comment-like" if any of
 * these appear before the suspicious phrase.
 */
const COMMENT_MARKER = /(\/\/|\/\*|\*|#|--|<!--|"""|''')/;

/**
 * Scans code for instruction-like phrases sitting in comments.
 *
 * Deliberately cheap: one pass over the lines with a handful of regexes, so it
 * adds no meaningful latency to a request that is about to spend seconds
 * waiting on Gemini.
 *
 * @param {string} code
 * @returns {{ flagged: boolean, patterns: string[] }}
 */
function scanForInjection(code) {
  if (typeof code !== 'string' || code === '') {
    return { flagged: false, patterns: [] };
  }

  const matched = new Set();

  for (const line of code.split('\n')) {
    const markerMatch = line.match(COMMENT_MARKER);
    if (!markerMatch) continue;

    // Only consider the part of the line after the comment marker, so a
    // variable called `systemPrompt` on a code line is not flagged.
    const commentText = line.slice(markerMatch.index + markerMatch[0].length);
    if (!commentText.trim()) continue;

    for (const { name, re } of INJECTION_PATTERNS) {
      if (re.test(commentText)) matched.add(name);
    }
  }

  return { flagged: matched.size > 0, patterns: [...matched] };
}

/**
 * A random token per request. Because the model is told the exact token that
 * closes the block, code cannot forge a closing delimiter it does not know.
 */
function makeBoundary(code = '') {
  let token;
  do {
    token = crypto.randomBytes(8).toString('hex');
  } while (code.includes(token)); // astronomically unlikely, cheap to rule out

  return token;
}

/** SHA-256 of the submission, for grouping repeat attempts without storing code twice. */
function hashCode(code) {
  return crypto
    .createHash('sha256')
    .update(String(code ?? ''))
    .digest('hex');
}

/** A short, safe excerpt for a flag record. */
function snippetOf(code, length = SNIPPET_LENGTH) {
  const text = String(code ?? '');
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

module.exports = {
  scanForInjection,
  makeBoundary,
  hashCode,
  snippetOf,
  INJECTION_PATTERNS,
  SNIPPET_LENGTH,
};
