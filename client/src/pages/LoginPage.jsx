import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import StatusMessage from '../components/layout/StatusMessage.jsx';
import Notice from '../components/ui/Notice.jsx';
import { CheckIcon } from '../components/ui/Icons.jsx';

// what an account gets you
const FOR_ACCOUNT_HOLDERS = [
  'Every session is saved to your account, so you can stop halfway and pick it up later.',
  'Progress belongs to the account, not the browser, so another device finds it too.',
  'Nothing is ever marked as fixed until you say it is.'
];

// sign in and sign up on one page
export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, login, register } = useAuth();

  const from = location.state && location.state.from ? location.state.from : '/app';
  const wantsSignup = Boolean(location.state && location.state.mode === 'signup');

  const [mode, setMode] = useState(wantsSignup ? 'signup' : 'signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    if (mode === 'signup' && displayName.trim().length < 2) {
      setError('Please enter a name with at least 2 characters.');
      return;
    }
    if (!email.trim() || email.indexOf('@') === -1) {
      setError('Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setBusy(true);
    setError('');
    try {
      if (mode === 'signup') {
        await register(displayName.trim(), email.trim(), password);
      } else {
        await login(email.trim(), password);
      }
      navigate(from, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return (
      <StatusMessage title="Checking your account">
        <p>One moment.</p>
      </StatusMessage>
    );
  }

  // already signed in, no need for the form
  if (user) {
    return <Navigate to="/app" replace />;
  }

  const isSignup = mode === 'signup';

  return (
    <div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-center lg:gap-12">
      {/* same cobalt look as the splash */}
      <aside className="panel-cobalt on-cobalt order-2 flex flex-col justify-center rounded-card p-6 sm:p-8 lg:order-1">
        <span className="font-brand text-2xl font-extrabold uppercase leading-none tracking-tight text-white">
          Un<span className="text-white/70">Stuck</span>
        </span>
        <p className="mt-3 font-display text-xl leading-snug text-white">
          One problem. One next step.
        </p>

        <ul className="mt-6 space-y-3">
          {FOR_ACCOUNT_HOLDERS.map((point) => (
            <li key={point} className="flex gap-2.5 text-sm leading-relaxed text-white/85">
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-white" />
              <span>{point}</span>
            </li>
          ))}
        </ul>

        <p className="mt-8 font-hand text-lg text-white/85">
          Stuck is a temporary state, not a destination.
        </p>
      </aside>

      <div className="order-1 lg:order-2">
        <h1 className="font-display text-fluid-h1 text-ink">
          {isSignup ? 'Create your account' : 'Welcome back'}
        </h1>
        <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
          {isSignup
            ? 'An account takes a moment, and it is what lets a half-finished fix wait for you.'
            : 'Sign in to carry on from where you left off.'}
        </p>

        <div className="mt-6 inline-flex gap-1 rounded-pill border border-line bg-white p-1" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={!isSignup}
            className={
              'rounded-pill px-4 py-2 text-sm transition-colors ' +
              (!isSignup ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink')
            }
            onClick={() => {
              setMode('signin');
              setError('');
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isSignup}
            className={
              'rounded-pill px-4 py-2 text-sm transition-colors ' +
              (isSignup ? 'bg-accent text-white' : 'text-ink-soft hover:text-ink')
            }
            onClick={() => {
              setMode('signup');
              setError('');
            }}
          >
            Create account
          </button>
        </div>

        <form className="card mt-6 space-y-5 p-6 sm:p-8" onSubmit={handleSubmit}>
          {isSignup ? (
            <div>
              <label className="field-label" htmlFor="display-name">
                Your name
              </label>
              <input
                id="display-name"
                className="field-input"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                autoComplete="name"
              />
            </div>
          ) : null}

          <div>
            <label className="field-label" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="field-input"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="field-input"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={isSignup ? 'new-password' : 'current-password'}
            />
            <p className="field-help">
              {isSignup ? 'At least 6 characters.' : 'Your password is only ever stored as a hash.'}
            </p>
          </div>

          {error ? (
            <Notice tone="danger" live="assertive">
              <p>{error}</p>
            </Notice>
          ) : null}

          <button type="submit" className="btn-primary btn-block btn-lg" disabled={busy}>
            {busy ? 'One moment' : isSignup ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <p className="mt-5 text-sm text-ink-soft">
          <Link className="link" to="/">
            Back to the front page
          </Link>
        </p>
      </div>
    </div>
  );
}
