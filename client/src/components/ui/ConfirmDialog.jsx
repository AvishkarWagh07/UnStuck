import { useEffect, useId, useRef } from 'react';

// confirm before throwing something away. bottom sheet on phone, box on desktop
// closes on escape or tap outside, focus starts on the safe choice
export default function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel
}) {
  const titleId = useId();
  const cancelRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;

    function handleKey(event) {
      if (event.key === 'Escape') onCancel();
    }

    document.addEventListener('keydown', handleKey);

    // block page scroll behind the sheet
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    if (cancelRef.current) cancelRef.current.focus();

    return function cleanUp() {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open, onCancel]);

  if (!open) return null;

  const confirmClass = tone === 'danger' ? 'btn-primary bg-danger hover:bg-danger-ink' : 'btn-primary';

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/45 p-0 sm:items-center sm:p-6"
      role="presentation"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="w-full max-w-md rounded-t-card border border-line bg-white p-6 shadow-lift sm:rounded-card"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id={titleId} className="font-display text-xl text-ink">
          {title}
        </h2>

        {children ? (
          <div className="mt-3 text-sm leading-relaxed text-ink-soft">{children}</div>
        ) : null}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            ref={cancelRef}
            type="button"
            className="btn-outline"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelLabel}
          </button>
          <button type="button" className={confirmClass} onClick={onConfirm} disabled={busy}>
            {busy ? 'Working' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
