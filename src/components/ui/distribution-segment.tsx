import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** SVG width is data, avoiding inline CSS for proportional chart segments. */
export function DistributionSegment({
  percent,
  title,
  children,
  className,
  ...props
}: Omit<ComponentProps<"svg">, "children"> & {
  percent: number;
  title?: string;
  children?: ReactNode;
}) {
  return (
    <svg
      width={`${Math.max(0, Math.min(100, percent))}%`}
      height="100%"
      aria-hidden="true"
      className={cn("tw:block tw:shrink-0 tw:overflow-hidden", className)}
      {...props}
    >
      {title && <title>{title}</title>}
      {children && (
        <foreignObject width="100%" height="100%">
          <div className="tw:flex tw:h-full tw:items-center tw:justify-center">{children}</div>
        </foreignObject>
      )}
    </svg>
  );
}
