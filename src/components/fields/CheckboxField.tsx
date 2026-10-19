import type { ComponentProps, ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldLabel } from "@/components/ui/field";

/** Horizontal `Field`: checkbox followed by its label; the hint stays outside the row. */
export function CheckboxField({
  id,
  label,
  ...props
}: ComponentProps<typeof Checkbox> & { id: string; label: ReactNode }) {
  return (
    <Field orientation="horizontal">
      <Checkbox id={id} className="mt-1" {...props} />
      <FieldLabel
        htmlFor={id}
        className="text-sm font-normal normal-case tracking-normal leading-snug text-text"
      >
        {label}
      </FieldLabel>
    </Field>
  );
}
