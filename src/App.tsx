import { ArrowUpIcon, TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formOptions, useForm, useSelector, type ReactFormType } from "@tanstack/react-form";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import InputPanel from "./components/InputPanel";
import { ResultBar } from "./components/ResultBar";
import ResultsTabs, { type ResultsTabsProps } from "./components/results/ResultsTabs";
import { calculate } from "./tax";
import { DEFAULT_INPUTS } from "./tax/defaults";
import { useDocumentTitle } from "./lib/useDocumentTitle";
import type { TaxInputs, TaxResult } from "./tax/types";
import { TaxInputSchema, PersistedInputsSchema, type PersistedInputs } from "./tax/schema";
import * as m from "./paraglide/messages.js";
import { getLocale } from "./paraglide/runtime.js";
import { AppNavbar } from "./components/AppNavbar";
import { PageFooter } from "./components/PageFooter";

const taxFormOptions = formOptions({ defaultValues: DEFAULT_INPUTS });
export type TaxFormApi = ReactFormType<typeof taxFormOptions>;

const STORAGE_KEY = "grensarbeider-tax-inputs-v1";

function toPersistedInputs(inputs: TaxInputs): PersistedInputs {
  return PersistedInputsSchema.parse(inputs);
}

function mergeWithDefaults(raw: unknown): TaxInputs {
  const parsed = PersistedInputsSchema.safeParse(raw);
  return parsed.success ? { ...DEFAULT_INPUTS, ...parsed.data } : DEFAULT_INPUTS;
}

function loadInitialInputs(): TaxInputs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? mergeWithDefaults(JSON.parse(saved)) : DEFAULT_INPUTS;
  } catch {
    return DEFAULT_INPUTS;
  }
}

function ResultsErrorFallback({ error }: FallbackProps) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    <div className="p-6 text-center">
      <TriangleAlertIcon aria-hidden="true" className="mx-auto size-8 text-warning mb-4 block" />
      <h5>{m.results_error_title()}</h5>
      <p className="text-text-muted text-sm mb-4">{m.results_error_description()}</p>
      <details className="text-start text-sm text-text-muted">
        <summary className="mb-1">{m.results_error_details()}</summary>
        <pre className="border border-border rounded-md p-2 text-sm overflow-auto">{message}</pre>
      </details>
    </div>
  );
}

type Calculation = { result: TaxResult } | { error: unknown };

function runCalculation(inputs: TaxInputs): Calculation {
  try {
    return { result: calculate(inputs) };
  } catch (error) {
    return { error };
  }
}

/** Rethrows a calculation failure inside the results error boundary. */
function ResultsPanel({
  calculation,
  ...props
}: { calculation: Calculation } & Omit<ResultsTabsProps, "result">) {
  if ("error" in calculation) throw calculation.error;
  return <ResultsTabs result={calculation.result} {...props} />;
}

function scrollToAndFocus(id: string) {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ block: "start" });
  element.focus({ preventScroll: true });
}

export default function App() {
  const [initialValues] = useState(loadInitialInputs);
  const form = useForm({ defaultValues: initialValues });
  const rawValues = useSelector(form.atom, (s) => s.values);
  const inputs = useMemo(() => {
    const parsed = TaxInputSchema.safeParse(rawValues);
    return parsed.success ? parsed.data : DEFAULT_INPUTS;
  }, [rawValues]);
  const calculation = useMemo(() => runCalculation(inputs), [inputs]);
  const [, setCurrentLocale] = useState(getLocale());
  const [tab, setTab] = useState<string | number | null>("summary");
  const [filingRequests, setFilingRequests] = useState(0);
  useDocumentTitle(m.app_document_title());

  const showFiling = useCallback(() => {
    setTab("filing");
    setFilingRequests((count) => count + 1);
  }, []);

  // Scroll once the Filing tab is in the DOM.
  useEffect(() => {
    if (filingRequests > 0) scrollToAndFocus("filing-heading");
  }, [filingRequests]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toPersistedInputs(inputs)));
    } catch {
      // Storage is optional; keep the current calculation in memory.
    }
  }, [inputs]);

  return (
    <>
      <AppNavbar onLocaleSwitch={() => setCurrentLocale(getLocale())}>
        <span className="font-mono text-xs tracking-wide text-text-muted">
          {m.app_tax_year()} {inputs.year}
        </span>
      </AppNavbar>

      <main className="px-3 pb-12">
        {"result" in calculation && (
          <ResultBar
            result={calculation.result}
            onShowResults={() => scrollToAndFocus("results")}
            onShowFiling={showFiling}
          />
        )}
        <div className="grid grid-cols-1 gap-6 shell:flex shell:items-start">
          {/* ── Left column: inputs ────────────────────────────── */}
          <div id="inputs" tabIndex={-1} className="min-w-0 scroll-mt-32 shell:w-96 shell:shrink-0">
            <InputPanel form={form} />
          </div>

          {/* ── Right column: results ──────────────────────────── */}
          <section
            id="results"
            tabIndex={-1}
            aria-label={m.tabs_results_label()}
            className="min-w-0 scroll-mt-32 outline-none shell:flex-1"
          >
            <Button
              variant="ghost"
              size="xs"
              className="mb-2 shell:hidden"
              onClick={() => scrollToAndFocus("inputs")}
            >
              <ArrowUpIcon aria-hidden="true" />
              {m.results_back_to_inputs()}
            </Button>
            <ErrorBoundary FallbackComponent={ResultsErrorFallback}>
              <ResultsPanel
                calculation={calculation}
                inputs={inputs}
                tab={tab}
                onTabChange={setTab}
                onResetInputs={() => form.reset(DEFAULT_INPUTS)}
              />
            </ErrorBoundary>
          </section>
        </div>
      </main>

      <PageFooter variant="main">
        {m.footer_disclaimer()} {m.footer_limitations()}
        &nbsp;|&nbsp; {m.footer_sources()}:{" "}
        <a href="https://www.belastingdienst.nl" target="_blank" rel="noreferrer">
          Belastingdienst
        </a>{" "}
        &amp;{" "}
        <a href="https://fin.belgium.be" target="_blank" rel="noreferrer">
          FOD Financiën
        </a>
      </PageFooter>
    </>
  );
}
