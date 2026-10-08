import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center gap-2 rounded-sm border border-transparent text-sm whitespace-nowrap transition-colors outline-none select-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*=size-])]:size-4",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline:
          "border-border-hover bg-transparent text-text-muted hover:bg-surface-2 hover:text-text aria-expanded:bg-surface-2 aria-expanded:text-text",
        "outline-primary":
          "border-brand-border bg-transparent text-hint font-semibold tracking-wide text-brand-light uppercase hover:bg-brand-dim hover:text-brand-light",
        "outline-secondary":
          "border-border-hover bg-transparent text-hint font-semibold tracking-wide text-text-sub uppercase hover:bg-surface-3 hover:text-text",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary",
        ghost:
          "text-text-muted hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground",
        destructive: "bg-destructive/10 text-danger hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "px-3 py-1.5",
        xs: "px-2 py-0.5 text-xs [&_svg:not([class*=size-])]:size-3",
        sm: "px-3 py-1 text-hint",
        lg: "px-4 py-2",
        icon: "size-8 p-0",
        "icon-xs": "size-6 p-0 [&_svg:not([class*=size-])]:size-3",
        "icon-sm": "size-7 p-0",
        "icon-lg": "size-9 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
