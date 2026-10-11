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
      // Scrollable regions must be keyboard-focusable.
      tabIndex={0}
      className={cn(
        "relative w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-ring",
        bordered && !responsive && "rounded-sm",
        responsive && "rounded-md border border-border bg-surface",
      )}
    >
      <table
        data-slot="table"
        className={cn(
          "w-full border-collapse caption-bottom text-sm leading-table text-text",
          bordered && "[&_td]:border-x [&_th]:border-x [&_tr]:border-y",
          bordered && !responsive && "border border-border rounded-sm overflow-hidden",
          hover && "[&_tbody_tr:hover]:bg-on-solid/3",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return <thead data-slot="table-header" className={cn("bg-surface-3", className)} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={className} {...props} />;
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-surface-3 font-medium", className)}
      {...props}
    />
  );
}

const rowVariants = {
  default: "",
  primary: "bg-brand/9 [&>:first-child]:border-s-2 [&>:first-child]:border-s-brand",
  secondary: "bg-surface-3",
  success: "bg-success-dim",
  danger: "bg-danger-dim",
  nl: "[&>td]:bg-nl/10 [&>td]:border-s-3 [&>td]:border-s-nl [&>td:last-child]:text-base [&>td:last-child]:leading-table [&>td:last-child]:text-nl-light",
  be: "[&>td]:bg-be/10 [&>td]:border-s-3 [&>td]:border-s-be [&>td:last-child]:text-base [&>td:last-child]:leading-table [&>td:last-child]:text-be-light",
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
      className={cn("border-b border-border", rowVariants[variant], className)}
      {...props}
    />
  );
}

const cellClasses = "border-border px-2 py-table-mobile table:px-3 table:py-table-cell align-top";

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "border-border align-top px-3 py-table-cell font-sans text-table-heading font-semibold uppercase tracking-table-heading not-first:tracking-table-number text-text-muted whitespace-nowrap",
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
        "not-first:font-mono not-first:text-table-number not-first:tracking-table-number leading-table text-text",
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
      className={cn("mt-4 text-sm text-text-muted", className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableFooter, TableHead, TableRow, TableCell, TableCaption };
