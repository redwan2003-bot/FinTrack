import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * FIX #13 — React Error Boundary
 * Wraps each page so a runtime error in one page doesn't crash the entire app.
 * Shows a user-friendly fallback UI with a retry option.
 */
export class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // In production this would go to Sentry / LogRocket / Datadog
    console.error('[FinTrack ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="page flex flex-col items-center justify-center min-h-[60vh] text-center gap-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={32} className="text-red-400" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-[var(--text-1)]">Something went wrong</h2>
          <p className="text-[var(--text-2)] text-sm max-w-md">
            An unexpected error occurred on this page. Your data is safe.
          </p>
          <details className="text-left text-xs text-[var(--text-muted)] max-w-md bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.05)] rounded-lg p-3">
            <summary className="cursor-pointer font-medium mb-1">Error details</summary>
            <pre className="overflow-auto whitespace-pre-wrap">{this.state.error?.message}</pre>
          </details>
          <button
            className="btn btn-primary flex items-center gap-2 mt-2"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            <RefreshCw size={16} aria-hidden="true" /> Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/**
 * FIX #13 — Skeleton loader for stat cards
 */
export function StatCardSkeleton() {
  return (
    <div className="stat-card animate-pulse" aria-hidden="true">
      <div className="stat-card-top">
        <div className="w-9 h-9 rounded-xl bg-[rgba(255,255,255,0.06)]" />
        <div className="w-12 h-5 rounded bg-[rgba(255,255,255,0.06)]" />
      </div>
      <div className="w-32 h-7 rounded bg-[rgba(255,255,255,0.08)] mt-3" />
      <div className="w-20 h-4 rounded bg-[rgba(255,255,255,0.04)] mt-2" />
    </div>
  );
}

/**
 * FIX #13 — Skeleton loader for a transaction row
 */
export function TransactionRowSkeleton() {
  return (
    <div className="txn-row animate-pulse" aria-hidden="true">
      <div className="txn-info">
        <div className="w-40 h-4 rounded bg-[rgba(255,255,255,0.08)]" />
        <div className="flex gap-2 mt-2">
          <div className="w-16 h-3 rounded bg-[rgba(255,255,255,0.05)]" />
          <div className="w-20 h-3 rounded bg-[rgba(255,255,255,0.05)]" />
        </div>
      </div>
      <div className="w-20 h-5 rounded bg-[rgba(255,255,255,0.08)]" />
    </div>
  );
}

/**
 * FIX #13 — Generic card skeleton
 */
export function CardSkeleton({ lines = 4 }) {
  return (
    <div className="card animate-pulse" aria-hidden="true">
      <div className="card-header">
        <div className="w-36 h-5 rounded bg-[rgba(255,255,255,0.08)]" />
        <div className="w-20 h-4 rounded bg-[rgba(255,255,255,0.05)]" />
      </div>
      <div className="flex flex-col gap-3 mt-4">
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="w-full h-4 rounded bg-[rgba(255,255,255,0.05)]" style={{ width: `${80 - i * 8}%` }} />
        ))}
      </div>
    </div>
  );
}

/**
 * FIX #13 — Empty state component
 */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="empty-state card flex flex-col items-center text-center py-12 gap-3" role="status">
      {Icon && (
        <div className="w-14 h-14 rounded-2xl bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.06)] flex items-center justify-center">
          <Icon size={24} className="text-[var(--text-muted)]" aria-hidden="true" />
        </div>
      )}
      <h3 className="text-base font-semibold text-[var(--text-1)]">{title}</h3>
      {description && <p className="text-sm text-[var(--text-2)] max-w-xs">{description}</p>}
      {action}
    </div>
  );
}
