import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
      isActive
        ? 'bg-brand-500/15 text-brand-300'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
    }`;

  return (
    <nav className="sticky top-0 z-20 border-b border-slate-800 bg-slate-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <Link
          to="/"
          className="flex items-center gap-3 text-base font-bold tracking-tight text-white transition-colors hover:text-brand-300"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white shadow-glow">
            DL
          </span>
          DevLens
        </Link>

        <div className="flex items-center gap-2">
          <NavLink to="/" className={linkClass} end>
            Review
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/history" className={linkClass}>
              History
            </NavLink>
          )}

          {isAuthenticated ? (
            <div className="ml-4 flex items-center gap-4">
              <span className="hidden text-sm text-slate-400 sm:inline">{user?.name}</span>
              <button onClick={handleLogout} className="btn-ghost">
                Logout
              </button>
            </div>
          ) : (
            <div className="ml-4 flex items-center gap-2">
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-500"
              >
                Sign up
              </NavLink>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
