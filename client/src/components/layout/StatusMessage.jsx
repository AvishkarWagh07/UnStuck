import { Link } from 'react-router-dom';
import Notice from '../ui/Notice.jsx';

// shared holding / empty / error block, wraps Notice so the colours match
export default function StatusMessage({ tone, title, children, action }) {
  let noticeTone = 'neutral';
  if (tone === 'error') noticeTone = 'danger';
  else if (tone === 'busy') noticeTone = 'warning';
  else if (tone === 'info') noticeTone = 'info';

  return (
    <Notice
      tone={noticeTone}
      title={title}
      action={action}
      live={tone === 'error' ? 'assertive' : 'polite'}
    >
      {children}
    </Notice>
  );
}

export function BackToHome() {
  return (
    <Link className="btn-outline" to="/app">
      Back to home
    </Link>
  );
}
