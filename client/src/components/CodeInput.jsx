import React from 'react';

export default function CodeInput({ value, onChange, placeholder }) {
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
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={handleKeyDown}
      placeholder={placeholder || 'Paste your code here...'}
      spellCheck={false}
      className="h-96 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 p-4 font-mono text-sm leading-relaxed text-slate-100 placeholder:text-slate-600 focus:border-brand-500"
    />
  );
}
