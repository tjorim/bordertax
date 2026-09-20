import { Alert, Table } from "react-bootstrap";
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
    <section className="mt-4" aria-labelledby="filing-checklist-title">
      <h5 id="filing-checklist-title" className="mb-2">
        <i className="bi bi-clipboard-check me-2" />
        {m.filing_title()}
      </h5>
      <p className="text-muted small mb-3">{m.filing_intro()}</p>

      <Alert variant="warning" role="note" className="small py-2">
        <i className="bi bi-exclamation-triangle me-2" />
        {m.filing_estimate_notice()}
      </Alert>

      <h6 className="mb-1">{m.filing_documents_title()}</h6>
      <ul className="small mb-4">
        <li>{m.filing_document_jaaropgave()}</li>
        <li>{m.filing_document_workdays()}</li>
        <li>{m.filing_document_deductions()}</li>
      </ul>

      <h6 className="mb-1">🇳🇱 {m.filing_nl_title()}</h6>
      <p className="small mb-2">
        {m.filing_nl_intro()} {" "}
        <a href="https://mijn.belastingdienst.nl/" target="_blank" rel="noreferrer">
          Mijn Belastingdienst
        </a>
        .
      </p>
      <Table bordered size="sm" className="small mb-2">
        <thead className="table-light">
          <tr>
            <th>{m.filing_field()}</th>
            <th className="text-end">{m.filing_value()}</th>
            <th>{m.filing_source()}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{m.filing_nl_loon()}</td>
            <td className="text-end">{fmt(inputs.grossSalary)}</td>
            <td>{m.filing_source_jaaropgave()}</td>
          </tr>
          <tr>
            <td>{m.filing_nl_loonheffing()}</td>
            <td className="text-end">{fmt(inputs.withheldTaxNL)}</td>
            <td>{m.filing_source_jaaropgave()}</td>
          </tr>
          <tr>
            <td>{m.filing_nl_arbeidskorting()}</td>
            <td className="text-end">{m.filing_nl_arbeidskorting_value()}</td>
            <td>{m.filing_nl_arbeidskorting_source()}</td>
          </tr>
          <tr>
            <td>{m.filing_nl_fully_taxed()}</td>
            <td className="text-end">{m.filing_nl_fully_taxed_value()}</td>
            <td>{m.filing_source_workdays()}</td>
          </tr>
          <tr>
            <td>{m.nl_not_taxed_income()}</td>
            <td className="text-end fw-semibold">{fmt(nl.deelNietInNLBelast)}</td>
            <td>{m.filing_source_calculated_workdays()}</td>
          </tr>
        </tbody>
      </Table>
      <p className="text-muted small mb-4">{m.filing_nl_result_notice()}</p>

      {be && (
        <>
          <h6 className="mb-1">🇧🇪 {m.filing_be_title()}</h6>
          <p className="small mb-2">
            {m.filing_be_intro()} {" "}
            <a
              href="https://financien.belgium.be/nl/E-services/Tax-on-web?language=nl"
              target="_blank"
              rel="noreferrer"
            >
              MyMinfin / Tax-on-web
            </a>
            .
          </p>
          <Table bordered size="sm" className="small mb-2">
            <thead className="table-light">
              <tr>
                <th>{m.filing_field()}</th>
                <th className="text-end">{m.filing_value()}</th>
                <th>{m.filing_source()}</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{m.filing_be_1250()}</td>
                <td className="text-end fw-semibold">{fmt(be.declaredIncome)}</td>
                <td>{m.filing_be_1250_source()}</td>
              </tr>
              <tr>
                <td>{m.filing_be_1257()}</td>
                <td className="text-end">{fmt(inputs.socialContributions)}</td>
                <td>{m.filing_source_health_insurer()}</td>
              </tr>
              <tr className="table-secondary">
                <th colSpan={3} scope="colgroup">
                  {m.filing_be_o2_title()}
                </th>
              </tr>
              <tr>
                <td>{m.filing_be_1250_nl()}</td>
                <td className="text-end fw-semibold">{fmt(Math.max(0, be.declaredIncome - be.beIncome))}</td>
                <td>{m.filing_be_1250_nl_source()}</td>
              </tr>
              <tr>
                <td>{m.filing_be_o2_1257()}</td>
                <td className="text-end">{fmt(inputs.socialContributions)}</td>
                <td>{m.filing_source_health_insurer()}</td>
              </tr>
              <tr>
                <td>{m.filing_be_1285()}</td>
                <td className="text-end">{fmt(inputs.aanvullendPensioen)}</td>
                <td>{m.filing_source_pension()}</td>
              </tr>
              <tr>
                <td>{m.filing_be_1437()}</td>
                <td className="text-end">{fmt(inputs.roerendeVoorheffing)}</td>
                <td>{m.filing_source_bank()}</td>
              </tr>
            </tbody>
          </Table>
          <p className="text-muted small mb-0">{m.filing_be_result_notice()}</p>
        </>
      )}
    </section>
  );
}
