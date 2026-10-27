import Notice from '../ui/Notice.jsx';

// shows why the app took a different path or decided to stop
const TONES = {
  recovery: { tone: 'success', heading: 'A different path' },
  busy: { tone: 'warning', heading: 'The step writer is busy' },
  escalate: { tone: 'warning', heading: 'Time to stop and escalate' },
  repeat: { tone: 'neutral', heading: 'You have been here before' }
};

export default function RecoveryNotice({ notice }) {
  if (!notice) return null;

  const picked = TONES[notice.kind] || { tone: 'info', heading: 'Note' };

  return (
    <Notice tone={picked.tone} title={picked.heading}>
      <p>{notice.message}</p>
    </Notice>
  );
}
