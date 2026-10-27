import { AlertIcon, CheckIcon, CloseIcon, InfoIcon } from './Icons.jsx';

// used for every inline message - busy, errors, saved, etc
const TONES = {
  info: { box: 'border-accent/25 bg-accent-soft', Icon: InfoIcon, iconClass: 'text-accent' },
  success: { box: 'border-success/30 bg-success-soft', Icon: CheckIcon, iconClass: 'text-success' },
  warning: { box: 'border-amber/35 bg-amber-soft', Icon: AlertIcon, iconClass: 'text-amber' },
  danger: { box: 'border-danger/30 bg-danger-soft', Icon: AlertIcon, iconClass: 'text-danger' },
  neutral: { box: 'border-line bg-paper-dark', Icon: InfoIcon, iconClass: 'text-ink-soft' }
};

export default function Notice({
  tone = 'neutral',
  title,
  children,
  action,
  onDismiss,
  live = 'polite',
  className
}) {
  const picked = TONES[tone] || TONES.neutral;
  const Icon = picked.Icon;

  return (
    <div
      className={'rounded-card border p-4 sm:p-5 ' + picked.box + ' ' + (className || '')}
      role={live === 'assertive' ? 'alert' : 'status'}
      aria-live={live}
    >
      <div className="flex items-start gap-3">
        <Icon className={'mt-0.5 h-5 w-5 shrink-0 ' + picked.iconClass} />

        <div className="min-w-0 flex-1">
          {title ? <h3 className="text-sm font-semibold text-ink">{title}</h3> : null}
          {children ? (
            <div className={'text-sm leading-relaxed text-ink-soft ' + (title ? 'mt-1' : '')}>
              {children}
            </div>
          ) : null}
          {action ? <div className="mt-3">{action}</div> : null}
        </div>

        {onDismiss ? (
          <button
            type="button"
            className="-mr-1 -mt-1 rounded-pill p-1.5 text-ink-faint transition-colors hover:bg-ink/5 hover:text-ink"
            onClick={onDismiss}
            aria-label="Dismiss this message"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </div>
  );
}
