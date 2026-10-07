import { runInNewContext } from "node:vm";
import { describe, expect, it, vi, afterEach } from "vitest";
import { themeBootScript } from "../scripts/theme-bootstrap";
import { applyTheme, loadTheme, THEME_KEY } from "../src/theme";

afterEach(() => vi.restoreAllMocks());

describe("theme bootstrap and runtime agree", () => {
  it.each(["light", "dark", "auto", "invalid", null])(
    "resolves stored %s before hydration",
    async (stored) => {
      const code = await themeBootScript();
      for (const prefersDark of [false, true]) {
        vi.spyOn(window, "matchMedia").mockReturnValue({ matches: prefersDark } as MediaQueryList);
        if (stored !== null) localStorage.setItem(THEME_KEY, stored);
        else localStorage.clear();
        applyTheme(loadTheme());
        const setAttribute = vi.fn();
        runInNewContext(code, {
          localStorage: { getItem: () => stored },
          window: { matchMedia: () => ({ matches: prefersDark }) },
          document: { documentElement: { setAttribute } },
        });
        expect(setAttribute).toHaveBeenCalledWith(
          "data-bs-theme",
          document.documentElement.getAttribute("data-bs-theme"),
        );
        expect(document.documentElement.getAttribute("data-bs-theme")).toBe(
          stored === "light" || stored === "dark" ? stored : prefersDark ? "dark" : "light",
        );
      }
    },
  );

  it("falls back when storage and matchMedia are unavailable", async () => {
    const setAttribute = vi.fn();
    runInNewContext(await themeBootScript(), {
      localStorage: {
        getItem() {
          throw new Error("blocked");
        },
      },
      window: {},
      document: { documentElement: { setAttribute } },
    });
    expect(setAttribute).toHaveBeenCalledWith("data-bs-theme", "light");
    vi.spyOn(localStorage, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(loadTheme()).toBe("auto");
  });
});
