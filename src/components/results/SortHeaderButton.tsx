import type { ReactNode } from "react";
import { ArrowDownIcon, ArrowUpIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SortHeaderButtonProps {
  sorted: false | "asc" | "desc";
  onClick: ((event: unknown) => void) | undefined;
  children: ReactNode;
}

/** Column heading that toggles sorting; keeps the table heading type and negates its own padding. */
export function SortHeaderButton({ sorted, onClick, children }: SortHeaderButtonProps) {
  return (
    <Button
      variant="ghost"
      size="xs"
      className="-mx-2 h-auto text-table-heading hover:text-text"
      onClick={onClick}
    >
      {children}
      {sorted === "asc" && <ArrowUpIcon aria-hidden="true" />}
      {sorted === "desc" && <ArrowDownIcon aria-hidden="true" />}
    </Button>
  );
}
