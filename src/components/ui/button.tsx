import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cn } from "@/lib/utils";

export function Button({ className, ...props }: ButtonPrimitive.Props) {
  return (
    <ButtonPrimitive
      className={cn(
        "tw:inline-flex tw:items-center tw:justify-center tw:gap-2 tw:rounded-sm tw:border tw:border-border-hover tw:bg-transparent tw:px-3 tw:py-1.5 tw:text-sm tw:text-text-muted tw:transition-colors tw:hover:bg-surface-2 tw:hover:text-text tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-ring tw:disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
