import type { ComponentProps } from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { inputClasses } from "./input";

type NativeSelectProps = Omit<ComponentProps<"select">, "size"> & {
  size?: "sm" | "default";
};

function NativeSelect({ className, size = "default", ...props }: NativeSelectProps) {
  return (
    <div
      className={cn(
        "group/native-select relative w-full has-[select:disabled]:opacity-50",
        className,
      )}
      data-slot="native-select-wrapper"
      data-size={size}
    >
      <select
        data-slot="native-select"
        data-size={size}
        className={cn(
          inputClasses,
          "appearance-none pe-8 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-100 data-[size=sm]:py-1",
        )}
        {...props}
      />
      <ChevronDownIcon
        className="pointer-events-none absolute end-3 top-1/2 size-4 -translate-y-1/2 text-text-muted select-none"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  );
}

function NativeSelectOption({ className, ...props }: ComponentProps<"option">) {
  return (
    <option
      data-slot="native-select-option"
      className={cn("bg-surface-2 text-text", className)}
      {...props}
    />
  );
}

function NativeSelectOptGroup({ className, ...props }: ComponentProps<"optgroup">) {
  return (
    <optgroup
      data-slot="native-select-optgroup"
      className={cn("bg-surface-2 text-text", className)}
      {...props}
    />
  );
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption };
