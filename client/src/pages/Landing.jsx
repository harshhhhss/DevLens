import React from 'react';
import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/harshhhhss/DevLens';

const LANGUAGES = [
  'JavaScript',
  'TypeScript',
  'Python',
  'Java',
  'C++',
  'Go',
  'Rust',
  'PHP',
  'Ruby',
];

const FEATURES = [
  {
    n: '01',
    title: 'Bug Detection',
    body: 'Logic errors, edge cases and incorrect behaviour, each pinned to a line with a suggested fix.',
  },
  {
    n: '02',
    title: 'Security Scanning',
    body: 'Injection, hardcoded secrets and unsafe calls, rated Low through Critical.',
  },
  {
    n: '03',
    title: 'Performance Insights',
    body: 'Quadratic loops, blocking calls and N+1 queries, with the optimisation spelled out.',
  },
  {
    n: '04',
    title: 'Refactor Suggestions',
    body: 'Maintainability and readability improvements, each with the reason it is worth doing.',
  },
  {
    n: '05',
    title: 'Quality Scores',
    body: 'Readability, security and overall, each out of 10, so you can see change over time.',
  },
  {
    n: '06',
    title: 'Clean Rewrite',
    body: 'The whole snippet rewritten in its own language, never ported to another one.',
  },
];

const STEPS = [
  {
    n: '01',
    title: 'Paste or upload',
    body: 'Drop a source file or paste a snippet. The language is detected from the extension.',
  },
  {
    n: '02',
    title: 'Gemini reviews it',
    body: 'Your code is sent as data inside a sealed delimiter, never as instructions to the model.',
  },
  {
    n: '03',
    title: 'Get your report',
    body: 'Findings, scores and a clean rewrite, validated for shape before you ever see them.',
  },
];

const SECURITY = [
  {
    n: '01',
    title: 'Prompt-injection resistant',
    body: 'Submitted code is wrapped in a delimiter carrying a random per-request token, so text inside it cannot address the model.',
  },
  {
    n: '02',
    title: 'Validated before you see it',
    body: "Every AI response is shape-checked. A malformed one is retried once, then refused. You're never shown an empty review.",
  },
  {
    n: '03',
    title: 'JWT auth, hashed passwords',
    body: 'Signed tokens verified on every request, passwords hashed with bcrypt and never returned by the API.',
  },
  {
    n: '04',
    title: 'Rate limited by design',
    body: 'Auth and review endpoints are capped per IP, protecting both the server and the AI quota.',
  },
];

/** The bracket mark used in the nav and footer. */
function LogoMark() {
  return (
    <span
      aria-hidden="true"
      className="inline-flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-accent font-mono text-sm font-bold text-white"
    >
      &lt;/&gt;
    </span>
  );
}

function NumberedItem({ n, title, body }) {
  return (
    <div className="flex gap-6 border-t border-white/[0.08] py-8 first:border-t-0 sm:gap-10">
      <span className="flex-none font-mono text-sm text-accent" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3 className="text-base font-semibold text-ink-100">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-400">{body}</p>
      </div>
    </div>
  );
}

