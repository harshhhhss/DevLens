/**
 * Turns a picked/dropped file into the { code, language } payload the review
 * API already accepts.
 *
 * Files are read in the browser rather than uploaded: the endpoint takes source
 * text, so there is nothing for the server to store and no multipart handling
 * to add.
 */

// Only extensions that map to a language the API supports.
export const EXTENSION_LANGUAGE_MAP = {
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  java: 'java',
  c: 'cpp',
  h: 'cpp',
  cc: 'cpp',
  cpp: 'cpp',
  cxx: 'cpp',
  hpp: 'cpp',
  go: 'go',
  rs: 'rust',
  php: 'php',
  rb: 'ruby',
};

/** Hard ceiling before reading, so a huge file is rejected without loading it. */
export const MAX_FILE_BYTES = 1024 * 1024; // 1 MB

/** Mirrors the server's own limit on submitted code. */
export const MAX_CODE_CHARS = 20000;

/** The `accept` attribute for the file input. */
export const ACCEPTED_EXTENSIONS = Object.keys(EXTENSION_LANGUAGE_MAP)
  .map((ext) => `.${ext}`)
  .join(',');

export function extensionOf(filename = '') {
  const name = String(filename);
  const dot = name.lastIndexOf('.');
  if (dot === -1 || dot === name.length - 1) return '';
  return name.slice(dot + 1).toLowerCase();
}

/** @returns the supported language for a filename, or null if unrecognised. */
export function languageFromFilename(filename) {
  return EXTENSION_LANGUAGE_MAP[extensionOf(filename)] || null;
}

export function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes < 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Checks a file before reading it.
 * @returns {{ valid: boolean, error: string }}
 */
export function validateFile(file) {
  if (!file) return { valid: false, error: 'No file selected.' };

  if (file.size === 0) {
    return { valid: false, error: `${file.name} is empty.` };
  }

  if (file.size > MAX_FILE_BYTES) {
    return {
      valid: false,
      error: `${file.name} is ${formatBytes(file.size)}. The limit is ${formatBytes(
        MAX_FILE_BYTES
      )}.`,
    };
  }

  return { valid: true, error: '' };
}

/** Source files are text; a NUL byte means we were handed a binary. */
export function looksBinary(text) {
  return typeof text === 'string' && text.includes('\u0000');
}

/**
 * Reads a code file and reports what to do with it.
 *
 * @returns {Promise<{ code: string, language: string|null, warning: string }>}
 * @throws {Error} with a user-facing message when the file cannot be used
 */
export async function readCodeFile(file) {
  const { valid, error } = validateFile(file);
  if (!valid) throw new Error(error);

  const text = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsText(file);
  });

  if (looksBinary(text)) {
    throw new Error(`${file.name} does not look like a text file.`);
  }

  if (!text.trim()) {
    throw new Error(`${file.name} is empty.`);
  }

  if (text.length > MAX_CODE_CHARS) {
    throw new Error(
      `${file.name} is ${text.length.toLocaleString()} characters. The limit is ${MAX_CODE_CHARS.toLocaleString()}.`
    );
  }

  const language = languageFromFilename(file.name);

  return {
    code: text,
    language,
    warning: language
      ? ''
      : `Could not tell the language from "${file.name}" - pick one before reviewing.`,
  };
}
