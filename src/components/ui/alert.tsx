import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
const alertVariants = cva("mb-4 rounded-sm border-s-3 px-3.5 py-2.5 text-control text-text", {
  variants: {
    variant: {
      warning: "border-warning bg-warning-dim",
      success: "border-success bg-success-dim",
      info: "border-info bg-info-dim",
      danger: "border-danger bg-danger-dim",
    },
  },
  defaultVariants: { variant: "info" },
});
export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      data-slot="alert"
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      {...props}
    />
  );
}

export { alertVariants };
