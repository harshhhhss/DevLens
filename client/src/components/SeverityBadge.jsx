import React from 'react';

const SEVERITY_STYLES = {
  Low: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  Medium: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  High: 'bg-orange-500/10 text-orange-400 border-orange-500/30',
  Critical: 'bg-red-500/10 text-red-400 border-red-500/30',
};

export default function SeverityBadge({ severity }) {
  const classes = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low;
  return (
    <span className={`inline-block rounded-full border px-2 py-0.5 text-xs font-semibold ${classes}`}>
      {severity}
    </span>
  );
}
