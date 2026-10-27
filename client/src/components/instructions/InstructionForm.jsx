import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api.js';
import useVoice from '../../hooks/useVoice.js';
import Notice from '../ui/Notice.jsx';
import { CameraIcon, CloseIcon, SparkIcon } from '../ui/Icons.jsx';

// second way in - the user already has the instructions and hands them over
// instead of describing a problem. photo, typed or spoken, all go to one box

const MAX_TEXT = 6000;
const MAX_BYTES = 4 * 1024 * 1024;
const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

// just to show nothing technical is expected
const SUITS = [
  'Flat pack furniture',
  'A recipe',
  'A medicine leaflet',
  'A bank or tax letter',
  'A washing machine manual',
  'A sewing or knitting pattern',
  'A school form'
];

export default function InstructionForm() {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoUrl, setPhotoUrl] = useState('');
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  const voice = useVoice((said) => {
    setText((prev) => (prev.trim() + ' ' + said).trim().slice(0, MAX_TEXT));
    setError('');
  });

  function handleFile(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    let type = (file.type || '').toLowerCase();
    if (type === 'image/jpg') type = 'image/jpeg';

    if (OK_TYPES.indexOf(type) === -1) {
      setError('That kind of picture is not supported. Please use a PNG or JPG.');
      return;
    }
    if (file.size > MAX_BYTES) {
      setError('That picture is too large. Please use one under 4 MB.');
      return;
    }

    // read the image here and send it as text
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const comma = result.indexOf(',');
      if (comma === -1) {
        setError('That picture could not be read. Please try another one.');
        return;
      }
      setPhoto({ mimeType: type, data: result.slice(comma + 1) });
      setPhotoUrl(result);
      // a photo and typed text together is confusing, so drop the text
      setText('');
      setError('');
    };
    reader.onerror = () => setError('That picture could not be read. Please try another one.');
    reader.readAsDataURL(file);
  }

  function clearPhoto() {
    setPhoto(null);
    setPhotoUrl('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit(event) {
    event.preventDefault();

    // checked here so the button answers straight away, server checks again
    if (!photo && text.trim().length < 20) {
      setError('Add a photo of the instructions, or paste the text. A line or two is not enough to make steps from.');
      return;
    }

    setStarting(true);
    setError('');
    try {
      const payload = photo ? { image: photo } : { text: text.trim() };
      const response = await api.post('/sessions/explain', payload);
      const state = response.data.state;
      navigate('/session/' + state.id);
    } catch (err) {
      setError(err.message);
      setStarting(false);
    }
  }

  const message = error || voice.voiceError;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* photo */}
      <div>
        <h3 className="font-display text-lg text-ink">If you have them on paper</h3>
        <p className="mt-1 text-sm leading-relaxed text-ink-soft">
          Photograph the page and the app will read the steps off it.
        </p>

        <input
          id="instructions-photo"
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          onChange={handleFile}
        />

        {photo ? (
          <div className="card-inset mt-4 flex items-start gap-4 p-4">
            <img
              src={photoUrl}
              alt="The page you chose"
              className="h-24 w-20 shrink-0 rounded-card border border-line object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-ink">This page will be read into steps.</p>
              <p className="mt-1 text-xs leading-relaxed text-ink-faint">
                It is used once and is not kept.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <label htmlFor="instructions-photo" className="btn-outline btn-sm cursor-pointer">
                  Choose a different picture
                </label>
                <button type="button" className="btn-quiet btn-sm" onClick={clearPhoto}>
                  <CloseIcon className="h-4 w-4" />
                  Remove it
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <label
              htmlFor="instructions-photo"
              className="choice cursor-pointer justify-center border-dashed"
            >
              <CameraIcon className="h-5 w-5 text-accent" />
              <span className="font-medium text-ink">Take or choose a picture</span>
            </label>
            <p className="field-help">
              One page at a time, under 4 MB. PNG or JPG.
            </p>
          </div>
        )}
      </div>

      {/* typed or spoken */}
      <div className="rule pt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <label htmlFor="instructions-text" className="field-label mb-0">
              Or type or paste them here
            </label>
            <p className="field-help">
              Do not tidy them up first. Keep the numbering if there is any.
            </p>
          </div>

          {voice.canSpeak && !photo ? (
            <button
              type="button"
              className={voice.isListening ? 'btn-soft' : 'btn-quiet'}
              onClick={voice.toggle}
              aria-pressed={voice.isListening}
            >
              {voice.isListening ? 'Listening, tap to stop' : 'Speak them instead'}
            </button>
          ) : null}
        </div>

        <textarea
          id="instructions-text"
          className="field-input mt-3 min-h-[180px] w-full resize-y"
          placeholder="Paste the whole set of steps here, however they were written."
          value={text}
          maxLength={MAX_TEXT}
          disabled={Boolean(photo)}
          onChange={(event) => {
            setText(event.target.value);
            setError('');
          }}
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <span className="caption">
            {photo
              ? 'A picture has been chosen, so this box is off.'
              : text.length + ' / ' + MAX_TEXT + ' characters'}
          </span>
        </div>
      </div>

      {message ? (
        <Notice tone="danger" title="That cannot be read yet" live="assertive">
          <p>{message}</p>
        </Notice>
      ) : null}

      {/* submit */}
      <div className="rule flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="caption max-w-xs">
          The words are read once, here, and the steps come back as you work through them.
        </p>
        <button type="submit" className="btn-primary btn-lg w-full sm:w-auto" disabled={starting}>
          <SparkIcon className="h-4 w-4" />
          {starting ? 'Reading them into steps' : 'Turn these into steps'}
        </button>
      </div>

      <div className="rule pt-5">
        <p className="caption">This works for anything written down, not just computers.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {SUITS.map((item) => (
            <span key={item} className="badge">
              {item}
            </span>
          ))}
        </div>
      </div>
    </form>
  );
}
