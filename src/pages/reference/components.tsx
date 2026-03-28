import { useEffect, useState } from "react";
import { Badge, Button, Card } from "react-bootstrap";
import { getLocale, setLocale } from "../../paraglide/runtime.js";
import * as m from "../../paraglide/messages.js";

// ── Shared styled sub-components for reference pages ────────────

export function SectionCard({
  title,
  icon,
  accent,
  children,
}: {
  title: string;
  icon: string;
  accent?: "nl" | "be" | "neutral";
  children: React.ReactNode;
}) {
  const borderColor =
    accent === "nl"
      ? "var(--bt-nl-border)"
      : accent === "be"
        ? "var(--bt-be-border)"
        : "var(--bt-border)";

  return (
    <Card className="mb-4 ref-section-card" style={{ border: `1px solid ${borderColor}` }}>
      <Card.Header
        className="ref-section-card__header"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <h5 className="mb-0 fw-semibold">
          <i className={`bi ${icon} me-2`} style={{ color: borderColor }} />
          {title}
        </h5>
      </Card.Header>
      <Card.Body className="pt-3">{children}</Card.Body>
    </Card>
  );
}

function CountryBadge({ variant, children }: { variant: "nl" | "be"; children: React.ReactNode }) {
  const className = variant === "nl" ? "ref-badge-nl" : "ref-badge-be";
  return <Badge className={className}>{children}</Badge>;
}

export function NlBadge({ children }: { children: React.ReactNode }) {
  return <CountryBadge variant="nl">{children}</CountryBadge>;
}

export function BeBadge({ children }: { children: React.ReactNode }) {
  return <CountryBadge variant="be">{children}</CountryBadge>;
}

export function StatRow({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`d-flex justify-content-between align-items-baseline py-2 px-3 ref-stat-row${highlight ? " ref-stat-row--highlight" : ""}`}
    >
      <span className="ref-stat-row__label">{label}</span>
      <div className="text-end">
        <span
          className={`ref-stat-row__value${highlight ? " ref-stat-row__value--highlight" : ""}`}
          style={highlight ? undefined : { fontWeight: 500 }}
        >
          {value}
        </span>
        {sub && <div className="ref-stat-row__sub">{sub}</div>}
      </div>
    </div>
  );
}

export function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="note" className="p-3 rounded mb-3 ref-tip-box">
      <i className="bi bi-lightbulb-fill me-2" style={{ color: "var(--bt-info)" }} />
      {children}
    </div>
  );
}

export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="p-3 rounded mb-3 ref-warn-box">
      <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: "var(--bt-warning)" }} />
      {children}
    </div>
  );
}

export function LanguageToggleButton({ onToggle }: { onToggle?: () => void } = {}) {
  const [locale, setLocaleState] = useState(getLocale());

  // Synchronise with external locale changes triggered by browser history
  // navigation (popstate). Paraglide has no subscription API, so popstate is
  // the best available signal when setLocale is called with { reload: false }.
  useEffect(() => {
    const sync = () => setLocaleState(getLocale());
    window.addEventListener("popstate", sync);
    return () => window.removeEventListener("popstate", sync);
  }, []);

  const nextLangLabel = locale === "en" ? m.lang_nl() : m.lang_en();

  return (
    <Button
      variant="outline-light"
      size="sm"
      className="ms-3"
      onClick={() => {
        const nextLocale = locale === "en" ? "nl" : "en";
        setLocale(nextLocale, { reload: false });
        setLocaleState(nextLocale);
        document.documentElement.lang = nextLocale;
        onToggle?.();
      }}
      aria-label={nextLangLabel}
    >
      {nextLangLabel}
    </Button>
  );
}