/** The mock editor panel in the hero. Presentational only. */
function CodePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.08] bg-ink-900">
      <div className="flex items-center gap-3 border-b border-white/[0.08] px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-[#FF5F57]" />
          <span className="h-3 w-3 rounded-full bg-[#FEBC2E]" />
          <span className="h-3 w-3 rounded-full bg-[#28C840]" />
        </span>
        <span className="font-mono text-xs text-ink-400">app.js</span>
      </div>

      <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-relaxed text-ink-100">
        <code>
          <span className="text-ink-400">1</span>{'  '}
          <span className="text-brand-400">function</span> getUser(id) {'{'}
          {'\n'}
          <span className="text-ink-400">2</span>{'    '}
          <span className="text-brand-400">const</span> q ={' '}
          <span className="text-emerald-300">
            &quot;SELECT * FROM users WHERE id = &quot;
          </span>{' '}
          + id;
          {'\n'}
          <span className="text-ink-400">3</span>{'    '}
          <span className="text-brand-400">return</span> db.execute(q);
          {'\n'}
          <span className="text-ink-400">4</span>{'  '}
          {'}'}
        </code>
      </pre>

      <div className="border-t border-white/[0.08] px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-red-500/10 px-2.5 py-1 font-mono text-xs text-red-300">
            security 1/10
          </span>
          <span className="rounded-md bg-yellow-500/10 px-2.5 py-1 font-mono text-xs text-yellow-300">
            overall 4/10
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          <span className="mt-0.5 flex-none rounded bg-red-500/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-red-300">
            Critical
          </span>
          <p className="text-sm leading-relaxed text-ink-400">
            <span className="text-ink-100">SQL injection on line 2.</span> Use a parameterised
            query instead of string concatenation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-ink-950 text-ink-100">
      {/* ---------------------------------------------------------------- nav */}
      <nav className="sticky top-0 z-30 border-b border-white/[0.08] bg-ink-950/90">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
          <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <LogoMark />
            DevLens
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm text-ink-400 transition-colors hover:text-ink-100">
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm text-ink-400 transition-colors hover:text-ink-100"
            >
              How it works
            </a>
            <a href="#sharing" className="text-sm text-ink-400 transition-colors hover:text-ink-100">
              Sharing
            </a>
            <a href="#security" className="text-sm text-ink-400 transition-colors hover:text-ink-100">
              Security
            </a>
          </div>

          <div className="flex items-center gap-5">
            <Link
              to="/login"
              className="text-sm text-ink-400 transition-colors hover:text-ink-100"
            >
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* -------------------------------------------------------------- hero */}
      <header className="mx-auto max-w-6xl px-6 pb-24 pt-20 lg:pt-28">
        <div className="grid items-center gap-16 lg:grid-cols-2">
          <div>
            <p className="font-mono text-sm text-accent">$ devlens review ./app.js</p>

            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-ink-100 sm:text-5xl lg:text-6xl">
              Code review that actually reads your code
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-ink-400">
              Paste a snippet or drop a file and get back the bugs, security holes and performance
              problems a careful reviewer would find, plus a clean rewrite, in seconds.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-8">
              <Link
                to="/register"
                className="rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
              >
                Start reviewing free
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-ink-400 transition-colors hover:text-ink-100"
              >
                View source on GitHub →
              </a>
            </div>
          </div>

          <CodePreview />
        </div>
      </header>

      {/* --------------------------------------------------------- languages */}
      <section className="border-y border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-5 sm:flex-row sm:items-center sm:gap-8">
          <span className="flex-none font-mono text-xs uppercase tracking-widest text-ink-400">
            Languages
          </span>
          <p className="font-mono text-sm text-ink-400">
            {LANGUAGES.join('  ·  ')}
          </p>
        </div>
      </section>

      {/* ---------------------------------------------------------- features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <h2 className="max-w-lg text-3xl font-bold tracking-tight text-ink-100">
          Six things every review tells you
        </h2>
        <div className="mt-12">
          {FEATURES.map((f) => (
            <NumberedItem key={f.n} {...f} />
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 border-t border-white/[0.08] bg-ink-900/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight text-ink-100">How it works</h2>
          <div className="mt-12 grid gap-12 md:grid-cols-3">
            {STEPS.map((s) => (
              <div key={s.n}>
                <span className="font-mono text-sm text-accent" aria-hidden="true">
                  {s.n}
                </span>
                <h3 className="mt-4 text-base font-semibold text-ink-100">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-ink-400">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------------------------------------- sharing */}
      <section id="sharing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="grid gap-12 rounded-2xl border border-white/[0.08] bg-ink-900 p-8 lg:grid-cols-2 lg:items-center lg:p-12">
          <div>
            <p className="font-mono text-sm text-accent">// new</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-ink-100">
              Share what the review found
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-ink-400">
              Reviews are private by default. Flip one to public and you get a link anyone can open
              (no account needed), and your identity is stripped from the response.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block rounded-lg bg-accent px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
            >
              Copy share link
            </Link>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-ink-950 p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-xs text-ink-400">review.js</span>
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-300">
                Public
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 font-mono text-xs text-emerald-300">
                readability 8/10
              </span>
              <span className="rounded-md bg-yellow-500/10 px-2.5 py-1 font-mono text-xs text-yellow-300">
                overall 6/10
              </span>
            </div>

            <div className="mt-5 overflow-x-auto rounded-lg border border-white/[0.08] bg-ink-900 px-4 py-3">
              <span className="whitespace-nowrap font-mono text-xs text-brand-400">
                dev-lens-rho.vercel.app/public/review/6a9b…2d
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- security */}
      <section
        id="security"
        className="scroll-mt-20 border-t border-white/[0.08] bg-ink-900/40"
      >
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="max-w-lg text-3xl font-bold tracking-tight text-ink-100">
            Built to be careful with your code
          </h2>
          {/* first:border-t-0 only clears the first item overall, so in the
              two-column layout the second item starts a row too. */}
          <div className="mt-12 grid gap-x-16 md:grid-cols-2 md:[&>*:nth-child(2)]:border-t-0">
            {SECURITY.map((s) => (
              <NumberedItem key={s.n} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-white/[0.08]">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-10 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <LogoMark />
            DevLens
          </Link>

          <div className="flex flex-wrap items-center gap-8 text-sm text-ink-400">
            <a
              href={GITHUB_URL}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink-100"
            >
              GitHub
            </a>
            <a
              href={`${GITHUB_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noreferrer"
              className="transition-colors hover:text-ink-100"
            >
              MIT License
            </a>
            <span>Built by Harsh Singh</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
