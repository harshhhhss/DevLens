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
    `rounded-lg px-2.5 py-2 text-sm font-medium transition-colors sm:px-4 ${
      isActive
        ? 'bg-accent/15 text-accent'
        : 'text-muted hover:bg-raised-hover hover:text-fg'
    }`;

  return (
    <nav className="sticky top-0 z-20 border-b border-edge bg-canvas/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-3 px-4 py-4 sm:px-6">
        <Link
          to="/"
          className="flex items-center gap-3 text-base font-bold tracking-tight text-white transition-colors hover:text-accent"
        >
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-canvas">
            DL
          </span>
          DevLens
        </Link>

        <div className="flex flex-wrap items-center gap-x-1 gap-y-2 sm:gap-x-2">
          <NavLink to="/" className={linkClass} end>
            Review
          </NavLink>
          {isAuthenticated && (
            <NavLink to="/history" className={linkClass}>
              History
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/insights" className={linkClass}>
              Patterns
            </NavLink>
          )}
          {isAuthenticated && (
            <NavLink to="/github" className={linkClass}>
              GitHub
            </NavLink>
          )}

          {isAuthenticated ? (
            <div className="flex items-center gap-3 sm:ml-4 sm:gap-4">
              <span className="hidden text-sm text-muted sm:inline">{user?.name}</span>
              <button onClick={handleLogout} className="btn-ghost">
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:ml-4">
              <NavLink to="/login" className={linkClass}>
                Login
              </NavLink>
              <NavLink
                to="/register"
                className="rounded-lg bg-fg px-4 py-2 text-sm font-semibold text-canvas transition-colors hover:bg-fg-hover"
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
