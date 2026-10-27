import { riskLabel, riskTone } from '../../services/format.js';
import { ClockIcon, ShieldIcon } from '../ui/Icons.jsx';

// one instruction, what to expect, and how risky it is
export default function StepCard({ step }) {
  if (!step) return null;

  return (
    <article className="card step-enter overflow-hidden">
      <header className="flex flex-wrap items-center gap-2 border-b border-line bg-paper px-5 py-3.5 sm:px-8">
        <span className={'badge ' + riskTone(step.riskLevel)}>
          <ShieldIcon className="h-3.5 w-3.5" />
          {riskLabel(step.riskLevel)}
        </span>
        <span className="badge">
          <ClockIcon className="h-3.5 w-3.5" />
          about {step.estimatedSeconds} seconds
        </span>
        <span className="ml-auto caption">Suggested step {step.stepNumber}</span>
      </header>

      <div className="p-5 sm:p-8">
        <h2 className="font-display text-fluid-h2 leading-snug text-ink">{step.title}</h2>

        <p className="mt-4 max-w-prose text-fluid-body leading-relaxed text-ink">{step.instruction}</p>

        {step.expectedObservation ? (
          <div className="card-inset mt-6 p-4">
            <p className="text-sm leading-relaxed text-ink-soft">
              <span className="font-semibold text-ink">You should see </span>
              {step.expectedObservation}
            </p>
          </div>
        ) : null}

        {step.whyItMatters ? (
          <details className="mt-6 border-t border-line pt-4">
            <summary className="cursor-pointer text-sm font-medium text-ink-soft transition-colors hover:text-ink">
              Why this helps
            </summary>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">{step.whyItMatters}</p>
          </details>
        ) : null}
      </div>
    </article>
  );
}
