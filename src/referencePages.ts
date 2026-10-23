import { CalculatorIcon, type LucideIcon, PiggyBankIcon } from "lucide-react";
import * as m from "./paraglide/messages.js";

export interface ReferencePage {
  route: string;
  icon: LucideIcon;
  titleFn: () => string;
  descFn: () => string;
}

export const REFERENCE_PAGES: ReferencePage[] = [
  {
    route: "/reference/salary-split",
    icon: CalculatorIcon,
    titleFn: m.ref_overview_ss_title,
    descFn: m.ref_overview_ss_desc,
  },
  {
    route: "/reference/pension",
    icon: PiggyBankIcon,
    titleFn: m.ref_overview_pension_title,
    descFn: m.ref_overview_pension_desc,
  },
];
