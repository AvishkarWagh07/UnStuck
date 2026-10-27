import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { formatDate } from '../services/format.js';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import Notice from '../components/ui/Notice.jsx';
import { CheckIcon, ListIcon, PowerIcon, ShieldIcon, UserIcon } from '../components/ui/Icons.jsx';

// settings page. no theme switch on purpose, the app only has one theme

export default function SettingsPage() {
  const { user, logout, savePreferences } = useAuth();
  const navigate = useNavigate();

  const [sessionCount, setSessionCount] = useState(null);
  const [countError, setCountError] = useState('');
  const [savingMotion, setSavingMotion] = useState(false);
  const [motionError, setMotionError] = useState('');
  const [signOutOpen, setSignOutOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // reuse the sessions call instead of adding a count endpoint
  useEffect(
    function () {
      let alive = true;

      async function loadCount() {
        try {
          const response = await api.get('/sessions');
          if (alive) setSessionCount(response.data.sessions.length);
        } catch (err) {
          if (alive) setCountError(err.message);
        }
      }

      loadCount();
      return function () {
        alive = false;
      };
    },
    []
  );

  if (!user) return null;

  const wantsStill = Boolean(user.preferences && user.preferences.reducedMotion);

  async function toggleMotion() {
    setSavingMotion(true);
    setMotionError('');
    try {
      await savePreferences({ reducedMotion: !wantsStill });
    } catch (err) {
      setMotionError(err.message);
    } finally {
      setSavingMotion(false);
    }
  }

  async function confirmSignOut() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    navigate('/', { replace: true });
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="font-display text-fluid-h1 text-ink">Settings</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-ink-soft">
          Your account, and what this app keeps about your sessions.
        </p>
      </header>

      <section className="card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5 sm:px-6">
          <UserIcon className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg text-ink">Your account</h2>
        </header>

        <dl className="divide-y divide-line">
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 sm:px-6">
            <dt className="text-sm text-ink-soft">Name</dt>
            <dd className="text-sm text-ink">{user.displayName}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 sm:px-6">
            <dt className="text-sm text-ink-soft">Email</dt>
            <dd className="break-all text-sm text-ink">{user.email}</dd>
          </div>
          <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 py-4 sm:px-6">
            <dt className="text-sm text-ink-soft">Member since</dt>
            <dd className="text-sm text-ink">{formatDate(user.createdAt) || 'Not recorded'}</dd>
          </div>
        </dl>

        <div className="border-t border-line px-5 py-4 sm:px-6">
          <Notice tone="info">
            <p>
              Your name and email are the whole of your profile. Editing them is not built yet, so
              there is no button here that would not work.
            </p>
          </Notice>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5 sm:px-6">
          <CheckIcon className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg text-ink">How the app looks</h2>
        </header>

        <div className="px-5 py-5 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">Reduce movement</p>
              <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
                Stops the panels sliding in and anything else that moves. Saved to your account, so
                it follows you to another device.
              </p>
            </div>

            <button
              type="button"
              role="switch"
              aria-checked={wantsStill}
              className={
                'relative h-8 w-14 shrink-0 rounded-pill border transition-colors ' +
                (wantsStill ? 'border-accent bg-accent' : 'border-line-strong bg-paper-dark')
              }
              onClick={toggleMotion}
              disabled={savingMotion}
            >
              <span className="sr-only">Reduce movement</span>
              <span
                className={
                  'absolute top-1 h-6 w-6 rounded-pill bg-white transition-all ' +
                  (wantsStill ? 'left-7' : 'left-1')
                }
              />
            </button>
          </div>

          {savingMotion ? <p className="mt-3 caption">Saving this setting</p> : null}
          {motionError ? (
            <p className="mt-3 text-sm text-danger" role="alert">
              {motionError}
            </p>
          ) : null}

          <div className="mt-5 rule pt-5">
            <p className="text-sm font-medium text-ink">Theme</p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
              UnStuck has one theme: cobalt blue on warm cream. There is no dark mode to switch to,
              so no control for it is shown here.
            </p>
          </div>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5 sm:px-6">
          <ShieldIcon className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg text-ink">What is kept, and for how long</h2>
        </header>

        <div className="space-y-4 px-5 py-5 sm:px-6">
          <ul className="space-y-3">
            <li className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-accent" />
              <span>
                <span className="text-ink">Your sessions.</span> The problem you described, every step
                you were shown, and the answer you gave to each one. This is what lets the app avoid
                repeating a step that already failed.
              </span>
            </li>
            <li className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-accent" />
              <span>
                <span className="text-ink">Feedback you send.</span> Kept against the session it was
                about, so it can be read alongside the steps it describes.
              </span>
            </li>
            <li className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-accent" />
              <span>
                <span className="text-ink">A photo you hand over.</span> Read once into a list of
                steps and then dropped. Text you type for that same feature is kept, so the steps can
                be shown again later.
              </span>
            </li>
            <li className="flex gap-3 text-sm leading-relaxed text-ink-soft">
              <span aria-hidden="true" className="mt-2 h-1.5 w-1.5 shrink-0 rounded-pill bg-accent" />
              <span>
                <span className="text-ink">Your password.</span> Stored only as a hash. It is never
                readable, by this app or by anyone else.
              </span>
            </li>
          </ul>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5 sm:px-6">
          <ListIcon className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg text-ink">Your fixes</h2>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <div>
            <p className="text-sm text-ink">
              {sessionCount === null && !countError
                ? 'Counting your sessions'
                : countError
                  ? 'The count could not be loaded'
                  : sessionCount + (sessionCount === 1 ? ' session saved' : ' sessions saved')}
            </p>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
              Every session is kept so you can go back to the exact step you left, on any device.
            </p>
          </div>

          <Link className="btn-outline" to="/history">
            Open your fixes
          </Link>
        </div>
      </section>

      <section className="card overflow-hidden">
        <header className="flex items-center gap-3 border-b border-line bg-paper px-5 py-3.5 sm:px-6">
          <PowerIcon className="h-5 w-5 text-accent" />
          <h2 className="font-display text-lg text-ink">Sign out</h2>
        </header>

        <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-6">
          <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
            Signing out clears the session on this device. Nothing you have saved is deleted.
          </p>
          <button type="button" className="btn-danger" onClick={() => setSignOutOpen(true)}>
            Sign out
          </button>
        </div>
      </section>

      <ConfirmDialog
        open={signOutOpen}
        title="Sign out of UnStuck?"
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        tone="danger"
        busy={signingOut}
        onCancel={() => setSignOutOpen(false)}
        onConfirm={confirmSignOut}
      >
        <p>
          You will be taken back to the front page. Your sessions stay on your account, and signing
          back in brings them all back.
        </p>
      </ConfirmDialog>
    </div>
  );
}
