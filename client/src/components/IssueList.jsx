import React from 'react';
import SeverityBadge from './SeverityBadge.jsx';

export default function IssueList({ title, items, emptyText, type = 'default' }) {
  const count = items?.length ?? 0;

  return (
    <div className="surface p-6 transition-colors hover:border-edge">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-base font-semibold text-white">{title}</h3>
        {count > 0 && (
          <span className="chip tabular-nums">
            {count}
          </span>
        )}
      </div>

      {count === 0 && <p className="text-sm text-muted">{emptyText || 'Nothing to report.'}</p>}

      <ul className="space-y-4">
        {items?.map((item, idx) => (
          <li
            key={idx}
            className="rounded-xl border border-edge bg-canvas p-4 transition-colors hover:border-edge"
          >
            {(item.line !== null && item.line !== undefined) ||
            (type === 'security' && item.severity) ? (
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {item.line !== null && item.line !== undefined && (
                  <span className="chip font-mono font-normal">
                    Line {item.line}
                  </span>
                )}
                {type === 'security' && item.severity && <SeverityBadge severity={item.severity} />}
              </div>
            ) : null}

            {type === 'refactor' ? (
              <>
                <p className="text-sm font-medium leading-relaxed text-fg">
                  {item.suggestion}
                </p>
                {item.reason && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">{item.reason}</p>
                )}
              </>
            ) : (
              <>
                <p className="text-sm font-medium leading-relaxed text-fg">{item.issue}</p>
                {item.fix && (
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    <span className="font-semibold text-ok">Fix: </span>
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
