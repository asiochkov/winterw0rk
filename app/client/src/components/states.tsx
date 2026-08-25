import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui';
import './states.css';

/** Skeleton rows that hold the layout while data loads. */
export function LoadingRows({ rows = 3 }: { rows?: number }) {
  return (
    <div className="skeleton-stack" aria-busy="true" aria-live="polite">
      {Array.from({ length: rows }, (_, i) => (
        <div className="skeleton-row" key={i} />
      ))}
    </div>
  );
}

/** A failed load, with the retry the user needs. */
export function ErrorState({ message, onRetry, retryLabel = 'Try again' }: { message: string; onRetry?: () => void; retryLabel?: string }) {
  return (
    <div className="error-state" role="alert">
      <p className="error-state-msg">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}

interface BoundaryProps {
  children: ReactNode;
  fallbackMessage?: string;
  reloadLabel?: string;
}

/**
 * Catches render-time crashes so one broken screen shows a recoverable message
 * instead of leaving the whole app blank.
 */
export class ErrorBoundary extends Component<BoundaryProps, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="error-state" role="alert" style={{ margin: 24 }}>
        <p className="error-state-msg">
          {this.props.fallbackMessage ?? 'Something went wrong on this screen. Your data is safe.'}
        </p>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          {this.props.reloadLabel ?? 'Reload'}
        </Button>
      </div>
    );
  }
}
