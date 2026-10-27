import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import { CATEGORIES } from '../services/categories.js';
import { isFinished, problemTitle, relativeTime, statusLabel, statusTone } from '../services/format.js';
import Notice from '../components/ui/Notice.jsx';
import { RowSkeleton } from '../components/ui/Skeleton.jsx';
import {
  ArrowRightIcon,
  ChevronRightIcon,
  PlusIcon,
  SearchIcon,
  SparkIcon,
  WrenchIcon
} from '../components/ui/Icons.jsx';

// home screen, job is to push you into starting a session

export default function Home() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/sessions');
      setSessions(response.data.sessions || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // only the two groups shown here, the rest lives on history
  const openSession = findOpenSession(sessions);
  // three is enough on the home page
  const recentlyResolved = findRecentlyResolved(sessions, 3);

  const firstName = user && user.displayName ? user.displayName.trim().split(' ')[0] : '';

  function startWithCategory(key) {
    navigate('/new', { state: { category: key } });
  }

  return (
    <div className="space-y-8">
      <header>
        {firstName ? <p className="caption">Hello, {firstName}</p> : null}
        <h1 className="mt-1 font-display text-fluid-h1 text-ink">What&rsquo;s going wrong?</h1>
        <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
          Tell us what is happening and you will get one step at a time. The next step depends on
          what actually happened when you tried the last one.
        </p>
      </header>

      {error ? (
        <Notice tone="danger" title="Your sessions could not be loaded" live="assertive">
          <p>{error}</p>
          <button type="button" className="btn-outline mt-3" onClick={load}>
            Try again
          </button>
        </Notice>
      ) : null}

      <Link
        to="/new"
        className="card-lift group flex items-center gap-5 p-6 transition-colors duration-150 hover:border-accent sm:p-8"
      >
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-pill bg-accent-soft text-accent">
          <SearchIcon className="h-6 w-6" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block font-display text-xl leading-snug text-ink sm:text-2xl">
            Describe a problem
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
            Or hand over instructions you already have, as a photo, as text, or by speaking them.
          </span>
        </span>
        <ArrowRightIcon className="hidden h-5 w-5 shrink-0 text-accent transition-transform duration-150 group-hover:translate-x-1 sm:block" />
      </Link>

      {/* unfinished session comes first */}
      {loading ? (
        <div className="space-y-3">
          <RowSkeleton />
        </div>
      ) : null}

      {!loading && openSession ? (
        <section aria-labelledby="continue-heading">
          <h2 id="continue-heading" className="font-display text-lg text-ink">
            Pick up where you left off
          </h2>
          <div className="card mt-4 flex flex-wrap items-start justify-between gap-5 p-5 sm:p-6">
            <div className="min-w-0 flex-1">
              <span className={'badge ' + statusTone(openSession.status)}>
                {statusLabel(openSession.status)}
              </span>
              <h3 className="mt-3 font-display text-lg leading-snug text-ink">
                {problemTitle(openSession.problemStatement)}
              </h3>
              <p className="mt-1 caption">
                {openSession.mode === 'explain' ? 'Instructions you handed over' : 'Diagnosing a problem'}
                {openSession.stepNumber > 0
                  ? ' \u00b7 step ' + openSession.stepNumber
                  : ''}
                {openSession.lastActivityAt ? ' \u00b7 last worked on ' + relativeTime(openSession.lastActivityAt) : ''}
              </p>
            </div>

            <Link className="btn-primary" to={'/session/' + openSession.id}>
              <WrenchIcon className="h-4 w-4" />
              Carry on
            </Link>
          </div>
        </section>
      ) : null}

      <section aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="font-display text-lg text-ink">
          A common place to start
        </h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          Picking one only fills in the box for you. Nothing is decided yet, and you can change it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {CATEGORIES.map((item) => (
            <button
              key={item.key}
              type="button"
              className="choice w-auto justify-start"
              onClick={() => startWithCategory(item.key)}
            >
              <item.Icon className="h-4 w-4 shrink-0 text-accent" />
              {item.label}
            </button>
          ))}
        </div>
      </section>

      {!loading && recentlyResolved.length > 0 ? (
        <section aria-labelledby="recent-heading">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 id="recent-heading" className="font-display text-lg text-ink">
              Recently sorted out
            </h2>
            <Link className="link text-sm" to="/history">
              All of your fixes
            </Link>
          </div>

          <ul className="mt-4 space-y-3">
            {recentlyResolved.map((item) => (
              <li key={item.id}>
                <Link
                  to={'/session/' + item.id}
                  className="card group flex items-center justify-between gap-4 p-5 transition-colors duration-150 hover:border-accent"
                >
                  <span className="min-w-0">
                    <span className="block font-display text-base leading-snug text-ink">
                      {problemTitle(item.problemStatement)}
                    </span>
                    <span className="mt-1 block caption">
                      Resolved
                      {item.lastActivityAt ? ' \u00b7 ' + relativeTime(item.lastActivityAt) : ''}
                    </span>
                  </span>
                  <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-faint transition-colors group-hover:text-accent" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="card flex flex-wrap items-center justify-between gap-5 bg-accent-soft/50 p-6">
        <div className="flex items-start gap-4">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pill bg-white text-accent">
            <SparkIcon className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg text-ink">How a session goes</h2>
            <p className="mt-1 max-w-prose text-sm leading-relaxed text-ink-soft">
              One instruction comes back at a time, with a plain reason for it. You say what
              happened, and anything that already failed is never offered again.
            </p>
          </div>
        </div>
        <Link className="btn-outline" to="/history">
          <PlusIcon className="h-4 w-4" />
          Your history
        </Link>
      </section>
    </div>
  );
}

// most recent session that is still going
function findOpenSession(list) {
  let best = null;
  for (let i = 0; i < list.length; i++) {
    const item = list[i];
    if (isFinished(item.status)) continue;
    const when = new Date(item.lastActivityAt || item.startedAt || 0).getTime();
    if (!best || when > new Date(best.lastActivityAt || best.startedAt || 0).getTime()) {
      best = item;
    }
  }
  return best;
}

function findRecentlyResolved(list, howMany) {
  const sorted = [];
  for (let i = 0; i < list.length; i++) {
    if (list[i].status === 'resolved') sorted.push(list[i]);
  }
  sorted.sort(function (a, b) {
    return (
      new Date(b.lastActivityAt || b.startedAt || 0).getTime() -
      new Date(a.lastActivityAt || a.startedAt || 0).getTime()
    );
  });
  return sorted.slice(0, howMany);
}
