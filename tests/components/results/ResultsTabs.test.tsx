import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ResultsTabs from "@/components/results/ResultsTabs";
import * as m from "@/paraglide/messages.js";
import { mockInputs, mockTaxResult } from "../../test-utils/mockData";

const renderTabs = (noWorkdays: boolean) =>
  render(
    <ResultsTabs
      inputs={mockInputs}
      result={{ ...mockTaxResult, noWorkdays }}
      tab="summary"
      onTabChange={() => undefined}
      onResetInputs={() => undefined}
    />,
  );

describe("ResultsTabs no-workdays note", () => {
  it("shows the note when there are no workdays", () => {
    renderTabs(true);
    expect(screen.getByRole("note")).toHaveTextContent(m.results_no_workdays());
  });

  it("shows no note when workdays are entered", () => {
    renderTabs(false);
    expect(screen.queryByText(m.results_no_workdays())).not.toBeInTheDocument();
  });
});
