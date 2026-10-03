import React from 'react';

const VARIANTS = {
  error: {
    box: 'border-danger/30 bg-danger/10 text-danger',
    icon: '!',
    iconBox: 'bg-danger/20 text-danger',
  },
  success: {
    box: 'border-ok/30 bg-ok/10 text-ok',
    icon: '✓',
    iconBox: 'bg-ok/20 text-ok',
  },
  warning: {
    box: 'border-severity-medium/30 bg-severity-medium/10 text-severity-medium',
    icon: '!',
    iconBox: 'bg-severity-medium/20 text-severity-medium',
  },
  info: {
    box: 'border-accent/30 bg-accent/10 text-fg',
    icon: 'i',
    iconBox: 'bg-accent/20 text-accent',
  },
};

/**
 * Errors use role="alert" so they interrupt and are announced immediately;
 * success/info use a polite live region so they do not cut across the user.
 */
export default function Alert({ variant = 'error', children, onDismiss, className = '' }) {
  const styles = VARIANTS[variant] || VARIANTS.error;
  const isError = variant === 'error';

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3 text-sm leading-relaxed ${styles.box} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`mt-0.5 inline-flex h-5 w-5 flex-none items-center justify-center rounded-full text-xs font-bold ${styles.iconBox}`}
      >
        {styles.icon}
      </span>
      <div className="flex-1">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss message"
          className="flex-none rounded-lg px-2 text-lg leading-none opacity-60 transition-opacity hover:opacity-100"
        >
          ×
        </button>
      )}
    </div>
  );
}
