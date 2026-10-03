import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

/**
 * Cmd/Ctrl+K command menu.
 *
 * Deliberately plain: a filtered list in a dialog, built from the router and
 * the auth context, with no new dependency and no animation beyond the standard
 * colour transition on the rows.
 */
export default function CommandPalette({ open, onClose, onShowShortcuts }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  const commands = useMemo(() => {
    const go = (to) => () => navigate(to);
    const all = [
      { id: 'new', label: 'Start a new review', hint: 'Review', run: go('/'), auth: true },
      { id: 'history', label: 'Go to history', hint: 'History', run: go('/history'), auth: true },
      { id: 'insights', label: 'Go to patterns', hint: 'Patterns', run: go('/insights'), auth: true },
      { id: 'github', label: 'Review a GitHub pull request', hint: 'GitHub', run: go('/github'), auth: true },
      { id: 'shortcuts', label: 'Show keyboard shortcuts', hint: 'Help', run: onShowShortcuts, auth: false },
      { id: 'signout', label: 'Sign out', hint: 'Account', run: () => { logout(); navigate('/login'); }, auth: true },
      { id: 'signin', label: 'Sign in', hint: 'Account', run: go('/login'), auth: false, guestOnly: true },
    ];
    return all.filter((c) => (c.auth ? isAuthenticated : true) && (!c.guestOnly || !isAuthenticated));
  }, [isAuthenticated, navigate, logout, onShowShortcuts]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return commands;
    return commands.filter((c) => `${c.label} ${c.hint}`.toLowerCase().includes(q));
  }, [commands, query]);

  // Reset whenever the palette is opened.
  useEffect(() => {
    if (open) {
      setQuery('');
      setActive(0);
      // Focus after paint so the input exists.
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const run = (command) => {
    onClose();
    command?.run?.();
  };

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      run(results[active]);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-canvas/80 p-4 pt-24"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Command menu"
        className="w-full max-w-lg overflow-hidden rounded-xl border border-edge bg-surface shadow-card"
        onKeyDown={onKeyDown}
      >
        <input
          ref={inputRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Type a command..."
          aria-label="Search commands"
          aria-controls="command-results"
          className="w-full border-b border-edge bg-transparent px-5 py-4 text-base text-fg outline-none placeholder:text-muted"
        />

        <ul id="command-results" ref={listRef} role="listbox" className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted">
              No command matches &ldquo;{query}&rdquo;.
            </li>
          )}
          {results.map((c, i) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onClick={() => run(c)}
                className={`flex w-full items-center justify-between gap-4 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${
                  i === active ? 'bg-raised text-fg' : 'text-muted hover:bg-raised'
                }`}
              >
                <span>{c.label}</span>
                <span className="font-mono text-xs text-muted">{c.hint}</span>
              </button>
            </li>
          ))}
        </ul>

        <p className="border-t border-edge px-5 py-3 font-mono text-xs text-muted">
          enter to run · esc to close
        </p>
      </div>
    </div>
  );
}
