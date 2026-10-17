import { lazy, type ComponentType } from "react";

type Loader<P extends object> = () => Promise<{ default: ComponentType<P> }>;

export interface LazyView<P extends object> {
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
