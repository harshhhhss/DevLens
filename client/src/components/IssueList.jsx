import React from 'react';
import SeverityBadge from './SeverityBadge.jsx';

export default function IssueList({ title, items, emptyText, type = 'default' }) {
  const count = items?.length ?? 0;

  return (
    <div className="surface p-6 transition-colors hover:border-slate-700">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {count > 0 && (
          <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-semibold tabular-nums text-slate-300">
            {count}
          </span>
        )}
      </div>

      {count === 0 && <p className="text-sm text-slate-400">{emptyText || 'Nothing to report.'}</p>}

      <ul className="space-y-4">
        {items?.map((item, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-slate-800 bg-slate-950 p-4 transition-colors hover:border-slate-700"
          >
            {(item.line !== null && item.line !== undefined) ||
            (type === 'security' && item.severity) ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {item.line !== null && item.line !== undefined && (
                  <span className="rounded-full bg-slate-800 px-3 py-0.5 font-mono text-xs text-slate-300">
                    Line {item.line}
                  </span>
                )}
                {type === 'security' && item.severity && <SeverityBadge severity={item.severity} />}
              </div>
            ) : null}

            {type === 'refactor' ? (
              <>
                <p className="text-sm font-medium leading-relaxed text-slate-100">
                  {item.suggestion}
                </p>
                {item.reason && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">{item.reason}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium leading-relaxed text-slate-100">{item.issue}</p>
                {item.fix && (
                  <p className="mt-2 text-sm leading-relaxed text-slate-400">
                    <span className="font-semibold text-emerald-400">Fix: </span>
                    {item.fix}
                  </p>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
