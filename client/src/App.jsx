import React, { useCallback, useEffect, useState } from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import History from './pages/History.jsx';
import Insights from './pages/Insights.jsx';
import GitHubReview from './pages/GitHubReview.jsx';
import CommandPalette from './components/CommandPalette.jsx';
import ShortcutsOverlay from './components/ShortcutsOverlay.jsx';
import PublicReview from './pages/PublicReview.jsx';
import { useAuth } from './context/AuthContext.jsx';

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-3xl font-bold tracking-tight text-white">Page not found</p>
      <p className="mt-3 text-sm text-muted">
        That page doesn&apos;t exist. It may have moved, or the link may be out of date.
      </p>
      <Link to="/" className="btn-primary mt-8">
        Back to review
      </Link>
    </div>
  );
}

/**
 * "/" is the marketing page for visitors and the review workspace for anyone
 * signed in. isAuthenticated comes from the stored token, which is read
 * synchronously, so a returning user never sees the landing page flash first.
 */
function RootRoute() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <Home /> : <Landing />;
}

export default function App() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  /** True when focus is in a field, so single-key shortcuts stay out of the way. */
  const typingInField = (target) =>
    target instanceof HTMLElement &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable);

  const onKeyDown = useCallback((e) => {
    // Cmd/Ctrl+K works everywhere, including inside a field.
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      setShortcutsOpen(false);
      setPaletteOpen((v) => !v);
      return;
    }
    if (e.key === 'Escape') {
      setPaletteOpen(false);
      setShortcutsOpen(false);
      return;
    }
    if (typingInField(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;

    if (e.key === '?') {
      e.preventDefault();
      setPaletteOpen(false);
      setShortcutsOpen((v) => !v);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // The landing page and shared reviews carry their own headers, and shared
  // reviews are read by people with no account at all.
  const isLanding = location.pathname === '/' && !isAuthenticated;
  const isPublicReview = location.pathname.startsWith('/public/review/');
  const showAppNav = !isLanding && !isPublicReview;

  return (
    <div className="min-h-screen bg-canvas">
      {showAppNav && <Navbar />}
      {/* Keyed by path so a crashed route recovers when the user navigates away,
          and so a page-level crash leaves the navbar usable. */}
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<RootRoute />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/public/review/:id" element={<PublicReview />} />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/github"
            element={
              <ProtectedRoute>
                <GitHubReview />
              </ProtectedRoute>
            }
          />
          <Route
            path="/insights"
            element={
              <ProtectedRoute>
                <Insights />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onShowShortcuts={() => setShortcutsOpen(true)}
      />
      <ShortcutsOverlay open={shortcutsOpen} onClose={() => setShortcutsOpen(false)} />
    </div>
  );
}
