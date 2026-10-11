import { expect, test } from "@playwright/test";
import { seedPreferences } from "./helpers";

test.beforeEach(async ({ page }) => {
  await seedPreferences(page, "en", "light");
  await page.goto("/");
});

test("loads the calculator with a summary result", async ({ page }) => {
  await expect(page.getByRole("link", { name: "Bordertax" })).toBeVisible();
  await expect(page.getByLabel("Tax year", { exact: true })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Summary" })).toHaveAttribute("aria-selected", "true");
  await expect(page.getByRole("tabpanel")).toBeVisible();
});

test("changing the year and income updates the page", async ({ page }) => {
  const year = page.getByLabel("Tax year", { exact: true });
  const options = await year.locator("option").allTextContents();
  const otherYear = options.find((y) => y !== "2025");
  expect(otherYear).toBeDefined();
  await year.selectOption(otherYear!);
  await expect(page.getByText(`Tax year ${otherYear}`)).toBeVisible();

  const summary = page.getByRole("tabpanel");
  const before = await summary.innerText();
  await page.getByLabel("Gross annual salary (€)").fill("85000");
  await expect.poll(() => summary.innerText()).not.toBe(before);
});

test("switches between result tabs", async ({ page }) => {
  for (const name of ["Netherlands", "Belgium", "Year comparison", "Home ratio", "Summary"]) {
    const tab = page.getByRole("tab", { name });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tabpanel", { name })).toBeVisible();
  }
});

test("cycles the theme through auto, light and dark", async ({ page }) => {
  const root = page.locator("html");
  await expect(root).toHaveAttribute("data-theme", "light");
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await expect(root).toHaveAttribute("data-theme", "dark");
  await page.getByRole("button", { name: /^Theme:/ }).click();
  await expect(root).toHaveAttribute("data-theme", /light|dark/);
  await expect(page.getByRole("button", { name: "Theme: auto" })).toBeVisible();
});

test("switches locale in place", async ({ page }) => {
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await page.getByRole("button", { name: "NL" }).click();
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await expect(page.getByRole("tab", { name: "Overzicht" })).toBeVisible();
});

test("localizes reference page URLs", async ({ page }) => {
  await page.goto("/naslagwerk");
  await expect(page.locator("html")).toHaveAttribute("lang", "nl");
  await page.goto("/reference");
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});
