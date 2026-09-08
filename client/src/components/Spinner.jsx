import React from 'react';

const SIZES = {
  sm: 'h-4 w-4 border-2',
  md: 'h-5 w-5 border-2',
  lg: 'h-8 w-8 border-2',
};

/**
 * Decorative by default - the surrounding element carries the status text that
 * screen readers announce, so the spinner itself is hidden from them.
 */
export default function Spinner({ size = 'md', className = '' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-block animate-spin rounded-full border-current border-t-transparent ${
        SIZES[size] || SIZES.md
      } ${className}`}
    />
  );
}
