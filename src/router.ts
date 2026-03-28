import {
  Outlet,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
} from "@tanstack/react-router";
import App from "./App";
import PensionReference from "./pages/PensionReference";
import ReferenceOverview from "./pages/ReferenceOverview";
import SalarySplitReference from "./pages/SalarySplitReference";
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
  component: ReferenceOverview,
});

const referenceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reference/salary-split",
  component: SalarySplitReference,
});

const pensionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/reference/pension",
  component: PensionReference,
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
