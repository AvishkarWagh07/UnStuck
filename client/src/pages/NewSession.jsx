import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api.js';
import useVoice from '../hooks/useVoice.js';
import { CATEGORIES, categoryByKey } from '../services/categories.js';
import InstructionForm from '../components/instructions/InstructionForm.jsx';
import Notice from '../components/ui/Notice.jsx';
import { ArrowLeftIcon, CameraIcon, MicIcon, SearchIcon, SparkIcon } from '../components/ui/Icons.jsx';

// new session page. two modes, describe a problem or paste instructions

const MAX_PROBLEM = 400;

const WHEN_OPTIONS = [
  { value: '', label: 'Not sure / prefer not to say' },
  { value: 'Just started today', label: 'Just started today' },
  { value: 'A few days ago', label: 'A few days ago' },
  { value: 'A few weeks ago', label: 'A few weeks ago' },
  { value: 'It has always done this', label: 'It has always done this' }
];

const HOW_OFTEN_OPTIONS = [
  { value: '', label: 'Not sure' },
  { value: 'Every time', label: 'Every time' },
  { value: 'Most of the time', label: 'Most of the time' },
  { value: 'Now and then', label: 'Now and then' },
  { value: 'It happened once', label: 'It happened once' }
];

// first line is what the user typed, extra answers get appended under it
function composeProblem({ category, text, device, when, howOften, tried }) {
  const parts = [text.trim()];

  const picked = categoryByKey(category);
  const context = [];
  if (picked) context.push('Category: ' + picked.label);
  if (device.trim()) context.push('Device or service involved: ' + device.trim());
  if (when) context.push('When it started: ' + when);
  if (howOften) context.push('How often it happens: ' + howOften);
  if (tried.trim()) context.push('Already tried: ' + tried.trim());

  if (context.length > 0) {
    parts.push('');
    for (let i = 0; i < context.length; i++) parts.push(context[i]);
  }

  return parts.join('\n');
}

