import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn(
        "overflow-hidden rounded-lg border border-border bg-surface shadow-lg dark:shadow-2xl",
        className,
      )}
      {...props}
    />
  );
}
export function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      className={cn("border-t border-border first:border-t-0", className)}
      {...props}
    />
  );
}
export function AccordionTrigger({
  className,
  children,
  ...props
}: AccordionPrimitive.Trigger.Props) {
  return (
    <AccordionPrimitive.Header className="m-0">
      <AccordionPrimitive.Trigger
        className={cn(
          "group flex w-full items-center gap-2 border-s-2 border-transparent bg-surface px-4.5 py-3.5 text-start text-control font-semibold tracking-wide text-text transition-colors data-panel-open:border-s-border-hover data-panel-open:border-b data-panel-open:border-b-border data-panel-open:bg-surface-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="ms-auto size-4 shrink-0 transition-transform group-data-panel-open:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}
export function AccordionContent({ className, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      className={cn("bg-surface p-3.5 shell:px-4.5 shell:py-4.5", className)}
      {...props}
    />
  );
}
