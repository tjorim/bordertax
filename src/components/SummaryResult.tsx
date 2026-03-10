import { useEffect, useState } from "react";
import { Alert, Button, Col, ProgressBar, Row, Stack, Table } from "react-bootstrap";
import type { TaxResult } from "../tax/types";
import { getTotalWorkdays } from "../tax/workdays";
import * as m from "../paraglide/messages.js";
import { formatPercent, formatRoundedCurrency, formatSignedCurrency } from "./format";

interface Props {
  result: TaxResult;
  onResetInputs: () => void;
}

export default function SummaryResult({ result, onResetInputs }: Props) {
  const [copyStatus, setCopyStatus] = useState<"idle" | "success" | "error">("idle");
  const { grossIncome, totalTax, netIncome, effectiveRateTotal, nl, be } = result;
  const withheldTaxNL = result.inputs.withheldTaxNL ?? 0;
  const nlBalance = withheldTaxNL - nl.netTaxNL;
  const netResult = nlBalance - (be?.netTaxBE ?? 0);
  const totalWorkdays = getTotalWorkdays(result.inputs);

  const nlPct = grossIncome > 0 ? (nl.netTaxNL / grossIncome) * 100 : 0;
  const bePct = grossIncome > 0 ? ((be?.netTaxBE ?? 0) / grossIncome) * 100 : 0;
  const netPct = 100 - nlPct - bePct;

  useEffect(() => {
    if (copyStatus === "idle") {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyStatus("idle");
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyStatus]);

  async function copySummary() {
    const lines = [
      `${m.app_title()} (${result.inputs.year})`,
      `${m.summary_gross_income()} ${formatRoundedCurrency(grossIncome)}`,
      `${m.summary_dutch_tax()} ${formatRoundedCurrency(nl.netTaxNL)}`,
      `${m.summary_belgian_tax()} ${formatRoundedCurrency(be?.netTaxBE ?? 0)}`,
      `${m.summary_total_tax()} ${formatRoundedCurrency(totalTax)}`,
      `${m.summary_net_income()} ${formatRoundedCurrency(netIncome)}`,
      `${m.summary_effective_rate_total()} ${formatPercent(effectiveRateTotal, 1)}`,
    ].join("\n");

    try {
      await navigator.clipboard.writeText(lines);
      setCopyStatus("success");
    } catch {
      setCopyStatus("error");
    }
  }

  return (
    <div>
      <Stack direction="horizontal" gap={2} className="mb-3">
        <Button variant="outline-primary" size="sm" onClick={() => void copySummary()}>
          <i className="bi bi-clipboard me-1" />
          {m.summary_copy()}
        </Button>
        <Button variant="outline-secondary" size="sm" onClick={onResetInputs}>
          <i className="bi bi-arrow-counterclockwise me-1" />
          {m.summary_reset()}
        </Button>
      </Stack>

      {copyStatus === "success" && (
        <Alert variant="success" className="py-2">
          {m.summary_copy_success()}
        </Alert>
      )}
      {copyStatus === "error" && (
        <Alert variant="warning" className="py-2">
          {m.summary_copy_error()}
        </Alert>
      )}

      <h6 className="text-muted mb-3">{m.summary_title()}</h6>

      <Table bordered className="mb-4">
        <tbody>
          <tr>
            <td>{m.summary_gross_income()}</td>
            <td className="text-end fw-semibold">{formatRoundedCurrency(grossIncome)}</td>
          </tr>
          <tr>
            <td>{"\uD83C\uDDF3\uD83C\uDDF1"} {m.summary_dutch_tax()}</td>
            <td className="text-end text-danger">{"\u2212"}{formatRoundedCurrency(nl.netTaxNL)}</td>
          </tr>
          {be && be.netTaxBE > 0 && (
            <tr>
              <td>{"\uD83C\uDDE7\uD83C\uDDEA"} {m.summary_belgian_tax()}</td>
              <td className="text-end text-danger">{"\u2212"}{formatRoundedCurrency(be.netTaxBE)}</td>
            </tr>
          )}
          <tr className="table-secondary fw-semibold">
            <td>{m.summary_total_tax()}</td>
            <td className="text-end text-danger">{"\u2212"}{formatRoundedCurrency(totalTax)}</td>
          </tr>
          <tr className="table-success fw-bold fs-5">
            <td>{m.summary_net_income()}</td>
            <td className="text-end">{formatRoundedCurrency(netIncome)}</td>
          </tr>
          <tr>
            <td>{m.summary_effective_rate_total()}</td>
            <td className="text-end">{formatPercent(effectiveRateTotal, 1)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="fw-semibold small mb-2">{m.summary_allocation()}</p>
      <ProgressBar className="mb-2" style={{ height: "1.5rem" }}>
          <ProgressBar
          variant="success"
          now={netPct}
          key={1}
          label={`${m.summary_net_label()} ${formatPercent(netPct / 100, 1)}`}
        />
        <ProgressBar
          variant="danger"
          now={nlPct}
          key={2}
          label={`NL ${formatPercent(nlPct / 100, 1)}`}
        />
        {bePct > 0 && (
          <ProgressBar
            variant="warning"
            now={bePct}
            key={3}
            label={`BE ${formatPercent(bePct / 100, 1)}`}
          />
        )}
      </ProgressBar>

      <Row className="mt-3 text-center g-3">
        <Col>
            <div className="border rounded p-3">
              <div className="text-muted small">{m.summary_net_monthly()}</div>
              <div className="fs-5 fw-bold text-success">
                {formatRoundedCurrency(netIncome / 12)}
              </div>
            </div>
          </Col>
          <Col>
            <div className="border rounded p-3">
              <div className="text-muted small">{m.summary_effective_rate()}</div>
              <div className="fs-5 fw-bold">{formatPercent(effectiveRateTotal, 1)}</div>
            </div>
          </Col>
          <Col>
            <div className="border rounded p-3">
              <div className="text-muted small">{m.summary_net_daily()}</div>
              <div className="fs-5 fw-bold text-success">
                {totalWorkdays > 0 ? formatRoundedCurrency(netIncome / totalWorkdays) : "\u2014"}
              </div>
            </div>
          </Col>
      </Row>

      {withheldTaxNL > 0 && (
        <>
          <h6 className="text-muted mt-4 mb-3">{m.summary_eindafrekening()}</h6>
          <Table bordered className="mb-0">
            <tbody>
              <tr>
                <td>{"\uD83C\uDDF3\uD83C\uDDF1"} {m.summary_withheld_nl()}</td>
                <td className="text-end">{formatRoundedCurrency(withheldTaxNL)}</td>
              </tr>
              <tr>
                <td>{"\uD83C\uDDF3\uD83C\uDDF1"} {m.summary_nl_owed()}</td>
                <td className="text-end text-danger">{"\u2212"}{formatRoundedCurrency(nl.netTaxNL)}</td>
              </tr>
              <tr className={nlBalance >= 0 ? "table-success" : "table-danger"}>
                <td className="fw-semibold">{"\uD83C\uDDF3\uD83C\uDDF1"} {m.summary_nl_balance()}</td>
                <td
                  className={`text-end fw-semibold ${nlBalance >= 0 ? "text-success" : "text-danger"}`}
                >
                  {formatSignedCurrency(nlBalance)}
                </td>
              </tr>
              {be && be.netTaxBE > 0 && (
                <tr>
                  <td>{"\uD83C\uDDE7\uD83C\uDDEA"} {m.summary_be_owed()}</td>
                  <td className="text-end text-danger">{"\u2212"}{formatRoundedCurrency(be.netTaxBE)}</td>
                </tr>
              )}
              <tr
                className={
                  netResult >= 0 ? "table-success fw-bold fs-5" : "table-danger fw-bold fs-5"
                }
              >
                <td>{m.summary_net_result()}</td>
                <td className={`text-end ${netResult >= 0 ? "text-success" : "text-danger"}`}>
                  {formatSignedCurrency(netResult)}
                </td>
              </tr>
            </tbody>
          </Table>
        </>
      )}
    </div>
  );
}
