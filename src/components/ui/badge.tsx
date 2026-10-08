import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-block rounded-sm border border-solid border-transparent px-1.5 py-0.5 font-sans text-badge font-semibold leading-none tracking-badge whitespace-nowrap align-baseline",
  {
    variants: {
      variant: {
        primary: "bg-brand-dim text-brand-light border-brand-border",
        secondary: "bg-surface-4 text-text-muted",
        success: "bg-success text-on-solid",
        warning: "bg-warning text-on-warning",
        label:
          "bg-transparent border-border-hover text-text-muted font-mono text-badge-label font-normal uppercase tracking-wider align-middle",
        nl: "bg-nl-dim text-nl-light border-nl-border font-medium",
        be: "bg-be-dim text-be-light border-be-border font-medium",
        thresholdInfo: "bg-threshold-info-bg text-info border-threshold-info-border font-mono",
        thresholdWarning:
          "bg-threshold-warning-bg text-warning border-threshold-warning-border font-mono",
        thresholdPurple:
          "bg-threshold-purple-bg text-threshold-purple border-threshold-purple-border font-mono",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

/** Base UI span by default; badges are labels, not extra keyboard stops. */
function Badge({
  className,
  variant = "primary",
  render,
  ...props
}: useRender.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(badgeVariants({ variant }), className),
      },
      props,
    ),
    render,
    state: { slot: "badge", variant },
  });
}

export { Badge, badgeVariants };
