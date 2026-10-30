/**
 * Side-by-side comparison of two scenarios (a current situation and an alternative).
 *
 * The difference is attributed to groups of changed inputs with a Shapley split: each group's
 * share is its average marginal effect over every order in which the changes could be applied.
 * Unlike a one-by-one waterfall the result does not depend on an arbitrary ordering, and the
 * shares add up exactly to the total difference.
 */
import { calculate } from "./index";
import type { TaxInputs, TaxResult } from "./types";

export type ChangeGroup = "workdays" | "income" | "mortgage" | "other";

const GROUP_KEYS = {
  workdays: ["daysWorkedNL", "daysWorkedBE", "daysWorkedOther", "sickDays"],
  income: ["grossSalary"],
  mortgage: ["mortgageEnabled", "mortgageInterest", "mortgageOwnershipShare", "incomeOutsideNL"],
} as const satisfies Record<Exclude<ChangeGroup, "other">, readonly (keyof TaxInputs)[]>;

const GROUPS: readonly ChangeGroup[] = ["workdays", "income", "mortgage", "other"];

export type CompareMetric = "nlTax" | "beTax" | "netIncome";
const METRICS: readonly CompareMetric[] = ["nlTax", "beTax", "netIncome"];

const metricOf = (result: TaxResult, metric: CompareMetric): number =>
  metric === "nlTax"
    ? result.nl.netTaxNL
    : metric === "beTax"
      ? (result.be?.netTaxBE ?? 0)
      : result.netIncome;

export interface ScenarioDelta {
  grossIncome: number;
  nlTax: number;
  beTax: number;
  totalTax: number;
  netIncome: number;
  netIncomeMonthly: number;
}

export interface ScenarioComparison {
  a: TaxResult;
  b: TaxResult;
  /** b − a. Positive tax means b pays more; positive netIncome means b leaves more. */
  delta: ScenarioDelta;
  /** Groups of inputs that differ between the scenarios. */
  changed: ChangeGroup[];
  /** Share of each metric's difference caused by each changed group; sums to the metric's delta. */
  attribution: Record<CompareMetric, Partial<Record<ChangeGroup, number>>>;
}

const sameValue = (x: unknown, y: unknown) => Object.is(x, y);

// Every input key, so the "other" group is whatever the named groups do not cover.
const ALL_INPUT_KEYS = [
  "year",
  "residentCountry",
  "civilStatus",
  "dependentChildren",
  "belowAOWAge",
  "belgianRegion",
  "communalTaxRate",
  "grossSalary",
  "daysWorkedNL",
  "daysWorkedBE",
  "daysWorkedOther",
  "thirtyPercentRuling",
  "socialContributions",
  "aanvullendPensioen",
  "dienstencheques",
  "roerendeVoorheffing",
  "withheldTaxNL",
  "sickDays",
  "mortgageEnabled",
  "mortgageInterest",
  "mortgageOwnershipShare",
  "incomeOutsideNL",
] as const satisfies readonly (keyof TaxInputs)[];

const GROUPED_KEYS = new Set<string>(Object.values(GROUP_KEYS).flat());

function groupKeys(group: ChangeGroup): readonly (keyof TaxInputs)[] {
  return group === "other"
    ? ALL_INPUT_KEYS.filter((key) => !GROUPED_KEYS.has(key))
    : GROUP_KEYS[group];
}

function changedGroups(a: TaxInputs, b: TaxInputs): ChangeGroup[] {
  return GROUPS.filter((group) => groupKeys(group).some((key) => !sameValue(a[key], b[key])));
}

function factorial(n: number): number {
  return n <= 1 ? 1 : n * factorial(n - 1);
}

/** Inputs of `a` with `b`'s values for the keys of every group in `applied`. */
function mix(a: TaxInputs, b: TaxInputs, applied: readonly ChangeGroup[]): TaxInputs {
  const mixed: TaxInputs = { ...a };
  for (const group of applied) {
    for (const key of groupKeys(group)) {
      (mixed as Record<string, unknown>)[key] = b[key];
    }
  }
  return mixed;
}

export function compareScenarios(a: TaxInputs, b: TaxInputs): ScenarioComparison {
  const resultA = calculate(a);
  const resultB = calculate(b);
  const changed = changedGroups(a, b);

  const delta: ScenarioDelta = {
    grossIncome: resultB.grossIncome - resultA.grossIncome,
    nlTax: resultB.nl.netTaxNL - resultA.nl.netTaxNL,
    beTax: (resultB.be?.netTaxBE ?? 0) - (resultA.be?.netTaxBE ?? 0),
    totalTax: resultB.totalTax - resultA.totalTax,
    netIncome: resultB.netIncome - resultA.netIncome,
    netIncomeMonthly: (resultB.netIncome - resultA.netIncome) / 12,
  };

  // value[subset bitmask] = the result with those groups switched to b's values
  const n = changed.length;
  const value = new Map<number, TaxResult>();
  for (let mask = 0; mask < 1 << n; mask++) {
    const applied = changed.filter((_, i) => mask & (1 << i));
    value.set(
      mask,
      mask === 0 ? resultA : mask === (1 << n) - 1 ? resultB : calculate(mix(a, b, applied)),
    );
  }

  const attribution: ScenarioComparison["attribution"] = { nlTax: {}, beTax: {}, netIncome: {} };
  for (const metric of METRICS) {
    changed.forEach((group, i) => {
      let share = 0;
      for (let mask = 0; mask < 1 << n; mask++) {
        if (mask & (1 << i)) continue;
        let size = 0;
        for (let bits = mask; bits; bits &= bits - 1) size++;
        const weight = (factorial(size) * factorial(n - size - 1)) / factorial(n);
        share +=
          weight *
          (metricOf(value.get(mask | (1 << i))!, metric) - metricOf(value.get(mask)!, metric));
      }
      attribution[metric][group] = share;
    });
  }

  return { a: resultA, b: resultB, delta, changed, attribution };
}
