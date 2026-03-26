import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import App from "./App";
import PensionReference from "./pages/PensionReference";
import SalarySplitReference from "./pages/SalarySplitReference";

const rootRoute = createRootRoute();

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: App,
});

const naslagwerkRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/naslagwerk",
  component: SalarySplitReference,
});

const pensionRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/naslagwerk/pensioen",
  component: PensionReference,
});

const routeTree = rootRoute.addChildren([indexRoute, naslagwerkRoute, pensionRoute]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
