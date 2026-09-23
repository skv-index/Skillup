import type { ReactNode } from 'react';

/** Loading states — shared by all parts. */
export function Loading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="row" role="status" aria-live="polite">
      <span className="spinner" />
      <span className="muted small">{label}</span>
    </div>
  );
}

export function LoadingBlock({ lines = 3 }: { lines?: number }) {
  return (
    <div className="stack-4" aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div key={i} className="skeleton" style={{ height: 18 }} />
      ))}
    </div>
  );
}

/** Error states — shared by all parts. */
export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="state-block" role="alert">
      <div className="state-block__icon">⚠️</div>
      <div className="h4">{title}</div>
      {message && <p className="small mt-4">{message}</p>}
      {onRetry && (
        <p className="mt-4">
          <button className="btn btn--secondary btn--sm" onClick={onRetry}>
            Try again
          </button>
        </p>
      )}
    </div>
  );
}

export function Alert({
  variant = 'info',
  children,
}: {
  variant?: 'info' | 'error' | 'success';
  children: ReactNode;
}) {
  return <div className={`alert alert--${variant}`}>{children}</div>;
}

/** Empty states — shared by all parts. */
export function EmptyState({
  icon = '📭',
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="state-block">
      <div className="state-block__icon">{icon}</div>
      <div className="h4">{title}</div>
      {message && <p className="small mt-4">{message}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
