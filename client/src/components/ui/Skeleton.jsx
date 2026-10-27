// loading placeholders so screens do not jump around

export function SkeletonLine({ className }) {
  return <div className={'skeleton h-4 ' + (className || 'w-full')} aria-hidden="true" />;
}

// keeps the page height while a step loads
export function StepSkeleton() {
  return (
    <div className="card p-6 sm:p-8" aria-hidden="true">
      <div className="flex items-center justify-between gap-3">
        <div className="skeleton h-6 w-24 rounded-pill" />
        <div className="skeleton h-4 w-28" />
      </div>
      <div className="skeleton mt-6 h-7 w-3/4" />
      <div className="mt-5 space-y-3">
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-11/12" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="skeleton mt-7 h-4 w-1/2" />
    </div>
  );
}

export function RowSkeleton() {
  return (
    <div className="card flex items-center justify-between gap-4 p-5" aria-hidden="true">
      <div className="min-w-0 flex-1">
        <div className="skeleton h-5 w-2/3" />
        <div className="skeleton mt-3 h-3.5 w-40" />
      </div>
      <div className="skeleton h-10 w-24 rounded-pill" />
    </div>
  );
}

export default function Skeleton({ lines = 3, className }) {
  const rows = [];
  for (let i = 0; i < lines; i++) {
    rows.push(<SkeletonLine key={i} className={i === lines - 1 ? 'w-2/3' : 'w-full'} />);
  }

  return (
    <div className={className || ''} aria-hidden="true">
      <div className="space-y-3">{rows}</div>
    </div>
  );
}
