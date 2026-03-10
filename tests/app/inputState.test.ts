import { beforeEach, describe, expect, it } from "vitest";

import { DEFAULT_INPUTS, loadStoredInputs, sanitizeInputs, STORAGE_KEY } from "@/app/inputState";

describe("inputState", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("clamps invalid stored values back into supported ranges", () => {
    expect(
      sanitizeInputs({
        year: 1900,
        residentCountry: "FR",
        civilStatus: "unknown",
        dependentChildren: 99,
        belowAOWAge: "yes",
        belgianRegion: "mars",
        communalTaxRate: -4,
        grossSalary: -100,
        daysWorkedNL: -1,
        daysWorkedBE: -2,
        daysWorkedOther: -3,
        thirtyPercentRuling: "sometimes",
        socialContributions: -10,
        aanvullendPensioen: -20,
        dienstencheques: -30,
        roerendeVoorheffing: -40,
        withheldTaxNL: -50,
      }),
    ).toEqual({
      ...DEFAULT_INPUTS,
      dependentChildren: 10,
      communalTaxRate: 0,
      grossSalary: 0,
      daysWorkedNL: 0,
      daysWorkedBE: 0,
      daysWorkedOther: 0,
      socialContributions: 0,
      aanvullendPensioen: 0,
      dienstencheques: 0,
      roerendeVoorheffing: 0,
      withheldTaxNL: 0,
    });
  });

  it("loads sanitized inputs from storage without resetting valid JSON", () => {
    const storage = window.localStorage;
    storage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...DEFAULT_INPUTS,
        year: 2024,
        communalTaxRate: 12,
        grossSalary: 72000,
      }),
    );

    expect(loadStoredInputs(storage)).toEqual({
      inputs: {
        ...DEFAULT_INPUTS,
        year: 2024,
        communalTaxRate: 12,
        grossSalary: 72000,
      },
      resetCorruptStorage: false,
    });
  });

  it("clears corrupt storage and falls back to defaults", () => {
    const storage = window.localStorage;
    storage.setItem(STORAGE_KEY, "{broken");

    expect(loadStoredInputs(storage)).toEqual({
      inputs: DEFAULT_INPUTS,
      resetCorruptStorage: true,
    });
    expect(storage.getItem(STORAGE_KEY)).toBeNull();
  });
});
