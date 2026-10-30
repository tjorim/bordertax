import { useMemo, useState } from "react";
import { ChartColumnIcon, ChartPieIcon, HouseIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { lazyView } from "@/lib/lazyView";
import { calculate } from "@/tax";
import { isThirtyPercentRulingSupportedResident } from "@/tax/constants";
import type { TaxInputs } from "@/tax/types";
import * as m from "@/paraglide/messages.js";
import { LazyBoundary } from "../LazyBoundary";
import BEResult from "./BEResult";
import NLResult from "./NLResult";
import SummaryResult from "./SummaryResult";

const yearComparisonView = lazyView(() => import("./YearComparison"));
const YearComparison = yearComparisonView.Component;
const wfhChartView = lazyView(() => import("./WFHRatioChart"));
const WFHRatioChart = wfhChartView.Component;

const scenarioCompareView = lazyView(() => import("./ScenarioCompare"));
const ScenarioCompare = scenarioCompareView.Component;

// Preload on hover, keyboard focus and touch/press, so the chunk is usually in by the click.
const preloadOnIntent = (view: { preload: () => void }) => ({
  onPointerEnter: view.preload,
  onPointerDown: view.preload,
  onFocus: view.preload,
});

interface ResultsTabsProps {
  inputs: TaxInputs;
  onResetInputs: () => void;
}

export default function ResultsTabs({ inputs, onResetInputs }: ResultsTabsProps) {
  const result = useMemo(() => calculate(inputs), [inputs]);
  const [tab, setTab] = useState<string | number | null>("summary");
  // These panels load on first selection; later they stay mounted like the other panels.
  const [requested, setRequested] = useState({ years: false, wfh: false, compare: false });

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        setTab(next);
        if (next === "years" || next === "wfh" || next === "compare") {
          setRequested((prev) => ({ ...prev, [next]: true }));
        }
      }}
    >
      <TabsList aria-label={m.tabs_results_label()}>
        <TabsTrigger value="summary" aria-label={m.tabs_summary()}>
          <ChartPieIcon className="size-3" aria-hidden="true" />
          {m.tabs_summary()}
        </TabsTrigger>
        <TabsTrigger value="nl" aria-label={m.tabs_nl()}>
          🇳🇱 {m.tabs_nl()}
        </TabsTrigger>
        <TabsTrigger value="be" aria-label={m.tabs_be()}>
          🇧🇪 {m.tabs_be()}
        </TabsTrigger>
        <TabsTrigger value="wfh" aria-label={m.tabs_wfh_ratio()} {...preloadOnIntent(wfhChartView)}>
          <HouseIcon className="size-3" aria-hidden="true" />
          {m.tabs_wfh_ratio()}
        </TabsTrigger>
        <TabsTrigger
          value="years"
          aria-label={m.tabs_year_comparison()}
          {...preloadOnIntent(yearComparisonView)}
        >
          <ChartColumnIcon className="size-3" aria-hidden="true" />
          {m.tabs_year_comparison()}
        </TabsTrigger>
        <TabsTrigger
          value="compare"
          aria-label={m.tabs_compare()}
          {...preloadOnIntent(scenarioCompareView)}
        >
          {m.tabs_compare()}
        </TabsTrigger>
      </TabsList>

      <div>
        <TabsContent value="summary">
          <SummaryResult result={result} onResetInputs={onResetInputs} />
        </TabsContent>
        <TabsContent value="nl" className="bt-nl-accent">
          <NLResult
            result={result.nl}
            withheldTaxNL={inputs.withheldTaxNL}
            thirtyPercentRuling={
              isThirtyPercentRulingSupportedResident(inputs.residentCountry) &&
              inputs.thirtyPercentRuling
            }
          />
        </TabsContent>
        <TabsContent value="be" className="bt-be-accent">
          <BEResult result={result.be} residentCountry={inputs.residentCountry} />
        </TabsContent>
        <TabsContent value="wfh">
          {requested.wfh && (
            <LazyBoundary view={wfhChartView} loadingClassName="min-h-200">
              <WFHRatioChart inputs={inputs} />
            </LazyBoundary>
          )}
        </TabsContent>
        <TabsContent value="years">
          {requested.years && (
            <LazyBoundary view={yearComparisonView} loadingClassName="min-h-180">
              <YearComparison inputs={inputs} result={result} />
            </LazyBoundary>
          )}
        </TabsContent>
        <TabsContent value="compare">
          {requested.compare && (
            <LazyBoundary view={scenarioCompareView} loadingClassName="min-h-180">
              <ScenarioCompare inputs={inputs} />
            </LazyBoundary>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
