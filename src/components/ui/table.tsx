import * as React from "react";
import { cn } from "@/lib/utils";

/** Native table semantics, with scrolling owned by the shadcn container. */
function Table({
  className,
  bordered = false,
  responsive = false,
  hover = false,
  ...props
}: React.ComponentProps<"table"> & {
  bordered?: boolean;
  responsive?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      data-slot="table-container"
      className={cn(
        "tw:relative tw:w-full tw:overflow-x-auto",
        bordered && !responsive && "tw:rounded-sm",
        responsive && "tw:rounded-md tw:border tw:border-border tw:bg-surface",
      )}
    >
      <table
        data-slot="table"
        className={cn(
          "tw:w-full tw:border-collapse tw:caption-bottom tw:text-sm tw:leading-table tw:text-text",
          bordered && "tw:[&_td]:border-x tw:[&_th]:border-x tw:[&_tr]:border-y",
          bordered && !responsive && "tw:border tw:border-border tw:rounded-sm tw:overflow-hidden",
          hover && "tw:[&_tbody_tr:hover]:bg-on-solid/3",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("tw:bg-surface-3", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("tw:bg-surface-3 tw:font-medium", className)}
      {...props}
    />
  );
}

const rowVariants = {
  default: "",
  primary: "tw:bg-brand/9 tw:[&>:first-child]:border-s-2 tw:[&>:first-child]:border-s-brand",
  secondary: "tw:bg-surface-3",
  success: "tw:bg-success-dim",
  danger: "tw:bg-danger-dim",
  nl: "tw:[&>td]:bg-nl/10 tw:[&>td]:border-s-3 tw:[&>td]:border-s-nl tw:[&>td:last-child]:text-base tw:[&>td:last-child]:leading-table tw:[&>td:last-child]:text-nl-light",
  be: "tw:[&>td]:bg-be/10 tw:[&>td]:border-s-3 tw:[&>td]:border-s-be tw:[&>td:last-child]:text-base tw:[&>td:last-child]:leading-table tw:[&>td:last-child]:text-be-light",
};

function TableRow({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"tr"> & { variant?: keyof typeof rowVariants }) {
  return (
    <tr
      data-slot="table-row"
      data-variant={variant}
      className={cn("tw:border-b tw:border-border", rowVariants[variant], className)}
      {...props}
    />
  );
}

const cellClasses =
  "tw:border-border tw:px-2 tw:py-table-mobile tw:table:px-3 tw:table:py-table-cell tw:align-top";

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "tw:border-border tw:align-top tw:px-3 tw:py-table-cell tw:font-sans tw:text-table-heading tw:font-semibold tw:uppercase tw:tracking-table-heading tw:not-first:tracking-table-number tw:text-text-muted tw:whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        cellClasses,
        "tw:not-first:font-mono tw:not-first:text-table-number tw:not-first:tracking-table-number tw:leading-table tw:text-text",
        className,
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("tw:mt-4 tw:text-sm tw:text-text-muted", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
