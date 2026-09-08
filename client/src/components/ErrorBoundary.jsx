import React from 'react';

/**
 * Catches render/lifecycle errors anywhere below it so an unexpected crash
 * shows a recoverable message instead of a blank white screen.
 *
 * Must stay a class component - React has no hook equivalent for
 * getDerivedStateFromError / componentDidCatch.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Keep the detail in the console for debugging; the UI stays friendly.
    console.error('DevLens crashed:', error, info?.componentStack);
  }

  handleReload = () => {
    window.location.assign('/');
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;

    return (
      <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
        <div className="surface w-full max-w-lg p-8 text-center sm:p-10">
          <div
            aria-hidden="true"
            className="mx-auto mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/15 text-xl font-bold text-red-300"
          >
            !
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Something went wrong</h1>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-slate-400">
            DevLens hit an unexpected error and could not finish rendering this page. Your saved
            reviews are unaffected.
          </p>

          {import.meta.env.DEV && error?.message && (
            <pre className="mt-6 overflow-x-auto rounded-xl border border-slate-800 bg-slate-950 p-4 text-left font-mono text-xs leading-relaxed text-red-300">
              {error.message}
            </pre>
          )}

          <button type="button" onClick={this.handleReload} className="btn-primary mt-8 w-full">
            Reload DevLens
          </button>
        </div>
      </div>
    );
  }
}
