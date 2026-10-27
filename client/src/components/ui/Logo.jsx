// the UnStuck wordmark, ink or white tone
export default function Logo({ tone = 'ink', className = '', size = 'text-lg' }) {
  const text = tone === 'white' ? 'text-white' : 'text-ink';

  return (
    <span className={'inline-flex items-center ' + className}>
      <span
        className={
          'font-brand font-extrabold uppercase leading-none tracking-tight ' + size + ' ' + text
        }
      >
        Un<span className={tone === 'white' ? 'text-white/80' : 'text-accent'}>Stuck</span>
      </span>
    </span>
  );
}
