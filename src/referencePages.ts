import { CalculatorIcon, type LucideIcon, PiggyBankIcon } from "lucide-react";
import { fmtPercent } from "./components/format";
import * as m from "./paraglide/messages.js";
import { REFERENCE_INCOME_YEAR } from "./tax/reference/meta";
import { TELEWORK_AGREEMENT } from "./tax/reference/salarySplit";

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
    descFn: () =>
      m.ref_overview_ss_desc({
        percent: fmtPercent(TELEWORK_AGREEMENT.maxTeleworkShare, { digits: 0 }),
        year: REFERENCE_INCOME_YEAR,
      }),
  },
  {
    route: "/reference/pension",
    icon: PiggyBankIcon,
    titleFn: m.ref_overview_pension_title,
    descFn: m.ref_overview_pension_desc,
  },
];
