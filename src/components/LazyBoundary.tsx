import { lazy, Suspense, type ComponentType, type ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import * as m from "../paraglide/messages.js";

type Loader<P extends object> = () => Promise<{ default: ComponentType<P> }>;

interface LazyView<P extends object> {
  Component: ComponentType<P>;
  /** Start the import ahead of time, e.g. on hover or focus. Never throws. */
  preload: () => void;
  /** Forget a failed import so the next render requests the chunk again. */
  reset: () => void;
}

/**
 * Wraps a dynamic import so a failed chunk request can be retried. `React.lazy`
 * caches a rejection forever, so a retry needs a fresh lazy component.
 */
export function lazyView<P extends object>(load: Loader<P>): LazyView<P> {
  let pending: ReturnType<Loader<P>> | undefined;
  const importOnce = () =>
    (pending ??= load().catch((error: unknown) => {
      pending = undefined;
      throw error;
    }));
  let Lazy = lazy(importOnce);

  return {
    Component: (props) => <Lazy {...(props as P & object)} />,
    preload: () => {
      importOnce().catch(() => {
        // The render path reports the failure.
      });
    },
    reset: () => {
      pending = undefined;
      Lazy = lazy(importOnce);
    },
  };
}

export function LazyLoading() {
  return (
    <div className="flex items-center justify-center p-6">
      <Spinner />
    </div>
  );
}

interface LazyErrorProps {
  onRetry: () => void;
}

export function LazyError({ onRetry }: LazyErrorProps) {
  return (
    <div role="alert" className="p-6 text-center">
      <TriangleAlert aria-hidden="true" className="mx-auto size-8 text-warning mb-4 block" />
      <h5>{m.lazy_error_title()}</h5>
      <p className="text-text-muted text-sm mb-4">{m.lazy_error_description()}</p>
      <div className="flex flex-wrap justify-center gap-2">
        <Button onClick={onRetry}>{m.lazy_error_retry()}</Button>
        <Button variant="outline" onClick={() => window.location.reload()}>
          {m.lazy_error_reload()}
        </Button>
      </div>
    </div>
  );
}

/** Route-level fallback: reset the error boundary, then reload the route's chunk and data. */
export function RouteLoadError({ reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <LazyError
      onRetry={() => {
        reset();
        void router.invalidate();
      }}
    />
  );
}

interface LazyBoundaryProps {
  view: Pick<LazyView<object>, "reset">;
  children: ReactNode;
}

/** Suspense fallback plus chunk-failure recovery around a lazily loaded view. */
export function LazyBoundary({ view, children }: LazyBoundaryProps) {
  const renderError = ({ resetErrorBoundary }: FallbackProps) => (
    <LazyError onRetry={resetErrorBoundary} />
  );
  return (
    <ErrorBoundary fallbackRender={renderError} onReset={view.reset}>
      <Suspense fallback={<LazyLoading />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
