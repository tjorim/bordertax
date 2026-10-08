import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";
export function Card({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "flex min-w-0 flex-col rounded-lg border border-border bg-surface-2",
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
      className={cn("rounded-t-lg border-b border-border bg-surface-3 px-4 py-2", className)}
      {...props}
    />
  );
}
export function CardContent({ className, ...props }: ComponentProps<"div">) {
  return <div data-slot="card-content" className={cn("flex-auto p-4", className)} {...props} />;
}
export function CardTitle({ className, ...props }: ComponentProps<"h2">) {
  return (
    <h2 data-slot="card-title" className={cn("mb-2 text-xl font-medium", className)} {...props} />
  );
}
export function CardDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p data-slot="card-description" className={cn("mb-4 text-text-sub", className)} {...props} />
  );
}
