import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ImportInputsButton } from "@/components/InputFileControls";
import { INPUT_FILE_FORMAT, serializeInputFile } from "@/tax/inputFile";
import { setLocale } from "@/paraglide/runtime";
import { mockInputs } from "../test-utils/mockData";

function pick(file: File) {
  fireEvent.change(screen.getByLabelText("Import"), { target: { files: [file] } });
}

describe("ImportInputsButton", () => {
  beforeEach(() => setLocale("en", { reload: false }));

  it("loads a valid file", async () => {
    const onLoad = vi.fn();
    render(
      <ImportInputsButton label="Import" onLoad={onLoad} successMessage={(y) => `Loaded ${y}`} />,
    );
    const file = serializeInputFile(mockInputs);
    if (!file.ok) throw new Error("export failed");
    pick(new File([file.json], "in.json", { type: "application/json" }));
    await waitFor(() => expect(onLoad).toHaveBeenCalledTimes(1));
    expect(onLoad.mock.calls[0]![0]).toMatchObject(mockInputs);
    expect(await screen.findByText("Loaded 2025")).toBeInTheDocument();
  });

  it("reports an invalid file without loading anything", async () => {
    const onLoad = vi.fn();
    render(<ImportInputsButton label="Import" onLoad={onLoad} successMessage={() => ""} />);
    const bad = JSON.stringify({
      format: INPUT_FILE_FORMAT,
      schemaVersion: 1,
      inputs: { ...mockInputs, grossSalary: "x" },
    });
    pick(new File([bad], "in.json"));
    expect(await screen.findByText(/not valid inputs/i)).toBeInTheDocument();
    expect(onLoad).not.toHaveBeenCalled();
  });
});
