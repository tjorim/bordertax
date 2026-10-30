import { expect, test } from "@playwright/test";
import { expectNoAxeViolations, seedPreferences, LOCALES, THEMES } from "./helpers";

for (const locale of LOCALES) {
  for (const theme of THEMES) {
    for (const width of [1440, 390]) {
      test(`${locale} ${theme} ${width}: compare controls, keyboard and accessibility`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height: 900 });
        await seedPreferences(page, locale, theme);
        const compareChunks: string[] = [];
        page.on("request", (request) => {
          if (/ScenarioCompare.*\.js/.test(request.url())) compareChunks.push(request.url());
        });
        await page.goto("/");
        await expect(page.getByRole("tablist")).toBeVisible();
        expect(compareChunks).toHaveLength(0);
        const tab = page.getByRole("tab", {
          name: locale === "en" ? "Compare" : "Vergelijken",
          exact: true,
        });
        await tab.focus();
        await page.keyboard.press("Enter");
        await expect(tab).toHaveAttribute("aria-selected", "true");
        const salary = page.getByLabel(
          locale === "en" ? "B: gross annual salary" : "B: bruto jaarloon",
        );
        await salary.fill("80000");
        expect(compareChunks.length).toBeGreaterThan(0);
        await expect(
          page.getByRole("region", { name: /annual net income|jaarlijkse netto-inkomen/ }),
        ).toContainText(locale === "en" ? "Gross salary" : "Brutoloon");
        await page
          .getByRole("button", {
            name: locale === "en" ? "Copy current situation" : "Huidige situatie kopiëren",
          })
          .click();
        await expect(
          page.getByText(
            locale === "en" ? "Both scenarios are identical." : "Beide situaties zijn gelijk.",
          ),
        ).toBeVisible();
        await expectNoAxeViolations(page);
      });
    }
  }
}
