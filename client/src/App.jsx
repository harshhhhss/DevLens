import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Home from './pages/Home.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import History from './pages/History.jsx';
import PublicReview from './pages/PublicReview.jsx';
import { useAuth } from './context/AuthContext.jsx';

function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-6 text-center">
      <p className="text-3xl font-bold tracking-tight text-white">Page not found</p>
      <p className="mt-3 text-sm text-slate-400">
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

  // The landing page and shared reviews carry their own headers, and shared
  // reviews are read by people with no account at all.
  const isLanding = location.pathname === '/' && !isAuthenticated;
  const isPublicReview = location.pathname.startsWith('/public/review/');
  const showAppNav = !isLanding && !isPublicReview;

  return (
    <div className="min-h-screen bg-slate-950">
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
          <Route path="*" element={<NotFound />} />
        </Routes>
      </ErrorBoundary>
    </div>
  );
}
