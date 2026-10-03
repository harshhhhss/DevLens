import React from 'react';

/** The one list of shortcuts, so the overlay can never drift from the handlers. */
export const SHORTCUTS = [
  { keys: ['Ctrl', 'K'], macKeys: ['⌘', 'K'], action: 'Open the command menu' },
  { keys: ['?'], macKeys: ['?'], action: 'Show this list' },
  { keys: ['Ctrl', 'Enter'], macKeys: ['⌘', 'Enter'], action: 'Run the review (on the review page)' },
  { keys: ['e'], macKeys: ['e'], action: 'Focus the code editor (on the review page)' },
  { keys: ['Esc'], macKeys: ['Esc'], action: 'Close this or the command menu' },
];

const isMac = () =>
  typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform || '');

function Key({ children }) {
  return (
    <kbd className="rounded border border-edge bg-raised px-2 py-0.5 font-mono text-xs text-fg">
      {children}
    </kbd>
  );
}

export default function ShortcutsOverlay({ open, onClose }) {
  if (!open) return null;
  const mac = isMac();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-canvas/80 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Keyboard shortcuts"
        className="w-full max-w-md rounded-xl border border-edge bg-surface p-6 shadow-card"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-base font-semibold text-fg">Keyboard shortcuts</h2>
          <button type="button" onClick={onClose} className="btn-subtle" aria-label="Close shortcuts">
            Close
          </button>
        </div>

        <ul className="mt-5 divide-y divide-edge">
          {SHORTCUTS.map((s) => (
            <li key={s.action} className="flex items-center justify-between gap-6 py-3">
              <span className="text-sm text-muted">{s.action}</span>
              <span className="flex flex-none items-center gap-1">
                {(mac ? s.macKeys : s.keys).map((k) => (
                  <Key key={k}>{k}</Key>
                ))}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
