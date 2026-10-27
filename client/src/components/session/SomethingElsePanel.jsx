import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import Notice from '../ui/Notice.jsx';
import { ArrowLeftIcon, CloseIcon } from '../ui/Icons.jsx';
import { useState } from 'react';

// the extra door when none of the answers match - go back or stop
export default function SomethingElsePanel({ canGoBack, onBack, onAbandon, busy, onClose }) {
  const [stopOpen, setStopOpen] = useState(false);

  return (
    <section className="card step-enter overflow-hidden">
      <header className="flex items-start gap-3 border-b border-line bg-paper px-5 py-3.5">
        <h3 className="flex-1 font-display text-lg text-ink">None of these match</h3>
        <button
          type="button"
          className="-mr-2 rounded-pill p-1.5 text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
          onClick={onClose}
          aria-label="Close this panel"
        >
          <CloseIcon className="h-4 w-4" />
        </button>
      </header>

      <div className="space-y-4 p-5">
        <p className="max-w-prose text-sm leading-relaxed text-ink-soft">
          An unexpected result is still useful. There is no need to guess an answer that is not
          true for you, pick one of the ways forward below instead.
        </p>

        <div className="flex flex-col gap-2">
          {canGoBack ? (
            <button
              type="button"
              className="btn-outline justify-start"
              disabled={busy}
              onClick={onBack}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Read the previous step again
            </button>
          ) : null}

          <button
            type="button"
            className="btn-danger justify-start"
            disabled={busy}
            onClick={() => setStopOpen(true)}
          >
            Stop here and keep what I have tried
          </button>
        </div>

        <Notice tone="neutral">
          <p>
            Stopping does not delete anything. The steps you worked through stay in your fixes so
            you can pick the problem up again later.
          </p>
        </Notice>
      </div>

      <ConfirmDialog
        open={stopOpen}
        title="Stop this session?"
        confirmLabel="Stop the session"
        cancelLabel="Keep going"
        tone="danger"
        busy={busy}
        onCancel={() => setStopOpen(false)}
        onConfirm={() => {
          setStopOpen(false);
          onAbandon();
        }}
      >
        <p>
          The session will be marked as stopped. Everything you tried is kept, so you can carry on
          from where you are rather than starting again.
        </p>
      </ConfirmDialog>
    </section>
  );
}
