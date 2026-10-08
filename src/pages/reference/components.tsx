import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ExternalLink, FileText, Lightbulb, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// ── Shared styled sub-components for reference pages ────────────

export function SectionCard({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title: string;
  icon: LucideIcon;
  accent?: "nl" | "be" | "neutral";
  children: React.ReactNode;
}) {
  const accents = {
    nl: "border-nl-border",
    be: "border-be-border",
    neutral: "border-border",
  };
  const iconAccents = {
    nl: "text-nl-border",
    be: "text-be-border",
    neutral: "text-border",
  };
  const borderClass = accents[accent ?? "neutral"];

  return (
    <Card className={cn("mb-6", borderClass)}>
      <CardHeader className={borderClass}>
        <h5 className="mb-0 font-semibold">
          <Icon
            aria-hidden="true"
            className={cn("inline size-5 me-2 align-text-bottom", iconAccents[accent ?? "neutral"])}
          />
          {title}
        </h5>
      </CardHeader>
      <CardContent className="pt-4">{children}</CardContent>
    </Card>
  );
}

function CountryBadge({ variant, children }: { variant: "nl" | "be"; children: React.ReactNode }) {
  return <Badge variant={variant}>{children}</Badge>;
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
      className={`flex justify-between items-baseline py-2 px-4 ref-stat-row${highlight ? " ref-stat-row--highlight" : ""}`}
    >
      <span className="ref-stat-row__label">{label}</span>
      <div className="text-end">
        <span
          className={`ref-stat-row__value${highlight ? " ref-stat-row__value--highlight" : " font-medium"}`}
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
    <div role="note" className="p-4 rounded-md mb-4 ref-tip-box">
      <Lightbulb
        aria-hidden="true"
        className="inline size-4 shrink-0 align-text-bottom me-2 text-info"
      />
      {children}
    </div>
  );
}

export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="p-4 rounded-md mb-4 ref-warn-box">
      <TriangleAlert
        aria-hidden="true"
        className="inline size-4 shrink-0 align-text-bottom me-2 text-warning"
      />
      {children}
    </div>
  );
}

export function DocLink({
  href,
  title,
  sub,
  className,
}: {
  href: string;
  title: string;
  sub: string;
  className?: string;
}) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="no-underline">
      <div
        className={cn(
          "ref-link-card ref-link-card-body p-4 rounded-md flex items-center gap-4",
          className,
        )}
      >
        <FileText
          aria-hidden="true"
          className="inline size-8 shrink-0 align-text-bottom text-danger"
        />
        <div>
          <div className="font-semibold text-sm ref-text">{title}</div>
          <div className="ref-footnote">{sub}</div>
        </div>
        <ExternalLink
          aria-hidden="true"
          className="inline size-4 shrink-0 align-text-bottom ms-auto text-text-muted size-3.5"
        />
      </div>
    </a>
  );
}

export function RefAccordionItem({
  value,
  title,
  children,
  className,
}: {
  value: string;
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <AccordionItem value={value} className={className}>
      <AccordionTrigger>
        <span className="text-sm font-semibold">{title}</span>
      </AccordionTrigger>
      <AccordionContent className="ref-accordion-body">{children}</AccordionContent>
    </AccordionItem>
  );
}
