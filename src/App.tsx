import { TriangleAlertIcon } from "lucide-react";
import { formOptions, useForm, useSelector, type ReactFormType } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";
import { ErrorBoundary, type FallbackProps } from "react-error-boundary";

import InputPanel from "./components/InputPanel";
import ResultsTabs from "./components/results/ResultsTabs";
import type { TaxInputs } from "./tax/types";
import { TaxInputSchema, PersistedInputsSchema, type PersistedInputs } from "./tax/schema";
import * as m from "./paraglide/messages.js";
import { getLocale } from "./paraglide/runtime.js";
import { AppNavbar } from "./components/AppNavbar";
import { PageFooter } from "./components/PageFooter";

export const DEFAULT_INPUTS: TaxInputs = {
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

export default function App() {
  const [initialValues] = useState(loadInitialInputs);
  const form = useForm({ defaultValues: initialValues });
  const rawValues = useSelector(form.atom, (s) => s.values);
  const inputs = useMemo(() => {
    const parsed = TaxInputSchema.safeParse(rawValues);
    return parsed.success ? parsed.data : DEFAULT_INPUTS;
  }, [rawValues]);
  const [, setCurrentLocale] = useState(getLocale());

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
        <div className="grid grid-cols-1 gap-6 shell:flex shell:items-start">
          {/* ── Left column: inputs ────────────────────────────── */}
          <div className="min-w-0 shell:w-96 shell:shrink-0">
            <InputPanel form={form} />
          </div>

          {/* ── Right column: results ──────────────────────────── */}
          <div className="min-w-0 shell:flex-1">
            <ErrorBoundary FallbackComponent={ResultsErrorFallback}>
              <ResultsTabs inputs={inputs} onResetInputs={() => form.reset(DEFAULT_INPUTS)} />
            </ErrorBoundary>
          </div>
        </div>
      </main>

      <PageFooter variant="main">
        {m.footer_disclaimer()}
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
