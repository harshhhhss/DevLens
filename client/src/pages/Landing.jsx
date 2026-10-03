import React from 'react';
import { Link } from 'react-router-dom';

const GITHUB_URL = 'https://github.com/harshhhhss/DevLens';

/** Counts stated on the page are real: each is checkable in the repo. */
const FACTS = [
  { value: '9', label: 'languages supported' },
  { value: '6', label: 'categories of feedback' },
  { value: '4', label: 'independent security layers' },
  { value: 'MIT', label: 'open source license' },
];

const USE_CASES = [
  {
    title: 'Before opening a PR',
    body: 'Catch the obvious problems yourself, so review time goes on design decisions instead of a missing null check.',
  },
  {
    title: 'Learning a new language',
    body: 'See idiomatic form alongside your own attempt, with the reason each change is an improvement rather than just a diff.',
  },
  {
    title: "Reviewing someone else's code",
    body: 'Get a second read before you comment, so nothing structural slips past while you are busy with the details.',
  },
  {
    title: 'Revisiting old code',
    body: 'Point it at something written months ago and find what you would now write differently, with the risks ranked.',
  },
];

const STEPS = [
  { n: '1', title: 'Paste or upload', body: 'Drop a source file or paste a snippet. The language is read from the extension.' },
  { n: '2', title: 'Isolated and analyzed', body: 'Your code is sealed inside a delimiter and sent as data, never as instructions to the model.' },
  { n: '3', title: 'Validated', body: 'The response is shape-checked before it is trusted, and retried once if it comes back malformed.' },
  { n: '4', title: 'Delivered', body: 'Findings, scores and a clean rewrite, grouped so you can act on them in order.' },
];

const FEATURES = [
  { n: '01', title: 'Bug Detection', body: 'Logic errors, edge cases and incorrect behaviour, each pinned to a line with a suggested fix.' },
  { n: '02', title: 'Security Scanning', body: 'Injection, hardcoded secrets and unsafe calls, rated Low through Critical.' },
  { n: '03', title: 'Performance Insights', body: 'Quadratic loops, blocking calls and repeated queries, with the optimisation spelled out.' },
  { n: '04', title: 'Refactor Suggestions', body: 'Maintainability and readability improvements, each with the reason it is worth doing.' },
  { n: '05', title: 'Quality Scores', body: 'Readability, security and overall, each out of 10, so you can see change over time.' },
  { n: '06', title: 'Clean Rewrite', body: 'The whole snippet rewritten in its own language, never ported to another one.' },
];

const SECURITY = [
  { n: '01', title: 'Prompt-injection resistant', body: 'Submitted code is wrapped in a delimiter carrying a random per-request token, so text inside it cannot address the model.' },
  { n: '02', title: 'Validated before you see it', body: 'Every response is shape-checked. A malformed one is retried once, then refused. You are never shown an empty review.' },
  { n: '03', title: 'JWT auth, hashed passwords', body: 'Signed tokens verified on every request, passwords hashed with bcrypt and never returned by the API.' },
  { n: '04', title: 'Rate limited by design', body: 'Auth and review endpoints are capped per IP, protecting both the server and the model quota.' },
];

const FAQS = [
  {
    q: 'Is my code stored?',
    a: 'Yes, so your review history works. Each review is saved to your account and nobody else can read it. Reviews stay private until you publish one, and you can delete any of them at any time.',
  },
  {
    q: 'What happens when the AI returns something malformed?',
    a: 'The response is validated against the expected shape before it is saved. If it fails, the request is retried once. If it fails again the review is refused with an error rather than showing you an empty result.',
  },
  {
    q: 'What does it cost?',
    a: 'Nothing. DevLens is open source under the MIT license and you can run it yourself with your own API key. There is no paid tier and no billing.',
  },
  {
    q: 'Which languages are supported?',
    a: 'JavaScript, TypeScript, Python, Java, C++, Go, Rust, PHP and Ruby. The language is detected from the file extension when you upload, and you can override it.',
  },
];

const FOOTER_LINKS = {
  Product: [
    { label: 'Features', href: '#features' },
    { label: 'How it works', href: '#how-it-works' },
    { label: 'Sharing', href: '#sharing' },
    { label: 'Security', href: '#security' },
  ],
  Resources: [
    { label: 'GitHub', href: GITHUB_URL, external: true },
    { label: 'README', href: `${GITHUB_URL}#readme`, external: true },
    { label: 'Architecture', href: `${GITHUB_URL}/blob/main/ARCHITECTURE.md`, external: true },
    { label: 'FAQ', href: '#faq' },
  ],
  Legal: [
    { label: 'MIT License', href: `${GITHUB_URL}/blob/main/LICENSE`, external: true },
    { label: 'Privacy Policy', href: '#privacy' },
    { label: 'Terms and Conditions', href: '#terms' },
  ],
};

