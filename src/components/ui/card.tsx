import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "tw:flex tw:min-w-0 tw:flex-col tw:rounded-lg tw:border tw:border-border tw:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}
export function CardHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn(
        "tw:rounded-t-lg tw:border-b tw:border-border tw:bg-surface-3 tw:px-4 tw:py-2",
        className,
      )}
      {...props}
    />
  );
}
export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="card-content" className={cn("tw:flex-auto tw:p-4", className)} {...props} />
  );
}
export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2
      data-slot="card-title"
      className={cn("tw:mb-2 tw:text-xl tw:font-medium", className)}
      {...props}
    />
  );
}
export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("tw:mb-4 tw:text-text-sub", className)}
      {...props}
    />
  );
}
