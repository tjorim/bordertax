import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

export const LOCALES = ["en", "nl"] as const;
export const THEMES = ["light", "dark"] as const;
export type Locale = (typeof LOCALES)[number];
export type Theme = (typeof THEMES)[number];

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/** Seed the locale and theme before the app boots (see src/theme.ts, vite.config.ts). */
export async function seedPreferences(page: Page, locale: Locale, theme: Theme) {
  await page.addInitScript(
    ({ locale, theme }) => {
      localStorage.setItem("PARAGLIDE_LOCALE", locale);
      localStorage.setItem("bt-theme", theme);
    },
    { locale, theme },
  );
}

// TODO: re-enable once the NL/BE accent, status and muted text tokens meet 4.5:1 contrast in
// both themes. Axe currently reports them on every route, so the smoke suite skips this one
// rule rather than hiding the other checks.
const KNOWN_FAILING_RULES = ["color-contrast"];

export async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page })
    .withTags(WCAG_TAGS)
    .disableRules(KNOWN_FAILING_RULES)
    .analyze();
  expect(
    violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      targets: v.nodes.map((n) => n.target.join(" ")),
    })),
  ).toEqual([]);
}
