import { Accordion as AccordionPrimitive } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export function Accordion({ className, ...props }: AccordionPrimitive.Root.Props) {
  return (
    <AccordionPrimitive.Root
      data-slot="accordion"
      className={cn(
        "tw:overflow-hidden tw:rounded-lg tw:border tw:border-border tw:bg-surface tw:shadow-lg tw:dark:shadow-2xl",
        className,
      )}
      {...props}
    />
  );
}
export function AccordionItem({ className, ...props }: AccordionPrimitive.Item.Props) {
  return (
    <AccordionPrimitive.Item
      className={cn("tw:border-t tw:border-border tw:first:border-t-0", className)}
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
    <AccordionPrimitive.Header className="tw:m-0">
      <AccordionPrimitive.Trigger
        className={cn(
          "tw:group tw:flex tw:w-full tw:items-center tw:gap-2 tw:border-s-2 tw:border-transparent tw:bg-surface tw:px-4.5 tw:py-3.5 tw:text-start tw:text-control tw:font-semibold tw:tracking-wide tw:text-text tw:transition-colors tw:data-panel-open:border-s-border-hover tw:data-panel-open:border-b tw:data-panel-open:border-b-border tw:data-panel-open:bg-surface-2 tw:focus-visible:outline-2 tw:focus-visible:-outline-offset-2 tw:focus-visible:outline-ring",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDown
          aria-hidden="true"
          className="tw:ms-auto tw:size-4 tw:shrink-0 tw:transition-transform tw:group-data-panel-open:rotate-180"
        />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}
export function AccordionContent({ className, ...props }: AccordionPrimitive.Panel.Props) {
  return (
    <AccordionPrimitive.Panel
      className={cn("tw:bg-surface tw:p-3.5 tw:shell:px-4.5 tw:shell:py-4.5", className)}
      {...props}
    />
  );
}
