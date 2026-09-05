import React, { useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export default function CleanCodeViewer({ code, language }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch (error) {
      // Clipboard access can fail silently in unsupported environments
    }
  };

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-base font-semibold text-white">Rewritten Clean Code</h3>
        <button
          onClick={handleCopy}
          className="rounded-md bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      {code ? (
        <div className="overflow-hidden rounded-lg">
          <SyntaxHighlighter
            language={language}
            style={vscDarkPlus}
            customStyle={{ margin: 0, fontSize: '0.85rem', maxHeight: '32rem' }}
            wrapLongLines
          >
            {code}
          </SyntaxHighlighter>
        </div>
      ) : (
        <p className="text-sm text-slate-500">No rewritten code available.</p>
      )}
    </div>
  );
}
