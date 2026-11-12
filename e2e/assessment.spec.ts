import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, LOCALES, seedPreferences, THEMES } from "./helpers";

// Tab panels fade in; axe must not sample a half-transparent panel under load.
const axeWhenSettled = (page: Page) =>
  expect(async () => expectNoAxeViolations(page)).toPass({ timeout: 5000 });

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

for (const locale of LOCALES) {
  for (const theme of THEMES) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test.describe(`${locale} · ${theme} · ${viewportName}`, () => {
        test.use({ viewport });

        test("Dutch assessment: source, difference and provisional note", async ({ page }) => {
          await seedPreferences(page, locale, theme);
          await page.goto("/");
          const tax = page.locator("#assessment-income-tax");
          const premiums = page.locator("#assessment-premiums");
          const nlTab = page.getByRole("tab", {
            name: locale === "en" ? "Netherlands" : "Nederland",
          });
          const filingTab = page.getByRole("tab", {
            name: locale === "en" ? "Filing" : "Aangifte",
          });

          // Estimate: provisional note, no difference column.
          await filingTab.click();
          await expect(
            page.getByRole("note").filter({ hasText: /provisional|voorlopig/i }),
          ).toBeVisible();
          await axeWhenSettled(page);
          await nlTab.click();
          await expect(page.locator("#nl-charge-heading")).toBeVisible();
          await axeWhenSettled(page);

          // One figure only: the estimate stays in use and the other field asks for its pair.
          await tax.fill("2713.34");
          await expect(premiums).toHaveAttribute("aria-invalid", "true");
          await axeWhenSettled(page);

          // Both figures: the assessment is in use and the note turns final.
          await premiums.fill("5874.66");
          await expect(premiums).not.toHaveAttribute("aria-invalid", "true");
          await expect(page.locator("#nl-charge-heading")).toBeVisible();
          await expect(
            page
              .locator("table")
              .filter({ hasText: /5,874\.66|5\.874,66/ })
              .first(),
          ).toBeVisible();
          await axeWhenSettled(page);
          await filingTab.click();
          await expect(
            page.getByRole("note").filter({ hasText: /provisional|voorlopig/i }),
          ).toHaveCount(0);
          await axeWhenSettled(page);
          await page.getByRole("tab", { name: locale === "en" ? "Summary" : "Overzicht" }).click();
          // The summary fades in; axe must not sample a half-transparent panel.
          await axeWhenSettled(page);
        });
      });
    }
  }
}
