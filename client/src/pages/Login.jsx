import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { getErrorMessage } from '../utils/errorMessage.js';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    // Clear a field's error as soon as the user starts correcting it.
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  };

  const validate = () => {
    const next = {};
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(form.email.trim()))
      next.email = 'Enter a valid email address, like you@example.com.';
    if (!form.password) next.password = 'Password is required.';
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await login(form.email, form.password);
      const redirectTo = location.state?.from?.pathname || '/';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (name) =>
    `field ${fieldErrors[name] ? 'border-red-500/60 hover:border-red-500 focus:border-red-500' : ''}`;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="surface p-8 sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-white">Welcome back</h1>
        <p className="mt-2 text-sm text-slate-400">Log in to continue reviewing your code.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate aria-busy={loading}>
          <div>
            <label htmlFor="email" className="mb-2 block text-sm font-medium text-slate-200">
              Email
            </label>
            <input
              id="email"
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className={inputClass('email')}
              placeholder="you@example.com"
              aria-invalid={fieldErrors.email ? true : undefined}
              aria-describedby={fieldErrors.email ? 'email-error' : undefined}
            />
            {fieldErrors.email && (
              <p id="email-error" className="mt-2 text-xs text-red-300">
                {fieldErrors.email}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-sm font-medium text-slate-200">
              Password
            </label>
            <input
              id="password"
              type="password"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className={inputClass('password')}
              placeholder="••••••••"
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={fieldErrors.password ? 'password-error' : undefined}
            />
            {fieldErrors.password && (
              <p id="password-error" className="mt-2 text-xs text-red-300">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {error && <Alert variant="error">{error}</Alert>}

          <button type="submit" disabled={loading} className="btn-primary w-full gap-3">
            {loading && <Spinner size="sm" />}
            {loading ? 'Logging in...' : 'Log in'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Don&apos;t have an account?{' '}
          <Link
            to="/register"
            className="font-semibold text-brand-400 transition-colors hover:text-brand-300"
          >
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
