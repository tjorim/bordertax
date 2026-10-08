import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

const variants = {
  "outline-primary":
    "tw:border-brand-border tw:text-brand-light tw:hover:bg-brand-dim tw:hover:text-brand-light",
  "outline-secondary":
    "tw:border-border-hover tw:text-text-sub tw:hover:bg-surface-3 tw:hover:text-text",
};
export function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props & { variant?: keyof typeof variants; size?: "sm" }) {
  return (
    <ButtonPrimitive
      className={cn(
        "tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-sm tw:border tw:border-border-hover tw:bg-transparent tw:px-3 tw:py-1.5 tw:text-sm tw:text-text-muted tw:transition-colors tw:hover:bg-surface-2 tw:hover:text-text tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-ring tw:disabled:opacity-50",
        variant && "tw:text-hint tw:font-semibold tw:uppercase tw:tracking-wide",
        variant && variants[variant],
        size === "sm" && "tw:px-3 tw:py-1 tw:text-hint",
        className,
      )}
      {...props}
    />
  );
}
