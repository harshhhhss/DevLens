import React, { useState } from 'react';
import Spinner from './Spinner.jsx';
import Alert from './Alert.jsx';
import { updateReviewVisibility } from '../services/api.js';
import { getErrorMessage } from '../utils/errorMessage.js';

/** Public links point at the deployed app, not at whatever host is serving it now. */
const PUBLIC_BASE_URL = 'https://dev-lens-rho.vercel.app';

export const publicReviewUrl = (id) => `${PUBLIC_BASE_URL}/public/review/${id}`;

/**
 * Owner-only control for publishing a review. Rendered from the review detail
 * view, which is already scoped to the signed-in user's own reviews.
 *
 * `onChange(visibility)` lets the parent keep its copy of the review in step.
 */
export default function ShareToggle({ reviewId, visibility, onChange }) {
  const isPublic = visibility === 'public';
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const shareUrl = publicReviewUrl(reviewId);

  const toggle = async () => {
    setSaving(true);
    setError('');
    try {
      const next = isPublic ? 'private' : 'public';
      const { data } = await updateReviewVisibility(reviewId, next);
      onChange?.(data.visibility);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not change who can see this review.'));
    } finally {
      setSaving(false);
    }
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setError('Copying is blocked in this browser. Select the link and copy it manually.');
    }
  };

  return (
    <div className="mb-8 rounded-xl border border-slate-800 bg-slate-950 p-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-100">
            {isPublic ? 'Anyone with the link can view this' : 'Only you can see this review'}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {isPublic
              ? 'Your name, email and account are not included in the shared page.'
              : 'Reviews are private until you share them.'}
          </p>
        </div>

        <button
          type="button"
          onClick={toggle}
          disabled={saving}
          aria-pressed={isPublic}
          className="btn-ghost gap-2"
        >
          {saving && <Spinner size="sm" />}
          {isPublic ? 'Make private' : 'Make public'}
        </button>
      </div>

      {isPublic && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 font-mono text-xs text-brand-400">
            {shareUrl}
          </code>
          <button
            type="button"
            onClick={copy}
            className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors ${
              copied
                ? 'bg-emerald-500/15 text-emerald-300'
                : 'bg-slate-800 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <span aria-live="polite">{copied ? 'Copied!' : 'Copy link'}</span>
          </button>
        </div>
      )}

      {error && (
        <Alert variant="error" className="mt-4">
          {error}
        </Alert>
      )}
    </div>
  );
}
