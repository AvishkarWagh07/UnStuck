import { useState } from 'react';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import Notice from '../ui/Notice.jsx';
import { ArrowLeftIcon, CheckIcon, ChevronRightIcon, HelpIcon, SkipIcon } from '../ui/Icons.jsx';

// what the user can do with the step in front of them: tried it, need help,
// or skip. skip is not a made up endpoint, it uses the server's own answers

// which outcome means "I could not do this", null if neither is offered
function skipKeyFor(outcomes) {
  for (let i = 0; i < outcomes.length; i++) {
    if (outcomes[i].outcomeKey === 'stuck') return outcomes[i].outcomeKey;
  }
  for (let i = 0; i < outcomes.length; i++) {
    if (outcomes[i].outcomeKey === '__something_else') return outcomes[i].outcomeKey;
  }
  return null;
}

export default function StepActions({ outcomes, onSelect, onNeedHelp, busy }) {
  const [revealed, setRevealed] = useState(false);
  const [repeatKey, setRepeatKey] = useState(null);
  const [skipOpen, setSkipOpen] = useState(false);

  const isExplain = howItIsWorded(outcomes);
  const skipKey = skipKeyFor(outcomes);

  function pick(outcome) {
    // already tried once is not offered silently again
    if (outcome.alreadyTried) {
      setRepeatKey(outcome.outcomeKey);
      return;
    }
    setRepeatKey(null);
    onSelect(outcome);
  }

  function confirmSkip() {
    setSkipOpen(false);
    let chosen = null;
    for (let i = 0; i < outcomes.length; i++) {
      if (outcomes[i].outcomeKey === skipKey) chosen = outcomes[i];
    }
    if (chosen) onSelect(chosen);
  }

  return (
    <section aria-label="What happened with this step" className="mt-6">
      {!revealed ? (
        <>
          <div className="flex flex-wrap gap-2">
            <button type="button" className="btn-primary btn-lg" disabled={busy} onClick={() => setRevealed(true)}>
              <CheckIcon className="h-4 w-4" />
              I tried this
            </button>

            <button type="button" className="btn-outline" disabled={busy} onClick={onNeedHelp}>
              <HelpIcon className="h-4 w-4" />
              Need help
            </button>

            {skipKey ? (
              <button type="button" className="btn-quiet" disabled={busy} onClick={() => setSkipOpen(true)}>
                <SkipIcon className="h-4 w-4" />
                Skip this step
              </button>
            ) : null}
          </div>

          <p className="mt-3 caption">
            Answering is what decides the next step, so nothing moves until you do.
          </p>
        </>
      ) : (
        <div className="animate-fadeIn">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h3 className="font-display text-lg text-ink">What happened?</h3>
            <button type="button" className="btn-quiet btn-sm -mr-2" onClick={() => setRevealed(false)}>
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>
          </div>

          {repeatKey ? (
            <Notice tone="warning" className="mt-3" title="You reported this one already">
              <p>
                This app remembers what has been tried, and repeating the same action is unlikely to
                help. Choose another answer.
              </p>
              <button type="button" className="btn-outline btn-sm mt-3" onClick={() => setRepeatKey(null)}>
                Show the answers again
              </button>
            </Notice>
          ) : null}

          <ul className="mt-4 space-y-2">
            {outcomes.map((outcome) => (
              <li key={outcome.outcomeKey}>
                <button
                  type="button"
                  className="choice justify-between"
                  disabled={busy}
                  onClick={() => pick(outcome)}
                >
                  <span className="flex-1">{outcome.label}</span>
                  {outcome.alreadyTried ? <span className="badge">already tried</span> : null}
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
                </button>
              </li>
            ))}
          </ul>

          {busy ? <p className="mt-3 caption">Working out what to suggest next</p> : null}
        </div>
      )}

      <ConfirmDialog
        open={skipOpen}
        title="Skip this step?"
        confirmLabel="Skip it"
        cancelLabel="No, keep this step"
        tone="default"
        busy={busy}
        onCancel={() => setSkipOpen(false)}
        onConfirm={confirmSkip}
      >
        <p>
          Skipping records this step as one that did not work out, so the app will look for a
          different route. {isExplain ? 'The next step in your instructions is the one after this.' : 'Nothing that already failed will be offered again.'}
        </p>
      </ConfirmDialog>
    </section>
  );
}

// the skip confirmation says whether this is a list or a fault
function howItIsWorded(outcomes) {
  for (let i = 0; i < outcomes.length; i++) {
    if (outcomes[i].outcomeKey === 'stuck') return true;
  }
  return false;
}
