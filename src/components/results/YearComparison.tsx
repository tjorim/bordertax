import { useMemo } from "react";
import { calculate } from "@/tax";
import { VALID_YEARS } from "@/tax/constants";
import type { TaxInputs, TaxResult } from "@/tax/types";
import MultiYearComparison from "./MultiYearComparison";

interface Props {
  inputs: TaxInputs;
  /** Result for `inputs`, reused for the active year. */
  result: TaxResult;
}

/** Calculates every supported year, so it only runs once the comparison tab is opened. */
export default function YearComparison({ inputs, result }: Props) {
  const rows = useMemo(
    () =>
      VALID_YEARS.map((year) => ({
        year,
        result: year === inputs.year ? result : calculate({ ...inputs, year }),
      })),
    [inputs, result],
  );
  return <MultiYearComparison rows={rows} activeYear={inputs.year} />;
}
