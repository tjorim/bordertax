import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FieldDescription } from "@/components/ui/field";
import { cn } from "@/lib/utils";
import * as m from "@/paraglide/messages.js";

/** Hints longer than this are clamped to two lines with a "More" toggle. */
const CLAMP_LENGTH = 100;

/**
 * Field hint that keeps long text to two lines until expanded. The full text stays in the
 * DOM, so `aria-describedby` and screen readers always read all of it.
 */
export function FieldHint({ id, children }: { id: string; children: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = children.length > CLAMP_LENGTH;

  return (
    <>
      <FieldDescription id={id} className={cn(long && !expanded && "line-clamp-2")}>
        {children}
      </FieldDescription>
      {long && (
        <Button
          variant="link"
          size="xs"
          className="w-fit px-0 text-hint text-text-muted underline"
          aria-expanded={expanded}
          aria-controls={id}
          aria-describedby={id}
          onClick={() => setExpanded((value) => !value)}
        >
          {expanded ? m.hint_less() : m.hint_more()}
        </Button>
      )}
    </>
  );
}
