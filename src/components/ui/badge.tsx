import { mergeProps } from "@base-ui/react/merge-props";
import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

const variants = {
  primary: "tw:bg-brand-dim tw:text-brand-light tw:border-brand-border",
  secondary: "tw:bg-surface-4 tw:text-text-muted",
  success: "tw:bg-success tw:text-on-solid",
  warning: "tw:bg-warning tw:text-on-warning",
  label:
    "tw:bg-transparent tw:border-border-hover tw:text-text-muted tw:font-mono tw:text-badge-label tw:font-normal tw:uppercase tw:tracking-wider tw:align-middle",
  nl: "tw:bg-nl-dim tw:text-nl-light tw:border-nl-border tw:font-medium",
  be: "tw:bg-be-dim tw:text-be-light tw:border-be-border tw:font-medium",
  thresholdInfo:
    "tw:bg-threshold-info-bg tw:text-info tw:border-threshold-info-border tw:font-mono",
  thresholdWarning:
    "tw:bg-threshold-warning-bg tw:text-warning tw:border-threshold-warning-border tw:font-mono",
  thresholdPurple:
    "tw:bg-threshold-purple-bg tw:text-threshold-purple tw:border-threshold-purple-border tw:font-mono",
};

/** Base UI span by default; badges are labels, not extra keyboard stops. */
function Badge({
  className,
  variant = "primary",
  render,
  ...props
}: useRender.ComponentProps<"span"> & { variant?: keyof typeof variants }) {
  return useRender({
    defaultTagName: "span",
    props: mergeProps<"span">(
      {
        className: cn(
          "tw:inline-block tw:rounded-sm tw:border tw:border-solid tw:border-transparent tw:px-1.5 tw:py-0.5 tw:font-sans tw:text-badge tw:font-semibold tw:leading-none tw:tracking-badge tw:whitespace-nowrap tw:align-baseline",
          variants[variant],
          className,
        ),
      },
      props,
    ),
    render,
    state: { slot: "badge", variant },
  });
}

export { Badge };