export default function NewSession() {
  const [mode, setMode] = useState('diagnose');

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="What do you have?">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'diagnose'}
          className={mode === 'diagnose' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setMode('diagnose')}
        >
          I have a problem
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'explain'}
          className={mode === 'explain' ? 'btn-primary' : 'btn-outline'}
          onClick={() => setMode('explain')}
        >
          I have instructions
        </button>
      </div>

      <div className="mt-6">
        {mode === 'diagnose' ? (
          <DescribeFlow onSwitchToInstructions={() => setMode('explain')} />
        ) : (
          <>
            <h1 className="font-display text-fluid-h1 text-ink">Untangle your instructions</h1>
            <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
              Hand over steps that already exist, however badly written, and they come back one at
              a time. Nothing is added and nothing is quietly left out.
            </p>
            <div className="card mt-7 p-6 sm:p-8">
              <InstructionForm />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DescribeFlow({ onSwitchToInstructions }) {
  const navigate = useNavigate();
  const location = useLocation();

  // home can pass a category in so the chip starts selected
  const preset = location.state && location.state.category ? location.state.category : '';

  const [stage, setStage] = useState('describe');

  const [category, setCategory] = useState(preset);
  const [problem, setProblem] = useState('');
  const [error, setError] = useState('');
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState('');

  const [device, setDevice] = useState('');
  const [when, setWhen] = useState('');
  const [howOften, setHowOften] = useState('');
  const [tried, setTried] = useState('');

  const voice = useVoice((said) => {
    setProblem((prev) => (prev.trim() + ' ' + said).trim().slice(0, MAX_PROBLEM));
    setError('');
  });

  function handleDescribe(event) {
    event.preventDefault();
    if (problem.trim().length < 10) {
      setError('Give us a sentence or two about what is happening.');
      return;
    }
    setError('');
    setStage('questions');
  }

  async function handleStart() {
    setStarting(true);
    setStartError('');
    const payload = { problem: composeProblem({ category, text: problem, device, when, howOften, tried }) };

    try {
      const response = await api.post('/sessions', payload);
      navigate('/session/' + response.data.state.id);
    } catch (err) {
      setStarting(false);
      setStartError(err.message);
    }
  }

  if (stage === 'questions') {
    return (
      <div className="animate-fadeIn">
        <h1 className="font-display text-fluid-h1 text-ink">A few quick questions</h1>
        <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
          These are optional, and any of them can be left blank. They usually save a step or two,
          because the first thing we would suggest is asking you the same thing.
        </p>

        <div className="card-inset mt-7 p-5">
          <p className="caption">What you told us</p>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-ink">{problem.trim()}</p>
          <button
            type="button"
            className="btn-quiet mt-3 -ml-2"
            onClick={() => setStage('describe')}
            disabled={starting}
          >
            <ArrowLeftIcon className="h-4 w-4" />
            Edit that
          </button>
        </div>

        <div className="card mt-6 p-6 sm:p-8">
          <div className="space-y-6">
            <div>
              <label className="field-label" htmlFor="q-device">
                Which device or service is this about?
              </label>
              <input
                id="q-device"
                className="field-input"
                placeholder="For example: the home router, or my work laptop"
                maxLength={120}
                value={device}
                onChange={(event) => setDevice(event.target.value)}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label className="field-label" htmlFor="q-when">
                  When did the problem begin?
                </label>
                <select
                  id="q-when"
                  className="field-input"
                  value={when}
                  onChange={(event) => setWhen(event.target.value)}
                >
                  {WHEN_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="field-label" htmlFor="q-often">
                  Does it happen consistently?
                </label>
                <select
                  id="q-often"
                  className="field-input"
                  value={howOften}
                  onChange={(event) => setHowOften(event.target.value)}
                >
                  {HOW_OFTEN_OPTIONS.map((option) => (
                    <option key={option.label} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="field-label" htmlFor="q-tried">
                What have you already tried?
              </label>
              <textarea
                id="q-tried"
                className="field-input min-h-[96px] resize-y"
                placeholder="So we do not send you back to something that already failed"
                maxLength={300}
                value={tried}
                onChange={(event) => setTried(event.target.value)}
              />
            </div>
          </div>

          {startError ? (
            <Notice tone="danger" title="The session could not be started" live="assertive" className="mt-6">
              {startError}
            </Notice>
          ) : null}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              className="btn-quiet"
              onClick={() => setStage('describe')}
              disabled={starting}
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back
            </button>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <button type="button" className="btn-quiet" onClick={handleStart} disabled={starting}>
                Skip these
              </button>
              <button type="button" className="btn-primary btn-lg" onClick={handleStart} disabled={starting}>
                {starting ? 'Finding the first step' : 'Start fixing'}
              </button>
            </div>
          </div>
        </div>

        <p className="mt-4 caption">
          Starting takes a moment. One step comes back, not a list.
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <h1 className="font-display text-fluid-h1 text-ink">What&rsquo;s going wrong?</h1>
      <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
        Tell us what you&rsquo;re experiencing, and we&rsquo;ll help you find the right fix.
      </p>

      <form className="card mt-7 p-6 sm:p-8" onSubmit={handleDescribe}>
        <fieldset>
          <legend className="field-label">Which part of it is giving you trouble?</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {CATEGORIES.map((item) => {
              const picked = category === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  aria-pressed={picked}
                  className={
                    'inline-flex items-center gap-2 rounded-pill border px-4 py-2.5 text-sm transition-colors duration-150 ' +
                    (picked
                      ? 'border-accent bg-accent-soft text-accent'
                      : 'border-line bg-white text-ink-soft hover:border-accent/50 hover:text-ink')
                  }
                  onClick={() => setCategory(picked ? '' : item.key)}
                >
                  <item.Icon className="h-4 w-4" />
                  {item.label}
                </button>
              );
            })}
          </div>
          <p className="field-help">
            Not sure? Leave it blank. Every one of these is optional.
          </p>
        </fieldset>

        <div className="mt-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label className="field-label" htmlFor="problem">
              Describe it in your own words
            </label>
            {voice.canSpeak ? (
              <button
                type="button"
                className={voice.isListening ? 'btn-soft btn-sm' : 'btn-quiet btn-sm'}
                onClick={voice.toggle}
              >
                <MicIcon className="h-4 w-4" />
                {voice.isListening ? 'Listening, tap to stop' : 'Speak instead'}
              </button>
            ) : null}
          </div>

          <textarea
            id="problem"
            className="field-input min-h-[132px] w-full resize-y"
            placeholder={
              category && categoryByKey(category)
                ? categoryByKey(category).example + '...'
                : 'For example: my phone connects to the wifi but nothing loads'
            }
            value={problem}
            maxLength={MAX_PROBLEM}
            onChange={(event) => {
              setProblem(event.target.value);
              setError('');
            }}
          />

          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="caption">
              {problem.length} / {MAX_PROBLEM} characters
            </span>
            <span className="caption">A sentence is plenty</span>
          </div>
        </div>

        <div className="mt-6 rounded-card border border-line bg-paper p-4">
          <div className="flex items-start gap-3">
            <CameraIcon className="mt-0.5 h-5 w-5 shrink-0 text-ink-soft" />
            <p className="text-sm leading-relaxed text-ink-soft">
              Have a screenshot of the error, or a page of instructions? Switch to{' '}
              <button type="button" className="link" onClick={onSwitchToInstructions}>
                I have instructions
              </button>{' '}
              and hand over the picture there, where the app can read it.
            </p>
          </div>
        </div>

        {error || voice.voiceError ? (
          <Notice tone="danger" className="mt-6" live="assertive">
            {error || voice.voiceError}
          </Notice>
        ) : null}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-2 caption">
            <SparkIcon className="h-4 w-4 text-accent" />
            Nothing is decided until you answer the first step.
          </p>
          <button type="submit" className="btn-primary btn-lg">
            <SearchIcon className="h-4 w-4" />
            Continue
          </button>
        </div>
      </form>

      <div className="mt-8">
        <h2 className="font-display text-lg text-ink">Keep it plain</h2>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">
          You do not need the name of the thing that is broken, or the right word for what it is
          doing. Describe it the way you would to a friend, and the first step will work from
          there.
        </p>
      </div>
    </div>
  );
}
