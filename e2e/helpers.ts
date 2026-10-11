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

export async function expectNoAxeViolations(page: Page) {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      targets: v.nodes.map((n) => n.target.join(" ")),
    })),
  ).toEqual([]);
}
