import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReviewResult from '../components/ReviewResult.jsx';
import Spinner from '../components/Spinner.jsx';
import { fetchPublicReview } from '../services/api.js';
import { getErrorMessage } from '../utils/errorMessage.js';
import { LANGUAGES } from '../components/LanguageSelect.jsx';

function languageLabel(value) {
  return LANGUAGES.find((l) => l.value === value)?.label || value;
}

/**
 * A shared review, readable without an account.
 *
 * Rendering is delegated to ReviewResult, the same component the owner sees,
 * so a public page can never drift from the private one.
 */
export default function PublicReview() {
  const { id } = useParams();
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notAvailable, setNotAvailable] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      setNotAvailable(false);
      try {
        const { data } = await fetchPublicReview(id);
        if (!cancelled) setReview(data);
      } catch (err) {
        if (cancelled) return;
        // 404 covers "no such review", "private" and "malformed id" alike -
        // the API answers them identically on purpose.
        if (err.response?.status === 404) setNotAvailable(true);
        else setError(getErrorMessage(err, 'Could not load this review.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-3 text-base font-bold tracking-tight text-white">
            <span
              aria-hidden="true"
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white"
            >
              DL
            </span>
            DevLens
          </Link>
          <Link
            to="/register"
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
          >
            Review your own code
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6 py-16">
        {loading && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-3 py-24 text-sm text-slate-400"
          >
            <Spinner size="md" className="text-brand-500" />
            Loading review...
          </div>
        )}

        {!loading && notAvailable && (
          <div className="surface mx-auto max-w-lg p-12 text-center">
            <div
              aria-hidden="true"
              className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-slate-800 text-xl text-slate-400"
            >
              ?
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              This review isn&apos;t available
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
              The link may be wrong, or its owner may have made the review private again. Shared
              reviews are public only while their owner chooses.
            </p>
            <Link to="/" className="btn-primary mt-8">
              Go to DevLens
            </Link>
          </div>
        )}

        {!loading && error && (
          <div className="surface mx-auto max-w-lg p-12 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Something went wrong
            </h1>
            <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">{error}</p>
          </div>
        )}

        {!loading && review && (
          <>
            <div className="mb-8 flex flex-wrap items-center gap-4">
              <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-semibold text-slate-300">
                {languageLabel(review.language)}
              </span>
              <span className="text-sm text-slate-400">
                Shared review · {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mb-8 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-6">
              <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">
                {review.code}
              </pre>
            </div>

            <ReviewResult result={review.result} language={review.language} />
          </>
        )}
      </main>
    </div>
  );
}
