import { useEffect, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { ClipboardIcon, TriangleAlertIcon } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import { cn } from "@/lib/utils";
import { MORTGAGE_QUALIFYING_MIN_NL_PERCENT } from "@/tax/constants";
import { yearParams } from "@/tax/assessmentYear";
import { compareSourcing, type SourcingComparison } from "@/tax/sourcing";
import type { TaxResult } from "@/tax/types";
import * as m from "@/paraglide/messages.js";
import { fmt, fmtExact, pct } from "../format.js";

interface Props {
  result: TaxResult;
}

type EntryFormat = "whole" | "cents" | "answer";

interface Row {
  key: string;
  field: string;
  value: string;
  format: EntryFormat;
  source: string;
  strong?: boolean;
}

interface Group {
  key: string;
  title?: string;
  rows: Row[];
}

const formatLabel = (format: EntryFormat) =>
  format === "whole"
    ? m.filing_format_whole()
    : format === "cents"
      ? m.filing_format_cents()
      : m.filing_format_answer();

/** Share of worldwide income taxed in NL as a whole percent, rounded down like the mortgage test. */
function nlTaxedPercent(result: TaxResult): number {
  return result.mortgage?.nlTaxedPercent ?? Math.floor(result.nlFractionDutchMethod * 100 + 1e-9);
}

function buildNlRows(result: TaxResult, statementArbeidskorting: number | undefined): Row[] {
  const { inputs, nl } = result;
  const percent = nlTaxedPercent(result);
  const ninetyPercentEstimate =
    result.mortgage === null ||
    result.mortgage.nlTaxedPercentIsUpperBound ||
    inputs.incomeOutsideNL === undefined;
  // The Dutch return lists the wage per employer; one statement keeps the plain labels.
  const several = inputs.annualStatements.length > 1;
  const statementRows = inputs.annualStatements.flatMap((statement, index): Row[] => {
    const number = index + 1;
    return [
      {
        key: `loon-${number}`,
        field: several ? m.filing_nl_loon_statement({ number }) : m.filing_nl_loon(),
        value: fmt(statement.taxableWage),
        format: "whole",
        source: m.filing_source_jaaropgave(),
      },
      {
        key: `loonheffing-${number}`,
        field: several ? m.filing_nl_loonheffing_statement({ number }) : m.filing_nl_loonheffing(),
        value: fmt(statement.wageTaxWithheld),
        format: "whole",
        source: m.filing_source_jaaropgave(),
      },
    ];
  });
  return [
    ...statementRows,
    {
      key: "arbeidskorting-statement",
      field: m.filing_nl_arbeidskorting_statement(),
      value:
        statementArbeidskorting === undefined
          ? m.filing_nl_arbeidskorting_statement_empty()
          : fmt(statementArbeidskorting),
      format: "whole",
      source: m.filing_nl_arbeidskorting_statement_source(),
    },
    {
      key: "arbeidskorting-calculated",
      field: m.filing_nl_arbeidskorting_calculated(),
      value: fmt(nl.arbeidskorting),
      format: "whole",
      source: m.filing_nl_arbeidskorting_calculated_source(),
    },
    {
      key: "lives-in-be",
      field: m.filing_nl_lives_in_be(),
      value: m.filing_answer_yes(),
      format: "answer",
      source: m.filing_nl_lives_in_be_source(),
    },
    {
      key: "insured",
      field: m.filing_nl_insured(),
      value: m.filing_answer_yes(),
      format: "answer",
      source: m.filing_nl_insured_source(),
    },
    {
      key: "ninety-percent",
      field: m.filing_nl_ninety_percent(),
      value:
        percent >= MORTGAGE_QUALIFYING_MIN_NL_PERCENT
          ? m.filing_answer_yes()
          : m.filing_answer_no(),
      format: "answer",
      source: ninetyPercentEstimate
        ? m.filing_nl_ninety_percent_source_estimate({ percent })
        : m.filing_nl_ninety_percent_source({ percent }),
    },
    {
      key: "fully-taxed",
      field: m.filing_nl_fully_taxed(),
      value: m.filing_answer_no(),
      format: "answer",
      source: m.filing_source_workdays(),
    },
    {
      key: "not-taxed",
      field: m.nl_not_taxed_income(),
      value: fmt(nl.deelNietInNLBelast),
      format: "whole",
      source: m.filing_source_calculated_workdays(),
      strong: true,
    },
  ];
}

function buildBeGroups(result: TaxResult): Group[] {
  const { inputs, be } = result;
  if (!be) return [];
  const groups: Group[] = [
    {
      key: "general",
      title: m.filing_be_group_general(),
      rows: [
        {
          key: "1250",
          field: m.filing_be_1250(),
          value: fmtExact(be.declaredIncome),
          format: "cents",
          source:
            result.nlCharge.source === "assessment"
              ? m.filing_be_1250_source_assessment()
              : m.filing_be_1250_source(),
          strong: true,
        },
        {
          key: "1257",
          field: m.filing_be_1257(),
          value: fmtExact(inputs.healthInsurancePremium),
          format: "cents",
          source: m.filing_source_health_insurer(),
        },
        {
          key: "1285",
          field: m.filing_be_1285(),
          value: fmtExact(inputs.supplementaryPension),
          format: "cents",
          source: m.filing_source_pension(),
        },
      ],
    },
    {
      key: "movable",
      title: m.filing_be_group_movable(),
      rows: [
        {
          key: "1437",
          field: m.filing_be_1437(),
          value: fmtExact(inputs.reclaimableWithholdingTax),
          format: "cents",
          source: m.filing_source_bank(),
        },
      ],
    },
  ];
  if (inputs.year <= 2024) {
    groups.push({
      key: "reductions",
      title: m.filing_be_group_reductions(),
      rows: [
        {
          key: "3364",
          field: m.filing_be_3364(),
          value: fmtExact(inputs.serviceVouchers),
          format: "cents",
          source: m.filing_be_3364_source(),
        },
      ],
    });
  }
  groups.push({
    key: "o2",
    title: m.filing_be_o2_title(),
    rows: [
      {
        key: "1250-nl",
        field: m.filing_be_1250_nl(),
        value: fmtExact(Math.max(0, be.declaredIncome - be.beIncome)),
        format: "cents",
        source: m.filing_be_1250_nl_source(),
        strong: true,
      },
      {
        key: "1257-nl",
        field: m.filing_be_o2_1257(),
        value: fmtExact(inputs.healthInsurancePremium),
        format: "cents",
        source: m.filing_source_health_insurer(),
      },
    ],
  });
  return groups;
}

/** Tab-separated text, ready to paste into a note or spreadsheet. */
function toClipboardText(
  nlRows: Row[],
  beGroups: Group[],
  year: number,
  provisional: boolean,
): string {
  const line = (row: Row) => `${row.field}\t${row.value}\t${formatLabel(row.format)}`;
  return [
    `${m.filing_title()} · ${m.income_year_with_assessment(yearParams(year))}`,
    "",
    m.filing_nl_title({ year }),
    ...nlRows.map(line),
    ...(beGroups.length > 0
      ? [
          "",
          m.filing_be_title(yearParams(year)),
          ...(provisional ? [m.filing_be_provisional()] : []),
          ...beGroups.flatMap((group) => [
            ...(group.title ? [group.title] : []),
            ...group.rows.map(line),
          ]),
        ]
      : []),
  ].join("\n");
}

function ChecklistHead() {
  return (
    <TableHeader className="bg-surface-3 max-table:sr-only">
      <TableRow>
        <TableHead>{m.filing_field()}</TableHead>
        <TableHead className="text-end">{m.filing_value()}</TableHead>
        <TableHead>{m.filing_format()}</TableHead>
        <TableHead>{m.filing_source()}</TableHead>
      </TableRow>
    </TableHeader>
  );
}

function ChecklistRow({ row }: { row: Row }) {
  return (
    <TableRow className="max-table:mb-2 max-table:flex max-table:flex-col max-table:rounded-sm max-table:border max-table:border-border max-table:bg-surface-2">
      <TableCell className="max-table:pb-0 max-table:font-medium">{row.field}</TableCell>
      <TableCell className={cn("text-end max-table:py-0", row.strong && "font-semibold")}>
        {row.value}
      </TableCell>
      <TableCell className="max-table:py-0 max-table:text-text-muted">
        {formatLabel(row.format)}
      </TableCell>
      <TableCell className="max-table:pt-0 max-table:text-text-muted">{row.source}</TableCell>
    </TableRow>
  );
}

/** Turns the calculator's inputs and results into the entries needed in each return. */
export default function FilingChecklist({ result }: Props) {
  const { inputs, be } = result;
  const [statementValue, setStatementValue] = useState("");
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");

  useEffect(() => {
    if (copyStatus === "idle") return;
    const timer = window.setTimeout(() => setCopyStatus("idle"), 3000);
    return () => window.clearTimeout(timer);
  }, [copyStatus]);

  const parsed = statementValue === "" ? Number.NaN : Number(statementValue);
  const statementArbeidskorting = Number.isFinite(parsed) ? Math.max(0, parsed) : undefined;
  const nlRows = buildNlRows(result, statementArbeidskorting);
  const beGroups = buildBeGroups(result);
  const sourcing = compareSourcing(result);
  // The Belgian figures depend on the Dutch tax actually charged; until the assessment is entered
  // they rest on the app's estimate.
  const provisional = result.nlCharge.source !== "assessment";

  async function copyValues() {
    try {
      await navigator.clipboard.writeText(
        toClipboardText(nlRows, beGroups, inputs.year, provisional),
      );
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <section aria-labelledby="filing-heading" className="flex flex-col gap-1">
      <h5 id="filing-heading" tabIndex={-1} className="mb-1 scroll-mt-32">
        {m.filing_title()}
      </h5>
      <p className="text-sm font-medium mb-1">{m.filing_year_line(yearParams(inputs.year))}</p>
      <p className="text-text-muted text-sm mb-4">{m.filing_intro()}</p>

      <Alert variant="warning" role="note" className="text-sm py-2">
        <TriangleAlertIcon
          aria-hidden="true"
          className="inline size-4 shrink-0 align-text-bottom me-2"
        />
        {m.filing_estimate_notice()}
      </Alert>

      <div className="mb-4">
        <Button variant="outline-primary" size="sm" onClick={() => void copyValues()}>
          <ClipboardIcon
            aria-hidden="true"
            className="inline size-4 shrink-0 align-text-bottom me-1"
          />
          {m.filing_copy()}
        </Button>
        {copyStatus === "success" && (
          <Alert variant="success" className="mt-4 mb-0 py-2">
            {m.filing_copy_success()}
          </Alert>
        )}
        {copyStatus === "error" && (
          <Alert variant="warning" className="mt-4 mb-0 py-2">
            {m.filing_copy_error()}
          </Alert>
        )}
      </div>

      <h6 className="mb-1">{m.filing_documents_title()}</h6>
      <ul className="text-sm mb-6">
        <li>{m.filing_document_jaaropgave()}</li>
        <li>{m.filing_document_workdays()}</li>
        <li>{m.filing_document_health_insurer()}</li>
        <li>{m.filing_document_pension()}</li>
        {inputs.year <= 2024 && <li>{m.filing_document_service_vouchers()}</li>}
        <li>{m.filing_document_bank()}</li>
        <li>{m.filing_document_assessment()}</li>
      </ul>

      <h6 className="mb-1">🇳🇱 {m.filing_nl_title({ year: inputs.year })}</h6>
      <p className="text-sm mb-2">
        {m.filing_nl_intro()}{" "}
        <a href="https://mijn.belastingdienst.nl/" target="_blank" rel="noreferrer">
          Mijn Belastingdienst
        </a>
        .
      </p>
      <Field className="mb-3">
        <FieldLabel htmlFor="filing-arbeidskorting">
          {m.filing_nl_arbeidskorting_input()}
        </FieldLabel>
        <Input
          id="filing-arbeidskorting"
          type="number"
          min={0}
          step={1}
          inputMode="decimal"
          value={statementValue}
          onChange={(event) => setStatementValue(event.target.value)}
          aria-describedby="filing-arbeidskorting-hint"
        />
        <FieldDescription id="filing-arbeidskorting-hint">
          {m.filing_nl_arbeidskorting_input_hint()}
        </FieldDescription>
      </Field>
      <Table bordered className="text-sm mb-2 max-table:block">
        <ChecklistHead />
        <TableBody className="max-table:block">
          {nlRows.map((row) => (
            <ChecklistRow key={row.key} row={row} />
          ))}
        </TableBody>
      </Table>
      <p className="text-text-muted text-sm mb-6">{m.filing_nl_result_notice()}</p>

      {be && (
        <>
          <h6 className="mb-1">🇧🇪 {m.filing_be_title(yearParams(inputs.year))}</h6>
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
          <Alert variant={provisional ? "warning" : "success"} role="note" className="text-sm py-2">
            {provisional ? m.filing_be_provisional() : m.filing_be_final()}
          </Alert>
          {be.federalReductionsUnused > 0 && (
            <Alert variant="info" role="note" className="text-sm py-2">
              {m.be_federal_reductions_unused({ amount: fmtExact(be.federalReductionsUnused) })}
            </Alert>
          )}
          <Table bordered className="text-sm mb-2 max-table:block">
            <ChecklistHead />
            <TableBody className="max-table:block">
              {beGroups.map((group) => (
                <GroupRows key={group.key} group={group} />
              ))}
            </TableBody>
          </Table>
          <p className="text-text-muted text-sm mb-0">{m.filing_be_result_notice()}</p>
          {sourcing.applies && <SourcingComparisonSection sourcing={sourcing} />}
        </>
      )}
    </section>
  );
}

function GroupRows({ group }: { group: Group }) {
  return (
    <>
      {group.title && (
        <TableRow variant="secondary" className="max-table:block">
          <TableHead
            colSpan={4}
            scope="colgroup"
            className="text-sm leading-table normal-case tracking-normal text-text px-2 py-table-mobile max-table:block whitespace-normal table:px-3 table:py-table-cell"
          >
            {group.title}
          </TableHead>
        </TableRow>
      )}
      {group.rows.map((row) => (
        <ChecklistRow key={row.key} row={row} />
      ))}
    </>
  );
}

/** The Dutch and Belgian splits of the wage side by side, with what the difference means. */
function SourcingComparisonSection({ sourcing }: { sourcing: SourcingComparison }) {
  const sides = [
    {
      key: "nl",
      title: m.filing_sourcing_nl_title(),
      rule: m.filing_sourcing_nl_rule(),
      share: sourcing.dutchShareOutsideNL,
      label: m.nl_not_taxed_income(),
      amount: fmt(sourcing.notTaxedInNL),
    },
    {
      key: "be",
      title: m.filing_sourcing_be_title(),
      rule: m.filing_sourcing_be_rule(),
      share: sourcing.belgianShareOutsideNL,
      label: m.filing_sourcing_be_amount(),
      amount: fmtExact(sourcing.belgianTaxableShareOfWage),
    },
  ];
  return (
    <section aria-labelledby="filing-sourcing-heading" className="mt-6 flex flex-col gap-2">
      <h6 id="filing-sourcing-heading" className="mb-0">
        {m.filing_sourcing_title()}
      </h6>
      <p className="text-sm mb-0">{m.filing_sourcing_intro()}</p>
      <div className="grid grid-cols-1 gap-2 table:grid-cols-2">
        {sides.map((side) => (
          <Card key={side.key} className="gap-1 p-3 text-sm">
            <p className="mb-0 font-semibold">{side.title}</p>
            <p className="mb-0 text-text-muted">{side.rule}</p>
            <p className="mb-0 text-text-muted">
              {m.filing_sourcing_share({ percent: pct(side.share) })}
            </p>
            <p className="mb-0">
              {side.label}: <span className="font-semibold tabular-nums">{side.amount}</span>
            </p>
          </Card>
        ))}
      </div>
      <p className="text-sm text-text-muted mb-0">
        {m.filing_sourcing_o1({ o1: fmtExact(sourcing.o1), o2: fmtExact(sourcing.o2) })}
      </p>
      <Alert
        variant={sourcing.doubleTaxationRisk > 0 ? "warning" : "info"}
        role="note"
        className="text-sm py-2 mb-0"
      >
        {sourcing.doubleTaxationRisk > 0
          ? m.filing_sourcing_risk({ amount: fmtExact(sourcing.doubleTaxationRisk) })
          : sourcing.taxedByNeither > 0
            ? m.filing_sourcing_neither({ amount: fmtExact(sourcing.taxedByNeither) })
            : m.filing_sourcing_equal()}
      </Alert>
      <p className="text-sm text-text-muted mb-0">{m.filing_sourcing_manual()}</p>
    </section>
  );
}
