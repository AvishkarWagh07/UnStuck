import { useEffect, useState } from 'react';
import Skeleton from '../ui/Skeleton.jsx';
import { HelpIcon, SparkIcon } from '../ui/Icons.jsx';

// opened by "need help". rewrites the current instruction in simpler words,
// never adds or removes an action - only the wording changes
export default function ExplainPanel({ onExplain, busy }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const result = await onExplain('simple');
      if (result) setData(result);
      else setError('The simpler wording could not be prepared just now.');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  // load once, re-running on every render would burn AI allowance
  useEffect(
    function () {
      load();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <section className="card step-enter overflow-hidden">
      <header className="flex items-center gap-3 border-b border-line bg-accent-soft px-5 py-3.5">
        <HelpIcon className="h-5 w-5 shrink-0 text-accent" />
        <h3 className="flex-1 font-display text-lg text-ink">The same step, in simpler words</h3>
        {error ? (
          <button type="button" className="btn-quiet btn-sm -mr-2" onClick={load} disabled={loading || busy}>
            Try again
          </button>
        ) : null}
      </header>

      <div className="p-5">
        {loading ? <Skeleton lines={3} /> : null}

        {error && !loading ? (
          <p className="text-sm leading-relaxed text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {data && !loading ? (
          <>
            <p className="max-w-prose whitespace-pre-line text-fluid-body leading-relaxed text-ink">
              {data.explanation}
            </p>
            <p className="mt-4 caption">
              {data.usedFallback
                ? 'Rewritten without the AI helper. The action itself is unchanged.'
                : 'Rewritten by the AI helper. The action itself is unchanged.'}
            </p>
          </>
        ) : null}
      </div>

      <footer className="border-t border-line bg-paper px-5 py-3">
        <p className="flex items-center gap-2 text-xs leading-relaxed text-ink-soft">
          <SparkIcon className="h-3.5 w-3.5 shrink-0 text-accent" />
          Nothing new has been recommended here, only the wording changed.
        </p>
      </footer>
    </section>
  );
}
