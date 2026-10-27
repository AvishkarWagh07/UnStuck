import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useSession from '../hooks/useSession.js';
import { isFinished, problemTitle, problemExtras, statusLabel, statusTone } from '../services/format.js';
import StatusMessage, { BackToHome } from '../components/layout/StatusMessage.jsx';
import ProgressTracker from '../components/ui/ProgressTracker.jsx';
import Notice from '../components/ui/Notice.jsx';
import { StepSkeleton } from '../components/ui/Skeleton.jsx';
import StepCard from '../components/session/StepCard.jsx';
import StepActions from '../components/session/StepActions.jsx';
import ExplainPanel from '../components/session/ExplainPanel.jsx';
import RecoveryNotice from '../components/session/RecoveryNotice.jsx';
import AttemptTimeline from '../components/session/AttemptTimeline.jsx';
import SomethingElsePanel from '../components/session/SomethingElsePanel.jsx';
import ResolutionPanel from '../components/session/ResolutionPanel.jsx';
import FeedbackForm from '../components/feedback/FeedbackForm.jsx';
import { ArrowLeftIcon, InfoIcon, SparkIcon } from '../components/ui/Icons.jsx';

// the main session screen, one step at a time. four screens of the design are
// really just states of the same session so they share this one route
export default function SessionPage() {
  const { id } = useParams();
  const session = useSession(id);
  const [showSomethingElse, setShowSomethingElse] = useState(false);
  const [showExplain, setShowExplain] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);

  const stepKey = session.state && session.state.step ? session.state.step.stepKey : null;

  // new step, close the extra panels
  useEffect(() => {
    setShowSomethingElse(false);
    setShowExplain(false);
  }, [stepKey]);

  if (session.loading) {
    return (
      <div className="space-y-6">
        <StepSkeleton />
        <StepSkeleton />
      </div>
    );
  }

  if (!session.state) {
    return (
      <StatusMessage
        tone="error"
        title="This session is not available"
        action={<BackToHome />}
      >
        <p>{session.error || 'This session could not be loaded.'}</p>
      </StatusMessage>
    );
  }

  const state = session.state;
  // waiting for the user to confirm a fix counts as finished here too
  const finished = isFinished(state.status) || state.pendingConfirmation === true;
  const isExplain = state.mode === 'explain';
  const warnings = state.planWarnings || [];
  const title = problemTitle(state.problemStatement);
  const extras = problemExtras(state.problemStatement);

  async function handleOutcome(outcome) {
    await session.sendOutcome(outcome.outcomeKey);
  }

  async function handleFeedback(payload) {
    const result = await session.sendFeedback(payload);
    if (result) setFeedbackSent(true);
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      <header className="space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="caption">{isExplain ? 'Working through your instructions' : 'Your session'}</p>
            <h1 className="mt-1 font-display text-fluid-h2 leading-snug text-ink">{title}</h1>
          </div>

          <span className={'badge ' + statusTone(state.status)}>{statusLabel(state.status)}</span>
        </div>

        {extras ? (
          <details className="group">
            <summary className="cursor-pointer list-none text-sm text-ink-soft hover:text-ink">
              <span className="underline decoration-line underline-offset-2 group-open:hidden">
                Show the details you added
              </span>
              <span className="hidden underline decoration-line underline-offset-2 group-open:inline">
                Hide the details you added
              </span>
            </summary>
            <p className="mt-2 whitespace-pre-line rounded-card border border-line bg-white p-4 text-sm leading-relaxed text-ink-soft">
              {extras}
            </p>
          </details>
        ) : null}
      </header>

      {finished ? null : (
        <ProgressTracker
          mode={state.mode}
          status={state.status}
          pendingConfirmation={state.pendingConfirmation}
          attemptsCount={state.attemptsCount}
        />
      )}

      {session.error ? (
        <Notice tone="danger" title="That did not go through" live="assertive">
          <p>{session.error}</p>
          <button type="button" className="btn-outline btn-sm mt-3" onClick={session.reload}>
            Try loading the session again
          </button>
        </Notice>
      ) : null}

      <RecoveryNotice notice={state.notice} />

      {warnings.length > 0 ? (
        <Notice tone="info" title="What was left out of these instructions">
          <ul className="mt-1 space-y-1">
            {warnings.map((warning) => (
              <li key={warning} className="flex gap-2">
                <span aria-hidden="true">&middot;</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}

      {finished ? (
        <>
          <ResolutionPanel
            state={state}
            busy={session.busy}
            onConfirm={session.confirm}
            onSummarize={session.summarize}
          />
          <FeedbackForm
            path={state.path}
            busy={session.busy}
            onSubmit={handleFeedback}
            submitted={feedbackSent}
          />
        </>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_19rem] lg:gap-8">
          <div className="space-y-5">
            {state.status === 'paused' ? (
              <ResumeCard onResume={session.resume} busy={session.busy} path={state.path} />
            ) : (
              <>
                <StepCard step={state.step} />

                {state.step ? (
                  <StepActions
                    outcomes={state.step.outcomes}
                    onSelect={handleOutcome}
                    onNeedHelp={() => setShowExplain(true)}
                    busy={session.busy}
                  />
                ) : (
                  <Notice tone="warning" title="No step to show yet">
                    <p>
                      This session has no instruction saved against it. Reloading usually brings
                      one back.
                    </p>
                    <button type="button" className="btn-outline btn-sm mt-3" onClick={session.reload}>
                      Reload this session
                    </button>
                  </Notice>
                )}

                {state.step && showExplain ? (
                  <ExplainPanel onExplain={session.explain} busy={session.busy} />
                ) : null}

                {showSomethingElse ? (
                  <SomethingElsePanel
                    canGoBack={state.canGoBack}
                    onBack={async () => {
                      await session.goBack();
                      setShowSomethingElse(false);
                    }}
                    onAbandon={session.abandon}
                    busy={session.busy}
                    onClose={() => setShowSomethingElse(false)}
                  />
                ) : null}
              </>
            )}
          </div>

          <aside className="space-y-5">
            <div className="card p-5">
              <h2 className="font-display text-lg text-ink">What you have tried</h2>
              <p className="mt-1 caption">
                {state.attemptsCount} recorded {state.attemptsCount === 1 ? 'answer' : 'answers'}
              </p>
              <div className="mt-4">
                <AttemptTimeline attempts={state.attempts} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {state.canGoBack ? (
                <button
                  type="button"
                  className="btn-quiet justify-start"
                  onClick={session.goBack}
                  disabled={session.busy}
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Back to the previous step
                </button>
              ) : null}

              {state.status === 'in_progress' ? (
                <button
                  type="button"
                  className="btn-outline justify-start"
                  onClick={session.pause}
                  disabled={session.busy}
                >
                  Pause and come back later
                </button>
              ) : null}

              {!isExplain ? (
                <button
                  type="button"
                  className="btn-quiet justify-start"
                  onClick={() => setShowSomethingElse(true)}
                  disabled={session.busy}
                >
                  <InfoIcon className="h-4 w-4" />
                  None of this matches
                </button>
              ) : null}

              <Link className="btn-quiet justify-start" to="/history">
                Leave and see my fixes
              </Link>
            </div>

            {isExplain ? (
              <p className="caption">
                These steps came from the {state.sourceKind === 'photo' ? 'picture' : 'text'} you
                gave the app. {state.planLeft} {state.planLeft === 1 ? 'step' : 'steps'} left in the
                list.
              </p>
            ) : (
              <p className="caption">
                This is step {state.stepNumber} of up to {state.maxSteps}. The next step is written
                only after you answer, so nothing is wasted.
              </p>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}

// paused is not a dead end, nothing gets lost
function ResumeCard({ onResume, busy, path }) {
  return (
    <section className="card p-6 text-center sm:p-10">
      <h2 className="font-display text-fluid-h2 text-ink">This session is paused</h2>
      <p className="mx-auto mt-2 max-w-prose leading-relaxed text-ink-soft">
        Nothing is lost. Everything you answered is saved, and you will carry on from the same
        place.
      </p>
      <div className="mt-6 flex justify-center">
        <button type="button" className="btn-primary btn-lg" onClick={onResume} disabled={busy}>
          <SparkIcon className="h-4 w-4" />
          {busy ? 'Picking up where you left off' : 'Carry on'}
        </button>
      </div>
      {path.length > 0 ? (
        <p className="mt-5 caption">
          {path.length} {path.length === 1 ? 'step' : 'steps'} recorded so far.
        </p>
      ) : null}
    </section>
  );
}
