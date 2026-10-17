import { expect, test } from "@playwright/test";
import { seedPreferences } from "./helpers";

const CHART_CHUNK = "**/assets/js/WFHRatioChart-*.js";

test.beforeEach(async ({ page }) => {
  await seedPreferences(page, "en", "light");
});

test("defers the home ratio chart chunk until its tab is used", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/assets/js/")) scripts.push(request.url());
  });

  await page.goto("/");
  await expect(page.getByRole("tab", { name: "Summary" })).toHaveAttribute("aria-selected", "true");
  expect(scripts.filter((url) => /WFHRatioChart|Reference/.test(url))).toEqual([]);

  await page.getByRole("tab", { name: "Home ratio" }).click();
  await expect(page.getByRole("tabpanel", { name: "Home ratio" })).toBeVisible();
  await expect.poll(() => scripts.some((url) => url.includes("WFHRatioChart"))).toBe(true);
});

test("recovers when the chart chunk fails to load", async ({ page }) => {
  await page.route(CHART_CHUNK, (route) => route.abort());
  await page.goto("/");

  await page.getByRole("tab", { name: "Home ratio" }).click();
  const panel = page.getByRole("tabpanel", { name: "Home ratio" });
  await expect(panel.getByRole("alert")).toContainText("This section could not be loaded");
  // Other results stay usable while the chart is unavailable.
  await page.getByRole("tab", { name: "Netherlands" }).click();
  await expect(page.getByRole("tabpanel", { name: "Netherlands" })).toBeVisible();

  // Browsers may keep a failed module in their module map, so a reload is the reliable recovery.
  await page.unroute(CHART_CHUNK);
  await page.getByRole("tab", { name: "Home ratio" }).click();
  await panel.getByRole("button", { name: "Reload page" }).click();
  await page.getByRole("tab", { name: "Home ratio" }).click();
  await expect(panel.locator("svg").first()).toBeVisible();
  await expect(panel.getByRole("alert")).toHaveCount(0);
});

test("loads reference pages on demand and keeps history navigation working", async ({ page }) => {
  const scripts: string[] = [];
  page.on("request", (request) => {
    if (request.url().includes("/assets/js/")) scripts.push(request.url());
  });
  await page.goto("/");
  expect(scripts.some((url) => /PensionReference|ReferenceOverview/.test(url))).toBe(false);

  await page.getByRole("button", { name: "Reference Guide" }).click();
  await page.getByRole("menuitem", { name: /pension/i }).click();
  await expect(page).toHaveURL(/\/reference\/pension$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(scripts.some((url) => url.includes("PensionReference"))).toBe(true);

  await page.goBack();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("tab", { name: "Summary" })).toBeVisible();
  await page.goForward();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("opens a reference page directly, in both locales", async ({ page }) => {
  await page.goto("/reference/pension");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await seedPreferences(page, "nl", "light");
  await page.goto("/naslagwerk/pensioen");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
});