function LogoMark({ size = 'h-8 w-8' }) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex ${size} flex-none items-center justify-center rounded-md bg-accent font-mono text-sm font-bold text-canvas`}
    >
      &lt;/&gt;
    </span>
  );
}

/** Small amber monospace label that opens a section. */
function SectionLabel({ children }) {
  return <p className="font-mono text-sm text-accent">{children}</p>;
}

function NumberedItem({ n, title, body }) {
  return (
    <div className="flex gap-6 border-t border-edge py-8 sm:gap-10">
      <span className="flex-none font-mono text-sm text-accent" aria-hidden="true">
        {n}
      </span>
      <div>
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{body}</p>
      </div>
    </div>
  );
}

function CodePreview() {
  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-surface">
      <div className="flex items-center gap-3 border-b border-edge px-4 py-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-3 w-3 rounded-full bg-severity-critical" />
          <span className="h-3 w-3 rounded-full bg-severity-medium" />
          <span className="h-3 w-3 rounded-full bg-ok" />
        </span>
        <span className="font-mono text-xs text-subtle">app.js</span>
      </div>

      <pre className="overflow-x-auto px-5 py-5 font-mono text-[13px] leading-relaxed text-fg">
        <code>
          <span className="text-subtle">1</span>{'  '}function getUser(id) {'{'}
          {'\n'}
          <span className="text-subtle">2</span>{'    '}const q ={' '}
          <span className="text-ok">&quot;SELECT * FROM users WHERE id = &quot;</span> + id;
          {'\n'}
          <span className="text-subtle">3</span>{'    '}return db.execute(q);
          {'\n'}
          <span className="text-subtle">4</span>{'  '}
          {'}'}
        </code>
      </pre>

      <div className="border-t border-edge px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <span className="rounded-md bg-severity-critical/10 px-2.5 py-1 font-mono text-xs text-severity-critical">
            security 1/10
          </span>
          <span className="rounded-md bg-severity-medium/10 px-2.5 py-1 font-mono text-xs text-severity-medium">
            overall 4/10
          </span>
        </div>

        <div className="mt-4 flex gap-3">
          <span className="mt-0.5 flex-none rounded-md bg-severity-critical/10 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wide text-severity-critical">
            Critical
          </span>
          <p className="text-sm leading-relaxed text-muted">
            <span className="text-fg">SQL injection on line 2.</span> Use a parameterised query
            instead of string concatenation.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-canvas text-fg">
      {/* ---------------------------------------------------------------- nav */}
      <nav className="sticky top-0 z-30 border-b border-edge bg-canvas/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-6 py-4">
          <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight text-fg">
            <LogoMark />
            DevLens
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {[
              ['Use cases', '#use-cases'],
              ['How it works', '#how-it-works'],
              ['Features', '#features'],
              ['Security', '#security'],
              ['FAQ', '#faq'],
            ].map(([label, href]) => (
              <a key={href} href={href} className="text-sm text-muted transition-colors hover:text-fg">
                {label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-5">
            <Link to="/login" className="text-sm text-muted transition-colors hover:text-fg">
              Sign in
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-fg px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-fg-hover"
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
            <SectionLabel>$ devlens review ./app.js</SectionLabel>

            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-fg sm:text-5xl lg:text-6xl">
              Code review that actually reads your code
            </h1>

            <p className="mt-6 max-w-lg text-base leading-relaxed text-muted">
              Paste a snippet or drop a file and get back the bugs, security holes and performance
              problems a careful reviewer would find, plus a clean rewrite, in seconds.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-8">
              <Link
                to="/register"
                className="rounded-lg bg-fg px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-fg-hover"
              >
                Start reviewing free
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noreferrer"
                className="text-sm text-muted transition-colors hover:text-fg"
              >
                View source on GitHub →
              </a>
            </div>

            <p className="mt-6 text-xs text-muted">
              Open source, MIT licensed, no account required to try it
            </p>
          </div>

          <CodePreview />
        </div>
      </header>

      {/* -------------------------------------------------------- fact strip */}
      <section className="border-y border-edge">
        <div className="mx-auto grid max-w-6xl grid-cols-2 px-6 md:grid-cols-4 md:divide-x md:divide-edge">
          {FACTS.map((f) => (
            <div key={f.label} className="px-0 py-6 md:px-6 md:first:pl-0 md:last:pr-0">
              <p className="font-mono text-2xl font-bold text-fg">{f.value}</p>
              <p className="mt-1 text-sm text-muted">{f.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------- use cases */}
      <section id="use-cases" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <h2 className="max-w-xl text-3xl font-bold tracking-tight text-fg">
          Where it actually fits into your work
        </h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {USE_CASES.map((u) => (
            <article key={u.title} className="rounded-xl border border-edge bg-surface p-8">
              <h3 className="text-base font-semibold text-fg">{u.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{u.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section id="how-it-works" className="scroll-mt-20 border-t border-edge">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <h2 className="text-3xl font-bold tracking-tight text-fg">
            From paste to report in four steps
          </h2>

          <ol className="relative mt-16 grid gap-12 md:grid-cols-4">
            {/* The connecting line sits behind the numerals on wide screens. */}
            <span
              aria-hidden="true"
              className="absolute left-0 right-0 top-5 hidden h-px bg-edge md:block"
            />
            {STEPS.map((s) => (
              <li key={s.n} className="relative">
                <span className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full border border-edge bg-surface font-mono text-sm text-accent">
                  {s.n}
                </span>
                <h3 className="mt-5 text-base font-semibold text-fg">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ---------------------------------------------------------- features */}
      <section id="features" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <SectionLabel>// capabilities</SectionLabel>
        <h2 className="mt-4 max-w-lg text-3xl font-bold tracking-tight text-fg">
          Six things every review tells you
        </h2>
        <div className="mt-12">
          {FEATURES.map((f) => (
            <NumberedItem key={f.n} {...f} />
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------------- sharing */}
      <section id="sharing" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <div className="grid gap-12 rounded-2xl border border-edge bg-surface p-8 lg:grid-cols-2 lg:items-center lg:p-12">
          <div>
            <SectionLabel>// sharing</SectionLabel>
            <h2 className="mt-4 text-3xl font-bold tracking-tight text-fg">
              Share what the review found
            </h2>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted">
              Reviews are private by default. Publish one and you get a link anyone can open. No
              account needed, and your identity is stripped from the response.
            </p>
            <Link
              to="/register"
              className="mt-8 inline-block rounded-lg bg-fg px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-fg-hover"
            >
              Copy share link
            </Link>
          </div>

          <div className="rounded-xl border border-edge bg-canvas p-6">
            <div className="flex items-center justify-between gap-4">
              <span className="font-mono text-xs text-subtle">review.js</span>
              <span className="rounded-md bg-ok/10 px-2.5 py-1 font-mono text-xs text-ok">
                Public
              </span>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="rounded-md bg-ok/10 px-2.5 py-1 font-mono text-xs text-ok">
                readability 8/10
              </span>
              <span className="rounded-md bg-severity-medium/10 px-2.5 py-1 font-mono text-xs text-severity-medium">
                overall 6/10
              </span>
            </div>

            <div className="mt-5 overflow-x-auto rounded-lg border border-edge bg-surface px-4 py-3">
              <span className="whitespace-nowrap font-mono text-xs text-accent">
                dev-lens-rho.vercel.app/public/review/6a9b2d
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- security */}
      <section id="security" className="scroll-mt-20 border-t border-edge">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <SectionLabel>// engineering</SectionLabel>
          <h2 className="mt-4 max-w-lg text-3xl font-bold tracking-tight text-fg">
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

      {/* --------------------------------------------------------------- faq */}
      <section id="faq" className="mx-auto max-w-6xl scroll-mt-20 px-6 py-24">
        <h2 className="text-3xl font-bold tracking-tight text-fg">Questions</h2>
        <dl className="mt-12 max-w-3xl">
          {FAQS.map((f) => (
            <div key={f.q} className="border-t border-edge py-8">
              <dt className="text-base font-semibold text-fg">{f.q}</dt>
              <dd className="mt-3 text-sm leading-relaxed text-muted">{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* ------------------------------------------------------- closing cta */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="rounded-2xl border border-edge bg-surface px-6 py-16 text-center">
          <h2 className="mx-auto max-w-xl text-3xl font-bold tracking-tight text-fg">
            Find the problems before the reviewer does
          </h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-muted">
            Paste your first snippet and see what comes back. It takes about a minute.
          </p>
          <Link
            to="/register"
            className="mt-10 inline-block rounded-lg bg-fg px-6 py-3 text-sm font-semibold text-canvas transition-colors hover:bg-fg-hover"
          >
            Start reviewing free
          </Link>
        </div>
      </section>

      {/* ------------------------------------------------------------ footer */}
      <footer className="border-t border-edge">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-12 md:grid-cols-4">
            <div>
              <Link to="/" className="flex items-center gap-3 font-semibold tracking-tight text-fg">
                <LogoMark />
                DevLens
              </Link>
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
                An AI code reviewer that reads the whole snippet and tells you what it found, with
                the reasoning attached.
              </p>
            </div>

            {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
              <div key={heading}>
                <h3 className="font-mono text-xs uppercase tracking-widest text-muted">
                  {heading}
                </h3>
                <ul className="mt-4 space-y-3">
                  {links.map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.href}
                        {...(l.external ? { target: '_blank', rel: 'noreferrer' } : {})}
                        className="text-sm text-muted transition-colors hover:text-fg"
                      >
                        {l.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-edge pt-8">
            <p className="text-sm text-muted">
              © {new Date().getFullYear()} DevLens. MIT licensed.
            </p>
            <p className="text-sm text-muted">Built by Harsh Singh</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
