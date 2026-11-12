import { DownloadIcon, UploadIcon } from "lucide-react";
import { useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/alert";
import {
  INPUT_FILE_MAX_BYTES,
  parseInputFile,
  serializeInputFile,
  type InputFileError,
} from "@/tax/inputFile";
import type { TaxInputs } from "@/tax/types";
import * as m from "@/paraglide/messages.js";

function errorMessage(error: InputFileError | "export"): string {
  switch (error) {
    case "too-large":
      return m.file_error_too_large();
    case "not-json":
      return m.file_error_not_json();
    case "wrong-format":
      return m.file_error_wrong_format();
    case "unsupported-version":
      return m.file_error_unsupported_version();
    case "invalid-inputs":
      return m.file_error_invalid_inputs();
    case "export":
      return m.file_error_export();
  }
}

function download(json: string, filename: string) {
  const url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function ExportInputsButton({ inputs }: { inputs: TaxInputs }) {
  const [failed, setFailed] = useState(false);
  return (
    <>
      <Button
        variant="outline-secondary"
        size="sm"
        onClick={() => {
          const file = serializeInputFile(inputs);
          setFailed(!file.ok);
          if (file.ok) download(file.json, file.filename);
        }}
      >
        <DownloadIcon aria-hidden="true" />
        {m.file_export()}
      </Button>
      <span role="status" className="sr-only">
        {failed ? errorMessage("export") : ""}
      </span>
      {failed && <Alert variant="warning">{errorMessage("export")}</Alert>}
    </>
  );
}

interface ImportProps {
  label: string;
  /** Called only with inputs that passed the strict schema. */
  onLoad: (inputs: TaxInputs) => void;
  /** Announced after a successful load. */
  successMessage: (year: number) => string;
}

export function ImportInputsButton({ label, onLoad, successMessage }: ImportProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusId = useId();
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    // Allow choosing the same file again later.
    event.target.value = "";
    if (!file) return;
    if (file.size > INPUT_FILE_MAX_BYTES) {
      setStatus({ ok: false, text: errorMessage("too-large") });
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setStatus({ ok: false, text: errorMessage("not-json") });
      return;
    }
    const result = parseInputFile(text);
    if (!result.ok) {
      setStatus({ ok: false, text: errorMessage(result.error) });
      return;
    }
    onLoad(result.inputs);
    setStatus({ ok: true, text: successMessage(result.year) });
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        aria-describedby={statusId}
        onChange={handleFile}
      />
      <Button variant="outline-secondary" size="sm" onClick={() => inputRef.current?.click()}>
        <UploadIcon aria-hidden="true" />
        {label}
      </Button>
      <div id={statusId} role="status">
        {status &&
          (status.ok ? (
            <p className="text-sm text-text-muted">{status.text}</p>
          ) : (
            <Alert variant="warning">{status.text}</Alert>
          ))}
      </div>
    </>
  );
}
