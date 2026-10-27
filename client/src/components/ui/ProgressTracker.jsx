import { CheckIcon } from './Icons.jsx';
import { isFinished } from '../../services/format.js';

// the five stages of a session, named differently for the two workflows
const STAGES = {
  dynamic: ['Issue', 'Diagnose', 'Fix', 'Verify', 'Done'],
  explain: ['Issue', 'Read', 'Steps', 'Verify', 'Done']
};

// which stage the session is in, all from fields the server already sends
export function stageIndexFor({ mode, status, pendingConfirmation, attemptsCount }) {
  if (isFinished(status)) return 4;
  if (pendingConfirmation === true) return 3;
  if (mode === 'explain') return 2;
  if (attemptsCount > 0) return 2;
  return 1;
}

function dotClass(done, active) {
  const base =
    'flex h-7 w-7 shrink-0 items-center justify-center rounded-pill border text-xs font-medium transition-colors ';
  if (done) return base + 'border-accent bg-accent text-white';
  if (active) return base + 'border-accent bg-white text-accent';
  return base + 'border-line bg-white text-ink-faint';
}

export default function ProgressTracker({ mode, status, pendingConfirmation, attemptsCount, note, className }) {
  const kind = mode === 'explain' ? 'explain' : 'dynamic';
  const stages = STAGES[kind];
  const current = stageIndexFor({ mode: kind, status, pendingConfirmation, attemptsCount });

  return (
    <nav aria-label="Progress through this session" className={className || ''}>
      {/* full chain, wide screens */}
      <ol className="hidden items-center sm:flex">
        {stages.map(function (label, index) {
          const done = index < current;
          const active = index === current;
          const last = index === stages.length - 1;

          return (
            <li key={label} className={last ? 'flex items-center' : 'flex flex-1 items-center'}>
              <span className="flex items-center gap-2">
                <span className={dotClass(done, active)}>
                  {done ? <CheckIcon className="h-3.5 w-3.5" /> : index + 1}
                </span>
                <span
                  className={
                    'whitespace-nowrap text-sm ' +
                    (active ? 'font-medium text-ink' : done ? 'text-ink-soft' : 'text-ink-faint')
                  }
                >
                  {label}
                </span>
              </span>

              {!last ? (
                <span className={'mx-3 h-px flex-1 ' + (done ? 'bg-accent/45' : 'bg-line')} />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* phone: small segmented bar, only the current stage named */}
      <div className="sm:hidden">
        <div className="flex gap-1.5">
          {stages.map(function (label, index) {
            return (
              <span
                key={label}
                className={
                  'h-1.5 flex-1 rounded-pill ' + (index <= current ? 'bg-accent' : 'bg-line')
                }
              />
            );
          })}
        </div>
        <div className="mt-2.5 flex items-baseline justify-between gap-3">
          <span className="text-sm font-medium text-ink">{stages[current]}</span>
          <span className="caption">
            Stage {current + 1} of {stages.length}
          </span>
        </div>
      </div>

      {/* spelled out for screen readers */}
      <p className="sr-only">
        Stage {current + 1} of {stages.length}: {stages[current]}.
      </p>

      {note ? <p className="mt-2.5 caption">{note}</p> : null}
    </nav>
  );
}
