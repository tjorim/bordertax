import * as m from "./paraglide/messages.js";

export interface ReferencePage {
  route: string;
  icon: string;
  iconColor: string;
  borderColor: string;
  accentColor: string;
  titleFn: () => string;
  descFn: () => string;
}

export const REFERENCE_PAGES: ReferencePage[] = [
  {
    route: "/reference/salary-split",
    icon: "bi-calculator-fill",
    iconColor: "var(--bt-nl-light)",
    borderColor: "var(--bt-nl-border)",
    accentColor: "var(--bt-nl-light)",
    titleFn: m.ref_overview_ss_title,
    descFn: m.ref_overview_ss_desc,
  },
  {
    route: "/reference/pension",
    icon: "bi-piggy-bank-fill",
    iconColor: "var(--bt-be-light)",
    borderColor: "var(--bt-be-border)",
    accentColor: "var(--bt-be-light)",
    titleFn: m.ref_overview_pension_title,
    descFn: m.ref_overview_pension_desc,
  },
];
