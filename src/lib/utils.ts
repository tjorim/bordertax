import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

const twMerge = extendTailwindMerge({
  prefix: "tw",
  extend: {
    theme: {
      spacing: ["table-cell", "table-mobile"],
      tracking: ["table-heading", "table-number"],
    },
    classGroups: {
      "font-size": [
        {
          text: [
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
