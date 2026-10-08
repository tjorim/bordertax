import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
const variants = {
  warning: "tw:border-warning tw:bg-warning-dim",
  success: "tw:border-success tw:bg-success-dim",
  info: "tw:border-info tw:bg-info-dim",
  danger: "tw:border-danger tw:bg-danger-dim",
};
export function Alert({
  className,
  variant = "info",
  ...props
}: ComponentProps<"div"> & { variant?: keyof typeof variants }) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(
        "tw:mb-4 tw:rounded-sm tw:border-s-3 tw:px-3.5 tw:py-2.5 tw:text-control tw:text-text",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
