import { defineConfig, devices } from "@playwright/test";
import base from "./playwright.config";
const baseURL = process.env.COMPATIBILITY_BASE_URL ?? "http://localhost:4190";
export default defineConfig({
  ...base,
  workers: 1,
  testMatch: ["**/calculator.spec.ts", "**/scenario-compare.spec.ts", "**/lazy-loading.spec.ts"],
  use: { ...base.use, baseURL, launchOptions: {} },
  projects: ["firefox", "webkit"].map((browser) => ({
    name: browser,
    use: {
      ...devices[browser === "firefox" ? "Desktop Firefox" : "Desktop Safari"],
      ...(browser === "firefox" && process.env.REMOTE_FIREFOX_WS_ENDPOINT
        ? { connectOptions: { wsEndpoint: process.env.REMOTE_FIREFOX_WS_ENDPOINT } }
        : {}),
      ...(browser === "webkit" && process.env.REMOTE_WEBKIT_WS_ENDPOINT
        ? { connectOptions: { wsEndpoint: process.env.REMOTE_WEBKIT_WS_ENDPOINT } }
        : {}),
    },
  })),
  webServer: process.env.COMPATIBILITY_BASE_URL
    ? undefined
    : {
        command: "pnpm build && pnpm exec vite preview --port 4190 --strictPort --no-open",
        url: baseURL,
        reuseExistingServer: false,
        timeout: 120_000,
      },
});
