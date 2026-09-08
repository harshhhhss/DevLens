import React from 'react';
import { Routes, Route, useLocation, Link } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import History from './pages/History.jsx';

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

export default function App() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-slate-950">
      <Navbar />
      {/* Keyed by path so a crashed route recovers when the user navigates away,
          and so a page-level crash leaves the navbar usable. */}
      <ErrorBoundary key={location.pathname}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
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
