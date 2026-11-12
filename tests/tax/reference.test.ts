import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeEach, describe, expect, it } from "vitest";

import { VALID_YEARS, MORTGAGE_QUALIFYING_MIN_NL_PERCENT } from "@/tax/constants";
import { TAX_PARAMS } from "@/tax/params";
import {
  ACV_SESSION,
  AOW,
  BE_PENSION,
  REFERENCE_INCOME_YEAR,
  SALARY_SPLIT_EXAMPLE_INPUT,
  aowExample,
  nlReferenceRates,
  referenceTaxSourceUrl,
  salarySplitExample,
} from "@/tax/reference";
import { year2026 } from "@/tax/years/2026";
import {
  fmt,
  fmtAge,
  fmtAmount,
  fmtDate,
  fmtNumber,
  fmtPercent,
  fmtPercentRange,
  fmtSigned,
} from "@/components/format";
import { setLocale } from "@/paraglide/runtime";

/** Intl uses no-break spaces in some locales; compare on plain spaces. */
const plain = (text: string) => text.replace(/\s/g, " ");

describe("reference year", () => {
  it("is a supported income year with a documented tax source", () => {
    expect(VALID_YEARS).toContain(REFERENCE_INCOME_YEAR);
    expect(referenceTaxSourceUrl()).toMatch(/^https:\/\/www\.belastingdienst\.nl\//);
  });

  it("points at the Belastingdienst page recorded in the year module", () => {
    expect(referenceTaxSourceUrl(2026)).toBe(year2026.sources.nl.sources[0]!.url);
  });
});

describe("Dutch rate table derived from the year module", () => {
  it.each([...VALID_YEARS])("equals the calculator parameters for %i", (year) => {
    const rates = nlReferenceRates(year);
    const { under } = TAX_PARAMS[year].nl;
    expect(rates.premiumCeiling).toBe(under.socialPremiumMax);
    expect(rates.premiumCeiling).toBe(under.incomeTaxBrackets[0]!.to);
    expect(rates.ahkMax).toBe(under.ahkMax);
    expect(rates.ahkPhaseOutEnd).toBe(under.ahkPhaseOutEnd);
    expect(rates.rows).toHaveLength(under.incomeTaxBrackets.length);
    rates.rows.forEach((row, index) => {
      const bracket = under.incomeTaxBrackets[index]!;
      expect(row.from).toBe(bracket.from);
      expect(row.to ?? Infinity).toBe(bracket.to);
      expect(row.incomeTaxRate).toBe(bracket.rate);
      // Combined rate = income tax + premium part, only inside the premium ceiling.
      expect(row.combinedRate).toBeCloseTo(
        bracket.rate + (index === 0 ? under.socialPremiumRate : 0),
        10,
      );
    });
    // The arbeidskorting maximum is reached at the start of the falling stage.
    const falling = under.akStages.find((stage) => stage.rate < 0)!;
    expect(rates.arbeidskortingMax).toBe(falling.baseAmount);
    expect(rates.arbeidskortingZeroFrom).toBe(under.akStages.at(-1)!.from);
  });

  it("gives the 2026 figures of the year module", () => {
    const rates = nlReferenceRates(2026);
    expect(year2026.params.nl.under.ahkMax).toBe(3115);
    expect(rates.ahkMax).toBe(3115);
    expect(rates.ahkPhaseOutEnd).toBe(78426);
    expect(rates.premiumCeiling).toBe(38883);
    expect(rates.arbeidskortingMax).toBe(5685);
    expect(rates.arbeidskortingZeroFrom).toBe(132920);
    expect(rates.rows.map((row) => row.combinedRate)).toEqual([0.3575, 0.3756, 0.495]);
    expect(rates.rows.map((row) => row.to)).toEqual([38883, 78426, null]);
  });

  it("follows the year module when the year changes", () => {
    expect(nlReferenceRates(2025).ahkMax).not.toBe(nlReferenceRates(2026).ahkMax);
  });
});

describe("worked example", () => {
  const example = salarySplitExample();
  const { input } = example;

  it("derives the base, shares and net benefits from the ACV figures", () => {
    expect(example.baseW).toBe(44711);
    expect(example.beShareGross).toBe(11536);
    expect(example.netBenefitA).toBe(1037);
    expect(example.netBenefitB).toBe(714);
    expect(example.sickFraction).toEqual({ days: 155, base: 205 });
    expect(example.beShareNoSick).toBeCloseTo(50 / 230, 10);
    expect(example.beShareSick).toBeCloseTo(50 / 205, 10);
  });

  it("is internally consistent", () => {
    const { scenarioA, scenarioB } = input;
    // The slides round their intermediate figures, so the proportional share is within 1 euro.
    const proportional = (input.fiscalWage * input.nlFraction.days) / input.nlFraction.base;
    expect(Math.abs(proportional - scenarioA.nlTaxable)).toBeLessThanOrEqual(1);
    expect(scenarioA.y + scenarioA.z).toBe(example.baseW);
    expect(scenarioB.y + scenarioB.z).toBe(example.baseW);
    expect(input.nlFraction.base - input.nlFraction.days).toBe(input.teleworkDays);
  });

  it("derives the AOW example from the accrual", () => {
    const aow = aowExample();
    expect(aow.accrued).toBeCloseTo(0.6, 10);
    expect(aow.single).toBe(982);
    expect(aow.couple).toBe(673);
    expect(Math.round(1 / AOW.accrualPerYear)).toBe(50);
  });

  it("keeps the ACV source marker", () => {
    expect(ACV_SESSION.date).toBe("2026-03-24");
    expect(SALARY_SPLIT_EXAMPLE_INPUT.incomeYear).toBe(2025);
  });
});

describe("formatting follows the locale", () => {
  describe("English", () => {
    beforeEach(() => setLocale("en", { reload: false }));

    it("formats money, percentages, dates and ages", () => {
      expect(fmt(3115)).toBe("€3,115");
      expect(fmtAmount(1637.57)).toBe("€1,637.57");
      expect(fmtAmount(1147)).toBe("€1,147");
      expect(fmtSigned(1037)).toBe("+€1,037");
      expect(fmtPercent(0.3575, { fixed: true })).toBe("35.75%");
      expect(fmtPercent(0.081, { fixed: true })).toBe("8.10%");
      expect(fmtPercent(0.02, { digits: 0 })).toBe("2%");
      expect(fmtPercent(MORTGAGE_QUALIFYING_MIN_NL_PERCENT / 100, { digits: 0 })).toBe("90%");
      expect(fmtPercentRange(0.005, 0.02)).toBe("0.5%–2%");
      expect(fmtNumber(14040)).toBe("14,040");
      expect(fmtNumber(0.8165, 4)).toBe("0.8165");
      expect(fmtDate(ACV_SESSION.date)).toBe("24 March 2026");
      expect(fmtAge({ years: 67, months: 3 })).toBe("67 years + 3 months");
      expect(fmtAge({ years: 65, months: 1 })).toBe("65 years + 1 month");
      expect(fmtAge({ years: 65, months: [2, 3] })).toBe("65 years + 2–3 months");
      expect(fmtAge({ years: 66 })).toBe("66 years");
    });
  });

  describe("Dutch", () => {
    beforeEach(() => setLocale("nl", { reload: false }));

    it("formats money, percentages, dates and ages", () => {
      expect(plain(fmt(3115))).toBe("€ 3.115");
      expect(plain(fmtAmount(1637.57))).toBe("€ 1.637,57");
      expect(plain(fmtAmount(1147))).toBe("€ 1.147");
      expect(fmtPercent(0.3575, { fixed: true })).toBe("35,75%");
      expect(fmtPercent(0.081, { fixed: true })).toBe("8,10%");
      expect(fmtPercentRange(0.005, 0.02)).toBe("0,5%–2%");
      expect(fmtNumber(14040)).toBe("14.040");
      expect(fmtNumber(0.8165, 4)).toBe("0,8165");
      expect(fmtDate(ACV_SESSION.date)).toBe("24 maart 2026");
      expect(fmtAge({ years: 67, months: 3 })).toBe("67 jaar + 3 maanden");
      expect(fmtAge({ years: 65, months: 1 })).toBe("65 jaar + 1 maand");
      expect(fmtAge({ years: 66 })).toBe("66 jaar");
    });
  });
});

describe("pension tables", () => {
  it("lists the AOW age history in order without gaps", () => {
    const starts = AOW.history.map((row) => row.period.from!);
    expect([...starts]).toEqual([...starts].sort((a, b) => a - b));
    AOW.history.slice(1).forEach((row, index) => {
      const previous = AOW.history[index]!.period;
      expect(row.period.from).toBe((previous.to ?? previous.from!) + 1);
    });
  });

  it("keeps the ZIV bands ordered", () => {
    for (const band of [BE_PENSION.ziv.single, BE_PENSION.ziv.family]) {
      expect(band.lowerMonthly).toBeLessThan(band.upperMonthly);
    }
  });
});

describe("message catalogue", () => {
  const read = (locale: string) =>
    JSON.parse(readFileSync(join(process.cwd(), "messages", `${locale}.json`), "utf8")) as Record<
      string,
      string
    >;

  it.each(["en", "nl"])("keeps euro amounts out of the %s reference messages", (locale) => {
    const offenders = Object.entries(read(locale)).filter(
      ([key, text]) => key.startsWith("ref_") && typeof text === "string" && text.includes("€"),
    );
    expect(offenders).toEqual([]);
  });
});
