import * as m from "../paraglide/messages.js";

interface Props {
  code: string;
}

/** Small inline label showing the Tax-on-web / myminfin.be box code a value maps to. */
export function CodeBadge({ code }: Props) {
  const title = `${m.code_badge_title_prefix()} ${code}`;
  return (
    <span className="ref-td-mono-be-xs ms-1" title={title} aria-label={title}>
      [{code}]
    </span>
  );
}
