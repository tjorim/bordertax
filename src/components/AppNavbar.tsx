import { useEffect, useState } from "react";
import {
  BookOpen,
  Calculator,
  ChevronDown,
  SunMoon,
  Menu,
  Moon,
  PiggyBank,
  Sun,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "./ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "./ui/dropdown-menu";
import { Link } from "@tanstack/react-router";
import { getLocale, setLocale } from "../paraglide/runtime.js";
import * as m from "../paraglide/messages.js";
import { type Theme, THEME_KEY, THEME_CYCLE, loadTheme, applyTheme } from "../theme";
import { REFERENCE_PAGES } from "../referencePages";

function ThemeToggleButton() {
  const [theme, setThemeState] = useState<Theme>(loadTheme);

  useEffect(() => {
    if (theme === "auto" && typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

  const cycleTheme = () => {
    const next = THEME_CYCLE[(THEME_CYCLE.indexOf(theme) + 1) % THEME_CYCLE.length]!;
    applyTheme(next);
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      // Keep the in-memory theme change when persistence is unavailable.
    }
    setThemeState(next);
  };

  const Icon = theme === "light" ? Sun : theme === "dark" ? Moon : SunMoon;
  const label =
    theme === "light" ? m.theme_light() : theme === "dark" ? m.theme_dark() : m.theme_auto();

  return (
    <Button
      onClick={cycleTheme}
      aria-label={`${m.theme_toggle_label()}: ${label}`}
      title={`${m.theme_toggle_label()}: ${label} (click to cycle)`}
    >
      <Icon className="tw:size-4" aria-hidden="true" />
    </Button>
  );
}

// onSwitch: when provided, switches locale in-place ({ reload: false }) then calls the
// callback so the parent can trigger a re-render. When absent, delegates to Paraglide's
// default navigation (needed by reference pages that use URL-based locale paths).
function LanguageToggleButton({ onSwitch }: { onSwitch?: () => void } = {}) {
  const [locale, setLocaleState] = useState(getLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // Sync with back/forward navigation — Paraglide has no subscription API.
  useEffect(() => {
    const sync = () => {
      const currentLocale = getLocale();
      setLocaleState(currentLocale);
      onSwitch?.();
    };
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, [onSwitch]);

  const nextLangLabel = locale === "en" ? m.lang_nl() : m.lang_en();

  return (
    <Button
      onClick={() => {
        const nextLocale = locale === "en" ? "nl" : "en";
        if (onSwitch) {
          setLocale(nextLocale, { reload: false });
          setLocaleState(nextLocale);
          document.documentElement.lang = nextLocale;
          onSwitch();
        } else {
          setLocale(nextLocale);
        }
      }}
      aria-label={nextLangLabel}
    >
      {nextLangLabel}
    </Button>
  );
}

interface AppNavbarProps {
  children?: React.ReactNode;
  // Provide to use in-place locale switch (homepage). Omit for URL-navigation
  // locale switch (reference pages).
  onLocaleSwitch?: () => void;
}

export function AppNavbar({ children, onLocaleSwitch }: AppNavbarProps) {
  const [desktop, setDesktop] = useState(() => window.innerWidth >= 992);
  const [mobileOpen, setMobileOpen] = useState(false);
  useEffect(() => {
    const sync = () => setDesktop(window.innerWidth >= 992);
    sync();
    window.addEventListener("resize", sync);
    return () => window.removeEventListener("resize", sync);
  }, []);
  return (
    <Collapsible
      open={desktop || mobileOpen}
      onOpenChange={(open) => setMobileOpen(open)}
      render={<header />}
      className="tw:sticky tw:top-0 tw:z-40 tw:mb-6 tw:border-b tw:border-border tw:bg-navbar-bg tw:backdrop-blur-xl"
    >
      <div aria-hidden="true" className="tw:flex tw:h-0.5 tw:opacity-75">
        <span className="tw:w-1/2 tw:bg-nl" />
        <span className="tw:w-1/2 tw:bg-be" />
      </div>
      <div className="tw:mx-auto tw:flex tw:max-w-6xl tw:flex-wrap tw:items-center tw:gap-3 tw:px-3 tw:py-3">
        <span className="tw:text-xl tw:font-bold" aria-label="Belgium and Netherlands">
          🇧🇪&thinsp;🇳🇱
        </span>
        <CollapsibleTrigger
          render={<Button />}
          aria-label="Toggle navigation"
          className="tw:ml-auto tw:shell:hidden"
        >
          <Menu className="tw:size-5" aria-hidden="true" />
        </CollapsibleTrigger>
        <CollapsibleContent
          id="app-navbar-nav"
          keepMounted
          className="tw:hidden tw:w-full tw:flex-col tw:gap-3 tw:data-open:flex tw:shell:flex tw:shell:w-auto tw:shell:flex-1 tw:shell:flex-row tw:shell:items-center"
        >
          <nav
            aria-label="Main navigation"
            className="tw:flex tw:flex-col tw:gap-3 tw:shell:mr-auto tw:shell:flex-row tw:shell:items-center"
          >
            <Link
              to="/"
              className="tw:text-text-sub tw:no-underline tw:hover:text-text tw:focus-visible:outline-2 tw:focus-visible:outline-ring"
              activeProps={{ className: "tw:text-text" }}
            >
              Bordertax
            </Link>
            <DropdownMenu>
              <DropdownMenuTrigger render={<Button />} className="tw:border-transparent">
                <BookOpen className="tw:size-4" aria-hidden="true" />
                {m.ref_overview_hub_title()}
                <ChevronDown className="tw:size-3" aria-hidden="true" />
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                {REFERENCE_PAGES.map((page) => {
                  const Icon = page.route === "/reference/salary-split" ? Calculator : PiggyBank;
                  return (
                    <DropdownMenuItem key={page.route} render={<Link to={page.route} />}>
                      <Icon
                        className={cn(
                          "tw:size-4",
                          page.route === "/reference/salary-split"
                            ? "tw:text-nl-light"
                            : "tw:text-be-light",
                        )}
                        aria-hidden="true"
                      />
                      {page.titleFn()}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>
          <div className="tw:flex tw:items-center tw:gap-3">
            {children}
            <ThemeToggleButton />
            <LanguageToggleButton onSwitch={onLocaleSwitch} />
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
