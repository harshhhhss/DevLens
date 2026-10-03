const { Octokit } = require('@octokit/rest');

/**
 * Thin wrapper over the GitHub REST API.
 *
 * Kept free of Express and of our own models so it can be exercised directly,
 * and so the controller stays the only place that knows about requests.
 */

const GITHUB_AUTHORIZE_URL = 'https://github.com/login/oauth/authorize';
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token';

/**
 * Read-only access to public and private repositories.
 *
 * `repo` is the narrowest scope GitHub offers that can still read a private
 * repository's pull request diffs; there is no read-only variant of it. Users
 * who only need public repositories can authorise with `public_repo` by setting
 * GITHUB_SCOPE, which is strictly narrower.
 */
const DEFAULT_SCOPE = 'repo';

const scope = () => process.env.GITHUB_SCOPE || DEFAULT_SCOPE;

/** The URL the browser is sent to in order to start the OAuth dance. */
function buildAuthorizeUrl(state) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) throw new Error('GITHUB_CLIENT_ID is not set');

  const params = new URLSearchParams({
    client_id: clientId,
    scope: scope(),
    state,
  });

  const redirectUri = process.env.GITHUB_CALLBACK_URL;
  if (redirectUri) params.set('redirect_uri', redirectUri);

  return `${GITHUB_AUTHORIZE_URL}?${params.toString()}`;
}

/**
 * Trades the ?code= GitHub sent back for an access token.
 * Uses fetch rather than Octokit because this call is not authenticated yet.
 */
async function exchangeCodeForToken(code) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error('GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET must both be set');
  }

  const res = await fetch(GITHUB_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ client_id: clientId, client_secret: clientSecret, code }),
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok || data.error || !data.access_token) {
    throw new Error(data.error_description || data.error || 'GitHub rejected the authorization code');
  }

  return data.access_token;
}

const clientFor = (token) => new Octokit({ auth: token });

/** Repositories the user can push to, most recently updated first. */
async function listRepos(token) {
  const octokit = clientFor(token);
  const { data } = await octokit.repos.listForAuthenticatedUser({
    sort: 'updated',
    per_page: 50,
    affiliation: 'owner,collaborator,organization_member',
  });

  return data.map((r) => ({
    id: r.id,
    name: r.name,
    fullName: r.full_name,
    owner: r.owner?.login,
    private: r.private,
    defaultBranch: r.default_branch,
    updatedAt: r.updated_at,
  }));
}

/** Open pull requests for one repository. */
async function listPullRequests(token, owner, repo) {
  const octokit = clientFor(token);
  const { data } = await octokit.pulls.list({ owner, repo, state: 'open', per_page: 50 });

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    author: pr.user?.login,
    branch: pr.head?.ref,
    baseBranch: pr.base?.ref,
    createdAt: pr.created_at,
    url: pr.html_url,
  }));
}

/** The files a pull request changes, with their unified diffs. */
async function listPullRequestFiles(token, owner, repo, pullNumber) {
  const octokit = clientFor(token);
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number: pullNumber,
    per_page: 100,
  });

  return data.map((f) => ({
    filename: f.filename,
    status: f.status,
    additions: f.additions,
    deletions: f.deletions,
    changes: f.changes,
    patch: f.patch || '',
  }));
}

/** The authenticated user's GitHub login, used for display only. */
async function getLogin(token) {
  const { data } = await clientFor(token).users.getAuthenticated();
  return data.login;
}

/** Posts the review summary as a PR comment. Only ever called explicitly. */
async function postPullRequestComment(token, owner, repo, pullNumber, body) {
  const { data } = await clientFor(token).issues.createComment({
    owner,
    repo,
    issue_number: pullNumber,
    body,
  });
  return { id: data.id, url: data.html_url };
}

module.exports = {
  buildAuthorizeUrl,
  exchangeCodeForToken,
  listRepos,
  listPullRequests,
  listPullRequestFiles,
  getLogin,
  postPullRequestComment,
  DEFAULT_SCOPE,
};
