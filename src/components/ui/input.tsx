import type { ComponentProps } from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";
export const inputClasses =
  "block w-full rounded-sm border border-border-hover bg-surface-2 px-3 py-1.75 font-mono text-form-input leading-snug text-text transition-colors focus:bg-surface-3 focus:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring aria-invalid:border-danger disabled:opacity-50";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <InputPrimitive data-slot="input" className={cn(inputClasses, className)} {...props} />;
}
