import { Input } from "@/components/ui/input";
import { FieldLabel, FieldHint } from "@/components/ui/field";
import type { ReactNode } from "react";

export function fieldError(errors: unknown[] | undefined): string | undefined {
  if (!errors?.length) return undefined;
  const msgs = errors.flatMap((e) => {
    if (Array.isArray(e)) return e.map((i) => String((i as { message?: unknown })?.message ?? i));
    if (e && typeof e === "object" && "message" in e) {
      return [String((e as { message: unknown }).message)];
    }
    return [String(e)];
  });
  return msgs.filter(Boolean).join(" ") || undefined;
}

interface NumberFieldProps {
  id: string;
  label: ReactNode;
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  onBlur?: () => void;
  min?: number;
  max?: number;
  step?: number;
  hint?: ReactNode;
  hintId?: string;
  error?: string;
}

export function NumberField({
  id,
  label,
  value,
  onChange,
  onBlur,
  min,
  max,
  step,
  hint,
  hintId,
  error,
}: NumberFieldProps) {
  const errorId = `${id}-error`;
  const describedBy = [hint && hintId, error && errorId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value ?? ""}
        onChange={(e) => {
          if (e.target.value === "") {
            onChange(undefined);
            return;
          }
          const n = (e.target as HTMLInputElement).valueAsNumber;
          onChange(Number.isNaN(n) ? undefined : n);
        }}
        onBlur={onBlur}
        aria-invalid={!!error}
        aria-describedby={describedBy}
      />
      {hint && hintId && (
        <FieldHint id={hintId} className="tw:text-text-muted">
          {hint}
        </FieldHint>
      )}
      {error && (
        <div id={errorId} className="tw:mt-1 tw:text-hint tw:text-danger">
          {error}
        </div>
      )}
    </div>
  );
}

export function CurrencyField(props: Omit<NumberFieldProps, "step"> & { step?: number }) {
  return <NumberField step={props.step ?? 100} {...props} />;
}
