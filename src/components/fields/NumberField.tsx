import type { ReactNode } from "react";
import { Form } from "react-bootstrap";

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
  const describedBy = hint && hintId ? hintId : undefined;

  return (
    <Form.Group controlId={id}>
      <Form.Label>{label}</Form.Label>
      <Form.Control
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
        isInvalid={!!error}
        aria-describedby={describedBy}
      />
      {hint && hintId && (
        <Form.Text id={hintId} className="text-muted">
          {hint}
        </Form.Text>
      )}
      {error && <Form.Control.Feedback type="invalid">{error}</Form.Control.Feedback>}
    </Form.Group>
  );
}

export function CurrencyField(props: Omit<NumberFieldProps, "step"> & { step?: number }) {
  return <NumberField step={props.step ?? 100} {...props} />;
}
