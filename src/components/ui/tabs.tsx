import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export function Tabs(props: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root {...props} />;
}
export function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      activateOnFocus
      className={cn(
        "tw:flex tw:flex-nowrap tw:gap-1 tw:overflow-x-auto tw:border-b tw:border-border",
        className,
      )}
      {...props}
    />
  );
}
export function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "tw:flex tw:shrink-0 tw:items-center tw:gap-1 tw:rounded-t-sm tw:border tw:border-transparent tw:bg-transparent tw:px-3 tw:py-2 tw:text-xs tw:font-medium tw:whitespace-nowrap tw:text-text-muted tw:transition-colors tw:hover:bg-surface-2 tw:hover:text-text-sub tw:data-active:border-border tw:data-active:border-b-surface tw:data-active:bg-surface tw:data-active:font-semibold tw:data-active:text-text tw:focus-visible:outline-2 tw:focus-visible:-outline-offset-2 tw:focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
export function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      keepMounted
      className={cn(
        "bt-results-panel tw:rounded-b-md tw:border tw:border-t-0 tw:border-border tw:bg-surface tw:p-4 tw:shell:p-5 tw:shadow-lg tw:focus-visible:outline-2 tw:focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
