import React from 'react';
import SeverityBadge from './SeverityBadge.jsx';

export default function IssueList({ title, items, emptyText, type = 'default' }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
      <h3 className="mb-3 text-base font-semibold text-white">{title}</h3>
      {(!items || items.length === 0) && (
        <p className="text-sm text-slate-500">{emptyText || 'Nothing to report.'}</p>
      )}
      <ul className="space-y-3">
        {items?.map((item, idx) => (
          <li key={idx} className="rounded-lg border border-slate-800 bg-slate-950 p-3">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              {item.line !== null && item.line !== undefined && (
                <span className="rounded bg-slate-800 px-2 py-0.5 font-mono text-xs text-slate-300">
                  Line {item.line}
                </span>
              )}
              {type === 'security' && item.severity && <SeverityBadge severity={item.severity} />}
            </div>
            {type === 'refactor' ? (
              <>
                <p className="text-sm font-medium text-slate-100">{item.suggestion}</p>
                {item.reason && <p className="mt-1 text-sm text-slate-400">{item.reason}</p>}
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-slate-100">{item.issue}</p>
                {item.fix && (
                  <p className="mt-1 text-sm text-slate-400">
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
