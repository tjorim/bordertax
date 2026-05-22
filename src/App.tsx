import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Nav, Navbar, Row, Tab } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import "./styles.css";

import InputPanel from "./components/InputPanel";
import NLResult from "./components/NLResult";
import BEResult from "./components/BEResult";
import SummaryResult from "./components/SummaryResult";
import MultiYearComparison from "./components/MultiYearComparison";
import WFHRatioChart from "./components/WFHRatioChart";
import { calculate } from "./tax";
import type { TaxInputs } from "./tax/types";
import {
  VALID_BELGIAN_REGIONS,
  VALID_CIVIL_STATUSES,
  VALID_RESIDENT_COUNTRIES,
  VALID_YEARS,
} from "./tax/constants";
import * as m from "./paraglide/messages.js";
import { getLocale, setLocale } from "./paraglide/runtime.js";

type TaxInputsWithRequiredBEDeductions = TaxInputs & {
  socialContributions: number;
  aanvullendPensioen: number;
  dienstencheques: number;
  roerendeVoorheffing: number;
  withheldTaxNL: number;
  daysWorkedOther: number;
  sickDays: number;
};

const DEFAULT_INPUTS: TaxInputsWithRequiredBEDeductions = {
  year: 2025,
  residentCountry: "BE",
  civilStatus: "single",
  dependentChildren: 0,
  belowAOWAge: true,
  belgianRegion: "flemish",
  communalTaxRate: 7,
  grossSalary: 60000,
  daysWorkedNL: 200,
  daysWorkedBE: 20,
  daysWorkedOther: 0,
  thirtyPercentRuling: false,
  socialContributions: 0,
  aanvullendPensioen: 0,
  dienstencheques: 0,
  roerendeVoorheffing: 0,
  withheldTaxNL: 0,
  sickDays: 0,
};

const STORAGE_KEY = "grensarbeider-tax-inputs-v1";

function sanitizeInputs(raw: unknown): TaxInputs {
  if (!raw || typeof raw !== "object") {
    return DEFAULT_INPUTS;
  }

  const input = raw as Partial<TaxInputs>;

  const isOneOf = <T,>(value: unknown, options: readonly T[]): value is T =>
    options.includes(value as T);

  const sanitizeNonNegative = (value: unknown, defaultValue: number): number =>
    Number.isFinite(value) ? Math.max(0, Number(value)) : defaultValue;

  return {
    year: isOneOf(input.year, VALID_YEARS) ? input.year : DEFAULT_INPUTS.year,
    residentCountry: isOneOf(input.residentCountry, VALID_RESIDENT_COUNTRIES)
      ? input.residentCountry
      : DEFAULT_INPUTS.residentCountry,
    civilStatus: isOneOf(input.civilStatus, VALID_CIVIL_STATUSES)
      ? input.civilStatus
      : DEFAULT_INPUTS.civilStatus,
    dependentChildren: Number.isFinite(input.dependentChildren)
      ? Math.min(10, Math.max(0, Number(input.dependentChildren)))
      : DEFAULT_INPUTS.dependentChildren,
    belowAOWAge:
      typeof input.belowAOWAge === "boolean" ? input.belowAOWAge : DEFAULT_INPUTS.belowAOWAge,
    belgianRegion: isOneOf(input.belgianRegion, VALID_BELGIAN_REGIONS)
      ? input.belgianRegion
      : DEFAULT_INPUTS.belgianRegion,
    communalTaxRate: Number.isFinite(input.communalTaxRate)
      ? Math.min(15, Math.max(0, Number(input.communalTaxRate)))
      : DEFAULT_INPUTS.communalTaxRate,
    grossSalary: Number.isFinite(input.grossSalary)
      ? Math.max(0, Number(input.grossSalary))
      : DEFAULT_INPUTS.grossSalary,
    daysWorkedNL: Number.isFinite(input.daysWorkedNL)
      ? Math.max(0, Number(input.daysWorkedNL))
      : DEFAULT_INPUTS.daysWorkedNL,
    daysWorkedBE: Number.isFinite(input.daysWorkedBE)
      ? Math.max(0, Number(input.daysWorkedBE))
      : DEFAULT_INPUTS.daysWorkedBE,
    daysWorkedOther: sanitizeNonNegative(input.daysWorkedOther, DEFAULT_INPUTS.daysWorkedOther),
    thirtyPercentRuling:
      typeof input.thirtyPercentRuling === "boolean"
        ? input.thirtyPercentRuling
        : DEFAULT_INPUTS.thirtyPercentRuling,
    socialContributions: sanitizeNonNegative(
      input.socialContributions,
      DEFAULT_INPUTS.socialContributions,
    ),
    aanvullendPensioen: sanitizeNonNegative(
      input.aanvullendPensioen,
      DEFAULT_INPUTS.aanvullendPensioen,
    ),
    dienstencheques: sanitizeNonNegative(input.dienstencheques, DEFAULT_INPUTS.dienstencheques),
    roerendeVoorheffing: sanitizeNonNegative(
      input.roerendeVoorheffing,
      DEFAULT_INPUTS.roerendeVoorheffing,
    ),
    withheldTaxNL: sanitizeNonNegative(input.withheldTaxNL, DEFAULT_INPUTS.withheldTaxNL),
    sickDays: sanitizeNonNegative(input.sickDays, DEFAULT_INPUTS.sickDays),
  };
}

