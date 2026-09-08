import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { getErrorMessage } from '../utils/errorMessage.js';

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [created, setCreated] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setFieldErrors((prev) => (prev[name] ? { ...prev, [name]: '' } : prev));
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Please enter your name.';
    if (!form.email.trim()) next.email = 'Email is required.';
    else if (!EMAIL_PATTERN.test(form.email.trim()))
      next.email = 'Enter a valid email address, like you@example.com.';
    if (!form.password) next.password = 'Password is required.';
    else if (form.password.length < MIN_PASSWORD_LENGTH)
      next.password = `Password must be at least ${MIN_PASSWORD_LENGTH} characters (currently ${form.password.length}).`;
    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      // Brief confirmation so account creation does not feel abrupt, then on
      // to the review page.
      setCreated(true);
      setTimeout(() => navigate('/', { replace: true }), 600);
    } catch (err) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      setLoading(false);
    }
  };

  const inputClass = (name) =>
    `field ${fieldErrors[name] ? 'border-red-500/60 hover:border-red-500 focus:border-red-500' : ''}`;

  const passwordStrength = Math.min(form.password.length / 12, 1) * 100;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-6 py-16">
      <div className="surface p-8 sm:p-10">
        <h1 className="text-2xl font-bold tracking-tight text-white">Create your account</h1>
        <p className="mt-2 text-sm text-slate-400">Start getting AI-powered code reviews.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6" noValidate aria-busy={loading}>
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium text-slate-200">
              Name
            </label>
            <input
              id="name"
              type="text"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              className={inputClass('name')}
              placeholder="Jane Doe"
              aria-invalid={fieldErrors.name ? true : undefined}
              aria-describedby={fieldErrors.name ? 'name-error' : undefined}
            />
            {fieldErrors.name && (
              <p id="name-error" className="mt-2 text-xs text-red-300">
                {fieldErrors.name}
              </p>
            )}
          </div>

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
              autoComplete="new-password"
              value={form.password}
              onChange={handleChange}
              className={inputClass('password')}
              placeholder="At least 6 characters"
              aria-invalid={fieldErrors.password ? true : undefined}
              aria-describedby={
                fieldErrors.password ? 'password-error password-hint' : 'password-hint'
              }
            />
            {form.password && !fieldErrors.password && (
              <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-slate-800">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    form.password.length < MIN_PASSWORD_LENGTH ? 'bg-red-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${passwordStrength}%` }}
                />
              </div>
            )}
            <p id="password-hint" className="mt-2 text-xs text-slate-400">
              Use at least {MIN_PASSWORD_LENGTH} characters.
            </p>
            {fieldErrors.password && (
              <p id="password-error" className="mt-1 text-xs text-red-300">
                {fieldErrors.password}
              </p>
            )}
          </div>

          {error && <Alert variant="error">{error}</Alert>}
          {created && <Alert variant="success">Account created. Taking you to DevLens...</Alert>}

          <button type="submit" disabled={loading} className="btn-primary w-full gap-3">
            {loading && !created && <Spinner size="sm" />}
            {created ? 'Account created' : loading ? 'Creating account...' : 'Sign up'}
          </button>
        </form>

        <p className="mt-8 text-center text-sm text-slate-400">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-brand-400 transition-colors hover:text-brand-300"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
