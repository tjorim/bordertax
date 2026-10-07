import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";
export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export function DropdownMenuContent({ className, ...props }: Menu.Popup.Props) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={4} className="tw:z-50">
        <Menu.Popup
          className={cn(
            "tw:min-w-48 tw:rounded-md tw:border tw:border-border tw:bg-popover tw:p-1 tw:text-popover-foreground tw:shadow-lg tw:outline-none",
            className,
          )}
          {...props}
        />
      </Menu.Positioner>
    </Menu.Portal>
  );
}
export function DropdownMenuItem({ className, ...props }: Menu.Item.Props) {
  return (
    <Menu.Item
      className={cn(
        "tw:flex tw:items-center tw:gap-2 tw:rounded-sm tw:px-3 tw:py-2 tw:text-sm tw:text-text tw:no-underline tw:outline-none tw:data-highlighted:bg-accent",
        className,
      )}
      {...props}
    />
  );
}
