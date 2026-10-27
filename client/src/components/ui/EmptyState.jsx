// friendly "nothing here yet" block
export default function EmptyState({ title, children, action, className }) {
  return (
    <div className={'flex flex-col items-center px-6 py-12 text-center ' + (className || '')}>
      {title ? <h2 className="font-display text-xl text-ink">{title}</h2> : null}

      {children ? (
        <div className="mt-2 max-w-prose text-sm leading-relaxed text-ink-soft">{children}</div>
      ) : null}

      {action ? <div className="mt-6 flex flex-wrap justify-center gap-3">{action}</div> : null}
    </div>
  );
}
