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
    nl: "tw:border-nl-border",
    be: "tw:border-be-border",
    neutral: "tw:border-border",
  };
  const iconAccents = {
    nl: "tw:text-nl-border",
    be: "tw:text-be-border",
    neutral: "tw:text-border",
  };
  const borderClass = accents[accent ?? "neutral"];

  return (
    <Card className={cn("tw:mb-6", borderClass)}>
      <CardHeader className={borderClass}>
        <h5 className="tw:mb-0 tw:font-semibold">
          <Icon
            aria-hidden="true"
            className={cn(
              "tw:inline tw:size-5 tw:me-2 tw:align-text-bottom",
              iconAccents[accent ?? "neutral"],
            )}
          />
          {title}
        </h5>
      </CardHeader>
      <CardContent className="tw:pt-4">{children}</CardContent>
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
      className={`tw:flex tw:justify-between tw:items-baseline tw:py-2 tw:px-4 ref-stat-row${highlight ? " ref-stat-row--highlight" : ""}`}
    >
      <span className="ref-stat-row__label">{label}</span>
      <div className="tw:text-end">
        <span
          className={`ref-stat-row__value${highlight ? " ref-stat-row__value--highlight" : " tw:font-medium"}`}
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
    <div role="note" className="tw:p-4 tw:rounded-md tw:mb-4 ref-tip-box">
      <Lightbulb
        aria-hidden="true"
        className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-2 tw:text-info"
      />
      {children}
    </div>
  );
}

export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <div role="alert" className="tw:p-4 tw:rounded-md tw:mb-4 ref-warn-box">
      <TriangleAlert
        aria-hidden="true"
        className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:me-2 tw:text-warning"
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
    <a href={href} target="_blank" rel="noreferrer" className="tw:no-underline">
      <div
        className={cn(
          "ref-link-card ref-link-card-body tw:p-4 tw:rounded-md tw:flex tw:items-center tw:gap-4",
          className,
        )}
      >
        <FileText
          aria-hidden="true"
          className="tw:inline tw:size-8 tw:shrink-0 tw:align-text-bottom tw:text-danger"
        />
        <div>
          <div className="tw:font-semibold tw:text-sm ref-text">{title}</div>
          <div className="ref-footnote">{sub}</div>
        </div>
        <ExternalLink
          aria-hidden="true"
          className="tw:inline tw:size-4 tw:shrink-0 tw:align-text-bottom tw:ms-auto tw:text-text-muted tw:size-3.5"
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
        <span className="tw:text-sm tw:font-semibold">{title}</span>
      </AccordionTrigger>
      <AccordionContent className="ref-accordion-body">{children}</AccordionContent>
    </AccordionItem>
  );
}
