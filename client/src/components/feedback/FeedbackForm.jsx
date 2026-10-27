import { useState } from 'react';

// feedback for the session just finished
const RESULTS = [
  { value: 'solved', label: 'Solved' },
  { value: 'partly_solved', label: 'Partly solved' },
  { value: 'not_solved', label: 'Not solved' }
];

export default function FeedbackForm({ path, busy, onSubmit, submitted }) {
  const [rating, setRating] = useState(0);
  const [result, setResult] = useState('');
  const [confusingStepKey, setConfusingStepKey] = useState('');
  const [comment, setComment] = useState('');
  const [localError, setLocalError] = useState('');

  async function handleSubmit(event) {
    event.preventDefault();
    if (!result) {
      setLocalError('Please choose how it went.');
      return;
    }
    setLocalError('');
    await onSubmit({
      rating: rating || undefined,
      result,
      confusingStepKey: confusingStepKey || undefined,
      comment: comment.trim() || undefined
    });
  }

  if (submitted) {
    return (
      <section className="card p-6 sm:p-8">
        <h2 className="font-display text-fluid-h2 text-ink">Thank you</h2>
        <p className="mt-2 max-w-prose leading-relaxed text-ink-soft">
          Your answer is kept with this session, and it is the only way this app learns which steps
          actually help.
        </p>
      </section>
    );
  }

  return (
    <section className="card p-6 sm:p-8">
      <h2 className="font-display text-fluid-h2 text-ink">How did this session do?</h2>
      <p className="mt-2 max-w-prose leading-relaxed text-ink-soft">
        Optional. Nothing here is used to rank you, only to judge whether the steps this app
        writes are useful.
      </p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
        <fieldset>
          <legend className="field-label">Did it solve your problem?</legend>
          <div className="flex flex-wrap gap-2">
            {RESULTS.map((option) => (
              <button
                key={option.value}
                type="button"
                aria-pressed={result === option.value}
                className={result === option.value ? 'btn-primary' : 'btn-outline'}
                onClick={() => setResult(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="field-label">How clear were the steps?</legend>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                key={value}
                type="button"
                aria-label={value + ' out of 5'}
                aria-pressed={rating === value}
                className={
                  'h-11 w-11 rounded-pill border text-sm font-medium transition-colors ' +
                  (rating === value
                    ? 'border-accent bg-accent text-white'
                    : 'border-line bg-white text-ink-soft hover:border-accent hover:text-accent')
                }
                onClick={() => setRating(value)}
              >
                {value}
              </button>
            ))}
          </div>
        </fieldset>

        <div>
          <label className="field-label" htmlFor="confusing-step">
            Which step was confusing? (optional)
          </label>
          <select
            id="confusing-step"
            className="field-input"
            value={confusingStepKey}
            onChange={(event) => setConfusingStepKey(event.target.value)}
          >
            <option value="">Nothing in particular</option>
            {path.map((item) => (
              <option key={item.stepKey} value={item.stepKey}>
                {item.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="field-label" htmlFor="feedback-comment">
            Anything else? (optional)
          </label>
          <textarea
            id="feedback-comment"
            className="field-input min-h-[96px]"
            maxLength={800}
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </div>

        {localError ? (
          <p className="text-sm text-danger" role="alert">
            {localError}
          </p>
        ) : null}

        <button type="submit" className="btn-primary" disabled={busy}>
          {busy ? 'Sending' : 'Send feedback'}
        </button>
      </form>
    </section>
  );
}
