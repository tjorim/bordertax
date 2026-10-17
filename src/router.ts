import {
  Outlet,
  createRootRoute,
  lazyRouteComponent,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import App from "./App";
import { LazyLoading, RouteLoadError } from "./components/LazyBoundary";
import { deLocalizeUrl, getLocale, localizeUrl, shouldRedirect } from "./paraglide/runtime.js";

const rootRoute = createRootRoute({
  component: Outlet,
  beforeLoad: async () => {
    document.documentElement.lang = getLocale();
    const decision = await shouldRedirect({ url: window.location.href });
    if (decision.shouldRedirect && decision.redirectUrl) {
      throw redirect({ href: decision.redirectUrl.href });
    }
  },
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const referenceOverviewRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reference",
  component: lazyRouteComponent(() => import("./pages/ReferenceOverview")),
});

const referenceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reference/salary-split",
  component: lazyRouteComponent(() => import("./pages/SalarySplitReference")),
});

const pensionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reference/pension",
  component: lazyRouteComponent(() => import("./pages/PensionReference")),
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  referenceOverviewRoute,
  referenceRoute,
  pensionRoute,
]);

export const router = createRouter({
  routeTree,
  defaultPreload: "intent",
  defaultPendingComponent: LazyLoading,
  defaultErrorComponent: RouteLoadError,
  scrollRestoration: true,
  defaultStructuralSharing: true,
  rewrite: {
    input: ({ url }) => deLocalizeUrl(url),
    output: ({ url }) => localizeUrl(url),
  },
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
