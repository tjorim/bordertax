import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, LOCALES, seedPreferences, THEMES, type Locale } from "./helpers";

const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
};

const ROUTES: Record<Locale, string[]> = {
  en: ["/", "/reference", "/reference/salary-split", "/reference/pension"],
  nl: ["/", "/naslagwerk", "/naslagwerk/salary-split", "/naslagwerk/pensioen"],
};

for (const locale of LOCALES) {
  for (const theme of THEMES) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      test.describe(`${locale} · ${theme} · ${viewportName}`, () => {
        test.use({ viewport });

        for (const route of ROUTES[locale]) {
          test(`axe: ${route}`, async ({ page }) => {
            await seedPreferences(page, locale, theme);
            await page.goto(route);
            await expect(page.locator("html")).toHaveAttribute("lang", locale);
            await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
            await expect(page.getByRole("heading").first()).toBeVisible();
            await expectNoAxeViolations(page);
          });
        }
      });
    }
  }
}
