import { formatDateTime } from '../../services/format.js';

// plain list of what was already tried
export default function AttemptTimeline({ attempts }) {
  if (!attempts || attempts.length === 0) {
    return (
      <p className="text-sm leading-relaxed text-ink-soft">
        Nothing recorded yet. Your answers will appear here.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {attempts.map((attempt, index) => (
        <li key={attempt.id} className="relative pl-6">
          <span
            className="absolute left-0 top-1.5 h-2.5 w-2.5 rounded-pill border border-line-strong bg-paper"
            aria-hidden="true"
          />
          {index < attempts.length - 1 ? (
            <span className="absolute left-[4.5px] top-4 h-full w-px bg-line" aria-hidden="true" />
          ) : null}

          <p className="text-sm leading-snug text-ink">{attempt.stepTitle}</p>
          <p className="mt-1 text-sm text-ink-soft">
            {attempt.outcomeLabel}
            {attempt.attemptNumber > 1 ? (
              <span className="ml-2 badge">attempt {attempt.attemptNumber}</span>
            ) : null}
          </p>
          <p className="mt-1 caption">{formatDateTime(attempt.attemptedAt)}</p>
        </li>
      ))}
    </ol>
  );
}
