import { Link } from 'react-router-dom';

// 404 page, nothing scary

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center py-10 text-center sm:py-16">
      <p className="caption">Error 404</p>
      <h1 className="mt-2 font-display text-fluid-h1 text-ink">This page is not here</h1>
      <p className="mt-3 max-w-prose leading-relaxed text-ink-soft">
        The link may be old, or it may have a typo in it. Nothing is lost. Any problem you were
        working through is still saved, and you can pick it up from the same place.
      </p>

      <div className="mt-7 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:justify-center">
        <Link className="btn-primary" to="/app">
          Go to your fixes
        </Link>
        <Link className="btn-outline" to="/history">
          See everything saved
        </Link>
      </div>
    </div>
  );
}
