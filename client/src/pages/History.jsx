import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchReviewHistory, fetchReviewById, deleteReviewById } from '../services/api.js';
import { LANGUAGES } from '../components/LanguageSelect.jsx';
import ReviewResult from '../components/ReviewResult.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { getErrorMessage } from '../utils/errorMessage.js';

function languageLabel(value) {
  return LANGUAGES.find((l) => l.value === value)?.label || value;
}

export default function History() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const loadHistory = async (pageNum) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchReviewHistory(pageNum, 10);
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load review history.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory(1);
  }, []);

  const handleSelect = async (id) => {
    if (selectedId === id) {
      setSelectedId(null);
      setSelectedReview(null);
      return;
    }
    setSelectedId(id);
    setDetailLoading(true);
    try {
      const { data } = await fetchReviewById(id);
      setSelectedReview(data);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load review details.'));
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this review permanently?')) return;
    setDeletingId(id);
    setError('');
    try {
      await deleteReviewById(id);
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedReview(null);
      }
      setNotice('Review deleted.');
      loadHistory(page);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to delete review.'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-white">Review History</h1>

      {error && (
        <Alert variant="error" className="mb-6" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert variant="success" className="mb-6" onDismiss={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      {loading ? (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center justify-center gap-3 py-16 text-sm text-slate-400"
        >
          <Spinner size="md" className="text-brand-500" />
          Loading your reviews...
        </div>
      ) : reviews.length === 0 ? (
        <div className="surface p-12 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-brand-500/15 text-xl text-brand-300"
          >
            ⌕
          </div>
          <p className="text-base font-semibold text-white">No reviews yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
            Once you run your first code review, it will show up here so you can revisit the
            findings any time.
          </p>
          <Link to="/" className="btn-primary mt-8">
            Run your first review
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => {
            const isOpen = selectedId === review._id;
            return (
              <div
                key={review._id}
                className="surface overflow-hidden transition-colors hover:border-slate-700"
              >
                <div className="flex w-full flex-wrap items-center justify-between gap-4 px-6 py-4">
                  <button
                    onClick={() => handleSelect(review._id)}
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${languageLabel(
                      review.language
                    )} review from ${new Date(review.createdAt).toLocaleString()}`}
                    className="flex flex-1 items-center gap-4 rounded-lg text-left"
                  >
                    <span className="rounded-full bg-slate-800 px-3 py-0.5 text-xs font-semibold text-slate-300">
                      {languageLabel(review.language)}
                    </span>
                    <span className="text-sm text-slate-400">
                      {new Date(review.createdAt).toLocaleString()}
                    </span>
                  </button>
                  <div className="flex items-center gap-4">
                    <span className="text-sm font-semibold tabular-nums text-brand-400">
                      Overall: {review.result?.scores?.overall?.toFixed?.(1) ?? '-'}
                    </span>
                    <button
                      onClick={() => handleDelete(review._id)}
                      disabled={deletingId === review._id}
                      aria-label="Delete this review"
                      className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-red-300 transition-colors hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {deletingId === review._id && <Spinner size="sm" />}
                      {deletingId === review._id ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-slate-800 p-6">
                    {detailLoading ? (
                      <div
                        role="status"
                        aria-live="polite"
                        className="flex items-center gap-3 py-4 text-sm text-slate-400"
                      >
                        <Spinner size="sm" className="text-brand-500" />
                        Loading review details...
                      </div>
                    ) : selectedReview ? (
                      <>
                        <div className="mb-8 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-6">
                          <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-slate-300">
                            {selectedReview.code}
                          </pre>
                        </div>
                        <ReviewResult
                          result={selectedReview.result}
                          language={selectedReview.language}
                        />
                      </>
                    ) : null}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page <= 1}
            onClick={() => loadHistory(page - 1)}
            aria-label="Previous page"
            className="btn-ghost"
          >
            Previous
          </button>
          <span className="text-sm tabular-nums text-slate-400" aria-live="polite">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => loadHistory(page + 1)}
            aria-label="Next page"
            className="btn-ghost"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
