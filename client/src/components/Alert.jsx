import React from 'react';

const VARIANTS = {
  error: {
    box: 'border-red-500/30 bg-red-500/10 text-red-200',
    icon: '!',
    iconBox: 'bg-red-500/20 text-red-300',
  },
  success: {
    box: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200',
    icon: '✓',
    iconBox: 'bg-emerald-500/20 text-emerald-300',
  },
  warning: {
    box: 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200',
    icon: '!',
    iconBox: 'bg-yellow-500/20 text-yellow-300',
  },
  info: {
    box: 'border-brand-500/30 bg-brand-500/10 text-slate-200',
    icon: 'i',
    iconBox: 'bg-brand-500/20 text-brand-300',
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
