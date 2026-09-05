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
    `px-3 py-2 rounded-md text-sm font-medium transition-colors ${
      isActive ? 'bg-brand-500/20 text-brand-300' : 'text-slate-300 hover:text-white hover:bg-slate-800'
    }`;

  return (
    <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur sticky top-0 z-20">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-white">
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-500 text-white">
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
            <div className="ml-4 flex items-center gap-3">
              <span className="hidden text-sm text-slate-400 sm:inline">
                {user?.name}
              </span>
              <button
                onClick={handleLogout}
                className="rounded-md bg-slate-800 px-3 py-2 text-sm font-medium text-slate-200 hover:bg-slate-700"
              >
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
                className="rounded-md bg-brand-500 px-3 py-2 text-sm font-medium text-white hover:bg-brand-600"
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
