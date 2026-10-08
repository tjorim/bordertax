import { Alert } from "@/components/ui/alert";
import { ClipboardCheck, TriangleAlert } from "lucide-react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";

import type { TaxResult } from "../tax/types";
import * as m from "../paraglide/messages.js";
import { fmtExact as fmt } from "./format.js";

interface Props {
  result: TaxResult;
}

/** Turns the calculator's inputs and results into the entries needed in each return. */
export default function FilingChecklist({ result }: Props) {
  const { inputs, nl, be } = result;

  return (
    <section className="mt-6" aria-labelledby="filing-checklist-title">
      <h5 id="filing-checklist-title" className="mb-2">
        <ClipboardCheck
          aria-hidden="true"
          className="inline size-4 shrink-0 align-text-bottom me-2"
        />
        {m.filing_title()}
      </h5>
      <p className="text-text-muted text-sm mb-4">{m.filing_intro()}</p>

      <Alert variant="warning" role="note" className="text-sm py-2">
        <TriangleAlert
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
      <Table bordered className="text-sm mb-2">
        <TableHeader className="bg-surface-3">
          <TableRow>
            <TableHead>{m.filing_field()}</TableHead>
            <TableHead className="text-end">{m.filing_value()}</TableHead>
            <TableHead>{m.filing_source()}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>{m.filing_nl_loon()}</TableCell>
            <TableCell className="text-end">{fmt(inputs.grossSalary)}</TableCell>
            <TableCell>{m.filing_source_jaaropgave()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.filing_nl_loonheffing()}</TableCell>
            <TableCell className="text-end">{fmt(inputs.withheldTaxNL)}</TableCell>
            <TableCell>{m.filing_source_jaaropgave()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.filing_nl_arbeidskorting()}</TableCell>
            <TableCell className="text-end">{m.filing_nl_arbeidskorting_value()}</TableCell>
            <TableCell>{m.filing_nl_arbeidskorting_source()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.filing_nl_fully_taxed()}</TableCell>
            <TableCell className="text-end">{m.filing_nl_fully_taxed_value()}</TableCell>
            <TableCell>{m.filing_source_workdays()}</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>{m.nl_not_taxed_income()}</TableCell>
            <TableCell className="text-end font-semibold">{fmt(nl.deelNietInNLBelast)}</TableCell>
            <TableCell>{m.filing_source_calculated_workdays()}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
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
          <Table bordered className="text-sm mb-2">
            <TableHeader className="bg-surface-3">
              <TableRow>
                <TableHead>{m.filing_field()}</TableHead>
                <TableHead className="text-end">{m.filing_value()}</TableHead>
                <TableHead>{m.filing_source()}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{m.filing_be_1250()}</TableCell>
                <TableCell className="text-end font-semibold">{fmt(be.declaredIncome)}</TableCell>
                <TableCell>{m.filing_be_1250_source()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{m.filing_be_1257()}</TableCell>
                <TableCell className="text-end">{fmt(inputs.socialContributions)}</TableCell>
                <TableCell>{m.filing_source_health_insurer()}</TableCell>
              </TableRow>
              <TableRow variant="secondary" className="">
                <TableHead
                  colSpan={3}
                  scope="colgroup"
                  className="text-sm leading-table normal-case tracking-normal text-text px-2 py-table-mobile table:px-3 table:py-table-cell"
                >
                  {m.filing_be_o2_title()}
                </TableHead>
              </TableRow>
              <TableRow>
                <TableCell>{m.filing_be_1250_nl()}</TableCell>
                <TableCell className="text-end font-semibold">
                  {fmt(Math.max(0, be.declaredIncome - be.beIncome))}
                </TableCell>
                <TableCell>{m.filing_be_1250_nl_source()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{m.filing_be_o2_1257()}</TableCell>
                <TableCell className="text-end">{fmt(inputs.socialContributions)}</TableCell>
                <TableCell>{m.filing_source_health_insurer()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{m.filing_be_1285()}</TableCell>
                <TableCell className="text-end">{fmt(inputs.aanvullendPensioen)}</TableCell>
                <TableCell>{m.filing_source_pension()}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{m.filing_be_1437()}</TableCell>
                <TableCell className="text-end">{fmt(inputs.roerendeVoorheffing)}</TableCell>
                <TableCell>{m.filing_source_bank()}</TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <p className="text-text-muted text-sm mb-0">{m.filing_be_result_notice()}</p>
        </>
      )}
    </section>
  );
}
