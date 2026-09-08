import React from 'react';

function getColorClasses(score) {
  if (score < 5) {
    return {
      ring: 'ring-red-500/30',
      text: 'text-red-400',
      bar: 'bg-red-500',
      badge: 'bg-red-500/10 text-red-400 border-red-500/30',
    };
  }
  if (score <= 7) {
    return {
      ring: 'ring-yellow-500/30',
      text: 'text-yellow-400',
      bar: 'bg-yellow-500',
      badge: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    };
  }
  return {
    ring: 'ring-green-500/30',
    text: 'text-green-400',
    bar: 'bg-green-500',
    badge: 'bg-green-500/10 text-green-400 border-green-500/30',
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
        <span className="text-sm font-medium text-slate-400">{label}</span>
        <span className={`text-3xl font-bold tabular-nums ${colors.text}`}>
          {safeScore.toFixed(1)}
        </span>
      </div>
      <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="mt-2 text-right text-xs text-slate-400">out of 10</div>
    </div>
  );
}
