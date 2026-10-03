import React from 'react';

/**
 * Placeholder blocks shown while data loads.
 *
 * A skeleton that mirrors the shape of the content tells you what is coming and
 * stops the page jumping when it arrives, which a centred spinner does not.
 * The only motion is a standard opacity pulse, no scroll or cursor coupling.
 *
 * Marked aria-hidden: the surrounding region carries the live status text, so a
 * screen reader hears "Loading your reviews" once instead of a wall of boxes.
 */
export function Skeleton({ className = '' }) {
  return <div aria-hidden="true" className={`animate-pulse rounded bg-raised ${className}`} />;
}

/** A card-shaped placeholder, used for list rows. */
export function SkeletonCard({ lines = 2, className = '' }) {
  return (
    <div className={`surface p-6 ${className}`} aria-hidden="true">
      <Skeleton className="h-4 w-1/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`mt-3 h-3 ${i % 2 ? 'w-2/3' : 'w-5/6'}`} />
      ))}
    </div>
  );
}

/**
 * A list of card placeholders with the status text screen readers announce.
 * `label` should say what is loading, not just "loading".
 */
export default function SkeletonList({ count = 3, lines = 2, label = 'Loading' }) {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <span className="sr-only">{label}</span>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} lines={lines} />
      ))}
    </div>
  );
}
