import React from 'react';

const SEVERITY_STYLES = {
  Low: 'bg-severity-low/10 text-severity-low border-severity-low/30',
  Medium: 'bg-severity-medium/10 text-severity-medium border-severity-medium/30',
  High: 'bg-severity-high/10 text-severity-high border-severity-high/30',
  Critical: 'bg-severity-critical/10 text-severity-critical border-severity-critical/30',
};

export default function SeverityBadge({ severity }) {
  const classes = SEVERITY_STYLES[severity] || SEVERITY_STYLES.Low;
  return (
    <span
      className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${classes}`}
    >
      {severity}
    </span>
  );
}
