import { Calculator, PiggyBank, type LucideIcon } from "lucide-react";
import * as m from "./paraglide/messages.js";

export interface ReferencePage {
  route: string;
  icon: LucideIcon;
  borderClass: string;
  accentClass: string;
  titleFn: () => string;
  descFn: () => string;
}

export const REFERENCE_PAGES: ReferencePage[] = [
  {
    route: "/reference/salary-split",
    icon: Calculator,
    borderClass: "border-nl-border",
    accentClass: "text-nl-light",
    titleFn: m.ref_overview_ss_title,
    descFn: m.ref_overview_ss_desc,
  },
  {
    route: "/reference/pension",
    icon: PiggyBank,
    borderClass: "border-be-border",
    accentClass: "text-be-light",
    titleFn: m.ref_overview_pension_title,
    descFn: m.ref_overview_pension_desc,
  },
];
