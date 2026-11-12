import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { ExternalLinkIcon, FileTextIcon, LightbulbIcon, TriangleAlertIcon } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { fmtDate } from "@/components/format";
import { ACV_SESSION, referenceTaxSourceUrl } from "@/tax/reference";
import * as m from "../../paraglide/messages.js";

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
  // Country colour marks only the icon; the card keeps neutral surfaces.
  const iconAccents = {
    nl: "text-nl-light",
    be: "text-be-light",
    neutral: "text-text-muted",
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <h5 className="mb-0 font-semibold">
          <Icon
            aria-hidden="true"
            className={cn("inline size-5 me-2 align-text-bottom", iconAccents[accent ?? "neutral"])}
          />
          {title}
        </h5>
      </CardHeader>
      <CardContent>{children}</CardContent>
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

/**
 * The fixed place where a reference page states which income year it describes and where its
 * figures come from. Values come from `src/tax/reference` so both pages say the same thing.
 */
export function ReferenceMeta({ year }: { year: number }) {
  const taxSourceUrl = referenceTaxSourceUrl(year);
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-center text-xs text-text-muted">
      <Badge variant="secondary">{m.ref_meta_income_year({ year })}</Badge>
      <span>
        {m.ref_meta_acv_source({ date: fmtDate(ACV_SESSION.date), place: ACV_SESSION.place })}
      </span>
      <span>
        {m.ref_meta_tax_source({ year })}{" "}
        {taxSourceUrl ? (
          <a
            href={taxSourceUrl}
            target="_blank"
            rel="noreferrer"
            className="ref-text-info underline"
          >
            {m.ref_meta_tax_source_link()}
          </a>
        ) : (
          m.ref_meta_tax_source_link()
        )}
      </span>
    </div>
  );
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
    <Alert variant="info" role="note" className="text-sm">
      <LightbulbIcon
        aria-hidden="true"
        className="inline size-4 shrink-0 align-text-bottom me-2 text-info"
      />
      {children}
    </Alert>
  );
}

export function WarnBox({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="warning" className="text-sm">
      <TriangleAlertIcon
        aria-hidden="true"
        className="inline size-4 shrink-0 align-text-bottom me-2 text-warning"
      />
      {children}
    </Alert>
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
        <FileTextIcon
          aria-hidden="true"
          className="inline size-8 shrink-0 align-text-bottom text-danger"
        />
        <div>
          <div className="font-semibold text-sm ref-text">{title}</div>
          <div className="ref-footnote">{sub}</div>
        </div>
        <ExternalLinkIcon
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
