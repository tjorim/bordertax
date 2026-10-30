import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import WFHRatioChart from "@/components/results/WFHRatioChart";
import { DEFAULT_INPUTS } from "@/tax/defaults";
import { calculate } from "@/tax";
import { fmt } from "@/components/format";
import * as m from "@/paraglide/messages.js";

// Chart rendering is covered by browser smoke checks; exercise the accessible explanation here.
vi.mock("@tanstack/charts/react/core", () => ({ Chart: () => null }));

afterEach(cleanup);

const inputs = {
  ...DEFAULT_INPUTS,
  grossSalary: 60000,
  daysWorkedNL: 220,
  daysWorkedBE: 0,
  daysWorkedOther: 0,
  sickDays: 0,
  mortgageEnabled: true,
  mortgageInterest: 6000,
};

describe("WFHRatioChart mortgage explanation", () => {
  it("keeps qualification unknown when other income is missing", () => {
    render(<WFHRatioChart inputs={inputs} />);
    expect(screen.getByText(m.wfh_mortgage_missing())).toBeInTheDocument();
    expect(screen.getByText(m.wfh_mortgage_no_boundary())).toBeInTheDocument();
  });

  it("separates the mortgage benefit from other tax changes at the cliff", () => {
    render(<WFHRatioChart inputs={{ ...inputs, incomeOutsideNL: 0 }} />);
    expect(screen.queryByText(m.wfh_mortgage_missing())).not.toBeInTheDocument();
    expect(screen.queryByText(m.wfh_mortgage_no_boundary())).not.toBeInTheDocument();
    const keep = calculate({ ...inputs, incomeOutsideNL: 0, daysWorkedNL: 198, daysWorkedBE: 22 });
    const lose = calculate({ ...inputs, incomeOutsideNL: 0, daysWorkedNL: 197, daysWorkedBE: 23 });
    const benefit = keep.mortgage!.realised.netBenefit;
    expect(
      screen.getByText(
        m.wfh_mortgage_comparison({
          percent: 10,
          benefit: fmt(benefit),
          other: fmt(lose.netIncome - keep.netIncome + benefit),
        }),
      ),
    ).toBeInTheDocument();
  });

  it("does not add a mortgage comparison when the scenario is off", () => {
    render(<WFHRatioChart inputs={{ ...inputs, mortgageEnabled: false, incomeOutsideNL: 0 }} />);
    expect(screen.queryByText(m.wfh_mortgage_no_boundary())).not.toBeInTheDocument();
    expect(screen.getByText(m.wfh_qualifying_taxpayer_note())).toBeInTheDocument();
  });
});
