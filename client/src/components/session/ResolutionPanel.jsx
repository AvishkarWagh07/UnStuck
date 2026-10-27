import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckIcon, ClockIcon, ListIcon, PrintIcon } from '../ui/Icons.jsx';
import { problemExtras, problemTitle } from '../../services/format.js';

// where a session ends up: waiting for the user, resolved, or not resolved
// "resolved" is never shown just because the steps ran out
export default function ResolutionPanel({ state, busy, onConfirm, onSummarize }) {
  const [summary, setSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError] = useState('');

  const waitingForUser = state.pendingConfirmation === true;
  const isExplain = state.mode === 'explain';
  const confirmed = state.status === 'resolved' && state.resolutionConfirmed === true;

  async function handleSummarize() {
    setSummaryLoading(true);
    setSummaryError('');
    try {
      const result = await onSummarize();
      if (result) setSummary(result);
      else setSummaryError('The summary could not be prepared just now.');
    } catch (err) {
      setSummaryError(err.message);
    } finally {
      setSummaryLoading(false);
    }
  }

  return (
    <section className="space-y-6">
      {waitingForUser ? (
        <div className="card overflow-hidden">
          <div className="bg-accent-soft px-6 py-8 sm:px-8">
            <div className="grid gap-2 md:grid-cols-2 md:items-baseline md:gap-8 lg:gap-12">
              <h2 className="font-display text-fluid-h2 leading-snug text-ink">
                {isExplain ? 'Did you get all the way to the end?' : 'Did that fix it?'}
              </h2>
              <p className="leading-relaxed text-ink-soft">
                {isExplain
                  ? 'Reaching the end of a list is not the same as finishing the job. Let us make sure.'
                  : "Let's make sure everything is working properly."}
              </p>
            </div>
          </div>

          <div className="border-t border-line p-6 sm:p-8">
            <p className="text-sm leading-relaxed text-ink-soft">
              {isExplain
                ? 'Try the thing you were following the instructions for. If it works, say so and this session is done.'
                : 'Check the original problem once more. If it is gone, say so and this session is done. If it is still there, the app carries on from here rather than starting again.'}
            </p>
            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="btn-primary btn-lg"
                disabled={busy}
                onClick={() => onConfirm(true)}
              >
                <CheckIcon className="h-4 w-4" />
                {isExplain ? 'Yes, I got to the end' : 'Yes, it works'}
              </button>
              <button
                type="button"
                className="btn-outline btn-lg"
                disabled={busy}
                onClick={() => onConfirm(false)}
              >
                <ClockIcon className="h-4 w-4" />
                {isExplain ? 'No, I am stuck part way' : 'Still broken'}
              </button>
            </div>
            <p className="mt-3 caption">
              Nothing is marked as fixed until you say it is.
            </p>
          </div>
        </div>
      ) : (
        <div className={'card overflow-hidden' + (confirmed ? ' border-success/40' : '')}>
          <div
            className={
              'px-6 py-8 sm:px-8 ' + (confirmed ? 'bg-success-soft' : 'bg-accent-soft')
            }
          >
            <div className="grid gap-2 md:grid-cols-2 md:items-baseline md:gap-8 lg:gap-12">
              <h2 className="font-display text-fluid-h2 leading-snug text-ink">
                {endHeading(state)}
              </h2>
              <p className="leading-relaxed text-ink-soft">{endMessage(state)}</p>
            </div>
          </div>

          <div className="border-t border-line p-6 sm:p-8">
            <h3 className="font-display text-lg text-ink">
              {isExplain ? 'What these instructions were for' : 'The problem you described'}
            </h3>
            <p className="mt-2 max-w-prose leading-relaxed text-ink">
              {problemTitle(state.problemStatement)}
            </p>
            {problemExtras(state.problemStatement) ? (
              <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
                {problemExtras(state.problemStatement)}
              </p>
            ) : null}

            <h3 className="mt-6 font-display text-lg text-ink">
              {confirmed
                ? isExplain
                  ? 'The steps you worked through'
                  : 'What worked'
                : 'What was tried'}
            </h3>
            {state.path.length > 0 ? (
              <ol className="mt-3 space-y-2">
                {state.path.map((item, index) => (
                  <li key={item.stepKey} className="flex gap-3 text-sm leading-relaxed text-ink-soft">
                    <span
                      className={
                        'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-pill text-xs ' +
                        (confirmed ? 'bg-success text-white' : 'bg-paper-dark text-ink-soft')
                      }
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <span className="text-ink">{item.title}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="mt-3 text-sm leading-relaxed text-ink-soft">
                No steps were shown, so there is nothing to work through here.
              </p>
            )}

            <div className="mt-6 rule pt-5">
              <button
                type="button"
                className="btn-outline"
                disabled={summaryLoading}
                onClick={handleSummarize}
              >
                <ListIcon className="h-4 w-4" />
                {summaryLoading ? 'Summarising' : 'Summarise this session'}
              </button>
              {summaryError ? (
                <p className="mt-2 text-sm text-danger">{summaryError}</p>
              ) : null}

              {summary ? (
                <div className="mt-3 rounded-card border border-line bg-accent-soft p-4">
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink">
                    {summary.summary}
                  </p>
                  {summary.stillUnresolved && summary.stillUnresolved.length > 0 ? (
                    <ul className="mt-2 space-y-1 text-sm text-ink-soft">
                      {summary.stillUnresolved.map((line) => (
                        <li key={line} className="flex gap-2">
                          <span aria-hidden="true">&middot;</span>
                          <span>{line}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <p className="mt-2 caption">
                    {summary.usedFallback
                      ? 'Written from the recorded attempts without the AI helper.'
                      : 'Written by the AI helper from the recorded attempts.'}
                  </p>
                </div>
              ) : null}
            </div>

            <div className="mt-6 flex flex-col gap-2 rule pt-5 sm:flex-row">
              {confirmed ? (
                <>
                  <button type="button" className="btn-primary" onClick={() => window.print()}>
                    <PrintIcon className="h-4 w-4" />
                    Save this solution
                  </button>
                  <Link className="btn-outline" to="/app">
                    Back to home
                  </Link>
                </>
              ) : (
                <>
                  <Link className="btn-primary" to="/new">
                    Start a new problem
                  </Link>
                  <Link className="btn-outline" to="/app">
                    Back to home
                  </Link>
                </>
              )}
              <Link className="btn-quiet" to="/history">
                Your fixes
              </Link>
            </div>

            {confirmed ? (
              <p className="mt-3 caption">
                Saving opens your browser&rsquo;s print or save dialogue, so you can keep the steps
                as a PDF.
              </p>
            ) : null}
          </div>
        </div>
      )}

      {state.notice && state.notice.kind === 'escalate' && !waitingForUser ? (
        <Notice tone="warning" title="Why the app stopped here">
          <p>{state.notice.message}</p>
        </Notice>
      ) : null}
    </section>
  );
}

function endHeading(state) {
  if (state.status === 'resolved' && state.resolutionConfirmed === true) {
    return state.mode === 'explain' ? 'Nice one - that is the whole job done' : 'That is it - sorted';
  }
  if (state.status === 'escalated') return 'This needs a different kind of help';
  if (state.status === 'unresolved') {
    return state.mode === 'explain' ? 'Stopped part way through' : 'Stopped without a fix';
  }
  return 'Session stopped';
}

function endMessage(state) {
  if (state.status === 'resolved' && state.resolutionConfirmed === true) {
    return state.mode === 'explain'
      ? 'You told us you got all the way to the end. Here is everything you worked through.'
      : 'You told us the problem is gone. Here is what got you there, in case it comes back.';
  }
  if (state.status === 'escalated') {
    return (
      (state.notice && state.notice.message) ||
      'The app has stopped rather than guess. Everything you already tried is kept below, so nothing is lost.'
    );
  }
  if (state.status === 'unresolved') {
    return state.mode === 'explain'
      ? 'The instructions did not get you to the end. Everything you worked through is kept below so you do not have to start again.'
      : 'The session ran out of safe things to try. Everything you tried is kept below so you do not have to start again.';
  }
  return 'You stopped the session. The record of what was tried is kept below.';
}
