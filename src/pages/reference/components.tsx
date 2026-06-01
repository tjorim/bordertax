import { Badge, Card } from "react-bootstrap";

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

export function DocLink({
  href,
  title,
  sub,
  maxWidth,
}: {
  href: string;
  title: string;
  sub: string;
  maxWidth?: number;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="text-decoration-none">
      <div
        className="ref-link-card ref-link-card-body p-3 rounded d-flex align-items-center gap-3"
        style={maxWidth ? { maxWidth } : undefined}
      >
        <i className="bi bi-file-earmark-pdf-fill fs-2" style={{ color: "#e74c3c", flexShrink: 0 }} />
        <div>
          <div className="fw-semibold small ref-text">{title}</div>
          <div className="ref-footnote">{sub}</div>
        </div>
        <i className="bi bi-box-arrow-up-right ms-auto ref-icon-muted-sm" aria-hidden="true" />
      </div>
    </a>
  );
}
