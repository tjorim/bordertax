import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { inputClasses } from "./input";
import { Checkbox } from "./checkbox";

export function FieldLabel({ className, ...props }: ComponentProps<"label">) {
  return (
    <label
      className={cn(
        "tw:mb-1.5 tw:inline-block tw:text-label tw:font-semibold tw:uppercase tw:tracking-table-heading tw:text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
export function FieldHint({ className, ...props }: ComponentProps<"div">) {
  return <div className={cn("tw:mt-1 tw:text-hint tw:text-text-muted", className)} {...props} />;
}
export function NativeSelect({ className, ...props }: ComponentProps<"select">) {
  return <select className={cn(inputClasses, className)} {...props} />;
}
export function CheckboxField({
  id,
  label,
  className,
  ...props
}: ComponentProps<typeof Checkbox> & { id: string; label: ReactNode }) {
  return (
    <div className={cn("tw:flex tw:items-start tw:gap-2 tw:py-0.5", className)}>
      <Checkbox id={id} className="tw:mt-1" {...props} />
      <label htmlFor={id} className="tw:text-sm tw:text-text">
        {label}
      </label>
    </div>
  );
}
