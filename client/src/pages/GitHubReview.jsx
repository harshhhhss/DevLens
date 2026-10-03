import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import SkeletonList from '../components/Skeleton.jsx';
import ReviewResult from '../components/ReviewResult.jsx';
import {
  fetchGithubStatus,
  startGithubConnect,
  disconnectGithub,
  fetchGithubRepos,
  fetchGithubPulls,
  reviewPullRequest,
  commentOnPullRequest,
} from '../services/api.js';
import { getErrorMessage } from '../utils/errorMessage.js';

export default function GitHubReview() {
  const [params, setParams] = useSearchParams();
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const [repos, setRepos] = useState(null);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repo, setRepo] = useState(null);

  const [pulls, setPulls] = useState(null);
  const [loadingPulls, setLoadingPulls] = useState(false);

  const [reviewing, setReviewing] = useState(null); // pull number in flight
  const [report, setReport] = useState(null);
  const [posting, setPosting] = useState(false);

  // The OAuth callback sends the browser back here with a flag.
  useEffect(() => {
    if (params.get('connected')) {
      setNotice('GitHub connected.');
      params.delete('connected');
      setParams(params, { replace: true });
    }
    if (params.get('error')) {
      setError(params.get('error'));
      params.delete('error');
      setParams(params, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadStatus = async () => {
    setLoadingStatus(true);
    try {
      const { data } = await fetchGithubStatus();
      setStatus(data);
      if (data.connected) loadRepos();
    } catch (err) {
      setError(getErrorMessage(err, 'Could not check your GitHub connection.'));
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadRepos = async () => {
    setLoadingRepos(true);
    setError('');
    try {
      const { data } = await fetchGithubRepos();
      setRepos(data.repos);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load your repositories.'));
    } finally {
      setLoadingRepos(false);
    }
  };

  const connect = async () => {
    setError('');
    try {
      const { data } = await startGithubConnect();
      window.location.assign(data.url);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not start the GitHub connection.'));
    }
  };

  const disconnect = async () => {
    if (!window.confirm('Disconnect GitHub? Your stored access token will be deleted.')) return;
    try {
      await disconnectGithub();
      setStatus({ connected: false });
      setRepos(null);
      setRepo(null);
      setPulls(null);
      setReport(null);
      setNotice('GitHub disconnected.');
    } catch (err) {
      setError(getErrorMessage(err, 'Could not disconnect GitHub.'));
    }
  };

  const openRepo = async (r) => {
    setRepo(r);
    setPulls(null);
    setReport(null);
    setLoadingPulls(true);
    setError('');
    try {
      const { data } = await fetchGithubPulls(r.owner, r.name);
      setPulls(data.pulls);
    } catch (err) {
      setError(getErrorMessage(err, 'Could not load pull requests.'));
    } finally {
      setLoadingPulls(false);
    }
  };

  const runReview = async (pull) => {
    setReviewing(pull.number);
    setError('');
    setReport(null);
    try {
      const { data } = await reviewPullRequest({
        owner: repo.owner,
        repo: repo.name,
        pullNumber: pull.number,
      });
      setReport({ ...data, title: pull.title, url: pull.url });
    } catch (err) {
      setError(getErrorMessage(err, 'Could not review this pull request.'));
    } finally {
      setReviewing(null);
    }
  };

  const postComment = async () => {
    setPosting(true);
    setError('');
    try {
      const { data } = await commentOnPullRequest(report._id);
      setNotice(`Summary posted to the pull request.`);
      setReport((r) => ({ ...r, commentedAt: data.commentedAt }));
    } catch (err) {
      setError(getErrorMessage(err, 'Could not post the comment.'));
    } finally {
      setPosting(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-fg">GitHub pull requests</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
        Review the actual diff of an open pull request, file by file, with the same checks the
        paste and upload paths use.
      </p>

      {error && (
        <Alert variant="error" className="mt-8" onDismiss={() => setError('')}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert variant="success" className="mt-8" onDismiss={() => setNotice('')}>
          {notice}
        </Alert>
      )}

      {loadingStatus && <div className="mt-8"><SkeletonList count={1} lines={2} label="Checking your GitHub connection" /></div>}

      {/* ---------------------------------------------- not connected ---- */}
      {!loadingStatus && status && !status.connected && (
        <div className="surface mt-8 p-12 text-center">
          <p className="text-base font-semibold text-fg">No GitHub account connected</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
            Connect GitHub to pick one of your repositories and review an open pull request directly.
            DevLens reads repository contents and pull request diffs, and only comments on a pull
            request when you explicitly ask it to.
          </p>
          <button type="button" onClick={connect} className="btn-primary mt-8">
            Connect GitHub
          </button>
        </div>
      )}

      {/* -------------------------------------------------- connected ---- */}
      {!loadingStatus && status?.connected && (
        <>
          <div className="surface mt-8 flex flex-wrap items-center justify-between gap-4 p-4">
            <p className="text-sm text-muted">
              Connected as <span className="font-mono text-fg">{status.login || 'GitHub user'}</span>
            </p>
            <button type="button" onClick={disconnect} className="btn-subtle">
              Disconnect
            </button>
          </div>

          {/* repositories */}
          <section className="mt-8">
            <h2 className="text-base font-semibold text-fg">Repositories</h2>
            {loadingRepos && <div className="mt-4"><SkeletonList count={3} lines={1} label="Loading your repositories" /></div>}

            {!loadingRepos && repos?.length === 0 && (
              <div className="surface mt-4 p-12 text-center">
                <p className="text-base font-semibold text-fg">No repositories found</p>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                  This account has no repositories DevLens can see. If the ones you want belong to an
                  organisation, grant access to it from your GitHub authorisation settings, then
                  reconnect.
                </p>
              </div>
            )}

            {!loadingRepos && repos?.length > 0 && (
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {repos.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => openRepo(r)}
                      aria-pressed={repo?.id === r.id}
                      className={`surface flex w-full items-center justify-between gap-4 p-4 text-left transition-colors hover:border-muted/40 ${
                        repo?.id === r.id ? 'ring-1 ring-accent/40' : ''
                      }`}
                    >
                      <span className="font-mono text-sm text-fg">{r.fullName}</span>
                      {r.private && <span className="chip font-normal">Private</span>}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* pull requests */}
          {repo && (
            <section className="mt-10">
              <h2 className="text-base font-semibold text-fg">
                Open pull requests in <span className="font-mono">{repo.fullName}</span>
              </h2>

              {loadingPulls && <div className="mt-4"><SkeletonList count={2} lines={1} label="Loading open pull requests" /></div>}

              {!loadingPulls && pulls?.length === 0 && (
                <div className="surface mt-4 p-12 text-center">
                  <p className="text-base font-semibold text-fg">No open pull requests</p>
                  <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted">
                    {repo.fullName} has nothing open to review right now. Open a pull request, or
                    pick another repository above.
                  </p>
                </div>
              )}

              {!loadingPulls && pulls?.length > 0 && (
                <ul className="mt-4 space-y-3">
                  {pulls.map((pr) => (
                    <li
                      key={pr.number}
                      className="surface flex flex-wrap items-center justify-between gap-4 p-4"
                    >
                      <div>
                        <p className="text-sm font-medium text-fg">
                          <span className="font-mono text-muted">#{pr.number}</span> {pr.title}
                        </p>
                        <p className="mt-1 font-mono text-xs text-muted">
                          {pr.author} · {pr.branch} into {pr.baseBranch}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => runReview(pr)}
                        disabled={reviewing !== null}
                        className="btn-subtle"
                      >
                        {reviewing === pr.number && <Spinner size="sm" />}
                        {reviewing === pr.number ? 'Reviewing...' : 'Review'}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* in-flight review */}
          {reviewing !== null && (
            <div role="status" aria-live="polite" className="mt-10">
              <p className="mb-4 text-sm text-muted">
                Reviewing each changed file in turn. Large pull requests take a moment.
              </p>
              <SkeletonList count={2} lines={3} label="Reviewing the pull request" />
            </div>
          )}

          {/* report */}
          {report && reviewing === null && (
            <section className="mt-12">
              <div className="surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-fg">
                      #{report.pullNumber} {report.title}
                    </h2>
                    <p className="mt-1 text-sm text-muted">
                      {report.summary.filesReviewed} file(s) reviewed,{' '}
                      {report.summary.filesSkipped} skipped, {report.summary.totalFindings}{' '}
                      finding(s)
                      {report.summary.criticalCount > 0 && (
                        <span className="text-severity-critical">
                          {' '}
                          including {report.summary.criticalCount} critical
                        </span>
                      )}
                      .
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={postComment}
                    disabled={posting || Boolean(report.commentedAt)}
                    className="btn-subtle"
                  >
                    {posting && <Spinner size="sm" />}
                    {report.commentedAt ? 'Posted to PR' : 'Post summary to PR'}
                  </button>
                </div>

                <dl className="mt-6 grid grid-cols-3 gap-4">
                  {[
                    ['Readability', report.summary.averageScores.readability],
                    ['Security', report.summary.averageScores.security],
                    ['Overall', report.summary.averageScores.overall],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-edge bg-canvas p-4">
                      <dt className="text-xs text-muted">{label}</dt>
                      <dd className="mt-1 text-2xl font-bold tabular-nums text-fg">{value}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {report.files.map((file) => (
                <article key={file.filename} className="mt-6">
                  <h3 className="mb-3 font-mono text-sm text-fg">
                    {file.filename}
                    <span className="ml-3 text-xs text-muted">
                      +{file.additions} / -{file.deletions}
                    </span>
                  </h3>

                  {file.skipped ? (
                    <p className="surface p-4 text-sm text-muted">{file.skipped}</p>
                  ) : (
                    /* Same component the single-snippet review uses. */
                    <ReviewResult result={file.result} language={file.language} />
                  )}
                </article>
              ))}
            </section>
          )}
        </>
      )}
    </div>
  );
}
