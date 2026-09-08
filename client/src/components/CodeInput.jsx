import React from 'react';

export default function CodeInput({ value, onChange, placeholder, id, invalid = false }) {
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

  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder || 'Paste your code here...'}
      spellCheck={false}
      aria-label="Code to review"
      aria-invalid={invalid || undefined}
      className={`h-96 w-full resize-y rounded-2xl border bg-slate-900 p-6 font-mono text-sm leading-relaxed text-slate-100 shadow-card transition-colors placeholder:text-slate-500 ${
        invalid
          ? 'border-red-500/60 hover:border-red-500 focus:border-red-500'
          : 'border-slate-800 hover:border-slate-700 focus:border-brand-500'
      }`}
    />
  );
}
