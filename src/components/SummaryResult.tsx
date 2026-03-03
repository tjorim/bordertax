import { useEffect, useState } from 'react';
import { Alert, Button, Col, ProgressBar, Row, Stack, Table } from 'react-bootstrap';
import type { TaxResult } from '../tax/types';
import * as m from '../paraglide/messages.js';

interface Props {
  result: TaxResult;
  onResetInputs: () => void;
}

const DEFAULT_WORKDAYS = 220;

const fmt = (n: number) =>
  n.toLocaleString('nl-NL', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export default function SummaryResult({ result, onResetInputs }: Props) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const { grossIncome, totalTax, netIncome, effectiveRateTotal, nl, be } = result;

  const nlPct = grossIncome > 0 ? (nl.netTaxNL / grossIncome) * 100 : 0;
  const bePct = grossIncome > 0 ? ((be?.netTaxBE ?? 0) / grossIncome) * 100 : 0;
  const netPct = 100 - nlPct - bePct;


  useEffect(() => {
    if (copyStatus === 'idle') {
      return;
    }

    const timer = window.setTimeout(() => {
      setCopyStatus('idle');
    }, 3000);

    return () => {
      window.clearTimeout(timer);
    };
  }, [copyStatus]);

  async function copySummary() {
    const lines = [
      `Border worker tax summary (${result.inputs.year})`,
      `Gross income: ${fmt(grossIncome)}`,
      `Dutch tax: ${fmt(nl.netTaxNL)}`,
      `Belgian tax: ${fmt(be?.netTaxBE ?? 0)}`,
      `Total tax: ${fmt(totalTax)}`,
      `Net income: ${fmt(netIncome)}`,
      `Effective total rate: ${pct(effectiveRateTotal)}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(lines);
      setCopyStatus('success');
    } catch {
      setCopyStatus('error');
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

      {copyStatus === 'success' && (
        <Alert variant="success" className="py-2">
          {m.summary_copy_success()}
        </Alert>
      )}
      {copyStatus === 'error' && (
        <Alert variant="warning" className="py-2">
          {m.summary_copy_error()}
        </Alert>
      )}

      <h6 className="text-muted mb-3">{m.summary_title()}</h6>

      <Table bordered className="mb-4">
        <tbody>
          <tr>
            <td>{m.summary_gross_income()}</td>
            <td className="text-end fw-semibold">{fmt(grossIncome)}</td>
          </tr>
          <tr>
            <td>🇳🇱 {m.summary_dutch_tax()}</td>
            <td className="text-end text-danger">−{fmt(nl.netTaxNL)}</td>
          </tr>
          {be && be.netTaxBE > 0 && (
            <tr>
              <td>🇧🇪 {m.summary_belgian_tax()}</td>
              <td className="text-end text-danger">−{fmt(be.netTaxBE)}</td>
            </tr>
          )}
          <tr className="table-secondary fw-semibold">
            <td>{m.summary_total_tax()}</td>
            <td className="text-end text-danger">−{fmt(totalTax)}</td>
          </tr>
          <tr className="table-success fw-bold fs-5">
            <td>{m.summary_net_income()}</td>
            <td className="text-end">{fmt(netIncome)}</td>
          </tr>
          <tr>
            <td>{m.summary_effective_rate_total()}</td>
            <td className="text-end">{pct(effectiveRateTotal)}</td>
          </tr>
        </tbody>
      </Table>

      <p className="fw-semibold small mb-2">{m.summary_allocation()}</p>
      <ProgressBar className="mb-2" style={{ height: '1.5rem' }}>
        <ProgressBar variant="success" now={netPct} key={1} label={`Net ${pct(netPct / 100)}`} />
        <ProgressBar variant="danger" now={nlPct} key={2} label={`NL ${pct(nlPct / 100)}`} />
        {bePct > 0 && (
          <ProgressBar variant="warning" now={bePct} key={3} label={`BE ${pct(bePct / 100)}`} />
        )}
      </ProgressBar>

      <Row className="mt-3 text-center g-3">
        <Col>
          <div className="border rounded p-3">
            <div className="text-muted small">{m.summary_net_monthly()}</div>
            <div className="fs-5 fw-bold text-success">{fmt(netIncome / 12)}</div>
          </div>
        </Col>
        <Col>
          <div className="border rounded p-3">
            <div className="text-muted small">{m.summary_effective_rate()}</div>
            <div className="fs-5 fw-bold">{pct(effectiveRateTotal)}</div>
          </div>
        </Col>
        <Col>
          <div className="border rounded p-3">
            <div className="text-muted small">{m.summary_net_daily()}</div>
            <div className="fs-5 fw-bold text-success">
              {fmt(netIncome / ((result.inputs.daysWorkedNL + result.inputs.daysWorkedBE) || DEFAULT_WORKDAYS))}
            </div>
          </div>
        </Col>
      </Row>
    </div>
  );
}
