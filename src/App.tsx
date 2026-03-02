import { useEffect, useMemo, useState } from 'react';
import { Alert, Col, Container, Nav, Navbar, Row, Tab } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css';

import InputPanel from './components/InputPanel';
import NLResult from './components/NLResult';
import BEResult from './components/BEResult';
import SummaryResult from './components/SummaryResult';
import MultiYearComparison from './components/MultiYearComparison';
import { calculate } from './tax';
import type { TaxInputs } from './tax/types';
import {
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from './tax/constants';

const DEFAULT_INPUTS: TaxInputs = {
  year: 2025,
  residentCountry: 'BE',
  civilStatus: 'single',
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: 'flemish',
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 200,
  daysWorkedBE: 20,
  thirtyPercentRuling: false,
};

const STORAGE_KEY = 'grensarbeider-tax-inputs-v1';

function sanitizeInputs(raw: unknown): TaxInputs {
  if (!raw || typeof raw !== 'object') {
    return DEFAULT_INPUTS;
  }

  const input = raw as Partial<TaxInputs>;

  const isOneOf = <T,>(value: unknown, options: readonly T[]): value is T =>
    options.includes(value as T);

  return {
    year: isOneOf(input.year, VALID_YEARS) ? input.year : DEFAULT_INPUTS.year,
    residentCountry: isOneOf(input.residentCountry, VALID_RESIDENT_COUNTRIES) ? input.residentCountry : DEFAULT_INPUTS.residentCountry,
    civilStatus: isOneOf(input.civilStatus, VALID_CIVIL_STATUSES) ? input.civilStatus : DEFAULT_INPUTS.civilStatus,
    dependentChildren: Number.isFinite(input.dependentChildren) ? Math.min(10, Math.max(0, Number(input.dependentChildren))) : DEFAULT_INPUTS.dependentChildren,
    belowAOWAge: typeof input.belowAOWAge === 'boolean' ? input.belowAOWAge : DEFAULT_INPUTS.belowAOWAge,
    belgianRegion: isOneOf(input.belgianRegion, VALID_BELGIAN_REGIONS) ? input.belgianRegion : DEFAULT_INPUTS.belgianRegion,
    communalTaxRate: Number.isFinite(input.communalTaxRate) ? Math.min(15, Math.max(0, Number(input.communalTaxRate))) : DEFAULT_INPUTS.communalTaxRate,
    grossSalary: Number.isFinite(input.grossSalary) ? Math.max(0, Number(input.grossSalary)) : DEFAULT_INPUTS.grossSalary,
    daysWorkedNL: Number.isFinite(input.daysWorkedNL) ? Math.max(0, Number(input.daysWorkedNL)) : DEFAULT_INPUTS.daysWorkedNL,
    daysWorkedBE: Number.isFinite(input.daysWorkedBE) ? Math.max(0, Number(input.daysWorkedBE)) : DEFAULT_INPUTS.daysWorkedBE,
    thirtyPercentRuling: typeof input.thirtyPercentRuling === 'boolean' ? input.thirtyPercentRuling : DEFAULT_INPUTS.thirtyPercentRuling,
  };
}

function loadInitialInputs(): TaxInputs {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return DEFAULT_INPUTS;
  }

  try {
    return sanitizeInputs(JSON.parse(saved));
  } catch {
    return DEFAULT_INPUTS;
  }
}

export default function App() {
  const [inputs, setInputs] = useState<TaxInputs>(loadInitialInputs);

  const result = useMemo(() => calculate(inputs), [inputs]);
  const comparisonResults = useMemo(
    () =>
      VALID_YEARS.map((year) => ({
        year,
        result: year === inputs.year ? result : calculate({ ...inputs, year }),
      })),
    [inputs, result],
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand>
            🇧🇪&thinsp;🇳🇱&nbsp; Border Worker Tax Calculator
          </Navbar.Brand>
          <Navbar.Text className="text-secondary small">
            Tax year {inputs.year}
          </Navbar.Text>
        </Container>
      </Navbar>

      <Container fluid="lg" className="pb-5">
        <Row className="g-4">
          {/* ── Left column: inputs ────────────────────────────── */}
          <Col lg={5}>
            <InputPanel inputs={inputs} onChange={setInputs} />
          </Col>

          {/* ── Right column: results ──────────────────────────── */}
          <Col lg={7}>
            {inputs.year === 2026 && (
              <Alert variant="warning" className="small py-2">
                <i className="bi bi-exclamation-triangle me-2" />
                2026 tax rates are provisional estimates — official tables have not yet been published.
                Results for 2026 may be inaccurate.
              </Alert>
            )}
            <Tab.Container defaultActiveKey="summary">
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link eventKey="summary">
                    <i className="bi bi-pie-chart-fill me-1" />
                    Summary
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="nl" aria-label="Netherlands">
                    🇳🇱 Nederland
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="be" aria-label="Belgium">
                    🇧🇪 België
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="years">
                    <i className="bi bi-bar-chart-line-fill me-1" />
                    Year comparison
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="summary">
                  <SummaryResult
                    result={result}
                    onResetInputs={() => setInputs(DEFAULT_INPUTS)}
                  />
                </Tab.Pane>
                <Tab.Pane eventKey="nl">
                  <NLResult result={result.nl} />
                </Tab.Pane>
                <Tab.Pane eventKey="be">
                  <BEResult result={result.be} residentCountry={inputs.residentCountry} />
                </Tab.Pane>
                <Tab.Pane eventKey="years">
                  <MultiYearComparison rows={comparisonResults} activeYear={inputs.year} />
                </Tab.Pane>
              </Tab.Content>
            </Tab.Container>
          </Col>
        </Row>
      </Container>

      <footer className="text-center text-muted small py-3 border-top mt-4">
        Calculations are indicative. Always consult a tax advisor for your final tax return.
        &nbsp;|&nbsp; Sources:{' '}
        <a href="https://www.belastingdienst.nl" target="_blank" rel="noreferrer">
          Belastingdienst
        </a>{' '}
        &amp;{' '}
        <a href="https://fin.belgium.be" target="_blank" rel="noreferrer">
          FOD Financiën
        </a>
      </footer>
    </>
  );
}
