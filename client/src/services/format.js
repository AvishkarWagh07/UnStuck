const STATUS_LABELS = {
  in_progress: 'In progress',
  paused: 'Paused',
  resolved: 'Resolved',
  unresolved: 'Not resolved',
  escalated: 'Escalated',
  abandoned: 'Stopped'
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status;
}

export function riskLabel(risk) {
  if (risk === 'high') return 'Careful';
  if (risk === 'moderate') return 'Some risk';
  return 'Low risk';
}

// badge class for a risk level
export function riskTone(risk) {
  if (risk === 'high') return 'badge-danger';
  if (risk === 'moderate') return 'badge-amber';
  return 'badge-success';
}

export function statusTone(status) {
  if (status === 'resolved') return 'badge-success';
  if (status === 'in_progress' || status === 'paused') return 'badge-blue';
  if (status === 'escalated') return 'badge-amber';
  return 'badge';
}

// first line is what the user typed, the rest is the extra answers from describe
export function problemTitle(text) {
  if (!text) return '';
  const lines = String(text).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line) return line;
  }
  return '';
}

// everything after the first line
export function problemExtras(text) {
  if (!text) return '';
  const index = String(text).indexOf('\n');
  if (index === -1) return '';
  return String(text).slice(index + 1).trim();
}

// category is stored as a line in the text, this pulls it back out
export function categoryFromText(text) {
  const match = /^Category:\s*(.+)$/m.exec(String(text || ''));
  return match ? match[1].trim() : '';
}

export function formatDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function relativeTime(value) {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '';
  const diff = Date.now() - then;
  const minutes = Math.round(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes + ' min ago';
  const hours = Math.round(minutes / 60);
  if (hours < 24) return hours + ' hr ago';
  const days = Math.round(hours / 24);
  if (days < 30) return days + ' day' + (days === 1 ? '' : 's') + ' ago';
  return formatDate(value);
}

export function isFinished(status) {
  return (
    status === 'resolved' ||
    status === 'unresolved' ||
    status === 'escalated' ||
    status === 'abandoned'
  );
}
