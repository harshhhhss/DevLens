import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import SkeletonList from '../components/Skeleton.jsx';
import CategoryBarChart, { TREND_TEXT } from '../components/CategoryBarChart.jsx';
import { fetchInsights } from '../services/api.js';
import { getErrorMessage } from '../utils/errorMessage.js';

/** How many categories the page lists before "show all". */
const TOP_N = 8;

const TREND_STYLES = {
  up: 'text-danger',
  down: 'text-ok',
  flat: 'text-muted',
};

export default function Insights() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetchInsights();
        if (!cancelled) setData(res.data);
      } catch (err) {
        if (!cancelled) setError(getErrorMessage(err, 'Could not load your patterns.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = data?.categories ?? [];
  const visible = showAll ? categories : categories.slice(0, TOP_N);

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-white">Patterns</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        The problems that keep coming back across your own reviews, so you can work on the habit
        rather than the one file.
      </p>

      {error && (
        <Alert variant="error" className="mt-8">
          {error}
        </Alert>
      )}

      {loading && (
        <div className="mt-8">
          <SkeletonList count={3} lines={2} label="Reading your review history" />
        </div>
      )}

      {!loading && !error && data?.totalReviews === 0 && (
        <div className="surface mt-8 p-12 text-center">
          <p className="text-base font-semibold text-white">No patterns yet</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Once you have run a few reviews, this page groups every finding into a fixed set of
            categories and shows which ones keep recurring. It needs real reviews to say anything,
            so there is nothing to show until then.
          </p>
          <Link to="/" className="btn-primary mt-8">
            Run a review
          </Link>
        </div>
      )}

      {!loading && !error && data?.totalReviews > 0 && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="surface p-6">
              <p className="text-sm text-muted">Reviews analysed</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                {data.totalReviews}
              </p>
            </div>
            <div className="surface p-6">
              <p className="text-sm text-muted">Findings</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                {data.totalFindings}
              </p>
            </div>
            <div className="surface p-6">
              <p className="text-sm text-muted">Distinct categories</p>
              <p className="mt-2 text-3xl font-bold tabular-nums text-white">
                {categories.length}
              </p>
            </div>
          </div>

          {data.totalFindings === 0 ? (
            <div className="surface mt-8 p-12 text-center">
              <p className="text-base font-semibold text-white">Nothing recurring yet</p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                Your reviews so far came back clean, so there are no findings to group.
              </p>
            </div>
          ) : (
            <>
              <section className="surface mt-8 p-6">
                <h2 className="text-base font-semibold text-white">Most recurring</h2>
                <p className="mt-1 text-sm text-muted">
                  Across your {data.totalReviews} most recent{' '}
                  {data.totalReviews === 1 ? 'review' : 'reviews'}.
                </p>
                <div className="mt-6">
                  <CategoryBarChart categories={visible} />
                </div>

                {categories.length > TOP_N && (
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="btn-ghost mt-6"
                  >
                    {showAll ? 'Show top 8' : `Show all ${categories.length}`}
                  </button>
                )}
              </section>

              <section className="surface mt-6 p-6">
                <h2 className="text-base font-semibold text-white">Recent trend</h2>
                <p className="mt-1 text-sm text-muted">
                  {data.totalReviews > data.trendWindow
                    ? `Your last ${data.trendWindow} reviews against the ${Math.min(
                        data.totalReviews - data.trendWindow,
                        data.trendWindow
                      )} before them.`
                    : `All ${data.totalReviews} of your reviews so far. A comparison appears once you have more than ${data.trendWindow}.`}
                </p>

                <ul className="mt-6 divide-y divide-edge">
                  {visible.map((c) => (
                    <li
                      key={c.category}
                      className="flex flex-wrap items-center justify-between gap-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-fg">{c.label}</p>
                        <p className="font-mono text-xs text-muted">{c.category}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm tabular-nums">
                        <span className="text-muted">
                          {c.previous} to {c.recent}
                        </span>
                        <span className={`w-36 text-right ${TREND_STYLES[c.trend]}`}>
                          {TREND_TEXT[c.trend]}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            </>
          )}
        </>
      )}
    </div>
  );
}
