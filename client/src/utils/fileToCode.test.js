import { describe, it, expect } from 'vitest';
import {
  languageFromFilename,
  extensionOf,
  validateFile,
  looksBinary,
  readCodeFile,
  formatBytes,
  MAX_FILE_BYTES,
  MAX_CODE_CHARS,
  ACCEPTED_EXTENSIONS,
} from './fileToCode.js';

const file = (name, content, type = 'text/plain') => new File([content], name, { type });

describe('extensionOf', () => {
  it.each([
    ['app.js', 'js'],
    ['App.JSX', 'jsx'],
    ['server.test.js', 'js'],
    ['archive.tar.gz', 'gz'],
    ['Makefile', ''],
    ['trailing.', ''],
  ])('reads %s as "%s"', (name, expected) => {
    expect(extensionOf(name)).toBe(expected);
  });
});

describe('languageFromFilename', () => {
  it.each([
    ['index.js', 'javascript'],
    ['Component.jsx', 'javascript'],
    ['esm.mjs', 'javascript'],
    ['types.ts', 'typescript'],
    ['App.tsx', 'typescript'],
    ['main.py', 'python'],
    ['Main.java', 'java'],
    ['engine.cpp', 'cpp'],
    ['header.hpp', 'cpp'],
    ['main.go', 'go'],
    ['lib.rs', 'rust'],
    ['index.php', 'php'],
    ['app.rb', 'ruby'],
  ])('maps %s to %s', (name, language) => {
    expect(languageFromFilename(name)).toBe(language);
  });

  it('returns null for an unsupported extension', () => {
    expect(languageFromFilename('notes.txt')).toBeNull();
    expect(languageFromFilename('data.csv')).toBeNull();
    expect(languageFromFilename('Dockerfile')).toBeNull();
  });

  it('ignores case', () => {
    expect(languageFromFilename('MAIN.PY')).toBe('python');
  });

  it('only advertises extensions it can actually map', () => {
    for (const ext of ACCEPTED_EXTENSIONS.split(',')) {
      expect(languageFromFilename(`file${ext}`)).not.toBeNull();
    }
  });
});

describe('validateFile', () => {
  it('accepts an ordinary source file', () => {
    expect(validateFile(file('a.js', 'const a = 1;'))).toEqual({ valid: true, error: '' });
  });

  it('rejects nothing being selected', () => {
    expect(validateFile(null).valid).toBe(false);
  });

  it('rejects an empty file by name', () => {
    const result = validateFile(file('empty.js', ''));
    expect(result.valid).toBe(false);
    expect(result.error).toContain('empty.js');
  });

  it('rejects a file over the size limit and says the limit', () => {
    const big = file('big.js', 'x'.repeat(MAX_FILE_BYTES + 10));
    const result = validateFile(big);

    expect(result.valid).toBe(false);
    expect(result.error).toContain('big.js');
    expect(result.error).toContain('1.0 MB');
  });
});

describe('looksBinary', () => {
  it('flags content containing a NUL byte', () => {
    expect(looksBinary(`PK${String.fromCharCode(0)}`)).toBe(true);
  });

  it('does not flag ordinary source, including spaces and unicode', () => {
    expect(looksBinary('const a = 1; // café ☕')).toBe(false);
  });
});

describe('formatBytes', () => {
  it.each([
    [512, '512 B'],
    [2048, '2 KB'],
    [1024 * 1024, '1.0 MB'],
  ])('formats %i as %s', (bytes, expected) => {
    expect(formatBytes(bytes)).toBe(expected);
  });
});

describe('readCodeFile', () => {
  it('returns the contents and the detected language', async () => {
    const source = 'def add(a, b):\n    return a + b\n';

    const result = await readCodeFile(file('math.py', source));

    expect(result.code).toBe(source);
    expect(result.language).toBe('python');
    expect(result.warning).toBe('');
  });

  it('returns the contents but warns when the language is unknown', async () => {
    const result = await readCodeFile(file('snippet.txt', 'some code'));

    expect(result.code).toBe('some code');
    expect(result.language).toBeNull();
    expect(result.warning).toMatch(/could not tell the language/i);
    expect(result.warning).toContain('snippet.txt');
  });

  it('rejects a file whose text exceeds the API limit', async () => {
    const tooLong = file('long.js', 'x'.repeat(MAX_CODE_CHARS + 1));

    await expect(readCodeFile(tooLong)).rejects.toThrow(/limit is 20,000/);
  });

  it('accepts a file exactly at the limit', async () => {
    const exact = file('exact.js', 'x'.repeat(MAX_CODE_CHARS));

    const result = await readCodeFile(exact);
    expect(result.code).toHaveLength(MAX_CODE_CHARS);
  });

  it('rejects binary content', async () => {
    const binary = file('image.js', `PNG${String.fromCharCode(0)}`);

    await expect(readCodeFile(binary)).rejects.toThrow(/does not look like a text file/);
  });

  it('rejects a whitespace-only file', async () => {
    await expect(readCodeFile(file('blank.js', '   \n\t  '))).rejects.toThrow(/empty/);
  });

  it('surfaces the size error before reading', async () => {
    const big = file('huge.js', 'x'.repeat(MAX_FILE_BYTES + 1));

    await expect(readCodeFile(big)).rejects.toThrow(/limit is 1\.0 MB/);
  });
});
