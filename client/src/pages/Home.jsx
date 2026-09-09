import React, { useState } from 'react';
import CodeInput from '../components/CodeInput.jsx';
import LanguageSelect from '../components/LanguageSelect.jsx';
import ReviewResult from '../components/ReviewResult.jsx';
import Alert from '../components/Alert.jsx';
import Spinner from '../components/Spinner.jsx';
import { submitReview } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { getErrorMessage } from '../utils/errorMessage.js';
import { Link } from 'react-router-dom';

const MAX_CODE_LENGTH = 20000;

export default function Home() {
  const { isAuthenticated } = useAuth();
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [result, setResult] = useState(null);
  // Language the displayed result was actually reviewed as, so changing the
  // dropdown afterwards does not re-highlight an existing result incorrectly.
  const [resultLanguage, setResultLanguage] = useState('javascript');

  // A loaded file sets the language from its extension, so the dropdown does
  // not have to be corrected by hand.
  const handleFileLoaded = ({ language: detected, warning, file }) => {
    setError('');
    if (detected) {
      setLanguage(detected);
      setSuccess(`Loaded ${file.name} as ${detected}.`);
    } else {
      setSuccess('');
      setError(warning);
    }
  };

  const handleFileError = (message) => {
    setSuccess('');
    setError(message);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!code.trim()) {
      setError('Please paste some code before running a review.');
      return;
    }

    if (code.length > MAX_CODE_LENGTH) {
      setError(
        `That snippet is ${code.length.toLocaleString()} characters. Please trim it to ${MAX_CODE_LENGTH.toLocaleString()} or fewer.`
      );
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
      setResultLanguage(data.language || language);
      setSuccess('Review complete.');
    } catch (err) {
      setError(getErrorMessage(err, 'Something went wrong while reviewing your code.'));
    } finally {
      setLoading(false);
    }
  };

  const charCount = code.length;
  const overLimit = charCount > MAX_CODE_LENGTH;

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-white">AI Code Review</h1>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-slate-400">
          Paste your code or upload a file, and get an instant structured review powered by Gemini.
        </p>
      </div>

      {!isAuthenticated && (
        <Alert variant="warning" className="mb-8">
          You need an account to run reviews.{' '}
          <Link to="/login" className="font-semibold text-yellow-100 underline underline-offset-2">
            Log in
          </Link>{' '}
          or{' '}
          <Link
            to="/register"
            className="font-semibold text-yellow-100 underline underline-offset-2"
          >
            sign up
          </Link>
          .
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" aria-busy={loading}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label htmlFor="code-input" className="text-sm font-semibold text-slate-200">
            Your Code
          </label>
          <div className="flex items-center gap-4">
            <span
              className={`text-xs tabular-nums ${overLimit ? 'text-red-300' : 'text-slate-400'}`}
            >
              {charCount.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()}
            </span>
            <LanguageSelect value={language} onChange={setLanguage} />
          </div>
        </div>

        <CodeInput
          id="code-input"
          value={code}
          onChange={setCode}
          invalid={overLimit}
          onFileLoaded={handleFileLoaded}
          onFileError={handleFileError}
        />

        {error && <Alert variant="error">{error}</Alert>}
        {success && (
          <Alert variant="success" onDismiss={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full gap-3 sm:w-auto"
          aria-label={loading ? 'Analyzing your code' : 'Review code'}
        >
          {loading && <Spinner size="sm" />}
          {loading ? 'Analyzing...' : 'Review Code'}
        </button>
      </form>

      {loading && (
        <div
          role="status"
          aria-live="polite"
          className="mt-16 flex flex-col items-center justify-center gap-4 text-slate-400"
        >
          <Spinner size="lg" className="text-brand-500" />
          <p className="text-sm">DevLens is analyzing your code. This usually takes a few seconds.</p>
        </div>
      )}

      {result && !loading && (
        <div className="mt-16 space-y-8">
          <ReviewResult result={result} language={resultLanguage} />
        </div>
      )}
    </div>
  );
}
