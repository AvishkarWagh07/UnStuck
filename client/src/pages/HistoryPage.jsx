import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import {
  categoryFromText,
  problemTitle,
  relativeTime,
  statusLabel,
  statusTone
} from '../services/format.js';
import { categoryByLabel } from '../services/categories.js';
import EmptyState from '../components/ui/EmptyState.jsx';
import Notice from '../components/ui/Notice.jsx';
import { RowSkeleton } from '../components/ui/Skeleton.jsx';
import { ChevronRightIcon, FilterIcon, ListIcon, OtherIcon, SearchIcon } from '../components/ui/Icons.jsx';

// history screen, list comes straight from the server, no local copy

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'resolved', label: 'Resolved' },
  { key: 'in_progress', label: 'In progress' },
  { key: 'unresolved', label: 'Unresolved' }
];

// paused still counts as in progress, they just stepped away
function bucketFor(status) {
  if (status === 'resolved') return 'resolved';
  if (status === 'in_progress' || status === 'paused') return 'in_progress';
  return 'unresolved';
}

export default function HistoryPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/sessions');
      setSessions(response.data.sessions);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // counts for the filter row
  const counts = useMemo(
    function () {
      const tally = { all: sessions.length, resolved: 0, in_progress: 0, unresolved: 0 };
      for (let i = 0; i < sessions.length; i++) {
        tally[bucketFor(sessions[i].status)] += 1;
      }
      return tally;
    },
    [sessions]
  );

  const shown = useMemo(
    function () {
      const needle = query.trim().toLowerCase();
      const result = [];
      for (let i = 0; i < sessions.length; i++) {
        const item = sessions[i];
        if (filter !== 'all' && bucketFor(item.status) !== filter) continue;
        if (needle && String(item.problemStatement || '').toLowerCase().indexOf(needle) === -1) continue;
        result.push(item);
      }
      return result;
    },
    [sessions, filter, query]
  );

  // five is about when search starts being useful
  const searchWorthShowing = sessions.length >= 5;

  return (
    <div className="space-y-6 sm:space-y-8">
      <header>
        <h1 className="font-display text-fluid-h1 text-ink">Your fixes</h1>
        <p className="mt-2 max-w-prose leading-relaxed text-ink-soft">
          A history of your troubleshooting sessions.
        </p>
      </header>

      {error ? (
        <Notice tone="danger" title="Could not load your fixes" live="assertive">
          <p>{error}</p>
          <button type="button" className="btn-outline btn-sm mt-3" onClick={loadSessions}>
            Try again
          </button>
        </Notice>
      ) : null}

      {loading ? (
        <div className="space-y-3">
          <RowSkeleton />
          <RowSkeleton />
          <RowSkeleton />
        </div>
      ) : null}

      {!loading && sessions.length === 0 && !error ? (
        <div className="card">
          <EmptyState
            title="Nothing here yet"
            action={
              <Link className="btn-primary" to="/new">
                Start fixing
              </Link>
            }
          >
            <p>
              Once you describe a problem, or hand over a set of instructions, it is kept here so
              you can pick it up again on any device.
            </p>
          </EmptyState>
        </div>
      ) : null}

      {!loading && sessions.length > 0 ? (
        <>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter your fixes">
              <FilterIcon className="h-4 w-4 text-ink-faint" />
              {FILTERS.map((item) => {
                const active = filter === item.key;
                return (
                  <button
                    key={item.key}
                    type="button"
                    aria-pressed={active}
                    className={active ? 'btn-primary btn-sm' : 'btn-outline btn-sm'}
                    onClick={() => setFilter(item.key)}
                  >
                    {item.label}
                    <span className={'ml-1 ' + (active ? 'text-white/80' : 'text-ink-faint')}>
                      {counts[item.key]}
                    </span>
                  </button>
                );
              })}
            </div>

            {searchWorthShowing ? (
              <div className="relative">
                <SearchIcon className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
                <input
                  type="search"
                  className="field-input pl-11"
                  placeholder="Search your fixes"
                  aria-label="Search your fixes"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
              </div>
            ) : null}
          </div>

          {shown.length === 0 ? (
            <div className="card">
              <EmptyState
                title="Nothing matched"
                action={
                  <button
                    type="button"
                    className="btn-outline"
                    onClick={() => {
                      setQuery('');
                      setFilter('all');
                    }}
                  >
                    Show everything
                  </button>
                }
              >
                <p>No session matches this filter and search. Your records are still here.</p>
              </EmptyState>
            </div>
          ) : (
            <ul className="space-y-3">
              {shown.map((item) => (
                <li key={item.id}>
                  <SessionCard item={item} />
                </li>
              ))}
            </ul>
          )}
        </>
      ) : null}
    </div>
  );
}

function SessionCard({ item }) {
  const navigate = useNavigate();
  const title = problemTitle(item.problemStatement) || 'Session';
  const picked = categoryByLabel(categoryFromText(item.problemStatement));
  const Icon = picked ? picked.Icon : item.mode === 'explain' ? ListIcon : OtherIcon;
  const finished = item.status === 'resolved' || item.status === 'unresolved' || item.status === 'abandoned' || item.status === 'escalated';

  return (
    <button
      type="button"
      className="card flex w-full items-center gap-4 p-4 text-left transition-colors hover:border-accent hover:bg-accent-soft/30 sm:p-5"
      onClick={() => navigate('/session/' + item.id)}
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-card border border-line bg-paper text-ink-soft">
        <Icon className="h-5 w-5" />
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate font-display text-lg leading-snug text-ink">{title}</span>

        <span className="mt-1.5 flex flex-wrap items-center gap-2">
          <span className={'badge ' + statusTone(item.status)}>{statusLabel(item.status)}</span>
          {item.mode === 'explain' ? (
            <span className="badge">
              <ListIcon className="h-3.5 w-3.5" />
              From instructions
            </span>
          ) : null}
          {picked ? <span className="badge">{picked.label}</span> : null}
        </span>

        <span className="mt-1.5 block caption">
          {finished
            ? 'Last updated ' + relativeTime(item.completedAt || item.lastActivityAt)
            : 'Last updated ' + relativeTime(item.lastActivityAt)}
          {item.stepNumber > 0
            ? ' \u00b7 ' + item.stepNumber + (item.stepNumber === 1 ? ' step' : ' steps')
            : ''}
        </span>
      </span>

      <ChevronRightIcon className="h-5 w-5 shrink-0 text-ink-faint" />
    </button>
  );
}
