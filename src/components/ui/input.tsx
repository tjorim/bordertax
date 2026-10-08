import type { ComponentProps } from "react";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { cn } from "@/lib/utils";
export const inputClasses =
  "tw:block tw:w-full tw:rounded-sm tw:border tw:border-border-hover tw:bg-surface-2 tw:px-3 tw:py-1.75 tw:font-mono tw:text-form-input tw:leading-snug tw:text-text tw:transition-colors tw:focus:bg-surface-3 tw:focus:border-ring tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-ring tw:aria-invalid:border-danger tw:disabled:opacity-50";
export function Input({ className, ...props }: ComponentProps<"input">) {
  return <InputPrimitive data-slot="input" className={cn(inputClasses, className)} {...props} />;
}
