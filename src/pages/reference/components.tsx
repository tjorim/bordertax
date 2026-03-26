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
    <Card
      className="mb-4"
      style={{
        background: "var(--bt-surface-2)",
        border: `1px solid ${borderColor}`,
        borderRadius: "var(--bt-r-lg)",
      }}
    >
      <Card.Header
        style={{
          background: "var(--bt-surface-3)",
          borderBottom: `1px solid ${borderColor}`,
          borderRadius: "var(--bt-r-lg) var(--bt-r-lg) 0 0",
        }}
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

export function NlBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      style={{
        background: "var(--bt-nl-dim)",
        color: "var(--bt-nl-light)",
        border: "1px solid var(--bt-nl-border)",
        fontWeight: 500,
      }}
    >
      {children}
    </Badge>
  );
}

export function BeBadge({ children }: { children: React.ReactNode }) {
  return (
    <Badge
      style={{
        background: "var(--bt-be-dim)",
        color: "var(--bt-be-light)",
        border: "1px solid var(--bt-be-border)",
        fontWeight: 500,
      }}
    >
      {children}
    </Badge>
  );
}

export function TipBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="note"
      className="p-3 rounded mb-3"
      style={{
        background: "var(--bt-info-dim)",
        border: "1px solid rgba(96,165,250,0.25)",
        fontSize: "0.9rem",
      }}
    >
      <i className="bi bi-lightbulb-fill me-2" style={{ color: "var(--bt-info)" }} />
      {children}
    </div>
  );
}

export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div
      role="alert"
      className="p-3 rounded mb-3"
      style={{
        background: "var(--bt-warning-dim)",
        border: "1px solid rgba(245,158,11,0.3)",
        fontSize: "0.9rem",
      }}
    >
      <i className="bi bi-exclamation-triangle-fill me-2" style={{ color: "var(--bt-warning)" }} />
      {children}
    </div>
  );
}
