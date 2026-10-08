import { Menu } from "@base-ui/react/menu";
import { cn } from "@/lib/utils";
export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export function DropdownMenuContent({ className, ...props }: Menu.Popup.Props) {
  return (
    <Menu.Portal>
      <Menu.Positioner sideOffset={4} className="z-50">
        <Menu.Popup
          className={cn(
            "min-w-48 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg outline-none",
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
        "flex items-center gap-2 rounded-sm px-3 py-2 text-sm text-text no-underline outline-none data-highlighted:bg-accent",
        className,
      )}
      {...props}
    />
  );
}
