import React, { useRef, useState } from 'react';
import { ACCEPTED_EXTENSIONS, readCodeFile, formatBytes } from '../utils/fileToCode.js';

/**
 * Code entry by paste, drag-and-drop, or file picker.
 *
 * onFileLoaded({ code, language, warning, file }) lets the page react to a
 * loaded file (for example by switching the language dropdown). Both callbacks
 * are optional, so pasting behaves exactly as it did before.
 */
export default function CodeInput({
  value,
  onChange,
  placeholder,
  id,
  invalid = false,
  onFileLoaded,
  onFileError,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [loadedFile, setLoadedFile] = useState(null);

  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const { selectionStart, selectionEnd } = e.target;
      const newValue = `${value.substring(0, selectionStart)}  ${value.substring(selectionEnd)}`;
      onChange(newValue);
      requestAnimationFrame(() => {
        e.target.selectionStart = e.target.selectionEnd = selectionStart + 2;
      });
    }
  };

  const loadFile = async (file) => {
    if (!file) return;
    try {
      const result = await readCodeFile(file);
      onChange(result.code);
      setLoadedFile({ name: file.name, size: file.size });
      onFileLoaded?.({ ...result, file });
    } catch (err) {
      setLoadedFile(null);
      onFileError?.(err.message);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer?.files?.[0]);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!dragging) setDragging(true);
  };

  const handleDragLeave = (e) => {
    // Ignore drags moving between children of the drop zone.
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragging(false);
  };

  const handleSelect = (e) => {
    loadFile(e.target.files?.[0]);
    // Reset so picking the same file again still fires a change event.
    e.target.value = '';
  };

  const clearFile = () => {
    setLoadedFile(null);
    onChange('');
    inputRef.current?.focus();
  };

  const borderClass = dragging
    ? 'border-brand-500 bg-brand-500/5'
    : invalid
      ? 'border-red-500/60 hover:border-red-500 focus-within:border-red-500'
      : 'border-slate-800 hover:border-slate-700 focus-within:border-brand-500';

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative rounded-2xl border bg-slate-900 shadow-card transition-colors ${borderClass}`}
      >
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || 'Paste your code here, or drop a file...'}
          spellCheck={false}
          aria-label="Code to review"
          aria-invalid={invalid || undefined}
          className="h-96 w-full resize-y rounded-2xl bg-transparent p-6 font-mono text-sm leading-relaxed text-slate-100 outline-none placeholder:text-slate-500"
        />

        {dragging && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-2xl bg-slate-950/80">
            <p className="text-sm font-semibold text-brand-300">Drop your file to load it</p>
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_EXTENSIONS}
          onChange={handleSelect}
          className="sr-only"
          id={id ? `${id}-file` : 'code-file'}
        />
        <label
          htmlFor={id ? `${id}-file` : 'code-file'}
          className="btn-ghost cursor-pointer"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              inputRef.current?.click();
            }
          }}
        >
          Upload a file
        </label>

        {loadedFile ? (
          <span className="flex items-center gap-2 text-xs text-slate-400">
            <span className="rounded-full bg-slate-800 px-3 py-1 font-mono text-slate-300">
              {loadedFile.name}
            </span>
            {formatBytes(loadedFile.size)}
            <button
              type="button"
              onClick={clearFile}
              className="rounded-lg px-2 py-1 text-slate-400 transition-colors hover:text-red-300"
              aria-label={`Clear ${loadedFile.name}`}
            >
              Clear
            </button>
          </span>
        ) : (
          <span className="text-xs text-slate-500">or drag a source file onto the editor</span>
        )}
      </div>
    </div>
  );
}
