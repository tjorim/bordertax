import { useEffect, useState } from "react";
import { Button, Container, Nav, NavDropdown, Navbar } from "react-bootstrap";
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

  const icon =
    theme === "light" ? "bi-sun-fill" : theme === "dark" ? "bi-moon-fill" : "bi-circle-half";
  const label =
    theme === "light" ? m.theme_light() : theme === "dark" ? m.theme_dark() : m.theme_auto();

  return (
    <Button
      variant="outline-secondary"
      size="sm"
      className="ms-2"
      onClick={cycleTheme}
      aria-label={`${m.theme_toggle_label()}: ${label}`}
      title={`${m.theme_toggle_label()}: ${label} (click to cycle)`}
    >
      <i className={`bi ${icon}`} />
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
      variant="outline-light"
      size="sm"
      className="ms-3"
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
  return (
    <Navbar expand="lg" className="mb-4">
      <Container>
        <Navbar.Brand>🇧🇪&thinsp;🇳🇱</Navbar.Brand>
        <Navbar.Toggle aria-controls="app-navbar-nav" />
        <Navbar.Collapse id="app-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link as={Link} to="/" activeProps={{ className: "active" }}>
              Bordertax
            </Nav.Link>
            <NavDropdown
              title={
                <>
                  <i className="bi bi-book me-1" />
                  {m.ref_overview_hub_title()}
                </>
              }
              id="ref-nav-dropdown"
            >
              {REFERENCE_PAGES.map((page) => (
                <NavDropdown.Item key={page.route} as={Link} to={page.route}>
                  <i className={`bi ${page.icon} me-2`} style={{ color: page.iconColor }} />
                  {page.titleFn()}
                </NavDropdown.Item>
              ))}
            </NavDropdown>
          </Nav>
          {children}
          <ThemeToggleButton />
          <LanguageToggleButton onSwitch={onLocaleSwitch} />
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
