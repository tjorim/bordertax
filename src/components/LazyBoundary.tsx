import { Suspense, type ReactNode } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
import { useRouter, type ErrorComponentProps } from "@tanstack/react-router";
import { TriangleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { LazyView } from "@/lib/lazyView";
import * as m from "../paraglide/messages.js";

interface LazyLoadingProps {
  /** Reserve roughly the loaded content's height so the page does not jump on arrival. */
  className?: string;
}

export function LazyLoading({ className }: LazyLoadingProps) {
  return (
    <div className={cn("flex items-start justify-center p-6", className)}>
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
      <TriangleAlertIcon aria-hidden="true" className="mx-auto size-8 text-warning mb-4 block" />
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
  loadingClassName?: string;
  children: ReactNode;
}

/** Suspense fallback plus chunk-failure recovery around a lazily loaded view. */
export function LazyBoundary({ view, loadingClassName, children }: LazyBoundaryProps) {
  const renderError = ({ resetErrorBoundary }: FallbackProps) => (
    <LazyError onRetry={resetErrorBoundary} />
  );
  return (
    <ErrorBoundary fallbackRender={renderError} onReset={view.reset}>
      <Suspense fallback={<LazyLoading className={loadingClassName} />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
