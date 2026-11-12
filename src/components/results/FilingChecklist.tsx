import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert } from "@/components/ui/alert";
import { ClipboardCheckIcon, TriangleAlertIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import type { TaxResult } from "@/tax/types";
import * as m from "@/paraglide/messages.js";
import { fmtExact as fmt } from "../format.js";

interface Props {
  result: TaxResult;
  /** Controlled open state; the checklist manages its own state when omitted. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type FilingRow =
  | { kind: "row"; label: string; value: string; source: string; strong?: boolean }
  | { kind: "group"; label: string };

/**
 * One table from the `table` breakpoint up. Below it the rows stack as field / value / source
 * cards, so no column needs sideways scrolling; the header row stays for screen readers.
 */
function FilingRows({ rows }: { rows: FilingRow[] }) {
  return (
    <Table bordered className="mb-2 text-sm max-table:block">
      <TableHeader className="bg-surface-3 max-table:sr-only">
        <TableRow>
          <TableHead>{m.filing_field()}</TableHead>
          <TableHead className="text-end">{m.filing_value()}</TableHead>
          <TableHead>{m.filing_source()}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody className="max-table:block">
        {rows.map((row) =>
          row.kind === "group" ? (
            <TableRow key={row.label} variant="secondary" className="max-table:block">
              <TableHead
                colSpan={3}
                scope="colgroup"
                className="px-2 py-table-mobile text-sm leading-table tracking-normal text-text normal-case max-table:block table:px-3 table:py-table-cell"
              >
                {row.label}
              </TableHead>
            </TableRow>
          ) : (
            <TableRow
              key={row.label}
              className="max-table:mb-2 max-table:flex max-table:flex-col max-table:rounded-sm max-table:border max-table:border-border max-table:bg-surface-2"
            >
              <TableCell className="max-table:pb-0 max-table:font-medium">{row.label}</TableCell>
              <TableCell className={cn("text-end max-table:py-0", row.strong && "font-semibold")}>
                {row.value}
              </TableCell>
              <TableCell className="max-table:pt-0 max-table:text-text-muted">
                {row.source}
              </TableCell>
            </TableRow>
          ),
        )}
      </TableBody>
    </Table>
  );
}

/** Turns the calculator's inputs and results into the entries needed in each return. */
export default function FilingChecklist({ result, open, onOpenChange }: Props) {
  const { inputs, nl, be } = result;

  const nlRows: FilingRow[] = [
    {
      kind: "row",
      label: m.filing_nl_loon(),
      value: fmt(inputs.grossSalary),
      source: m.filing_source_jaaropgave(),
    },
    {
      kind: "row",
      label: m.filing_nl_loonheffing(),
      value: fmt(inputs.withheldTaxNL),
      source: m.filing_source_jaaropgave(),
    },
    {
      kind: "row",
      label: m.filing_nl_arbeidskorting(),
      value: m.filing_nl_arbeidskorting_value(),
      source: m.filing_nl_arbeidskorting_source(),
    },
    {
      kind: "row",
      label: m.filing_nl_fully_taxed(),
      value: m.filing_nl_fully_taxed_value(),
      source: m.filing_source_workdays(),
    },
    {
      kind: "row",
      label: m.nl_not_taxed_income(),
      value: fmt(nl.deelNietInNLBelast),
      source: m.filing_source_calculated_workdays(),
      strong: true,
    },
  ];
  const beRows: FilingRow[] = be
    ? [
        {
          kind: "row",
          label: m.filing_be_1250(),
          value: fmt(be.declaredIncome),
          source: m.filing_be_1250_source(),
          strong: true,
        },
        {
          kind: "row",
          label: m.filing_be_1257(),
          value: fmt(inputs.socialContributions),
          source: m.filing_source_health_insurer(),
        },
        { kind: "group", label: m.filing_be_o2_title() },
        {
          kind: "row",
          label: m.filing_be_1250_nl(),
          value: fmt(Math.max(0, be.declaredIncome - be.beIncome)),
          source: m.filing_be_1250_nl_source(),
          strong: true,
        },
        {
          kind: "row",
          label: m.filing_be_o2_1257(),
          value: fmt(inputs.socialContributions),
          source: m.filing_source_health_insurer(),
        },
        {
          kind: "row",
          label: m.filing_be_1285(),
          value: fmt(inputs.aanvullendPensioen),
          source: m.filing_source_pension(),
        },
        {
          kind: "row",
          label: m.filing_be_1437(),
          value: fmt(inputs.roerendeVoorheffing),
          source: m.filing_source_bank(),
        },
      ]
    : [];

  return (
    <Accordion
      id="filing-checklist"
      className="mt-6 scroll-mt-32"
      value={open === undefined ? undefined : open ? ["filing"] : []}
      onValueChange={(value) => onOpenChange?.(value.includes("filing"))}
    >
      <AccordionItem value="filing">
        <AccordionTrigger id="filing-checklist-trigger">
          <ClipboardCheckIcon aria-hidden="true" className="size-4 shrink-0 self-start mt-0.5" />
          <span className="flex flex-col gap-0.5">
            <span>{m.filing_title()}</span>
            <span className="text-sm font-normal tracking-normal text-text-muted">
              {m.filing_summary()}
            </span>
          </span>
        </AccordionTrigger>
        <AccordionContent>
          <p className="text-text-muted text-sm mb-4">{m.filing_intro()}</p>

          <Alert variant="warning" role="note" className="text-sm py-2">
            <TriangleAlertIcon
              aria-hidden="true"
              className="inline size-4 shrink-0 align-text-bottom me-2"
            />
            {m.filing_estimate_notice()}
          </Alert>

          <h6 className="mb-1">{m.filing_documents_title()}</h6>
          <ul className="text-sm mb-6">
            <li>{m.filing_document_jaaropgave()}</li>
            <li>{m.filing_document_workdays()}</li>
            <li>{m.filing_document_deductions()}</li>
          </ul>

          <h6 className="mb-1">🇳🇱 {m.filing_nl_title()}</h6>
          <p className="text-sm mb-2">
            {m.filing_nl_intro()}{" "}
            <a href="https://mijn.belastingdienst.nl/" target="_blank" rel="noreferrer">
              Mijn Belastingdienst
            </a>
            .
          </p>
          <FilingRows rows={nlRows} />
          <p className="text-text-muted text-sm mb-6">{m.filing_nl_result_notice()}</p>

          {be && (
            <>
              <h6 className="mb-1">🇧🇪 {m.filing_be_title()}</h6>
              <p className="text-sm mb-2">
                {m.filing_be_intro()}{" "}
                <a
                  href="https://financien.belgium.be/nl/E-services/Tax-on-web?language=nl"
                  target="_blank"
                  rel="noreferrer"
                >
                  MyMinfin / Tax-on-web
                </a>
                .
              </p>
              <FilingRows rows={beRows} />
              <p className="text-text-muted text-sm mb-0">{m.filing_be_result_notice()}</p>
            </>
          )}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
