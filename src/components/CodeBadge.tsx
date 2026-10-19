import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as m from "../paraglide/messages.js";

interface Props {
  /** BE: the Tax-on-web / myminfin.be box code (e.g. "1257"). NL: the aangifte field name (e.g. "Deel niet in NL belast"). */
  code: string;
  /** Short description of what the field means, shown alongside it in the popover. */
  description: string;
  /** Which return this field belongs to — picks the popover prefix and badge color. Defaults to "be". */
  system?: "be" | "nl";
}

/**
 * Small inline label showing which official return field a value maps to.
 * Tap or hover opens the description. Not a tab stop (dozens per result panel);
 * the full text is the accessible name.
 */
export function CodeBadge({ code, description, system = "be" }: Props) {
  const prefix = system === "nl" ? m.field_badge_title_prefix_nl() : m.code_badge_title_prefix();
  const title = `${prefix} ${code} — ${description}`;
  return (
    <Popover>
      <PopoverTrigger
        openOnHover
        tabIndex={-1}
        aria-label={title}
        className={cn(
          "ms-1 cursor-help border-0 bg-transparent p-0 font-mono text-xs",
          system === "nl" ? "text-nl-light" : "text-be-light",
        )}
      >
        [{code}]
      </PopoverTrigger>
      <PopoverContent side="top" className="w-auto max-w-xs gap-1">
        <span className="font-semibold">
          {prefix} {code}
        </span>
        <span className="text-text-muted">{description}</span>
      </PopoverContent>
    </Popover>
  );
}
