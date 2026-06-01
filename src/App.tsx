import { Link } from "@tanstack/react-router";
import { useForm, useStore } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { Button, Col, Container, Nav, Navbar, Row, Tab } from "react-bootstrap";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";
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
import { VALID_YEARS } from "./tax/constants";
import { TaxInputSchema, PersistedInputsSchema, type PersistedInputs } from "./tax/schema";
import * as m from "./paraglide/messages.js";
import { getLocale, setLocale } from "./paraglide/runtime.js";

const DEFAULT_INPUTS: TaxInputs = {
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

function toPersistedInputs(inputs: TaxInputs): PersistedInputs {
  return PersistedInputsSchema.parse(inputs);
}

function mergeWithDefaults(raw: unknown): TaxInputs {
  const parsed = PersistedInputsSchema.safeParse(raw);
  return parsed.success ? { ...DEFAULT_INPUTS, ...parsed.data } : DEFAULT_INPUTS;
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

type Theme = "auto" | "light" | "dark";
const THEME_KEY = "bt-theme";

function loadTheme(): Theme {
  const stored = localStorage.getItem(THEME_KEY);
  return stored === "light" || stored === "dark" || stored === "auto" ? stored : "auto";
}

function applyTheme(theme: Theme) {
  const effective =
    theme === "auto"
      ? typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : theme;
  document.documentElement.setAttribute("data-bs-theme", effective);
}

const THEME_CYCLE: Theme[] = ["auto", "light", "dark"];

interface ResultsTabsProps {
  inputs: TaxInputs;
  onResetInputs: () => void;
}

function ResultsTabs({ inputs, onResetInputs }: ResultsTabsProps) {
  const result = useMemo(() => calculate(inputs), [inputs]);
  const comparisonResults = useMemo(
    () =>
      VALID_YEARS.map((year) => ({
        year,
        result: year === inputs.year ? result : calculate({ ...inputs, year }),
      })),
    [inputs, result],
  );

  return (
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
          <SummaryResult result={result} onResetInputs={onResetInputs} />
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
  );
}

function ResultsErrorFallback({ error }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="p-4 text-center">
      <i className="bi bi-exclamation-triangle-fill text-warning fs-2 mb-3 d-block" />
      <h5>{m.results_error_title()}</h5>
      <p className="text-muted small mb-3">{m.results_error_description()}</p>
      <details className="text-start small text-muted">
        <summary className="mb-1">{m.results_error_details()}</summary>
        <pre className="border rounded p-2 small overflow-auto">{message}</pre>
      </details>
    </div>
  );
}

export default function App() {
  const form = useForm({ defaultValues: loadInitialInputs() });
  const rawValues = useStore(form.store, (s) => s.values);
  const inputs = useMemo(() => TaxInputSchema.parse(rawValues), [rawValues]);
  const [locale, setCurrentLocale] = useState(getLocale());
  const [theme, setTheme] = useState<Theme>(loadTheme);
  const nextLangLabel = locale === "en" ? m.lang_nl() : m.lang_en();

  useEffect(() => {
    applyTheme(theme);
    localStorage.setItem(THEME_KEY, theme);

    if (theme === "auto" && typeof window !== "undefined" && window.matchMedia) {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => applyTheme("auto");
      mq.addEventListener("change", handler);
      return () => mq.removeEventListener("change", handler);
    }
  }, [theme]);

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
            variant="outline-secondary"
            size="sm"
            className="ms-2"
            onClick={() => {
              const idx = THEME_CYCLE.indexOf(theme);
              setTheme(THEME_CYCLE[(idx + 1) % THEME_CYCLE.length] as Theme);
            }}
            aria-label={`${m.theme_toggle_label()}: ${theme === "light" ? m.theme_light() : theme === "dark" ? m.theme_dark() : m.theme_auto()}`}
            title={`${m.theme_toggle_label()}: ${theme === "light" ? m.theme_light() : theme === "dark" ? m.theme_dark() : m.theme_auto()} (click to cycle)`}
          >
            <i
              className={`bi ${theme === "light" ? "bi-sun-fill" : theme === "dark" ? "bi-moon-fill" : "bi-circle-half"}`}
            />
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            className="ms-2"
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
            <InputPanel form={form} />
          </Col>

          {/* ── Right column: results ──────────────────────────── */}
          <Col lg={7}>
            <ErrorBoundary FallbackComponent={ResultsErrorFallback}>
              <ResultsTabs inputs={inputs} onResetInputs={() => form.reset(DEFAULT_INPUTS)} />
            </ErrorBoundary>
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
