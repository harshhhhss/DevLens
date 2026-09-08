import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

// The Prism theme ships its own font stack, so the editor font is applied
// explicitly here to keep code areas on JetBrains Mono.
const MONO_STACK =
  "'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, Consolas, 'Liberation Mono', monospace";

export default function CleanCodeViewer({ code, language }) {
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code || '');
      setCopyFailed(false);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      // Clipboard access is blocked in some browsers/contexts - say so rather
      // than leaving the button looking like it did nothing.
      setCopyFailed(true);
      setTimeout(() => setCopyFailed(false), 2500);
    }
  };

  return (
    <div className="surface p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-white">Rewritten Clean Code</h3>
        <button
          onClick={handleCopy}
          aria-label="Copy rewritten code to clipboard"
          className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
            copied
              ? 'bg-emerald-500/15 text-emerald-300'
              : copyFailed
                ? 'bg-red-500/15 text-red-300'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
          }`}
        >
          <span aria-live="polite">
            {copied ? 'Copied!' : copyFailed ? 'Copy blocked' : 'Copy'}
          </span>
        </button>
      </div>
      {code ? (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1.5rem',
              fontSize: '0.875rem',
              lineHeight: '1.7',
              maxHeight: '32rem',
              background: '#020617',
              fontFamily: MONO_STACK,
            }}
            codeTagProps={{ style: { fontFamily: MONO_STACK } }}
            wrapLongLines
          >
            {code}
          </SyntaxHighlighter>
        </div>
      ) : (
        <p className="text-sm text-slate-400">No rewritten code available.</p>
      )}
    </div>
  );
}
