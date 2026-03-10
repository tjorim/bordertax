import { useEffect, useMemo, useState } from "react";
import { Alert, Button, Col, Container, Nav, Navbar, Row, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

import InputPanel from "./components/InputPanel";
import NLResult from "./components/NLResult";
import BEResult from "./components/BEResult";
import SummaryResult from "./components/SummaryResult";
import MultiYearComparison from "./components/MultiYearComparison";
import { DEFAULT_INPUTS, loadStoredInputs, STORAGE_KEY } from "./app/inputState";
import { calculate } from "./tax";
import type { TaxInputs, TaxResult, TaxYear } from "./tax/types";
import { VALID_YEARS } from "./tax/constants";
import * as m from "./paraglide/messages.js";
import { getLocale, setLocale } from "./paraglide/runtime.js";
const STORAGE_WARNING =
  "Saved inputs could not be restored and were reset to the default example.";

interface ComparisonRow {
  year: TaxYear;
  result: TaxResult;
}

export default function App() {
  const initialState = loadStoredInputs(localStorage);
  const [inputs, setInputs] = useState<TaxInputs>(initialState.inputs);
  const [storageWarning, setStorageWarning] = useState<string | null>(
    initialState.resetCorruptStorage ? STORAGE_WARNING : null,
  );
  const [locale, setCurrentLocale] = useState(getLocale());
  const nextLangLabel = locale === "en" ? m.lang_nl() : m.lang_en();

  const { comparisonResults, comparisonWarning, result, resultError } = useMemo(() => {
    const rows: ComparisonRow[] = [];
    const comparisonFailures: TaxYear[] = [];
    let activeYearResult: TaxResult | null = null;
    let activeYearError: string | null = null;

    for (const year of VALID_YEARS) {
      try {
        const yearlyResult = calculate({ ...inputs, year });
        rows.push({ year, result: yearlyResult });

        if (year === inputs.year) {
          activeYearResult = yearlyResult;
        }
      } catch (error) {
        if (year === inputs.year) {
          activeYearError = error instanceof Error ? error.message : "Calculation failed.";
        } else {
          comparisonFailures.push(year);
        }
      }
    }

    return {
      comparisonResults: rows,
      comparisonWarning:
        comparisonFailures.length > 0
          ? `Some comparison years were skipped because they do not support the current inputs: ${comparisonFailures.join(", ")}.`
          : null,
      result: activeYearResult,
      resultError: activeYearError,
    };
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand>🇧🇪&thinsp;🇳🇱&nbsp; {m.app_title()}</Navbar.Brand>
          <Navbar.Text className="text-secondary small">
            {m.app_tax_year()} {inputs.year}
          </Navbar.Text>
          <Button
            variant="outline-light"
            size="sm"
            className="ms-3"
            onClick={() => {
              const nextLocale = locale === "en" ? "nl" : "en";
              setLocale(nextLocale, { reload: false });
              setCurrentLocale(nextLocale);
            }}
            aria-label={nextLangLabel}
          >
            {nextLangLabel}
          </Button>
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
            {storageWarning && (
              <Alert variant="warning" className="small py-2">
                <i className="bi bi-exclamation-triangle me-2" />
                {storageWarning}
                <Button
                  variant="link"
                  size="sm"
                  className="ms-2 p-0 align-baseline"
                  onClick={() => setStorageWarning(null)}
                >
                  Dismiss
                </Button>
              </Alert>
            )}
            {inputs.year === 2026 && (
              <Alert variant="warning" className="small py-2">
                <i className="bi bi-exclamation-triangle me-2" />
                {m.alert_2026_provisional()}
              </Alert>
            )}
            {comparisonWarning && (
              <Alert variant="warning" className="small py-2">
                <i className="bi bi-exclamation-triangle me-2" />
                {comparisonWarning}
              </Alert>
            )}
            {resultError && (
              <Alert variant="danger" className="small py-2">
                <i className="bi bi-exclamation-octagon me-2" />
                {resultError}
              </Alert>
            )}
            <Tab.Container defaultActiveKey="summary">
              <Nav variant="tabs" className="mb-3">
                <Nav.Item>
                  <Nav.Link eventKey="summary" aria-label={m.tabs_summary()}>
                    <i className="bi bi-pie-chart-fill me-1" />
                    {m.tabs_summary()}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="nl" aria-label={m.tabs_nl()}>
                    🇳🇱 {m.tabs_nl()}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="be" aria-label={m.tabs_be()}>
                    🇧🇪 {m.tabs_be()}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="years" aria-label={m.tabs_year_comparison()}>
                    <i className="bi bi-bar-chart-line-fill me-1" />
                    {m.tabs_year_comparison()}
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="summary">
                  {result && (
                    <SummaryResult
                      result={result}
                      onResetInputs={() => {
                        setInputs(DEFAULT_INPUTS);
                        setStorageWarning(null);
                      }}
                    />
                  )}
                </Tab.Pane>
                <Tab.Pane eventKey="nl">
                  {result && <NLResult result={result.nl} withheldTaxNL={inputs.withheldTaxNL} />}
                </Tab.Pane>
                <Tab.Pane eventKey="be">
                  <BEResult result={result?.be ?? null} residentCountry={inputs.residentCountry} />
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
        {m.footer_disclaimer()}
        &nbsp;|&nbsp; {m.footer_sources()}:{" "}
        <a href="https://www.belastingdienst.nl" target="_blank" rel="noreferrer">
          Belastingdienst
        </a>{" "}
        &amp;{" "}
        <a href="https://fin.belgium.be" target="_blank" rel="noreferrer">
          FOD Financiën
        </a>
      </footer>
    </>
  );
}
