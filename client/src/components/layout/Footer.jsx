import Logo from '../ui/Logo.jsx';

// kept short on purpose
export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="shell flex flex-col gap-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <Logo size="text-base" className="opacity-70" />

        <p className="max-w-prose text-xs leading-relaxed text-ink-soft">
          One step at a time. Anything that already failed is remembered, and every suggestion is
          checked on the server before you see it.
        </p>
      </div>
    </footer>
  );
}
