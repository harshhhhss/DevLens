import React from 'react';

function getColorClasses(score) {
  if (score < 5) {
    return {
      ring: 'ring-severity-critical/30',
      text: 'text-severity-critical',
      bar: 'bg-severity-critical',
      badge: 'bg-severity-critical/10 text-danger border-severity-critical/30',
    };
  }
  if (score <= 7) {
    return {
      ring: 'ring-severity-medium/30',
      text: 'text-severity-medium',
      bar: 'bg-severity-medium',
      badge: 'bg-severity-medium/10 text-severity-medium border-severity-medium/30',
    };
  }
  return {
    ring: 'ring-ok/30',
    text: 'text-ok',
    bar: 'bg-ok',
    badge: 'bg-ok/10 text-ok border-ok/30',
  };
}

export default function ScoreCard({ label, score }) {
  const safeScore = Math.min(10, Math.max(0, Number(score) || 0));
  const colors = getColorClasses(safeScore);
  const percentage = (safeScore / 10) * 100;

  return (
    <div
      className={`surface p-6 ring-1 ${colors.ring} transition-all hover:-translate-y-0.5 hover:shadow-card-hover`}
    >
      <div className="flex items-baseline justify-between gap-4">
        <span className="text-sm font-medium text-muted">{label}</span>
        <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>
          {safeScore.toFixed(1)}
        </span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded bg-raised">
        <div
          className={`h-full rounded ${colors.bar} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-right text-xs text-muted">out of 10</div>
    </div>
  );
}
