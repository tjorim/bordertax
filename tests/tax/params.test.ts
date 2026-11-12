import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { VALID_YEARS } from "@/tax/constants";
import { EIGENWONINGFORFAIT, TAX_PARAMS } from "@/tax/params";
import type { AKStage, NLYearParams } from "@/tax/params";
import { YEAR_MODULES } from "@/tax/years";
import { EIGENWONINGFORFAIT_BAND_LIMITS } from "@/tax/years/shared";

interface Bracket {
  from: number;
  to: number;
  rate: number;
}

/**
 * Known data discrepancies that the restructuring deliberately preserved (no tax figure changes).
 * Each entry names a failing check; the check must keep failing while listed, so the entry has to be
 * deleted in the same change that corrects the figures.
 */
const KNOWN_DEVIATIONS: Record<string, string> = {
  "2024 over-AOW AHK":
    "phase-out start/end (22,660 / 73,031) look like the 2023 values; end is not the top-bracket start (#435)",
  "2024 over-AOW AK":
    "stage 3 -> 4 join is off by about 110 euro and the phase-out ends about 6 euro below zero (#435)",
};

function expectConsistent(key: string, check: () => void) {
  if (key in KNOWN_DEVIATIONS) expect(check, KNOWN_DEVIATIONS[key]).toThrow();
  else check();
}

function expectContiguous(brackets: readonly Bracket[]) {
  expect(brackets.length).toBeGreaterThan(0);
  expect(brackets[0]!.from).toBe(0);
  brackets.forEach((bracket, i) => {
    expect(bracket.to).toBeGreaterThan(bracket.from);
    if (i > 0) expect(bracket.from).toBe(brackets[i - 1]!.to);
  });
  expect(brackets.at(-1)!.to).toBe(Infinity);
}

function expectAscendingRates(brackets: readonly Bracket[]) {
  brackets.forEach((bracket, i) => {
    if (i > 0) expect(bracket.rate).toBeGreaterThan(brackets[i - 1]!.rate);
  });
}

/** Published tables are rounded to whole euros, so joins may be off by a euro. */
const EURO_TOLERANCE = 1;
/** AHK rates are published with 3-4 significant digits, so the residual at the end reaches ~1.4 euro. */
const AHK_END_TOLERANCE = 2;

function stageEnd(stage: AKStage) {
  return stage.baseAmount + stage.rate * (stage.to - stage.from);
}

