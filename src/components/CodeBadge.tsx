import * as m from "../paraglide/messages.js";

interface Props {
  /** BE: the Tax-on-web / myminfin.be box code (e.g. "1257"). NL: the aangifte field name (e.g. "Deel niet in NL belast"). */
  code: string;
  /** Short description of what the field means, shown alongside it in the tooltip. */
  description: string;
  /** Which return this field belongs to — picks the tooltip prefix and badge color. Defaults to "be". */
  system?: "be" | "nl";
}

/** Small inline label showing which official return field a value maps to. */
export function CodeBadge({ code, description, system = "be" }: Props) {
  const prefix = system === "nl" ? m.field_badge_title_prefix_nl() : m.code_badge_title_prefix();
  const title = `${prefix} ${code} — ${description}`;
  return (
    <span
      className={system === "nl" ? "ref-td-mono-nl-xs ms-1" : "ref-td-mono-be-xs ms-1"}
      title={title}
      aria-label={title}
    >
      [{code}]
    </span>
  );
}
