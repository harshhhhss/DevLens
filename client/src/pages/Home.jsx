import React, { useState } from 'react';
import CodeInput from '../components/CodeInput.jsx';
import LanguageSelect from '../components/LanguageSelect.jsx';
import ReviewResult from '../components/ReviewResult.jsx';
import { submitReview } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!code.trim()) {
      setError('Please paste some code to review.');
      return;
    }

    if (!isAuthenticated) {
      setError('Please log in to run a review.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data } = await submitReview({ code, language });
      setResult(data.result);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while reviewing your code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-white">AI Code Review</h1>
        <p className="mt-2 text-slate-400">
          Paste your code, pick a language, and get an instant structured review powered by Gemini.
        </p>
      </div>

      {!isAuthenticated && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-3 text-center text-sm text-yellow-300">
          You need an account to run reviews.{' '}
          <Link to="/login" className="font-semibold underline">
            Log in
          </Link>{' '}
          or{' '}
          <Link to="/register" className="font-semibold underline">
            sign up
          </Link>
          .
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-300">Your Code</label>
          <LanguageSelect value={language} onChange={setLanguage} />
        </div>

        <CodeInput value={code} onChange={setCode} />

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {loading ? 'Analyzing...' : 'Review Code'}
        </button>
      </form>

      {loading && (
        <div className="mt-10 flex flex-col items-center justify-center gap-3 text-slate-400">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
          <p>DevLens is analyzing your code...</p>
        </div>
      )}

      {result && !loading && (
        <div className="mt-10">
          <ReviewResult result={result} language={language} />
        </div>
      )}
    </div>
  );
}
