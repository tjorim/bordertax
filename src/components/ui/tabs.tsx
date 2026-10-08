import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { cn } from "@/lib/utils";

export function Tabs(props: TabsPrimitive.Root.Props) {
  return <TabsPrimitive.Root {...props} />;
}
export function TabsList({ className, ...props }: TabsPrimitive.List.Props) {
  return (
    <TabsPrimitive.List
      activateOnFocus
      className={cn("flex flex-nowrap gap-1 overflow-x-auto border-b border-border", className)}
      {...props}
    />
  );
}
export function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-t-sm border border-transparent bg-transparent px-3 py-2 text-xs font-medium whitespace-nowrap text-text-muted transition-colors hover:bg-surface-2 hover:text-text-sub data-active:border-border data-active:border-b-surface data-active:bg-surface data-active:font-semibold data-active:text-text focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring",
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
        "bt-results-panel rounded-b-md border border-t-0 border-border bg-surface p-4 shell:p-5 shadow-lg focus-visible:outline-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}
