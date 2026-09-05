import React, { useEffect, useState } from 'react';
import { fetchReviewHistory, fetchReviewById, deleteReviewById } from '../services/api.js';
import { LANGUAGES } from '../components/LanguageSelect.jsx';
import ReviewResult from '../components/ReviewResult.jsx';

function languageLabel(value) {
  return LANGUAGES.find((l) => l.value === value)?.label || value;
}

export default function History() {
  const [reviews, setReviews] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const loadHistory = async (pageNum) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await fetchReviewHistory(pageNum, 10);
      setReviews(data.reviews);
      setTotalPages(data.totalPages);
      setPage(data.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load review history.');
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
      setError(err.response?.data?.message || 'Failed to load review details.');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Delete this review permanently?')) return;
    try {
      await deleteReviewById(id);
      if (selectedId === id) {
        setSelectedId(null);
        setSelectedReview(null);
      }
      loadHistory(page);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete review.');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Review History</h1>

      {error && <p className="mb-4 text-sm text-red-400">{error}</p>}

      {loading ? (
        <p className="text-slate-400">Loading history...</p>
      ) : reviews.length === 0 ? (
        <p className="text-slate-400">You haven&apos;t submitted any reviews yet.</p>
      ) : (
        <div className="space-y-3">
          {reviews.map((review) => (
            <div key={review._id} className="rounded-xl border border-slate-800 bg-slate-900">
              <button
                onClick={() => handleSelect(review._id)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
              >
                <div>
                  <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300">
                    {languageLabel(review.language)}
                  </span>
                  <span className="ml-3 text-sm text-slate-400">
                    {new Date(review.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-brand-400">
                    Overall: {review.result?.scores?.overall?.toFixed?.(1) ?? '-'}
                  </span>
                  <button
                    onClick={(e) => handleDelete(review._id, e)}
                    className="rounded-md bg-slate-800 px-2 py-1 text-xs text-red-400 hover:bg-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </button>

              {selectedId === review._id && (
                <div className="border-t border-slate-800 p-4">
                  {detailLoading ? (
                    <p className="text-slate-400">Loading details...</p>
                  ) : selectedReview ? (
                    <>
                      <div className="mb-4 overflow-x-auto rounded-lg bg-slate-950 p-3">
                        <pre className="whitespace-pre-wrap text-xs text-slate-300">
                          {selectedReview.code}
                        </pre>
                      </div>
                      <ReviewResult result={selectedReview.result} language={selectedReview.language} />
                    </>
                  ) : null}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            disabled={page <= 1}
            onClick={() => loadHistory(page - 1)}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 disabled:opacity-40"
          >
            Previous
          </button>
          <span className="text-sm text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            disabled={page >= totalPages}
            onClick={() => loadHistory(page + 1)}
            className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
