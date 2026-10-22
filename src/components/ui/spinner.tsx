import { cn } from "@/lib/utils";
import { LoaderCircleIcon } from "lucide-react";
import * as m from "../../paraglide/messages.js";

function Spinner({ className, ...props }: React.ComponentProps<"svg">) {
  return (
    <LoaderCircleIcon
      data-slot="spinner"
      role="status"
      aria-label={m.ui_loading()}
      className={cn("size-4 animate-spin", className)}
      {...props}
    />
  );
}

export { Spinner };
