import { useMemo, useState } from "react";
import { BarChart3, House, PieChart } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { lazyView } from "@/lib/lazyView";
import { calculate } from "@/tax";
import { isThirtyPercentRulingSupportedResident, VALID_YEARS } from "@/tax/constants";
import type { TaxInputs } from "@/tax/types";
import * as m from "@/paraglide/messages.js";
import { LazyBoundary } from "../LazyBoundary";
import BEResult from "./BEResult";
import MultiYearComparison from "./MultiYearComparison";
import NLResult from "./NLResult";
import SummaryResult from "./SummaryResult";

const wfhChartView = lazyView(() => import("./WFHRatioChart"));
const WFHRatioChart = wfhChartView.Component;

interface ResultsTabsProps {
  inputs: TaxInputs;
  onResetInputs: () => void;
}

export default function ResultsTabs({ inputs, onResetInputs }: ResultsTabsProps) {
  const result = useMemo(() => calculate(inputs), [inputs]);
  const comparisonResults = useMemo(
    () =>
      VALID_YEARS.map((year) => ({
        year,
        result: year === inputs.year ? result : calculate({ ...inputs, year }),
      })),
    [inputs, result],
  );

  const [tab, setTab] = useState<string | number | null>("summary");
  // The chart chunk loads on first selection; later it stays mounted like the other panels.
  const [wfhRequested, setWfhRequested] = useState(false);

  return (
    <Tabs
      value={tab}
      onValueChange={(next) => {
        setTab(next);
        if (next === "wfh") setWfhRequested(true);
      }}
    >
      <TabsList aria-label={m.tabs_results_label()}>
        <TabsTrigger value="summary" aria-label={m.tabs_summary()}>
          <PieChart className="size-3" aria-hidden="true" />
          {m.tabs_summary()}
        </TabsTrigger>
        <TabsTrigger value="nl" aria-label={m.tabs_nl()}>
          🇳🇱 {m.tabs_nl()}
        </TabsTrigger>
        <TabsTrigger value="be" aria-label={m.tabs_be()}>
          🇧🇪 {m.tabs_be()}
        </TabsTrigger>
        <TabsTrigger value="years" aria-label={m.tabs_year_comparison()}>
          <BarChart3 className="size-3" aria-hidden="true" />
          {m.tabs_year_comparison()}
        </TabsTrigger>
        <TabsTrigger
          value="wfh"
          aria-label={m.tabs_wfh_ratio()}
          onPointerEnter={wfhChartView.preload}
          onFocus={wfhChartView.preload}
        >
          <House className="size-3" aria-hidden="true" />
          {m.tabs_wfh_ratio()}
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
        <TabsContent value="years">
          <MultiYearComparison rows={comparisonResults} activeYear={inputs.year} />
        </TabsContent>
        <TabsContent value="wfh">
          {wfhRequested && (
            <LazyBoundary view={wfhChartView}>
              <WFHRatioChart inputs={inputs} />
            </LazyBoundary>
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
}
