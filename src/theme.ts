export type Theme = "auto" | "light" | "dark";

export const THEME_KEY = "bt-theme";
export const THEME_CYCLE: Theme[] = ["auto", "light", "dark"];

export function loadTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
  } catch {
    return "auto";
  }
}

export function applyTheme(theme: Theme): void {
  // Vite also compiles this source into the blocking head script before first paint.
  const effective =
    theme === "auto"
      ? typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.setAttribute("data-bs-theme", effective);
}