describe("tax parameters", () => {
  it("are unchanged by the per-year module restructuring", () => {
    const snapshot = JSON.parse(
      readFileSync(resolve(import.meta.dirname, "fixtures/tax-params-snapshot.json"), "utf8"),
      (_key, value) => (value === "Infinity" ? Infinity : value),
    );
    expect({ taxParams: TAX_PARAMS, eigenwoningforfait: EIGENWONINGFORFAIT }).toEqual(snapshot);
  });

  describe("year modules", () => {
    it("derive the supported years in ascending, gap-free order", () => {
      const years = YEAR_MODULES.map((module) => module.year);
      expect([...VALID_YEARS]).toEqual(years);
      expect(new Set(years).size).toBe(years.length);
      years.forEach((year, i) => {
        if (i > 0) expect(year).toBe(years[i - 1]! + 1);
      });
    });

    it("provide every table for every supported year", () => {
      expect(Object.keys(TAX_PARAMS).map(Number)).toEqual([...VALID_YEARS]);
      expect(Object.keys(EIGENWONINGFORFAIT).map(Number)).toEqual([...VALID_YEARS]);
      for (const year of VALID_YEARS) {
        const { nl, be } = TAX_PARAMS[year];
        expect(nl.under).toBeDefined();
        expect(nl.over).toBeDefined();
        expect(nl.mortgageDeductionRateCap).toBeGreaterThan(0);
        expect(be.brackets.length).toBeGreaterThan(0);
        expect(be.childExtraAmounts).toHaveLength(5);
        expect(EIGENWONINGFORFAIT[year]).toBeDefined();
      }
    });

    it("record sources for every table, with https URLs only where given", () => {
      for (const module of YEAR_MODULES) {
        for (const [table, provenance] of Object.entries(module.sources)) {
          expect(provenance.sources.length, `${module.year} ${table} sources`).toBeGreaterThan(0);
          for (const source of provenance.sources) {
            expect(source.name.trim()).not.toBe("");
            if (source.url !== undefined) expect(source.url).toMatch(/^https:\/\//);
          }
          if (provenance.verified !== undefined) expect(provenance.verified.trim()).not.toBe("");
        }
      }
    });
  });

  describe.each(VALID_YEARS)("integrity %i", (year) => {
    const { nl, be } = TAX_PARAMS[year];

    it("has contiguous, increasing Dutch brackets shared by both regimes", () => {
      for (const regime of [nl.under, nl.over]) {
        expectContiguous(regime.incomeTaxBrackets);
        expectAscendingRates(regime.incomeTaxBrackets);
      }
      expect(nl.over.incomeTaxBrackets).toEqual(nl.under.incomeTaxBrackets);
    });

    it("caps premiums at the first bracket ceiling", () => {
      for (const regime of [nl.under, nl.over]) {
        expect(regime.socialPremiumMax).toBe(regime.incomeTaxBrackets[0]!.to);
      }
    });

    it("keeps the mortgage cap at or above the second bracket's combined rate", () => {
      // The cap follows the second bracket (docs/hypotheekrenteaftrek-rules.md, section 4) until
      // the 2020-2022 phase-down, when it was set separately and exceeded it.
      const second = nl.under.incomeTaxBrackets[1]!;
      expect(nl.mortgageDeductionRateCap).toBeGreaterThanOrEqual(second.rate);
    });

    it.each([["under"], ["over"]] as const)(
      "has continuous arbeidskorting stages (%s AOW)",
      (regimeName) => {
        const stages = nl[regimeName].akStages;
        expectContiguous(stages);
        expect(stages[0]!.baseAmount).toBe(0);
        expect(stages.at(-1)).toMatchObject({ baseAmount: 0, rate: 0 });
        expectConsistent(`${year} ${regimeName}-AOW AK`, () => {
          stages.slice(0, -1).forEach((stage, i) => {
            const next = stages[i + 1]!;
            // Each stage starts at the value where the previous one ended.
            expect(Math.abs(next.baseAmount - stageEnd(stage))).toBeLessThanOrEqual(EURO_TOLERANCE);
          });
          // The phase-out reaches zero where the last stage starts.
          const phaseOut = stages.at(-2)!;
          expect(phaseOut.rate).toBeLessThan(0);
          expect(Math.abs(stageEnd(phaseOut))).toBeLessThanOrEqual(EURO_TOLERANCE);
        });
      },
    );

    it.each([["under"], ["over"]] as const)("has a consistent AHK curve (%s AOW)", (regimeName) => {
      const regime: NLYearParams = nl[regimeName];
      expect(regime.ahkMax).toBeGreaterThan(0);
      expect(regime.ahkPhaseOutStart).toBeLessThan(regime.ahkPhaseOutEnd);
      expectConsistent(`${year} ${regimeName}-AOW AHK`, () => {
        // The credit phases out at the start of the top bracket and reaches zero there.
        expect(regime.ahkPhaseOutEnd).toBe(regime.incomeTaxBrackets[1]!.to);
        const atEnd =
          regime.ahkMax -
          regime.ahkPhaseOutRate * (regime.ahkPhaseOutEnd - regime.ahkPhaseOutStart);
        expect(Math.abs(atEnd)).toBeLessThanOrEqual(AHK_END_TOLERANCE);
      });
    });

    it("has contiguous, increasing Belgian brackets", () => {
      expectContiguous(be.brackets);
      expectAscendingRates(be.brackets);
    });

    it("has consistent Belgian allowances and rates", () => {
      expect(be.childExtraAmounts[0]).toBe(0);
      be.childExtraAmounts.forEach((amount, i) => {
        if (i > 0) expect(amount).toBeGreaterThan(be.childExtraAmounts[i - 1]!);
      });
      expect(be.forfaitMax).toBeGreaterThan(0);
      expect(be.gereduceerdRate).toBeCloseTo(1 / (1 + be.gewestelijkeRate), 5);
    });

    it("has a coherent eigenwoningforfait table", () => {
      const home = EIGENWONINGFORFAIT[year];
      expect(home.rates).toHaveLength(EIGENWONINGFORFAIT_BAND_LIMITS.length + 1);
      expect(home.rates[0]).toBe(0);
      home.rates.forEach((rate, i) => {
        if (i > 0) expect(rate).toBeGreaterThan(home.rates[i - 1]!);
      });
      expect(home.threshold).toBeGreaterThan(EIGENWONINGFORFAIT_BAND_LIMITS.at(-1)!);
      // The flat rate meets the over-threshold formula at the threshold.
      expect(home.base).toBeCloseTo(home.rates.at(-1)! * home.threshold, 6);
    });
  });
});