type PersistedInputs = Omit<
  TaxInputs,
  | "grossSalary"
  | "daysWorkedNL"
  | "daysWorkedBE"
  | "daysWorkedOther"
  | "sickDays"
  | "socialContributions"
  | "aanvullendPensioen"
  | "dienstencheques"
  | "roerendeVoorheffing"
  | "withheldTaxNL"
>;

function toPersistedInputs(inputs: TaxInputs): PersistedInputs {
  const {
    grossSalary: _grossSalary,
    daysWorkedNL: _daysWorkedNL,
    daysWorkedBE: _daysWorkedBE,
    daysWorkedOther: _daysWorkedOther,
    sickDays: _sickDays,
    socialContributions: _socialContributions,
    aanvullendPensioen: _aanvullendPensioen,
    dienstencheques: _dienstencheques,
    roerendeVoorheffing: _roerendeVoorheffing,
    withheldTaxNL: _withheldTaxNL,
    ...rest
  } = inputs;
  return rest;
}

function mergeWithDefaults(raw: unknown): TaxInputs {
  const sanitized = sanitizeInputs(raw);
  return {
    ...sanitized,
    grossSalary: DEFAULT_INPUTS.grossSalary,
    daysWorkedNL: DEFAULT_INPUTS.daysWorkedNL,
    daysWorkedBE: DEFAULT_INPUTS.daysWorkedBE,
    daysWorkedOther: DEFAULT_INPUTS.daysWorkedOther,
    sickDays: DEFAULT_INPUTS.sickDays,
    socialContributions: DEFAULT_INPUTS.socialContributions,
    aanvullendPensioen: DEFAULT_INPUTS.aanvullendPensioen,
    dienstencheques: DEFAULT_INPUTS.dienstencheques,
    roerendeVoorheffing: DEFAULT_INPUTS.roerendeVoorheffing,
    withheldTaxNL: DEFAULT_INPUTS.withheldTaxNL,
  };
}

function loadInitialInputs(): TaxInputs {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return DEFAULT_INPUTS;
  }

  try {
    return mergeWithDefaults(JSON.parse(saved));
  } catch {
    return DEFAULT_INPUTS;
  }
}

export default function App() {
  const [inputs, setInputs] = useState<TaxInputs>(loadInitialInputs);
  const [locale, setCurrentLocale] = useState(getLocale());
  const nextLangLabel = locale === "en" ? m.lang_nl() : m.lang_en();

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedInputs(inputs)));
  }, [inputs]);

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg" className="mb-4">
        <Container>
          <Navbar.Brand>🇧🇪&thinsp;🇳🇱&nbsp; {m.app_title()}</Navbar.Brand>
          <Navbar.Text className="text-secondary small">
            {m.app_tax_year()} {inputs.year}
          </Navbar.Text>
          <Link to="/reference" className="ms-3 text-decoration-none">
            <span className="text-light small opacity-75">
              <i className="bi bi-book me-1" />
              {m.ref_overview_hub_title()}
            </span>
          </Link>
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
        <Row className="g-4 bt-main-row">
          {/* ── Left column: inputs ────────────────────────────── */}
          <Col lg={5}>
            <InputPanel inputs={inputs} onChange={setInputs} />
          </Col>

          {/* ── Right column: results ──────────────────────────── */}
          <Col lg={7}>
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
                <Nav.Item>
                  <Nav.Link eventKey="wfh" aria-label={m.tabs_wfh_ratio()}>
                    <i className="bi bi-house-fill me-1" />
                    {m.tabs_wfh_ratio()}
                  </Nav.Link>
                </Nav.Item>
              </Nav>

              <Tab.Content>
                <Tab.Pane eventKey="summary">
                  <SummaryResult result={result} onResetInputs={() => setInputs(DEFAULT_INPUTS)} />
                </Tab.Pane>
                <Tab.Pane eventKey="nl" className="bt-nl-accent">
                  <NLResult
                    result={result.nl}
                    withheldTaxNL={inputs.withheldTaxNL}
                    thirtyPercentRuling={inputs.thirtyPercentRuling}
                  />
                </Tab.Pane>
                <Tab.Pane eventKey="be" className="bt-be-accent">
                  <BEResult result={result.be} residentCountry={inputs.residentCountry} />
                </Tab.Pane>
                <Tab.Pane eventKey="years">
                  <MultiYearComparison rows={comparisonResults} activeYear={inputs.year} />
                </Tab.Pane>
                <Tab.Pane eventKey="wfh">
                  <WFHRatioChart inputs={inputs} />
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
