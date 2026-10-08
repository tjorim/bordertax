import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      spacing: ["table-cell", "table-mobile"],
      tracking: ["table-heading", "table-number"],
    },
    classGroups: {
      "font-size": [
        {
          text: [
            "stat",
            "section-label",
            "control",
            "label",
            "hint",
            "form-input",
            "badge",
            "badge-label",
            "table-heading",
            "table-number",
            "table-reference",
            "table-reference-xs",
            "table-reference-md",
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
